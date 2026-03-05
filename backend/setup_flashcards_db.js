const pool = require('./db');

const setupFlashcardsDB = async () => {
    try {
        // Create flashcard_decks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS flashcard_decks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                card_count INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create flashcards table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS flashcards (
                id SERIAL PRIMARY KEY,
                deck_id INTEGER REFERENCES flashcard_decks(id) ON DELETE CASCADE,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Flashcards tables created successfully');
    } catch (err) {
        console.error('Error setting up flashcards database:', err);
    } finally {
        process.exit();
    }
};

setupFlashcardsDB();
