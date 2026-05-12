import xlsx from 'xlsx';
import fs from 'fs';

const filePath = 'Ks/Final-Phu-luc-ra-soat-danh-muc.xlsx';
const workbook = xlsx.readFile(filePath);

const result = {};

for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // Convert to json and print first 50 rows
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, range: 0, raw: false, defval: "" });
    result[sheetName] = data;
}

fs.writeFileSync('scratch/excel_dump.json', JSON.stringify(result, null, 2));
console.log('Saved to scratch/excel_dump.json');
