import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const departmentMap: Record<string, string> = {
    'Phòng Hành chính - Tổng hợp': 'HCTH',
    'Phòng Kế hoạch - Đấu thầu': 'KHDT',
    'Phòng Kỹ thuật - Thẩm định': 'KTTD',
    'Phòng Quản lý dự án 1': 'QLDA1',
    'Phòng Quản lý dự án 2': 'QLDA2',
    'Phòng Quản lý dự án 3': 'QLDA3',
    'Phòng Phát triển dịch vụ': 'PTDV',
};

async function run() {
    console.log('Fetching evaluations...');
    const { data: evals, error } = await supabase.from('evaluation_forms').select('id, department_name');
    if (error) {
        console.error(error);
        return;
    }
    
    let updated = 0;
    for (const ev of evals) {
        let code = departmentMap[ev.department_name];
        // Xử lý các case có thể lệch tên một chút
        if (!code) {
             const name = ev.department_name.toLowerCase();
             if (name.includes('hành chính')) code = 'HCTH';
             else if (name.includes('đấu thầu')) code = 'KHDT';
             else if (name.includes('thẩm định')) code = 'KTTD';
             else if (name.includes('dự án 1')) code = 'QLDA1';
             else if (name.includes('dự án 2')) code = 'QLDA2';
             else if (name.includes('dự án 3')) code = 'QLDA3';
             else if (name.includes('phát triển')) code = 'PTDV';
             else code = 'HCTH'; // Fallback
        }

        if (code) {
            await supabase.from('evaluation_forms').update({ department_code: code }).eq('id', ev.id);
            updated++;
        }
    }
    console.log(`Updated ${updated} records.`);
}

run();
