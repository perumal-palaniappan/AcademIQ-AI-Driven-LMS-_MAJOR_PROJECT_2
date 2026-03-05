const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get instructor statistics for dashboard
router.get('/stats', async (req, res) => {
    try {
        const { instructorId } = req.query;
        if (!instructorId) {
            return res.status(400).json({ error: 'Instructor ID is required' });
        }

        const parsedInstructorId = parseInt(instructorId);

        // 1. Course Created Count
        const courseCreatedRes = await pool.query(
            'SELECT COUNT(*)::int as count FROM courses WHERE instructor_id = $1',
            [parsedInstructorId]
        );

        // 2. Course Accepted Count
        const courseAcceptedRes = await pool.query(
            "SELECT COUNT(*)::int as count FROM courses WHERE instructor_id = $1 AND status = 'accepted'",
            [parsedInstructorId]
        );

        // 3. Quiz Created Count
        const quizCreatedRes = await pool.query(
            'SELECT COUNT(*)::int as count FROM quizzes WHERE instructor_id = $1',
            [parsedInstructorId]
        );

        // 4. Quiz Accepted Count
        const quizAcceptedRes = await pool.query(
            "SELECT COUNT(*)::int as count FROM quizzes WHERE instructor_id = $1 AND status = 'accepted'",
            [parsedInstructorId]
        );

        res.json({
            courseCreated: courseCreatedRes.rows[0].count || 0,
            courseAccepted: courseAcceptedRes.rows[0].count || 0,
            quizCreated: quizCreatedRes.rows[0].count || 0,
            quizAccepted: quizAcceptedRes.rows[0].count || 0
        });

    } catch (err) {
        console.error('Error fetching instructor stats:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get recent courses created by instructor
router.get('/recent-courses', async (req, res) => {
    try {
        const { instructorId } = req.query;
        if (!instructorId) {
            return res.status(400).json({ error: 'Instructor ID is required' });
        }

        const parsedInstructorId = parseInt(instructorId);

        const coursesRes = await pool.query(
            `SELECT c.*, 
                    (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as modules_count
             FROM courses c 
             WHERE c.instructor_id = $1 
             ORDER BY c.created_at DESC`,
            [parsedInstructorId]
        );

        res.json({ courses: coursesRes.rows });
    } catch (err) {
        console.error('Error fetching recent courses:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get instructor activity (courses/quizzes created over time)
router.get('/activity', async (req, res) => {
    try {
        const { instructorId, type, range } = req.query; // type: 'courses' or 'quizzes', range: '7' or '30'
        if (!instructorId) {
            return res.status(400).json({ error: 'Instructor ID is required' });
        }

        const days = parseInt(range) || 7;
        const table = type === 'quizzes' ? 'quizzes' : 'courses';

        const activityRes = await pool.query(
            `WITH RECURSIVE days AS (
                SELECT CURRENT_DATE - (interval '1 day' * ($2 - 1)) as day
                UNION ALL
                SELECT day + interval '1 day'
                FROM days
                WHERE day < CURRENT_DATE
            )
            SELECT 
                TO_CHAR(d.day, 'DD Mon') as date,
                TO_CHAR(d.day, 'Dy') as day_name,
                COUNT(t.id)::int as count
            FROM days d
            LEFT JOIN ${table} t ON DATE(t.created_at) = d.day AND t.instructor_id = $1
            GROUP BY d.day
            ORDER BY d.day ASC`,
            [instructorId, days]
        );

        res.json(activityRes.rows);
    } catch (err) {
        console.error('Error fetching instructor activity:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
