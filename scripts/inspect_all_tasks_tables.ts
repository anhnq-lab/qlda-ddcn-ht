import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const tables = [
    'tasks', 
    'sub_tasks', 
    'task_comments', 
    'task_activities',
    'workflow_tasks',
    'workflow_instances',
    'iso_workflow_tasks',
    'iso_workflow_instances'
  ];
  
  console.log('--- KIỂM TRA DỮ LIỆU TOÀN DIỆN MODULE CÔNG VIỆC VÀ WORKFLOW ---');
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.error(`Lỗi khi đếm bảng [${table}]:`, error.message);
      } else {
        console.log(`Bảng [${table}]: ${count} bản ghi`);
      }
    } catch (e: any) {
      console.error(`Lỗi hệ thống khi truy vấn bảng [${table}]:`, e.message || e);
    }
  }
}

inspect();
