const pool = require('./db');
const fs = require('fs');
const path = require('path');

const setupTables = async () => {
    try {
        console.log('Setting up course database tables...');

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Create Courses Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS courses (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    objective TEXT,
                    banner_image VARCHAR(255),
                    instructor_id INT REFERENCES users(id) ON DELETE SET NULL, 
                    notes_enabled BOOLEAN DEFAULT FALSE,
                    certification_enabled BOOLEAN DEFAULT FALSE,
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Ensure status column exists if table already existed
            await client.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name = 'courses' AND column_name = 'status'
                    ) THEN
                        ALTER TABLE courses ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
                    END IF;
                END $$;
            `);

            // Ensure foreign key exists if table already existed
            await client.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM information_schema.table_constraints 
                        WHERE constraint_name = 'courses_instructor_id_fkey' 
                        AND table_name = 'courses'
                    ) THEN
                        ALTER TABLE courses 
                        ADD CONSTRAINT courses_instructor_id_fkey 
                        FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL;
                    END IF;
                END $$;
            `);
            console.log('Courses table checked/created with foreign key.');

            // 2. Create Modules Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS modules (
                    id SERIAL PRIMARY KEY,
                    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    order_index INT DEFAULT 0
                );
            `);
            console.log('Modules table checked/created.');

            // 3. Create Concepts Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS concepts (
                    id SERIAL PRIMARY KEY,
                    module_id INT REFERENCES modules(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    explanation TEXT,
                    order_index INT DEFAULT 0
                );
            `);
            console.log('Concepts table checked/created.');

            await client.query('COMMIT');
            console.log('All tables setup successfully.');

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Error setting up tables:', err);
    } finally {
        // Close the pool after setup is done so the script exits
        await pool.end();
    }
};

setupTables();
