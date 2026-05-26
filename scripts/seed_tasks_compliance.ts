import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_SERVICE_ROLE_KEY trong file .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define categories
const CATEGORIES = [
  'dieu_hanh', 'tham_dinh', 'thi_cong', 'quyet_toan', 'thanh_toan',
  'gpmb', 'dau_thau', 'dieu_chinh', 'gop_y', 'bao_cao',
  'kiem_tra', 'ban_giao', 'khac'
] as const;

type TaskCategory = typeof CATEGORIES[number];

const DEPT_MAPPING: Record<string, string> = {
  'Phòng Quản lý dự án 1': 'QLDA1',
  'Phòng Quản lý dự án 2': 'QLDA2',
  'Phòng Quản lý dự án 3': 'QLDA3',
  'Phòng Kỹ thuật – Thẩm định': 'KTTD',
  'Phòng Phát triển dịch vụ': 'PTDV',
  'Phòng Kế hoạch – Đấu thầu': 'KHDT',
  'Phòng Hành chính – Tổng hợp': 'HCTH'
};

const DEPT_PLAN_IDS: Record<string, Record<number, string>> = {
  'QLDA1': {
    5: 'a1111111-1111-4111-a111-111111111111',
    6: 'b1111111-1111-4111-b111-111111111111'
  },
  'QLDA2': {
    5: 'a2222222-2222-4222-a222-222222222222',
    6: 'b2222222-2222-4222-b222-222222222222'
  },
  'QLDA3': {
    5: 'a3333333-3333-4333-a333-333333333333',
    6: 'b3333333-3333-4333-b333-333333333333'
  },
  'KTTD': {
    5: 'a4444444-4444-4444-a444-444444444444',
    6: 'b4444444-4444-4444-b444-444444444444'
  },
  'PTDV': {
    5: 'a5555555-5555-4555-a555-555555555555',
    6: 'b5555555-5555-4555-b555-555555555555'
  },
  'KHDT': {
    5: 'a6666666-6666-4666-a666-666666666666',
    6: 'b6666666-6666-4666-b666-666666666666'
  },
  'HCTH': {
    5: 'a7777777-7777-4777-a777-777777777777',
    6: 'b7777777-7777-4777-b777-777777777777'
  }
};

// Task templates mapping
const QLDA_TEMPLATES = [
  { title: 'Giám sát hiện trường thi công xây dựng hạng mục chính dự án {project_name}', category: 'thi_cong' as TaskCategory, needProject: true },
  { title: 'Nghiệm thu khối lượng hoàn thành xây dựng đợt {rand} dự án {project_name}', category: 'ban_giao' as TaskCategory, needProject: true },
  { title: 'Lập và hoàn thiện hồ sơ quyết toán A-B dự án {project_name}', category: 'quyet_toan' as TaskCategory, needProject: true },
  { title: 'Kiểm tra công tác quản lý chất lượng thi công tại công trình {project_name}', category: 'kiem_tra' as TaskCategory, needProject: true },
  { title: 'Thực hiện thủ tục điều chỉnh thiết kế bản vẽ thi công và dự toán dự án {project_name}', category: 'dieu_chinh' as TaskCategory, needProject: true },
  { title: 'Giải quyết vướng mắc mặt bằng và bồi thường GPMB tại dự án {project_name}', category: 'gpmb' as TaskCategory, needProject: true },
  { title: 'Thanh toán khối lượng hoàn thành đợt {rand} cho nhà thầu thi công dự án {project_name}', category: 'thanh_toan' as TaskCategory, needProject: true }
];

