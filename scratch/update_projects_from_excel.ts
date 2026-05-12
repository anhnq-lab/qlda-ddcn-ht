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

async function updateProjects() {
    const data = JSON.parse(fs.readFileSync('scratch/excel_dump.json', 'utf-8'));
    const sheet = data['Sheet1'];

    let count = 0;
    console.log('Starting data update to Supabase...');
    
    for (let i = 3; i < sheet.length; i++) {
        const row = sheet[i];
        if (!row || row.length === 0) continue;
        
        const maDuAn = row[2] ? row[2].toString().trim() : '';
        if (!maDuAn || maDuAn === '0' || maDuAn.toLowerCase() === 'mã dự án') continue;

        let soQD = row[4] ? row[4].toString().trim().replace(/\n/g, ' ') : '';
        let tmdtStr = row[5] ? row[5].toString().trim() : '';
        let quyMo = row[6] ? row[6].toString().trim().replace(/\n/g, ' ') : '';
        let thoiGian = row[7] ? row[7].toString().trim().replace(/\n/g, ' ') : '';
        let luyKeStr = row[8] ? row[8].toString().trim() : '';

        let tmdt = 0;
        if (tmdtStr) {
            const val = parseFloat(tmdtStr.replace(/,/g, ''));
            if (!isNaN(val)) {
                tmdt = val * 1000000;
            }
        }

        let luyKe = 0;
        if (luyKeStr) {
            const val = parseFloat(luyKeStr.replace(/,/g, ''));
            if (!isNaN(val)) {
                luyKe = val * 1000000;
            }
        }

        // Fetch existing project to see if budget_allocations exists
        const { data: existingProject } = await supabase.from('projects').select('budget_allocations').eq('project_id', maDuAn).single();

        let budgetAllocations = existingProject?.budget_allocations || {};
        if (typeof budgetAllocations !== 'object') {
            budgetAllocations = {};
        }
        
        if (luyKe > 0) {
           budgetAllocations['LuyKeNguonVonDen31_12_2025'] = luyKe;
        }

        const updateData: any = {
            decision_number: soQD,
            total_investment: tmdt,
            investment_scale: quyMo,
            duration: thoiGian,
        };
        
        if (Object.keys(budgetAllocations).length > 0) {
            updateData.budget_allocations = budgetAllocations;
        }

        const { error } = await supabase
            .from('projects')
            .update(updateData)
            .eq('project_id', maDuAn);

        if (error) {
            console.error(`Error updating project ${maDuAn}:`, error.message);
        } else {
            console.log(`Successfully updated project ${maDuAn}`);
            count++;
        }
    }

    console.log(`Finished updating ${count} projects.`);
}

updateProjects();
