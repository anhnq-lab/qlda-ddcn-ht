import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env or .env.local
let envContent = '';
try {
  envContent = fs.readFileSync('.env.local', 'utf-8');
} catch (e) {
  try {
    envContent = fs.readFileSync('.env', 'utf-8');
  } catch (e2) {
    console.error("Could not read .env or .env.local");
    process.exit(1);
  }
}

const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) {
      envVars[key.trim()] = value.join('=').trim().replace(/(^"|"$)/g, '');
    }
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || envVars.SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_ANON_KEY || envVars.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  const { data: projects, error } = await supabase.from('projects').select('project_id, status, current_status_code');
  if (error) {
    console.error("Error fetching projects:", error);
    return;
  }
  
  console.log(`Found ${projects.length} projects`);
  let updatedCount = 0;
  for (const p of projects) {
    if (p.current_status_code == null) {
      let code = 1;
      if (p.status == 1 || p.status == 'Preparation') code = 1;
      else if (p.status == 2 || p.status == 'Execution') code = 3;
      else if (p.status == 3 || p.status == 'Completion') code = 9;
      
      const { error: updateError } = await supabase.from('projects').update({ current_status_code: code }).eq('project_id', p.project_id);
      if (updateError) {
        console.error(`Error updating project ${p.project_id}:`, updateError);
      } else {
        console.log(`Updated project ${p.project_id} -> code ${code}`);
        updatedCount++;
      }
    }
  }
  console.log(`Migration complete. Updated ${updatedCount} projects.`);
}
migrate();
