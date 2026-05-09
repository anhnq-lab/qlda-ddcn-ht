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
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

async function run() {
  try {
    console.log('Fetching OpenAPI schema from PostgREST using service_role key...');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const schema: any = await response.json();
    const paths = Object.keys(schema.paths || {});
    const rpcs = paths.filter(p => p.startsWith('/rpc/'));
    
    console.log('✅ Connected successfully!');
    console.log('\nAvailable RPC Functions:');
    if (rpcs.length > 0) {
      rpcs.forEach(rpc => {
        const rpcPath = schema.paths[rpc];
        const postParams = rpcPath.post?.parameters || [];
        const paramNames = postParams.map((p: any) => `${p.name}: ${p.type || p.schema?.type}`).join(', ');
        console.log(`  - ${rpc} (${paramNames})`);
      });
    } else {
      console.log('  No RPC functions found.');
    }
    
    // Let's also check if 'projects' table is defined
    if (schema.definitions?.projects) {
      console.log('\nExisting columns in "projects" table:');
      console.log(Object.keys(schema.definitions.projects.properties).sort().map(col => `  - ${col}`));
    }
  } catch (err: any) {
    console.error('❌ Unexpected Error:', err.message || err);
  }
}

run();
