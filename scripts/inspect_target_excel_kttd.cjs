const XLSX = require('xlsx');
const path = require('path');

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/KTTĐ. BÁO CÁO THÁNG 5.2026.xlsx';

async function inspectExcel() {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    console.log('Các Sheet:', sheetNames);
    
    sheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log(`Sheet [${sheetName}]: ${rows.length} hàng`);
      if (rows.length > 0) {
        console.log(`  15 dòng đầu của [${sheetName}]:`);
        rows.slice(0, 15).forEach((row, idx) => {
          console.log(`    Dòng ${idx + 1}:`, JSON.stringify(row).substring(0, 350));
        });
      }
    });
  } catch (err) {
    console.error(err);
  }
}

inspectExcel();