const KTTD_TEMPLATES = [
  { title: 'Thẩm định hồ sơ thiết kế bản vẽ thi công hạng mục Nhà học thuộc dự án {project_name}', category: 'tham_dinh' as TaskCategory, needProject: true },
  { title: 'Thẩm tra tổng dự toán xây dựng công trình hạng mục bổ sung dự án {project_name}', category: 'tham_dinh' as TaskCategory, needProject: true },
  { title: 'Thẩm định hồ sơ mời thầu (HSMT) gói thầu xây lắp dự án {project_name}', category: 'tham_dinh' as TaskCategory, needProject: true },
  { title: 'Tham gia kiểm tra hiện trường đánh giá chất lượng công trình định kỳ dự án {project_name}', category: 'kiem_tra' as TaskCategory, needProject: true },
  { title: 'Góp ý dự thảo Thông tư hướng dẫn phương pháp xác định định mức dự toán xây dựng', category: 'gop_y' as TaskCategory, needProject: false },
  { title: 'Xây dựng quy trình thẩm định các chi phí vận hành nội bộ trong Ban', category: 'dieu_hanh' as TaskCategory, needProject: false }
];

const PTDV_TEMPLATES = [
  { title: 'Thực hiện công tác bồi thường giải phóng mặt bằng dự án {project_name}', category: 'gpmb' as TaskCategory, needProject: true },
  { title: 'Lập báo cáo đề xuất chủ trương đầu tư dự án {project_name}', category: 'tham_dinh' as TaskCategory, needProject: true },
  { title: 'Khảo sát mặt bằng mỏ đất san lấp phục vụ thi công dự án {project_name}', category: 'kiem_tra' as TaskCategory, needProject: true },
  { title: 'Thực hiện giám sát thi công hạng mục phụ trợ dự án {project_name}', category: 'thi_cong' as TaskCategory, needProject: true },
  { title: 'Tổng hợp và phối hợp thực hiện báo cáo chuyên đề về phát triển dịch vụ tư vấn của phòng', category: 'bao_cao' as TaskCategory, needProject: false }
];

const KHDT_TEMPLATES = [
  { title: 'Thẩm định kế hoạch lựa chọn nhà thầu (KHLCNT) dự án {project_name}', category: 'dau_thau' as TaskCategory, needProject: true },
  { title: 'Đánh giá hồ sơ đề xuất kỹ thuật gói thầu tư vấn giám sát dự án {project_name}', category: 'dau_thau' as TaskCategory, needProject: true },
  { title: 'Lập hồ sơ mời thầu (HSMT) qua mạng gói thầu xây lắp dự án {project_name}', category: 'dau_thau' as TaskCategory, needProject: true },
  { title: 'Rà soát điều chỉnh kế hoạch vốn đầu tư công năm 2026 của Ban', category: 'dieu_chinh' as TaskCategory, needProject: false },
  { title: 'Tổng hợp báo cáo số liệu giải ngân vốn đầu tư định kỳ gửi Sở Tài chính', category: 'bao_cao' as TaskCategory, needProject: false }
];

const HCTH_TEMPLATES = [
  { title: 'Thực hiện thanh toán lương, bảo hiểm xã hội và các chế độ chính sách cho cán bộ Ban', category: 'thanh_toan' as TaskCategory, needProject: false },
  { title: 'Tiếp nhận, xử lý và phân phối văn bản đi/đến trên hệ thống e-Office', category: 'khac' as TaskCategory, needProject: false },
  { title: 'Tổng hợp số liệu làm thêm giờ và lập bảng chấm công cơ quan', category: 'bao_cao' as TaskCategory, needProject: false },
  { title: 'Thực hiện kiểm tra quyết toán thuế TNCN và thuế GTGT nội bộ', category: 'khac' as TaskCategory, needProject: false },
  { title: 'Chuẩn bị công tác hậu cần phục vụ hội nghị sơ kết tình hình thực hiện nhiệm vụ', category: 'khac' as TaskCategory, needProject: false },
  { title: 'Bảo trì, sửa chữa cơ sở vật chất, hệ thống điện nước văn phòng Ban', category: 'khac' as TaskCategory, needProject: false }
];

