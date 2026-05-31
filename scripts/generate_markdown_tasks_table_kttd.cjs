const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/KTTĐ. BÁO CÁO THÁNG 5.2026.xlsx';
const outputMdPath = 'C:/Users/nguye/.gemini/antigravity/brain/40581c48-7bf8-4be2-bf91-d42b86bee31e/proposed_tasks_table_kttd.md';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Bộ ánh xạ sửa lỗi nhân sự viết tắt/lệch dấu của KTTĐ (Áp dụng thêm chuẩn hóa NFC)
const employeeOverride = {
  'ngô đức quy': 'Ngô đức Quy',
  'ngô đức quy': 'Ngô đức Quy'
};

// Bộ ánh xạ dự án thủ công cho KTTĐ
const projectOverride = {
  'trường phổ thông nội trú liên cấp tiểu học và trung học cơ sở hương khê': '8173864',
  'trường nội trú liên cấp hương khê': '8173864',
  'khu lưu niệm hà huy tập': '8160731',
  'khu mộ tbt hà huy tập': '8155078',
  'hà huy tập': '8160731',
  'khánh vĩnh yên - thanh lộc': '8042041',
  'đường giao thông liên xã khánh vĩnh yên': '8042041',
  'bắc thạch hà': '8133114',
  'thủy lợi bên ngoài ranh giới': '8133114',
  'đô thị thạch hà': '7786649',
  'cải thiện cơ sở hạ tầng đô thị thạch hà': '7786649',
  'khu lưu niệm tổng bí thư trần phú': '8160730',
  'khu di tích cố tổng bí thư trần phú': '8079695',
  'đường đh.132 cẩm hưng - cẩm lộc': '7938940',
  'cẩm hưng - cẩm lộc': '7938940',
  'đường phạm lê đức': '7972205',
  'phạm lê đức': '7972205',
  'đô thị hương khê': '7853204',
  'cải thiện cơ sở hạ tầng đô thị hương khê': '7853204',
  'nâng cấp mở rộng tuyến đường huyện dh 90': '7944311',
  'dh 90': '7944311',
  'rừng ngập mặn': '7767755',
  'đường giao thông xã cẩm quang': '8153850'
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
  return n.toString().normalize('NFC').toLowerCase()
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
      'góp ý đề xuất', 'sửa đổi pháp luật', 'tham mưu văn bản', 'tuyên truyền', 'ý kiến tham mưu',
      'cập nhật kế hoạch khung', 'thẩm định lưu kho', 'quy trình thẩm định', 'chi phí vận hành'
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
    // Chuẩn hóa NFC tiếng Việt để xử lý triệt để lệch unicode tổ hợp/dựng sẵn
    let cleanExcelName = nameFromExcel.toString().normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
    
    if (employeeOverride[cleanExcelName]) {
      cleanExcelName = employeeOverride[cleanExcelName].normalize('NFC').toLowerCase();
    }
    
    let matched = dbEmployees.find(e => e.full_name.normalize('NFC').toLowerCase().trim() === cleanExcelName);
    if (matched) return matched;
    
    matched = dbEmployees.find(e => {
      const dbClean = e.full_name.normalize('NFC').toLowerCase().trim();
      return dbClean.includes(cleanExcelName) || cleanExcelName.includes(dbClean);
    });
    return matched || null;
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Tháng 5 KTTĐ'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let mdContent = `# Bảng Đề xuất Công việc Phòng Kỹ thuật Thẩm định Tháng 5 để người dùng phê duyệt\n\n`;
  mdContent += `Tài liệu này tổng hợp toàn bộ các công việc được bóc tách từ tệp Excel báo cáo của phòng Kỹ thuật Thẩm định (KTTĐ) và đã được chạy qua bộ giải thuật so khớp tự động nhân viên, dự án. Vui lòng kiểm tra kỹ trước khi tôi ghi vào cơ sở dữ liệu.\n\n`;
  mdContent += `> [!NOTE]\n`;
  mdContent += `> Tệp Excel của phòng KTTĐ chỉ chứa báo cáo kết quả thực hiện **Tháng 5/2026** và không có kế hoạch Tháng 6. Do đó, bảng đề xuất này chỉ hiển thị dữ liệu Tháng 5.\n\n`;

  // --- PHẦN 1: THÁNG 5 (THỰC HIỆN) ---
  mdContent += `## 📅 Tháng 5 (Thực hiện)\n\n`;
  mdContent += `| STT | Khu vực | Tên gốc Dự án/Nhiệm vụ (Excel) | Dự án Ánh xạ (Hệ thống) | Tiêu đề Công việc | Diễn giải/Mô tả | Cán bộ Phụ trách | Trạng thái | Hạn chót |\n`;
  mdContent += `|---|---|---|---|---|---|---|---|---|\n`;

  let currentOfficeMay = 'VP tỉnh';
  let counterMay = 1;

  // KTTĐ Tháng 5: hàng index 5 đến 77 (hàng 6 đến 78)
  for (let idx = 5; idx <= 77; idx++) {
    const row = rows[idx];
    if (!row) continue;
    
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim(); // Nội dung công việc
    const col2 = String(row[2] || '').trim(); // Kết quả đầu ra
    const assigneeCol = row[4]; // Cán bộ phụ trách (Cột E)

    // Bỏ qua dòng rác/dòng tiêu đề tổng hợp không có người phụ trách hoặc assignee ghi phân công
    if (!col1 && !assigneeCol) {
      continue;
    }
    
    if (assigneeCol === 'Theo phân công của phụ trách phòng') {
      continue;
    }

    // Chỉ lấy các dòng có Cán bộ phụ trách (assigneeCol)
    if (assigneeCol && assigneeCol.trim() !== '') {
      const rawDate = row[3];
      const rawResult = row[7] ? String(row[7]).trim() : '';
      const rawReason = row[8] ? String(row[8]).trim() : '';

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

  fs.writeFileSync(outputMdPath, mdContent, 'utf8');
  console.log(`✓ Đã tạo thành công file Markdown tại: ${outputMdPath}`);
}

generateTable();
