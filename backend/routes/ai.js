const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Note: Using native fetch (available in Node 18+) to interact with Cohere API
const COHERE_MODEL = 'command-a-03-2025';

router.post('/generate-notes', authMiddleware, async (req, res) => {
    try {
        const { topic, filterType } = req.body;
        const userId = req.user.id;
        const apiKey = process.env.COHERE_API_KEY;

        console.log('AI Generation Request:', { topic, filterType, hasKey: !!apiKey });

        if (!topic || !filterType) {
            return res.status(400).json({ error: 'Topic and filter type are required' });
        }

        if (!apiKey) {
            console.error('COHERE_API_KEY is missing in process.env');
            return res.status(500).json({ error: 'AI Service (Cohere) is not configured. Please add COHERE_API_KEY to .env and restart server.' });
        }

        let prompt = '';
        if (filterType === 'Short') {
            prompt = `Generate quick summaries, bullet points, and key highlights for the topic: "${topic}". Keep it concise for fast revision.`;
        } else if (filterType === 'Medium') {
            prompt = `Generate balanced notes with context for the topic: "${topic}". Provide clear explanations without being overly verbose. Perfect for regular study.`;
        } else if (filterType === 'Detailed') {
            prompt = `Generate in-depth notes, examples, and detailed elaboration for the topic: "${topic}". Perfect for deep learning or research.`;
        }

        // Cohere Chat v2 API call
        const response = await fetch('https://api.cohere.com/v2/chat', {
            method: 'POST',
            headers: {
                'Authorization': `bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({
                model: COHERE_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        const data = await response.json();
        console.log('Cohere Raw Data:', JSON.stringify(data, null, 2));

        if (response.status !== 200) {
            console.error('Cohere API Error Status:', response.status);
            return res.status(response.status).json({ error: data.message || 'Failed to generate notes from Cohere AI' });
        }

        // v2 response structure: data.message.content[0].text
        let aiResponse = null;
        if (data.message && data.message.content && Array.isArray(data.message.content)) {
            // Find the first content part that has text
            const textPart = data.message.content.find(part => part.type === 'text');
            if (textPart && textPart.text) {
                aiResponse = textPart.text;
            } else if (data.message.content[0] && data.message.content[0].text) {
                // Fallback to first part text if type isn't 'text' or missing
                aiResponse = data.message.content[0].text;
            }
        }

        if (!aiResponse) {
            console.error('FAILED to extract text from Cohere response:', JSON.stringify(data, null, 2));
            return res.status(500).json({ error: 'AI returned an empty or unexpected response structure.' });
        }

        console.log('Extracted AI Response (First 100 chars):', aiResponse.substring(0, 100));

        // Save to history (input: topic, filter, response)
        await pool.query(
            `INSERT INTO ai_notes_history (user_id, topic, filter_type, response) 
             VALUES ($1, $2, $3, $4)`,
            [userId, topic, filterType, aiResponse]
        );

        res.json({ response: aiResponse });
    } catch (err) {
        console.error('CRITICAL: Error in /generate-notes:', err);
        res.status(500).json({ error: `Internal server error: ${err.message}` });
    }
});

// GET /api/ai/history - Get user's AI notes history
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT * FROM ai_notes_history WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching AI notes history:', err);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// DELETE /api/ai/history/:id - Delete a specific history item
router.delete('/history/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            'DELETE FROM ai_notes_history WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'History item not found' });
        }

        res.json({ message: 'History item deleted successfully' });
    } catch (err) {
        console.error('Error deleting history item:', err);
        res.status(500).json({ error: 'Failed to delete history item' });
    }
});

// DELETE /api/ai/history/clear-all - Clear all history for the user
router.delete('/history/clear-all', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        await pool.query('DELETE FROM ai_notes_history WHERE user_id = $1', [userId]);
        res.json({ message: 'All history cleared successfully' });
    } catch (err) {
        console.error('Error clearing history:', err);
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

module.exports = router;

