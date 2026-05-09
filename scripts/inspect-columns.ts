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
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

async function run() {
  try {
    console.log('Fetching OpenAPI schema from PostgREST...');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const schema: any = await response.json();
    const projectsDefinition = schema.definitions?.projects;
    
    if (projectsDefinition) {
      console.log('✅ Found projects table definition in OpenAPI schema!');
      console.log('Columns:', Object.keys(projectsDefinition.properties).sort());
    } else {
      console.log('❌ projects table definition not found in schema. Available definitions:', Object.keys(schema.definitions || {}));
    }
  } catch (err: any) {
    console.error('❌ Unexpected Error:', err.message || err);
  }
}

run();
