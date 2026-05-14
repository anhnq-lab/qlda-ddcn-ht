import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jkaddjllseephsiaqvds.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWRkamxsc2VlcGhzaWFxdmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI5ODY3MCwiZXhwIjoyMDkzODc0NjcwfQ.VJzDdr4Fy76SROCXMgjM6MXET9D6Z3Xv34X6fIhrUQU';

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
