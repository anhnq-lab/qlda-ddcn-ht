const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDistribution() {
  console.log('--- PHÂN TÍCH PHÂN BỐ CÔNG VIỆC THEO PHÒNG BAN ---');
  
  const { data: tasks, error: taskErr } = await supabase
    .from('tasks')
    .select('id, assignee_id, title, start_date');
    
  const { data: employees, error: empErr } = await supabase
    .from('employees')
    .select('employee_id, full_name, department');
    
  if (taskErr || empErr) {
    console.error(taskErr || empErr);
    return;
  }
  
  const distribution = {};
  let nullAssigneeCount = 0;
  
  tasks.forEach(t => {
    if (!t.assignee_id) {
      nullAssigneeCount++;
      return;
    }
    const emp = employees.find(e => e.employee_id === t.assignee_id);
    const dept = emp ? emp.department : 'Không xác định';
    if (!distribution[dept]) {
      distribution[dept] = { count: 0, mayCount: 0, juneCount: 0 };
    }
    distribution[dept].count++;
    if (t.start_date === '2026-05-01') {
      distribution[dept].mayCount++;
    } else if (t.start_date === '2026-06-01') {
      distribution[dept].juneCount++;
    }
  });
  
  console.log(`Tổng số công việc trong bảng tasks: ${tasks.length}`);
  console.log(`Số công việc chưa gán cán bộ phụ trách: ${nullAssigneeCount}`);
  console.log('Phân bố theo phòng ban:');
  Object.keys(distribution).forEach(dept => {
    const d = distribution[dept];
    console.log(`- ${dept}: ${d.count} công việc (Thực hiện Tháng 5: ${d.mayCount} | Kế hoạch Tháng 6: ${d.juneCount})`);
  });
}

checkDistribution();
