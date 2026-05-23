import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong file .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed50Tasks() {
  console.log('Bắt đầu dọn dẹp và tạo 50 công việc mẫu...');

  // Xóa toàn bộ task hiện tại liên quan đến kế hoạch tháng 4
  await supabase.from('tasks').delete().neq('metadata->>monthly_plan_item_id', 'none');

  const { data: employees } = await supabase.from('employees').select('*');
  const { data: projects } = await supabase.from('projects').select('project_id');

  const deptCodes = ['HCTH', 'KHDT', 'KTTD', 'QLDA1', 'QLDA2', 'QLDA3', 'PTDV'];
  const dbDeptMapping: Record<string, string> = {
    'HCTH': 'Phòng Hành chính – Tổng hợp',
    'KHDT': 'Phòng Kế hoạch – Đấu thầu', 
    'KTTD': 'Phòng Kỹ thuật – Thẩm định',
    'QLDA1': 'Phòng Quản lý dự án 1',
    'QLDA2': 'Phòng Quản lý dự án 2',
    'QLDA3': 'Phòng Quản lý dự án 3',
    'PTDV': 'Phòng Phát triển dịch vụ'
  };

  let totalTasksCreated = 0;

  for (const deptCode of deptCodes) {
    const targetDeptName = dbDeptMapping[deptCode];
    
    // Tìm nhân viên thuộc phòng ban
    let availableEmployees = employees?.filter(e => e.department === targetDeptName) || [];
    if (availableEmployees.length === 0) {
        availableEmployees = employees || [];
    }

    // Lấy kế hoạch tháng 4
    const { data: existingPlan } = await supabase
      .from('monthly_plans')
      .select('id')
      .eq('department_code', deptCode)
      .eq('plan_month', 4)
      .eq('plan_year', 2026)
      .single();

    if (!existingPlan) continue;

    // Lấy các mục kế hoạch
    const { data: freshItems } = await supabase
        .from('monthly_plan_items')
        .select('id, task_name')
        .eq('monthly_plan_id', existingPlan.id);

    if (!freshItems || freshItems.length === 0) continue;

    const item = freshItems[0];
    
    const phases = [
        { suffix: 'Lập kế hoạch và chuẩn bị tài liệu', start: '2026-04-01', due: '2026-04-04' },
        { suffix: 'Thu thập số liệu và khảo sát', start: '2026-04-05', due: '2026-04-08' },
        { suffix: 'Triển khai thực hiện chuyên môn', start: '2026-04-09', due: '2026-04-14' },
        { suffix: 'Kiểm tra, rà soát tiến độ', start: '2026-04-15', due: '2026-04-18' },
        { suffix: 'Họp thống nhất và xin ý kiến', start: '2026-04-19', due: '2026-04-21' },
        { suffix: 'Hoàn thiện hồ sơ báo cáo', start: '2026-04-22', due: '2026-04-25' },
        { suffix: 'Trình lãnh đạo phê duyệt', start: '2026-04-26', due: '2026-04-28' },
    ];

    const projectId = projects && projects.length > 0 ? projects[Math.floor(Math.random() * projects.length)].project_id : null;

    for (const phase of phases) {
        const assignee = availableEmployees[Math.floor(Math.random() * availableEmployees.length)];
        
        let approver = availableEmployees.find(e => e.role === 'Trưởng phòng' || e.role === 'Phó Trưởng phòng');
        if (!approver) approver = availableEmployees[Math.floor(Math.random() * availableEmployees.length)];

        const newTask = {
            id: uuidv4(),
            title: `[${item.task_name}] - ${phase.suffix}`,
            task_type: projectId ? 'project' : 'internal',
            project_id: projectId,
            metadata: { monthly_plan_item_id: item.id },
            status: 'todo',
            priority: 'medium',
            assignee_id: assignee?.employee_id || null,
            approver_id: approver?.employee_id || null,
            start_date: `${phase.start}T08:00:00Z`,
            due_date: `${phase.due}T17:00:00Z`
        };
        
        await supabase.from('tasks').insert(newTask);
        totalTasksCreated++;
    }
  }

  console.log(`Đã tạo thành công ${totalTasksCreated} công việc logic!`);
}

seed50Tasks().catch(console.error);
