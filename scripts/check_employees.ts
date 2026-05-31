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

async function checkEmployees() {
  console.log('--- DANH SÁCH NHÂN VIÊN TRONG CƠ SỞ DỮ LIỆU ---');
  const { data, error } = await supabase
    .from('employees')
    .select('employee_id, full_name, role, department, position')
    .order('employee_id', { ascending: true });
    
  if (error) {
    console.error('Lỗi khi truy vấn:', error.message);
  } else {
    console.log(`Tìm thấy ${data.length} nhân viên:`);
    data.forEach(emp => {
      console.log(`- [${emp.employee_id}] ${emp.full_name} | Phòng: ${emp.department} | Chức vụ: ${emp.position} (Role: ${emp.role})`);
    });
  }
}

checkEmployees();
