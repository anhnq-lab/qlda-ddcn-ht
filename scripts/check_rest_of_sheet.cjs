const XLSX = require('xlsx');

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/QLDA1_BÁO CÁO THÁNG 05_KẾ HOẠCH THÁNG 06.2026 (1).xlsx';

function inspectRest() {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Thang 04- KH thang 05.2026'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`=== QUÉT DỮ LIỆU TỪ DÒNG 45 ĐẾN DÒNG 729 TRÊN SHEET THÁNG 4 ===\n`);
  
  let validRowsCount = 0;
  
  rows.forEach((row, idx) => {
    const lineNum = idx + 1;
    if (lineNum <= 45) return;
    
    // Kiểm tra hàng có dữ liệu thực tế
    const hasData = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
    if (hasData) {
      validRowsCount++;
      // Chỉ in một số dòng tiêu biểu hoặc các dòng chứa tiêu đề
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();
      
      // Nếu là đề mục chữ (ví dụ: số thứ tự La Mã I, II, hoặc chữ A, B, C...)
      const isHeader = col0.length > 0 && isNaN(Number(col0)) && !/^\d+$/.test(col0);
      const isNumber = /^\d+$/.test(col0);
      
      if (isHeader || (isNumber && validRowsCount % 50 === 0) || lineNum < 100) {
        console.log(`Dòng ${lineNum} (TT: "${col0}"): ${JSON.stringify(row).substring(0, 200)}`);
      }
    }
  });
  
  console.log(`\n- Tổng số dòng có chứa dữ liệu thực tế từ dòng 46 đến 729: ${validRowsCount}`);
}

inspectRest();
