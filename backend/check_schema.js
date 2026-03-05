const pool = require('./db');

const checkSchema = async () => {
    try {
        const tables = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
        console.log('Tables:', tables.rows.map(r => r.table_name));

        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'courses'
            ORDER BY ordinal_position;
        `);
        console.log('Columns in courses table:', res.rows);

        const fkRes = await pool.query(`
            SELECT
                tc.table_name, kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
            WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='courses';
        `);
        console.log('Foreign keys in courses table:', fkRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
};

checkSchema();
