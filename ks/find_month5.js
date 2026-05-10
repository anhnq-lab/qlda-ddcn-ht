import xlsx from 'xlsx';

const workbook = xlsx.readFile('FINAL 24.4.2026_PMU_ BC kết quả thực hiện tháng 4_ kế hoạch tháng 5.2026.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, range: 0, raw: false });

for(let i=0; i<rows.length; i++) {
  const colA = String(rows[i][0] || '').trim();
  const colB = String(rows[i][1] || '').trim();
  if (['I', 'II', 'III', '1', '2', '3'].includes(colA) || colB.toLowerCase().includes('tháng 5')) {
    console.log(`Row ${i}: [${colA}] - [${colB}]`);
  }
}
