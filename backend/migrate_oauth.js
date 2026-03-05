const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const migrate = async () => {
    try {
        const client = await pool.connect();
        try {
            console.log('Starting migration...');

            // Make password optional
            await client.query('ALTER TABLE users ALTER COLUMN password DROP NOT NULL');
            console.log('Made password optional');

            // Add google_id
            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE');
            console.log('Added google_id column');

            // Add github_id
            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id VARCHAR(255) UNIQUE');
            console.log('Added github_id column');

            // Add avatar_url for profile pictures
            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT');
            console.log('Added avatar_url column');

            console.log('Migration completed successfully');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
    }
};

migrate();
