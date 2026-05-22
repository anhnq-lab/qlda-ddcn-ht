require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_SERVICE_ROLE_KEY trong file .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PROJ_ID = '8173865';
const CURRENT_DATE = new Date('2026-05-21');

const DEPT_MAPPING = {
  'QLDA1': { code: 'QLDA1', name: 'Phòng Quản lý dự án 1', staff: 'NV056', staffName: 'Lê Tùng Nguyên', head: 'NV053', headName: 'Phan Quốc Bảo' },
  'QLDA1_ALT1': { code: 'QLDA1', name: 'Phòng Quản lý dự án 1', staff: 'NV057', staffName: 'Trần Duy Khán', head: 'NV053', headName: 'Phan Quốc Bảo' },
  'QLDA1_ALT2': { code: 'QLDA1', name: 'Phòng Quản lý dự án 1', staff: 'NV058', staffName: 'Lê Ngọc Sơn', head: 'NV053', headName: 'Phan Quốc Bảo' },
  'KTTD': { code: 'KTTD', name: 'Phòng Kỹ thuật – Thẩm định', staff: 'NV098', staffName: 'Nguyễn Trọng Hải', head: 'NV030', headName: 'Hà Vũ Tuấn Dũng' },
  'KHDT': { code: 'KHDT', name: 'Phòng Kế hoạch – Đấu thầu', staff: 'NV042', staffName: 'Nguyễn Thị Quỳnh Nga', head: 'NV041', headName: 'Bùi Nam Sơn' }
};

