const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// POST /api/quizzes - Create new quiz
router.post('/', authMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        const { title, explanation, questions } = req.body;
        const instructor_id = req.user.id;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        await client.query('BEGIN');

        // 1. Insert Quiz
        const quizResult = await client.query(
            `INSERT INTO quizzes (title, explanation, instructor_id, status) 
             VALUES ($1, $2, $3, 'pending') 
             RETURNING id`,
            [title, explanation, instructor_id]
        );
        const quizId = quizResult.rows[0].id;

        // 2. Insert Questions and Options
        if (questions && Array.isArray(questions)) {
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const questionResult = await client.query(
                    `INSERT INTO quiz_questions (quiz_id, question_text, question_type, order_index) 
                     VALUES ($1, $2, $3, $4) 
                     RETURNING id`,
                    [quizId, q.question_text, q.question_type, i]
                );
                const questionId = questionResult.rows[0].id;

                if (q.options && Array.isArray(q.options)) {
                    for (let opt of q.options) {
                        await client.query(
                            `INSERT INTO quiz_options (question_id, option_text, is_correct) 
                             VALUES ($1, $2, $3)`,
                            [questionId, opt.option_text, opt.is_correct || false]
                        );
                    }
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Quiz created successfully', quizId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating quiz:', err);
        res.status(500).json({ error: 'Failed to create quiz' });
    } finally {
        client.release();
    }
});

// GET /api/quizzes - Get quizzes (supports search, status, and pagination)
router.get('/', async (req, res) => {
    try {
        const { instructorId, status, search, limit, offset } = req.query;
        let query = `
            SELECT q.*, u.full_name as instructor_name, u.avatar_url as instructor_avatar,
            (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as questions_count
            FROM quizzes q
            LEFT JOIN users u ON q.instructor_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (instructorId) {
            params.push(instructorId);
            query += ` AND q.instructor_id = $${params.length}`;
        }

        if (status && status !== 'all') {
            params.push(status);
            query += ` AND q.status = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND q.title ILIKE $${params.length}`;
        }

        // Clone query for total count
        const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        query += ` ORDER BY q.created_at DESC`;

        if (limit) {
            params.push(parseInt(limit));
            query += ` LIMIT $${params.length}`;
        }

        if (offset) {
            params.push(parseInt(offset));
            query += ` OFFSET $${params.length}`;
        }

        const result = await pool.query(query, params);

        res.json({
            quizzes: result.rows,
            total,
            page: Math.floor((parseInt(offset) || 0) / (parseInt(limit) || 4)) + 1,
            totalPages: Math.ceil(total / (parseInt(limit) || 4))
        });
    } catch (err) {
        console.error('Error fetching quizzes:', err);
        res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
});

// GET /api/quizzes/:id - Get full quiz details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const quizResult = await pool.query('SELECT * FROM quizzes WHERE id = $1', [id]);

        if (quizResult.rows.length === 0) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        const quiz = quizResult.rows[0];

        const questionsResult = await pool.query(
            'SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index',
            [id]
        );
        const questions = questionsResult.rows;

        for (let q of questions) {
            const optionsResult = await pool.query(
                'SELECT * FROM quiz_options WHERE question_id = $1',
                [q.id]
            );
            q.options = optionsResult.rows;
        }

        quiz.questions = questions;
        res.json(quiz);
    } catch (err) {
        console.error('Error fetching quiz details:', err);
        res.status(500).json({ error: 'Failed to fetch quiz details' });
    }
});

// PUT /api/quizzes/:id - Update quiz
router.put('/:id', authMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { title, explanation, questions } = req.body;

        await client.query('BEGIN');

        // 1. Update Quiz metadata
        await client.query(
            `UPDATE quizzes SET title = $1, explanation = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
            [title, explanation, id]
        );

        // 2. Re-insert Questions and Options (Simple strategy as used in courses)
        await client.query('DELETE FROM quiz_questions WHERE quiz_id = $1', [id]);

        if (questions && Array.isArray(questions)) {
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const questionResult = await client.query(
                    `INSERT INTO quiz_questions (quiz_id, question_text, question_type, order_index) 
                     VALUES ($1, $2, $3, $4) 
                     RETURNING id`,
                    [id, q.question_text, q.question_type, i]
                );
                const questionId = questionResult.rows[0].id;

                if (q.options && Array.isArray(q.options)) {
                    for (let opt of q.options) {
                        await client.query(
                            `INSERT INTO quiz_options (question_id, option_text, is_correct) 
                             VALUES ($1, $2, $3)`,
                            [questionId, opt.option_text, opt.is_correct || false]
                        );
                    }
                }
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Quiz updated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating quiz:', err);
        res.status(500).json({ error: 'Failed to update quiz' });
    } finally {
        client.release();
    }
});

// PATCH /api/quizzes/:id/status - Update quiz status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['accepted', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            'UPDATE quizzes SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating quiz status:', err);
        res.status(500).json({ error: 'Failed to update quiz status' });
    }
});

// DELETE /api/quizzes/:id - Delete quiz
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM quizzes WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        res.json({ message: 'Quiz deleted successfully' });
    } catch (err) {
        console.error('Error deleting quiz:', err);
        res.status(500).json({ error: 'Failed to delete quiz' });
    }
});

// POST /api/quizzes/attempts - Save quiz attempt
router.post('/attempts', authMiddleware, async (req, res) => {
    try {
        const { quiz_id, score, total_questions, correct_answers, wrong_answers } = req.body;
        const user_id = req.user.id;

        if (!quiz_id) {
            return res.status(400).json({ error: 'Quiz ID is required' });
        }

        const percentage = (score / total_questions) * 100;

        const result = await pool.query(
            `INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, percentage, correct_answers, wrong_answers) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [user_id, quiz_id, score, total_questions, percentage, correct_answers, wrong_answers]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error saving quiz attempt:', err);
        res.status(500).json({ error: 'Failed to save quiz attempt' });
    }
});

// GET /api/quizzes/attempts/:userId - Get user attempts
router.get('/attempts/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT qa.*, q.title as quiz_title 
             FROM quiz_attempts qa
             JOIN quizzes q ON qa.quiz_id = q.id
             WHERE qa.user_id = $1 
             ORDER BY qa.attempted_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching quiz attempts:', err);
        res.status(500).json({ error: 'Failed to fetch quiz attempts' });
    }
});

module.exports = router;
