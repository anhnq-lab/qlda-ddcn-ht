import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials (need SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

type FormType = 'leader' | 'staff';
type EvaluationStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

// Helper to determine form type
function getFormType(position: string | null): FormType {
    if (!position) return 'staff';
    const leaderKeywords = ['giám đốc', 'trưởng', 'chánh', 'phó'];
    const p = position.toLowerCase();
    return leaderKeywords.some(kw => p.includes(kw)) ? 'leader' : 'staff';
}

function getRandomStatus(): EvaluationStatus {
    const r = Math.random();
    if (r < 0.2) return 'draft';
    if (r < 0.4) return 'submitted';
    if (r < 0.8) return 'approved';
    return 'rejected';
}

// Giả lập điểm số cho Leader
function generateLeaderScores() {
    return {
        formType: 'leader',
        g1: {
            s1: Math.floor(Math.random() * 2) + 5, // max 6
            s2: Math.floor(Math.random() * 2) + 4, // max 5
            s3: Math.floor(Math.random() * 1) + 2, // max 3
            s4: Math.floor(Math.random() * 2) + 5, // max 6
        },
        g2_1: {
            s1: Math.floor(Math.random() * 1) + 2, // max 3
            s2: Math.floor(Math.random() * 1) + 2, // max 3
            s3: 2, // max 2
            s4: 2, // max 2
            s5: 2, // max 2
            s6: 2, // max 2
            s7: 2, // max 2
            s8: 2, // max 2
            s9: 2, // max 2
        },
        g2_2: {
            level: '2.1',
            score: 55
        },
        g3: {
            bonus1: Math.random() > 0.8,
            bonus2: Math.random() > 0.8,
        },
        g4: {
            d1: false, d2: false, d3: false, d4: false, d5: false, d6: false
        }
    };
}

// Giả lập điểm số cho Staff
function generateStaffScores() {
    return {
        formType: 'staff',
        g1: {
            s1: Math.floor(Math.random() * 2) + 5, // max 6
            s2: Math.floor(Math.random() * 2) + 4, // max 5
            s3: Math.floor(Math.random() * 1) + 2, // max 3
            s4: Math.floor(Math.random() * 2) + 5, // max 6
        },
        g2_1: {
            s1: Math.floor(Math.random() * 1) + 1, // max 2
            s2: Math.floor(Math.random() * 1) + 1, // max 2
            s3: 2, // max 2
            s4: 2, // max 2
            s5: 2, // max 2
            s6: 2, // max 2
            s7: 2, // max 2
            s8: 2, // max 2
            s9: 2, // max 2
            s10: 2, // max 2
        },
        g2_2: {
            level: '2.1',
            score: 55
        },
        g3: {
            bonus1: Math.random() > 0.8,
            bonus2: Math.random() > 0.8,
        },
        g4: {
            d1: false, d2: false, d3: false, d4: false, d5: false
        }
    };
}

async function run() {
    console.log('Fetching employees...');
    const { data: employees, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .eq('status', 1); // only active employees

    if (fetchError) {
        console.error('Failed to fetch employees:', fetchError);
        return;
    }

    if (!employees || employees.length === 0) {
        console.log('No employees found.');
        return;
    }

    console.log(`Found ${employees.length} active employees. Generating evaluations...`);

    const months = [4, 5];
    const year = 2026;
    const evaluations = [];

    for (const emp of employees) {
        const formType = getFormType(emp.position);

        for (const month of months) {
            const status = getRandomStatus();
            
            const self_scores = formType === 'leader' ? generateLeaderScores() : generateStaffScores();
            
            // Nếu đã approve hoặc rejected, thì có manager scores
            let manager_scores = null;
            if (status === 'approved' || status === 'rejected') {
                manager_scores = formType === 'leader' ? generateLeaderScores() : generateStaffScores();
                // Giảm 1 ít điểm để giống thật
                manager_scores.g1.s1 -= 1;
            }

            evaluations.push({
                employee_id: emp.employee_id,
                employee_name: emp.full_name,
                chuc_vu: emp.position,
                department_code: getDepartmentCode(emp.department),
                department_name: emp.department,
                eval_month: month,
                eval_year: year,
                form_type: formType,
                status: status,
                self_scores: self_scores,
                manager_scores: manager_scores,
                // Fallback flat fields to 0
                self_score_1: 0, self_score_2: 0, self_score_3: 0,
                self_score_4: 0, self_score_5: 0, self_score_6: 0, self_score_7: 0,
            });
        }
    }

    console.log(`Inserting ${evaluations.length} evaluation records...`);
    
    // Xóa các dữ liệu cũ của tháng 4, 5 năm 2026 để tránh trùng lặp
    console.log('Cleaning up existing records for 4/2026 and 5/2026...');
    await supabase.from('evaluation_forms')
        .delete()
        .in('eval_month', [4, 5])
        .eq('eval_year', 2026);

    const { error: insertError } = await supabase
        .from('evaluation_forms')
        .insert(evaluations);

    if (insertError) {
        console.error('Failed to insert evaluations:', insertError);
    } else {
        console.log('Successfully inserted evaluation records.');
    }
}

run();
