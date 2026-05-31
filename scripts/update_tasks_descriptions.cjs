const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Lỗi: Thiếu cấu hình Supabase trong .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Bộ các tiền tố đã tự động sinh ở đợt chạy trước để phục vụ khôi phục mô tả gốc
const previousRewritePrefixes = [
  /^Tổ chức công tác giám sát, kiểm tra kỹ thuật hiện trường và đôn đốc đơn vị nhà thầu triển khai các hạng mục chi tiết bao gồm\s*:\s*/i,
  /^Tiến hành soát xét hồ sơ, kiểm tra căn cứ pháp lý và thực hiện quy trình thẩm định\/thẩm tra đối với nội dung\s*:\s*/i,
  /^Kiểm tra hồ sơ nghiệm thu khối lượng hoàn thành, rà soát chứng từ và hoàn thiện thủ tục thanh toán\/tạm ứng\/giải ngân cho\s*:\s*/i,
  /^Phối hợp với đơn vị kiểm toán và nhà thầu soát xét hồ sơ hoàn công, hoàn thiện các thủ tục lập, trình duyệt quyết toán dự án hoàn thành cho\s*:\s*/i,
  /^Xây dựng kế hoạch lựa chọn nhà thầu, lập\/soát xét hồ sơ mời thầu \(HSMT\), hồ sơ yêu cầu và tổ chức đánh giá hồ sơ dự thầu, thương thảo hợp đồng cho\s*:\s*/i,
  /^Phối hợp với Hội đồng bồi thường địa phương thực hiện áp giá bồi thường, chi trả tiền và kiểm đếm giải phóng mặt bằng đối với\s*:\s*/i,
  /^Rà soát hồ sơ phát sinh, thẩm định các thay đổi kỹ thuật và lập phụ lục hợp đồng điều chỉnh\/gia hạn đối với\s*:\s*/i,
  /^Soạn thảo công văn góp ý, xây dựng văn bản phối hợp và tham gia ý kiến chuyên môn gửi đơn vị liên quan đối với\s*:\s*/i,
  /^Thu thập số liệu tiến độ thực tế, tổng hợp nội dung chuyên môn và xây dựng báo cáo gửi các Sở Ban Ngành liên quan về việc\s*:\s*/i,
  /^Thực hiện công tác chuyên môn chi tiết liên quan đến nội dung\s*:\s*/i,
  /^Thực hiện kiểm tra hiện trường, lập biên bản chất lượng, giám sát các hoạt động thí nghiệm và kiểm định đối với\s*:\s*/i,
  /^Phối hợp tổ chức nghiệm thu kỹ thuật, lập biên bản bàn giao hạng mục công trình đưa vào khai thác sử dụng đối với\s*:\s*/i,
  /^Tổ chức chỉ đạo điều hành, phân công nhiệm vụ cán bộ và họp giao ban đôn đốc công tác chuyên môn đối với\s*:\s*/i
];

// Hàm làm sạch chuỗi rác, ký tự đầu dòng, số thứ tự và tiền tố báo cáo
function cleanDescriptionText(text) {
  if (!text) return '';
  
  let clean = text.toString().trim();
  
  // 1. Loại bỏ các tiền tố viết lại tự động từ đợt chạy trước (phục vụ việc chạy lặp lại an toàn)
  for (const regex of previousRewritePrefixes) {
    clean = clean.replace(regex, '');
  }
  
  // 2. Loại bỏ các tiền tố báo cáo/kết quả đầu ra gốc từ Excel (không phân biệt hoa thường)
  const trashPrefixes = [
    /^(kết quả đầu ra\s*:\s*|kết quả đầu ra\s*-\s*|kết quả đầu ra\s*\+\s*|kết quả đầu ra\s*|kết quả thực hiện\s*:\s*|kết quả thực hiện\s*-\s*|kết quả thực hiện\s*)/i,
    /^(sản phẩm đầu ra\s*:\s*|sản phẩm đầu ra\s*-\s*|sản phẩm đầu ra\s*)/i,
    /^(nhiệm vụ đầu ra\s*:\s*|nhiệm vụ đầu ra\s*-\s*|nhiệm vụ đầu ra\s*\+\s*|nhiệm vụ đầu ra\s*)/i,
    /^(sản phẩm\s*:\s*|kết quả\s*:\s*|nhiệm vụ\s*:\s*|đầu ra\s*:\s*)/i
  ];
  
  for (const regex of trashPrefixes) {
    clean = clean.replace(regex, '');
  }
  
  // 3. Loại bỏ các gạch đầu dòng thô ở đầu dòng hoặc các dòng mới
  clean = clean.replace(/^[\s\-\+\*•]+/g, '');
  
  // 4. Loại bỏ số thứ tự ở đầu chuỗi dạng 1), 2), 3), a), b), +
  clean = clean.replace(/^(\d+[\)\.\s]+|[a-z][\)\.\s]+)/i, '');
  
  // 5. Loại bỏ dấu chấm thừa ở cuối chuỗi thu được (để sau khi ghép không bị lặp dấu chấm)
  clean = clean.replace(/\.+$/, '');
  
  clean = clean.trim();
  
  // Viết hoa chữ cái đầu tiên
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  
  return clean;
}

