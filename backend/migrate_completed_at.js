const pool = require('./db');

const updateTable = async () => {
    try {
        await pool.query('ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP');
        console.log('Successfully added completed_at column to enrollments table');
    } catch (err) {
        console.error('Error adding column:', err.message);
    } finally {
        await pool.end();
    }
};

updateTable();
