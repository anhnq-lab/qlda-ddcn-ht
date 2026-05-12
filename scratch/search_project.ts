import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .ilike('name', '%Đường trục ngang ven biển huyện Thạch Hà%');

  if (error) {
    console.error('Error fetching project:', error);
  } else {
    console.log('Project found:', data);
  }
}

main();
