import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function search() {
  const { data } = await supabase
    .from('employees')
    .select('employee_id, full_name')
    .or('full_name.ilike.%tùng%,full_name.ilike.%nguyên%');
    
  console.log('Kết quả tìm kiếm nhân sự chứa Tùng hoặc Nguyên:', data);
}

search();