// 16 Hợp đồng thực tế & Ánh xạ công việc
const CONTRACT_TASKS = [
  {
    contractId: 'HD-SVK1-01.1',
    packageId: 'PKG-1779258056092',
    title: 'Tư vấn khảo sát, lập quy hoạch, lập Báo cáo nghiên cứu khả thi',
    phase: 'Chuẩn bị đầu tư',
    deptKey: 'QLDA1',
    start: '2025-10-31',
    end: '2026-01-25',
    value: 1285065700,
    legalBasis: 'Luật Xây dựng số 50/2014/QH13, Nghị định 15/2021/NĐ-CP về quản lý dự án',
    subtasks: [
      { title: 'Khảo sát hiện trạng mặt bằng xây dựng', end: '2025-11-15', sort: 1 },
      { title: 'Lập hồ sơ quy hoạch chi tiết 1/500', end: '2025-12-15', sort: 2 },
      { title: 'Lập báo cáo nghiên cứu khả thi dự án', end: '2026-01-10', sort: 3 },
      { title: 'Hoàn thiện và trình nộp BCNCKT', end: '2026-01-25', sort: 4 }
    ]
  },
  {
    contractId: 'HD-2026-TVTK',
    packageId: 'PKG-1779260184775',
    title: 'Tư vấn thẩm tra Báo cáo nghiên cứu khả thi',
    phase: 'Chuẩn bị đầu tư',
    deptKey: 'KTTD',
    start: '2025-12-03',
    end: '2026-01-25',
    value: 107201000,
    legalBasis: 'Nghị định 15/2021/NĐ-CP về quản lý dự án đầu tư xây dựng',
    subtasks: [
      { title: 'Tiếp nhận hồ sơ BCNCKT từ chủ đầu tư', end: '2025-12-10', sort: 1 },
      { title: 'Thẩm tra thuyết minh dự án và phương án thiết kế cơ sở', end: '2025-12-25', sort: 2 },
      { title: 'Thẩm tra tổng mức đầu tư dự án', end: '2026-01-15', sort: 3 },
      { title: 'Phát hành báo cáo kết quả thẩm tra BCNCKT', end: '2026-01-25', sort: 4 }
    ]
  },
  {
    contractId: 'HD-SVK1-01.3',
    packageId: 'PKG-1779260218633',
    title: 'Rà phá bom mìn, vật nổ dự án Trường Sơn Kim 1',
    phase: 'Chuẩn bị đầu tư',
    deptKey: 'QLDA1',
    start: '2025-12-19',
    end: '2026-01-25',
    value: 139500000,
    legalBasis: 'Nghị định 18/2019/NĐ-CP về quản lý và thực hiện hoạt động khắc phục hậu quả bom mìn vật nổ',
    subtasks: [
      { title: 'Khảo sát và lập phương án kỹ thuật thi công RPBM', end: '2025-12-25', sort: 1 },
      { title: 'Thi công rà phá bom mìn, vật nổ trên cạn', end: '2026-01-15', sort: 2 },
      { title: 'Nghiệm thu bàn giao mặt bằng sạch', end: '2026-01-25', sort: 3 }
    ]
  },
  {
    contractId: 'HD-SVK1-02.1',
    packageId: 'PKG-1779335447261',
    title: 'Tư vấn thiết kế bản vẽ thi công và dự toán công trình',
    phase: 'Thực hiện đầu tư',
    deptKey: 'QLDA1_ALT1',
    start: '2026-01-01',
    end: '2026-06-15',
    value: 2149307000,
    legalBasis: 'Nghị định 10/2021/NĐ-CP về quản lý chi phí đầu tư xây dựng',
    subtasks: [
      { title: 'Khảo sát kỹ thuật phục vụ thiết kế bản vẽ thi công', end: '2026-02-15', sort: 1 },
      { title: 'Thiết kế bản vẽ thi công các hạng mục kiến trúc, kết cấu', end: '2026-04-15', sort: 2 },
      { title: 'Thiết kế hệ thống M&E và phòng cháy chữa cháy', end: '2026-05-15', sort: 3 },
      { title: 'Lập dự toán chi tiết xây dựng công trình', end: '2026-06-05', sort: 4 },
      { title: 'Bàn giao hồ sơ TKBVTC & dự toán hoàn chỉnh', end: '2026-06-15', sort: 5 }
    ]
  },
  {
    contractId: 'HD-SVK1-02.2',
    packageId: 'PKG-1779335331723', // fixed from SVK1-02.2 package PKG-1779335531723
    title: 'Tư vấn thẩm tra thiết kế bản vẽ thi công và dự toán',
    phase: 'Thực hiện đầu tư',
    deptKey: 'KTTD',
    start: '2026-01-01',
    end: '2026-06-15',
    value: 268565000,
    legalBasis: 'Luật Xây dựng và các thông tư hướng dẫn thẩm tra của Bộ Xây dựng',
    subtasks: [
      { title: 'Tiếp nhận hồ sơ thiết kế và dự toán từ đơn vị tư vấn thiết kế', end: '2026-03-01', sort: 1 },
      { title: 'Thẩm tra giải pháp kết cấu và an toàn chịu lực', end: '2026-04-30', sort: 2 },
      { title: 'Thẩm tra dự toán chi tiết, kiểm tra đơn giá định mức', end: '2026-05-30', sort: 3 },
      { title: 'Báo cáo kết quả thẩm tra thiết kế và dự toán', end: '2026-06-15', sort: 4 }
    ]
  },
  {
    contractId: 'HD-SVK1-02.4',
    packageId: 'PKG-1779335596988',
    title: 'Tư vấn lập hồ sơ đăng ký môi trường dự án',
    phase: 'Thực hiện đầu tư',
    deptKey: 'QLDA1',
    start: '2026-01-01',
    end: '2026-03-02',
    value: 39826000,
    legalBasis: 'Luật Bảo vệ môi trường số 72/2020/QH14',
    subtasks: [
      { title: 'Đánh giá hiện trạng môi trường khu vực dự án', end: '2026-01-25', sort: 1 },
      { title: 'Lập báo cáo đăng ký môi trường', end: '2026-02-15', sort: 2 },
      { title: 'Trình nộp cơ quan chức năng phê duyệt đăng ký môi trường', end: '2026-03-02', sort: 3 }
    ]
  },
  {
    contractId: 'HD-SVK1-02.5',
    packageId: 'PKG-1779337483844',
    title: 'Tư vấn lập hồ sơ cấp phép khai thác đất san lấp',
    phase: 'Thực hiện đầu tư',
    deptKey: 'QLDA1',
    start: '2026-01-06',
    end: '2026-03-12',
    value: 433471000,
    legalBasis: 'Luật Khoáng sản số 60/2010/QH12',
    subtasks: [
      { title: 'Khảo sát thực địa mỏ đất san lấp dự kiến', end: '2026-02-01', sort: 1 },
      { title: 'Lập hồ sơ kỹ thuật và phương án khai thác đất', end: '2026-02-25', sort: 2 },
      { title: 'Trình nộp và hoàn tất thủ tục cấp phép khai thác đất', end: '2026-03-12', sort: 3 }
    ]
  },
  {
    contractId: 'HD-SVK1-02.3',
    packageId: 'PKG-1779335565595',
    title: 'Tư vấn thẩm định giá vật tư, thiết bị dự án',
    phase: 'Thực hiện đầu tư',
    deptKey: 'KHDT',
    start: '2026-01-20',
    end: '2026-02-05',
    value: 162000000,
    legalBasis: 'Luật Giá số 11/2012/QH13',
    subtasks: [
      { title: 'Thu thập báo giá và khảo sát giá thị trường vật tư thiết bị', end: '2026-01-28', sort: 1 },
      { title: 'Lập chứng thư thẩm định giá thiết bị trường học', end: '2026-02-05', sort: 2 }
    ]
  },
  {
    contractId: 'HD-SVK1-03.1',
    packageId: 'PKG-1779344754624',
    title: 'Thi công xây dựng hạng mục san nền dự án Sơn Kim 1',
    phase: 'Thực hiện đầu tư',
    deptKey: 'QLDA1_ALT2',
    start: '2026-01-13',
    end: '2026-08-12',
    value: 3268826000,
    legalBasis: 'Tiêu chuẩn quốc gia TCVN 4447:2012 về Công tác đất - Quy phạm thi công và nghiệm thu',
    subtasks: [
      { title: 'Nhận bàn giao mốc định vị mặt bằng', end: '2026-01-20', sort: 1 },
      { title: 'Thi công đào, đắp đất san nền khu vực 1', end: '2026-04-15', sort: 2 },
      { title: 'Thi công san lấp mặt bằng toàn khu đạt cốt thiết kế', end: '2026-07-30', sort: 3 },
      { title: 'Nghiệm thu bàn giao mặt bằng hoàn thiện san nền', end: '2026-08-12', sort: 4 }
    ]
  },
  {
    contractId: 'HD-SVK1-03.2',
    packageId: 'PKG-1779344807079',
    title: 'Tư vấn giám sát thi công gói thầu san nền 03.1/XL',
    phase: 'Thực hiện đầu tư',
    deptKey: 'QLDA1_ALT2',
    start: '2026-01-13',
    end: '2026-08-12',
    value: 45637000,
    legalBasis: 'Nghị định 06/2021/NĐ-CP về quản lý chất lượng và bảo trì công trình xây dựng',
    subtasks: [
      { title: 'Kiểm tra năng lực nhà thầu và phê duyệt biện pháp thi công', end: '2026-01-25', sort: 1 },
      { title: 'Giám sát cao độ đào đắp định kỳ hàng tuần', end: '2026-06-30', sort: 2 },
      { title: 'Ký biên bản nghiệm thu chuyển giai đoạn san nền', end: '2026-08-12', sort: 3 }
    ]
  },
  {
    contractId: 'HD-SVK1-03.3',
    packageId: 'PKG-1779344867054',
    title: 'Bảo hiểm công trình trong thi công xây dựng san nền',
    phase: 'Thực hiện đầu tư',
    deptKey: 'QLDA1',
    start: '2026-01-13',
    end: '2026-08-12',
    value: 2689000,
    legalBasis: 'Thông tư 50/2022/TT-BTC hướng dẫn bảo hiểm bắt buộc trong hoạt động đầu tư xây dựng',
    subtasks: [
      { title: 'Ký hợp đồng bảo hiểm và cấp đơn bảo hiểm san nền', end: '2026-01-20', sort: 1 }
    ]
  },
  {
    contractId: 'HD-SVK1-04.1',
    packageId: 'PKG-1779346096001',
    title: 'Thi công xây dựng và lắp đặt thiết bị khối phòng học/nội trú',
    phase: 'Thực hiện đầu tư',
    deptKey: 'QLDA1',
    start: '2026-02-05',
    end: '2026-08-10',
    value: 98669118000,
    legalBasis: 'Quy chuẩn xây dựng Việt Nam QCXDVN 01:2021/BXD',
    subtasks: [
      { title: 'Thi công móng cọc bê tông cốt thép khối nhà học', end: '2026-03-31', sort: 1 },
      { title: 'Thi công phần khung dầm cột sàn tầng 1 và tầng 2', end: '2026-05-15', sort: 2 },
      { title: 'Xây tường bao và hoàn thiện trát trong ngoài', end: '2026-06-30', sort: 3 },
      { title: 'Lắp đặt hệ thống cửa, thiết bị điện nước chiếu sáng', end: '2026-07-25', sort: 4 },
      { title: 'Nghiệm thu kỹ thuật và bàn giao đưa vào sử dụng', end: '2026-08-10', sort: 5 }
    ]
  },
  {
    contractId: 'HD-SVK1-04.2',
    packageId: 'PKG-1779346096002',
    title: 'Thi công phá dỡ Nhà nội trú cũ số 1 và số 2',
    phase: 'Thực hiện đầu tư',
    deptKey: 'QLDA1_ALT2',
    start: '2026-02-05',
    end: '2026-02-25',
    value: 36920082,
    legalBasis: 'Thông tư 22/2010/TT-BXD quy định an toàn lao động trong thi công xây dựng',
    subtasks: [
      { title: 'Lập phương án tháo dỡ đảm bảo an toàn lao động', end: '2026-02-08', sort: 1 },
      { title: 'Thực hiện phá dỡ kết cấu nhà cũ', end: '2026-02-20', sort: 2 },
      { title: 'Vận chuyển phế thải xây dựng bàn giao mặt bằng', end: '2026-02-25', sort: 3 }
    ]
  },
  {
    contractId: 'HD-SVK1-04.3',
    packageId: 'PKG-1779346096003',
    title: 'Tư vấn thí nghiệm thử tải tĩnh cọc bê tông cốt thép',
    phase: 'Thực hiện đầu tư',
    deptKey: 'QLDA1',
    start: '2026-02-05',
    end: '2026-03-02',
    value: 321701000,
    legalBasis: 'TCVN 9393:2012 Cọc - Phương pháp thử bằng tải trọng tĩnh dọc trục ép',
    subtasks: [
      { title: 'Lắp đặt đối trọng và thiết bị kích thử tải', end: '2026-02-12', sort: 1 },
      { title: 'Thực hiện ép tải thử nghiệm tĩnh cọc', end: '2026-02-24', sort: 2 },
      { title: 'Báo cáo kết quả thí nghiệm nén tĩnh cọc', end: '2026-03-02', sort: 3 }
    ]
  },
  {
    contractId: 'HD-SVK1-04.4',
    packageId: 'PKG-1779346096004',
    title: 'Tư vấn giám sát thi công xây dựng & lắp đặt thiết bị',
    phase: 'Thực hiện đầu tư',
    deptKey: 'QLDA1',
    start: '2026-02-05',
    end: '2026-08-10',
    value: 1620965000,
    legalBasis: 'Nghị định 06/2021/NĐ-CP của Chính phủ về quản lý chất lượng công trình',
    subtasks: [
      { title: 'Thành lập ban giám sát hiện trường', end: '2026-02-10', sort: 1 },
      { title: 'Kiểm soát chất lượng vật liệu đầu vào và cốt thép móng', end: '2026-03-25', sort: 2 },
      { title: 'Giám sát công tác đổ bê tông các sàn', end: '2026-05-15', sort: 3 },
      { title: 'Nghiệm thu khối lượng hoàn thành thanh toán định kỳ', end: '2026-07-31', sort: 4 },
      { title: 'Lập báo cáo hoàn thành công tác giám sát', end: '2026-08-10', sort: 5 }
    ]
  },
  {
    contractId: 'HD-SVK1-04.5',
    packageId: 'PKG-1779346096005',
    title: 'Bảo hiểm công trình trong thi công xây dựng nhà liên cấp',
    phase: 'Thực hiện đầu tư',
    deptKey: 'QLDA1',
    start: '2026-02-05',
    end: '2026-08-06',
    value: 74492000,
    legalBasis: 'Nghị định 119/2015/NĐ-CP quy định bảo hiểm bắt buộc trong hoạt động đầu tư xây dựng',
    subtasks: [
      { title: 'Đánh giá rủi ro và ký đơn bảo hiểm xây dựng', end: '2026-02-15', sort: 1 }
    ]
  }
];

