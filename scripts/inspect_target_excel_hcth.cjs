const XLSX = require('xlsx');
const path = require('path');

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/HC-TH. Báo cáo kết quả công việc  hàng tháng 5.2026.xlsx';

async function inspectExcel() {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Lấy sheet đầu tiên
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`Sheet: ${sheetName}`);
    console.log(`Tổng số hàng: ${rows.length}`);
    console.log('15 hàng đầu tiên:');
    rows.slice(0, 15).forEach((row, idx) => {
      console.log(`  Hàng ${idx + 1}:`, JSON.stringify(row));
    });
  } catch (err) {
    console.error(err);
  }
}

inspectExcel();
