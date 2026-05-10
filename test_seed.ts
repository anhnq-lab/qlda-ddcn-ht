import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testSeed() {
    const month = 6;
    const year = 2026;
    const deptCode = 'HCTH';
    
    // Giả sử lấy một monthlyPlanId có sẵn từ HCTH tháng 6
    const { data: plans } = await supabase.from('monthly_plans').select('id').eq('department_code', deptCode).eq('plan_month', month).eq('plan_year', year);
    if (!plans || plans.length === 0) {
        console.log("Không tìm thấy monthly_plan");
        return;
    }
    const monthlyPlanId = plans[0].id;
    console.log("monthlyPlanId:", monthlyPlanId);

    const { data: annualItems, error } = await supabase
        .from('annual_plan_items')
        .select('*')
        .eq('plan_year', year)
        .eq('department_code', deptCode);

    if (error) {
        console.error("Error fetching annual items:", error);
        return;
    }
    
    console.log("Found", annualItems?.length, "annual items");
    
    const toInsert = annualItems.slice(0, 5).map((item, idx) => ({
        monthly_plan_id: monthlyPlanId,
        annual_plan_item_id: item.id,
        project_id: item.project_id ?? null,
        group_name: item.group_name ?? null,
        group_sort_order: item.group_sort_order ?? 0,
        task_name: item.task_name,
        deliverable: item.deliverable ?? null,
        deadline_note: `Tháng ${month}`,
        status: 'planned',
        sort_order: idx,
    }));
    
    const { data, error: insertErr } = await supabase
        .from('monthly_plan_items')
        .insert(toInsert)
        .select();
        
    if (insertErr) {
        console.error("INSERT ERROR:");
        console.dir(insertErr, {depth: null});
    } else {
        console.log("Inserted successfully:", data?.length);
    }
}

testSeed();
