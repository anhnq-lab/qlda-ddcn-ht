const pg = require('pg');
require('dotenv').config();

const password = process.env.SUPABASE_DB_PASSWORD || process.env.VITE_SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("No SUPABASE_DB_PASSWORD found in .env");
  process.exit(1);
}

const dbUrl = `postgresql://postgres:${password}@db.jkaddjllseephsiaqvds.supabase.co:5432/postgres`;

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB successfully!");
    
    // 1. Kiểm tra cấu trúc bảng workflow_instances
    const resColumns = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'workflow_instances';
    `);
    console.log("\n--- Cấu trúc bảng workflow_instances ---");
    console.table(resColumns.rows);
    
    // 2. Thử truy vấn một vài dòng trong workflow_instances
    const resSample = await client.query(`
      SELECT id, workflow_id, reference_id, reference_type, status 
      FROM workflow_instances 
      LIMIT 5;
    `);
    console.log("\n--- Một số dòng trong workflow_instances ---");
    console.table(resSample.rows);

    // 3. Kiểm tra xem có dự án nào có UUID không
    const resProjects = await client.query(`
      SELECT project_id, name, code
      FROM projects
      LIMIT 5;
    `);
    console.log("\n--- Một số dòng trong projects ---");
    console.table(resProjects.rows);
    
  } catch (err) {
    console.error("Lỗi:", err.message);
  } finally {
    await client.end();
  }
}

run();
