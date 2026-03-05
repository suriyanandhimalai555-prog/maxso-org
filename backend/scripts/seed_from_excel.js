/**
 * seed_from_excel.js
 * 
 * Clears ALL existing data from the database and imports fresh data
 * from the Excel files in the Excel-data/ directory.
 * 
 * Usage: node scripts/seed_from_excel.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const XLSX = require('xlsx');
const bcrypt = require('bcrypt');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const EXCEL_DIR = path.join(__dirname, '..', '..', 'Excel-data');

// Default password for all imported users
const DEFAULT_PASSWORD = 'Maxso@123';
const ADMIN_CODE = 'MAX29427';

// ─── Helpers ────────────────────────────────────────────────────────

function readSheet(filename, sheetName) {
    const wb = XLSX.readFile(path.join(EXCEL_DIR, filename));
    const sheet = sheetName ? wb.Sheets[sheetName] : wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

/** Parse "Name (MAX12345)" → "MAX12345" */
function extractCode(str) {
    const match = String(str).match(/\(?(MAX\d{5})\)?/);
    return match ? match[1] : str;
}

/** Parse "$1,234" or "$1234" → 1234 */
function parseAmount(str) {
    if (typeof str === 'number') return str;
    return parseFloat(String(str).replace(/[$,]/g, '')) || 0;
}

/** Parse "14/10/2025, 12:49:23 pm" → Date object */
function parseDate(str) {
    if (!str) return new Date();
    const s = String(str).trim();

    // Try DD/MM/YYYY, HH:MM:SS am/pm
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

    // Fallback
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
}

/** Map Excel transaction type → DB transaction type */
function mapTransactionType(excelType) {
    const t = String(excelType).trim().toLowerCase();
    if (t === 'daily roi income') return 'roi_income';
    if (t === 'level 1 income') return 'direct_income';
    if (t.startsWith('level ') && t.endsWith(' income')) return 'level_income';
    if (t.startsWith('direct referral income')) return 'direct_income';
    if (t === 'deposit') return 'deposit';
    if (t === 'withdraw approved') return 'withdraw';
    if (t === 'wallet created') return null; // skip
    return null; // skip unknown
}

// ─── Main Seed Function ─────────────────────────────────────────────

