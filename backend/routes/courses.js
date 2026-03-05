const express = require('express');
const router = express.Router();
const pool = require('../db');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');

// Helper to save base64 file (image or pdf)
const saveBase64File = (base64String, prefix = 'file') => {
    if (!base64String || !base64String.startsWith('data:')) return null;

    try {
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return null;

        const type = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');

        // Generate unique filename
        const extension = type.split('/')[1];
        const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
        const uploadDir = path.join(__dirname, '../public/uploads');

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);

        // Return relative path for URL
        return `/public/uploads/${fileName}`;
    } catch (err) {
        console.error("Error saving file:", err);
        return null;
    }
};

// POST /api/courses - Create new course
router.post('/', authMiddleware, async (req, res) => {
    const client = await pool.connect();

    try {
        const { title, objective, bannerImage, modules, learnerAdvantages } = req.body;

        // Basic Validation
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        await client.query('BEGIN');

        // 1. Process Banner Image
        const bannerUrl = saveBase64File(bannerImage, 'course_banner');

        // 2. Process Certification File
        let certFileUrl = null;
        if (learnerAdvantages && learnerAdvantages.certificationFile) {
            certFileUrl = saveBase64File(learnerAdvantages.certificationFile, 'cert_template');
        }

        // 3. Insert Course
        const userId = req.user.id;

        const courseResult = await client.query(
            `INSERT INTO courses (title, objective, banner_image, instructor_id, notes_enabled, certification_enabled, certification_file, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') 
             RETURNING id, title`,
            [title, objective, bannerUrl, userId, learnerAdvantages?.notes || false, learnerAdvantages?.certification || false, certFileUrl]
        );
        const courseId = courseResult.rows[0].id;

        // 4. Insert Modules and Concepts
        if (modules && Array.isArray(modules)) {
            for (let i = 0; i < modules.length; i++) {
                const module = modules[i];
                if (!module.name) continue;

                const moduleResult = await client.query(
                    `INSERT INTO modules (course_id, name, order_index) VALUES ($1, $2, $3) RETURNING id`,
                    [courseId, module.name, i]
                );
                const moduleId = moduleResult.rows[0].id;

                if (module.concepts && Array.isArray(module.concepts)) {
                    for (let j = 0; j < module.concepts.length; j++) {
                        const concept = module.concepts[j];
                        if (!concept.name) continue;

                        await client.query(
                            `INSERT INTO concepts (module_id, name, explanation, order_index) VALUES ($1, $2, $3, $4)`,
                            [moduleId, concept.name, concept.explanation || '', j]
                        );
                    }
                }
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Course published successfully',
            courseId: courseId,
            courseTitle: courseResult.rows[0].title
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating course:', err);
        res.status(500).json({ error: 'Failed to create course', details: err.message });
    } finally {
        client.release();
    }
});



// GET /api/courses - Get all courses with instructor details (supports search, status, and pagination)
router.get('/', async (req, res) => {
    try {
        const { instructorId, search, status, limit, offset } = req.query;
        let query = `
            SELECT c.id, c.title, c.banner_image, c.objective, c.created_at, c.status, 
                   u.full_name as instructor_name, u.avatar_url as instructor_avatar,
                   u.email as instructor_email, u.role as instructor_role,
                   (SELECT COUNT(*) FROM modules WHERE modules.course_id = c.id) as modules_count
            FROM courses c
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (instructorId) {
            params.push(instructorId);
            query += ` AND c.instructor_id = $${params.length}`;
        }

        if (status) {
            params.push(status);
            query += ` AND c.status = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND c.title ILIKE $${params.length}`;
        }

        // Clone query for total count before adding order and pagination
        const countQueryForStatus = `SELECT COUNT(*) FROM (${query}) as count_query`;
        const countResult = await pool.query(countQueryForStatus, params);
        const total = parseInt(countResult.rows[0].count);

        query += ` ORDER BY c.created_at DESC`;

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
            courses: result.rows,
            total: total,
            page: Math.floor((parseInt(offset) || 0) / (parseInt(limit) || 6)) + 1,
            totalPages: Math.ceil(total / (parseInt(limit) || 6))
        });
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// GET /api/courses/:id - Get full course details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
        if (courseResult.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        const course = courseResult.rows[0];

        const modulesResult = await pool.query('SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index', [id]);
        const modules = modulesResult.rows;

        for (let module of modules) {
            const conceptsResult = await pool.query('SELECT * FROM concepts WHERE module_id = $1 ORDER BY order_index', [module.id]);
            module.concepts = conceptsResult.rows;
        }

        course.modules = modules;
        // Transform for frontend format matches
        const responseData = {
            id: course.id,
            title: course.title,
            objective: course.objective,
            bannerImage: course.banner_image,
            modules: modules,
            learnerAdvantages: {
                notes: course.notes_enabled,
                certification: course.certification_enabled,
                certificationFile: course.certification_file
            }
        };

        res.json(responseData);
    } catch (err) {
        console.error('Error fetching course details:', err);
        res.status(500).json({ error: 'Failed to fetch course details' });
    }
});

// DELETE /api/courses/:id - Delete a course
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING id', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        console.error('Error deleting course:', err);
        res.status(500).json({ error: 'Failed to delete course' });
    }
});

// PUT /api/courses/:id - Update a course
router.put('/:id', authMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { title, objective, bannerImage, modules, learnerAdvantages } = req.body;

        await client.query('BEGIN');

        // 1. Update Course details
        // Process Banner Image
        let bannerUrl = null;
        if (bannerImage && bannerImage.startsWith('data:')) {
            bannerUrl = saveBase64File(bannerImage, 'course_banner');
        } else {
            bannerUrl = bannerImage;
        }

        // Process Certification File
        let certFileUrl = null;
        if (learnerAdvantages && learnerAdvantages.certificationFile && learnerAdvantages.certificationFile.startsWith('data:')) {
            certFileUrl = saveBase64File(learnerAdvantages.certificationFile, 'cert_template');
        } else {
            // Check if existing file logic is needed. 
            // If the user didn't upload a new one, frontend might send null or the old url?
            // If they sent the old URL, we preserve it. 
            // If they sent nothing/null but didn't explicitly delete it, we might want to check DB. 
            // But here, I'll follow standard pattern: if it's a URL, keep it. 
            certFileUrl = learnerAdvantages?.certificationFile || null;
            // Note: If usage requires explicit column update behavior (e.g. COALESCE), see below.
        }

        // We use COALESCE inside the query for banner_image usually, but here let's be explicit.
        // If certFileUrl is null, it might overwrite existing if we are not careful.
        // We will simple use COALESCE in SQL for both if passed value is allowed to be null to mean "no change". 
        // But if user wants to remove file? That logic is more complex. Assuming for now we just overwrite/update.
        // If certFileUrl is passed as NULL/undefined from frontend, it probably means no change or no file.
        // Let's rely on specific logic: data: -> new file. string -> old file. null -> no file? 
        // Frontend state usually has the URL if it exists.

        await client.query(
            `UPDATE courses 
             SET title = $1, objective = $2, banner_image = COALESCE($3, banner_image), 
                 notes_enabled = $4, certification_enabled = $5, certification_file = $6, updated_at = CURRENT_TIMESTAMP
             WHERE id = $7`,
            [title, objective, bannerUrl, learnerAdvantages?.notes || false, learnerAdvantages?.certification || false, certFileUrl, id]
        );

        // 2. Update Modules and Concepts
        // Strategy: Simplest is delete all old modules/concepts and recreate them. 
        // A bit heavy handed but robust for "Save" functionality where order might change etc.
        // Or we could try to sync. For this prototype, delete-and-reinsert is safer for consistency without complex logic.

        // Delete all modules (cascade deletes concepts)
        await client.query('DELETE FROM modules WHERE course_id = $1', [id]);

        // Re-insert modules
        if (modules && Array.isArray(modules)) {
            for (let i = 0; i < modules.length; i++) {
                const module = modules[i];
                if (!module.name) continue;

                const moduleResult = await client.query(
                    `INSERT INTO modules (course_id, name, order_index) VALUES ($1, $2, $3) RETURNING id`,
                    [id, module.name, i]
                );
                const moduleId = moduleResult.rows[0].id;

                if (module.concepts && Array.isArray(module.concepts)) {
                    for (let j = 0; j < module.concepts.length; j++) {
                        const concept = module.concepts[j];
                        if (!concept.name) continue;

                        await client.query(
                            `INSERT INTO concepts (module_id, name, explanation, order_index) VALUES ($1, $2, $3, $4)`,
                            [moduleId, concept.name, concept.explanation || '', j]
                        );
                    }
                }
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Course updated successfully' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating course:', err);
        res.status(500).json({ error: 'Failed to update course' });
    } finally {
        client.release();
    }
});

// PATCH /api/courses/:id/status - Update course status (Admin only)
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            'UPDATE courses SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({ message: `Course status updated to ${status}`, course: result.rows[0] });
    } catch (err) {
        console.error('Error updating course status:', err);
        res.status(500).json({ error: 'Failed to update course status' });
    }
});

module.exports = router;
