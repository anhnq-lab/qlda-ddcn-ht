import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const password = process.env.SUPABASE_DB_PASSWORD || process.env.VITE_SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("No SUPABASE_DB_PASSWORD found in .env");
  process.exit(1);
}

// Supabase Direct Connection String
const dbUrl = `postgresql://postgres:${password}@db.jkaddjllseephsiaqvds.supabase.co:5432/postgres`;

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB!");
    
    const files = [
      'supabase/migrations/20260514_role_permission_defaults.sql',
      'supabase/migrations/20260514_fix_audit_logs_rls.sql'
    ];

    for (const f of files) {
      console.log("Executing", f);
      const sql = fs.readFileSync(path.resolve(f), 'utf-8');
      try {
        await client.query(sql);
        console.log("Successfully executed", f);
      } catch (e) {
        console.error("Error executing", f, e.message);
      }
    }
  } catch(e) {
      console.error("Connection error:", e.message);
  } finally {
      await client.end();
  }
}

run();