// Hàm kiểm tra xem chuỗi có phải chỉ là số lượng hoặc từ rác không
function isGenericProductText(text) {
  if (!text) return true;
  const t = text.toLowerCase().trim();
  if (t === 'văn bản' || t === 'báo cáo' || t === 'công văn' || t === 'hồ sơ' || t === 'dự án' || t === 'công trình' || t === 'đạt' || t === 'đã hoàn thành') {
    return true;
  }
  // Chỉ chứa số lượng như "29 bộ", "220", "15 văn bản"
  if (/^\d+(\s*bộ|\s*văn bản|\s*báo cáo|\s*công trình|\s*tờ trình)?$/i.test(t)) {
    return true;
  }
  return false;
}

// Giải thuật viết lại mô tả (description) trôi chảy, tự nhiên theo từng danh mục
function rewriteDescription(category, cleanText, title, projectName) {
  const projectText = projectName ? ` dự án ${projectName}` : '';
  const titleLower = (title || '').toLowerCase();
  
  // A. Xử lý các case đặc biệt có chứa số lượng cụ thể từ Excel cũ
  if (isGenericProductText(cleanText)) {
    const qtyText = cleanText && cleanText.trim().length > 0 ? cleanText.trim() : null;
    
    if (titleLower.includes('tiếp nhận hồ sơ') || category === 'gop_y') {
      const suffix = qtyText ? `, bàn giao đầy đủ khoảng ${qtyText} theo đúng quy chế một cửa` : '';
      return `Nghiên cứu hồ sơ pháp lý, soạn thảo văn bản tham gia ý kiến góp ý và công văn phối hợp chuyên môn gửi các cơ quan, đơn vị liên quan${suffix}.`;
    }
    
    if (titleLower.includes('số văn bản ban hành') || titleLower.includes('ban hành văn bản')) {
      const qty = qtyText ? (qtyText.match(/\d+/) ? qtyText : `${qtyText} văn bản`) : 'các';
      return `Thực hiện soát xét thể thức văn bản, đăng ký số hiệu và hoàn thiện quy trình ban hành, lưu trữ hồ sơ cho ${qty} đi và đến của Ban QLDA.`;
    }
    
    if (titleLower.includes('báo cáo') || category === 'bao_cao') {
      const suffix = qtyText ? ` (đảm bảo hoàn thành ${qtyText})` : '';
      return `Tổng hợp số liệu thực tế từ các bộ phận chuyên môn, xây dựng báo cáo tiến độ tuần/tháng chính thức gửi các Sở Ban Ngành${suffix}.`;
    }
  }

  // B. Xử lý các mô tả chi tiết thực sự
  const hasDetail = cleanText && cleanText.trim().length > 3 && !isGenericProductText(cleanText);
  
  switch (category) {
    case 'thi_cong':
      return hasDetail
        ? `Tổ chức công tác giám sát, kiểm tra kỹ thuật hiện trường và đôn đốc đơn vị nhà thầu triển khai các hạng mục chi tiết bao gồm: ${cleanText}.`
        : `Tổ chức giám sát chất lượng, tiến độ thi công hiện trường hàng ngày của nhà thầu xây lắp tại${projectText}, đảm bảo tuân thủ hồ sơ thiết kế và biện pháp thi công an toàn.`;
        
    case 'tham_dinh':
      return hasDetail
        ? `Tiến hành soát xét hồ sơ, kiểm tra căn cứ pháp lý và thực hiện quy trình thẩm định/thẩm tra đối với nội dung: ${cleanText}.`
        : `Soát xét toàn bộ hồ sơ kỹ thuật, bản vẽ thiết kế, dự toán chi tiết tại${projectText} để trình cấp có thẩm quyền tổ chức thẩm định và phê duyệt theo đúng quy định.`;
        
    case 'thanh_toan':
      return hasDetail
        ? `Kiểm tra hồ sơ nghiệm thu khối lượng hoàn thành, rà soát chứng từ và hoàn thiện thủ tục thanh toán/tạm ứng/giải ngân cho: ${cleanText}.`
        : `Rà soát các biên bản nghiệm thu khối lượng hoàn thành, kiểm tra hồ sơ thanh quyết toán đợt và hoàn thiện các thủ tục đề nghị tạm ứng, giải ngân nguồn vốn đầu tư.`;
        
    case 'quyet_toan':
      return hasDetail
        ? `Phối hợp với đơn vị kiểm toán và nhà thầu soát xét hồ sơ hoàn công, hoàn thiện các thủ tục lập, trình duyệt quyết toán dự án hoàn thành cho: ${cleanText}.`
        : `Phối hợp soát xét hồ sơ hoàn công, đối chiếu khối lượng thực tế và lập báo cáo quyết toán vốn đầu tư dự án hoàn thành tại${projectText} để trình cấp có thẩm quyền phê duyệt.`;
        
    case 'dau_thau':
      return hasDetail
        ? `Xây dựng kế hoạch lựa chọn nhà thầu, lập/soát xét hồ sơ mời thầu (HSMT), hồ sơ yêu cầu và tổ chức đánh giá hồ sơ dự thầu, thương thảo hợp đồng cho: ${cleanText}.`
        : `Xây dựng kế hoạch lựa chọn nhà thầu, soạn thảo hồ sơ mời thầu, tổ chức đánh giá kỹ thuật và thương thảo, ký kết hợp đồng gói thầu liên quan.`;
        
    case 'gpmb':
      return hasDetail
        ? `Phối hợp với Hội đồng bồi thường địa phương thực hiện áp giá bồi thường, chi trả tiền và kiểm đếm giải phóng mặt bằng đối với: ${cleanText}.`
        : `Phối hợp với chính quyền địa phương và các hộ dân thực hiện công tác kiểm đếm hiện trạng, lập phương án bồi thường hỗ trợ tái định cư tại${projectText} nhằm bàn giao mặt bằng sạch.`;
        
    case 'dieu_chinh':
      return hasDetail
        ? `Rà soát hồ sơ phát sinh, thẩm định các thay đổi kỹ thuật và lập phụ lục hợp đồng điều chỉnh/gia hạn đối với: ${cleanText}.`
        : `Rà soát hồ sơ phát sinh, điều chỉnh thiết kế bản vẽ thi công và biện pháp thi công tại hiện trường để trình cấp có thẩm quyền phê duyệt điều chỉnh.`;
        
    case 'gop_y':
      return hasDetail
        ? `Soạn thảo công văn góp ý, xây dựng văn bản phối hợp và tham gia ý kiến chuyên môn gửi đơn vị liên quan đối với: ${cleanText}.`
        : `Nghiên cứu hồ sơ pháp lý, soạn thảo văn bản tham gia ý kiến góp ý và công văn phối hợp chuyên môn gửi các cơ quan, đơn vị liên quan.`;
        
    case 'bao_cao':
      return hasDetail
        ? `Thu thập số liệu tiến độ thực tế, tổng hợp nội dung chuyên môn và xây dựng báo cáo gửi các Sở Ban Ngành liên quan về việc: ${cleanText}.`
        : `Tổng hợp số liệu thực tế từ các bộ phận chuyên môn, xây dựng báo cáo tiến độ tuần/tháng để ký duyệt và báo cáo Lãnh đạo Ban cùng cơ quan thẩm quyền.`;
        
    case 'kiem_tra':
      return hasDetail
        ? `Thực hiện kiểm tra hiện trường, lập biên bản chất lượng, giám sát các hoạt động thí nghiệm và kiểm định đối với: ${cleanText}.`
        : `Lập kế hoạch và thực hiện kiểm tra định kỳ chất lượng thi công tại công trường, lấy mẫu thí nghiệm đối chiếu quy chuẩn chất lượng kỹ thuật.`;
        
    case 'ban_giao':
      return hasDetail
        ? `Phối hợp tổ chức nghiệm thu kỹ thuật, lập biên bản bàn giao hạng mục công trình đưa vào khai thác sử dụng đối với: ${cleanText}.`
        : `Phối hợp tổ chức nghiệm thu bàn giao đưa hạng mục công trình hoàn thành tại${projectText} vào khai thác sử dụng theo đúng quy định pháp luật.`;
        
    case 'dieu_hanh':
      return hasDetail
        ? `Tổ chức chỉ đạo điều hành, phân công nhiệm vụ cán bộ và họp giao ban đôn đốc công tác chuyên môn đối với: ${cleanText}.`
        : `Tổ chức chỉ đạo điều hành công tác chuyên môn, phân công lịch trực ban, giao ban định kỳ tuần/tháng nhằm đôn đốc tiến độ tổng thể.`;
        
    default:
      return hasDetail
        ? `Thực hiện công tác chuyên môn chi tiết liên quan đến nội dung: ${cleanText}.`
        : `Thực hiện và hoàn thiện đầy đủ các công tác chuyên môn được giao theo kế hoạch đầu việc.`;
  }
}

