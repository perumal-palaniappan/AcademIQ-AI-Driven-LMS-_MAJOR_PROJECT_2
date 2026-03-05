const pool = require('./db');

async function fix() {
    try {
        const users = await pool.query("SELECT id FROM users WHERE role = 'instructor' LIMIT 1");
        let uid;
        if (users.rows.length > 0) {
            uid = users.rows[0].id;
        } else {
            const anyUser = await pool.query("SELECT id FROM users LIMIT 1");
            if (anyUser.rows.length > 0) {
                uid = anyUser.rows[0].id;
            }
        }

        if (uid) {
            const res = await pool.query('UPDATE courses SET instructor_id = $1 WHERE instructor_id IS NULL', [uid]);
            console.log(`Updated ${res.rowCount} courses with instructor_id: ${uid}`);
        } else {
            console.log('No users found to assign as instructor.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

fix();
