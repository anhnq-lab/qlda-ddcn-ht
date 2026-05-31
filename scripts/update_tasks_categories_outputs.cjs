const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Lỗi: Thiếu cấu hình Supabase trong .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Định nghĩa bộ từ khóa Regex cho 12 danh mục
const categoryRules = [
  { category: 'ban_giao', keywords: [/bàn giao/i, /ban giao/i, /nghiệm thu bàn giao/i, /đưa vào sử dụng/i] },
  { category: 'quyet_toan', keywords: [/quyết toán/i, /quyet toan/i, /hoàn công/i, /tất toán/i, /kiểm toán/i] },
  { category: 'thanh_toan', keywords: [/thanh toán/i, /thanh toan/i, /giải ngân/i, /tạm ứng/i, /đề nghị thanh toán/i, /hồ sơ thanh toán/i] },
  { category: 'gpmb', keywords: [/giải phóng mặt bằng/i, /gpmb/i, /bồi thường/i, /hỗ trợ/i, /tái định cư/i, /áp giá/i, /kiểm đếm/i] },
  { category: 'dau_thau', keywords: [/đấu thầu/i, /dau thau/i, /chỉ định thầu/i, /mời thầu/i, /lựa chọn nhà thầu/i, /hợp đồng/i, /ký kết/i, /thương thảo/i] },
  { category: 'dieu_chinh', keywords: [/điều chỉnh/i, /dieu chinh/i, /gia hạn/i, /phát sinh/i, /bổ sung/i] },
  { category: 'tham_dinh', keywords: [/thẩm định/i, /tham dinh/i, /phê duyệt/i, /phe duyet/i, /thẩm tra/i, /trình sở/i, /trình ubnd/i, /thỏa thuận/i, /đề cương/i] },
  { category: 'thi_cong', keywords: [/thi công/i, /thi cong/i, /giám sát/i, /giam sat/i, /hiện trường/i, /đôn đốc tiến độ/i, /đẩy nhanh tiến độ/i] },
  { category: 'kiem_tra', keywords: [/kiểm tra/i, /kiem tra/i, /chất lượng/i, /thí nghiệm/i, /kiểm định/i, /nghiệm thu kỹ thuật/i, /nghiệm thu giai đoạn/i] },
  { category: 'gop_y', keywords: [/góp ý/i, /gop y/i, /công văn/i, /văn bản/i, /ý kiến/i, /phối hợp gửi/i, /tiếp nhận hồ sơ/i] },
  { category: 'bao_cao', keywords: [/báo cáo/i, /bao cao/i, /tổng hợp/i] },
  { category: 'dieu_hanh', keywords: [/điều hành/i, /dieu hanh/i, /chỉ đạo/i, /giao ban/i, /họp/i, /phân công/i, /lịch trực/i, /trực văn phòng/i, /tiếp công dân/i, /học tập/i, /hội nghị/i] }
];

// Fallback phòng ban sang category
const departmentFallbacks = {
  KTTD: 'tham_dinh',
  KHDT: 'dau_thau',
  QLDA1: 'thi_cong',
  QLDA2: 'thi_cong',
  QLDA3: 'thi_cong',
  TCKT: 'thanh_toan',
  HCTH: 'dieu_hanh'
};

// 2. Hàm phân loại category tự động
function determineCategory(title, departmentCode) {
  const cleanTitle = (title || '').trim();
  for (const rule of categoryRules) {
    if (rule.keywords.some(regex => regex.test(cleanTitle))) {
      return rule.category;
    }
  }
  
  // Fallback theo phòng ban
  if (departmentCode && departmentFallbacks[departmentCode]) {
    return departmentFallbacks[departmentCode];
  }
  
  return 'khac';
}

