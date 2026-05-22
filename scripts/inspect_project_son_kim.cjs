require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- INSPECT PROJECT SƠN KIM 1 ---');
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('project_id', '8173865');
    
  if (error) {
    console.error('Lỗi khi query projects:', error);
  } else {
    console.log('Thông tin dự án Sơn Kim 1:', data);
  }
}

run();