// Tính toán trạng thái & tiến độ tự động
function calculateStatusAndProgress(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);

  if (end < CURRENT_DATE) {
    return { status: 'done', progress: 100, actualStart: startStr, actualEnd: endStr };
  } else if (start <= CURRENT_DATE && end >= CURRENT_DATE) {
    const totalDays = (end - start) / (1000 * 60 * 60 * 24);
    const elapsedDays = (CURRENT_DATE - start) / (1000 * 60 * 60 * 24);
    let pct = Math.round((elapsedDays / totalDays) * 100);
    pct = Math.min(Math.max(pct, 15), 90); // Giữ trong khoảng 15-90% cho sinh động
    return { status: 'in_progress', progress: pct, actualStart: startStr, actualEnd: null };
  } else {
    return { status: 'todo', progress: 0, actualStart: null, actualEnd: null };
  }
}

async function run() {
  console.log('=== BẮT ĐẦU CHẠY SEED DỮ LIỆU MẪU DỰ ÁN SƠN KIM 1 ===');

  try {
    // 1. DỌN DẸP DỮ LIỆU CŨ của dự án 8173865
    console.log('1. Đang dọn dẹp dữ liệu cũ...');
    const { error: delSubErr } = await supabase.from('sub_tasks')
      .delete()
      .in('task_id', (
        await supabase.from('tasks').select('id').eq('project_id', PROJ_ID)
      ).data?.map(t => t.id) || []);
    if (delSubErr) console.log('Lưu ý dọn dẹp sub_tasks:', delSubErr.message);

    const { error: delTasksErr } = await supabase.from('tasks').delete().eq('project_id', PROJ_ID);
    if (delTasksErr) console.error('Lỗi dọn dẹp tasks:', delTasksErr);

    const { error: delMpiErr } = await supabase.from('monthly_plan_items').delete().eq('project_id', PROJ_ID);
    if (delMpiErr) console.error('Lỗi dọn dẹp monthly_plan_items:', delMpiErr);

    const { error: delApiErr } = await supabase.from('annual_plan_items').delete().eq('project_id', PROJ_ID);
    if (delApiErr) console.error('Lỗi dọn dẹp annual_plan_items:', delApiErr);

    console.log('Đã dọn dẹp sạch dữ liệu cũ dự án 8173865.');

    // 2. TẠO KẾ HOẠCH KHUNG NĂM (annual_plan_items)
    console.log('\n2. Đang tạo Kế hoạch Khung Năm (annual_plan_items)...');
    const annualItems = [];
    const annualMapping = {};

    const uniqueYears = [2025, 2026];
    const uniqueDepts = ['QLDA1', 'KHDT', 'KTTD'];

    for (const year of uniqueYears) {
      for (const deptKey of uniqueDepts) {
        const dept = DEPT_MAPPING[deptKey];
        const is2025 = year === 2025;
        const taskName = is2025 
          ? `Công tác chuẩn bị đầu tư và khảo sát thiết kế sơ bộ dự án Trường Sơn Kim 1 (Năm ${year})`
          : `Quản lý thi công xây dựng, mua sắm thiết bị và giám sát hoàn thiện dự án Trường Sơn Kim 1 (Năm ${year})`;
        
        const annualId = uuidv4();
        const { error: apiErr } = await supabase.from('annual_plan_items').insert({
          id: annualId,
          plan_year: year,
          department_code: dept.code,
          department_name: dept.name,
          group_name: is2025 ? 'Công tác chuẩn bị' : 'Công tác thực hiện thi công',
          task_name: taskName,
          deliverable: is2025 ? 'Báo cáo nghiên cứu khả thi, Giấy phép RPBM, Quy hoạch 1/500' : 'Công trình bàn giao đưa vào sử dụng',
          start_period: is2025 ? 'Quý III' : 'Quý I',
          end_period: is2025 ? 'Quý IV' : 'Quý IV',
          frequency: 'one_time',
          project_id: PROJ_ID,
          responsible_text: `${dept.code} - ${dept.staffName}`,
          collaborating_text: 'Ban Giám đốc',
          collaborating_dept_codes: ['BGĐ']
        });

        if (apiErr) {
          console.error('Lỗi tạo annual plan item:', apiErr);
        } else {
          annualMapping[`${year}_${dept.code}`] = annualId;
          console.log(`- Đã tạo KH Khung năm ${year} cho ${dept.name}`);
        }
      }
    }

    // 3. TẠO KẾ HOẠCH THÁNG (monthly_plans & monthly_plan_items)
    console.log('\n3. Đang tạo Kế hoạch Tháng (monthly_plans & monthly_plan_items)...');
    
    // Thu thập các tháng cần tạo dựa trên khoảng thời gian của 16 hợp đồng
    // Từ tháng 10/2025 đến tháng 8/2026
    const monthsToCreate = [
      { year: 2025, month: 10 },
      { year: 2025, month: 11 },
      { year: 2025, month: 12 },
      { year: 2026, month: 1 },
      { year: 2026, month: 2 },
      { year: 2026, month: 3 },
      { year: 2026, month: 4 },
      { year: 2026, month: 5 },
      { year: 2026, month: 6 },
      { year: 2026, month: 7 },
      { year: 2026, month: 8 }
    ];

    const monthlyPlanIds = {}; // Key: "year_month_dept" -> monthly_plan_id

    for (const item of monthsToCreate) {
      for (const deptKey of ['QLDA1', 'KHDT', 'KTTD']) {
        const dept = DEPT_MAPPING[deptKey];
        const planId = uuidv4();
        
        // Upsert header monthly_plans
        const { data: upsertData, error: mpErr } = await supabase.from('monthly_plans').upsert({
          plan_month: item.month,
          plan_year: item.year,
          department_code: dept.code,
          department_name: dept.name,
          status: (item.year === 2026 && item.month >= 5) ? 'draft' : 'published',
          notes: `Kế hoạch hoạt động tháng ${item.month}/${item.year} - Dự án Sơn Kim 1`
        }, { onConflict: 'plan_month,plan_year,department_code' }).select();

        if (mpErr) {
          console.error(`Lỗi tạo monthly plan ${item.month}/${item.year} cho ${dept.name}:`, mpErr.message);
        } else if (upsertData && upsertData.length > 0) {
          monthlyPlanIds[`${item.year}_${item.month}_${dept.code}`] = upsertData[0].id;
        }
      }
    }
    console.log(`- Đã tạo/Đồng bộ ${Object.keys(monthlyPlanIds).length} headers Kế hoạch Tháng.`);

    // 4. TẠO CÂY CÔNG VIỆC CHI TIẾT (tasks & sub_tasks & monthly_plan_items)
    console.log('\n4. Đang tạo chi tiết Tasks, Sub-tasks và Monthly Plan Items...');
    let tasksCreatedCount = 0;
    let subtasksCreatedCount = 0;
    let monthlyItemsCreatedCount = 0;

    for (let i = 0; i < CONTRACT_TASKS.length; i++) {
      const ct = CONTRACT_TASKS[i];
      const dept = DEPT_MAPPING[ct.deptKey];
      
      const { status, progress, actualStart, actualEnd } = calculateStatusAndProgress(ct.start, ct.end);
      
      // A. Tạo Task lớn (parent task) trong bảng public.tasks và liên kết với Monthly Plan Item (sau đó sẽ liên kết ngược lại)
      const taskId = uuidv4();
      const mpiId = uuidv4(); // ID dùng chung cho cả Task và Monthly Plan Item
      
      const { error: tErr } = await supabase.from('tasks').insert({
        id: taskId,
        task_type: 'project',
        project_id: PROJ_ID,
        title: `[HĐ ${ct.contractId}] ${ct.title}`,
        description: `Thực hiện toàn bộ các nghĩa vụ và nội dung công việc theo ${ct.title} thuộc dự án Sơn Kim 1.`,
        status: status,
        priority: ct.value > 1000000000 ? 'high' : 'medium',
        progress: progress,
        assignee_id: dept.staff,
        approver_id: 'NV003', // Trần Ngọc Bảo phê duyệt cấp cao nhất
        start_date: ct.start,
        due_date: ct.end,
        actual_start_date: actualStart,
        actual_end_date: actualEnd,
        phase: ct.phase === 'Chuẩn bị đầu tư' ? 'preparation' : 'execution',
        step_code: ct.contractId.replace(/-/g, '_'),
        estimated_cost: ct.value,
        actual_cost: status === 'done' ? ct.value : Math.round(ct.value * (progress / 100)),
        legal_basis: ct.legalBasis,
        output_document: `Báo cáo sản phẩm nghiệm thu thuộc ${ct.contractId}`,
        sort_order: i + 1,
        monthly_plan_item_id: null, // Tạo rỗng trước để tránh lỗi FK
        metadata: {
          contract_id: ct.contractId,
          package_id: ct.packageId,
          is_sample: true
        }
      });

      if (tErr) {
        console.error(`Lỗi tạo task cho hợp đồng ${ct.contractId}:`, tErr);
        continue;
      }
      tasksCreatedCount++;

      // B. Tạo các Sub-tasks tương ứng
      for (const st of ct.subtasks) {
        // Trạng thái sub-task tương đối dựa theo hạn của sub-task so với CURRENT_DATE
        const subtaskEnd = new Date(st.end);
        const subtaskStatus = subtaskEnd < CURRENT_DATE ? 'done' : (status === 'todo' ? 'todo' : 'in_progress');
        
        const { error: stErr } = await supabase.from('sub_tasks').insert({
          id: uuidv4(),
          task_id: taskId,
          title: st.title,
          status: subtaskStatus,
          assignee_id: dept.staff,
          due_date: st.end,
          sort_order: st.sort
        });

        if (stErr) {
          console.error(`Lỗi tạo subtask "${st.title}":`, stErr);
        } else {
          subtasksCreatedCount++;
        }
      }

      // C. Ánh xạ nhiệm vụ vào Kế hoạch Tháng (monthly_plan_items)
      // Tìm tháng bắt đầu của hợp đồng để đưa vào kế hoạch tháng tương ứng
      const startDateObj = new Date(ct.start);
      const startYear = startDateObj.getFullYear();
      const startMonth = startDateObj.getMonth() + 1;
      
      const mPlanId = monthlyPlanIds[`${startYear}_${startMonth}_${dept.code}`];
      const annualPlanId = annualMapping[`${startYear}_${dept.code}`];

      if (mPlanId) {
        const { error: mpiErr } = await supabase.from('monthly_plan_items').insert({
          id: mpiId, // Use the generated ID
          monthly_plan_id: mPlanId,
          annual_plan_item_id: annualPlanId || null,
          project_id: PROJ_ID,
          group_name: ct.phase === 'Chuẩn bị đầu tư' ? 'Hồ sơ Chuẩn bị đầu tư' : 'Thi công & Giám sát hiện trường',
          task_name: `Triển khai hợp đồng ${ct.contractId}: ${ct.title}`,
          deliverable: `Sản phẩm hoàn thành nghiệm thu theo giai đoạn`,
          deadline_note: `Theo hợp đồng đến hết ${ct.end}`,
          due_date: ct.end,
          status: status === 'done' ? 'completed' : 'planned',
          completion_result: status === 'done' ? `Đã hoàn thành bàn giao hồ sơ nghiệm thu thanh toán ${Number(ct.value).toLocaleString('vi-VN')} đ` : `Đang thực hiện đạt ${progress}% tiến độ`,
          sort_order: i + 1,
          source_task_id: taskId,
          source_type: 'from_project_task',
          collaborating_text: 'Ban Giám đốc',
          collaborating_dept_codes: ['BGĐ'],
          notes: `Ánh xạ tự động từ Hợp đồng thực tế số ${ct.contractId}`
        });

        if (mpiErr) {
          console.error(`Lỗi tạo monthly plan item cho ${ct.contractId}:`, mpiErr.message);
        } else {
          monthlyItemsCreatedCount++;

          // D. Cập nhật liên kết ngược lại từ Task đến Monthly Plan Item (an toàn không lỗi FK)
          const { error: updErr } = await supabase.from('tasks')
            .update({ monthly_plan_item_id: mpiId })
            .eq('id', taskId);
          if (updErr) {
            console.error(`Lỗi liên kết task với monthly plan item cho ${ct.contractId}:`, updErr.message);
          }
        }
      }
    }

    console.log('\n=== TỔNG KẾT KẾT QUẢ SEED DỮ LIỆU ===');
    console.log(`- Số lượng Kế hoạch Khung Năm (annual_plan_items) đã tạo: ${Object.keys(annualMapping).length}`);
    console.log(`- Số lượng Kế hoạch Tháng (monthly_plans) được chèn: ${Object.keys(monthlyPlanIds).length}`);
    console.log(`- Số lượng Nhiệm vụ Kế hoạch Tháng (monthly_plan_items) đã tạo: ${monthlyItemsCreatedCount}`);
    console.log(`- Số lượng Tasks dự án lớn đã tạo: ${tasksCreatedCount}`);
    console.log(`- Số lượng Sub-tasks chi tiết đã tạo: ${subtasksCreatedCount}`);
    console.log('=====================================================');

  } catch (err) {
    console.error('Đã xảy ra lỗi ngoài ý muốn trong quá trình thực hiện:', err);
  }
}

run();
