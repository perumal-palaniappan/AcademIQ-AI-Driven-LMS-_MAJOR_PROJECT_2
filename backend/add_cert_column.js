const pool = require('./db');

const migrate = async () => {
    try {
        console.log('Migrating database: Adding certification_file column...');
        await pool.query(`
            ALTER TABLE courses 
            ADD COLUMN IF NOT EXISTS certification_file VARCHAR(255);
        `);
        console.log('Migration successful.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
};

migrate();
