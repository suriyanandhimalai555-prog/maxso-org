require('dotenv').config({ path: '../.env' });
const db = require('../db');
const XLSX = require('xlsx');

async function uploadReferrals() {
    try {
        console.log("Reading new Excel file...");
        const wb = XLSX.readFile('d:/FreeLancing/Maxso/Production-Maxso-org/Maxso-Org-main/excel/all_referrals1.xlsx');
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        console.log(`Found ${data.length} records. Beginning database update...`);

        await db.query('BEGIN');

        // Wipe existing referrals
        await db.query('TRUNCATE TABLE "Referral" RESTART IDENTITY CASCADE');
        console.log("Cleared existing Referral table.");

        let inserted = 0;
        for (const row of data) {
            if (!row['Referrar Code'] || !row['Referred Code']) continue;

            // Extract MAX... codes
            const referrerMatch = row['Referrar Code'].match(/MAX\d+/);
            const referredMatch = row['Referred Code'].match(/MAX\d+/);

            if (!referrerMatch || !referredMatch) {
                console.warn("Could not extract codes from:", row['Referrar Code'], row['Referred Code']);
                continue;
            }

            const referrerCode = referrerMatch[0];
            const referredCode = referredMatch[0];
            const level = row['Level'];

            // Extract date if possible
            let createdAt = new Date();
            if (row['Created At']) {
                // e.g., "16/2/2026, 2:48:52 pm" or similar
                // Just storing now is generally fine for the Referral table since it's just relationships, 
                // but we can try basic parsing or let the DB default handle it if we don't pass it.
            }

            await db.query(
                'INSERT INTO "Referral" (referrer_code, referred_code, level) VALUES ($1, $2, $3)',
                [referrerCode, referredCode, level]
            );
            inserted++;
        }

        await db.query('COMMIT');
        console.log(`Successfully inserted ${inserted} referral links!`);

    } catch (e) {
        if (db) await db.query('ROLLBACK');
        console.error("Error formatting/inserting referrals:", e);
    } finally {
        process.exit(0);
    }
}

uploadReferrals();