// 3. Hàm sinh sản phẩm đầu ra cụ thể (output_document)
function generateOutputDocument(category, title, projectName) {
  const cleanTitle = (title || '').trim();
  const projectSuffix = projectName ? ` dự án ${projectName}` : '';
  
  switch (category) {
    case 'tham_dinh':
      return `Quyết định phê duyệt hoặc Báo cáo thẩm định/thẩm tra đối với: ${cleanTitle}${projectSuffix}`;
    case 'thanh_toan':
      return `Hồ sơ thanh toán/tạm ứng/giải ngân đợt hoàn thành của: ${cleanTitle}${projectSuffix}`;
    case 'quyet_toan':
      return `Báo cáo quyết toán dự án hoàn thành, biên bản quyết toán hợp đồng${projectSuffix}`;
    case 'thi_cong':
      return `Nhật ký giám sát thi công, Biên bản kiểm tra hiện trường, Báo cáo tiến độ${projectSuffix}`;
    case 'dau_thau':
      return `Quyết định phê duyệt kết quả lựa chọn nhà thầu/Hợp đồng được ký kết đối với: ${cleanTitle}${projectSuffix}`;
    case 'gpmb':
      return `Biên bản bàn giao mặt bằng sạch, Phương án bồi thường được cấp có thẩm quyền phê duyệt${projectSuffix}`;
    case 'dieu_chinh':
      return `Quyết định phê duyệt điều chỉnh / Phụ lục hợp đồng gia hạn/bổ sung${projectSuffix}`;
    case 'gop_y':
      return `Văn bản tham gia ý kiến / Công văn góp ý chính thức được ký phát hành gửi đơn vị liên quan`;
    case 'bao_cao':
      return `Văn bản báo cáo chuyên đề / Báo cáo tổng hợp tiến độ tháng được ký duyệt`;
    case 'kiem_tra':
      return `Biên bản kiểm tra chất lượng hiện trường / Phiếu kết quả thí nghiệm${projectSuffix}`;
    case 'ban_giao':
      return `Biên bản nghiệm thu bàn giao đưa công trình vào sử dụng (Mẫu A-B)${projectSuffix}`;
    case 'dieu_hanh':
      return `Văn bản chỉ đạo, biên bản cuộc họp hoặc chương trình hành động được ban hành`;
    default:
      return `Hồ sơ, tài liệu chứng minh kết quả thực hiện của công việc: ${cleanTitle}${projectSuffix}`;
  }
}

// 4. Hàm sinh kết quả hoàn thành thực tế (completion_result)
function generateCompletionResult(category, status, title, existingReason) {
  if (status !== 'done') {
    if (existingReason && existingReason.trim() !== '') {
      return null; // Giữ nguyên lý do chưa hoàn thành, không ghi đè completion_result
    }
    if (status === 'incomplete') {
      return 'Chưa hoàn thành do đang vướng mắc thủ tục cần đôn đốc phối hợp thêm.';
    }
    return 'Đang triển khai thực hiện theo kế hoạch đầu việc.';
  }
  
  switch (category) {
    case 'tham_dinh':
      return 'Đã hoàn thành thẩm định và có Quyết định phê duyệt/Văn bản thẩm định chính thức đúng tiến độ.';
    case 'thanh_toan':
      return 'Đã hoàn thành thủ tục thanh toán/tạm ứng và giải ngân vốn cho công trình.';
    case 'quyet_toan':
      return 'Đã hoàn thành công tác lập, thẩm tra và phê duyệt quyết toán vốn đầu tư hoàn thành.';
    case 'thi_cong':
      return 'Đã hoàn thành công tác thi công/giám sát hiện trường liên tục, đảm bảo chất lượng và an toàn.';
    case 'dau_thau':
      return 'Đã tổ chức lựa chọn nhà thầu thành công và ký kết hợp đồng thi công/tư vấn.';
    case 'gpmb':
      return 'Đã hoàn thành kiểm đếm, áp giá và bàn giao mặt bằng sạch cho đơn vị thi công.';
    case 'dieu_chinh':
      return 'Đã ký phụ lục hợp đồng điều chỉnh và phê duyệt các phát sinh/gia hạn theo quy định.';
    case 'gop_y':
      return 'Đã hoàn thành soạn thảo và ký phát hành văn bản tham gia ý kiến gửi các đơn vị liên quan.';
    case 'bao_cao':
      return 'Đã hoàn thành lập, ký duyệt và gửi báo cáo tiến độ/tổng hợp đúng thời hạn yêu cầu.';
    case 'kiem_tra':
      return 'Đã thực hiện kiểm tra hiện trường đầy đủ, lập biên bản ghi nhận chất lượng.';
    case 'ban_giao':
      return 'Đã bàn giao công trình đưa vào sử dụng, hồ sơ hoàn công được nghiệm thu.';
    case 'dieu_hanh':
      return 'Đã tổ chức chỉ đạo, họp giao ban đôn đốc công việc đạt mục tiêu đề ra.';
    default:
      return 'Đã thực hiện và hoàn thành đầy đủ nội dung công việc đề ra.';
  }
}

