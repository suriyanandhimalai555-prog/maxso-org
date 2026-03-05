/**
 * seed_userplans.js
 * 
 * Seeds the UserPlan table from deposit_list.xlsx data.
 * Each deposit row has a Plan Name (e.g., "Bronze") which maps to a Plan.
 * 
 * Usage: node scripts/seed_userplans.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const dir1 = path.join(__dirname, '..', '..', 'excel-data');
const dir2 = path.join(__dirname, '..', '..', 'Excel-data');
const EXCEL_DIR = fs.existsSync(dir1) ? dir1 : dir2;

/** Parse "$1,234" or "$1234" → 1234 */
function parseAmount(str) {
    if (typeof str === 'number') return str;
    return parseFloat(String(str).replace(/[$,]/g, '')) || 0;
}

/** Parse "14/10/2025, 12:49:23 pm" → Date object */
function parseDate(str) {
    if (!str) return new Date();
    const s = String(str).trim();
    const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)?$/i);
    if (match) {
        const [, day, month, year, hourStr, min, sec, ampm] = match;
        let hour = parseInt(hourStr);
        if (ampm) {
            if (ampm.toLowerCase() === 'pm' && hour !== 12) hour += 12;
            if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
        }
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour, parseInt(min), parseInt(sec));
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
}

async function seed() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Get all plans from DB
        const plansRes = await client.query('SELECT id, name, duration, duration_unit FROM "Plan" ORDER BY id');
        const planMap = {};
        for (const plan of plansRes.rows) {
            planMap[plan.name.toLowerCase()] = plan;
        }
        console.log('📋 Plans in DB:', Object.keys(planMap).join(', '));

        // 2. Get all users from DB (by referral_code)
        const usersRes = await client.query('SELECT id, referral_code FROM "User"');
        const userCodeToId = {};
        for (const user of usersRes.rows) {
            userCodeToId[user.referral_code] = user.id;
        }
        console.log(`👤 Users in DB: ${Object.keys(userCodeToId).length}`);

        // 3. Clear existing UserPlan data
        await client.query('DELETE FROM "UserPlan"');
        console.log('🗑️  Cleared UserPlan table');

        // 4. Read deposit_list.xlsx
        const wb = XLSX.readFile(path.join(EXCEL_DIR, 'deposit_list.xlsx'));
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
        console.log(`📄 Deposit rows to process: ${rows.length}`);

        let created = 0;
        let skipped = 0;

        for (const row of rows) {
            const fromCode = String(row['From User']).trim();
            const planName = String(row['Plan Name']).trim().toLowerCase();
            const amount = parseAmount(row['Amount']);
            const createdAt = parseDate(row['Created At']);

            const userId = userCodeToId[fromCode];
            const plan = planMap[planName];

            if (!userId) {
                console.log(`   ⚠️ Skipping - user ${fromCode} not found`);
                skipped++;
                continue;
            }
            if (!plan) {
                console.log(`   ⚠️ Skipping - plan "${planName}" not found`);
                skipped++;
                continue;
            }

            // Calculate end_date based on plan duration
            const startDate = createdAt;
            const endDate = new Date(startDate);
            if (plan.duration_unit === 'months') {
                endDate.setMonth(endDate.getMonth() + plan.duration);
            } else if (plan.duration_unit === 'years') {
                endDate.setFullYear(endDate.getFullYear() + plan.duration);
            } else if (plan.duration_unit === 'days') {
                endDate.setDate(endDate.getDate() + plan.duration);
            }

            await client.query(
                `INSERT INTO "UserPlan" (user_id, plan_id, amount, deposit_type, status, start_date, end_date, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [userId, plan.id, amount, 'trust_wallet', 'active', startDate, endDate, createdAt]
            );
            created++;
        }

        // Reset sequence
        await client.query(`SELECT setval(pg_get_serial_sequence('"UserPlan"', 'id'), COALESCE((SELECT MAX(id) FROM "UserPlan"), 0) + 1, false)`);

        await client.query('COMMIT');

        console.log('\n' + '═'.repeat(50));
        console.log(`✅ UserPlan seed complete!`);
        console.log(`   Created: ${created}`);
        console.log(`   Skipped: ${skipped}`);
        console.log('═'.repeat(50));

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌ SEED FAILED:', err.message);
        console.error(err.stack);
    } finally {
        client.release();
        pool.end();
    }
}

seed();
