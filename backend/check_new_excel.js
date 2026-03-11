const XLSX = require('xlsx');

try {
    const wb = XLSX.readFile('d:/FreeLancing/Maxso/Production-Maxso-org/Maxso-Org-main/excel/all_referrals1.xlsx');
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log(`Total rows: ${data.length}`);
    console.log("First 5 rows:");
    console.log(data.slice(0, 5));
} catch (e) {
    console.error("Error reading file:", e);
}
