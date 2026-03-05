require('dotenv').config();
const db = require('../db');

const createPlanTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS "Plan" (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      roi DECIMAL(10,2) NOT NULL,
      duration INTEGER NOT NULL,
      duration_unit VARCHAR(20) NOT NULL,
      referral_bonus DECIMAL(10,2) NOT NULL,
      ceiling_limit VARCHAR(255) NOT NULL,
      min_deposit DECIMAL(15,2) NOT NULL,
      max_deposit DECIMAL(15,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await db.query(query);
    console.log('✅ Plan table created successfully.');
  } catch (error) {
    console.error('❌ Error creating Plan table:', error);
  } finally {
    process.exit();
  }
};

createPlanTable();
