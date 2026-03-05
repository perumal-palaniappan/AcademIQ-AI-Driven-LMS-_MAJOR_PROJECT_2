const pool = require('./db');

async function setupAINotesTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ai_notes_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic TEXT NOT NULL,
                filter_type VARCHAR(50) NOT NULL,
                response TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('ai_notes_history table created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating ai_notes_history table:', error);
        process.exit(1);
    }
}

setupAINotesTable();
