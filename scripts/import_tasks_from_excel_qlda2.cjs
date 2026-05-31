const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/QLDA 2_Kết quả tháng 5, Kế hoạch tháng 6_2026.xlsx';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Lỗi: Thiếu cấu hình Supabase trong .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Bộ ánh xạ sửa lỗi nhân sự viết tắt/lệch dấu của QLDA 2
const employeeOverride = {
  'nguyễn văn thọ': 'Nguyễn Văn Thọ',
  'nguyễn văn đức': 'Nguyễn Văn Đức',
  'trần như sơn': 'Trần Như Sơn',
  'nguyễn như sơn': 'Trần Như Sơn',
  'nguyễn trọng hoàng (mb)': 'Nguyễn Trọng Hoàng'
};

// Bộ ánh xạ ép khớp dự án thủ công cho các trường hợp lệch tên của QLDA 2
const projectOverride = {
  'đường nối đường gom ql15b đi cụm công nghiệp cẩm nhượng': '8131256',
  'cảng cá cẩm nhượng': '8131256',
  'đường cẩm sơn đi cẩm thịnh': '7972202',
  'đường tránh lũ': '7972202',
  'điện chiếu sáng kdl thiên cầm': '8132633',
  'hạ tầng kdl nam thiên cầm': '7941956',
  'đường trục xã tx.05': '8067233',
  'đường phạm lê đức': '7972205',
  'rãnh dọc bổ sung đường cẩm thạch': '7941955',
  'nhà học 2 tầng 10 phòng trường tiểu học cẩm hưng': '8115975',
  'tiểu học cẩm hưng': '8115975',
  'trường thcs sơn hà': '8115971',
  'cụm công nghiệp - tiểu thủ công nghiệp bắc cẩm xuyên': '7053124',
  'cụm công nghiệp bắc huyện cẩm xuyên': '7053124',
  'đường thiên - an': '8145036',
  'tuyến đường đh 36': '8145036',
  'tuyến đường đh36': '8145036',
  'đường giao thông liên xã khánh vĩnh yên - thanh lộc': '8042041',
  'khánh vĩnh yên - thanh lộc': '8042041',
  'trường thpt đồng lộc': '8080684',
  'nhà học 4 tầng trường thpt đồng lộc': '8080684',
  'trường chính trị trần phú': '8115004',
  'bệnh viện tỉnh': '8172870',
  'bệnh viện đa khoa tỉnh': '8172870',
  'trường thcs thiên cầm': '8129144',
  'nhà hiệu bộ kết hợp nhà học 3 tầng trường trung học cơ sở thiên cầm': '8129144',
  'trường thpt cẩm xuyên': '8160772',
  'đường sơn thượng': '7935693',
  'bệnh viện cẩm xuyên': '7990184',
  'lắp đặt thiết bị 04 bệnh viện': '7993024'
};

// Các dự án đang thi công/tu bổ, cần chuẩn hóa tiêu đề công việc là "Giám sát thi công"
const activeConstructionProjects = [
  '8131256', // Đường nối QL15B đi cụm công nghiệp Cẩm Nhượng
  '7972202', // Đường Cẩm Sơn đi Cẩm Thịnh (đường Tránh lũ)
  '7941956', // Hạ tầng KDL Nam Thiên Cầm
  '8067233', // Đường trục xã TX.05 Cẩm Thành
  '7972205', // Đường Phạm Lê Đức
  '7941955', // Rãnh dọc bổ sung đường Cẩm Thạch-Thạch Hội
  '8042041', // Đường giao thông liên xã Khánh Vĩnh Yên - Thanh Lộc
  '8080684', // Nhà học 4 tầng THPT Đồng Lộc
  '8115975', // Trường Tiểu học Cẩm Hưng
  '8115971', // Trường THCS Sơn Hà
  '8129144', // Trường THCS Thiên Cầm
  '8160772', // Trường THPT Cẩm Xuyên
  '8172870'  // Bệnh viện đa khoa tỉnh
];

function cleanVietDucTitle(rawTitle) {
  if (!rawTitle) return '';
  let title = rawTitle.trim();
  title = title
    .replace(/\bbc nckt\b/gi, 'báo cáo nghiên cứu khả thi')
    .replace(/\bLCNT\b/g, 'lựa chọn nhà thầu')
    .replace(/\bBVTC\b/g, 'bản vẽ thi công')
    .replace(/\bTVGS\b/g, 'tư vấn giám sát')
    .replace(/\bGĐ1\b/g, 'giai đoạn 1')
    .replace(/\bGĐ2\b/g, 'giai đoạn 2')
    .replace(/\bCĐT\b/g, 'chủ đầu tư')
    .replace(/\bKHLCNT\b/g, 'kế hoạch lựa chọn nhà thầu')
    .replace(/\bTK\b/g, 'thiết kế')
    .replace(/\bBCKTKT\b/g, 'báo cáo kinh tế kỹ thuật');

  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }
  return title;
}

