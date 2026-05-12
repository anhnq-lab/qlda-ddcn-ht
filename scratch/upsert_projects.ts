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

async function upsertProjects() {
    const data = JSON.parse(fs.readFileSync('scratch/excel_dump.json', 'utf-8'));
    const sheet = data['Sheet1'];

    let insertedCount = 0;
    let updatedCount = 0;
    
    console.log('Bắt đầu kiểm tra và thêm mới/cập nhật dự án...');
    
    for (let i = 3; i < sheet.length; i++) {
        const row = sheet[i];
        if (!row || row.length === 0) continue;
        
        const maDuAn = row[2] ? row[2].toString().trim() : '';
        if (!maDuAn || maDuAn === '0' || maDuAn.toLowerCase() === 'mã dự án') continue;

        const tenDuAn = row[1] ? row[1].toString().trim().replace(/\n/g, ' ') : '';
        const soQD = row[4] ? row[4].toString().trim().replace(/\n/g, ' ') : '';
        const tmdtStr = row[5] ? row[5].toString().trim() : '';
        const quyMo = row[6] ? row[6].toString().trim().replace(/\n/g, ' ') : '';
        const thoiGian = row[7] ? row[7].toString().trim().replace(/\n/g, ' ') : '';
        const luyKeStr = row[8] ? row[8].toString().trim() : '';

        let tmdt = 0;
        if (tmdtStr) {
            const val = parseFloat(tmdtStr.replace(/,/g, ''));
            if (!isNaN(val)) tmdt = val * 1000000;
        }

        let luyKe = 0;
        if (luyKeStr) {
            const val = parseFloat(luyKeStr.replace(/,/g, ''));
            if (!isNaN(val)) luyKe = val * 1000000;
        }

        // Kiểm tra xem dự án đã tồn tại chưa
        const { data: existingProject, error: fetchError } = await supabase
            .from('projects')
            .select('project_id, budget_allocations')
            .eq('project_id', maDuAn)
            .maybeSingle();

        if (fetchError) {
            console.error(`Lỗi khi check dự án ${maDuAn}:`, fetchError.message);
            continue;
        }

        let budgetAllocations = existingProject?.budget_allocations || {};
        if (typeof budgetAllocations !== 'object') {
            budgetAllocations = {};
        }
        
        if (luyKe > 0) {
           budgetAllocations['LuyKeNguonVonDen31_12_2025'] = luyKe;
        }

        const projectData: any = {
            project_name: tenDuAn,
            decision_number: soQD,
            total_investment: tmdt,
            investment_scale: quyMo.length > 500 ? quyMo.substring(0, 500) : quyMo,
            duration: thoiGian,
            budget_allocations: budgetAllocations
        };

        if (existingProject) {
            // Update
            const { error: updateError } = await supabase
                .from('projects')
                .update(projectData)
                .eq('project_id', maDuAn);
                
            if (updateError) {
                console.error(`Lỗi cập nhật ${maDuAn}:`, updateError.message);
            } else {
                updatedCount++;
            }
        } else {
            // Insert
            projectData.project_id = maDuAn;
            // Thêm các trường bắt buộc nếu cần (tùy vào DB constraints)
            projectData.status = 1; // Default status (Preparation = 1)
            projectData.investment_type = 1; // Default type (Public = 1)
            
            const { error: insertError } = await supabase
                .from('projects')
                .insert([projectData]);
                
            if (insertError) {
                console.error(`Lỗi thêm mới ${maDuAn}:`, insertError.message);
            } else {
                console.log(`[+] Đã THÊM MỚI dự án: ${maDuAn} - ${tenDuAn.substring(0, 50)}...`);
                insertedCount++;
            }
        }
    }

    console.log(`\nHoàn thành! Đã thêm mới: ${insertedCount} dự án, Cập nhật: ${updatedCount} dự án.`);
}

upsertProjects();
