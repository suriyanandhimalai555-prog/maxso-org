require('dotenv').config({ path: '../.env' });
const db = require('../db');

async function checkUserLinks() {
    try {
        const parent = await db.query('SELECT id FROM "User" WHERE referral_code = $1', ['MAX07725']);
        const parentId = parent.rows[0].id;

        // Get all users who have MAX07725 as direct parent in User table
        const directRes = await db.query('SELECT name, referral_code FROM "User" WHERE referred_by = $1', [parentId]);
        console.log("Direct referrals (Level 1) of MAX07725 in User table:", directRes.rows.length);

        const countAllRefs = await db.query('SELECT COUNT(*) FROM "User" WHERE referred_by IS NOT NULL');
        console.log("Total Users with referred_by set in User table:", countAllRefs.rows[0].count);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkUserLinks();
