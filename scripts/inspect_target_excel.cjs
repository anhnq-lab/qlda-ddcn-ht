const XLSX = require('xlsx');
const path = require('path');

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/QLDA1_BÁO CÁO THÁNG 05_KẾ HOẠCH THÁNG 06.2026 (1).xlsx';

async function inspectExcel() {
  console.log(`=== BẮT ĐẦU PHÂN TÍCH TỆP EXCEL: ${path.basename(filePath)} ===\n`);

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    console.log('Các Sheet có trong file Excel:', sheetNames);

    sheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log(`\n--- Sheet: [${sheetName}] ---`);
      console.log(`- Tổng số hàng đọc được: ${rows.length}`);

      if (rows.length > 0) {
        console.log('- 15 hàng đầu tiên làm mẫu:');
        rows.slice(0, 15).forEach((row, idx) => {
          console.log(`  Hàng ${idx + 1}:`, JSON.stringify(row).substring(0, 250));
        });
      } else {
        console.log('- Sheet trống!');
      }
    });

  } catch (err) {
    console.error('Lỗi khi đọc file Excel:', err.message || err);
  }
}

inspectExcel();
