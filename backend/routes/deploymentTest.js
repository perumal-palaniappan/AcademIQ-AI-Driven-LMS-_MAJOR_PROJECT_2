const express = require('express');
const router = express.Router();
const pool = require('../db');

// Temporary deployment-test endpoint. No authentication or authorization.
router.post('/modules', async (req, res) => {
    try {
        const { course_id, name, order_index = 0 } = req.body;

        if (!Number.isInteger(Number(course_id)) || !name || !String(name).trim()) {
            return res.status(400).json({
                error: 'course_id and name are required',
                example: { course_id: 1, name: 'Introduction', order_index: 1 }
            });
        }

        const result = await pool.query(
            `INSERT INTO modules (course_id, name, order_index)
             VALUES ($1, $2, $3)
             RETURNING id, course_id, name, order_index`,
            [Number(course_id), String(name).trim(), Number(order_index)]
        );

        res.status(201).json({
            message: 'Module created successfully',
            module: result.rows[0]
        });
    } catch (error) {
        console.error('Deployment test module insert failed:', error);
        res.status(error.code === '23503' ? 400 : 500).json({
            error: error.code === '23503'
                ? 'The specified course_id does not exist'
                : 'Failed to create module',
            details: error.message
        });
    }
});

// Temporary deployment-test endpoint. No authentication or authorization.
router.get('/modules', async (req, res) => {
    try {
        const { course_id } = req.query;
        const values = [];
        let filter = '';

        if (course_id !== undefined) {
            if (!Number.isInteger(Number(course_id))) {
                return res.status(400).json({ error: 'course_id must be an integer' });
            }
            values.push(Number(course_id));
            filter = 'WHERE course_id = $1';
        }

        const result = await pool.query(
            `SELECT id, course_id, name, order_index
             FROM modules
             ${filter}
             ORDER BY id`,
            values
        );

        res.json({ count: result.rows.length, modules: result.rows });
    } catch (error) {
        console.error('Deployment test module retrieval failed:', error);
        res.status(500).json({ error: 'Failed to retrieve modules', details: error.message });
    }
});

module.exports = router;
