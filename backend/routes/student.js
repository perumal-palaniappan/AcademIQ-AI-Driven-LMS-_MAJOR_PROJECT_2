const express = require('express');
const router = express.Router();
const pool = require('../db');
const path = require('path');
const fs = require('fs');

// Get all student courses (filtered by status=accepted) with pagination
router.get('/courses', async (req, res) => {
    try {
        let { userId, limit, offset, filter, search } = req.query;

        limit = parseInt(limit) || 6;
        offset = parseInt(offset) || 0;
        filter = filter || 'all';
        search = (search || '').trim();

        // Ensure userId is a valid integer, otherwise default to -1 (guest)
        let parsedUserId = parseInt(userId);
        if (isNaN(parsedUserId)) {
            parsedUserId = -1;
        }

        // Base WHERE clause
        let whereClauses = ["c.status = 'accepted'"];
        let values = [parsedUserId];
        let paramCount = 1;

        // Apply filters
        // Search Filter
        if (search) {
            paramCount++;
            const searchTerm = `$${paramCount}`;
            whereClauses.push(`(
                LOWER(c.title) LIKE ${searchTerm} OR 
                LOWER(u.full_name) LIKE ${searchTerm} OR 
                LOWER(c.objective) LIKE ${searchTerm} OR
                EXISTS (
                    SELECT 1 FROM modules m 
                    LEFT JOIN concepts con ON m.id = con.module_id 
                    WHERE m.course_id = c.id AND (
                        LOWER(m.name) LIKE ${searchTerm} OR 
                        LOWER(con.name) LIKE ${searchTerm} OR 
                        LOWER(con.explanation) LIKE ${searchTerm}
                    )
                )
            )`);
            values.push(`%${search.toLowerCase()}%`);
        }

        // Status Filter
        if (filter === 'in_progress') {
            whereClauses.push("e.user_id IS NOT NULL AND e.completion_percentage < 100");
        } else if (filter === 'completed') {
            whereClauses.push("e.completion_percentage = 100");
        }

        const whereSql = whereClauses.length > 0 ? " WHERE " + whereClauses.join(" AND ") : "";

        // Final Data Query
        const dataParams = [...values];
        const limitParam = dataParams.length + 1;
        const offsetParam = dataParams.length + 2;
        dataParams.push(limit, offset);

        const finalQuery = `
            SELECT 
                c.id, 
                c.title, 
                c.objective, 
                c.banner_image, 
                c.status,
                c.created_at,
                u.full_name as instructor_name,
                (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as modules_count,
                CASE 
                    WHEN e.user_id IS NOT NULL THEN true 
                    ELSE false 
                END as is_enrolled,
                COALESCE(e.completion_percentage, 0) as progress,
                COALESCE(e.status, 'not_enrolled') as enrollment_status
            FROM courses c
            LEFT JOIN users u ON c.instructor_id = u.id
            LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = $1
            ${whereSql}
            ORDER BY c.created_at DESC 
            LIMIT $${limitParam} OFFSET $${offsetParam}
        `;

        const { rows } = await pool.query(finalQuery, dataParams);

        // Count Query
        const countQuery = `
            SELECT COUNT(*) 
            FROM courses c 
            LEFT JOIN users u ON c.instructor_id = u.id
            LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = $1 
            ${whereSql}
        `;

        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count);

        // EXTRA STATS: Enrolled and Completed counts
        const statsQuery = `
            SELECT 
                COUNT(*) as enrolled_count,
                COUNT(*) FILTER (WHERE completion_percentage = 100) as completed_count
            FROM enrollments 
            WHERE user_id = $1
        `;
        const statsResult = await pool.query(statsQuery, [parsedUserId]);
        const stats = statsResult.rows[0];

        res.json({
            courses: rows,
            total,
            enrolledCount: parseInt(stats.enrolled_count) || 0,
            completedCount: parseInt(stats.completed_count) || 0,
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(total / limit)
        });

    } catch (err) {
        console.error('Error fetching student courses:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get student enrollment/completion activity data
router.get('/activity', async (req, res) => {
    try {
        const { userId, range, type } = req.query; // range: 7 or 30, type: joined or finished
        const parsedUserId = parseInt(userId);
        const days = parseInt(range) || 7;
        const column = type === 'finished' ? 'completed_at' : 'enrolled_at';

        const query = `
            WITH RECURSIVE days AS (
                SELECT CURRENT_DATE - (INTERVAL '1 day' * ($2 - 1)) as day_date
                UNION ALL
                SELECT day_date + INTERVAL '1 day'
                FROM days
                WHERE day_date < CURRENT_DATE
            )
            SELECT 
                TO_CHAR(d.day_date, 'Mon DD') as date,
                COUNT(e.id) as count,
                TO_CHAR(d.day_date, 'Dy') as day_name
            FROM days d
            LEFT JOIN enrollments e ON DATE(e.${column}) = DATE(d.day_date) AND e.user_id = $1
            GROUP BY d.day_date
            ORDER BY d.day_date ASC;
        `;

        const { rows } = await pool.query(query, [parsedUserId, days]);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching student activity:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Enroll in a course
router.post('/enroll', async (req, res) => {
    try {
        const { userId, courseId } = req.body;

        if (!userId || !courseId) {
            return res.status(400).json({ error: 'User ID and Course ID are required' });
        }

        // Check if already enrolled
        const check = await pool.query('SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2', [userId, courseId]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Already enrolled' });
        }

        await pool.query(
            'INSERT INTO enrollments (user_id, course_id, status, completion_percentage) VALUES ($1, $2, $3, $4)',
            [userId, courseId, 'active', 0]
        );

        res.status(201).json({ message: 'Enrolled successfully' });

    } catch (err) {
        console.error('Error enrolling in course:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get enrolled course details with modules and concepts
router.get('/course/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;

        // Get basic course info
        const courseQuery = `
            SELECT c.*, u.full_name as instructor_name, COALESCE(e.completion_percentage, 0) as progress, e.status as enrollment_status
            FROM courses c
            LEFT JOIN users u ON c.instructor_id = u.id
            LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = $1
            WHERE c.id = $2
        `;
        const courseRes = await pool.query(courseQuery, [userId, id]);

        if (courseRes.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const course = courseRes.rows[0];

        // Get modules and concepts
        const modulesQuery = `
            SELECT 
                m.id as module_id, 
                m.name as module_name, 
                c.id as concept_id, 
                c.name as concept_name, 
                c.explanation,
                cp.status as concept_status
            FROM modules m
            LEFT JOIN concepts c ON m.id = c.module_id
            LEFT JOIN concept_progress cp ON c.id = cp.concept_id AND cp.user_id = $1
            WHERE m.course_id = $2
            ORDER BY m.id, c.id -- Assuming order by insertion/ID for now as order_index might not be populated
        `;

        const modulesRes = await pool.query(modulesQuery, [userId, id]);

        // Structure the data: Modules -> Concepts
        const modulesMap = new Map();

        modulesRes.rows.forEach(row => {
            if (!modulesMap.has(row.module_id)) {
                modulesMap.set(row.module_id, {
                    id: row.module_id,
                    name: row.module_name,
                    concepts: []
                });
            }
            if (row.concept_id) {
                modulesMap.get(row.module_id).concepts.push({
                    id: row.concept_id,
                    name: row.concept_name,
                    explanation: row.explanation,
                    status: row.concept_status || 'pending'
                });
            }
        });

        const modules = Array.from(modulesMap.values());

        res.json({
            ...course,
            modules
        });

    } catch (err) {
        console.error('Error fetching course details:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark concept as complete
router.post('/complete-concept', async (req, res) => {
    try {
        const { userId, courseId, conceptId } = req.body;

        if (!userId || !courseId || !conceptId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Insert into concept_progress
        const insertQuery = `
            INSERT INTO concept_progress (user_id, course_id, concept_id, status)
            VALUES ($1, $2, $3, 'completed')
            ON CONFLICT (user_id, concept_id) DO NOTHING
        `;
        await pool.query(insertQuery, [userId, courseId, conceptId]);

        // Recalculate course progress
        // 1. Get total concepts count for the course
        const totalConceptsRes = await pool.query(`
            SELECT COUNT(*) 
            FROM concepts c 
            JOIN modules m ON c.module_id = m.id 
            WHERE m.course_id = $1
        `, [courseId]);
        const totalConcepts = parseInt(totalConceptsRes.rows[0].count);

        // 2. Get completed concepts count for the user and course
        const completedConceptsRes = await pool.query(`
            SELECT COUNT(*) 
            FROM concept_progress 
            WHERE user_id = $1 AND course_id = $2 AND status = 'completed'
        `, [userId, courseId]);
        const completedConcepts = parseInt(completedConceptsRes.rows[0].count);

        // 3. Update percentage
        const percentage = totalConcepts === 0 ? 0 : Math.round((completedConcepts / totalConcepts) * 100);

        await pool.query(`
            UPDATE enrollments 
            SET completion_percentage = $3, 
                status = CASE WHEN $3 = 100 THEN 'completed' ELSE status END,
                completed_at = CASE WHEN $3 = 100 AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END
            WHERE user_id = $1 AND course_id = $2
        `, [userId, courseId, percentage]);

        res.json({
            success: true,
            progress: percentage,
            completed: percentage === 100
        });

    } catch (err) {
        console.error('Error completing concept:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Download Certificate
router.get('/download-certificate/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;

        // Check if course is completed
        const enrollmentRes = await pool.query(
            'SELECT completion_percentage FROM enrollments WHERE user_id = $1 AND course_id = $2',
            [userId, id]
        );

        if (enrollmentRes.rows.length === 0 || enrollmentRes.rows[0].completion_percentage < 100) {
            return res.status(403).json({ error: 'Course not completed yet' });
        }

        // Get certificate file path
        const courseRes = await pool.query(
            'SELECT certification_file, certification_enabled FROM courses WHERE id = $1',
            [id]
        );

        if (!courseRes.rows[0]?.certification_enabled || !courseRes.rows[0]?.certification_file) {
            return res.status(404).json({ error: 'Certificate not available for this course' });
        }

        const filePath = path.join(__dirname, '..', courseRes.rows[0].certification_file);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Certificate file not found on server' });
        }

        res.download(filePath);

    } catch (err) {
        console.error('Error downloading certificate:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Download Course Notes
router.get('/download-notes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;

        // Check if course is completed
        const enrollmentRes = await pool.query(
            'SELECT completion_percentage FROM enrollments WHERE user_id = $1 AND course_id = $2',
            [userId, id]
        );

        if (enrollmentRes.rows.length === 0 || enrollmentRes.rows[0].completion_percentage < 100) {
            return res.status(403).json({ error: 'Course not completed yet' });
        }

        // Check if notes enabled
        const courseCheck = await pool.query('SELECT notes_enabled, title FROM courses WHERE id = $1', [id]);
        if (!courseCheck.rows[0]?.notes_enabled) {
            return res.status(403).json({ error: 'Notes not enabled for this course' });
        }

        // Get all content
        const contentQuery = `
            SELECT m.name as module_name, c.name as concept_name, c.explanation
            FROM modules m
            JOIN concepts c ON m.id = c.module_id
            WHERE m.course_id = $1
            ORDER BY m.id, c.id
        `;
        const contentRes = await pool.query(contentQuery, [id]);

        let notesText = `COURSE NOTES: ${courseCheck.rows[0].title}\n`;
        notesText += `==========================================\n\n`;

        let currentModule = '';
        contentRes.rows.forEach(row => {
            if (currentModule !== row.module_name) {
                currentModule = row.module_name;
                notesText += `\nMODULE: ${currentModule.toUpperCase()}\n`;
                notesText += `------------------------------------------\n`;
            }
            notesText += `\nConcept: ${row.concept_name}\n`;
            notesText += `${row.explanation}\n`;
            notesText += `\n`;
        });

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${courseCheck.rows[0].title.replace(/\s+/g, '_')}_Notes.txt"`);
        res.send(notesText);

    } catch (err) {
        console.error('Error downloading notes:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all student quizzes (filtered by status=accepted) with pagination and attempt status
router.get('/quizzes', async (req, res) => {
    try {
        let { userId, limit, offset, filter, search } = req.query;

        limit = parseInt(limit) || 6;
        offset = parseInt(offset) || 0;
        filter = filter || 'pending';
        search = (search || '').trim();

        let parsedUserId = parseInt(userId);
        if (isNaN(parsedUserId)) parsedUserId = -1;

        // Base query
        let whereClauses = ["q.status = 'accepted'"];
        let values = [parsedUserId];
        let paramCount = 1;

        if (search) {
            paramCount++;
            const searchTerm = `$${paramCount}`;
            whereClauses.push(`(LOWER(q.title) LIKE ${searchTerm} OR LOWER(u.full_name) LIKE ${searchTerm})`);
            values.push(`%${search.toLowerCase()}%`);
        }

        // Filter: pending (not attempted), completed (attempted), or all (everything accepted)
        if (filter === 'pending') {
            whereClauses.push("qa.id IS NULL");
        } else if (filter === 'completed') {
            whereClauses.push("qa.id IS NOT NULL");
        }
        // if filter is 'all', we don't add any qa-specific condition

        const whereSql = " WHERE " + whereClauses.join(" AND ");

        const dataParams = [...values, limit, offset];
        const finalQuery = `
            SELECT 
                q.*, 
                u.full_name as instructor_name,
                (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as questions_count,
                qa.score as user_score,
                qa.percentage as user_percentage,
                CASE WHEN qa.id IS NOT NULL THEN true ELSE false END as is_completed,
                qa.attempted_at
            FROM quizzes q
            LEFT JOIN users u ON q.instructor_id = u.id
            LEFT JOIN LATERAL (
                SELECT id, score, percentage, attempted_at
                FROM quiz_attempts
                WHERE quiz_id = q.id AND user_id = $1
                ORDER BY attempted_at DESC
                LIMIT 1
            ) qa ON true
            ${whereSql}
            ORDER BY q.created_at DESC 
            LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `;

        const { rows } = await pool.query(finalQuery, dataParams);

        const countQuery = `
            SELECT COUNT(*) 
            FROM quizzes q
            LEFT JOIN users u ON q.instructor_id = u.id
            LEFT JOIN LATERAL (
                SELECT id
                FROM quiz_attempts
                WHERE quiz_id = q.id AND user_id = $1
                ORDER BY attempted_at DESC
                LIMIT 1
            ) qa ON true
            ${whereSql}
        `;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            quizzes: rows,
            total,
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(total / limit)
        });

    } catch (err) {
        console.error('Error fetching student quizzes:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get daily learning activity (Notes or Flashcards)
router.get('/learning-activity', async (req, res) => {
    try {
        const { userId, type, range } = req.query;
        const parsedUserId = parseInt(userId);
        const days = parseInt(range) || 7;

        // Determine table and date column based on type
        const table = type === 'flashcards' ? 'flashcard_decks' : 'ai_notes_history';
        const dateColumn = 'created_at';

        const query = `
            WITH RECURSIVE date_series AS (
                SELECT CURRENT_DATE - (INTERVAL '1 day' * ($2 - 1)) as day_date
                UNION ALL
                SELECT day_date + INTERVAL '1 day'
                FROM date_series
                WHERE day_date < CURRENT_DATE
            )
            SELECT 
                TO_CHAR(ds.day_date, 'DD Mon') as date,
                COUNT(a.id)::int as count,
                TO_CHAR(ds.day_date, 'Dy') as day_name
            FROM date_series ds
            LEFT JOIN ${table} a ON DATE(a.${dateColumn}) = DATE(ds.day_date) AND a.user_id = $1
            GROUP BY ds.day_date
            ORDER BY ds.day_date ASC;
        `;

        const { rows } = await pool.query(query, [parsedUserId, days]);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching learning activity:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get student statistics for dashboard
router.get('/stats', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const parsedUserId = parseInt(userId);

        // 1. Completed Courses Count
        const coursesRes = await pool.query(
            'SELECT COUNT(*) as count FROM enrollments WHERE user_id = $1 AND completion_percentage = 100',
            [parsedUserId]
        );

        // 2. AI Notes Count
        const notesRes = await pool.query(
            'SELECT COUNT(*) as count FROM ai_notes_history WHERE user_id = $1',
            [parsedUserId]
        );

        // 3. Quiz Attempts Count (Distinct quizzes completed/attempted)
        const quizRes = await pool.query(
            'SELECT COUNT(DISTINCT quiz_id) as count FROM quiz_attempts WHERE user_id = $1',
            [parsedUserId]
        );

        // 4. Flashcard Decks Count
        const flashcardsRes = await pool.query(
            'SELECT COUNT(*) as count FROM flashcard_decks WHERE user_id = $1',
            [parsedUserId]
        );

        res.json({
            completedCourses: parseInt(coursesRes.rows[0].count) || 0,
            aiNotesGenerated: parseInt(notesRes.rows[0].count) || 0,
            quizAttempts: parseInt(quizRes.rows[0].count) || 0,
            flashcardsGenerated: parseInt(flashcardsRes.rows[0].count) || 0
        });

    } catch (err) {
        console.error('Error fetching student stats:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

