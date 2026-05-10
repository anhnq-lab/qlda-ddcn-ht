import xlsx from 'xlsx';
const workbook = xlsx.readFile('FINAL 24.4.2026_PMU_ BC kết quả thực hiện tháng 4_ kế hoạch tháng 5.2026.xlsx');
console.log(workbook.SheetNames);
