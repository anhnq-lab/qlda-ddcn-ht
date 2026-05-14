const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jkaddjllseephsiaqvds.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWRkamxsc2VlcGhzaWFxdmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTg2NzAsImV4cCI6MjA5Mzg3NDY3MH0.8jWqJsgw6yy_PknJHBXU0-J_1jFZhE7MGV-E5J-Nen0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log('Testing signUp with .vn domain...');
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: 'test_client_anon2@cic.vn',
      password: 'password123',
  });
  console.log('signUp error:', signUpErr?.message);
  console.log('signUp data user id:', signUpData?.user?.id);
}

test();
