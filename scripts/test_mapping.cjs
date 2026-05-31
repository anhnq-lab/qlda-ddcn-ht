const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const filePath = 'd:/01_Projects/qlda-ddcn-ht/ks/BC thực hiện tháng 5_KH tháng 6.2026/QLDA1_BÁO CÁO THÁNG 05_KẾ HOẠCH THÁNG 06.2026 (1).xlsx';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Hàm chuyển số serial của Excel thành chuỗi YYYY-MM-DD
function excelDateToISO(serial) {
  if (!serial) return null;
  // Nếu đã là chuỗi date
  if (typeof serial === 'string') {
    if (serial.includes('/')) {
      const parts = serial.split('/');
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return serial;
  }
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
}

async function testMapping() {
  console.log('=== KHỞI CHẠY HỆ THỐNG THỬ NGHIỆM ÁNH XẠ DỮ LIỆU ===\n');
  
  // 1. Tải toàn bộ dự án và nhân viên từ DB để làm bộ nhớ đệm
  const { data: dbProjects } = await supabase.from('projects').select('project_id, project_name');
  const { data: dbEmployees } = await supabase.from('employees').select('employee_id, full_name');
  
  console.log(`- Đã tải từ cơ sở dữ liệu: ${dbProjects.length} dự án, ${dbEmployees.length} nhân viên.\n`);

  const workbook = XLSX.readFile(filePath);
  
  // Danh sách các sheet cần xử lý
  const targets = [
    { sheetName: 'Thang 04- KH thang 05.2026', monthLabel: 'Tháng 4 (Thực hiện) & Tháng 5 (Kế hoạch)' },
    { sheetName: 'Thang 05- KH thang 06.2026', monthLabel: 'Tháng 5 (Thực hiện) & Tháng 6 (Kế hoạch)' }
  ];

  // Helper để chuẩn hóa và tìm kiếm dự án tương đồng
  function findProject(nameFromExcel) {
    if (!nameFromExcel) return null;
    const cleanExcelName = nameFromExcel.replace(/:/g, '').trim().toLowerCase();
    
    // Tìm kiếm khớp chính xác hoặc chứa tên
    let matched = dbProjects.find(p => p.project_name.toLowerCase().trim() === cleanExcelName);
    if (matched) return matched;
    
    // Khớp tương đối
    matched = dbProjects.find(p => {
      const dbName = p.project_name.toLowerCase().trim();
      return cleanExcelName.includes(dbName) || dbName.includes(cleanExcelName);
    });
    
    return matched || null;
  }

  // Helper để tìm nhân viên tương đồng
  function findEmployee(nameFromExcel) {
    if (!nameFromExcel) return null;
    const cleanExcelName = nameFromExcel.trim().toLowerCase();
    
    // Khớp tên chính xác
    let matched = dbEmployees.find(e => e.full_name.toLowerCase().trim() === cleanExcelName);
    if (matched) return matched;
    
    // Khớp tương đối (ví dụ trong excel viết tắt hoặc thiếu đệm)
    matched = dbEmployees.find(e => {
      const dbName = e.full_name.toLowerCase().trim();
      return dbName.includes(cleanExcelName) || cleanExcelName.includes(dbName);
    });
    
    return matched || null;
  }

  targets.forEach(({ sheetName, monthLabel }) => {
    console.log(`\n======================================================`);
    console.log(`THỬ ÁNH XẠ CHO SHEET: [${sheetName}]`);
    console.log(`======================================================`);
    
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    let currentSection = '';
    let currentOffice = '';
    
    rows.forEach((row, idx) => {
      if (idx < 6) return;
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();
      
      if (col0 === 'A') {
        currentSection = 'THỰC HIỆN';
        return;
      } else if (col0 === 'B') {
        currentSection = 'KẾ HOẠCH';
        return;
      }
      
      // Check sub-header (VP tỉnh, VP Đức Thọ...)
      if (col0 === '' && col1 && !col1.includes('C.') && !col1.includes('I.') && !col1.includes('II.') && !col1.includes('III.') && !col1.includes('Trong đó:')) {
        currentOffice = col1;
        return;
      }
      
      // Nếu là công việc chi tiết (TT là số)
      const isNumberTT = /^\d+$/.test(col0);
      const assigneeCol = row[4]; // Tên cán bộ phụ trách ở cột 4
      
      if (isNumberTT && assigneeCol) {
        const rawProjName = row[1];
        const rawTaskTitle = row[2];
        const rawDate = row[3];
        const rawAssignees = String(assigneeCol).split('/');
        
        // Tiến hành ánh xạ thử
        const mappedProject = findProject(rawProjName);
        const mappedAssignees = rawAssignees.map(name => {
          const emp = findEmployee(name);
          return {
            rawName: name,
            employeeId: emp ? emp.employee_id : 'KHÔNG TÌM THẤY',
            dbName: emp ? emp.full_name : 'N/A'
          };
        });
        
        const mappedDueDate = excelDateToISO(rawDate);
        
        console.log(`\nDòng ${idx + 1} | TT: ${col0} [Phần: ${currentSection}] [Khu vực: ${currentOffice}]`);
        console.log(`- Tên gốc Excel: "${rawProjName.substring(0, 80)}..."`);
        if (mappedProject) {
          console.log(`  => Ánh xạ dự án thành công: [${mappedProject.project_id}] ${mappedProject.project_name}`);
        } else {
          console.log(`  => ⚠ CẢNH BÁO: Không tìm thấy dự án tương ứng trong DB!`);
        }
        
        console.log(`- Mô tả công việc: "${rawTaskTitle.substring(0, 80)}..."`);
        console.log(`- Ngày hoàn thành (Excel: ${rawDate}) => ISO: ${mappedDueDate}`);
        
        console.log(`- Cán bộ phụ trách (Excel: "${assigneeCol}"):`);
        mappedAssignees.forEach(ma => {
          if (ma.employeeId !== 'KHÔNG TÌM THẤY') {
            console.log(`  => [${ma.employeeId}] ${ma.dbName} (Khớp từ "${ma.rawName}")`);
          } else {
            console.log(`  => ⚠ CẢNH BÁO: Không tìm thấy nhân sự "${ma.rawName}" trong DB!`);
          }
        });
      }
    });
  });
}

testMapping();
