const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/PTDV-BAN QLDA DD_HTKV BÁO CÁO THÁNG 5. KH tháng 6.xlsx';
const outputMdPath = 'C:/Users/nguye/.gemini/antigravity/brain/40581c48-7bf8-4be2-bf91-d42b86bee31e/proposed_tasks_table_ptdv.md';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Bộ ánh xạ sửa lỗi nhân sự viết tắt/lệch dấu của PTDV
const employeeOverride = {
  'nguyễn  thị hồng lam': 'Nguyễn Thị Hồng Lam',
  'nguyễn thị hồng lam': 'Nguyễn Thị Hồng Lam',
  'nguyễn  thị hồng lam ': 'Nguyễn Thị Hồng Lam',
  'nguyễn thị hồng lam ': 'Nguyễn Thị Hồng Lam',
  'trương bá thuận': 'Trương Bá Thuận',
  'đào xuân hiên': 'Đào Xuân Hiên',
  'lê bạch long': 'Lê Bạch Long',
  'nguyễn thanh bình': 'Nguyễn Thanh Bình',
  'trần ngọc bảo': 'Trần Ngọc Bảo',
  'bùi nam sơn': 'Bùi Nam Sơn',
  'võ mạnh hà': 'Võ Mạnh Hà',
  'nguyễn thị vân': 'Nguyễn Thị Vân'
};

// Bộ ánh xạ dự án thủ công cho PTDV
const projectOverride = {
  'rừng ngập mặn': '7767755',
  'iwmc': '7767755',
  'tiểu học hà huy tập cẩm hưng': '8064109',
  'đường cạnh trường tiểu học hà huy tập': '8064109',
  'tân phong đi thôn bắc hải': '7660122',
  'thạch khê': '7660122',
  'quốc lộ 15b': '8119291',
  '15b': '8119291',
  'lộc yên': '7767760',
  'cây ăn quả lộc yên': '7767760'
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
      'báo cáo theo yêu cầu', '1 số báo cáo', 'phối hợp thực hiện', 'tiếp cận triển khai'
    ];
    
    for (const kw of ignoreKeywords) {
      if (cleanExcelName.includes(kw)) {
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
    
    // 3. Khớp tương đối chặt chẽ
    matched = dbProjects.find(p => {
      const dbClean = cleanName(p.project_name);
      if (dbClean.length < 15) return false;
      return cleanExcelName.includes(dbClean) || dbClean.includes(cleanExcelName);
    });
    return matched || null;
  }

  function findEmployee(nameFromExcel) {
    if (!nameFromExcel) return null;
    // Chuẩn hóa khoảng trắng thừa trước
    let cleanExcelName = nameFromExcel.replace(/\s+/g, ' ').trim().toLowerCase();
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
  const sheet = workbook.Sheets['Tháng 06-PTDV'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let mdContent = `# Bảng Đề xuất Công việc Phòng Phát triển dịch vụ Tháng 5 & Tháng 6 để người dùng phê duyệt\n\n`;
  mdContent += `Tài liệu này tổng hợp toàn bộ các công việc được bóc tách từ tệp Excel báo cáo của phòng Phát triển dịch vụ (PTDV) và đã được chạy qua bộ giải thuật so khớp tự động nhân viên, dự án. Vui lòng kiểm tra kỹ trước khi tôi ghi vào cơ sở dữ liệu.\n\n`;

  // --- PHẦN 1: THÁNG 5 (THỰC HIỆN) ---
  mdContent += `## 📅 Tháng 5 (Thực hiện)\n\n`;
  mdContent += `| STT | Khu vực | Tên gốc Dự án/Nhiệm vụ (Excel) | Dự án Ánh xạ (Hệ thống) | Tiêu đề Công việc | Diễn giải/Mô tả | Cán bộ Phụ trách | Trạng thái | Hạn chót |\n`;
  mdContent += `|---|---|---|---|---|---|---|---|---|\n`;

  let currentOfficeMay = 'VP tỉnh';
  let counterMay = 1;

  // PTDV Tháng 5: hàng index 10 đến 22 (hàng 11 đến 23)
  for (let idx = 10; idx <= 22; idx++) {
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

  // PTDV Tháng 6: hàng index 37 đến 49 (hàng 38 đến 50)
  for (let idx = 37; idx <= 49; idx++) {
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
