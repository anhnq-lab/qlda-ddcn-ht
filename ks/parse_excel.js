import xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';

// Load env vars
const supabaseUrl = 'https://jkaddjllseephsiaqvds.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWRkamxsc2VlcGhzaWFxdmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI5ODY3MCwiZXhwIjoyMDkzODc0NjcwfQ.VJzDdr4Fy76SROCXMgjM6MXET9D6Z3Xv34X6fIhrUQU';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const workbook = xlsx.readFile('FINAL 24.4.2026_PMU_ BC kết quả thực hiện tháng 4_ kế hoạch tháng 5.2026.xlsx');
  const sheetName = workbook.SheetNames[0]; // "Tháng 4.26_KH tháng 5.26"
  const sheet = workbook.Sheets[sheetName];

  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, range: 0, raw: false });
  
  let isMonth5 = false;
  let currentDept = null;
  let currentGroup = null;
  const departments = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const colA = String(row[0] || '').trim();
    const colB = String(row[1] || '').trim();
    
    if (colA === 'II' && colB.toLowerCase().includes('tháng 5')) {
      isMonth5 = true;
      continue;
    }
    
    // Stop if we hit part III (if any)
    if (colA === 'III') {
      isMonth5 = false;
      break;
    }
    
    if (isMonth5) {
      // Check for department
      if (['1','2','3','4','5','6','7','8','9','I','II','III','IV','V','VI','VII'].includes(colA) && colB.toLowerCase().includes('phòng')) {
        currentDept = { name: colB, tasks: [] };
        departments.push(currentDept);
        currentGroup = null;
        continue;
      }
      // Check for group
      if (colA.match(/^[0-9]+$/) || colA.match(/^[0-9]+\.$/)) {
        currentGroup = colB;
        // Sometimes it's a task itself
        if (row[3] || row[4]) {
          // It's a task
          if (currentDept) {
            currentDept.tasks.push({
              title: colB,
              group: null,
              deadline: row[3] || '',
              assignee: row[4] || '',
              manager: row[5] || '',
              director: row[6] || ''
            });
          }
        }
        continue;
      }
      
      // Task row (no colA, or just hyphen)
      if (!colA || colA === '-' || colA === '+') {
        if (colB && currentDept) {
          currentDept.tasks.push({
            title: colB,
            group: currentGroup,
            deadline: row[3] || '',
            assignee: row[4] || '',
            manager: row[5] || '',
            director: row[6] || ''
          });
        }
      }
    }
  }

  // Debug parsed data
  console.log(`Found ${departments.length} departments for Month 5.`);
  departments.forEach(d => console.log(`- ${d.name}: ${d.tasks.length} tasks`));
  
  // Clean old data for Month 5, 2026
  await supabase.from('monthly_plans').delete().match({ plan_month: 5, plan_year: 2026 });
  
  for (const dept of departments) {
    const deptName = dept.name;
    const deptCode = deptName;

    // Insert monthly plan
    const { data: planData, error: planError } = await supabase
      .from('monthly_plans')
      .insert({
        plan_month: 5,
        plan_year: 2026,
        department_code: deptCode,
        department_name: deptName,
        status: 'published'
      })
      .select('id')
      .single();

    if (planError) {
      console.error(`Error inserting plan for ${deptName}:`, planError);
      continue;
    }

    const planId = planData.id;
    const items = [];

    for (let i = 0; i < dept.tasks.length; i++) {
      const task = dept.tasks[i];
      const taskName = task.title || '';
      
      if (taskName.trim()) {
        items.push({
          monthly_plan_id: planId,
          task_name: taskName,
          group_name: task.group || '',
          staff_name: task.assignee || '',
          dept_head_name: task.manager || '',
          ban_head_name: task.director || '',
          deadline_note: task.deadline || '',
          sort_order: i,
          status: 'planned'
        });
      }
    }

    if (items.length > 0) {
      const { error: itemsError } = await supabase
        .from('monthly_plan_items')
        .insert(items);
        
      if (itemsError) {
        console.error(`Error inserting items for ${deptName}:`, itemsError);
      } else {
        console.log(`Inserted plan and ${items.length} items for ${deptName}`);
      }
    }
  }
  
  console.log('Migration completed successfully');
}

main().catch(console.error);
