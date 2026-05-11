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

// Random number between min and max (inclusive)
function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random Date object and return ISO string
function generateRandomDate(year: number, month: number, isManagerReview: boolean = false, submittedDate?: Date) {
    let day = 1;
    // Tháng 4 (30 ngày) -> 3 ngày cuối: 28, 29, 30
    if (month === 4) {
        day = randomInt(28, 30);
    } 
    // Tháng 5 (31 ngày) -> 3 ngày cuối: 29, 30, 31
    else if (month === 5) {
        day = randomInt(29, 31);
    }

    const hour = randomInt(8, 17); // 8 AM to 5 PM
    const min = randomInt(0, 59);
    const sec = randomInt(0, 59);

    let finalDate = new Date(year, month - 1, day, hour, min, sec);
    
    // Nếu là ngày review thì sau ngày submit 1-2 ngày
    if (isManagerReview && submittedDate) {
        finalDate = new Date(submittedDate.getTime());
        // Thêm 1-2 ngày
        finalDate.setDate(finalDate.getDate() + randomInt(1, 2));
        finalDate.setHours(randomInt(8, 17));
        finalDate.setMinutes(randomInt(0, 59));
    }

    return finalDate;
}

async function run() {
    console.log('Fetching evaluations that are not draft...');
    const { data: evals, error } = await supabase
        .from('evaluation_forms')
        .select('id, eval_month, eval_year, status');
        
    if (error) {
        console.error(error);
        return;
    }
    
    let updated = 0;
    
    // Sử dụng vòng lặp cập nhật từng record
    for (const ev of evals) {
        // Chỉ cập nhật phiếu khác draft, hoặc nếu muốn có thể set null cho draft để chuẩn
        if (ev.status !== 'draft') {
            const submittedDate = generateRandomDate(ev.eval_year, ev.eval_month);
            
            let updatePayload: any = {
                self_submitted_at: submittedDate.toISOString()
            };
            
            if (ev.status === 'approved' || ev.status === 'rejected') {
                const reviewedDate = generateRandomDate(ev.eval_year, ev.eval_month, true, submittedDate);
                updatePayload.reviewed_at = reviewedDate.toISOString();
            }

            const { error: upErr } = await supabase
                .from('evaluation_forms')
                .update(updatePayload)
                .eq('id', ev.id);
                
            if (!upErr) updated++;
        } else {
             // Reset cho chắc chắn nếu có rác
             await supabase
                .from('evaluation_forms')
                .update({ self_submitted_at: null, reviewed_at: null })
                .eq('id', ev.id);
        }
    }
    console.log(`Updated dates for ${updated} records.`);
}

run();
