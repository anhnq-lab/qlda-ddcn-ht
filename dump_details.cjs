require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

  try {
    const { data: dept_emps, error: err1 } = await supabase.rpc('get_employees_by_department'); // Let's try to query RPC or just table
    const { data: qlda_users, error: err2 } = await supabase.from('profiles').select('*'); // Try again?
    
    // Actually, I saw `EMPLOYEES` earlier returning `employee_id, full_name, email, department, role, status`!
    const { data: employees, error: err3 } = await supabase.from('employees').select('employee_id, full_name, department, role, position').limit(100);

    const { data: projects, error: err4 } = await supabase.from('projects').select('project_id, project_name, status, group_code').limit(100);

    const { data: annual, error: err5 } = await supabase.from('annual_plan_items').select('id, department_code, task_name, project_id, responsible_text').limit(100);

    console.log('--- EMPLOYEES ---');
    console.table(employees || []);
    console.log('--- PROJECTS ---');
    console.table(projects || []);
    console.log('--- ANNUAL PLAN ITEMS ---');
    console.table(annual || []);
  } catch (err) {
    console.error(err);
  }
}

run();
