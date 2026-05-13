const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://postgres:Ewrxd0UuYgjwXgVG@db.jkaddjllseephsiaqvds.supabase.co:5432/postgres";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const sqlPath = path.resolve(__dirname, '../supabase/migrations/20260513_bim_bucket_rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Executing SQL...');
    await client.query(sql);
    console.log('SQL executed successfully!');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
