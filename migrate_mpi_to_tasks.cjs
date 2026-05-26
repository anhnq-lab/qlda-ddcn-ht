// Migration script: migrate_mpi_to_tasks.cjs
// Chuyển đổi dữ liệu cũ từ monthly_plan_items sang tasks
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('Lỗi: Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { persistSession: false }
});

const STATUS_MAP = {
  completed: 'done',
  partial: 'in_progress',
  incomplete: 'incomplete',
  planned: 'todo',
  deferred: 'incomplete'
};

async function runMigration() {
  console.log('=== BẮT ĐẦU DI TRÚ DỮ LIỆU MONTHLY_PLAN_ITEMS -> TASKS ===');

  // 1. Tải tất cả plans
  const { data: plans, error: plansErr } = await supabase
    .from('monthly_plans')
    .select('id, plan_month, plan_year, department_code');
  
  if (plansErr) {
    console.error('Không thể tải monthly_plans:', plansErr);
    process.exit(1);
  }

  const plansMap = new Map(plans.map(p => [p.id, p]));
  console.log(`Đã tải ${plans.length} monthly plans.`);

  // 2. Tải tất cả monthly_plan_items
  const { data: mpis, error: mpisErr } = await supabase
    .from('monthly_plan_items')
    .select('*');

  if (mpisErr) {
    console.error('Không thể tải monthly_plan_items:', mpisErr);
    process.exit(1);
  }
  console.log(`Đã tải ${mpis.length} monthly_plan_items.`);

  // 3. Tải tất cả tasks hiện tại để kiểm tra trùng
  const { data: existingTasks, error: tasksErr } = await supabase
    .from('tasks')
    .select('id, title, due_date, department_code, project_id, project_plan_step_id, annual_plan_item_id');

  if (tasksErr) {
    console.error('Không thể tải tasks:', tasksErr);
    process.exit(1);
  }
  console.log(`Đã tải ${existingTasks.length} tasks hiện tại.`);

  // Để an toàn, chúng ta map trùng dựa trên project_plan_step_id hoặc annual_plan_item_id trong cùng tháng và phòng ban
  // Hoặc dựa trên tiêu đề + tháng + phòng ban
  const buildTaskKey = (title, dueDateStr, deptCode, projectId) => {
    const d = new Date(dueDateStr);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    return `${title.trim().toLowerCase()}_${m}_${y}_${(deptCode || '').toLowerCase()}_${projectId || 'none'}`;
  };

  const existingTaskKeys = new Set();
  existingTasks.forEach(t => {
    if (t.title && t.due_date) {
      existingTaskKeys.add(buildTaskKey(t.title, t.due_date, t.department_code, t.project_id));
    }
  });

  const tasksToInsert = [];
  let skippedCount = 0;

  for (const mpi of mpis) {
    const plan = plansMap.get(mpi.monthly_plan_id);
    if (!plan) {
      console.warn(`Cảnh báo: MonthlyPlanItem ${mpi.id} không tìm thấy plan header ${mpi.monthly_plan_id}. Bỏ qua.`);
      skippedCount++;
      continue;
    }

    const m = plan.plan_month;
    const y = plan.plan_year;
    const deptCode = plan.department_code;

    const startDateStr = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDateStr = new Date(y, m, 0).toISOString().split('T')[0];
    const dueDate = mpi.due_date || endDateStr;

    // Kiểm tra trùng
    const key = buildTaskKey(mpi.task_name, dueDate, deptCode, mpi.project_id);
    if (existingTaskKeys.has(key)) {
      skippedCount++;
      continue;
    }

    const taskStatus = STATUS_MAP[mpi.status] || 'todo';

    tasksToInsert.push({
      title: mpi.task_name,
      description: mpi.deliverable || '',
      task_type: mpi.project_id ? 'project' : 'internal',
      status: taskStatus,
      priority: 'medium',
      progress: taskStatus === 'done' ? 100 : (taskStatus === 'in_progress' ? 50 : 0),
      due_date: dueDate,
      start_date: startDateStr,
      assignee_id: null, // Sẽ được trigger hoặc assign sau
      department_code: deptCode,
      annual_plan_item_id: mpi.annual_plan_item_id || null,
      project_plan_step_id: mpi.source_project_plan_item_id || null,
      source_type: mpi.source_type || 'manual',
      notes: mpi.notes || '',
      completion_result: mpi.completion_result || '',
      incomplete_reason: mpi.incomplete_reason || '',
      sort_order: mpi.sort_order || 0,
      metadata: {
        collaborating_text: mpi.collaborating_text || '',
        deadline_note: mpi.deadline_note || '',
        migrated_from_mpi_id: mpi.id
      }
    });
  }

  console.log(`Tổng số item cần di trú: ${tasksToInsert.length} (Bỏ qua/trùng: ${skippedCount})`);

  if (tasksToInsert.length > 0) {
    // Insert theo lô nhỏ để tránh timeout (lô 100 records)
    const chunkSize = 100;
    for (let i = 0; i < tasksToInsert.length; i += chunkSize) {
      const chunk = tasksToInsert.slice(i, i + chunkSize);
      const { error: insertErr } = await supabase
        .from('tasks')
        .insert(chunk);
      
      if (insertErr) {
        console.error(`Lỗi khi insert lô ${i} - ${i + chunk.length}:`, insertErr);
        process.exit(1);
      }
      console.log(`Đã di trú xong lô ${i + 1} đến ${i + chunk.length}`);
    }
  }

  console.log('=== DI TRÚ DỮ LIỆU THÀNH CÔNG ===');
}

runMigration().catch(err => {
  console.error('Lỗi nghiêm trọng trong quá trình di trú:', err);
  process.exit(1);
});
