const XLSX = require('xlsx');

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/QLDA1_BÁO CÁO THÁNG 05_KẾ HOẠCH THÁNG 06.2026 (1).xlsx';

function analyzeSheet(sheetName, sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\n======================================================`);
  console.log(`PHÂN TÍCH SHEET: [${sheetName}] (Tổng số dòng: ${rows.length})`);
  console.log(`======================================================`);

  // Tìm các hàng tiêu đề chính (A, B, I, II, III...)
  let sections = [];
  let currentRoom = '';
  
  rows.forEach((row, idx) => {
    if (!row || row.length === 0) return;
    
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    
    // Tìm phần tiêu đề chính
    if ((col0 === 'A' || col0 === 'B' || col0 === 'C') && col1) {
      sections.push({ line: idx + 1, type: 'SECTION', code: col0, title: col1 });
    }
    
    // Tìm tiêu đề phòng ban hoặc nhóm
    if (col0 === 'V' || col0 === 'VI' || col1.includes('Phòng QLDA') || col1.includes('PHÒNG QUẢN LÝ')) {
      sections.push({ line: idx + 1, type: 'DEPARTMENT', code: col0, title: col1 || row[0] });
    }

    // Ghi nhận dòng đầu tiên có chứa tiêu đề cột chính thức
    if (col0 === 'TT' && col1.includes('Nội dung')) {
      console.log(`- Dòng tiêu đề cột chính thức tại dòng ${idx + 1}:`, row.filter(Boolean));
    }
  });

  console.log('\nCác đề mục lớn được phát hiện trong Sheet:');
  sections.forEach(sec => {
    console.log(`- Dòng ${sec.line} [${sec.type}]: ${sec.code} - ${sec.title}`);
  });

  // Đếm chi tiết các hàng nhiệm vụ thực tế
  let actualTasksCount = 0;
  let plannedTasksCount = 0;
  let currentSection = '';

  rows.forEach((row, idx) => {
    if (idx < 6) return; // Bỏ qua phần header chung của báo cáo
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    
    if (col0 === 'A') {
      currentSection = 'ACTUAL';
      return;
    } else if (col0 === 'B') {
      currentSection = 'PLAN';
      return;
    }

    // Nếu cột 0 là số thứ tự (TT)
    const isNumericTT = /^\d+$/.test(col0);
    if (isNumericTT && col1) {
      if (currentSection === 'ACTUAL') {
        actualTasksCount++;
      } else if (currentSection === 'PLAN') {
        plannedTasksCount++;
      }
    }
  });

  console.log(`\n- Tổng số công việc thực hiện trong tháng (Phần A): ${actualTasksCount}`);
  console.log(`- Tổng số công việc kế hoạch tháng tới (Phần B): ${plannedTasksCount}`);

  // In ra 3 công việc mẫu ở mỗi phần để phân tích cột
  console.log('\n- Mẫu công việc phần A (Thực hiện):');
  let sampledA = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    if (/^\d+$/.test(col0) && col1 && i > 6) {
      // Xem ta đang ở phần nào bằng cách duyệt ngược lại
      let isA = false;
      for (let j = i; j >= 0; j--) {
        const prevCol0 = String(rows[j][0] || '').trim();
        if (prevCol0 === 'A') { isA = true; break; }
        if (prevCol0 === 'B') { isA = false; break; }
      }
      if (isA && sampledA < 3) {
        console.log(`  Dòng ${i + 1} (TT ${col0}):`, JSON.stringify(row));
        sampledA++;
      }
    }
  }

  console.log('\n- Mẫu công việc phần B (Kế hoạch):');
  let sampledB = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    if (/^\d+$/.test(col0) && col1 && i > 6) {
      let isB = false;
      for (let j = i; j >= 0; j--) {
        const prevCol0 = String(rows[j][0] || '').trim();
        if (prevCol0 === 'B') { isB = true; break; }
        if (prevCol0 === 'A') { isB = false; break; }
      }
      if (isB && sampledB < 3) {
        console.log(`  Dòng ${i + 1} (TT ${col0}):`, JSON.stringify(row));
        sampledB++;
      }
    }
  }
}

async function run() {
  const workbook = XLSX.readFile(filePath);
  
  // Phân tích sheet tháng 4
  const sheet4 = workbook.Sheets['Thang 04- KH thang 05.2026'];
  analyzeSheet('Thang 04- KH thang 05.2026', sheet4);

  // Phân tích sheet tháng 5
  const sheet5 = workbook.Sheets['Thang 05- KH thang 06.2026'];
  analyzeSheet('Thang 05- KH thang 06.2026', sheet5);
}

run();
