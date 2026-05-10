import xlsx from 'xlsx';

const workbook = xlsx.readFile('FINAL 24.4.2026_PMU_ BC kết quả thực hiện tháng 4_ kế hoạch tháng 5.2026.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to json and print first 20 rows
const data = xlsx.utils.sheet_to_json(sheet, { header: 1, range: 0, raw: false });
console.log(JSON.stringify(data.slice(0, 20), null, 2));
