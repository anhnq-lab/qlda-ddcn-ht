import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://jkaddjllseephsiaqvds.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWRkamxsc2VlcGhzaWFxdmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI5ODY3MCwiZXhwIjoyMDkzODc0NjcwfQ.VJzDdr4Fy76SROCXMgjM6MXET9D6Z3Xv34X6fIhrUQU');

async function seed() {
  console.log("Fetching data...");
  const { data: employees, error: empErr } = await supabase.from('employees').select('employee_id, full_name, department');
  if(empErr) console.error("EmpErr:", empErr);
  
  const { data: projects, error: projErr } = await supabase.from('projects').select('project_id, project_name');
  if(projErr) console.error("ProjErr:", projErr);

  console.log("Employees:", employees?.length);
  console.log("Projects:", projects?.length);
  
  if (!employees || !projects || employees.length === 0 || projects.length === 0) {
      console.log("Missing employees or projects");
      return;
  }

  // Generate 50 tasks
  const newTasks = [];
  const statusOptions = ['todo', 'in_progress', 'review', 'done'];
  const priorityOptions = ['high', 'medium', 'low'];
  const now = new Date();
  
  for(let i = 1; i <= 50; i++) {
      const emp = employees[Math.floor(Math.random() * employees.length)];
      const proj = projects[Math.floor(Math.random() * projects.length)];
      const approver = employees[Math.floor(Math.random() * employees.length)];
      
      const startDays = Math.floor(Math.random() * 30) - 15; // -15 to +15 days
      const duration = Math.floor(Math.random() * 20) + 2;
      
      const startDate = new Date(now);
      startDate.setDate(now.getDate() + startDays);
      
      const dueDate = new Date(startDate);
      dueDate.setDate(startDate.getDate() + duration);
      
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      let progress = 0;
      if (status === 'done') progress = 100;
      else if (status === 'review') progress = 90;
      else if (status === 'in_progress') progress = Math.floor(Math.random() * 80) + 10;
      
      newTasks.push({
          task_type: 'project',
          title: `[${emp.department?.replace('Phòng ', '') || 'Khác'}] Công việc mẫu ${i}`,
          description: `Mô tả chi tiết cho công việc mẫu ${i} thuộc dự án ${proj.project_name}. Người thực hiện: ${emp.full_name}. Đây là dữ liệu sinh tự động.`,
          project_id: proj.project_id,
          assignee_id: emp.employee_id,
          approver_id: approver.employee_id,
          status: status,
          priority: priorityOptions[Math.floor(Math.random() * priorityOptions.length)],
          progress: progress,
          start_date: startDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          estimated_cost: Math.floor(Math.random() * 100) * 1000000,
          created_by: null // Let it be null since we don't have valid user UUIDs
      });
  }
  
  console.log("Inserting 50 tasks...");
  const { error: insertErr } = await supabase.from('tasks').insert(newTasks);
  if (insertErr) {
      console.error("Insert Error:", insertErr);
  } else {
      console.log("Successfully inserted 50 tasks.");
  }
}

seed();
