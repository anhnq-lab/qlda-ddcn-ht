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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const accountantNames = [
  'Vũ Giang', 'Hương', 'Tâm', 'Đức', 'Bình', 'Đại', 'Huân', 'Thuận', 'Hương Giang', 'Nam', 'Phú', 'Quân', 'hương'
];

async function run() {
  const { data: employees, error } = await supabase.from('employees').select('employee_id, full_name, department, position');
  if (error) {
    console.error('Error fetching employees:', error);
    return;
  }

  console.log(`Loaded ${employees.length} employees.`);
  
  for (const name of accountantNames) {
    console.log(`\n--- Matches for accountant name: "${name}" ---`);
    const matches: any[] = [];
    for (const emp of employees) {
      const fullName = emp.full_name;
      const lowerFullName = fullName.toLowerCase();
      const lowerName = name.toLowerCase();
      
      // Check if exact match, or ends with, or starts with, or contains
      if (lowerFullName === lowerName) {
        matches.push({ type: 'EXACT', emp });
      } else if (lowerFullName.endsWith(' ' + lowerName)) {
        matches.push({ type: 'ENDS_WITH (Last Name)', emp });
      } else if (lowerFullName.startsWith(lowerName + ' ')) {
        matches.push({ type: 'STARTS_WITH (First Name)', emp });
      } else if (lowerFullName.includes(lowerName)) {
        matches.push({ type: 'CONTAINS', emp });
      }
    }
    
    if (matches.length === 0) {
      console.log('  ❌ No matches found.');
    } else {
      matches.forEach(m => {
        console.log(`  ✅ [${m.type}] ${m.emp.full_name} (${m.emp.employee_id}) - ${m.emp.department} - ${m.emp.position}`);
      });
    }
  }
}

run();
