const pool = require('./db');

const setupQuizzesTable = async () => {
    try {
        console.log('Setting up quizzes database tables...');

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Create Quizzes Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS quizzes (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    explanation TEXT,
                    instructor_id INT REFERENCES users(id) ON DELETE CASCADE,
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 2. Create Quiz Questions Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS quiz_questions (
                    id SERIAL PRIMARY KEY,
                    quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
                    question_text TEXT NOT NULL,
                    question_type VARCHAR(50) NOT NULL, 
                    order_index INT DEFAULT 0
                );
            `);

            // 3. Create Quiz Options Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS quiz_options (
                    id SERIAL PRIMARY KEY,
                    question_id INT REFERENCES quiz_questions(id) ON DELETE CASCADE,
                    option_text TEXT NOT NULL,
                    is_correct BOOLEAN DEFAULT FALSE
                );
            `);

            await client.query('COMMIT');
            console.log('Quiz tables setup successfully.');

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Error setting up tables:', err);
    } finally {
        await pool.end();
    }
};

setupQuizzesTable();
