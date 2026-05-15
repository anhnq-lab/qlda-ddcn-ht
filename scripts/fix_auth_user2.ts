import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const targetEmail = 'dchua@bqlda-ht.gov.vn';
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const targetUser = users.users.find(u => u.email === targetEmail);
    
    if (targetUser) {
        console.log('Auth user ID:', targetUser.id);
        
        // check user_accounts
        const { data: accounts, error } = await supabaseAdmin.from('user_accounts').select('*').eq('auth_user_id', targetUser.id);
        console.log('User accounts linking to this auth user:', accounts);
        if (error) console.error('Error fetching accounts:', error);
        
        // If there's an account, we should perhaps delete it first?
        if (accounts && accounts.length > 0) {
            console.log('Deleting associated user_accounts...');
            await supabaseAdmin.from('user_accounts').delete().eq('auth_user_id', targetUser.id);
        }
        
        console.log('Attempting to delete auth user again...');
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUser.id);
        if (deleteError) console.error('Delete error:', deleteError);
        else console.log('Successfully deleted user.');
    }
}

run();
