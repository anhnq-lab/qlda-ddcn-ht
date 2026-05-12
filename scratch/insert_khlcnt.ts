import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: projData, error: projError } = await supabase
    .from('projects')
    .select('project_id, project_name')
    .ilike('project_name', '%Đường trục ngang ven biển huyện Thạch Hà%')
    .limit(1);

  if (projError || !projData || projData.length === 0) {
    console.error('Project not found', projError);
    return;
  }
  
  const projectId = projData[0].project_id;
  const planId = uuidv4();
  
  // 1. Insert Procurement Plan
  const planData = {
    plan_id: planId,
    project_id: projectId,
    plan_name: 'KHLCNT - Đường trục ngang ven biển huyện Thạch Hà',
    decision_number: '3334/QĐ-UBND',
    decision_date: '2025-12-30',
    total_value: 184413000 + 16708000,
    status: 'Approved',
    plan_type: 'EGP'
  };
  
  const { error: planError } = await supabase.from('procurement_plans').insert(planData);
  if (planError) {
    console.error('Error inserting plan:', planError);
    return;
  }
  console.log('Inserted Procurement Plan:', planId);

  // 2. Insert Bidding Packages
  const packagesData = [
    {
      package_id: uuidv4(),
      project_id: projectId,
      plan_id: planId,
      name: 'TV-ĐCBVTC: Tư vấn khảo sát lập điều chỉnh thiết kế bản vẽ thi công và dự toán thuộc công trình Đường trục ngang ven biển huyện Thạch Hà',
      field: 'Tư vấn',
      price: 184413000,
      estimate_price: 184413000,
      selection_method: 'Chỉ định thầu rút gọn',
      status: 'Planning'
    },
    {
      package_id: uuidv4(),
      project_id: projectId,
      plan_id: planId,
      name: 'TV-TT-TKDC: Tư vấn thẩm tra thiết kế - dự toán điều chỉnh thuộc công trình Đường trục ngang ven biển huyện Thạch Hà',
      field: 'Tư vấn',
      price: 16708000,
      estimate_price: 16708000,
      selection_method: 'Chỉ định thầu rút gọn',
      status: 'Planning'
    }
  ];

  const { error: pkgError } = await supabase.from('bidding_packages').insert(packagesData);
  if (pkgError) {
    console.error('Error inserting packages:', pkgError);
  } else {
    console.log('Successfully inserted bidding packages.');
  }
}
main();
