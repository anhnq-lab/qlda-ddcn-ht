const XLSX = require('xlsx');

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/KTTĐ. BÁO CÁO THÁNG 5.2026.xlsx';

function findBounds() {
  const workbook = XLSX.readFile(filePath);
  const sheetName = 'Tháng 5 KTTĐ';
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`Tổng số hàng: ${rows.length}`);
  
  let lastValidRowIdx = -1;
  rows.forEach((row, idx) => {
    const col1 = row[1] ? String(row[1]).trim() : '';
    const assigneeCol = row[4];
    if (assigneeCol && col1) {
      lastValidRowIdx = idx;
      console.log(`Dòng hợp lệ tại index ${idx} (Hàng ${idx + 1}): col1="${col1.substring(0, 50)}...", assignee="${assigneeCol}"`);
    }
  });
  
  console.log(`\n=> Hàng hợp lệ cuối cùng có Cán bộ phụ trách là Hàng ${lastValidRowIdx + 1} (index ${lastValidRowIdx})`);
}

findBounds();
