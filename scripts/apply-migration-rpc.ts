import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
// We should use the service role key to have full admin rights to alter tables
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

console.log('Connecting to Supabase using Admin Client...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const args = process.argv.slice(2);
    if (args.length === 0) {
      throw new Error('Please provide the path to the SQL file as an argument.');
    }
    const migrationFile = path.resolve(process.cwd(), args[0]);
    console.log(`Reading migration SQL from ${migrationFile}...`);
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Executing migration SQL via RPC exec_sql...');
    // We can call the RPC 'exec_sql' if it exists, or look for other methods
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.log('Got error from exec_sql, trying fallback parameter names...', error);
      // Try fallback with different argument name like 'query'
      const { data: data2, error: error2 } = await supabase.rpc('exec_sql', { query: sql });
      if (error2) {
        console.error('❌ Failed to execute migration via RPC exec_sql:', error2);
      } else {
        console.log('✅ Migration applied successfully via RPC exec_sql (fallback arg)! Output:', data2);
      }
    } else {
      console.log('✅ Migration applied successfully via RPC exec_sql! Output:', data);
    }
  } catch (err: any) {
    console.error('❌ Unexpected Error:', err.message || err);
  }
}

run();
