const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const dir1 = path.join(__dirname, '..', '..', 'excel-data');
const dir2 = path.join(__dirname, '..', '..', 'Excel-data');
const excelDir = fs.existsSync(dir1) ? dir1 : dir2;

const output = [];

const wb = XLSX.readFile(path.join(excelDir, 'roi maxso.xlsx'));
output.push('=== roi maxso.xlsx ===');
output.push('Sheets: ' + JSON.stringify(wb.SheetNames));

for (const name of wb.SheetNames) {
    const data = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' });
    output.push(`\n--- Sheet: ${name} | Rows: ${data.length} ---`);
    if (data.length > 0) {
        output.push('Columns: ' + Object.keys(data[0]).join(', '));
        output.push('Row 1: ' + JSON.stringify(data[0]));
        if (data.length > 1) output.push('Row 2: ' + JSON.stringify(data[1]));
    }
}

// Check deposit_list for plan data
const wb2 = XLSX.readFile(path.join(excelDir, 'deposit_list.xlsx'));
output.push('\n=== deposit_list.xlsx ===');
output.push('Sheets: ' + JSON.stringify(wb2.SheetNames));
for (const name of wb2.SheetNames) {
    const data = XLSX.utils.sheet_to_json(wb2.Sheets[name], { defval: '' });
    output.push(`\n--- Sheet: ${name} | Rows: ${data.length} ---`);
    if (data.length > 0) {
        output.push('Columns: ' + Object.keys(data[0]).join(', '));
        output.push('Row 1: ' + JSON.stringify(data[0]));
    }
}

fs.writeFileSync(path.join(__dirname, 'sheet_info.txt'), output.join('\n'));
console.log('Written to sheet_info.txt');
