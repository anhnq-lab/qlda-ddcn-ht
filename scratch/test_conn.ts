import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing connection...');
console.log('URL:', supabaseUrl);
console.log('Anon Key length:', supabaseKey?.length);

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log('Attempting to fetch a sample query from projects...');
        const { data, error } = await supabase.from('projects').select('project_id, project_name').limit(5);
        if (error) {
            console.error('Database query error:', error);
        } else {
            console.log('✅ Connection successful!');
            console.log('Found projects:', data);
        }
    } catch (err) {
        console.error('Exception during query:', err);
    }
}

run();
