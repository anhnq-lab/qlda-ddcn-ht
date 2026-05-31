import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Không tìm thấy cấu hình kết nối Supabase trong file .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearTasksData() {
  console.log('=== BẮT ĐẦU DỌN DẸP DỮ LIỆU MẪU MODULE QUẢN LÝ CÔNG VIỆC ===\n');

  try {
    // 1. Xóa các bảng phụ trước để an toàn (mặc dù đã có ON DELETE CASCADE)
    console.log('1. Đang dọn dẹp bảng [sub_tasks]...');
    const { error: subTasksErr } = await supabase
      .from('sub_tasks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Xóa tất cả các bản ghi có ID khác null
    if (subTasksErr) {
      console.error('Lỗi khi xóa bảng sub_tasks:', subTasksErr.message);
    } else {
      console.log('✓ Hoàn thành dọn dẹp bảng [sub_tasks]');
    }

    console.log('2. Đang dọn dẹp bảng [task_comments]...');
    const { error: commentsErr } = await supabase
      .from('task_comments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (commentsErr) {
      console.error('Lỗi khi xóa bảng task_comments:', commentsErr.message);
    } else {
      console.log('✓ Hoàn thành dọn dẹp bảng [task_comments]');
    }

    console.log('3. Đang dọn dẹp bảng [task_activities]...');
    const { error: activitiesErr } = await supabase
      .from('task_activities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (activitiesErr) {
      console.error('Lỗi khi xóa bảng task_activities:', activitiesErr.message);
    } else {
      console.log('✓ Hoàn thành dọn dẹp bảng [task_activities]');
    }

    // 2. Xóa bảng chính tasks
    console.log('4. Đang dọn dẹp bảng [tasks]...');
    const { error: tasksErr } = await supabase
      .from('tasks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (tasksErr) {
      console.error('Lỗi khi xóa bảng tasks:', tasksErr.message);
    } else {
      console.log('✓ Hoàn thành dọn dẹp bảng [tasks]');
    }

    console.log('\n=== KIỂM TRA LẠI SỐ LƯỢNG BẢN GHI SAU KHI DỌN DẸP ===');
    const tables = ['tasks', 'sub_tasks', 'task_comments', 'task_activities'];
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.error(`Lỗi khi đếm bảng [${table}]:`, error.message);
      } else {
        console.log(`Bảng [${table}]: ${count} bản ghi`);
      }
    }

    console.log('\n=== HOÀN THÀNH DỌN DẸP TOÀN BỘ HỆ THỐNG QUẢN LÝ CÔNG VIỆC ===');
  } catch (err: any) {
    console.error('Lỗi nghiêm trọng trong quá trình xử lý:', err.message || err);
  }
}

clearTasksData();
