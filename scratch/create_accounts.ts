import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve('d:/QuocAnh/2026/01.Project/qlda-ddcn-ht/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAccounts() {
    console.log("Fetching employees...");
    const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*');
        
    if (empError) {
        console.error("Error fetching employees:", empError);
        return;
    }

    console.log(`Found ${employees?.length || 0} employees.`);
    
    // Filter leaders
    const leaders = employees?.filter(e => {
        const p = (e.position || '').toLowerCase();
        return p.includes('giám đốc') || p.includes('trưởng') || p.includes('phó') || p.includes('lãnh đạo');
    }) || [];

    console.log(`Found ${leaders.length} leaders.`);

    for (const leader of leaders) {
        console.log(`Processing leader: ${leader.full_name} (${leader.position})`);
        
        let email = leader.email;
        if (!email) {
             // Create a dummy email based on id or name
             const safeName = leader.full_name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').toLowerCase();
             email = `${safeName}@bqlddcn.gov.vn`;
        }

        const password = 'Password@123';
        const username = email.split('@')[0];
        
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        let userAuthId = null;
        
        const existingUser = existingUsers?.users.find(u => u.email === email);
        if (existingUser) {
            console.log(`- Auth user exists: ${email}`);
            userAuthId = existingUser.id;
        } else {
            console.log(`- Creating auth user: ${email}`);
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: leader.full_name,
                    employee_id: leader.id
                }
            });
            if (authError) {
                console.error("- Auth error:", authError.message);
                continue;
            }
            if (authData.user) {
                userAuthId = authData.user.id;
            } else {
                continue;
            }
        }

        if (!userAuthId) continue;

        // Check user_accounts
        const { data: uaData } = await supabase
            .from('user_accounts')
            .select('*')
            .eq('account_id', userAuthId)
            .maybeSingle();

        if (uaData) {
            console.log(`- user_accounts already exists for ${email}`);
            if (!uaData.employee_id) {
                 await supabase.from('user_accounts').update({ employee_id: leader.id }).eq('account_id', userAuthId);
            }
        } else {
            console.log(`- Creating user_accounts record for ${email}`);
            const { error: uaError } = await supabase.from('user_accounts').insert({
                account_id: userAuthId,
                username: username,
                email: email,
                full_name: leader.full_name,
                role: 'Manager', // Assigning 'Manager' or 'User' depending on the role enum
                status: 'Active',
                employee_id: leader.id
            });
            if (uaError) {
                console.error("- DB error:", uaError.message);
            } else {
                console.log("- DB record created successfully.");
            }
        }
    }
    console.log("Done.");
}

createAccounts();
