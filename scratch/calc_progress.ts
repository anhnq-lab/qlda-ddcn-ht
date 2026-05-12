import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: projects, error: pErr } = await supabase.from('projects').select('project_id, total_investment');
    if (pErr) throw pErr;

    const { data: plans, error: cErr } = await supabase.from('capital_plans').select('project_id, disbursed_amount');
    if (cErr) throw cErr;

    const { data: disbursements, error: dErr } = await supabase.from('disbursements').select('project_id, amount');
    if (dErr) throw dErr;

    const disbursedByProject: Record<string, number> = {};

    plans?.forEach(p => {
        disbursedByProject[p.project_id] = (disbursedByProject[p.project_id] || 0) + (Number(p.disbursed_amount) || 0);
    });

    disbursements?.forEach(d => {
        disbursedByProject[d.project_id] = (disbursedByProject[d.project_id] || 0) + (Number(d.amount) || 0);
    });

    let updatedCount = 0;

    for (const proj of projects) {
        const disbursed = disbursedByProject[proj.project_id] || 0;
        const total = Number(proj.total_investment) || 0;
        
        let rate = 0;
        if (total > 0 && disbursed > 0) {
            rate = Math.round((disbursed / total) * 100);
            if (rate > 100) rate = 100;
        } else if (disbursed > 0) {
            rate = 100; 
        }

        const { error: updErr } = await supabase.from('projects').update({ payment_progress: rate }).eq('project_id', proj.project_id);
        if (updErr) {
            console.error('Error:', proj.project_id, updErr.message);
        } else {
            if (rate > 0) {
                console.log(`Updated ${proj.project_id} -> ${rate}%`);
                updatedCount++;
            }
        }
    }
    
    console.log(`Done. Updated ${updatedCount} projects.`);
}

run().catch(console.error);
