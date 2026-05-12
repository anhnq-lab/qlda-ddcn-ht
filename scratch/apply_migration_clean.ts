import pg from 'pg';
import fs from 'fs';

const password = process.env.SUPABASE_DB_PASSWORD || 'Ewrxd0UuYgjwXgVG';
const projectId = 'jkaddjllseephsiaqvds';
const host = 'aws-0-ap-southeast-1.pooler.supabase.com';

const configs = [
  { host, port: 5432, user: "postgres.", database: 'postgres' },
];

async function run() {
  const sql = fs.readFileSync('D:/QuocAnh/2026/01.Project/qlda-ddcn-ht/database/task_collaboration.sql', 'utf8');
  const client = new pg.Client({
    host: configs[0].host,
    port: configs[0].port,
    user: configs[0].user,
    password: password,
    database: configs[0].database,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log('Applying migration...');
    await client.query(sql);
    console.log('Migration applied successfully.');
    await client.end();
  } catch (err: any) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