const HEAD_TEMPLATES = [
  { title: 'Chỉ đạo và điều hành chung toàn bộ tiến độ, chất lượng các công việc của phòng', category: 'dieu_hanh' as TaskCategory, needProject: false },
  { title: 'Rà soát, kiểm tra và ký duyệt báo cáo định kỳ tuần/tháng của phòng', category: 'bao_cao' as TaskCategory, needProject: false },
  { title: 'Họp giao ban định kỳ với Ban Giám đốc về tình hình thực hiện nhiệm vụ chuyên môn', category: 'dieu_hanh' as TaskCategory, needProject: false }
];

const INCOMPLETE_REASONS = [
  { text: 'Do nhà thầu thi công chưa cung cấp đầy đủ hồ sơ quản lý chất lượng và kết quả thí nghiệm nén mẫu bê tông.', type: 'subjective' as const },
  { text: 'Đơn vị tư vấn chậm trễ trong việc cập nhật số liệu khảo sát địa chất thực tế tại hiện trường nút giao.', type: 'subjective' as const },
  { text: 'Thời tiết mưa bão kéo dài liên tục ảnh hưởng đến công tác thi công thảm nhựa mặt đường.', type: 'objective' as const },
  { text: 'Chưa được UBND tỉnh phân bổ nguồn vốn kế hoạch đầu tư công năm 2026 bổ sung.', type: 'objective' as const },
  { text: 'Sở Xây dựng đang tổ chức họp thẩm định liên ngành để xem xét phương án thiết kế kiến trúc điều chỉnh.', type: 'objective' as const },
  { text: 'Vướng mắc giải phóng mặt bằng của 3 hộ dân chưa đồng ý với phương án bồi thường đất nông nghiệp.', type: 'objective' as const }
];

