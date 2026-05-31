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

async function checkProjects() {
  console.log('--- DANH SÁCH DỰ ÁN TRONG CƠ SỞ DỮ LIỆU ---');
  const { data, error } = await supabase
    .from('projects')
    .select('project_id, project_name')
    .order('project_id', { ascending: true });
    
  if (error) {
    console.error('Lỗi khi truy vấn:', error.message);
  } else {
    console.log(`Tìm thấy ${data.length} dự án:`);
    data.forEach(proj => {
      console.log(`- [${proj.project_id}] ${proj.project_name}`);
    });
  }
}

checkProjects();
