import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectThaoTask() {
  console.log('=== TRUY VẤN CÔNG VIỆC CỦA THẢO & NGUYÊN TRÊN DB ===\n');

  // Lấy các task của nhân sự Nguyễn Thị Thu Thảo (NV061) và Lê Tùng Nguyên (NV056)
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, description, assignee_id, start_date')
    .in('assignee_id', ['NV061', 'NV056']);

  if (error) {
    console.error('Lỗi truy vấn:', error.message);
  } else {
    console.log(`Tìm thấy ${data.length} công việc:`);
    data.forEach(task => {
      console.log(`------------------------------------------------`);
      console.log(`ID: ${task.id}`);
      console.log(`Cán bộ: ${task.assignee_id === 'NV061' ? 'Nguyễn Thị Thu Thảo' : 'Lê Tùng Nguyên'}`);
      console.log(`Tháng: ${task.start_date}`);
      console.log(`TIÊU ĐỀ (title): ${JSON.stringify(task.title)}`);
      console.log(`MÔ TẢ (description): ${JSON.stringify(task.description)}`);
    });
  }
}

inspectThaoTask();
