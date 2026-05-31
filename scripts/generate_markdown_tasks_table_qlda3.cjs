const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/25.5.2026_QLDA3_ BC kết quả thực hiện tháng 5_ kế hoạch tháng 6.2026 QLDA3.xlsx';
const outputMdPath = 'C:/Users/nguye/.gemini/antigravity/brain/40581c48-7bf8-4be2-bf91-d42b86bee31e/proposed_tasks_table_qlda3.md';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Bộ ánh xạ sửa lỗi nhân sự viết tắt/lệch dấu của QLDA 3
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
  'ng thị hồng hạnh': 'Nguyễn Thị Hồng Hạnh'
};

// Bộ ánh xạ ép khớp dự án thủ công cho các trường hợp lệch tên của QLDA 3
const projectOverride = {
  'cải thiện cơ sở hạ tầng đô thị hương khê': '7853204',
  'cải thiện cơ sở hạ tầng đô thị thạch hà': '7786649',
  'đê tả nghèn': '7933742',
  'quảng trường biển cửa sót': '8039671',
  'đường gtnt xã hương long': '8053446',
  'khu công nghiệp bắc thạch hà': '7702138',
  'đỉnh bàn': '8119291',
  'nâng cấp tuyến đường trục xã tx.01': '8119291',
  'đê hữu phủ': '7868256',
  'khắc phục, nâng cấp đê hữu phủ': '7868256',
  'đường trục ngang ven biển huyện thạch hà': '7936829',
  'trường thcs nguyễn thiếp': '8128529',
  'nguyễn thiếp': '8128529',
  'kênh tiêu cầu trung nghĩa': '8119947',
  'trung nghĩa': '8119947',
  'huyện lộ 92': '7944311',
  'đh92': '7944311',
  'đh.87': '7999325',
  'đường huyện lộ 2': '7999325',
  'thác vũ môn': '7947023',
  'an ninh biên giới': '7947023',
  'vũ môn': '7947023',
  'xã hòa hải': '7935693',
  'biên giơi xã hòa hải': '7935693',
  'tránh lũ kết hợp vào khu xử lý chất thải rắn': '7959538',
  'trục chính xã phú phong': '8080489',
  'xã phú phong': '8080489',
  'xã hương trà': '8080492',
  'cụm công nghiệp gia phố': '8075141'
};

const activeConstructionProjects = [
  '7933742', // Đê Tả Nghèn Lộc Hà
  '8039671', // Quảng trường biển Cửa Sót
  '8053446', // GTNT Hương Long
  '7868256', // Đê Hữu Phủ
  '7936829', // Đường trục ngang ven biển Thạch Hà
  '8128529', // THCS Nguyễn Thiếp
  '8119947', // Kênh tiêu cầu Trung Nghĩa
  '7944311', // Huyện lộ 92 Hương Khê
  '7999325', // ĐH.87 Hương Khê
  '7947023', // Thác Vũ Môn
  '7935693', // Hòa Hải Hương Khê
  '7959538', // Tránh lũ Hương Thủy
  '8080489', // Phú Phong
  '8080492', // Hương Trà
  '8075141', // Cụm CN Gia Phố
  '7853204', // Cải thiện CSHT đô thị Hương Khê (phần thi công)
  '7786649'  // Cải thiện CSHT đô thị Thạch Hà (phần thi công)
];

