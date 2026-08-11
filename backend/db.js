const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    connectionTimeoutMillis: 5000,
    // RDS requires SSL by default; set DB_SSL=false only for a local non-SSL database.
    ssl: process.env.DB_SSL !== 'false'
        ? { rejectUnauthorized: false }
        : false,
});

pool.verifyConnection = async () => {
    await pool.query('SELECT 1');
};

module.exports = pool;
