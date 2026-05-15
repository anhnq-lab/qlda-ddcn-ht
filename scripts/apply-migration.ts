import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const part = trimmed.split('=');
          const key = part[0].trim();
          const val = part.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
          process.env[key] = val;
        }
      });
    }
  } catch (e) {
    console.error('Error loading env:', e);
  }
}

loadEnv();

const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!dbPassword) {
  throw new Error('Missing SUPABASE_DB_PASSWORD env var');
}
const projectId = 'jkaddjllseephsiaqvds';
const host = 'aws-0-ap-southeast-1.pooler.supabase.com';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    throw new Error('Please provide the path to the SQL file as an argument.');
  }
  const migrationFile = path.resolve(process.cwd(), args[0]);

  console.log(`Connecting to database at ${host}...`);
  const client = new Client({
    host: host,
    port: 5432,
    user: `postgres.${projectId}`,
    password: dbPassword,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully!');

    console.log(`Reading migration file from ${migrationFile}...`);
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Executing migration SQL...');
    await client.query(sql);
    console.log('Migration executed successfully!');
  } catch (error) {
    console.error('Error executing migration:', error);
  } finally {
    await client.end();
  }
}

main();
