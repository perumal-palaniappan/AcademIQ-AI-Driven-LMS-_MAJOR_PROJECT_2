const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const COHERE_MODEL = 'command-a-03-2025'; // Use the same model as ai.js for consistency

router.post('/generate', authMiddleware, async (req, res) => {
    try {
        const { topic, difficulty, cardCount } = req.body;
        const userId = req.user.id;
        const apiKey = process.env.COHERE_API_KEY;

        console.log('Flashcards Generation Request:', { topic, difficulty, cardCount, userId });

        if (!topic || !difficulty || !cardCount) {
            return res.status(400).json({ error: 'Topic, difficulty, and card count are required' });
        }

        if (!apiKey) {
            console.error('COHERE_API_KEY is missing');
            return res.status(500).json({ error: 'AI Service is not configured.' });
        }

        const prompt = `Generate precisely ${cardCount} flashcards for the topic: "${topic}" at a ${difficulty} difficulty level. 
        Focus on key concepts, definitions, and important facts.
        Format the response strictly as a JSON array of objects, each with "question" and "answer" fields.
        No other text or explanations outside the JSON array.
        Example: [{"question": "What is X?", "answer": "X is Y."}]`;

        console.log('Calling Cohere API...');
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
        console.log('Cohere API Response Received');

        if (response.status !== 200) {
            console.error('Cohere API Error:', data);
            return res.status(response.status).json({ error: data.message || 'Failed to generate flashcards from AI' });
        }

        let aiText = '';
        if (data.message && data.message.content && Array.isArray(data.message.content)) {
            const textPart = data.message.content.find(part => part.type === 'text');
            if (textPart && textPart.text) {
                aiText = textPart.text;
            } else if (data.message.content[0] && data.message.content[0].text) {
                aiText = data.message.content[0].text;
            }
        }

        if (!aiText) {
            console.error('No text in AI response');
            return res.status(500).json({ error: 'AI returned an empty response' });
        }

        console.log('Cleaning and Parsing AI Response...');
        // Clean JSON response (remove markdown code blocks if present)
        let cleanedJson = aiText.trim();
        if (cleanedJson.startsWith('```')) {
            cleanedJson = cleanedJson.replace(/^```(json)?/, '').replace(/```$/, '').trim();
        }

        let cards = [];
        try {
            const parsed = JSON.parse(cleanedJson);
            cards = Array.isArray(parsed) ? parsed : (parsed.flashcards || []);
            console.log(`Successfully parsed ${cards.length} cards`);
        } catch (e) {
            console.error('Failed to parse AI JSON:', cleanedJson);
            return res.status(500).json({ error: 'AI returned invalid JSON format. Please try again.' });
        }

        if (cards.length === 0) {
            return res.status(500).json({ error: 'No flashcards were generated. Please try a different topic.' });
        }

        // Save to database
        console.log('Saving to Database...');
        try {
            const deckResult = await pool.query(
                `INSERT INTO flashcard_decks (user_id, topic, difficulty, card_count) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [userId, topic, difficulty, cards.length]
            );

            const deckId = deckResult.rows[0].id;

            // Batch insert would be better but keeping it simple for now
            for (const card of cards) {
                await pool.query(
                    `INSERT INTO flashcards (deck_id, question, answer) VALUES ($1, $2, $3)`,
                    [deckId, card.question, card.answer]
                );
            }

            console.log('Successfully saved deck and cards');
            res.json({ deckId, topic, difficulty, cards });
        } catch (dbErr) {
            console.error('Database Error:', dbErr);
            res.status(500).json({ error: 'Failed to save flashcards to history' });
        }
    } catch (err) {
        console.error('CRITICAL Error in /generate-flashcards:', err);
        res.status(500).json({ error: `Internal server error: ${err.message}` });
    }
});

router.get('/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT d.*, 
             (SELECT json_agg(f.*) FROM flashcards f WHERE f.deck_id = d.id) as cards
             FROM flashcard_decks d 
             WHERE d.user_id = $1 
             ORDER BY d.created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching history:', err);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

router.delete('/deck/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            'DELETE FROM flashcard_decks WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Deck not found' });
        }

        res.json({ message: 'Deck deleted successfully' });
    } catch (err) {
        console.error('Error deleting deck:', err);
        res.status(500).json({ error: 'Failed to delete deck' });
    }
});

module.exports = router;
