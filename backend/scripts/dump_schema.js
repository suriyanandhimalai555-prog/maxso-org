require('dotenv').config({ path: '../.env' });
const db = require('../db');
const fs = require('fs');

async function dumpSchema() {
    try {
        const q = "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public'";
        const res = await db.query(q);
        const schema = {};
        for (let row of res.rows) {
            if (!schema[row.table_name]) schema[row.table_name] = [];
            schema[row.table_name].push({ column: row.column_name, type: row.data_type });
        }

        fs.writeFileSync('schema_dump.json', JSON.stringify(schema, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
dumpSchema();