function cleanOffice(officeName) {
  if (!officeName) return 'VP tỉnh';
  const name = officeName.trim();
  const cleanName = name.replace(/^[I|V|X|\d]+\.\s*/i, '').trim();
  
  if (
    cleanName === 'Văn phòng' || 
    cleanName === 'Phòng QLDA 3' || 
    cleanName === 'Chung' || 
    cleanName === 'Phòng QLDA3'
  ) {
    return 'VP tỉnh';
  }
  if (cleanName === 'KHU VỰC THẠCH HÀ' || cleanName === 'Thạch Hà' || cleanName.includes('Thạch Hà')) {
    return 'VP Thạch Hà';
  }
  if (cleanName === 'KHU VỰC HƯƠNG KHÊ' || cleanName === 'Hương Khê' || cleanName.includes('Hương Khê')) {
    return 'VP Hương Khê';
  }
  return cleanName;
}

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
  const sheet = workbook.Sheets['Tháng 5.26_KH tháng 6.26'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let mdContent = `# Bảng Đề xuất Công việc Phòng QLDA 3 Tháng 5 & Tháng 6 để người dùng phê duyệt\n\n`;
  mdContent += `Tài liệu này tổng hợp toàn bộ các công việc được bóc tách từ tệp Excel báo cáo của phòng QLDA 3 và đã được chạy qua bộ giải thuật so khớp tự động dự án, nhân viên. Vui lòng kiểm tra kỹ trước khi tôi ghi vào cơ sở dữ liệu.\n\n`;

  // --- PHẦN 1: THÁNG 5 (THỰC HIỆN) ---
  mdContent += `## 📅 Tháng 5 (Thực hiện)\n\n`;
  mdContent += `| STT | Khu vực | Tên gốc Dự án (Excel) | Dự án Ánh xạ (Hệ thống) | Tiêu đề Công việc | Diễn giải/Mô tả | Cán bộ Phụ trách | Trạng thái | Hạn chót |\n`;
  mdContent += `|---|---|---|---|---|---|---|---|---|\n`;

  let currentOfficeMay = 'VP tỉnh';
  let counterMay = 1;

  for (let idx = 297; idx < 315; idx++) {
    const row = rows[idx];
    if (!row) continue;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();

    // Nhận diện phân nhóm khu vực (Thạch Hà / Hương Khê)
    if (col0 === '' && col1 && (col1.includes('THẠCH HÀ') || col1.includes('HƯƠNG KHÊ'))) {
      currentOfficeMay = cleanOffice(col1);
      continue;
    }

    const assigneeCol = row[4];
    const rawCol1 = row[1] ? String(row[1]).trim() : '';

    // Bỏ qua dòng thống kê số lượng tổng hợp rác không có cán bộ phụ trách
    const isStatsRow = rawCol1.startsWith('Số công trình') || rawCol1.startsWith('Số dự án') || rawCol1.startsWith('Đăng ký số') || rawCol1.startsWith('Đăng ký Số');
    if (isStatsRow && !assigneeCol) {
      continue;
    }

    const isNumberTT = /^\d+(\.\d+)?$/.test(col0) || col0 === 'null' || col1.includes('Cải tạo nâng cấp') || (col0 === '' && col1 && assigneeCol);
    if (isNumberTT || (col1 && assigneeCol)) {
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

      // Đối với dòng 311 (Số công trình dự án đang triển khai), đây là phần thi công của các dự án
      const isTrienKhaiSection = rawCol1.includes('đang triển khai') || idx === 311;

      if (matchedProj) {
        if (activeConstructionProjects.includes(matchedProj.project_id) || isTrienKhaiSection) {
          title = 'Giám sát thi công';
        } else {
          title = rawCol2 || rawCol1;
        }
        desc = `Nhiệm vụ đầu ra: ${rawCol2}`;
      } else {
        if (isTrienKhaiSection) {
          title = 'Giám sát thi công';
          desc = rawCol2 || rawCol1;
        } else {
          title = rawCol1;
          desc = rawCol2;
        }
      }

      // Ngày hoàn thành
      const dueDate = excelDateToISO(rawDate, '2026-05-31');

      // Nhân viên phụ trách
      let assigneeStr = '';
      if (assigneeCol) {
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
      } else {
        assigneeStr = `<span style="color:gray;">(Chưa phân công)</span>`;
      }

      // Trạng thái
      let statusStr = '`incomplete` (Chưa hoàn thành)';
      if (rawResult.toLowerCase().includes('hoàn thành') && !rawResult.toLowerCase().includes('chưa')) {
        statusStr = '`done` (Hoàn thành)';
      }

      mdContent += `| ${counterMay} | ${currentOfficeMay} | ${cleanMarkdownCell(rawCol1)} | ${projectStr} | ${cleanMarkdownCell(title)} | ${cleanMarkdownCell(desc)} | ${assigneeStr} | ${statusStr} | \`${dueDate}\` |\n`;
      counterMay++;
    }
  }

  mdContent += `\n`;

  // --- PHẦN 2: THÁNG 6 (KẾ HOẠCH) ---
  mdContent += `## 📅 Tháng 6 (Kế hoạch)\n\n`;
  mdContent += `| STT | Khu vực | Tên gốc Dự án (Excel) | Dự án Ánh xạ (Hệ thống) | Tiêu đề Công việc | Diễn giải/Mô tả | Cán bộ Phụ trách | Trạng thái | Hạn chót |\n`;
  mdContent += `|---|---|---|---|---|---|---|---|---|\n`;

  let currentOfficeJune = 'VP tỉnh';
  let counterJune = 1;

  for (let idx = 511; idx <= 547; idx++) {
    const row = rows[idx];
    if (!row) continue;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();

    // Nhận diện phân nhóm khu vực (Thạch Hà / Hương Khê)
    if (col0 === '' && col1 && (col1.includes('THẠCH HÀ') || col1.includes('HƯƠNG KHÊ'))) {
      currentOfficeJune = cleanOffice(col1);
      continue;
    }

    const assigneeCol = row[4];
    const rawCol1 = row[1] ? String(row[1]).trim() : '';

    // Bỏ qua dòng thống kê số lượng tổng hợp rác không có cán bộ phụ trách
    const isStatsRow = rawCol1.startsWith('Số công trình') || rawCol1.startsWith('Số dự án') || rawCol1.startsWith('Đăng ký số') || rawCol1.startsWith('Đăng ký Số');
    if (isStatsRow && !assigneeCol) {
      continue;
    }

    const isNumberJune = /^\d+(\.\d+)?$/.test(col0) || col0 === 'null' || (col0 === '' && assigneeCol && row[2]) || (col1 && assigneeCol);
    if (isNumberJune) {
      const rawCol2 = row[2] ? String(row[2]).trim() : '';
      const rawDate = row[3];

      // Bỏ qua dòng tiêu đề rỗng hoặc tổng giải ngân/tài sản phụ
      if (rawCol1.includes('KẾ HOẠCH THỰC HIỆN CÁC DỰ ÁN') || rawCol1.includes('KHU VỰC THẠCH HÀ') || rawCol1.includes('KHU VỰC HƯƠNG KHÊ')) {
        continue;
      }

      // So khớp dự án
      const matchedProj = findProject(rawCol1);
      const projectStr = matchedProj 
        ? `**[${matchedProj.project_id}]**<br>${matchedProj.project_name}` 
        : `<span style="color:orange;">⚠️ Việc Nội bộ (Không khớp dự án)</span>`;

      // Tiêu đề & Mô tả
      let title = '';
      let desc = '';

      // Các công việc nằm ở phần kế hoạch thi công (dòng >= 526) chắc chắn là giám sát thi công
      const isThiCongSection = idx >= 526;

      if (matchedProj) {
        if (activeConstructionProjects.includes(matchedProj.project_id) || isThiCongSection) {
          title = 'Giám sát thi công';
        } else {
          title = rawCol2 || rawCol1;
        }
        desc = `Nhiệm vụ đầu ra: ${rawCol2}`;
      } else {
        if (isThiCongSection) {
          title = 'Giám sát thi công';
          desc = rawCol2 || rawCol1;
        } else {
          title = rawCol1;
          desc = rawCol2;
        }
      }

      // Ngày hoàn thành
      const dueDate = excelDateToISO(rawDate, '2026-06-30');

      // Nhân viên phụ trách
      let assigneeStr = '';
      if (assigneeCol) {
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
      } else {
        assigneeStr = `<span style="color:gray;">(Chưa phân công)</span>`;
      }

      mdContent += `| ${counterJune} | ${currentOfficeJune} | ${cleanMarkdownCell(rawCol1)} | ${projectStr} | ${cleanMarkdownCell(title)} | ${cleanMarkdownCell(desc)} | ${assigneeStr} | \`todo\` (Chưa bắt đầu) | \`${dueDate}\` |\n`;
      counterJune++;
    }
  }

  fs.writeFileSync(outputMdPath, mdContent, 'utf8');
  console.log(`✓ Đã tạo thành công file Markdown tại: ${outputMdPath}`);
}

generateTable();
