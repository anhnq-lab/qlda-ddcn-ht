import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function search() {
  const { data: dbProjects } = await supabase
    .from('projects')
    .select('project_id, project_name');
    
  const ducLinh = dbProjects?.filter(p => p.project_name.includes('Đức Lĩnh')) || [];
  const huongXuan = dbProjects?.filter(p => p.project_name.includes('Hương Xuân')) || [];
  
  console.log('Dự án chứa "Đức Lĩnh" trong DB:', ducLinh);
  console.log('Dự án chứa "Hương Xuân" trong DB:', huongXuan);
}

search();
