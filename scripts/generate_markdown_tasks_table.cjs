const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/QLDA1_BÁO CÁO THÁNG 05_KẾ HOẠCH THÁNG 06.2026 (1).xlsx';
const outputMdPath = 'C:/Users/nguye/.gemini/antigravity/brain/40581c48-7bf8-4be2-bf91-d42b86bee31e/proposed_tasks_table.md';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Bộ ánh xạ sửa lỗi nhân sự viết tắt/lệch dấu
const employeeOverride = {
  'pham chí công': 'Phạm Chí Công',
  'lê tùng nguyền': 'Lê Tùng Nguyên'
};

// Bộ ánh xạ ép khớp dự án thủ công cho các trường hợp lệch tên
const projectOverride = {
  'nhà lưu niệm': '8155075', // Xây dựng Nhà lưu niệm, Nhà tưởng niệm tại khu lưu niệm Tổng Bí thư Trần Phú
  'mộ tổng bí thư trần phú': '8155076', // Dự án xây dựng, tôn tạo một số hạng mục tại Khu mộ Tổng Bí Thư Trần Phú
  'nhà tranh': '8155077', // Tôn tạo Nhà lưu niệm, Nhà tưởng niệm, Nhà tranh tại khu lưu niệm Tổng Bí thư Hà HUy Tập
  'mộ tổng bí thư hà huy tập': '8155078', // Dự án xây dựng, tôn tạo một số hạng mục tại Khu mộ Tổng Bí Thư Hà Huy Tập
  'trường tiểu học đức lĩnh': '8117230' // Nhà học bộ môn 02 tầng 8 phòng và các hạng mục phụ trợ trường Tiểu học Đức Lĩnh
};

