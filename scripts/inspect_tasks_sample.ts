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

async function inspectSample() {
  console.log('--- LẤY 5 BẢN GHI MẪU TỪ BẢNG TASKS ---');
  const { data, error } = await supabase
    .from('tasks')
    .select('id, project_id, title, status, created_at')
    .limit(5);
    
  if (error) {
    console.error('Lỗi khi lấy mẫu:', error.message);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

inspectSample();
