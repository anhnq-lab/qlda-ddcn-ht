const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve('d:/QuocAnh/2026/01.Project/qlda-ddcn-ht/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Custom unicode to ascii
function toSlug(str) {
    if(!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '').toLowerCase();
}

async function run() {
    console.log("Fetching employees...");
    const { data: employees, error: empError } = await supabase.from('employees').select('*');
    if (empError) {
        console.error("Error fetching employees:", empError);
        return;
    }

    const leaders = employees.filter(e => {
        const p = (e.position || '').toLowerCase();
        return p.includes('giám đốc') || p.includes('trưởng') || p.includes('phó') || p.includes('lãnh đạo');
    });

    console.log(`Found ${leaders.length} leaders.`);

    for (const leader of leaders) {
        console.log(`Processing: ${leader.full_name} (${leader.position})`);
        
        const username = toSlug(leader.full_name);
        const email = leader.email || `${username}@bqlddcn.gov.vn`;
        const password = 'Password@123';

        // 1. Create or find Auth user
        const { data: authList } = await supabase.auth.admin.listUsers();
        let authUser = authList?.users.find(u => u.email === email);

        if (!authUser) {
            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: leader.full_name, employee_id: leader.id }
            });
            if (error) {
                console.error("- Error creating auth user:", error.message);
                continue;
            }
            authUser = data.user;
            console.log("- Created Auth User:", email);
        } else {
            console.log("- Auth User already exists:", email);
        }

        if (!authUser) continue;

        // 2. Insert into user_accounts
        const { data: existingAccount } = await supabase
            .from('user_accounts')
            .select('*')
            .eq('employee_id', leader.id)
            .maybeSingle();

        if (existingAccount) {
            console.log("- user_accounts already exists.");
        } else {
            const { error: uaError } = await supabase.from('user_accounts').insert({
                employee_id: leader.id,
                auth_user_id: authUser.id,
                username: username,
                is_active: true
            });
            if (uaError) {
                console.error("- Error creating user_accounts:", uaError.message);
            } else {
                console.log("- Created user_accounts successfully.");
            }
        }
    }
    console.log("Done.");
}

run();
