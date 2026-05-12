import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string
);

async function run() {
  const { data, error } = await supabase
    .from('projects')
    .select('project_id, project_name, coordinates');
    
  if (error) {
    console.error('Error fetching projects:', error);
    return;
  }
  
  data.forEach(p => {
    console.log(`[${p.project_id}] ${p.project_name}`);
  });
}

run();
