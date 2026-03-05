/**
 * verify_seed.js - Verify the seeded data
 */
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function verify() {
    try {
        console.log('══════════════════════════════════════════════════');
        console.log('📋 DATABASE VERIFICATION');
        console.log('══════════════════════════════════════════════════');

        // Count all tables
        const tables = [
            { name: 'User', query: 'SELECT COUNT(*) FROM "User"' },
            { name: 'LevelConfig', query: 'SELECT COUNT(*) FROM "LevelConfig"' },
            { name: 'Referral', query: 'SELECT COUNT(*) FROM "Referral"' },
            { name: 'Transaction (total)', query: 'SELECT COUNT(*) FROM "Transaction"' },
            { name: 'Transaction (deposit)', query: `SELECT COUNT(*) FROM "Transaction" WHERE type = 'deposit'` },
            { name: 'Transaction (withdraw)', query: `SELECT COUNT(*) FROM "Transaction" WHERE type = 'withdraw'` },
            { name: 'Transaction (roi_income)', query: `SELECT COUNT(*) FROM "Transaction" WHERE type = 'roi_income'` },
            { name: 'Transaction (direct_income)', query: `SELECT COUNT(*) FROM "Transaction" WHERE type = 'direct_income'` },
            { name: 'Transaction (level_income)', query: `SELECT COUNT(*) FROM "Transaction" WHERE type = 'level_income'` },
        ];

        for (const t of tables) {
            const res = await pool.query(t.query);
            console.log(`   ${t.name.padEnd(30)} ${res.rows[0].count}`);
        }

        // Show admin user
        console.log('\n📌 Admin User:');
        const admin = await pool.query(`SELECT id, name, email, referral_code, role, wallet_balance FROM "User" WHERE role = 'admin'`);
        if (admin.rows.length > 0) {
            const a = admin.rows[0];
            console.log(`   ID: ${a.id}, Name: ${a.name}, Code: ${a.referral_code}, Balance: $${a.wallet_balance}`);
        }

        // Show level configs
        console.log('\n📊 Level Configs:');
        const levels = await pool.query('SELECT level, percentage, required_volume, status FROM "LevelConfig" ORDER BY level');
        levels.rows.forEach(l => {
            console.log(`   Level ${l.level}: ${l.percentage}% | Volume: $${l.required_volume} | Status: ${l.status}`);
        });

        // Show top 5 users by balance
        console.log('\n💰 Top 5 Users by Balance:');
        const topUsers = await pool.query('SELECT name, referral_code, wallet_balance FROM "User" ORDER BY wallet_balance DESC LIMIT 5');
        topUsers.rows.forEach(u => {
            console.log(`   ${u.name} (${u.referral_code}): $${parseFloat(u.wallet_balance).toFixed(2)}`);
        });

        console.log('\n══════════════════════════════════════════════════');
        console.log('✅ Verification complete!');
        console.log('══════════════════════════════════════════════════');

    } catch (err) {
        console.error('❌ Verification failed:', err.message);
    } finally {
        pool.end();
    }
}

verify();
