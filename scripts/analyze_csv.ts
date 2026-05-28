import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey!);

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(s => s.trim().replace(/^["']|["']$/g, ''));
}

function parseCSV(filePath: string): any[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const data: any[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') continue;
    const cols = parseCSVLine(line);
    data.push(cols);
  }
  return data;
}

async function analyze() {
  const pl03Path = path.resolve(__dirname, '../Ks/Bc dự huyện chuyển về - PL03.csv');
  const pl04Path = path.resolve(__dirname, '../Ks/Bc dự huyện chuyển về - PL04.csv');

  const pl03Rows = parseCSV(pl03Path);
  const pl04Rows = parseCSV(pl04Path);

  const pl03Projects = pl03Rows.filter(row => {
    const code = row[2];
    return code && /^\d+$/.test(code);
  }).map(row => ({
    code: row[2],
    name: row[1],
    source: 'PL03',
    rawRow: row
  }));

  const pl04Projects = pl04Rows.filter(row => {
    const code = row[2];
    return code && /^\d+$/.test(code);
  }).map(row => ({
    code: row[2],
    name: row[1],
    source: 'PL04',
    rawRow: row
  }));

  const allIngestedProjects = [...pl03Projects, ...pl04Projects];

  const { data: dbProjects, error } = await supabase
    .from('projects')
    .select('project_id, project_name, national_project_code');

  if (error) {
    console.error('❌ Database error:', error);
    return;
  }

  const dbCodeSet = new Set(dbProjects.map(p => p.project_id));
  const dbNationalCodeSet = new Set(dbProjects.map(p => p.national_project_code).filter(Boolean));

  const missingProjects = allIngestedProjects.filter(p => !dbCodeSet.has(p.code) && !dbNationalCodeSet.has(p.code));

  console.log(`\n❌ Missing projects detail (${missingProjects.length} items):`);
  missingProjects.forEach((p, idx) => {
    console.log(`\n--- Item ${idx + 1} (${p.source}) ---`);
    console.log(`Code: "${p.code}"`);
    console.log(`Name: "${p.name}"`);
    console.log(`Raw row columns 0 to 6:`, p.rawRow.slice(0, 7));
  });
}

analyze().catch(console.error);
