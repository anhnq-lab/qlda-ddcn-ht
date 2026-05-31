import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function search() {
  const { data } = await supabase
    .from('projects')
    .select('project_id, project_name')
    .ilike('project_name', '%nội trú%');
    
  console.log('Dự án chứa "nội trú" trong DB:', data);
}

search();
