require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: workflows, error: wfErr } = await supabase
    .from('workflows')
    .select('id, name, code')
    .eq('is_active', true);

  if (wfErr) {
    console.error('Error fetching workflows:', wfErr);
    return;
  }

  console.log('Active Workflows:');
  console.log(JSON.stringify(workflows, null, 2));

  for (const wf of workflows) {
    const { data: nodes, error: nodeErr } = await supabase
      .from('workflow_nodes')
      .select('id, name, type, sort_order, metadata')
      .eq('workflow_id', wf.id)
      .order('sort_order', { ascending: true });

    if (nodeErr) {
      console.error(`Error fetching nodes for workflow ${wf.code}:`, nodeErr);
      continue;
    }

    console.log(`\nNodes for workflow ${wf.name} (${wf.code}):`);
    nodes.forEach(n => {
      console.log(`- ID: ${n.id} | Sort: ${n.sort_order} | Name: ${n.name} | Phase: ${n.metadata?.phase}`);
    });
  }
}

main();
