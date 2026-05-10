import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars
const supabaseUrl = 'https://jkaddjllseephsiaqvds.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWRkamxsc2VlcGhzaWFxdmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI5ODY3MCwiZXhwIjoyMDkzODc0NjcwfQ.VJzDdr4Fy76SROCXMgjM6MXET9D6Z3Xv34X6fIhrUQU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const dataPath = path.resolve('d:/01_Projects/qlda-ddcn-ht/ks/extracted_tasks.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  for (const dept of data) {
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
  
  console.log('Migration completed');
}

main().catch(console.error);
