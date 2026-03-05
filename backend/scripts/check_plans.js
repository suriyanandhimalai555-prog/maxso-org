require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    try {
        const r4 = await pool.query('SELECT id, name, duration, duration_unit FROM "Plan" ORDER BY id');
        r4.rows.forEach(p => console.log(`Plan ${p.id}: ${p.name} (${p.duration} ${p.duration_unit})`));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        pool.end();
    }
}
check();
