const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/HC-TH. Báo cáo kết quả công việc  hàng tháng 5.2026.xlsx';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Lỗi: Thiếu cấu hình Supabase trong .env');
  process.exit(1);
}

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
  'cầu nạp hốp': 'XHH1'
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
  console.log('=== BẮT ĐẦU QUY TRÌNH IMPORT CÔNG VIỆC PHÒNG HC-TH THÁNG 5 & 6 ===\n');

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
  const sheet = workbook.Sheets['Bản sao của KQ Tháng 5- KH Thán'];
  if (!sheet) {
    console.error('⚠ Lỗi: Không tìm thấy sheet [Bản sao của KQ Tháng 5- KH Thán]');
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
    
    // 3. Khớp tương đối chặt chẽ (chỉ khớp nếu tên dự án dài từ 15 ký tự để tránh khớp bừa bãi)
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
    let cleanExcelName = nameFromExcel.trim().toLowerCase();
    
    // Áp dụng override sửa lỗi chính tả
    if (employeeOverride[cleanExcelName]) {
      cleanExcelName = employeeOverride[cleanExcelName].toLowerCase();
    }
    
    // Khớp chính xác hoàn toàn
    let matched = dbEmployees.find(e => e.full_name.toLowerCase().trim() === cleanExcelName);
    if (matched) return matched;
    
    // Khớp tương đối
    matched = dbEmployees.find(e => {
      const dbClean = e.full_name.toLowerCase().trim();
      return dbClean.includes(cleanExcelName) || cleanExcelName.includes(dbClean);
    });
    
    return matched || null;
  }

  // --- PHẦN 1: BÓC TÁCH THÁNG 5 (THỰC HIỆN) ---
  console.log('- Đang bóc tách dữ liệu Tháng 5 (Thực hiện)...');
  let currentOfficeMay = 'VP tỉnh';

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

    const isStatsRow = col1.startsWith('Số công trình') || col1.startsWith('Số dự án') || col1.startsWith('Đăng ký số') || col1.startsWith('Đăng ký Số') || col1.includes('dự án hoàn thành') || col1.includes('duyệt Quyết toán');
    if (isStatsRow && !assigneeCol) {
      continue;
    }

    // Chỉ lấy dòng có Cán bộ trực tiếp phụ trách
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
        department_code: 'HCTH',
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
        department_code: 'HCTH',
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

  console.log(`\n- Tổng kết phân tích: Bóc tách thành công [${tasksToInsert.length}] công việc sạch của phòng HC-TH.`);
  console.log('- Đang thực hiện dọn dẹp các công việc HC-TH cũ (Tháng 5 & 6)...');

  // Dọn dẹp sạch sẽ các công việc Tháng 5 & 6 cũ của HC-TH theo department_code
  const { error: cleanErr } = await supabase
    .from('tasks')
    .delete()
    .in('start_date', ['2026-05-01', '2026-06-01'])
    .eq('department_code', 'HCTH');

  if (cleanErr) {
    console.error('✕ Lỗi khi dọn dẹp dữ liệu cũ:', cleanErr.message);
    process.exit(1);
  }
  console.log('✓ Đã dọn dẹp sạch sẽ dữ liệu HC-TH cũ mà không làm ảnh hưởng các phòng ban khác.');

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

  console.log(`\n=== KẾT QUẢ: Đã nạp thành công ${successCount}/${tasksToInsert.length} công việc sạch của phòng HC-TH vào database! ===`);
}

runImport();
