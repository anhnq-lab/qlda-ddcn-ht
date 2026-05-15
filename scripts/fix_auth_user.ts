import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Fetching users...');
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
        console.error('Error fetching users:', error);
        return;
    }
    
    console.log(`Found ${users.users.length} users.`);
    const targetEmail = 'dchua@bqlda-ht.gov.vn';
    const targetUser = users.users.find(u => u.email === targetEmail);
    
    if (targetUser) {
        console.log(`Found user with email ${targetEmail}, ID: ${targetUser.id}. Deleting...`);
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUser.id);
        if (deleteError) {
            console.error('Error deleting user:', deleteError);
        } else {
            console.log('Successfully deleted user.');
        }
    } else {
        console.log(`User with email ${targetEmail} not found in Supabase Auth.`);
    }
}

run();
