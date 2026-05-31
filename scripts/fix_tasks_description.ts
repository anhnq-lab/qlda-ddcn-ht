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

async function fixDescriptions() {
  console.log('=== BẮT ĐẦU CẬP NHẬT LOẠI BỎ TÊN DỰ ÁN DƯ THỪA TRONG DESCRIPTION ===\n');

  try {
    // 1. Lấy tất cả các task hiện tại
    const { data: tasks, error: fetchErr } = await supabase
      .from('tasks')
      .select('id, description');

    if (fetchErr) {
      console.error('Lỗi khi lấy danh sách tasks:', fetchErr.message);
      return;
    }

    console.log(`- Tìm thấy ${tasks.length} công việc trong database. Đang quét lọc...`);
    let updatedCount = 0;

    for (const task of tasks) {
      const desc = task.description || '';
      
      // Nếu description bắt đầu bằng "Dự án:"
      if (desc.startsWith('Dự án:')) {
        const lines = desc.split('\n');
        
        // Dòng thứ 2 thường là "Nhiệm vụ đầu ra: ..."
        let newDesc = '';
        if (lines.length > 1) {
          // Lọc bỏ dòng đầu tiên (dòng tên dự án) và ghép các dòng còn lại
          newDesc = lines.slice(1).join('\n').trim();
        } else {
          // Nếu chỉ có 1 dòng, để trống hoặc giữ nguyên tùy trường hợp
          newDesc = '';
        }

        // Cập nhật lại vào DB
        const { error: updateErr } = await supabase
          .from('tasks')
          .update({ description: newDesc })
          .eq('id', task.id);

        if (updateErr) {
          console.error(`✕ Lỗi khi cập nhật task ${task.id}:`, updateErr.message);
        } else {
          updatedCount++;
          console.log(`✓ Đã cập nhật task [${task.id}]:`);
          console.log(`  - Trước: "${desc.replace(/\n/g, ' | ')}"`);
          console.log(`  - Sau:  "${newDesc}"`);
        }
      }
    }

    console.log(`\n=== HOÀN THÀNH: Đã dọn dẹp thành công ${updatedCount}/${tasks.length} công việc! ===`);
  } catch (err: any) {
    console.error('Lỗi hệ thống:', err.message || err);
  }
}

fixDescriptions();
