const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function search() {
  const { data, error } = await supabase
    .from('employees')
    .select('employee_id, full_name, role, department, position')
    .or('department.ilike.%kỹ thuật%,department.ilike.%thẩm định%,department.ilike.%kt-tđ%,department.ilike.%kttđ%,full_name.ilike.%Tuấn Dũng%,full_name.ilike.%Đức Giang%,full_name.ilike.%Thúc Hiếu%,full_name.ilike.%Văn Minh%,full_name.ilike.%Xuân Quế%,full_name.ilike.%Tiến Hưng%,full_name.ilike.%Đức Huy%,full_name.ilike.%Văn Đức%,full_name.ilike.%Khánh Linh%,full_name.ilike.%Thị Hiền%,full_name.ilike.%Trọng Hải%');

  if (error) {
    console.error(error);
    return;
  }
  console.log(`Tìm thấy ${data.length} nhân viên phòng KTTĐ hoặc liên quan:`);
  data.forEach(e => {
    console.log(`- [${e.employee_id}] ${e.full_name} | Phòng: ${e.department} | Chức vụ: ${e.position}`);
  });
}

search();
