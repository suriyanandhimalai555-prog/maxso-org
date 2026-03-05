require('dotenv').config();
const db = require('../db');

async function migrate() {
    try {
        console.log('--- Checking User schema ---');
        await db.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);`);
        await db.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(255);`);
        await db.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS country VARCHAR(100);`);
        console.log('✅ Columns verified successfully');
        process.exit();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
