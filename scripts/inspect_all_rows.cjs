const XLSX = require('xlsx');

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/QLDA1_BÁO CÁO THÁNG 05_KẾ HOẠCH THÁNG 06.2026 (1).xlsx';

function inspectAll() {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Thang 04- KH thang 05.2026'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`=== IN TOÀN BỘ CÁC DÒNG CÓ DỮ LIỆU CỦA SHEET THÁNG 4 ===\n`);
  
  let currentSection = '';
  
  rows.forEach((row, idx) => {
    const lineNum = idx + 1;
    const hasData = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
    if (!hasData) return;
    
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    
    if (col0 === 'A') {
      currentSection = 'SECTION A (THỰC HIỆN)';
      console.log(`\n>>> Dòng ${lineNum}: [${currentSection}] --- ${col0} - ${col1}`);
      return;
    } else if (col0 === 'B') {
      currentSection = 'SECTION B (KẾ HOẠCH)';
      console.log(`\n>>> Dòng ${lineNum}: [${currentSection}] --- ${col0} - ${col1}`);
      return;
    }
    
    // In ra dòng nếu đang ở trong phần A hoặc B
    if (currentSection) {
      console.log(`Line ${String(lineNum).padStart(3)} | TT: ${String(col0).padStart(3)} | Content: ${JSON.stringify(row).substring(0, 300)}`);
    }
  });
}

inspectAll();
