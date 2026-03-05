const pool = require('./db');

const setupQuizAttemptsTable = async () => {
    try {
        console.log('Setting up quiz attempts database table...');

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Create Quiz Attempts Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS quiz_attempts (
                    id SERIAL PRIMARY KEY,
                    user_id INT REFERENCES users(id) ON DELETE CASCADE,
                    quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
                    score INT NOT NULL,
                    total_questions INT NOT NULL,
                    percentage DECIMAL(5,2) NOT NULL,
                    correct_answers INT NOT NULL,
                    wrong_answers INT NOT NULL,
                    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await client.query('COMMIT');
            console.log('Quiz attempts table setup successfully.');

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Error setting up table:', err);
    } finally {
        await pool.end();
    }
};

setupQuizAttemptsTable();
