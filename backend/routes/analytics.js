const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/analytics/user-growth
router.get('/user-growth', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;

        // Generate a series of dates for the last N days to ensure we have data for every day (even with 0 count)
        const query = `
            WITH date_series AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '${days - 1} days',
                    CURRENT_DATE,
                    '1 day'::interval
                )::date AS date
            )
            SELECT 
                to_char(ds.date, 'YYYY-MM-DD') as date,
                to_char(ds.date, 'DD Mon') as label,
                COUNT(u.id)::int as count
            FROM date_series ds
            LEFT JOIN users u ON date(u.created_at) = ds.date
            GROUP BY ds.date
            ORDER BY ds.date ASC
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user growth:', err);
        res.status(500).json({ error: 'Failed to fetch user growth analytics' });
    }
});

// GET /api/analytics/course-growth
router.get('/course-growth', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const status = req.query.status || 'all';

        let statusFilter = '';
        const params = [];

        if (status !== 'all') {
            statusFilter = 'AND c.status = $1';
            params.push(status);
        }

        const query = `
            WITH date_series AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '${days - 1} days',
                    CURRENT_DATE,
                    '1 day'::interval
                )::date AS date
            )
            SELECT 
                to_char(ds.date, 'YYYY-MM-DD') as date,
                to_char(ds.date, 'DD Mon') as label,
                COUNT(c.id)::int as count
            FROM date_series ds
            LEFT JOIN courses c ON date(c.created_at) = ds.date ${statusFilter}
            GROUP BY ds.date
            ORDER BY ds.date ASC
        `;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching course growth:', err);
        res.status(500).json({ error: 'Failed to fetch course growth analytics' });
    }
});

module.exports = router;
