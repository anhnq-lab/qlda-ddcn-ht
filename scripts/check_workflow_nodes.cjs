const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('=== KIỂM TRA SCHEMA CỘT REFERENCE_ID BẢNG WORKFLOW_INSTANCES ===');
  
  // Dùng SQL query qua RPC hoặc qua query trực tiếp nếu có thể
  // Vì không có RPC trực tiếp để chạy query SQL tuỳ ý, ta có thể chạy một query lấy thông tin từ pg_attribute
  // Nhưng đơn giản hơn, ta có thể thử insert một bản ghi vào workflow_instances với reference_id là text '8173865' để xem chính xác lỗi gì.
  // Khoan, hãy dùng một truy vấn SQL thông qua RPC execute_sql nếu nó tồn tại? 
  // Let's check if there is execute_sql in supabase mcp or if we can run it.
  // We can write a script to query PostgreSQL system catalogs!
  
  const query = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'workflow_instances';
  `;
  
  // Ta không thể gửi query raw SQL trực tiếp qua client thông thường trừ khi có RPC hỗ trợ.
  // Nhưng hãy xem trong dự án có RPC nào chạy SQL không?
  // Hãy xem file setup-rpc.sql hoặc apply_migration.mjs.
  // Có file run-sql.js! Hãy xem nội dung file run-sql.js.
}

run();
