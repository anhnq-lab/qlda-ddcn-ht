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

function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return 'Invalid JWT structure';
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (e: any) {
    return 'Error decoding: ' + e.message;
  }
}

console.log('--- DECODING .env JWT KEYS ---');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);

if (process.env.VITE_SUPABASE_ANON_KEY) {
  console.log('VITE_SUPABASE_ANON_KEY Payload:', decodeJWT(process.env.VITE_SUPABASE_ANON_KEY));
} else {
  console.log('VITE_SUPABASE_ANON_KEY not found in .env');
}

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (serviceRoleKey) {
  console.log('SERVICE ROLE KEY Payload:', decodeJWT(serviceRoleKey));
} else {
  console.log('Service role key not found in .env');
}
