const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/excel_dump.json', 'utf-8'));
const sheet = data['Sheet1'];
for (let i = 3; i < sheet.length; i++) {
    const row = sheet[i];
    if (!row || row.length === 0) continue;
    const tt = row[0] ? row[0].toString().trim() : '';
    const name = row[1] ? row[1].toString().trim().replace(/\n/g, ' ') : '';
    const tabmis = row[2] ? row[2].toString().trim() : '';
    if (tt || name || tabmis) {
        console.log(`[${i}] TT: ${tt} | Tabmis: ${tabmis} | Name: ${name.substring(0, 70)}`);
    }
}
