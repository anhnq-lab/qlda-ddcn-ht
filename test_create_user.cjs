const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jkaddjllseephsiaqvds.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWRkamxsc2VlcGhzaWFxdmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI5ODY3MCwiZXhwIjoyMDkzODc0NjcwfQ.VJzDdr4Fy76SROCXMgjM6MXET9D6Z3Xv34X6fIhrUQU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.log('Creating auth user...');
  let authUserId = null;
  const username = 'test_user_456';
  const email = `${username}@cic.local`;
  
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { employee_id: null, full_name: 'Test User' },
  });
  
  console.log('authErr:', authErr);
  authUserId = authData?.user?.id || null;
  console.log('authUserId:', authUserId);
  
  console.log('Inserting into user_accounts...');
  const { data, error } = await supabase
      .from('user_accounts')
      .insert({
          username: username,
          password_hash: 'hash',
          auth_user_id: authUserId
      })
      .select()
      .single();
      
  console.log('insert error:', error);
  console.log('insert data:', data);
}

test();
