const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/25.5.2026_QLDA3_ BC kết quả thực hiện tháng 5_ kế hoạch tháng 6.2026 QLDA3.xlsx';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Lỗi: Thiếu cấu hình Supabase trong .env');
  process.exit(1);
}

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
  console.log('=== BẮT ĐẦU QUY TRÌNH IMPORT CÔNG VIỆC PHÒNG QLDA 3 THÁNG 5 & 6 ===\n');

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
  const sheet = workbook.Sheets['Tháng 5.26_KH tháng 6.26'];
  if (!sheet) {
    console.error('⚠ Lỗi: Không tìm thấy sheet [Tháng 5.26_KH tháng 6.26]');
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const tasksToInsert = [];

  // Helper tìm kiếm dự án tương đồng
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
    
    // 3. Khớp tương đối (chứa nhau)
    matched = dbProjects.find(p => {
      const dbClean = cleanName(p.project_name);
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
      const rawReason = row[8] ? String(row[8]).trim() : '';

      // So khớp dự án
      const matchedProj = findProject(rawCol1);
      const projectId = matchedProj ? matchedProj.project_id : null;
      const taskType = projectId ? 'project' : 'internal';

      // Quy đổi ngày tháng
      const dueDate = excelDateToISO(rawDate, '2026-05-31');

      // So khớp nhân viên
      const mappedAssigneeIds = [];
      const coAssigneesMetadata = [];

      if (assigneeCol) {
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
      }

      const assigneeId = mappedAssigneeIds.length > 0 ? mappedAssigneeIds[0] : null;

      // Tiêu đề & Mô tả
      let title = '';
      let description = '';
      const isTrienKhaiSection = rawCol1.includes('đang triển khai') || idx === 311;

      if (projectId) {
        if (activeConstructionProjects.includes(projectId) || isTrienKhaiSection) {
          title = 'Giám sát thi công';
        } else {
          title = rawCol2 || rawCol1;
        }
        description = `Nhiệm vụ đầu ra: ${rawCol2}`;
      } else {
        if (isTrienKhaiSection) {
          title = 'Giám sát thi công';
          description = rawCol2 || rawCol1;
        } else {
          title = rawCol1;
          description = rawCol2;
        }
      }

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
        department_code: 'QLDA3',
        start_date: '2026-05-01',
        due_date: dueDate,
        phase: 'execution',
        metadata: {
          office: currentOfficeMay,
          co_assignees: coAssigneesMetadata,
          raw_excel_assignee: assigneeCol || null,
          raw_excel_project: rawCol1,
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
      const projectId = matchedProj ? matchedProj.project_id : null;
      const taskType = projectId ? 'project' : 'internal';

      // Ngày hoàn thành
      const dueDate = excelDateToISO(rawDate, '2026-06-30');

      // Nhân viên phụ trách
      const mappedAssigneeIds = [];
      const coAssigneesMetadata = [];

      if (assigneeCol) {
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
      }

      const assigneeId = mappedAssigneeIds.length > 0 ? mappedAssigneeIds[0] : null;

      // Tiêu đề & Mô tả
      let title = '';
      let description = '';
      const isThiCongSection = idx >= 526;

      if (projectId) {
        if (activeConstructionProjects.includes(projectId) || isThiCongSection) {
          title = 'Giám sát thi công';
        } else {
          title = rawCol2 || rawCol1;
        }
        description = `Nhiệm vụ đầu ra: ${rawCol2}`;
      } else {
        if (isThiCongSection) {
          title = 'Giám sát thi công';
          description = rawCol2 || rawCol1;
        } else {
          title = rawCol1;
          description = rawCol2;
        }
      }

      const taskPayload = {
        task_type: taskType,
        project_id: projectId,
        title: title.substring(0, 500),
        description: description,
        status: 'todo',
        priority: 'medium',
        assignee_id: assigneeId,
        department_code: 'QLDA3',
        start_date: '2026-06-01',
        due_date: dueDate,
        phase: 'preparation',
        metadata: {
          office: currentOfficeJune,
          co_assignees: coAssigneesMetadata,
          raw_excel_assignee: assigneeCol || null,
          raw_excel_project: rawCol1,
          incomplete_reason: null
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      tasksToInsert.push(taskPayload);
    }
  }

  console.log(`\n- Tổng kết phân tích: Bóc tách thành công [${tasksToInsert.length}] công việc sạch của QLDA 3.`);
  console.log('- Đang thực hiện dọn dẹp các công việc QLDA 3 cũ (Tháng 5 & 6)...');

  // Dọn dẹp sạch sẽ các công việc Tháng 5 & 6 cũ của QLDA 3 theo department_code
  const { error: cleanErr } = await supabase
    .from('tasks')
    .delete()
    .in('start_date', ['2026-05-01', '2026-06-01'])
    .eq('department_code', 'QLDA3');

  if (cleanErr) {
    console.error('✕ Lỗi khi dọn dẹp dữ liệu cũ:', cleanErr.message);
    process.exit(1);
  }
  console.log('✓ Đã dọn dẹp sạch sẽ dữ liệu QLDA 3 cũ.');

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

  console.log(`\n=== KẾT QUẢ: Đã nạp thành công ${successCount}/${tasksToInsert.length} công việc sạch của QLDA 3 vào database! ===`);
}

runImport();
