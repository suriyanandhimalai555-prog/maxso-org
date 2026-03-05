/**
 * fix_transactions.js
 * 
 * Fixes the Transaction table:
 * 1. Adds transaction_hash and description columns if missing
 * 2. Re-seeds deposits from deposit_list.xlsx with correct reference_user_id, transaction_hash, plan name
 * 3. Re-seeds ROI income from roi maxso.xlsx Sheet3 with correct reference_user_id
 * 
 * Usage: node scripts/fix_transactions.js
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

function parseAmount(str) {
    if (typeof str === 'number') return str;
    return parseFloat(String(str).replace(/[$,]/g, '')) || 0;
}

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

function mapTransactionType(excelType) {
    const t = String(excelType).trim().toLowerCase();
    if (t === 'daily roi income') return 'roi_income';
    if (t === 'level 1 income') return 'direct_income';
    if (t.startsWith('level ') && t.endsWith(' income')) return 'level_income';
    if (t.startsWith('direct referral income')) return 'direct_income';
    if (t === 'deposit') return 'deposit';
    if (t === 'withdraw approved') return 'withdraw';
    if (t === 'wallet created') return null;
    return null;
}

async function fix() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Add missing columns
        console.log('📋 Adding missing columns...');
        try {
            await client.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(100)');
            console.log('   ✅ transaction_hash column added');
        } catch (e) {
            console.log('   ℹ️ transaction_hash column already exists or error:', e.message);
        }
        try {
            await client.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS description VARCHAR(200)');
            console.log('   ✅ description column added');
        } catch (e) {
            console.log('   ℹ️ description column already exists or error:', e.message);
        }

        // 2. Get user map
        const usersRes = await client.query('SELECT id, referral_code FROM "User"');
        const userCodeToId = {};
        for (const u of usersRes.rows) {
            userCodeToId[u.referral_code] = u.id;
        }
        console.log(`👤 Users in DB: ${Object.keys(userCodeToId).length}`);

        // 3. Delete existing deposits and ROI income (we'll re-insert with correct data)
        const delDep = await client.query("DELETE FROM \"Transaction\" WHERE type = 'deposit'");
        console.log(`🗑️  Deleted ${delDep.rowCount} old deposits`);

        const delRoi = await client.query("DELETE FROM \"Transaction\" WHERE type = 'roi_income'");
        console.log(`🗑️  Deleted ${delRoi.rowCount} old ROI income transactions`);

        // 4. Re-seed deposits from deposit_list.xlsx with ALL fields
        console.log('\n💰 Re-seeding Deposits...');
        const depWb = XLSX.readFile(path.join(EXCEL_DIR, 'deposit_list.xlsx'));
        const depRows = XLSX.utils.sheet_to_json(depWb.Sheets[depWb.SheetNames[0]], { defval: '' });
        let depCount = 0;

        for (const row of depRows) {
            const fromCode = String(row['From User']).trim();
            const toCode = String(row['To User']).trim();
            const txHash = String(row['Transaction Hash']).trim();
            const planName = String(row['Plan Name']).trim();
            const amount = parseAmount(row['Amount']);
            const createdAt = parseDate(row['Created At']);

            const userId = userCodeToId[fromCode];
            const refUserId = userCodeToId[toCode];

            if (!userId) {
                console.log(`   ⚠️ Skipping deposit - from user ${fromCode} not found`);
                continue;
            }

            await client.query(
                `INSERT INTO "Transaction" (user_id, type, amount, status, reference_user_id, transaction_hash, description, created_at)
                 VALUES ($1, 'deposit', $2, 'completed', $3, $4, $5, $6)`,
                [userId, amount, refUserId || null, txHash || null, planName || null, createdAt]
            );
            depCount++;
        }
        console.log(`   ✅ Imported ${depCount} deposits with proper From/To and transaction hash`);

        // 5. Re-seed ROI income from roi maxso.xlsx Sheet3 with correct reference_user_id
        console.log('\n📈 Re-seeding ROI Income...');
        const roiWb = XLSX.readFile(path.join(EXCEL_DIR, 'roi maxso.xlsx'));
        const roiRows = XLSX.utils.sheet_to_json(roiWb.Sheets['Sheet3'], { defval: '' });
        let roiCount = 0;
        let skipped = 0;

        const createdAtKey = Object.keys(roiRows[0]).find(k => k.includes('Created At')) || 'Created At';

        for (const row of roiRows) {
            const fromCode = String(row['From User']).trim();
            const toCode = String(row['To User']).trim();
            const excelType = String(row['Type']).trim();
            const amount = parseFloat(row['Amount']) || 0;
            const createdAt = parseDate(row[createdAtKey]);

            const dbType = mapTransactionType(excelType);

            // Only process roi_income here (level/direct already have correct ref)
            if (dbType !== 'roi_income') {
                continue;
            }

            // For ROI income: "To User" = earner, "From User" = source
            const userId = userCodeToId[toCode];
            const refUserId = userCodeToId[fromCode];

            if (!userId) {
                skipped++;
                continue;
            }

            await client.query(
                `INSERT INTO "Transaction" (user_id, type, amount, status, reference_user_id, description, created_at)
                 VALUES ($1, $2, $3, 'completed', $4, $5, $6)`,
                [userId, dbType, amount, refUserId || null, excelType, createdAt]
            );
            roiCount++;
        }
        console.log(`   ✅ Imported ${roiCount} ROI income transactions with correct From/To (skipped ${skipped})`);

        // 6. Reset sequence
        await client.query(`SELECT setval(pg_get_serial_sequence('"Transaction"', 'id'), COALESCE((SELECT MAX(id) FROM "Transaction"), 0) + 1, false)`);

        await client.query('COMMIT');

        // Summary
        console.log('\n' + '═'.repeat(50));
        console.log('✅ FIX COMPLETE!');
        const r1 = await client.query("SELECT type, COUNT(*) as c, COUNT(reference_user_id) as with_ref FROM \"Transaction\" GROUP BY type ORDER BY type");
        r1.rows.forEach(r => console.log(`   ${r.type}: ${r.c} total, ${r.with_ref} with reference_user`));
        console.log('═'.repeat(50));

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌ FIX FAILED:', err.message);
        console.error(err.stack);
    } finally {
        client.release();
        pool.end();
    }
}

fix();
