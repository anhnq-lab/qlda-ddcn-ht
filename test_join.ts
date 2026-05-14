import { supabase } from './lib/supabase';

async function test() {
    const { data, error } = await supabase.from('employees').select('*, user_accounts(username)').limit(1);
    console.log(JSON.stringify({ data, error }, null, 2));
}

test();
