const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/PTDV-BAN QLDA DD_HTKV BÁO CÁO THÁNG 5. KH tháng 6.xlsx';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Lỗi: Thiếu cấu hình Supabase trong .env');
  process.exit(1);
}

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

// Chuyển đổi số serial Excel sang chuỗi YYYY-MM-DD
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
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      return cleanStr;
    }
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

// Chuẩn hóa tên để so sánh tương đối
function cleanName(n) {
  if (!n) return '';
  return n.toLowerCase()
    .replace(/[:.,\-()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function runImport() {
  console.log('=== BẮT ĐẦU QUY TRÌNH IMPORT CÔNG VIỆC PHÒNG PTDV THÁNG 5 & 6 ===\n');

  // 1. Tải danh mục dự án và nhân viên để làm bộ nhớ đệm (Cache)
  console.log('- Đang tải danh sách dự án và nhân viên từ cơ sở dữ liệu...');
  const { data: dbProjects, error: projErr } = await supabase.from('projects').select('project_id, project_name');
  const { data: dbEmployees, error: empErr } = await supabase.from('employees').select('employee_id, full_name');

  if (projErr || empErr) {
    console.error('Lỗi khi tải danh mục cache:', projErr || empErr);
    process.exit(1);
  }
  console.log(`✓ Đã tải ${dbProjects.length} dự án và ${dbEmployees.length} nhân sự.\n`);

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Tháng 06-PTDV'];
  if (!sheet) {
    console.error('⚠ Lỗi: Không tìm thấy sheet [Tháng 06-PTDV]');
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const tasksToInsert = [];

  // Helper tìm kiếm dự án tương đồng
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

  // Helper tìm kiếm nhân sự
  function findEmployee(nameFromExcel) {
    if (!nameFromExcel) return null;
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

  // --- PHẦN 1: BÓC TÁCH THÁNG 5 (THỰC HIỆN) ---
  console.log('- Đang bóc tách dữ liệu Tháng 5 (Thực hiện)...');
  let currentOfficeMay = 'VP tỉnh';

  for (let idx = 10; idx <= 22; idx++) {
    const row = rows[idx];
    if (!row) continue;
    
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim(); // Nội dung công việc
    const col2 = String(row[2] || '').trim(); // Kết quả đầu ra
    const assigneeCol = row[4]; // Cán bộ phụ trách (Cột E)

    if (!col1 && !assigneeCol) {
      continue;
    }

    if (assigneeCol) {
      const rawDate = row[3];
      const rawResult = row[7] ? String(row[7]).trim() : '';
      const rawReason = row[8] ? String(row[8]).trim() : '';

      // So khớp dự án thông minh
      let matchedProj = findProject(col1);
      if (!matchedProj && col2 && !/^\d+$/.test(col2.trim()) && col2.trim().length > 10) {
        matchedProj = findProject(col2);
      }

      const projectId = matchedProj ? matchedProj.project_id : null;
      const taskType = projectId ? 'project' : 'internal';

      // Quy đổi ngày tháng
      const dueDate = excelDateToISO(rawDate, '2026-05-31');

      // So khớp nhân viên
      const mappedAssigneeIds = [];
      const coAssigneesMetadata = [];

      const rawAssignees = String(assigneeCol).replace(/\r?\n/g, '/').replace(/,/g, '/').replace(/;/g, '/').split('/');
      rawAssignees.forEach((name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;
        const emp = findEmployee(trimmedName);
        if (emp) {
          mappedAssigneeIds.push(emp.employee_id);
          coAssigneesMetadata.push({ name: emp.full_name, employeeId: emp.employee_id });
        } else {
          coAssigneesMetadata.push({ name: trimmedName, employeeId: null });
        }
      });

      const assigneeId = mappedAssigneeIds.length > 0 ? mappedAssigneeIds[0] : null;

      // Tiêu đề & Diễn giải/Mô tả
      let title = col1;
      let description = col2 ? `Kết quả đầu ra: ${col2}` : '';

      title = title.replace(/^-\s*/, '').trim();

      // Trạng thái
      let status = 'incomplete';
      if (rawResult.toLowerCase().includes('hoàn thành') && !rawResult.toLowerCase().includes('chưa')) {
        status = 'done';
      }

      const taskPayload = {
        task_type: taskType,
        project_id: projectId,
        title: title.substring(0, 500),
        description: description,
        status: status,
        priority: 'medium',
        assignee_id: assigneeId,
        department_code: 'PTDV',
        start_date: '2026-05-01',
        due_date: dueDate,
        phase: 'execution',
        metadata: {
          office: currentOfficeMay,
          co_assignees: coAssigneesMetadata,
          raw_excel_assignee: assigneeCol || null,
          raw_excel_project: col1,
          incomplete_reason: rawReason || null
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      tasksToInsert.push(taskPayload);
    }
  }

  // --- PHẦN 2: BÓC TÁCH THÁNG 6 (KẾ HOẠCH) ---
  console.log('- Đang bóc tách dữ liệu Tháng 6 (Kế hoạch)...');
  let currentOfficeJune = 'VP tỉnh';

  for (let idx = 37; idx <= 49; idx++) {
    const row = rows[idx];
    if (!row) continue;
    
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim(); // Nội dung công việc
    const col2 = String(row[2] || '').trim(); // Kết quả đầu ra / Diễn giải
    const assigneeCol = row[4]; // Cán bộ phụ trách (Cột E)

    if (!col1 && !assigneeCol) {
      continue;
    }

    if (assigneeCol) {
      const rawDate = row[3];

      // So khớp dự án thông minh
      let matchedProj = findProject(col1);
      if (!matchedProj && col2 && !/^\d+$/.test(col2.trim()) && col2.trim().length > 10) {
        matchedProj = findProject(col2);
      }

      const projectId = matchedProj ? matchedProj.project_id : null;
      const taskType = projectId ? 'project' : 'internal';

      // Ngày hoàn thành
      const dueDate = excelDateToISO(rawDate, '2026-06-30');

      // Nhân viên phụ trách
      const mappedAssigneeIds = [];
      const coAssigneesMetadata = [];

      const rawAssignees = String(assigneeCol).replace(/\r?\n/g, '/').replace(/,/g, '/').replace(/;/g, '/').split('/');
      rawAssignees.forEach((name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;
        const emp = findEmployee(trimmedName);
        if (emp) {
          mappedAssigneeIds.push(emp.employee_id);
          coAssigneesMetadata.push({ name: emp.full_name, employeeId: emp.employee_id });
        } else {
          coAssigneesMetadata.push({ name: trimmedName, employeeId: null });
        }
      });

      const assigneeId = mappedAssigneeIds.length > 0 ? mappedAssigneeIds[0] : null;

      // Tiêu đề & Diễn giải/Mô tả
      let title = col1;
      let description = col2 ? `Kết quả đầu ra: ${col2}` : '';

      title = title.replace(/^-\s*/, '').trim();

      const taskPayload = {
        task_type: taskType,
        project_id: projectId,
        title: title.substring(0, 500),
        description: description,
        status: 'todo',
        priority: 'medium',
        assignee_id: assigneeId,
        department_code: 'PTDV',
        start_date: '2026-06-01',
        due_date: dueDate,
        phase: 'preparation',
        metadata: {
          office: currentOfficeJune,
          co_assignees: coAssigneesMetadata,
          raw_excel_assignee: assigneeCol || null,
          raw_excel_project: col1,
          incomplete_reason: null
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      tasksToInsert.push(taskPayload);
    }
  }

  console.log(`\n- Tổng kết phân tích: Bóc tách thành công [${tasksToInsert.length}] công việc sạch của phòng PTDV.`);
  console.log('- Đang thực hiện dọn dẹp các công việc PTDV cũ (Tháng 5 & 6)...');

  // Dọn dẹp sạch sẽ các công việc Tháng 5 & 6 cũ của PTDV theo department_code
  const { error: cleanErr } = await supabase
    .from('tasks')
    .delete()
    .in('start_date', ['2026-05-01', '2026-06-01'])
    .eq('department_code', 'PTDV');

  if (cleanErr) {
    console.error('✕ Lỗi khi dọn dẹp dữ liệu cũ:', cleanErr.message);
    process.exit(1);
  }
  console.log('✓ Đã dọn dẹp sạch sẽ dữ liệu PTDV cũ mà không làm ảnh hưởng các phòng ban khác.');

  console.log('- Đang tiến hành đẩy dữ liệu mới hàng loạt (Bulk Insert) lên Supabase...');

  const chunkSize = 50;
  let successCount = 0;

  for (let i = 0; i < tasksToInsert.length; i += chunkSize) {
    const chunk = tasksToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('tasks').insert(chunk);
    
    if (error) {
      console.error(`✕ Lỗi khi ghi block dữ liệu ${i} - ${i + chunk.length}:`, error.message);
    } else {
      successCount += chunk.length;
      console.log(`✓ Đã nạp thành công block ${i + 1} đến ${i + chunk.length}`);
    }
  }

  console.log(`\n=== KẾT QUẢ: Đã nạp thành công ${successCount}/${tasksToInsert.length} công việc sạch của phòng PTDV vào database! ===`);
}

runImport();
