/**
 * Inspect the asset Excel file to understand exact column structure
 * Run: node scripts/inspect-assets-xls.mjs
 */
import { readFileSync } from 'fs';
import { read, utils } from 'xlsx';

const FILE_PATH = 'D:/QuocAnh/2026/01.Project/qlda-ddcn-ht/Ks/Theo dõi Tài sản cố định Ban Dân dụng  - hạnh.xls';

const workbook = read(readFileSync(FILE_PATH));

console.log('\n=== SHEET NAMES ===');
workbook.SheetNames.forEach((name, i) => console.log(`  [${i}] ${name}`));

// Inspect the main asset sheet "TS 1.1.26"
const sheetName = 'TS 1.1.26';
const sheet = workbook.Sheets[sheetName];
if (!sheet) {
  console.error(`Sheet "${sheetName}" not found!`);
  process.exit(1);
}

// Get range
const range = utils.decode_range(sheet['!ref']);
console.log(`\n=== SHEET: ${sheetName} ===`);
console.log(`Range: rows ${range.s.r} to ${range.e.r}, cols ${range.s.c} to ${range.e.c}`);

// Print rows 0-12 to find header structure
console.log('\n--- Rows 0-12 (header area) ---');
for (let r = 0; r <= 12; r++) {
  const rowData = [];
  for (let c = 0; c <= 15; c++) {
    const cellAddr = utils.encode_cell({ r, c });
    const cell = sheet[cellAddr];
    rowData.push(cell ? String(cell.v).substring(0, 30) : '');
  }
  console.log(`Row ${r + 1}: [${rowData.join(' | ')}]`);
}

// Print rows 13-30 to see actual data rows
console.log('\n--- Rows 13-30 (data area) ---');
for (let r = 12; r <= 30; r++) {
  const rowData = [];
  for (let c = 0; c <= 15; c++) {
    const cellAddr = utils.encode_cell({ r, c });
    const cell = sheet[cellAddr];
    rowData.push(cell ? String(cell.v).substring(0, 25) : '---');
  }
  console.log(`Row ${r + 1}: [${rowData.join(' | ')}]`);
}

// Also check columns from 16+ to find the value columns
console.log('\n--- Checking value columns (cols 16-30) for row 14 ---');
for (let c = 0; c <= 30; c++) {
  const cellAddr = utils.encode_cell({ r: 6, c }); // header row
  const dataAddr = utils.encode_cell({ r: 13, c }); // first data row
  const hdrCell = sheet[cellAddr];
  const dataCell = sheet[dataAddr];
  if (hdrCell || dataCell) {
    console.log(`Col ${utils.encode_col(c)} (${c}): hdr="${hdrCell ? String(hdrCell.v).substring(0,20) : ''}" | data="${dataCell ? String(dataCell.v).substring(0,20) : ''}"`);
  }
}
