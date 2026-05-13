require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

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

    console.log("Found employees:", emps.map(e => `${e.employee_id}: ${e.full_name}`));

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
