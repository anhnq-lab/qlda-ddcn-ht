import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function run() {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*, user:auth.users!user_id(id, email)')
    .limit(1);
  console.log('Task Comments Error:', error);

  const { data: act, error: err2 } = await supabase
    .from('task_activities')
    .select('*, user:auth.users!user_id(id, email)')
    .limit(1);
  console.log('Task Activities Error:', err2);
}
run();
