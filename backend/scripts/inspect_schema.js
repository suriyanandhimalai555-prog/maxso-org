require('dotenv').config({ path: '../.env' });
const db = require('../db');

async function inspectSchema() {
    try {
        const res1 = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Plan'");
        console.log('--- Plan Table ---');
        console.log(res1.rows);

        const res2 = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'UserPlan'");
        console.log('\\n--- UserPlan Table ---');
        console.log(res2.rows);

        const res3 = await db.query("SELECT * FROM \"Plan\" LIMIT 2");
        console.log('\\n--- Plan Data Sample ---');
        console.log(res3.rows);

        const res4 = await db.query("SELECT * FROM \"UserPlan\" LIMIT 2");
        console.log('\\n--- UserPlan Data Sample ---');
        console.log(res4.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
inspectSchema();
