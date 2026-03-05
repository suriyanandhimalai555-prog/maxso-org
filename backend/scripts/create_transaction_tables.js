const { Pool } = require('pg');
require('dotenv').config(); // Picks up .env from cwd (backend folder)

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function createTables() {
    try {
        console.log('Connecting to database...');

        // Add wallet_balance to User table if it doesn't exist
        await pool.query(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(15, 2) DEFAULT 0;
    `);
        console.log('✅ Added wallet_balance column to User table');

        // Create Transaction table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS "Transaction" (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES "User"(id),
        type VARCHAR(20) NOT NULL, -- 'deposit', 'withdraw', 'transfer'
        amount DECIMAL(15, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'completed',
        reference_user_id INTEGER REFERENCES "User"(id), -- For transfers (to_user or from_user depending on perspective)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Created Transaction table');

    } catch (err) {
        console.error('❌ Error creating tables:', err);
    } finally {
        pool.end();
    }
}

createTables();
