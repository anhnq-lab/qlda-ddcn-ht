require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, step_code, metadata')
    .eq('project_id', '8173865')
    .is('parent_id', null)
    .order('sort_order');

  if (error) {
    console.error('Error fetching tasks:', error);
    return;
  }

  console.log(`Found ${data.length} parent tasks.`);
  data.forEach(t => {
    console.log(`- Task ${t.step_code}: "${t.title}"`);
    console.log(`  Subtasks count in metadata: ${t.metadata?.sub_tasks?.length || 0}`);
    if (t.metadata?.sub_tasks?.length > 0) {
      console.log(`  First subtask:`, JSON.stringify(t.metadata.sub_tasks[0]));
    }
  });
}

check();
