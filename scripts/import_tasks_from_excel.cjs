const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/QLDA1_BÁO CÁO THÁNG 05_KẾ HOẠCH THÁNG 06.2026 (1).xlsx';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Lỗi: Thiếu cấu hình Supabase trong .env');
  process.exit(1);
}

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
  console.log('=== BẮT ĐẦU QUY TRÌNH IMPORT CÔNG VIỆC THÁNG 5 & 6 (BẢN CHUẨN ĐỒNG BỘ ĐẦU RA) ===\n');

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
  const tasksToInsert = [];

  // Bộ nhớ tạm để đồng bộ mô tả hành chính từ Tháng 5 sang Tháng 6
  const adminTaskDescCache = {};

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

  // Cấu hình phân tích cho từng sheet và phần (CHỈ import tháng 5 & 6)
  const sheetConfigs = [
    {
      sheetName: 'Thang 05- KH thang 06.2026',
      targetSection: 'ACTUAL', // Lấy phần A thực hiện trong tháng 5
      monthName: 'Tháng 5 (Thực hiện)',
      defaultStart: '2026-05-01',
      defaultDue: '2026-05-31',
      isPlan: false
    },
    {
      sheetName: 'Thang 05- KH thang 06.2026',
      targetSection: 'PLAN', // Lấy phần B kế hoạch trong tháng 6
      monthName: 'Tháng 6 (Kế hoạch)',
      defaultStart: '2026-06-01',
      defaultDue: '2026-06-30',
      isPlan: true
    }
  ];

  sheetConfigs.forEach((config) => {
    console.log(`\n------------------------------------------------------`);
    console.log(`ĐANG PHÂN TÍCH: ${config.monthName} | Sheet: [${config.sheetName}]`);
    console.log(`------------------------------------------------------`);

    const sheet = workbook.Sheets[config.sheetName];
    if (!sheet) {
      console.warn(`⚠ Cảnh báo: Không tìm thấy sheet [${config.sheetName}]`);
      return;
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    let currentSection = '';
    let currentOffice = 'Chung';

    rows.forEach((row, idx) => {
      if (idx < 6) return; // Bỏ qua header chung
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();

      if (col0 === 'A') {
        currentSection = 'ACTUAL';
        return;
      } else if (col0 === 'B') {
        currentSection = 'PLAN';
        return;
      }

      // Nhận diện phân nhóm khu vực Văn phòng
      if (col0 === '' && col1 && !col1.includes('C. Kết luận') && !col1.includes('I. Báo cáo') && !col1.includes('II. Kế hoạch') && !col1.includes('III. Đánh giá') && !col1.includes('Trong đó:')) {
        currentOffice = col1;
        return;
      }

      // Chỉ lọc và xử lý khi ta đang ở đúng phân mục mong muốn (ACTUAL hoặc PLAN)
      if (currentSection !== config.targetSection) return;

      const isNumberTT = /^\d+$/.test(col0);
      const assigneeCol = row[4]; // Người phụ trách

      // Dòng hợp lệ phải có số TT và người phụ trách
      if (isNumberTT && assigneeCol) {
        const rawCol1 = row[1] ? String(row[1]).trim() : '';
        const rawCol2 = row[2] ? String(row[2]).trim() : '';
        const rawDate = row[3];
        const rawResult = row[7] ? String(row[7]).trim() : '';
        const rawReason = row[8] ? String(row[8]).trim() : '';

        // 1. So khớp dự án
        const matchedProj = findProject(rawCol1);
        const projectId = matchedProj ? matchedProj.project_id : null;
        const taskType = projectId ? 'project' : 'internal';

        // 2. Quy đổi ngày tháng
        const dueDate = excelDateToISO(rawDate, config.defaultDue);

        // 3. So khớp cán bộ phụ trách chính và cán bộ phụ trách phụ (Co-assignees)
        const rawAssignees = String(assigneeCol).split('/');
        const mappedAssigneeIds = [];
        const coAssigneesMetadata = [];

        rawAssignees.forEach((name) => {
          const emp = findEmployee(name);
          if (emp) {
            mappedAssigneeIds.push(emp.employee_id);
            coAssigneesMetadata.push({ name: emp.full_name, employeeId: emp.employee_id });
          } else {
            coAssigneesMetadata.push({ name: name, employeeId: null });
          }
        });

        const assigneeId = mappedAssigneeIds.length > 0 ? mappedAssigneeIds[0] : null;

        // 4. Thiết lập tiêu đề và mô tả
        let title = '';
        let description = '';
        
        if (projectId) {
          // Nếu thuộc nhóm dự án đang thi công/tu bổ, chuẩn hóa tiêu đề là "Giám sát thi công"
          if (activeConstructionProjects.includes(projectId)) {
            title = 'Giám sát thi công';
          } else {
            title = rawCol2 || rawCol1;
          }
          description = `Nhiệm vụ đầu ra: ${rawCol2}`;
        } else {
          // Đối với công việc chung hành chính: title lấy cột 1, description lấy cột 2
          title = rawCol1;
          description = rawCol2;
        }

        // 5. Xác định trạng thái công việc
        let status = 'todo';
        if (!config.isPlan) {
          if (rawResult.toLowerCase().includes('hoàn thành') && !rawResult.toLowerCase().includes('chưa')) {
            status = 'done';
          } else {
            status = 'incomplete';
          }
        }

        // 6. Xây dựng đối tượng Task hoàn chỉnh
        const taskPayload = {
          task_type: taskType,
          project_id: projectId,
          title: title.substring(0, 500),
          description: description,
          status: status,
          priority: 'medium',
          assignee_id: assigneeId,
          department_code: 'QLDA1',
          start_date: config.defaultStart,
          due_date: dueDate,
          phase: config.isPlan ? 'preparation' : 'execution',
          metadata: {
            office: currentOffice,
            co_assignees: coAssigneesMetadata,
            raw_excel_assignee: assigneeCol,
            raw_excel_project: rawCol1,
            incomplete_reason: rawReason || null
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        tasksToInsert.push(taskPayload);
      }
    });
  });

  console.log(`\n- Tổng kết phân tích: Bóc tách thành công [${tasksToInsert.length}] công việc.`);
  console.log('- Đang thực hiện dọn dẹp các công việc QLDA 1 cũ (Tháng 5 & 6)...');

  // Dọn dẹp sạch sẽ các công việc Tháng 5 & 6 cũ của QLDA 1 theo department_code
  const { error: cleanErr } = await supabase
    .from('tasks')
    .delete()
    .in('start_date', ['2026-05-01', '2026-06-01'])
    .eq('department_code', 'QLDA1');

  if (cleanErr) {
    console.error('✕ Lỗi khi dọn dẹp dữ liệu cũ:', cleanErr.message);
    process.exit(1);
  }
  console.log('✓ Đã dọn dẹp sạch sẽ dữ liệu Tháng 5 & 6 cũ.');

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

  console.log(`\n=== KẾT QUẢ: Đã nạp thành công ${successCount}/${tasksToInsert.length} công việc thực tế sạch vào module! ===`);
}

runImport();