async function runUpdateDescriptions() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`=== BẮT ĐẦU CHẠY SCRIPT CHUẨN HÓA NỘI DUNG THỰC HIỆN ===`);
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
    .select('id, title, description, category, project_id, department_code');
    
  if (taskErr) {
    console.error('Lỗi khi tải danh sách công việc:', taskErr);
    process.exit(1);
  }
  console.log(`✓ Đã tải ${tasks.length} công việc từ bảng tasks.\n`);
  
  const updates = [];
  const dryRunSamples = [];
  let trashCount = 0;
  
  tasks.forEach((t) => {
    const rawDesc = t.description || '';
    if (rawDesc.toLowerCase().includes('nhiệm vụ đầu ra') || rawDesc.toLowerCase().includes('kết quả đầu ra')) {
      trashCount++;
    }
    
    const cleanText = cleanDescriptionText(t.description);
    const projectName = t.project_id ? projectCache[t.project_id] : null;
    const newDescription = rewriteDescription(t.category, cleanText, t.title, projectName);
    
    updates.push({
      id: t.id,
      description: newDescription
    });
    
    if (dryRunSamples.length < 20) {
      dryRunSamples.push({
        title: t.title,
        category: t.category,
        project_name: projectName,
        description_old: t.description,
        description_new: newDescription
      });
    }
  });
  
  console.log(`- Số lượng công việc ban đầu chứa tiền tố rác: ${trashCount} / ${tasks.length}\n`);

  // 3. Chế độ Dry Run: in 20 mẫu ra màn hình để kiểm định
  if (isDryRun) {
    console.log('--- KẾT QUẢ CHẠY THỬ MẪU 20 CÔNG VIỆC (DRY RUN) ---');
    dryRunSamples.forEach((s, idx) => {
      console.log(`\n[${idx + 1}] Tiêu đề: "${s.title}"`);
      console.log(`    - Danh mục: ${s.category} | Dự án: ${s.project_name || 'Không có'}`);
      console.log(`    - Nội dung cũ: "${s.description_old}"`);
      console.log(`    - Nội dung mới: "${s.description_new}"`);
    });
    
    console.log(`\n✓ Đã hoàn thành chạy thử. Không có thay đổi nào được ghi vào cơ sở dữ liệu.`);
    return;
  }
  
  // 4. Chế độ chạy thực tế: cập nhật hàng loạt batch update
  console.log(`- Đang tiến hành cập nhật trực tiếp ${updates.length} mô tả công việc vào database...`);
  
  const batchSize = 30;
  let updatedCount = 0;
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    const promises = batch.map(u => 
      supabase
        .from('tasks')
        .update({
          description: u.description,
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
  
  console.log(`\n🎉 HOÀN THÀNH XUẤT SẮC! Đã cập nhật thành công ${updatedCount} / ${updates.length} nội dung mô tả công việc trong database.`);
}

runUpdateDescriptions().catch(err => {
  console.error('Lỗi nghiêm trọng khi thực thi script:', err);
});
