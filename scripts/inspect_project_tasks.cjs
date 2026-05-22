require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- INSPECTING TASKS FOR PROJECT 8173865 ---');
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, step_code, workflow_node_id, parent_id, project_id, status, metadata')
    .eq('project_id', '8173865');

  if (error) {
    console.error('Error fetching tasks:', error);
  } else {
    console.log(`Found ${data.length} tasks:`);
    data.forEach(t => {
      console.log(`ID: ${t.id}, Step: ${t.step_code}, NodeID: ${t.workflow_node_id}, Parent: ${t.parent_id}, Title: ${t.title}`);
    });
  }
}

run();
