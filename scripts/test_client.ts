import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const part = trimmed.split('=');
          const key = part[0].trim();
          const val = part.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
          process.env[key] = val;
        }
      });
    }
  } catch (e) {
    console.error('Error loading env:', e);
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

console.log('Connecting to Supabase using client...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: projData, error: projErr } = await supabase.from('projects').select('project_id, total_investment');
    if (projErr) {
      console.error('❌ Projects error:', projErr);
    } else {
      const count = projData.length;
      const totalInv = projData.reduce((sum, p) => sum + (p.total_investment || 0), 0);
      const withInv = projData.filter(p => (p.total_investment || 0) > 0);
      console.log(`Projects: Count = ${count}, Total Investment Sum = ${totalInv}, With Investment count = ${withInv.length}`);
      if (withInv.length > 0) {
        console.log('Sample projects with investment:', withInv.slice(0, 5));
      }
    }

    const { data: planData, error: planErr } = await supabase.from('capital_plans').select('plan_id, amount, year');
    if (planErr) {
      console.error('❌ Capital Plans error:', planErr);
    } else {
      const count = planData.length;
      const totalAmt = planData.reduce((sum, p) => sum + (p.amount || 0), 0);
      console.log(`Capital Plans: Count = ${count}, Total Amount Sum = ${totalAmt}`);
      // Show breakdown by year
      const years = planData.reduce((acc: any, p) => {
        acc[p.year] = (acc[p.year] || 0) + (p.amount || 0);
        return acc;
      }, {});
      console.log('Capital plans breakdown by year:', years);
    }

    const { data: disbData, error: disbErr } = await supabase.from('disbursements').select('disbursement_id, amount, date');
    if (disbErr) {
      console.error('❌ Disbursements error:', disbErr);
    } else {
      const count = disbData.length;
      const totalAmt = disbData.reduce((sum, p) => sum + (p.amount || 0), 0);
      console.log(`Disbursements: Count = ${count}, Total Amount Sum = ${totalAmt}`);
    }

    const { count: contractsCount, error: contractsErr } = await supabase.from('contracts').select('*', { count: 'exact', head: true });
    console.log(`Contracts: Count = ${contractsErr ? 'Error' : contractsCount}`);

    const { count: pkgCount, error: pkgErr } = await supabase.from('bidding_packages').select('*', { count: 'exact', head: true });
    console.log(`Bidding Packages: Count = ${pkgErr ? 'Error' : pkgCount}`);

    const { count: tasksCount, error: tasksErr } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
    console.log(`Tasks: Count = ${tasksErr ? 'Error' : tasksCount}`);

    const { count: voCount, error: voErr } = await supabase.from('variation_orders').select('*', { count: 'exact', head: true });
    console.log(`Variation Orders: Count = ${voErr ? 'Error' : voCount}`);

  } catch (err: any) {
    console.error('❌ Unexpected Error:', err.message || err);
  }
}

run();