async function runUpdate() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`=== BẮT ĐẦU CHẠY SCRIPT CHUẨN HÓA CÔNG VIỆC ===`);
  console.log(`Chế độ: ${isDryRun ? 'CHẠY THỬ (DRY RUN - KHÔNG GHI DB)' : 'GHI TRỰC TIẾP VÀO DATABASE'}\n`);
  
  // 1. Tải danh mục dự án để làm Cache
  console.log('- Đang tải danh sách dự án từ database...');
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .select('project_id, project_name');
    
  if (projErr) {
    console.error('Lỗi khi tải danh sách dự án:', projErr);
    process.exit(1);
  }
  const projectCache = {};
  projects.forEach(p => {
    projectCache[p.project_id] = p.project_name;
  });
  console.log(`✓ Đã tải ${projects.length} dự án để lập bộ nhớ đệm.`);

  // 2. Tải toàn bộ 312 tasks hiện có
  console.log('- Đang tải danh sách công việc từ database...');
  const { data: tasks, error: taskErr } = await supabase
    .from('tasks')
    .select('id, title, status, project_id, department_code, incomplete_reason');
    
  if (taskErr) {
    console.error('Lỗi khi tải danh sách công việc:', taskErr);
    process.exit(1);
  }
  console.log(`✓ Đã tải ${tasks.length} công việc từ bảng tasks.\n`);
  
  const updates = [];
  const dryRunSamples = [];
  
  tasks.forEach((t) => {
    const category = determineCategory(t.title, t.department_code);
    const projectName = t.project_id ? projectCache[t.project_id] : null;
    const outputDocument = generateOutputDocument(category, t.title, projectName);
    const completionResult = generateCompletionResult(category, t.status, t.title, t.incomplete_reason);
    
    updates.push({
      id: t.id,
      category,
      output_document: outputDocument,
      completion_result: completionResult
    });
    
    if (dryRunSamples.length < 20) {
      dryRunSamples.push({
        title: t.title,
        status: t.status,
        department_code: t.department_code,
        project_name: projectName,
        category,
        output_document: outputDocument,
        completion_result: completionResult
      });
    }
  });

  // 3. Nếu là Dry Run, in kết quả mẫu ra console và dừng
  if (isDryRun) {
    console.log('--- KẾT QUẢ CHẠY THỬ MẪU 20 CÔNG VIỆC (DRY RUN) ---');
    dryRunSamples.forEach((s, idx) => {
      console.log(`\n[${idx + 1}] Tiêu đề: "${s.title}"`);
      console.log(`    - Phòng ban: ${s.department_code} | Dự án: ${s.project_name || 'Không có'}`);
      console.log(`    - Trạng thái: ${s.status}`);
      console.log(`    - Phân loại (category) mới: ${s.category}`);
      console.log(`    - Sản phẩm đầu ra (output) mới: "${s.output_document}"`);
      console.log(`    - Kết quả hoàn thành (result) mới: "${s.completion_result}"`);
    });
    
    // Thống kê phân bố category dự kiến
    const distribution = {};
    updates.forEach(u => {
      distribution[u.category] = (distribution[u.category] || 0) + 1;
    });
    console.log('\n--- PHÂN BỐ DANH MỤC CÔNG VIỆC DỰ KIẾN (DRY RUN) ---');
    Object.keys(distribution).forEach(cat => {
      console.log(`- ${cat}: ${distribution[cat]} công việc`);
    });
    
    console.log(`\n✓ Đã hoàn thành chạy thử. Không có thay đổi nào được ghi vào cơ sở dữ liệu.`);
    return;
  }
  
  // 4. Nếu chạy thực tế, thực hiện cập nhật theo lô (Batch update) an toàn
  console.log(`- Đang tiến hành cập nhật trực tiếp ${updates.length} công việc vào cơ sở dữ liệu...`);
  
  const batchSize = 30; // Chia nhỏ đợt để tránh quá tải
  let updatedCount = 0;
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    const promises = batch.map(u => 
      supabase
        .from('tasks')
        .update({
          category: u.category,
          output_document: u.output_document,
          completion_result: u.completion_result,
          updated_at: new Date().toISOString()
        })
        .eq('id', u.id)
    );
    
    const results = await Promise.all(promises);
    
    // Kiểm tra lỗi trong lô
    results.forEach((r, idx) => {
      if (r.error) {
        console.error(`❌ Lỗi cập nhật task ID ${batch[idx].id}:`, r.error.message);
      } else {
        updatedCount++;
      }
    });
    
    console.log(`  > Đã cập nhật xong lô ${Math.floor(i / batchSize) + 1}/${Math.ceil(updates.length / batchSize)} (${updatedCount}/${updates.length} thành công)`);
  }
  
  console.log(`\n🎉 HOÀN THÀNH XUẤT SẮC! Đã cập nhật thành công ${updatedCount} / ${updates.length} công việc trong database.`);
}

runUpdate().catch(err => {
  console.error('Lỗi nghiêm trọng khi thực thi script:', err);
});
