import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Dùng service role để ghi dữ liệu dễ dàng

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const projectId = '8133114'; // Dự án cải tạo nâng cấp
  console.log(`Bắt đầu seed test tasks cho dự án ${projectId}...`);

  // Xóa các task hiện tại của dự án này để làm sạch
  const { error: deleteErr } = await supabase
    .from('tasks')
    .delete()
    .eq('project_id', projectId);
    
  if (deleteErr) {
    console.error('Lỗi khi xóa tasks cũ:', deleteErr);
  }

  // 1. Tạo Task cha 1 (Chuẩn bị hồ sơ thiết kế)
  const { data: parent1, error: parent1Err } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      title: 'Bước 1: Chuẩn bị hồ sơ thiết kế và lập dự toán',
      task_type: 'project',
      status: 'in_progress',
      priority: 'high',
      progress: 40,
      start_date: '2026-05-01',
      due_date: '2026-05-15',
      phase: 'preparation',
      sort_order: 1,
    })
    .select()
    .single();

  if (parent1Err) {
    console.error('Lỗi tạo parent 1:', parent1Err);
    return;
  }
  console.log('Đã tạo task cha 1:', parent1.id);

  // Tạo các subtasks cho cha 1
  const subtasks1 = [
    {
      parent_id: parent1.id,
      project_id: projectId,
      title: 'Công việc con 1.1: Thu thập bản vẽ hiện trạng',
      task_type: 'project',
      status: 'done',
      priority: 'medium',
      progress: 100,
      start_date: '2026-05-01',
      due_date: '2026-05-05',
      sort_order: 1,
    },
    {
      parent_id: parent1.id,
      project_id: projectId,
      title: 'Công việc con 1.2: Lập thuyết minh thiết kế bản vẽ thi công',
      task_type: 'project',
      status: 'in_progress',
      priority: 'high',
      progress: 50,
      start_date: '2026-05-06',
      due_date: '2026-05-10',
      sort_order: 2,
    },
    {
      parent_id: parent1.id,
      project_id: projectId,
      title: 'Công việc con 1.3: Tính toán khối lượng và lập dự toán chi tiết',
      task_type: 'project',
      status: 'todo',
      priority: 'medium',
      progress: 0,
      start_date: '2026-05-11',
      due_date: '2026-05-15',
      sort_order: 3,
    }
  ];

  const { error: subs1Err } = await supabase.from('tasks').insert(subtasks1);
  if (subs1Err) {
    console.error('Lỗi tạo subtasks 1:', subs1Err);
  } else {
    console.log('Đã tạo thành công subtasks cho cha 1');
  }

  // 2. Tạo Task cha 2 (Thẩm định và phê duyệt)
  const { data: parent2, error: parent2Err } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      title: 'Bước 2: Thẩm định hồ sơ thiết kế bản vẽ thi công',
      task_type: 'project',
      status: 'todo',
      priority: 'medium',
      progress: 0,
      start_date: '2026-05-16',
      due_date: '2026-05-30',
      phase: 'preparation',
      sort_order: 2,
    })
    .select()
    .single();

  if (parent2Err) {
    console.error('Lỗi tạo parent 2:', parent2Err);
    return;
  }
  console.log('Đã tạo task cha 2:', parent2.id);

  // Tạo các subtasks cho cha 2
  const subtasks2 = [
    {
      parent_id: parent2.id,
      project_id: projectId,
      title: 'Công việc con 2.1: Gửi hồ sơ trình thẩm định',
      task_type: 'project',
      status: 'todo',
      priority: 'medium',
      progress: 0,
      start_date: '2026-05-16',
      due_date: '2026-05-20',
      sort_order: 1,
    },
    {
      parent_id: parent2.id,
      project_id: projectId,
      title: 'Công việc con 2.2: Rà soát ý kiến thẩm định chuyên môn',
      task_type: 'project',
      status: 'todo',
      priority: 'medium',
      progress: 0,
      start_date: '2026-05-21',
      due_date: '2026-05-25',
      sort_order: 2,
    },
    {
      parent_id: parent2.id,
      project_id: projectId,
      title: 'Công việc con 2.3: Ký duyệt quyết định phê duyệt thiết kế',
      task_type: 'project',
      status: 'todo',
      priority: 'high',
      progress: 0,
      start_date: '2026-05-26',
      due_date: '2026-05-30',
      sort_order: 3,
    }
  ];

  const { error: subs2Err } = await supabase.from('tasks').insert(subtasks2);
  if (subs2Err) {
    console.error('Lỗi tạo subtasks 2:', subs2Err);
  } else {
    console.log('Đã tạo thành công subtasks cho cha 2');
  }

  console.log('Hoàn tất seed test tasks!');
}

run().catch(console.error);
