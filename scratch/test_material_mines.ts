import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
    const { data, error } = await supabase.from('material_mines').select('*');
    if (error) console.error(error);
    else console.log(JSON.stringify(data?.[0], null, 2));
}

test();