async function seed() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        console.log('\n🗑️  Clearing existing data...');

        // Clear tables in dependency order
        await client.query('DELETE FROM "Transaction"');
        console.log('   ✅ Transaction cleared');
        await client.query('DELETE FROM "UserPlan"');
        console.log('   ✅ UserPlan cleared');
        await client.query('DELETE FROM "Referral"');
        console.log('   ✅ Referral cleared');
        await client.query('DELETE FROM "LevelConfig"');
        console.log('   ✅ LevelConfig cleared');
        await client.query('DELETE FROM "User"');
        console.log('   ✅ User cleared');

        // ──────────────────────────────────────────────────────────────
        // 1. IMPORT USERS from "roi maxso.xlsx" → Sheet1
        // ──────────────────────────────────────────────────────────────
        console.log('\n👤 Importing Users...');
        const usersRaw = readSheet('roi maxso.xlsx', 'Sheet1');
        // Skip first row as it's the header row (the sheet has "User List" as first cell)
        const userRows = usersRaw.slice(1); // Row 0 is the actual header

        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        const userCodeToId = {}; // MAP: referral_code → DB id

        for (const row of userRows) {
            const name = String(row['__EMPTY'] || '').trim();
            const phoneRaw = String(row['__EMPTY_1'] || '').trim();
            const userCode = String(row['__EMPTY_2'] || '').trim();
            const walletAddr = String(row['__EMPTY_3'] || '').trim();
            const createdAt = parseDate(row['__EMPTY_5'] || '');

            if (!userCode || !userCode.startsWith('MAX')) continue;

            const phone = phoneRaw.startsWith('91') ? '+' + phoneRaw : phoneRaw;
            const wallet = walletAddr === '-' ? null : walletAddr;
            const role = userCode === ADMIN_CODE ? 'admin' : 'user';
            const email = `${userCode.toLowerCase()}@maxso.com`; // Generate placeholder email

            const result = await client.query(
                `INSERT INTO "User" (name, email, password, referral_code, role, phone_number, wallet_address, status, created_at, referral_count, wallet_balance)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, 0, 0) RETURNING id`,
                [name, email, hashedPassword, userCode, role, phone, wallet, createdAt]
            );

            userCodeToId[userCode] = result.rows[0].id;
        }

        console.log(`   ✅ Imported ${Object.keys(userCodeToId).length} users from Excel`);

        // Add admin user (MAX29427 / Maxso) if not already in Excel data
        if (!userCodeToId[ADMIN_CODE]) {
            const adminResult = await client.query(
                `INSERT INTO "User" (name, email, password, referral_code, role, phone_number, wallet_address, status, created_at, referral_count, wallet_balance)
                 VALUES ($1, $2, $3, $4, 'admin', NULL, NULL, true, NOW(), 0, 0) RETURNING id`,
                ['Maxso', 'admin@maxso.com', hashedPassword, ADMIN_CODE]
            );
            userCodeToId[ADMIN_CODE] = adminResult.rows[0].id;
            console.log('   ✅ Added Maxso admin user (not in Excel User List)');
        }

        // ──────────────────────────────────────────────────────────────
        // 2. SET referred_by for each user based on referral relationships
        // ──────────────────────────────────────────────────────────────
        console.log('\n🔗 Setting referred_by relationships...');
        const refRaw = readSheet('all_referrals.xlsx');

        // Build a map of who directly referred whom (level 1 only)
        const directReferrals = {};
        for (const row of refRaw) {
            const level = parseInt(row['Level']);
            if (level !== 1) continue;
            const referrerCode = extractCode(row['Referrer Code']);
            const referredCode = extractCode(row['Referred Code']);
            directReferrals[referredCode] = referrerCode;
        }

        for (const [referredCode, referrerCode] of Object.entries(directReferrals)) {
            const referrerId = userCodeToId[referrerCode];
            if (referrerId && userCodeToId[referredCode]) {
                await client.query(
                    'UPDATE "User" SET referred_by = $1 WHERE id = $2',
                    [referrerId, userCodeToId[referredCode]]
                );
            }
        }
        console.log(`   ✅ Set ${Object.keys(directReferrals).length} referred_by relationships`);

        // ──────────────────────────────────────────────────────────────
        // 3. IMPORT LEVEL CONFIG from "level_configuration.xlsx"
        // ──────────────────────────────────────────────────────────────
        console.log('\n📊 Importing LevelConfig...');
        const levelRows = readSheet('level_configuration.xlsx');
        let levelCount = 0;

        for (const row of levelRows) {
            const level = parseInt(row['Level']);
            const percentage = parseFloat(row['Percentage']);
            const requiredVolume = parseFloat(row['Required Volume']);
            const status = String(row['Status']).trim() || 'active';
            const createdAt = parseDate(row['Created At']);

            await client.query(
                `INSERT INTO "LevelConfig" (level, percentage, required_volume, status, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
                [level, percentage, requiredVolume, status, createdAt]
            );
            levelCount++;
        }
        console.log(`   ✅ Imported ${levelCount} level configs`);

        // ──────────────────────────────────────────────────────────────
        // 4. IMPORT REFERRALS from "all_referrals.xlsx"
        // ──────────────────────────────────────────────────────────────
        console.log('\n🤝 Importing Referrals...');
        let refCount = 0;

        for (const row of refRaw) {
            const referrerCode = extractCode(row['Referrer Code']);
            const referredCode = extractCode(row['Referred Code']);
            const level = parseInt(row['Level']);
            const createdAt = parseDate(row['Created At']);

            await client.query(
                `INSERT INTO "Referral" (referrer_code, referred_code, level, created_at)
         VALUES ($1, $2, $3, $4)`,
                [referrerCode, referredCode, level, createdAt]
            );
            refCount++;
        }
        console.log(`   ✅ Imported ${refCount} referrals`);

        // ──────────────────────────────────────────────────────────────
        // 5. IMPORT DEPOSITS from "deposit_list.xlsx"
        // ──────────────────────────────────────────────────────────────
        console.log('\n💰 Importing Deposits...');
        const depositRows = readSheet('deposit_list.xlsx');
        let depCount = 0;

        for (const row of depositRows) {
            const fromCode = String(row['From User']).trim();
            const toCode = String(row['To User']).trim();
            const amount = parseAmount(row['Amount']);
            const createdAt = parseDate(row['Created At']);

            const userId = userCodeToId[fromCode];
            const refUserId = userCodeToId[toCode];

            if (!userId) {
                console.log(`   ⚠️ Skipping deposit - user ${fromCode} not found`);
                continue;
            }

            await client.query(
                `INSERT INTO "Transaction" (user_id, type, amount, status, reference_user_id, created_at)
         VALUES ($1, 'deposit', $2, 'completed', $3, $4)`,
                [userId, amount, refUserId || null, createdAt]
            );
            depCount++;
        }
        console.log(`   ✅ Imported ${depCount} deposits`);

        // ──────────────────────────────────────────────────────────────
        // 6. IMPORT WITHDRAWALS from "withdraw_list.xlsx"
        // ──────────────────────────────────────────────────────────────
        console.log('\n💸 Importing Withdrawals...');
        const withdrawRows = readSheet('withdraw_list.xlsx');
        let withCount = 0;

        for (const row of withdrawRows) {
            const userCode = String(row['Usercode']).trim();
            const amount = parseAmount(row['Amount']);
            const status = String(row['Status']).trim().toLowerCase();
            const createdAt = parseDate(row['Created At']);

            const userId = userCodeToId[userCode];
            if (!userId) {
                console.log(`   ⚠️ Skipping withdrawal - user ${userCode} not found`);
                continue;
            }

            await client.query(
                `INSERT INTO "Transaction" (user_id, type, amount, status, created_at)
         VALUES ($1, 'withdraw', $2, $3, $4)`,
                [userId, amount, status === 'approved' ? 'completed' : status, createdAt]
            );
            withCount++;
        }
        console.log(`   ✅ Imported ${withCount} withdrawals`);

        // ──────────────────────────────────────────────────────────────
        // 7. IMPORT ROI/INCOME TRANSACTIONS from "roi maxso.xlsx" → Sheet3
        // ──────────────────────────────────────────────────────────────
        console.log('\n📈 Importing ROI/Income Transactions (this may take a moment)...');
        const roiRows = readSheet('roi maxso.xlsx', 'Sheet3');
        let roiCount = 0;
        let skippedCount = 0;

        // The "Created At" column has a weird whitespace name
        const createdAtKey = Object.keys(roiRows[0]).find(k => k.includes('Created At')) || 'Created At';

        for (const row of roiRows) {
            const fromCode = String(row['From User']).trim();
            const toCode = String(row['To User']).trim();
            const excelType = String(row['Type']).trim();
            const amount = parseFloat(row['Amount']) || 0;
            const createdAt = parseDate(row[createdAtKey]);

            const dbType = mapTransactionType(excelType);
            if (!dbType) {
                skippedCount++;
                continue;
            }

            // Skip if it's a deposit or withdraw (already imported from dedicated sheets)
            if (dbType === 'deposit' || dbType === 'withdraw') {
                skippedCount++;
                continue;
            }

            // For income types: "To User" is the user who earned the income
            // "From User" is the reference (source of the deposit that triggered it)
            const userId = userCodeToId[toCode];
            const refUserId = userCodeToId[fromCode];

            if (!userId) {
                skippedCount++;
                continue;
            }

            await client.query(
                `INSERT INTO "Transaction" (user_id, type, amount, status, reference_user_id, created_at)
         VALUES ($1, $2, $3, 'completed', $4, $5)`,
                [userId, dbType, amount, refUserId || null, createdAt]
            );
            roiCount++;
        }
        console.log(`   ✅ Imported ${roiCount} ROI/income transactions (skipped ${skippedCount})`);

        // ──────────────────────────────────────────────────────────────
        // 8. UPDATE referral_count for each user
        // ──────────────────────────────────────────────────────────────
        console.log('\n🔄 Updating referral counts...');
        await client.query(`
      UPDATE "User" u SET referral_count = (
        SELECT COUNT(*) FROM "Referral" r 
        WHERE r.referrer_code = u.referral_code AND r.level = 1
      )
    `);
        console.log('   ✅ Referral counts updated');

        // ──────────────────────────────────────────────────────────────
        // 9. UPDATE wallet_balance based on transactions
        // ──────────────────────────────────────────────────────────────
        console.log('\n💳 Calculating wallet balances...');
        await client.query(`
      UPDATE "User" u SET wallet_balance = COALESCE((
        SELECT 
          SUM(CASE WHEN t.type IN ('deposit', 'roi_income', 'level_income', 'direct_income') THEN t.amount ELSE 0 END) -
          SUM(CASE WHEN t.type = 'withdraw' THEN t.amount ELSE 0 END)
        FROM "Transaction" t 
        WHERE t.user_id = u.id AND t.status = 'completed'
      ), 0)
    `);
        console.log('   ✅ Wallet balances calculated');

        // ──────────────────────────────────────────────────────────────
        // 10. RESET ID SEQUENCES
        // ──────────────────────────────────────────────────────────────
        console.log('\n🔢 Resetting ID sequences...');
        const tables = ['User', 'Transaction', 'Referral', 'LevelConfig'];
        for (const table of tables) {
            await client.query(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`);
        }
        console.log('   ✅ Sequences reset');

        await client.query('COMMIT');

        // ──────────────────────────────────────────────────────────────
        // SUMMARY
        // ──────────────────────────────────────────────────────────────
        console.log('\n' + '═'.repeat(50));
        console.log('✅ SEED COMPLETE! Summary:');
        console.log('═'.repeat(50));

        const counts = await Promise.all([
            client.query('SELECT COUNT(*) FROM "User"'),
            client.query('SELECT COUNT(*) FROM "LevelConfig"'),
            client.query('SELECT COUNT(*) FROM "Referral"'),
            client.query('SELECT COUNT(*) FROM "Transaction"'),
            client.query('SELECT COUNT(*) FROM "Transaction" WHERE type = \'deposit\''),
            client.query('SELECT COUNT(*) FROM "Transaction" WHERE type = \'withdraw\''),
            client.query('SELECT COUNT(*) FROM "Transaction" WHERE type IN (\'roi_income\', \'level_income\', \'direct_income\')'),
        ]);

        console.log(`   Users:           ${counts[0].rows[0].count}`);
        console.log(`   Level Configs:   ${counts[1].rows[0].count}`);
        console.log(`   Referrals:       ${counts[2].rows[0].count}`);
        console.log(`   Transactions:    ${counts[3].rows[0].count} total`);
        console.log(`     - Deposits:    ${counts[4].rows[0].count}`);
        console.log(`     - Withdrawals: ${counts[5].rows[0].count}`);
        console.log(`     - Income:      ${counts[6].rows[0].count}`);
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
