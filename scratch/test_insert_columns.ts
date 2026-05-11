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
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const dummyProject = {
    project_id: 'TEST_COLUMNS_DUMMY',
    project_name: 'Test Columns Dummy Project',
    management_board: 'Ban QLDA',
    decision_level_before_handover: 'Cấp quyết định',
    old_investor: 'Chủ đầu tư cũ',
    transfer_decision: 'Quyết định bàn giao',
    current_status_code: 1
  };

  console.log('Attempting dummy insert to check if columns exist...');
  const { data, error } = await supabase.from('projects').insert([dummyProject]).select();
  
  if (error) {
    console.log('❌ Insert Failed! Error details:', error);
  } else {
    console.log('✅ INSERT SUCCESS! All columns exist in the database! Data:', data);
    // Let's delete the dummy
    console.log('Cleaning up dummy...');
    const { error: delError } = await supabase.from('projects').delete().eq('project_id', 'TEST_COLUMNS_DUMMY');
    if (delError) console.error('Cleanup error:', delError);
    else console.log('Dummy cleaned up successfully!');
  }
}

run();
