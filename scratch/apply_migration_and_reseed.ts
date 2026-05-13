/**
 * 1. Apply migration: thêm sort_order vào workflow_nodes
 * 2. Re-seed tất cả workflows với metadata đúng
 * Run: npx tsx scratch/apply_migration_and_reseed.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { getStandardWorkflowTemplates } from '../features/workflows/data/seedWorkflows';
import { getInternalWorkflowTemplates } from '../features/workflows/data/seedInternalWorkflows';

// Load .env
const envPath = fs.existsSync(path.resolve(process.cwd(), '.env.local'))
  ? path.resolve(process.cwd(), '.env.local')
  : path.resolve(process.cwd(), '.env');
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function run() {
  // ── STEP 1: Apply migration ──────────────────────────────────
  console.log('\n=== STEP 1: Check/Add sort_order column ===');
  // Cannot run DDL via anon key — check if column exists via select
  const { data: testSelect, error: colErr } = await supabase
    .from('workflow_nodes')
    .select('sort_order')
    .limit(1);

  if (colErr && colErr.message.includes('sort_order')) {
    console.log('❌ Column sort_order does NOT exist in workflow_nodes.');
    console.log('👉 Please run this SQL in Supabase Dashboard > SQL Editor:');
    console.log('');
    console.log('ALTER TABLE public.workflow_nodes ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;');
    console.log('');
    console.log('Then run this script again.');
    process.exit(1);
  } else {
    console.log('✅ Column sort_order OK (exists or not needed for filter)');
  }

  // ── STEP 2: Re-seed workflows ────────────────────────────────
  console.log('\n=== STEP 2: Re-seed workflows ===');
  const allTemplates = [
    ...getStandardWorkflowTemplates(),
    ...getInternalWorkflowTemplates(),
  ];

  console.log(`Found ${allTemplates.length} workflow templates to seed`);

  for (const wfInput of allTemplates) {
    console.log(`\n[${wfInput.code}] ${wfInput.name} (${wfInput.steps.length} steps)`);

    // Upsert workflow header
    const { data: wf, error: wfErr } = await supabase
      .from('workflows')
      .upsert({
        name: wfInput.name,
        code: wfInput.code,
        description: wfInput.description,
        category: wfInput.category as any,
        version: 1,
        is_active: true,
      }, { onConflict: 'code' })
      .select()
      .single();

    if (wfErr) { console.error(`  ❌ Workflow upsert error:`, wfErr.message); continue; }

    // Delete old nodes + edges (clean slate)
    await supabase.from('workflow_edges').delete().eq('workflow_id', wf.id);
    await supabase.from('workflow_nodes').delete().eq('workflow_id', wf.id);

    let prevId: string | null = null;
    let sortOrder = 0;

    for (const stepInput of wfInput.steps) {
      const s = stepInput as any;
      const meta = s.metadata || {};

      // Handle 2 shapes: { metadata: { phase, sub_process, ... } } OR spread { phase, sub_process, ... }
      const phase = meta.phase || s.phase || '';
      const subProcess = meta.sub_process || s.sub_process || '';
      const subTasks = meta.sub_tasks || s.sub_tasks || [];
      const legalBasis = meta.legal_basis || meta.legalBasis || s.legal_basis || '';
      const output = meta.output || s.output || '';
      const description = meta.description || s.description || '';
      const assigneeRole = s.assignee_role || s.role || meta.assignee_role || '';

      const insertPayload: any = {
        workflow_id: wf.id,
        name: s.name,
        type: s.type,
        assignee_role: assigneeRole,
        sla_formula: s.sla_formula || s.sla || meta.sla || '',
        metadata: {
          phase,
          sub_process: subProcess,
          legal_basis: legalBasis,
          output,
          sub_tasks: subTasks,
          description,
          coordinating_role: meta.coordinating_role || s.coordinating_role || '',
          is_parallel: meta.is_parallel || s.is_parallel || false,
          assignee_role: assigneeRole,
        },
      };

      // Add sort_order if column exists
      if (!colErr) {
        insertPayload.sort_order = sortOrder;
      }

      const { data: node, error: nErr } = await supabase
        .from('workflow_nodes')
        .insert(insertPayload)
        .select()
        .single();

      if (nErr) {
        console.error(`  ❌ [${sortOrder}] ${s.name.substring(0, 50)}: ${nErr.message}`);
        sortOrder++;
        continue;
      }

      console.log(`  ✓ [${sortOrder}] ${s.name.substring(0, 60)} (${s.type})`);
      sortOrder++;

      if (prevId) {
        await supabase.from('workflow_edges').insert({
          workflow_id: wf.id,
          source_node_id: prevId,
          target_node_id: node.id,
        });
      }
      prevId = node.id;
    }

    console.log(`  => ${wfInput.code}: Seeded ${sortOrder} nodes ✅`);
  }

  console.log('\n=== SEED COMPLETE ===');
  console.log('👉 Now go to the app and REFRESH, then delete old plan and create new one.');
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
