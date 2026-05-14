const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve('d:/QuocAnh/2026/01.Project/qlda-ddcn-ht/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function toSlug(str) {
    if(!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '').toLowerCase();
}

async function fix() {
    console.log("Fetching employees...");
    const { data: employees, error: empError } = await supabase.from('employees').select('*');
    
    const leaders = employees.filter(e => {
        const p = (e.position || '').toLowerCase();
        return p.includes('giám đốc') || p.includes('trưởng') || p.includes('phó') || p.includes('lãnh đạo');
    });

    console.log(`Found ${leaders.length} leaders.`);

    for (const leader of leaders) {
        const username = toSlug(leader.full_name);
        
        // Find user_account by username
        const { data: ua } = await supabase.from('user_accounts').select('*').eq('username', username).maybeSingle();
        if (ua) {
            console.log(`Updating employee_id for ${username} to ${leader.employee_id}`);
            await supabase.from('user_accounts').update({ employee_id: leader.employee_id }).eq('account_id', ua.account_id);
        } else {
            console.log(`Could not find user_account for ${username}`);
        }
    }
    console.log("Fix done.");
}
fix();
