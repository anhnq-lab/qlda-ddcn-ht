const XLSX = require('xlsx');

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/QLDA1_BÁO CÁO THÁNG 05_KẾ HOẠCH THÁNG 06.2026 (1).xlsx';

function inspectAllSheet5() {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Thang 05- KH thang 06.2026'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`=== QUÉT TOÀN BỘ CÁC DÒNG CÓ DỮ LIỆU CỦA SHEET THÁNG 5 ===\n`);
  
  let currentSection = '';
  
  rows.forEach((row, idx) => {
    const lineNum = idx + 1;
    const hasData = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
    if (!hasData) return;
    
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    
    if (col0 === 'A') {
      currentSection = 'SECTION A (THỰC HIỆN THÁNG 5)';
      console.log(`\n>>> Dòng ${lineNum}: [${currentSection}] --- ${col0} - ${col1}`);
      return;
    } else if (col0 === 'B') {
      currentSection = 'SECTION B (KẾ HOẠCH THÁNG 6)';
      console.log(`\n>>> Dòng ${lineNum}: [${currentSection}] --- ${col0} - ${col1}`);
      return;
    }
    
    if (currentSection) {
      console.log(`Line ${String(lineNum).padStart(3)} | TT: ${String(col0).padStart(3)} | Content: ${JSON.stringify(row).substring(0, 300)}`);
    }
  });
}

inspectAllSheet5();
