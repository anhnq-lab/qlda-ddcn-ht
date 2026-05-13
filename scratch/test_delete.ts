import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching employees from 'Phòng Tài chính - Kế toán'...");
    const { data: emps, error: err } = await supabase
        .from('employees')
        .select('*')
        .eq('department', 'Phòng Tài chính - Kế toán');

    if (err) {
        console.error("Fetch error:", err);
        return;
    }

    const empIds = emps.map(e => e.employee_id);
    console.log("Found employees:", empIds);

    // Delete from project_members first
    console.log("Deleting from project_members...");
    const { error: pmErr } = await supabase
        .from('project_members')
        .delete()
        .in('employee_id', empIds);
    if (pmErr) console.error("Error deleting from project_members:", pmErr);

    for (const emp of emps) {
        console.log(`Trying to delete ${emp.employee_id}...`);
        const { error: delErr } = await supabase
            .from('employees')
            .delete()
            .eq('employee_id', emp.employee_id);
            
        if (delErr) {
            console.error(`Error deleting ${emp.employee_id}:`, delErr);
        } else {
            console.log(`Deleted ${emp.employee_id} successfully.`);
        }
    }
}

run();
