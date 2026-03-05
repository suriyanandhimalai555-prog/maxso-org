require('dotenv').config();
const db = require('../db');

const createLevelConfigTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS "LevelConfig" (
      id SERIAL PRIMARY KEY,
      level INTEGER NOT NULL UNIQUE,
      percentage DECIMAL(5,2) NOT NULL,
      required_volume DECIMAL(15,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    try {
        await db.query(query);
        console.log('✅ LevelConfig table created successfully.');
    } catch (error) {
        console.error('❌ Error creating LevelConfig table:', error);
    } finally {
        process.exit();
    }
};

createLevelConfigTable();
