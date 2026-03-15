const { Pool } = require('pg');
require('dotenv').config();

// Fix: Add SSL configuration for Supabase Pooler
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // This allows the connection to Supabase without strict CA verification
  }
});

// Simple connection test
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ DB Error:', err.message);
  else console.log('✅ Postgres Connected');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};