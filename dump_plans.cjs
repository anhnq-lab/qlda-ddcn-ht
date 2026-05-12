require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

  try {
    const { data: annual_plans, error: err1 } = await supabase.from('annual_plans').select('*').limit(1);
    const { data: annual_plan_items, error: err2 } = await supabase.from('annual_plan_items').select('*').limit(1);
    const { data: monthly_plans, error: err3 } = await supabase.from('monthly_plans').select('*').limit(1);
    const { data: monthly_plan_items, error: err4 } = await supabase.from('monthly_plan_items').select('*').limit(1);
    
    console.log('--- ANNUAL PLANS ---', err1 ? err1.message : annual_plans);
    console.log('--- ANNUAL PLAN ITEMS ---', err2 ? err2.message : annual_plan_items);
    console.log('--- MONTHLY PLANS ---', err3 ? err3.message : monthly_plans);
    console.log('--- MONTHLY PLAN ITEMS ---', err4 ? err4.message : monthly_plan_items);
  } catch (err) {
    console.error(err);
  }
}

run();
