const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PROJECT_ID = '7535585'; // Trung tâm y tế huyện Kỳ Anh (Giai đoạn 4)

const packages = [
  {
    package_number: '26/MSTB-TTYTKA',
    package_name: 'Mua sắm và lắp đặt trang thiết bị y tế',
    description: 'Mua sắm và lắp đặt trang thiết bị y tế tại dự án Đầu tư xây dựng công trình Trung tâm y tế huyện Kỳ Anh (Giai đoạn 4)',
    field: 'Goods',
    price: 27427150000,
    capital_source: 'Ngân sách tỉnh',
    selection_method: 'OpenBidding',
    selection_procedure: 'Một giai đoạn hai túi hồ sơ',
    selection_duration: '40 ngày, kể từ ngày phát hành HSMT',
    selection_start_date: 'Tháng 8, 2025',
    contract_type: 'LumpSum',
    duration: '3 tháng',
    has_option: false,
    status: 'Posted',
    sort_order: 1
  },
  {
    package_number: '27/TVGSTTYTKA',
    package_name: 'Tư vấn giám sát gói thầu 26/MSTB-TTYTKA',
    description: 'Tư vấn giám sát gói thầu 26/MSTBTTYTKA',
    field: 'Consultancy',
    price: 171824187,
    capital_source: 'Ngân sách tỉnh',
    selection_method: 'Appointed',
    selection_procedure: 'Không có phương thức LCNT',
    selection_duration: '05 ngày, kể từ ngày phát hành HSMT',
    selection_start_date: 'Tháng 8, 2025',
    contract_type: 'LumpSum',
    duration: '3 tháng',
    has_option: false,
    status: 'Planning',
    sort_order: 2
  },
  {
    package_number: '28/TVĐT - TTYTKA',
    package_name: 'Tư vấn lập HSMT, đánh giá HSDT gói thầu 26/MSTB -TTYTKA',
    description: 'Tư vấn lập HSMT, đánh giá HSDT gói thầu 26/MSTB -TTYTKA',
    field: 'Consultancy',
    price: 83694133,
    capital_source: 'Ngân sách tỉnh',
    selection_method: 'Appointed',
    selection_procedure: 'Không có phương thức LCNT',
    selection_duration: '05 ngày, kể từ ngày có kế hoạch LCNT',
    selection_start_date: 'Tháng 8, 2025',
    contract_type: 'LumpSum',
    duration: '40 ngày',
    has_option: false,
    status: 'Planning',
    sort_order: 3
  },
  {
    package_number: '29/TVTĐ - TTYTKA',
    package_name: 'Tư vấn thẩm định HSMT, kết quả LCNT gói thầu 26/MSTB -TTYTKA',
    description: 'Tư vấn thẩm định HSMT, kết quả LCNT gói thầu 26/MSTB -TTYTKA',
    field: 'Consultancy',
    price: 54854300,
    capital_source: 'Ngân sách tỉnh',
    selection_method: 'Appointed',
    selection_procedure: 'Không có phương thức LCNT',
    selection_duration: '05 ngày, kể từ ngày có kế hoạch LCNT',
    selection_start_date: 'Tháng 8, 2025',
    contract_type: 'LumpSum',
    duration: '40 ngày',
    has_option: false,
    status: 'Planning',
    sort_order: 4
  },
  {
    package_number: 'Gói thầu 30/T Đ G - TTYTKA',
    package_name: 'Tư vấn thẩm định giá thiết bị y tế giai đoạn 4',
    description: 'Tư vấn thẩm định giá thiết bị y tế giai đoạn 4',
    field: 'Consultancy',
    price: 54192000,
    capital_source: 'Ngân sách tỉnh',
    selection_method: 'Appointed',
    selection_procedure: 'Không có phương thức LCNT',
    selection_duration: '05 ngày, kể từ ngày có kế hoạch LCNT',
    selection_start_date: 'Tháng 8, 2025',
    contract_type: 'LumpSum',
    duration: '10 ngày',
    has_option: false,
    status: 'Planning',
    sort_order: 5
  }
];

async function run() {
  console.log('Inserting plan...');
  const { data: plan, error: planError } = await supabase
    .from('procurement_plans')
    .insert({
      plan_id: 'PLN-' + Date.now(),
      project_id: PROJECT_ID,
      plan_name: 'KHLCNT - Trung tâm y tế huyện Kỳ Anh (Giai đoạn 4)',
      plan_type: 'EGP',
      status: 'Active',
      total_value: packages.reduce((acc, p) => acc + p.price, 0)
    })
    .select()
    .single();

  if (planError) {
    console.error('Failed to insert plan:', planError);
    return;
  }
  
  console.log('Plan created:', plan.plan_id);

  console.log('Inserting packages...');
  const packagesToInsert = packages.map((pkg, i) => ({
    package_id: 'PKG-' + Date.now() + i,
    project_id: PROJECT_ID,
    plan_id: plan.plan_id,
    bid_type: 'Online',
    ...pkg
  }));

  const { data: insertedPackages, error: packageError } = await supabase
    .from('bidding_packages')
    .insert(packagesToInsert)
    .select();

  if (packageError) {
    console.error('Failed to insert packages:', packageError);
  } else {
    console.log(`Successfully inserted ${insertedPackages.length} packages.`);
  }
}

run();
