require('dotenv').config();
const db = require('../db');
async function check() {
    const result = await db.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'User';
  `);
    console.log(result.rows);
    process.exit();
}
check();
