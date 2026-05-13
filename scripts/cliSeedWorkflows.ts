import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { getInternalWorkflowTemplates } from '../features/workflows/data/seedInternalWorkflows';
import { getStandardWorkflowTemplates } from '../features/workflows/data/seedWorkflows';

console.log('Loading environment variables...');
try {
  const envPath = fs.existsSync(path.resolve(process.cwd(), '.env.local')) 
      ? path.resolve(process.cwd(), '.env.local')
      : path.resolve(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let key = match[1].trim();
      let val = match[2].trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
} catch (e) {
  console.log('No .env found or error reading it', e);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Starting seed process...');
  const allTemplates = [...getStandardWorkflowTemplates(), ...getInternalWorkflowTemplates()];
  const standardCodes = getStandardWorkflowTemplates().map(t => t.code);

  const { data: existingProjectWfs } = await supabase.from('workflows').select('id, code').eq('category', 'project');
  if (existingProjectWfs) {
      for (const wf of existingProjectWfs) {
          if (!standardCodes.includes(wf.code)) {
              console.log(`Deleting legacy project workflow: ${wf.code}`);
              await supabase.from('workflows').delete().eq('id', wf.id);
          }
      }
  }
  
  for (const wfInput of allTemplates) {
    console.log(`Processing workflow: ${wfInput.code} - ${wfInput.name}`);
    const { data: wf, error: wfErr } = await supabase.from('workflows').upsert({
        name: wfInput.name,
        code: wfInput.code,
        description: wfInput.description,
        category: wfInput.category as any,
        version: 1,
        is_active: true
    }, { onConflict: 'code' }).select().single();
    
    if (wfErr) { 
        console.error(`Workflow Upsert Error for ${wfInput.code}:`, wfErr); 
        continue; 
    }
    
    console.log(`Upserted workflow id: ${wf.id}`);

    await supabase.from('workflow_edges').delete().eq('workflow_id', wf.id);
    await supabase.from('workflow_nodes').delete().eq('workflow_id', wf.id);

    let prevId: string | null = null;

    let sortOrder = 0;

    for (const stepInput of wfInput.steps) {
        const s = stepInput as any;
        // stepInput có 2 shape:
        //   Shape A: { name, type, role, sla, metadata: { phase, sub_process, sub_tasks, ... } }
        //   Shape B (spread): { name, type, ..., phase, sub_process, ... } (từ IMPL_* spread)
        // Cần fallback từ top-level nếu metadata chưa có
        const meta = s.metadata || {};
        const phase = meta.phase || s.phase || '';
        const subProcess = meta.sub_process || s.sub_process || '';
        const subTasks = meta.sub_tasks || s.sub_tasks || [];
        const legalBasis = meta.legal_basis || meta.legalBasis || s.legal_basis || '';
        const output = meta.output || s.output || '';

        const { data: node, error: nErr } = await supabase.from('workflow_nodes').insert({
            workflow_id: wf.id,
            name: s.name,
            sort_order: sortOrder++,
            type: s.type,
            assignee_role: s.assignee_role || s.role || meta.assignee_role || '',
            sla_formula: s.sla_formula || s.sla || meta.sla || '',
            metadata: {
                phase,
                sub_process: subProcess,
                legal_basis: legalBasis,
                output,
                sub_tasks: subTasks,
                description: meta.description || s.description || '',
                coordinating_role: meta.coordinating_role || s.coordinating_role || '',
                is_parallel: meta.is_parallel || s.is_parallel || false,
            }
        }).select().single();

        if (nErr) { 
            console.error(`  ❌ Node Insert Error for step ${s.name}:`, nErr.message); 
            continue; 
        }
        console.log(`  ✓ [${sortOrder - 1}] ${s.name.substring(0, 60)}`);
        
        if (prevId) {
            await supabase.from('workflow_edges').insert({
                workflow_id: wf.id,
                source_node_id: prevId,
                target_node_id: node.id
            });
        }
        prevId = node.id;
    }
    console.log(`=> Seeded nodes for ${wf.code}`);
  }
  console.log("=== SEED COMPLETE ===");
}

seed().catch(err => {
    console.error("Fatal error:", err);
});
