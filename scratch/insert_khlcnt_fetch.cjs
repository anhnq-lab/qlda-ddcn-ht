const dotenv = require('dotenv');
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const projRes = await fetch(`${url}/rest/v1/projects?project_name=ilike.*Đường%20trục%20ngang%20ven%20biển%20huyện%20Thạch%20Hà*&select=project_id,project_name`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const projData = await projRes.json();
  if (!projData || projData.length === 0) {
    console.log('Project not found');
    return;
  }
  const projectId = projData[0].project_id;

  // Clear existing packages for this project
  await fetch(`${url}/rest/v1/bidding_packages?project_id=eq.${projectId}`, {
    method: 'DELETE',
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });

  // Clear existing plans for this project
  await fetch(`${url}/rest/v1/procurement_plans?project_id=eq.${projectId}`, {
    method: 'DELETE',
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });

  const planId = require('crypto').randomUUID();

  // Create procurement plan
  const planRes = await fetch(`${url}/rest/v1/procurement_plans`, {
    method: 'POST',
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan_id: planId,
      project_id: projectId,
      plan_name: 'Kế hoạch lựa chọn nhà thầu dự án Đường trục ngang ven biển huyện Thạch Hà',
      plan_code: '3334/QĐ-UBND',
      plan_type: 'EGP',
      decision_number: '3334/QĐ-UBND'
    })
  });
  console.log('Plan inserted:', planRes.status);

  // Create bidding packages
  const pkgRes = await fetch(`${url}/rest/v1/bidding_packages`, {
    method: 'POST',
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      {
        package_id: require('crypto').randomUUID(),
        project_id: projectId,
        plan_id: planId,
        package_number: '01',
        package_name: 'TV-ĐCBVTC: Tư vấn khảo sát lập điều chỉnh thiết kế bản vẽ thi công và dự toán thuộc công trình Đường trục ngang ven biển huyện Thạch Hà',
        field: 'Tư vấn',
        price: 184413000,
        estimate_price: 184413000,
        capital_source: 'Ngân sách trung ương và ngân sách tỉnh',
        selection_method: 'Chỉ định thầu rút gọn',
        status: 'Planning',
        contract_type: 'Trọn gói',
        duration: '45 ngày',
        khlcnt_code: '3334/QĐ-UBND'
      },
      {
        package_id: require('crypto').randomUUID(),
        project_id: projectId,
        plan_id: planId,
        package_number: '02',
        package_name: 'TV-TT-TKDC: Tư vấn thẩm tra thiết kế - dự toán điều chỉnh thuộc công trình Đường trục ngang ven biển huyện Thạch Hà',
        field: 'Tư vấn',
        price: 16708000,
        estimate_price: 16708000,
        capital_source: 'Ngân sách trung ương và ngân sách tỉnh',
        selection_method: 'Chỉ định thầu rút gọn',
        status: 'Planning',
        contract_type: 'Trọn gói',
        duration: '45 ngày',
        khlcnt_code: '3334/QĐ-UBND'
      }
    ])
  });
  if (pkgRes.status >= 400) {
      console.error('Error inserting packages:', await pkgRes.text());
  } else {
      console.log('Packages inserted successfully:', pkgRes.status);
  }
}

main().catch(console.error);
