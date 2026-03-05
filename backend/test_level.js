require('dotenv').config();
const db = require('./db');
async function seed() {
    try {
        const q = 'INSERT INTO "LevelConfig" (level, percentage, required_volume, status) VALUES (1, 5.0, 100, \'active\'), (2, 2.0, 500, \'active\')';
        await db.query(q);
        console.log('Seeded');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
seed();
