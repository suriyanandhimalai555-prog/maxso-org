require('dotenv').config();
const { Pool } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const dir1 = path.join(__dirname, '..', '..', 'excel-data');
const dir2 = path.join(__dirname, '..', '..', 'Excel-data');
const excelDir = fs.existsSync(dir1) ? dir1 : dir2;

async function check() {
    const out = [];
    try {
        const wb = XLSX.readFile(path.join(excelDir, 'deposit_list.xlsx'));
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
        out.push('=== EXCEL deposit_list.xlsx ===');
        out.push('Columns: ' + Object.keys(rows[0]).join(', '));
        rows.slice(0, 3).forEach((r, i) => out.push('Row ' + (i + 1) + ': ' + JSON.stringify(r)));

        out.push('\n=== DB deposits (first 3) ===');
        const r1 = await pool.query(`
            SELECT t.id, t.type, t.amount, t.user_id, t.reference_user_id,
                   u.referral_code as from_code, r.referral_code as to_code
            FROM "Transaction" t
            LEFT JOIN "User" u ON t.user_id = u.id
            LEFT JOIN "User" r ON t.reference_user_id = r.id
            WHERE t.type = 'deposit' ORDER BY t.created_at ASC LIMIT 3
        `);
        r1.rows.forEach(r => out.push(JSON.stringify(r)));

        out.push('\n=== DB roi_income (first 3) ===');
        const r2 = await pool.query(`
            SELECT t.id, t.type, t.amount, t.user_id, t.reference_user_id,
                   u.referral_code as from_code, r.referral_code as to_code
            FROM "Transaction" t
            LEFT JOIN "User" u ON t.user_id = u.id
            LEFT JOIN "User" r ON t.reference_user_id = r.id
            WHERE t.type = 'roi_income' ORDER BY t.created_at ASC LIMIT 3
        `);
        r2.rows.forEach(r => out.push(JSON.stringify(r)));

        out.push('\n=== NULL ref counts by type ===');
        const r3 = await pool.query(`
            SELECT type, COUNT(*) as total, COUNT(reference_user_id) as with_ref,
                   COUNT(*) - COUNT(reference_user_id) as null_ref
            FROM "Transaction" GROUP BY type
        `);
        r3.rows.forEach(r => out.push(JSON.stringify(r)));

        out.push('\n=== Transaction table schema ===');
        const r4 = await pool.query(`
            SELECT column_name, data_type FROM information_schema.columns 
            WHERE table_name = 'Transaction' ORDER BY ordinal_position
        `);
        r4.rows.forEach(r => out.push('  ' + r.column_name + ': ' + r.data_type));

        fs.writeFileSync(path.join(__dirname, 'db_check.txt'), out.join('\n'));
        console.log('Written to db_check.txt');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        pool.end();
    }
}
check();
