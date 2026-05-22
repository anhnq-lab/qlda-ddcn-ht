require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Error fetching employees:', error);
    return;
  }

  console.log(`Found ${data.length} employees.`);
  if (data.length > 0) {
    console.log('Keys of first employee row:', Object.keys(data[0]));
    data.forEach(e => {
      console.log(`ID: ${e.EmployeeID || e.id} | Code: ${e.EmployeeCode || e.employee_code} | Name: ${e.FullName || e.full_name} | Dept: "${e.Department || e.department}" | Status: ${e.Status || e.status}`);
    });
  }
}

check();
