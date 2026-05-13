import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = fs.existsSync(path.resolve(process.cwd(), '.env.local'))
  ? path.resolve(process.cwd(), '.env.local')
  : path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function diagnose() {
  console.log('\n=== WORKFLOWS IN DB ===');
  const { data: workflows } = await supabase
    .from('workflows')
    .select('id, code, name, is_active')
    .order('code');
  
  if (!workflows?.length) {
    console.log('NO WORKFLOWS FOUND IN DB!');
    return;
  }

  for (const wf of workflows) {
    const { data: allNodes } = await supabase
      .from('workflow_nodes')
      .select('id, name, type, is_deleted, metadata')
      .eq('workflow_id', wf.id);

    const nodes = allNodes || [];
    const active = nodes.filter(n => !n.is_deleted);
    const types = active.reduce((acc: Record<string, number>, n: any) => {
      acc[n.type] = (acc[n.type] || 0) + 1; return acc;
    }, {});

    const noPhase = active.filter((n: any) => !n.metadata?.phase).length;
    const noSub = active.filter((n: any) => !n.metadata?.sub_process).length;
    
    console.log(`\n[${wf.code}] ${wf.name}`);
    console.log(`  Nodes total: ${nodes.length}, active: ${active.length}`);
    console.log(`  Types:`, JSON.stringify(types));
    if (noPhase > 0) console.log(`  WARNING: ${noPhase} nodes no 'phase' in metadata`);
    if (noSub > 0) console.log(`  WARNING: ${noSub} nodes no 'sub_process' in metadata`);
    
    if (active.length > 0) {
      console.log('  FIRST 3:', active.slice(0, 3).map((n: any) => n.name.substring(0, 60)));
      if (active.length > 3) {
        console.log('  LAST 3:', active.slice(-3).map((n: any) => n.name.substring(0, 60)));
      }
    }
  }
}

diagnose().catch(console.error);
