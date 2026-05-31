const XLSX = require('xlsx');

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/QLDA1_BÁO CÁO THÁNG 05_KẾ HOẠCH THÁNG 06.2026 (1).xlsx';

function debugOtherTasks() {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Thang 05- KH thang 06.2026'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log('=== HIỂN THỊ DÒNG 27 ĐẾN DÒNG 33 ===\n');
  
  for (let i = 26; i < 33; i++) {
    const row = rows[i];
    if (!row) continue;
    console.log(`Dòng ${i + 1} | TT: "${row[0]}"`);
    console.log(`  - Cột 1 (Nhiệm vụ): ${JSON.stringify(row[1])}`);
    console.log(`  - Cột 2 (Đầu ra)  : ${JSON.stringify(row[2])}`);
    console.log(`  - Cột 4 (Cán bộ)  : ${JSON.stringify(row[4])}`);
    console.log(`  - Cột 7 (Kết quả) : ${JSON.stringify(row[7])}`);
    console.log('----------------------------------------------------');
  }
}

debugOtherTasks();
