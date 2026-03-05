require('dotenv').config();
const db = require('../db');

const createUserPlanTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS "UserPlan" (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES "User"(id),
      plan_id INTEGER REFERENCES "Plan"(id),
      amount DECIMAL(15,2) NOT NULL,
      deposit_type VARCHAR(20) NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_date TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    try {
        await db.query(query);
        console.log('✅ UserPlan table created successfully.');
    } catch (error) {
        console.error('❌ Error creating UserPlan table:', error);
    } finally {
        process.exit();
    }
};

createUserPlanTable();