function cleanOffice(officeName) {
  if (!officeName) return 'VP tỉnh';
  const name = officeName.trim();
  const cleanName = name.replace(/^[I|V|X|\d]+\.\s*/i, '').trim();
  
  if (
    cleanName === 'Văn phòng' || 
    cleanName === 'Phòng QLDA 2' || 
    cleanName === 'Chung' || 
    cleanName === 'Phòng QLDA2' ||
    cleanName.toLowerCase().includes('ăn phòn') ||
    cleanName.toLowerCase().includes('văn phòn')
  ) {
    return 'VP tỉnh';
  }
  if (cleanName === 'Khu vực Cẩm Xuyên' || cleanName === 'Cẩm Xuyên' || cleanName.includes('Cẩm Xuyên')) {
    return 'VP Cẩm Xuyên';
  }
  if (cleanName === 'Khu vực Can Lộc' || cleanName === 'Can Lộc' || cleanName.includes('Can Lộc')) {
    return 'VP Can Lộc';
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
  console.log('=== BẮT ĐẦU QUY TRÌNH IMPORT CÔNG VIỆC PHÒNG QLDA 2 THÁNG 5 & 6 ===\n');

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

  // Cấu hình phân tích cho từng sheet
  const sheetConfigs = [
    {
      sheetName: 'Kết quả tháng 5.2026',
      monthName: 'Tháng 5 (Thực hiện)',
      defaultStart: '2026-05-01',
      defaultDue: '2026-05-31',
      isPlan: false
    },
    {
      sheetName: 'Kế hoạch tháng 6.2026',
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
    let currentOffice = 'VP tỉnh';

    rows.forEach((row, idx) => {
      if (idx < 6) return; // Bỏ qua header chung
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();

      // Nhận diện phân nhóm khu vực Văn phòng
      if (col0 === '' && col1 && !col1.includes('C. Kết luận') && !col1.includes('I. Báo cáo') && !col1.includes('II. Kế hoạch') && !col1.includes('III. Đánh giá') && !col1.includes('Trong đó:')) {
        currentOffice = cleanOffice(col1);
        return;
      }

      // Ở QLDA 2, tiêu đề khu vực cũng có thể có số TT La Mã ở cột 0
      const isRomanSection = /^[IVXLCDM]+$/.test(col0);
      if (isRomanSection && col1) {
        currentOffice = cleanOffice(col1);
        return;
      }

      const isNumberTT = /^\d+$/.test(col0);
      const assigneeCol = row[4]; // Người phụ trách

      // Dòng hợp lệ phải có số TT
      if (isNumberTT) {
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

        // 4. Thiết lập tiêu đề và mô tả
        let title = '';
        let description = '';
        
        if (projectId) {
          if (activeConstructionProjects.includes(projectId)) {
            title = 'Giám sát thi công';
          } else {
            title = rawCol2 || rawCol1;
          }
          description = `Nhiệm vụ đầu ra: ${rawCol2}`;
        } else {
          const lowerCol1 = rawCol1.toLowerCase();
          if (lowerCol1.includes('cao đẳng') || lowerCol1.includes('việt đức')) {
            title = rawCol2 ? cleanVietDucTitle(rawCol2) : rawCol1;
            description = `Nhiệm vụ đầu ra: ${rawCol2}`;
          } else {
            title = rawCol1;
            description = rawCol2;
          }
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
          department_code: 'QLDA2',
          start_date: config.defaultStart,
          due_date: dueDate,
          phase: config.isPlan ? 'preparation' : 'execution',
          metadata: {
            office: currentOffice,
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
    });
  });

  console.log(`\n- Tổng kết phân tích: Bóc tách thành công [${tasksToInsert.length}] công việc.`);
  console.log('- Đang thực hiện dọn dẹp các công việc QLDA 2 cũ (Tháng 5 & 6)...');

  // Dọn dẹp sạch sẽ các công việc Tháng 5 & 6 cũ của QLDA 2 theo department_code
  const { error: cleanErr } = await supabase
    .from('tasks')
    .delete()
    .in('start_date', ['2026-05-01', '2026-06-01'])
    .eq('department_code', 'QLDA2');

  if (cleanErr) {
    console.error('✕ Lỗi khi dọn dẹp dữ liệu cũ:', cleanErr.message);
    process.exit(1);
  }
  console.log('✓ Đã dọn dẹp sạch sẽ dữ liệu QLDA 2 cũ.');

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

  console.log(`\n=== KẾT QUẢ: Đã nạp thành công ${successCount}/${tasksToInsert.length} công việc sạch của QLDA 2 vào database! ===`);
}

runImport();
