const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const excelDir = path.join(__dirname, '..', '..', 'Excel-data');
const files = fs.readdirSync(excelDir).filter(f => f.endsWith('.xlsx'));

for (const file of files) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`FILE: ${file}`);
    console.log('='.repeat(60));

    const wb = XLSX.readFile(path.join(excelDir, file));

    for (const sheetName of wb.SheetNames) {
        console.log(`\nSheet: ${sheetName}`);
        const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
        console.log(`Rows: ${data.length}`);

        if (data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
            // Print first 5 rows
            console.log('\nFirst 5 rows:');
            data.slice(0, 5).forEach((row, i) => {
                console.log(`Row ${i + 1}:`, JSON.stringify(row));
            });
            // Print last 2 rows if more than 5
            if (data.length > 5) {
                console.log(`\n... (${data.length - 5} more rows) ...`);
                console.log('\nLast 2 rows:');
                data.slice(-2).forEach((row, i) => {
                    console.log(`Row ${data.length - 1 + i}:`, JSON.stringify(row));
                });
            }
        }
    }
}
