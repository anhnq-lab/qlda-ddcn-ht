const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/HC-TH. Báo cáo kết quả công việc  hàng tháng 5.2026.xlsx';
const outputMdPath = 'C:/Users/nguye/.gemini/antigravity/brain/40581c48-7bf8-4be2-bf91-d42b86bee31e/proposed_tasks_table_hcth.md';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Bộ ánh xạ sửa lỗi nhân sự viết tắt/lệch dấu của HC-TH
const employeeOverride = {
  'nguyễn quốc quyền': 'Nguyễn Quốc Quyền',
  'nguyễn nam phong': 'Nguyễn Nam Phong',
  'nguyễn đình thế': 'Nguyễn Đình Thế',
  'lương xuân hà': 'Lương Xuân Hà',
  'nguyễn trung dũng': 'Nguyễn Trung Dũng',
  'trương đình đức': 'Trương Đình Đức',
  'trần khắc tiến': 'Trần Khắc Tiến',
  'phạm thanh hải': 'Phạm Thanh Hải',
  'từ hữu hoan': 'Từ Hữu Hoan',
  'võ tá anh': 'Võ Tá Anh',
  'từ hữu tuấn': 'Từ Hữu Tuấn',
  'nguyễn đức thuận': 'Nguyễn Đức Thuận',
  'ngô văn mạnh': 'Ngô Văn Mạnh',
  'nguyễn hữu thông': 'Nguyễn Hữu Thông',
  'trần trung kiên': 'Trần Trung Kiên',
  'lê quốc hưng': 'Lê Quốc Hưng',
  'đặng hữu phương': 'Đặng Hữu Phương',
  'ngô đức quy': 'Ngô đức Quy',
  'dương đình phú': 'Dương Đình Phú',
  'dương đinh phú': 'Dương Đình Phú',
  'dương hồng quân': 'Dương Hồng Quân',
  'bùi thị hường': 'Bùi Thị Hường',
  'đào thị hải long': 'Đào Thị Hải Long',
  'trịnh văn minh': 'Trịnh Văn Minh',
  'nguyễn bá bảo lộc': 'Nguyễn Bá Bảo Lộc',
  'nguyễn thị lan anh': 'Nguyễn Thị Lan Anh',
  'nguyễn thị phương loan': 'Nguyễn Thị Phương Loan',
  'lê thị thanh bình': 'Lê Thị Thanh Bình',
  'vũ thị giang': 'Vũ Thị Giang',
  'lê thị thanh tâm': 'Lê Thị Thanh Tâm',
  'nguyễn thị thuận': 'Nguyễn Thị Thuận',
  'hà huy huân': 'Hà Huy Huân',
  'ng thị hồng hạnh': 'Nguyễn Thị Hồng Hạnh',
  'đoàn chính hữu': 'Đoàn Chính Hữu',
  'nguyễn quang linh': 'Nguyễn Quang Linh',
  'nguyễn văn nhân': 'Nguyễn Văn Nhân',
  'phạm thị oanh': 'Phạm Thị Oanh'
};

// Bộ ánh xạ dự án thủ công cho HC-TH
const projectOverride = {
  'trường mn đức bồng': 'XHH1',
  'đức bồng': 'XHH1',
  'mầm non đức bồng': 'XHH1',
  'cầu nạp hốp': 'XHH1' // Cầu Nạp Hốp xã Đức Liên là dự án đi kèm với MN Đức Bồng trong cùng công việc
};

function excelDateToISO(serial, defaultDate) {
  if (!serial) return defaultDate;
  if (typeof serial === 'string') {
    const cleanStr = serial.trim();
    if (cleanStr.includes('/')) {
      const parts = cleanStr.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) return cleanStr;
    return defaultDate;
  }
  try {
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    if (isNaN(date.getTime())) return defaultDate;
    return date.toISOString().split('T')[0];
  } catch (e) {
    return defaultDate;
  }
}

