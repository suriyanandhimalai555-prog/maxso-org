require('dotenv').config({ path: '../.env' });
const db = require('../db');
const XLSX = require('xlsx');

function parseDate(dateStr) {
    if (!dateStr) return new Date();

    if (typeof dateStr === 'number') {
        // Excel date: days since Dec 30 1899 (for windows 1900 date system)
        return new Date(Math.round((dateStr - 25569) * 86400 * 1000));
    }

    if (typeof dateStr === 'string') {
        try {
            // Handle format: "16/2/2026, 2:48:52 pm"
            const parts = dateStr.split(', ');
            if (parts.length === 2) {
                const dateParts = parts[0].split(/[/-]/);
                // Assuming DD/MM/YYYY
                let day = parseInt(dateParts[0]);
                let month = parseInt(dateParts[1]) - 1;
                let year = parseInt(dateParts[2]);

                const timeParts = parts[1].split(' ');
                const hms = timeParts[0].split(':');
                let hours = parseInt(hms[0]);
                let minutes = parseInt(hms[1]);
                let seconds = parseInt(hms[2]);
                let ampm = timeParts[1] ? timeParts[1].toLowerCase() : '';

                if (ampm === 'pm' && hours < 12) hours += 12;
                if (ampm === 'am' && hours === 12) hours = 0;

                return new Date(year, month, day, hours, minutes, seconds);
            }

            // Fallback native parse
            const fallback = new Date(dateStr);
            if (!isNaN(fallback)) return fallback;
        } catch (e) {
            console.error("Failed to parse date string:", dateStr);
        }
    }

    return new Date(); // fallback to now
}

async function uploadReferrals() {
    try {
        const files = [
            'all_referrals.xlsx',
            'all_referrals1.xlsx',
            'referral(above feb 2).xlsx'
        ];

        await db.query('BEGIN');

        // Wipe existing
        await db.query('TRUNCATE TABLE "Referral" RESTART IDENTITY CASCADE');
        console.log("Cleared existing Referral table.");

        let inserted = 0;

        for (const file of files) {
            console.log(`\nReading ${file}...`);
            const wb = XLSX.readFile(`d:/FreeLancing/Maxso/Production-Maxso-org/Maxso-Org-main/excel/${file}`, { cellDates: true });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet);

            console.log(`Found ${data.length} records in ${file}.`);

            for (const row of data) {
                // Handle different column names
                const referrerRaw = row['Referrar Code'] || row['Referrer Code'] || row['referrer_code'];
                const referredRaw = row['Referred Code'] || row['referred_code'];
                const levelRaw = row['Level'] || row['level'] || row['Level '];
                const createdAtRaw = row['Created At'] || row['created at'] || row['CreatedAt'] || row['Date'];

                if (!referrerRaw || !referredRaw) continue;

                // Extract MAX... codes
                const referrerMatch = String(referrerRaw).match(/MAX\d+/);
                const referredMatch = String(referredRaw).match(/MAX\d+/);

                if (!referrerMatch || !referredMatch) {
                    continue;
                }

                const referrerCode = referrerMatch[0];
                const referredCode = referredMatch[0];
                const level = parseInt(levelRaw) || 1;
                const createdAt = parseDate(createdAtRaw);

                await db.query(
                    'INSERT INTO "Referral" (referrer_code, referred_code, level, created_at) VALUES ($1, $2, $3, $4)',
                    [referrerCode, referredCode, level, createdAt]
                );
                inserted++;
            }
        }

        await db.query('COMMIT');
        console.log(`\nSuccessfully inserted ${inserted} total referral links!`);

    } catch (e) {
        if (db) await db.query('ROLLBACK');
        console.error("Error formatting/inserting referrals:", e);
    } finally {
        process.exit(0);
    }
}

uploadReferrals();
