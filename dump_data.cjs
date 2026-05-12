require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

  try {
    const { data: projects, error: err1 } = await supabase.from('projects').select('*').limit(1);
    const { data: employees, error: err2 } = await supabase.from('employees').select('*').limit(1);
    const { data: annual_plans, error: err3 } = await supabase.from('annual_plans').select('*').limit(1);
    const { data: tasks, error: err4 } = await supabase.from('tasks').select('*').limit(1);
    
    console.log('--- PROJECTS ---', projects);
    console.log('--- EMPLOYEES ---', employees);
    console.log('--- ANNUAL PLANS ---', annual_plans);
    console.log('--- TASKS ---', tasks);
  } catch (err) {
    console.error(err);
  }
}

run();