// Các dự án đang thi công/tu bổ, cần chuẩn hóa tiêu đề công việc là "Giám sát thi công"
const activeConstructionProjects = [
  '8155075', // Trần Phú Nhà lưu niệm
  '8160730', // Trần Phú HTKT
  '8155076', // Trần Phú Khu mộ
  '8155077', // Hà Huy Tập Nhà lưu niệm
  '8160731', // Hà Huy Tập HTKT
  '8155078', // Hà Huy Tập Khu mộ
  '8173865', // Trường Sơn Kim 1
  '8173864', // Trường Hương Khê
  '7872498'  // Hồ sinh thái Đồng Lộc
];

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
    
    // 3. Khớp tương đối
    matched = dbProjects.find(p => {
      const dbClean = cleanName(p.project_name);
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
  const sheetConfigs = [
    {
      sheetName: 'Thang 05- KH thang 06.2026',
      targetSection: 'ACTUAL',
      monthLabel: 'Tháng 5 (Thực hiện)',
      defaultStart: '2026-05-01',
      defaultDue: '2026-05-31',
      isPlan: false
    },
    {
      sheetName: 'Thang 05- KH thang 06.2026',
      targetSection: 'PLAN',
      monthLabel: 'Tháng 6 (Kế hoạch)',
      defaultStart: '2026-06-01',
      defaultDue: '2026-06-30',
      isPlan: true
    }
  ];

  let mdContent = `# Bảng Đề xuất Công việc Tháng 5 & Tháng 6 (BẢN CHUẨN ĐÃ ĐỒNG BỘ MÔ TẢ HÀNH CHÍNH) để người dùng phê duyệt\n\n`;
  mdContent += `Tài liệu này tổng hợp toàn bộ các công việc được bóc tách từ tệp Excel báo cáo của phòng QLDA 1 và đã được chạy qua bộ giải thuật so khớp tự động dự án, nhân viên. Vui lòng kiểm tra kỹ trước khi tôi ghi vào cơ sở dữ liệu.\n\n`;

  // Bộ nhớ tạm để đồng bộ mô tả hành chính từ Tháng 5 sang Tháng 6
  const adminTaskDescCache = {};

  sheetConfigs.forEach((config) => {
    mdContent += `## 📅 ${config.monthLabel}\n\n`;
    mdContent += `| STT | Khu vực | Tên gốc Dự án (Excel) | Dự án Ánh xạ (Hệ thống) | Tiêu đề Công việc | Diễn giải/Mô tả | Cán bộ Phụ trách | Trạng thái | Hạn chót |\n`;
    mdContent += `|---|---|---|---|---|---|---|---|---|\n`;

    const sheet = workbook.Sheets[config.sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    let currentSection = '';
    let currentOffice = 'Chung';
    let counter = 1;

    rows.forEach((row, idx) => {
      if (idx < 6) return;
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();

      if (col0 === 'A') {
        currentSection = 'ACTUAL';
        return;
      } else if (col0 === 'B') {
        currentSection = 'PLAN';
        return;
      }

      if (col0 === '' && col1 && !col1.includes('C. Kết luận') && !col1.includes('I. Báo cáo') && !col1.includes('II. Kế hoạch') && !col1.includes('III. Đánh giá') && !col1.includes('Trong đó:')) {
        currentOffice = col1;
        return;
      }

      if (currentSection !== config.targetSection) return;

      const isNumberTT = /^\d+$/.test(col0);
      const assigneeCol = row[4];

      if (isNumberTT && assigneeCol) {
        const rawCol1 = row[1] ? String(row[1]).trim() : '';
        const rawCol2 = row[2] ? String(row[2]).trim() : '';
        const rawDate = row[3];
        const rawResult = row[7] ? String(row[7]).trim() : '';

        // So khớp dự án
        const matchedProj = findProject(rawCol1);
        const projectStr = matchedProj 
          ? `**[${matchedProj.project_id}]**<br>${matchedProj.project_name}` 
          : `<span style="color:orange;">⚠️ Việc Nội bộ (Không khớp dự án)</span>`;

        // Tiêu đề & Mô tả
        let title = '';
        let desc = '';
        
        // So khớp nhân viên chính để phục vụ đồng bộ cache hành chính
        const rawAssignees = String(assigneeCol).split('/');
        const mappedAssigneeIds = [];
        rawAssignees.forEach((name) => {
          const emp = findEmployee(name);
          if (emp) mappedAssigneeIds.push(emp.employee_id);
        });
        const primaryAssigneeId = mappedAssigneeIds.length > 0 ? mappedAssigneeIds[0] : null;

        if (matchedProj) {
          if (activeConstructionProjects.includes(matchedProj.project_id)) {
            title = 'Giám sát thi công';
          } else {
            title = rawCol2 || rawCol1;
          }
          desc = `Nhiệm vụ đầu ra: ${rawCol2}`;
        } else {
          title = rawCol1;
          desc = rawCol2;
        }

        // Ngày hoàn thành
        const dueDate = excelDateToISO(rawDate, config.defaultDue);

        // Nhân viên hiển thị
        const mappedAssignees = rawAssignees.map(name => {
          const emp = findEmployee(name);
          return emp ? `${emp.full_name} (${emp.employee_id})` : `<span style="color:red;">⚠️ ${name} (Không tìm thấy)</span>`;
        });
        const assigneeStr = mappedAssignees.join('<br>');

        // Trạng thái
        let statusStr = '`todo` (Chưa bắt đầu)';
        if (!config.isPlan) {
          if (rawResult.toLowerCase().includes('hoàn thành') && !rawResult.toLowerCase().includes('chưa')) {
            statusStr = '`done` (Hoàn thành)';
          } else {
            statusStr = '`incomplete` (Chưa hoàn thành)';
          }
        }

        // Ghi hàng vào Markdown
        mdContent += `| ${counter} | ${currentOffice} | ${cleanMarkdownCell(rawCol1)} | ${projectStr} | ${cleanMarkdownCell(title)} | ${cleanMarkdownCell(desc)} | ${assigneeStr} | ${statusStr} | \`${dueDate}\` |\n`;
        counter++;
      }
    });

    mdContent += `\n`;
  });

  fs.writeFileSync(outputMdPath, mdContent, 'utf8');
  console.log(`✓ Đã tạo thành công file Markdown tại: ${outputMdPath}`);
}

generateTable();
