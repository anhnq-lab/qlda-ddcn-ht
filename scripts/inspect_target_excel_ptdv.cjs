const XLSX = require('xlsx');
const path = require('path');

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/PTDV-BAN QLDA DD_HTKV BÁO CÁO THÁNG 5. KH tháng 6.xlsx';

async function inspectExcel() {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = 'Tháng 06-PTDV';
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`Sheet: ${sheetName}`);
    console.log(`Tổng số hàng: ${rows.length}`);
    console.log('In ra các hàng từ 35 đến 80:');
    rows.slice(34, 80).forEach((row, idx) => {
      console.log(`  Hàng ${idx + 35}:`, JSON.stringify(row));
    });
  } catch (err) {
    console.error(err);
  }
}

inspectExcel();
