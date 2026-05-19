import fs from 'fs';
import pg from 'pg';
const { Client } = pg;

const sql = fs.readFileSync('supabase/migrations/20260518110000_update_contractors_schema.sql', 'utf8');

const connectionString = 'postgres://postgres:Ewrxd0UuYgjwXgVG@db.jkaddjllseephsiaqvds.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function apply() {
  try {
    await client.connect();
    console.log('Connected to DB!');
    await client.query(sql);
    console.log('Migration applied successfully!');
    // Trigger schema cache reload
    await client.query('NOTIFY pgrst, \'reload schema\';');
    console.log('Schema cache reloaded!');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await client.end();
  }
}

apply();
