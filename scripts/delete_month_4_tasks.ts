import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteMonth4Tasks() {
  console.log('=== BẮT ĐẦU XÓA CÔNG VIỆC THÁNG 4/2026 ===\n');

  try {
    // 1. Đếm số lượng công việc tháng 4 trước khi xóa
    const { count: month4Count, error: countErr } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('start_date', '2026-04-01');

    if (countErr) {
      console.error('Lỗi khi đếm công việc tháng 4:', countErr.message);
      return;
    }

    console.log(`- Tìm thấy ${month4Count} công việc thuộc Tháng 4/2026.`);

    if (month4Count === 0) {
      console.log('Không có công việc tháng 4 nào để xóa.');
      return;
    }

    // 2. Thực hiện xóa các công việc tháng 4
    console.log('Đang xóa các công việc tháng 4...');
    const { error: deleteErr } = await supabase
      .from('tasks')
      .delete()
      .eq('start_date', '2026-04-01');

    if (deleteErr) {
      console.error('Lỗi khi xóa công việc tháng 4:', deleteErr.message);
      return;
    }
    console.log(`✓ Đã xóa thành công ${month4Count} công việc Tháng 4!`);

    // 3. Thống kê lại dữ liệu còn lại
    console.log('\n=== THỐNG KÊ DỮ LIỆU CÔNG VIỆC CÒN LẠI TRÊN HỆ THỐNG ===');
    
    // Đếm tháng 5
    const { count: month5Count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('start_date', '2026-05-01');
      
    // Đếm tháng 6
    const { count: month6Count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('start_date', '2026-06-01');
      
    // Đếm tổng số task còn lại
    const { count: totalRemaining } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    console.log(`- Công việc Tháng 5/2026 (Thực hiện): ${month5Count} bản ghi`);
    console.log(`- Công việc Tháng 6/2026 (Kế hoạch): ${month6Count} bản ghi`);
    console.log(`- Tổng số công việc còn lại trong DB: ${totalRemaining} bản ghi`);

    console.log('\n=== HOÀN THÀNH QUY TRÌNH XÓA CÔNG VIỆC THÁNG 4 ===');
  } catch (err: any) {
    console.error('Lỗi hệ thống:', err.message || err);
  }
}

deleteMonth4Tasks();