async function main() {
  console.log('=== BẮT ĐẦU CHẠY SEED DỮ LIỆU DYNAMIC 2-5 ĐẦU VIỆC MỖI NGƯỜI ===');

  // 1. Fetch employees and projects
  const { data: employees, error: empErr } = await supabase.from('employees').select('employee_id, full_name, department, position');
  if (empErr) {
    console.error('Lỗi lấy danh sách nhân viên:', empErr.message);
    process.exit(1);
  }
  console.log(`Đã tải ${employees.length} nhân viên.`);

  const { data: projects, error: projErr } = await supabase.from('projects').select('project_id, project_name').limit(500);
  if (projErr) {
    console.error('Lỗi lấy danh sách dự án:', projErr.message);
    process.exit(1);
  }
  console.log(`Đã tải ${projects.length} dự án mẫu.`);

  // Filter employees belonging to the 7 departments
  const targetEmployees = employees.filter(e => e.department && DEPT_MAPPING[e.department]);
  console.log(`Tìm thấy ${targetEmployees.length} nhân viên thuộc 7 phòng ban mục tiêu.`);

  // 2. Clear old data
  console.log('Dọn dẹp dữ liệu cũ...');
  await supabase.from('task_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('task_activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('sub_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('monthly_plan_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('monthly_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Đã dọn dẹp sạch.');

  // 3. Create monthly_plans headers
  const monthlyPlans = [
    // May 2026
    { id: 'a1111111-1111-4111-a111-111111111111', plan_month: 5, plan_year: 2026, department_code: 'QLDA1', department_name: 'Phòng Quản lý dự án 1', status: 'published', notes: 'Báo cáo công việc tháng 5/2026 - Phòng QLDA1' },
    { id: 'a2222222-2222-4222-a222-222222222222', plan_month: 5, plan_year: 2026, department_code: 'QLDA2', department_name: 'Phòng Quản lý dự án 2', status: 'published', notes: 'Báo cáo công việc tháng 5/2026 - Phòng QLDA2' },
    { id: 'a3333333-3333-4333-a333-333333333333', plan_month: 5, plan_year: 2026, department_code: 'QLDA3', department_name: 'Phòng Quản lý dự án 3', status: 'published', notes: 'Báo cáo công việc tháng 5/2026 - Phòng QLDA3' },
    { id: 'a4444444-4444-4444-a444-444444444444', plan_month: 5, plan_year: 2026, department_code: 'KTTD', department_name: 'Phòng Kỹ thuật – Thẩm định', status: 'published', notes: 'Báo cáo công việc tháng 5/2026 - Phòng KTTD' },
    { id: 'a5555555-5555-4555-a555-555555555555', plan_month: 5, plan_year: 2026, department_code: 'PTDV', department_name: 'Phòng Phát triển dịch vụ', status: 'published', notes: 'Báo cáo công việc tháng 5/2026 - Phòng PTDV' },
    { id: 'a6666666-6666-4666-a666-666666666666', plan_month: 5, plan_year: 2026, department_code: 'KHDT', department_name: 'Phòng Kế hoạch – Đấu thầu', status: 'published', notes: 'Báo cáo công việc tháng 5/2026 - Phòng KHDT' },
    { id: 'a7777777-7777-4777-a777-777777777777', plan_month: 5, plan_year: 2026, department_code: 'HCTH', department_name: 'Phòng Hành chính – Tổng hợp', status: 'published', notes: 'Báo cáo công việc tháng 5/2026 - Phòng HCTH' },

    // June 2026
    { id: 'b1111111-1111-4111-b111-111111111111', plan_month: 6, plan_year: 2026, department_code: 'QLDA1', department_name: 'Phòng Quản lý dự án 1', status: 'published', notes: 'Kế hoạch công việc tháng 6/2026 - Phòng QLDA1' },
    { id: 'b2222222-2222-4222-b222-222222222222', plan_month: 6, plan_year: 2026, department_code: 'QLDA2', department_name: 'Phòng Quản lý dự án 2', status: 'published', notes: 'Kế hoạch công việc tháng 6/2026 - Phòng QLDA2' },
    { id: 'b3333333-3333-4333-b333-333333333333', plan_month: 6, plan_year: 2026, department_code: 'QLDA3', department_name: 'Phòng Quản lý dự án 3', status: 'published', notes: 'Kế hoạch công việc tháng 6/2026 - Phòng QLDA3' },
    { id: 'b4444444-4444-4444-b444-444444444444', plan_month: 6, plan_year: 2026, department_code: 'KTTD', department_name: 'Phòng Kỹ thuật – Thẩm định', status: 'published', notes: 'Kế hoạch công việc tháng 6/2026 - Phòng KTTD' },
    { id: 'b5555555-5555-4555-b555-555555555555', plan_month: 6, plan_year: 2026, department_code: 'PTDV', department_name: 'Phòng Phát triển dịch vụ', status: 'published', notes: 'Kế hoạch công việc tháng 6/2026 - Phòng PTDV' },
    { id: 'b6666666-6666-4666-b666-666666666666', plan_month: 6, plan_year: 2026, department_code: 'KHDT', department_name: 'Phòng Kế hoạch – Đấu thầu', status: 'published', notes: 'Kế hoạch công việc tháng 6/2026 - Phòng KHDT' },
    { id: 'b7777777-7777-4777-b777-777777777777', plan_month: 6, plan_year: 2026, department_code: 'HCTH', department_name: 'Phòng Hành chính – Tổng hợp', status: 'published', notes: 'Kế hoạch công việc tháng 6/2026 - Phòng HCTH' },
  ];

  const { error: mPlansErr } = await supabase.from('monthly_plans').insert(monthlyPlans);
  if (mPlansErr) {
    console.error('Lỗi chèn monthly_plans:', mPlansErr.message);
    process.exit(1);
  }
  console.log('Đã tạo 14 headers cho monthly_plans.');

  // 4. Generate dynamic tasks per employee
  console.log('Bắt đầu sinh ngẫu nhiên công việc cho từng cán bộ...');
  
  const tasksToInsert: any[] = [];
  const mpisToInsert: any[] = [];
  const updatePairs: { mpiId: string, taskId: string }[] = [];

  const months = [5, 6];

  for (const emp of targetEmployees) {
    const deptCode = DEPT_MAPPING[emp.department];
    const isHead = emp.position && (emp.position.includes('Trưởng phòng') || emp.position.includes('Phụ trách') || emp.position.includes('Kế toán trưởng'));
    
    // Choose appropriate templates
    let templates = QLDA_TEMPLATES;
    if (deptCode === 'KTTD') templates = KTTD_TEMPLATES;
    else if (deptCode === 'PTDV') templates = PTDV_TEMPLATES;
    else if (deptCode === 'KHDT') templates = KHDT_TEMPLATES;
    else if (deptCode === 'HCTH') templates = HCTH_TEMPLATES;

    // Respective head of department
    let approverId = 'NV003'; // PGĐ Trần Ngọc Bảo
    if (isHead) {
      approverId = 'NV002'; // GĐ Nguyễn Quang Linh
    } else {
      const deptHead = targetEmployees.find(e => DEPT_MAPPING[e.department] === deptCode && e.position && (e.position.includes('Trưởng phòng') || e.position.includes('Phụ trách')));
      if (deptHead) {
        approverId = deptHead.employee_id;
      }
    }

    for (const month of months) {
      // Determine number of tasks: 2 to 5 tasks per employee per month
      const numTasks = Math.floor(Math.random() * 4) + 2; // 2, 3, 4, or 5
      
      const shuffledTemplates = [...templates].sort(() => 0.5 - Math.random());
      const headTemplates = [...HEAD_TEMPLATES].sort(() => 0.5 - Math.random());

      for (let t = 0; t < numTasks; t++) {
        let template = isHead && t < 2 ? headTemplates[t % headTemplates.length] : shuffledTemplates[t % shuffledTemplates.length];
        
        // Pick a project
        const project = projects[Math.floor(Math.random() * projects.length)];
        const project_id = template.needProject ? project.project_id : null;
        
        let title = template.title;
        if (project_id && project) {
          title = title.replace('{project_name}', project.project_name);
        }
        title = title.replace('{rand}', String(Math.floor(Math.random() * 5) + 1));
        title = title.replace('{month}', String(month));

        // Determine status: May has done/in-progress/incomplete, June has only todo (new)
        let status: 'todo' | 'in_progress' | 'done' | 'incomplete' = 'done';
        let progress = 100;
        
        if (month === 6) {
          status = 'todo';
          progress = 0;
        } else {
          const randStatus = Math.random();
          if (randStatus < 0.05) {
            status = 'todo';
            progress = 0;
          } else if (randStatus < 0.20) {
            status = 'in_progress';
            progress = Math.floor(Math.random() * 8) * 10 + 10; // 10% to 80%
          } else if (randStatus < 0.30) {
            status = 'incomplete';
            progress = Math.floor(Math.random() * 7) * 10 + 10; // 10% to 70%
          }
        }

        const start_date = month === 5 ? `2026-05-04` : `2026-06-01`;
        const due_date = month === 5 
          ? `2026-05-${Math.floor(Math.random() * 5) + 25}` // 25 to 29
          : `2026-06-${Math.floor(Math.random() * 5) + 26}`; // 26 to 30

        let actual_end_date: string | null = null;
        let completion_result: string | null = null;
        let incomplete_reason: string | null = null;
        let incomplete_reason_type: 'objective' | 'subjective' | null = null;

        if (status === 'done') {
          // On-time rate: 85% on time, 15% late
          const isOnTime = Math.random() > 0.15;
          if (isOnTime) {
            actual_end_date = '2026-05-22';
          } else {
            actual_end_date = '2026-05-29';
          }
          completion_result = `Đã hoàn thành sản phẩm bàn giao, lập báo cáo kết quả và trình ký Biên bản nghiệm thu theo quy chế. Kết quả chi tiết lưu trữ tại Hồ sơ lưu trữ số ${crypto.randomBytes(3).toString('hex').toUpperCase()}.`;
        } else if (status === 'incomplete') {
          const reasonObj = INCOMPLETE_REASONS[Math.floor(Math.random() * INCOMPLETE_REASONS.length)];
          incomplete_reason = reasonObj.text;
          incomplete_reason_type = reasonObj.type;
        }

        const mpiId = crypto.randomUUID();
        const taskId = crypto.randomUUID();
        const monthlyPlanId = DEPT_PLAN_IDS[deptCode][month];

        // Create Monthly Plan Item
        mpisToInsert.push({
          id: mpiId,
          monthly_plan_id: monthlyPlanId,
          task_name: title,
          deliverable: status === 'done' ? (completion_result || 'Sản phẩm hoàn thành') : 'Đầu ra công việc theo kế hoạch',
          due_date: due_date,
          status: status === 'done' ? 'completed' : 'planned',
          completion_result: completion_result,
          incomplete_reason: incomplete_reason,
          notes: `Công việc mẫu phòng ${deptCode}`,
          project_id: project_id,
          source_type: 'from_project_task'
        });

        // Create Task
        tasksToInsert.push({
          id: taskId,
          title: title,
          task_type: project_id ? 'project' : 'internal',
          project_id: project_id,
          status: status,
          priority: Math.random() > 0.5 ? 'medium' : 'high',
          progress: progress,
          assignee_id: emp.employee_id,
          approver_id: approverId,
          start_date: start_date,
          due_date: due_date,
          actual_start_date: status !== 'todo' ? start_date : null,
          actual_end_date: actual_end_date,
          responsibility_level: Math.random() > 0.8 ? 'team' : 'individual',
          category: template.category,
          completion_result: completion_result,
          incomplete_reason: incomplete_reason,
          incomplete_reason_type: incomplete_reason_type,
          notes: `Công việc mẫu phòng ${deptCode}`,
          monthly_plan_item_id: mpiId
        });

        updatePairs.push({ mpiId, taskId });
      }
    }
  }

  console.log(`Chuẩn bị chèn ${mpisToInsert.length} monthly_plan_items và ${tasksToInsert.length} tasks...`);

  // Insert MPIs in chunks of 100
  const chunkSize = 100;
  for (let i = 0; i < mpisToInsert.length; i += chunkSize) {
    const chunk = mpisToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('monthly_plan_items').insert(chunk);
    if (error) {
      console.error(`Lỗi chèn chunk MPI tại index ${i}:`, error.message);
      process.exit(1);
    }
  }
  console.log(`Đã chèn xong tất cả monthly_plan_items.`);

  // Insert Tasks in chunks of 100
  for (let i = 0; i < tasksToInsert.length; i += chunkSize) {
    const chunk = tasksToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('tasks').insert(chunk);
    if (error) {
      console.error(`Lỗi chèn chunk Tasks tại index ${i}:`, error.message);
      process.exit(1);
    }
  }
  console.log(`Đã chèn xong tất cả tasks.`);

  // Update source_task_id in monthly_plan_items in chunks of 50
  console.log('Đang cập nhật liên kết source_task_id ngược lại monthly_plan_items...');
  for (let i = 0; i < updatePairs.length; i += 50) {
    const chunk = updatePairs.slice(i, i + 50);
    // We execute updates in parallel for efficiency
    await Promise.all(chunk.map(pair => 
      supabase.from('monthly_plan_items').update({ source_task_id: pair.taskId }).eq('id', pair.mpiId)
    ));
  }

  console.log(`\n=== ✅ SEED COMPLETE ===`);
  console.log(`Tổng số monthly_plan_items đã tạo: ${mpisToInsert.length}`);
  console.log(`Tổng số tasks chi tiết đã tạo: ${tasksToInsert.length}`);
  console.log('Bộ dữ liệu mẫu lớn đã được khởi tạo thành công và sẵn sàng để kiểm thử!');
}

main().catch(console.error);
