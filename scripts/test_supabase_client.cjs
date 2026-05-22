require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- TEST SUPABASE CLIENT WORKFLOW_INSTANCES WITH TEXT REFERENCE_ID ---');
  
  const testId = uuidv4();
  const testWorkflowId = 'acaea57b-65bc-486f-b92b-d64e1bdf589a';
  
  const { data, error } = await supabase
    .from('workflow_instances')
    .insert({
      id: testId,
      workflow_id: testWorkflowId,
      reference_id: '8173865',
      reference_type: 'project',
      status: 'in_progress'
    })
    .select();
    
  if (error) {
    console.error('Lỗi khi insert workflow_instances:', error);
  } else {
    console.log('Insert thành công:', data);
    
    // Xóa bản ghi test
    const { error: delErr } = await supabase
      .from('workflow_instances')
      .delete()
      .eq('id', testId);
    console.log('Xóa bản ghi test:', delErr ? delErr : 'Thành công');
  }
}

run();