function cleanName(n) {
  if (!n) return '';
  return n.toLowerCase()
    .replace(/[:.,\-()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanMarkdownCell(str) {
  if (!str) return '';
  return String(str)
    .replace(/\r\n/g, '<br>')
    .replace(/\n/g, '<br>')
    .replace(/\r/g, '<br>')
    .replace(/\|/g, '\\|')
    .replace(/(?:^|<br>)\s*-\s+/g, (match) => {
      return match.includes('<br>') ? '<br>• ' : '• ';
    });
}

async function generateTable() {
  console.log('- Đang tải dữ liệu danh mục từ cơ sở dữ liệu...');
  const { data: dbProjects } = await supabase.from('projects').select('project_id, project_name');
  const { data: dbEmployees } = await supabase.from('employees').select('employee_id, full_name');
  
  function findProject(nameFromExcel) {
    if (!nameFromExcel) return null;
    const cleanExcelName = cleanName(nameFromExcel);
    
    // Nếu là các công việc hành chính nội bộ chung thì bỏ qua khớp dự án tự động
    const ignoreKeywords = [
      'văn bản ban hành', 'văn bản đến', 'lưu kho', 'lưu hồ', 'hồ sơ 1 cửa', 
      'ban hành danh mục', 'xét nâng lương', 'góp ý các dự thảo', 'rà soát nhập liệu', 
      'mua sắm máy móc', 'nội chính', 'tiêu chuẩn', 'chuyển công tác', 
      'thực trạng tổ chức', 'mô hình chính quyền', 'số hoá tài liệu', 
      'chuyển đổi số', 'quy chế nộp hồ sơ', 'sữa chữa quản lý', 'thanh toán các khoản', 
      'chấn chỉnh lề lối', 'phòng cháy chữa cháy', 'nguồn lực', 'đẩy mạnh truyền thông', 
      'thi đua khen thường', 'kỷ luật', 'văn bản chỉ đạo', 'đổi mới sáng tạo', 
      'cải cách hành chính', 'ngành kiểm tra', 'trụ sở làm việc', 'xe ô tô', 
      'thuế thu nhập cá nhân', 'nhà đất', 'chuyển đảng', 'soát hồ sơ', 'công việc phụ trách', 
      'phối hợp với các phòng', 'đối chiếu kho bạc', 'chi thường xuyên', 
      'tạm ứng', 'chi phí gpmb', 'kiểm soát hồ sơ', 'quy chế chi tiêu', 'phần mềm',
      'tài sản của ban', 'thanh lý tài sản', 'quy trình thanh toán', 'chi phí phát sinh',
      'tạm ứng, thanh toán', 'chi QLDA đã hoàn thành'
    ];
    
    for (const kw of ignoreKeywords) {
      if (cleanExcelName.includes(kw)) {
        // Chỉ cho phép khớp nếu được ghi đè thủ công
        for (const key of Object.keys(projectOverride)) {
          if (cleanExcelName.includes(key)) {
            const projId = projectOverride[key];
            const matched = dbProjects.find(p => p.project_id === projId);
            if (matched) return matched;
          }
        }
        return null;
      }
    }
    
    // 1. Kiểm tra ánh xạ ép khớp thủ công trước
    for (const key of Object.keys(projectOverride)) {
      if (cleanExcelName.includes(key)) {
        const projId = projectOverride[key];
        const matched = dbProjects.find(p => p.project_id === projId);
        if (matched) return matched;
      }
    }
    
    // 2. Khớp chính xác hoàn toàn
    let matched = dbProjects.find(p => cleanName(p.project_name) === cleanExcelName);
    if (matched) return matched;
    
    // 3. Khớp tương đối chặt chẽ hơn (chỉ khớp nếu tên dự án dài từ 15 ký tự để tránh khớp bừa bãi)
    matched = dbProjects.find(p => {
      const dbClean = cleanName(p.project_name);
      if (dbClean.length < 15) return false;
      return cleanExcelName.includes(dbClean) || dbClean.includes(cleanExcelName);
    });
    return matched || null;
  }

  function findEmployee(nameFromExcel) {
    if (!nameFromExcel) return null;
    let cleanExcelName = nameFromExcel.trim().toLowerCase();
    if (employeeOverride[cleanExcelName]) {
      cleanExcelName = employeeOverride[cleanExcelName].toLowerCase();
    }
    let matched = dbEmployees.find(e => e.full_name.toLowerCase().trim() === cleanExcelName);
    if (matched) return matched;
    
    matched = dbEmployees.find(e => {
      const dbClean = e.full_name.toLowerCase().trim();
      return dbClean.includes(cleanExcelName) || cleanExcelName.includes(dbClean);
    });
    return matched || null;
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Bản sao của KQ Tháng 5- KH Thán'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let mdContent = `# Bảng Đề xuất Công việc Phòng Hành chính - Tổng hợp Tháng 5 & Tháng 6 để người dùng phê duyệt\n\n`;
  mdContent += `Tài liệu này tổng hợp toàn bộ các công việc được bóc tách từ tệp Excel báo cáo của phòng Hành chính - Tổng hợp (HC-TH) và đã được chạy qua bộ giải thuật so khớp tự động nhân viên, dự án. Vui lòng kiểm tra kỹ trước khi tôi ghi vào cơ sở dữ liệu.\n\n`;

  // --- PHẦN 1: THÁNG 5 (THỰC HIỆN) ---
  mdContent += `## 📅 Tháng 5 (Thực hiện)\n\n`;
  mdContent += `| STT | Khu vực | Tên gốc Dự án/Nhiệm vụ (Excel) | Dự án Ánh xạ (Hệ thống) | Tiêu đề Công việc | Diễn giải/Mô tả | Cán bộ Phụ trách | Trạng thái | Hạn chót |\n`;
  mdContent += `|---|---|---|---|---|---|---|---|---|\n`;

  let currentOfficeMay = 'VP tỉnh';
  let counterMay = 1;

  // HC-TH Tháng 5: hàng index 6 đến 131 (hàng 7 đến 132)
  for (let idx = 6; idx <= 131; idx++) {
    const row = rows[idx];
    if (!row) continue;
    
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim(); // Nội dung công việc
    const col2 = String(row[2] || '').trim(); // Kết quả đầu ra
    const assigneeCol = row[4]; // Cán bộ phụ trách (Cột E)

    // Bỏ qua dòng thống kê rỗng/tiêu đề tổng hợp không có người phụ trách
    if (!col1 && !assigneeCol) {
      continue;
    }
    
    const isHeaderRow = col1.includes('KẾT QUẢ THỰC HIỆN') || col1.includes('Công tác Hành chính') || col1.includes('Tham mưu tổng hợp') || col1.includes('Công tác tổ chức') || col1.includes('Công tác quản trị') || col1.includes('Công tác Kế toán') || col1.includes('Công tác Văn phòng');
    if (isHeaderRow && !assigneeCol) {
      continue;
    }

    // Bỏ qua các dòng chỉ chứa STT phụ hoặc dòng rác không có cán bộ phụ trách
    const isStatsRow = col1.startsWith('Số công trình') || col1.startsWith('Số dự án') || col1.startsWith('Đăng ký số') || col1.startsWith('Đăng ký Số') || col1.includes('dự án hoàn thành') || col1.includes('duyệt Quyết toán');
    if (isStatsRow && !assigneeCol) {
      continue;
    }

    // Chỉ lấy các dòng có Cán bộ phụ trách (assigneeCol)
    if (assigneeCol) {
      const rawDate = row[3];
      const rawResult = row[7] ? String(row[7]).trim() : '';

      // So khớp dự án thông minh
      let matchedProj = findProject(col1);
      if (!matchedProj && col2 && !/^\d+$/.test(col2.trim()) && col2.trim().length > 10) {
        matchedProj = findProject(col2);
      }

      const projectStr = matchedProj 
        ? `**[${matchedProj.project_id}]**<br>${matchedProj.project_name}` 
        : `<span style="color:gray;">🏢 Việc Nội bộ (Không khớp dự án)</span>`;

      // Tiêu đề & Diễn giải/Mô tả
      let title = col1;
      let desc = col2 ? `Kết quả đầu ra: ${col2}` : '';

      title = title.replace(/^-\s*/, '').trim();

      // Ngày hoàn thành
      const dueDate = excelDateToISO(rawDate, '2026-05-31');

      // Nhân viên phụ trách
      let assigneeStr = '';
      const rawAssignees = String(assigneeCol).replace(/\r?\n/g, '/').replace(/,/g, '/').replace(/;/g, '/').split('/');
      const mappedAssignees = [];
      
      rawAssignees.forEach((name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;
        const emp = findEmployee(trimmedName);
        if (emp) {
          mappedAssignees.push(`${emp.full_name} (${emp.employee_id})`);
        } else {
          mappedAssignees.push(`<span style="color:red;">⚠️ ${trimmedName} (Không tìm thấy)</span>`);
        }
      });
      assigneeStr = mappedAssignees.join('<br>');

      // Trạng thái
      let statusStr = '`incomplete` (Chưa hoàn thành)';
      if (rawResult.toLowerCase().includes('hoàn thành') && !rawResult.toLowerCase().includes('chưa')) {
        statusStr = '`done` (Hoàn thành)';
      }

      mdContent += `| ${counterMay} | ${currentOfficeMay} | ${cleanMarkdownCell(col1)} | ${projectStr} | ${cleanMarkdownCell(title)} | ${cleanMarkdownCell(desc)} | ${assigneeStr} | ${statusStr} | \`${dueDate}\` |\n`;
      counterMay++;
    }
  }

  mdContent += `\n`;

  // --- PHẦN 2: THÁNG 6 (KẾ HOẠCH) ---
  mdContent += `## 📅 Tháng 6 (Kế hoạch)\n\n`;
  mdContent += `| STT | Khu vực | Tên gốc Dự án/Nhiệm vụ (Excel) | Dự án Ánh xạ (Hệ thống) | Tiêu đề Công việc | Diễn giải/Mô tả | Cán bộ Phụ trách | Trạng thái | Hạn chót |\n`;
  mdContent += `|---|---|---|---|---|---|---|---|---|\n`;

  let currentOfficeJune = 'VP tỉnh';
  let counterJune = 1;

  // HC-TH Tháng 6: hàng index 134 đến 219 (hàng 135 đến 220)
  for (let idx = 134; idx <= 219; idx++) {
    const row = rows[idx];
    if (!row) continue;

    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim(); // Nội dung công việc
    const col2 = String(row[2] || '').trim(); // Kết quả đầu ra / Diễn giải
    const assigneeCol = row[4]; // Cán bộ phụ trách (Cột E)

    // Bỏ qua dòng thống kê rỗng/tiêu đề tổng hợp không có người phụ trách
    if (!col1 && !assigneeCol) {
      continue;
    }

    const isHeaderRow = col1.includes('KẾ HOẠCH THỰC HIỆN') || col1.includes('Công tác Hành chính') || col1.includes('Tham mưu tổng hợp') || col1.includes('Công tác tổ chức') || col1.includes('Công tác quản trị') || col1.includes('Công tác Kế toán') || col1.includes('Công tác Văn phòng');
    if (isHeaderRow && !assigneeCol) {
      continue;
    }

    const isStatsRow = col1.startsWith('Số công trình') || col1.startsWith('Số dự án') || col1.startsWith('Đăng ký số') || col1.startsWith('Đăng ký Số') || col1.includes('dự án hoàn thành') || col1.includes('duyệt Quyết toán');
    if (isStatsRow && !assigneeCol) {
      continue;
    }

    // Chỉ lấy dòng có Cán bộ phụ trách
    if (assigneeCol) {
      const rawDate = row[3];

      // So khớp dự án thông minh
      let matchedProj = findProject(col1);
      if (!matchedProj && col2 && !/^\d+$/.test(col2.trim()) && col2.trim().length > 10) {
        matchedProj = findProject(col2);
      }

      const projectStr = matchedProj 
        ? `**[${matchedProj.project_id}]**<br>${matchedProj.project_name}` 
        : `<span style="color:gray;">🏢 Việc Nội bộ (Không khớp dự án)</span>`;

      // Tiêu đề & Diễn giải/Mô tả
      let title = col1;
      let desc = col2 ? `Kết quả đầu ra: ${col2}` : '';

      title = title.replace(/^-\s*/, '').trim();

      // Ngày hoàn thành
      const dueDate = excelDateToISO(rawDate, '2026-06-30');

      // Nhân viên phụ trách
      let assigneeStr = '';
      const rawAssignees = String(assigneeCol).replace(/\r?\n/g, '/').replace(/,/g, '/').replace(/;/g, '/').split('/');
      const mappedAssignees = [];
      
      rawAssignees.forEach((name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;
        const emp = findEmployee(trimmedName);
        if (emp) {
          mappedAssignees.push(`${emp.full_name} (${emp.employee_id})`);
        } else {
          mappedAssignees.push(`<span style="color:red;">⚠️ ${trimmedName} (Không tìm thấy)</span>`);
        }
      });
      assigneeStr = mappedAssignees.join('<br>');

      mdContent += `| ${counterJune} | ${currentOfficeJune} | ${cleanMarkdownCell(col1)} | ${projectStr} | ${cleanMarkdownCell(title)} | ${cleanMarkdownCell(desc)} | ${assigneeStr} | \`todo\` (Chưa bắt đầu) | \`${dueDate}\` |\n`;
      counterJune++;
    }
  }

  fs.writeFileSync(outputMdPath, mdContent, 'utf8');
  console.log(`✓ Đã tạo thành công file Markdown tại: ${outputMdPath}`);
}

generateTable();
