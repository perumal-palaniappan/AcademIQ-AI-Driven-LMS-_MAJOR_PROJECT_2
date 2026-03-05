const pool = require('./db');

const setupEnrollmentTables = async () => {
    try {
        console.log('Setting up enrollment database tables...');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Create Enrollments Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS enrollments (
                    id SERIAL PRIMARY KEY,
                    user_id INT REFERENCES users(id) ON DELETE CASCADE,
                    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
                    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed'
                    completion_percentage INT DEFAULT 0,
                    UNIQUE(user_id, course_id)
                );
            `);
            console.log('Enrollments table created.');

            // 2. Create Concept Progress Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS concept_progress (
                    id SERIAL PRIMARY KEY,
                    user_id INT REFERENCES users(id) ON DELETE CASCADE,
                    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
                    concept_id INT REFERENCES concepts(id) ON DELETE CASCADE,
                    status VARCHAR(20) DEFAULT 'completed',
                    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, concept_id)
                );
            `);
            console.log('Concept Progress table created.');

            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error setting up enrollment tables:', err);
    } finally {
        await pool.end();
    }
};

setupEnrollmentTables();
