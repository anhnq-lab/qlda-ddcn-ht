const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Lỗi: Thiếu cấu hình Supabase trong .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Bộ các lý do và vướng mắc thực tế theo từng danh mục
const obstacleRules = {
  thi_cong: {
    reasons: [
      "Nhà thầu triển khai thi công chậm so với tiến độ được duyệt do vướng mắc mặt bằng cục bộ và điều kiện thời tiết không thuận lợi.",
      "Vướng mắc công tác bồi thường giải phóng mặt bằng tại một số hộ dân đầu tuyến dẫn đến nhà thầu xây lắp phải thi công ngắt quãng."
    ],
    obstacles: [
      "Thời tiết mưa nhiều kéo dài ảnh hưởng lớn đến công tác đắp đất nền đường K95/K98 và đổ bê tông mặt đường hiện trường. Một số hộ dân tại phân đoạn Km{km_segment} chưa đồng thuận phương án đền bù bồi thường giải phóng mặt bằng, đơn vị đang phối hợp với Hội đồng bồi thường huyện để vận động bàn giao.",
      "Nhà thầu xây lắp gặp khó khăn trong khâu huy động nhân lực và vật tư thi công thiết bị chuyên dụng do biến động giá vật liệu xây dựng đầu vào. Đoạn tuyến Km{km_segment} đang bị vướng đường điện trung thế chưa được di dời ra ngoài phạm vi hành lang an toàn giao thông."
    ],
    types: ["objective", "objective"] // Đều là khách quan do thời tiết/GPMB/di dời hạ tầng
  },
  tham_dinh: {
    reasons: [
      "Hồ sơ thiết kế bản vẽ thi công và dự toán của đơn vị tư vấn còn một số sai sót về khối lượng, đang đôn đốc hoàn thiện.",
      "Đang chờ văn bản thẩm định và thông báo kết quả kiểm tra của Sở chuyên ngành gửi về Ban QLDA để tổng hợp trình phê duyệt."
    ],
    obstacles: [
      "Đơn vị tư vấn thiết kế chậm sửa đổi hồ sơ theo các ý kiến góp ý của Phòng Kỹ thuật Thẩm định (KTTĐ). Quy hoạch chi tiết 1/500 của dự án đang phải thực hiện điều chỉnh cục bộ để khớp nối hạ tầng kỹ thuật chung khu vực, làm ảnh hưởng đến tiến trình phê duyệt.",
      "Thủ tục thỏa thuận đấu nối kỹ thuật hạ tầng (cấp điện, cấp nước, phòng cháy chữa cháy) kéo dài thời gian do phải rà soát qua nhiều Sở ngành, cơ quan chuyên môn liên quan theo quy định pháp luật hiện hành."
    ],
    types: ["subjective", "objective"] // Một cái do tư vấn chậm (chủ quan), một cái do thủ tục Sở ngành (khách quan)
  },
  thanh_toan: {
    reasons: [
      "Nhà thầu chậm hoàn thiện các hồ sơ chứng từ nghiệm thu khối lượng hoàn thành gửi chủ đầu tư soát xét.",
      "Đang thực hiện rà soát các thủ tục phân bổ nguồn vốn đầu tư công và khớp nối số liệu giải ngân kế hoạch năm."
    ],
    obstacles: [
      "Hồ sơ thanh toán của nhà thầu xây lắp đang gặp vướng mắc trong khâu đối chiếu chênh lệch đơn giá điều chỉnh nguyên vật liệu xây dựng (thép, xi măng, nhựa đường) theo thông báo giá của Sở Tài chính - Sở Xây dựng.",
      "Thủ tục giải ngân nguồn vốn tạm ứng/thanh toán đợt đang chờ Kho bạc Nhà nước tỉnh rà soát, đối chiếu số dư kế hoạch vốn đầu tư công năm hiện tại do có sự thay đổi về biểu mẫu quy chuẩn kiểm soát chi mới."
    ],
    types: ["subjective", "objective"]
  },
  quyet_toan: {
    reasons: [
      "Nhà thầu cũ chậm phối hợp đối chiếu công nợ và hoàn thiện các biên bản thanh lý hợp đồng thi công.",
      "Hồ sơ quản lý chất lượng công trình gốc bị thiếu một số biên bản nghiệm thu do thay đổi nhân sự Ban quản lý qua nhiều giai đoạn."
    ],
    obstacles: [
      "Nhà thầu xây lắp chậm nộp hồ sơ hoàn công quyết toán dự án hoàn thành mặc dù đã được đôn đốc nhiều lần. Công tác kiểm toán độc lập kéo dài thời gian soát xét chứng từ do khối lượng hồ sơ phát sinh qua nhiều năm phức tạp, cần làm rõ nguồn gốc pháp lý.",
      "Đang chờ ý kiến phê duyệt quyết toán chính thức và thẩm tra báo cáo quyết toán dự án hoàn thành từ Sở Tài chính đối với các hạng mục xây dựng ngoài quy chế."
    ],
    types: ["subjective", "objective"]
  },
  gpmb: {
    reasons: [
      "Các hộ dân nằm trong ranh giới thu hồi đất chưa đồng thuận với đơn giá bồi thường đất nông nghiệp và tài sản trên đất.",
      "Chậm triển khai xây dựng cơ sở hạ tầng kỹ thuật khu tái định cư tập trung phục vụ công tác di dân giải tỏa."
    ],
    obstacles: [
      "Tranh chấp quyền sử dụng đất đai, ranh giới đất ở giữa các hộ dân chưa được UBND cấp huyện và Tòa án nhân dân giải quyết dứt điểm, gây khó khăn cho công tác kiểm đếm, áp giá đền bù phương án bồi thường.",
      "Thủ tục chuyển đổi mục đích sử dụng đất trồng lúa, đất rừng phòng hộ sang đất công trình đang chờ HĐND tỉnh phê duyệt thông qua danh mục thu hồi đất theo luật định."
    ],
    types: ["objective", "objective"]
  },
  dau_thau: {
    reasons: [
      "Hồ sơ mời thầu (HSMT) phát sinh các kiến nghị, yêu cầu làm rõ các tiêu chí kỹ thuật từ phía các nhà thầu quan tâm.",
      "Công tác soát xét và chấm thầu hồ sơ đề xuất kỹ thuật kéo dài thời gian rà soát thông tin năng lực liên danh."
    ],
    obstacles: [
      "Quá trình rà soát chứng chỉ năng lực hoạt động xây dựng và lịch sử thực hiện hợp đồng tương tự của các nhà thầu mất nhiều thời gian xác minh thông tin trên Hệ thống mạng đấu thầu quốc gia.",
      "Quy trình thương thảo hoàn thiện hợp đồng bị kéo dài do có sự bất đồng về một số điều khoản phân chia tỷ lệ đảm bảo thực hiện hợp đồng và phương án bảo lãnh tạm ứng giữa các thành viên liên danh nhà thầu."
    ],
    types: ["objective", "subjective"]
  },
  khac: {
    reasons: [
      "Đang phối hợp với các phòng chuyên môn rà soát hồ sơ pháp lý liên quan để có căn cứ thực hiện bước tiếp theo.",
      "Chờ ý kiến chỉ đạo trực tiếp từ Ban Giám đốc về phương án phối hợp xử lý văn bản liên ngành."
    ],
    obstacles: [
      "Chờ văn bản chỉ đạo chính thức và ý kiến hướng dẫn nghiệp vụ cụ thể từ các Sở chuyên ngành (Sở Xây dựng, Sở Kế hoạch & Đầu tư, Sở Tài nguyên & Môi trường) để đảm bảo thực hiện quy trình đúng trình tự pháp luật.",
      "Khối lượng công việc phát sinh đột xuất lớn trong tháng đòi hỏi nhân sự phải tập trung xử lý dứt điểm các nhiệm vụ khẩn cấp theo yêu cầu của UBND tỉnh, tạm thời tiến trình xử lý hồ sơ thường nhật bị kéo dài."
    ],
    types: ["objective", "objective"]
  }
};

// Fallback category sang obstacle group key
function getObstacleGroupKey(category) {
  if (obstacleRules[category]) return category;
  // Các nhóm khác gộp chung vào 'khac'
  return 'khac';
}

// Hàm sinh ngẫu nhiên Km cho thi công xây dựng
function getRandomKmSegment() {
  const km = Math.floor(Math.random() * 5) + 1; // Km1 -> Km5
  const m = Math.floor(Math.random() * 9) * 100; // 00 -> 800
  return `${km}+${m.toString().padStart(3, '0')}`;
}

async function runUpdateObstacles() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`=== BẮT ĐẦU CHẠY SCRIPT BỔ SUNG KHÓ KHĂN VƯỚNG MẮC ===`);
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

  // 2. Tải toàn bộ công việc chưa hoàn thành (status !== 'done')
  console.log('- Đang tải danh sách công việc chưa hoàn thành từ database...');
  const { data: tasks, error: taskErr } = await supabase
    .from('tasks')
    .select('id, title, status, category, project_id, department_code')
    .neq('status', 'done');
    
  if (taskErr) {
    console.error('Lỗi khi tải danh sách công việc:', taskErr);
    process.exit(1);
  }
  console.log(`✓ Đã tải ${tasks.length} công việc chưa hoàn thành.\n`);
  
  const updates = [];
  const dryRunSamples = [];
  
  tasks.forEach((t, index) => {
    const categoryKey = getObstacleGroupKey(t.category);
    const rule = obstacleRules[categoryKey];
    
    // Áp dụng thuật toán chọn luân phiên 2 kịch bản (index % 2) để phân bố đều dữ liệu chân thực
    const variantIndex = index % 2;
    
    let incompleteReason = rule.reasons[variantIndex];
    let obstacles = rule.obstacles[variantIndex];
    let incompleteReasonType = rule.types[variantIndex];
    
    // Định dạng lại các trường Km ngẫu nhiên cho giám sát thi công
    if (categoryKey === 'thi_cong') {
      const kmSegment = getRandomKmSegment();
      obstacles = obstacles.replace(/{km_segment}/g, kmSegment);
    }
    
    updates.push({
      id: t.id,
      incomplete_reason: incompleteReason,
      obstacles: obstacles,
      incomplete_reason_type: incompleteReasonType
    });
    
    if (dryRunSamples.length < 20) {
      const projectName = t.project_id ? projectCache[t.project_id] : null;
      dryRunSamples.push({
        title: t.title,
        status: t.status,
        category: t.category,
        project_name: projectName,
        incomplete_reason: incompleteReason,
        obstacles,
        incomplete_reason_type: incompleteReasonType
      });
    }

  });

  // 3. Chế độ Dry Run: in 20 mẫu ra màn hình để kiểm định câu chữ
  if (isDryRun) {
    console.log('--- KẾT QUẢ CHẠY THỬ MẪU 20 CÔNG VIỆC CHƯA HOÀN THÀNH (DRY RUN) ---');
    dryRunSamples.forEach((s, idx) => {
      console.log(`\n[${idx + 1}] Tiêu đề: "${s.title}"`);
      console.log(`    - Danh mục: ${s.category} | Dự án: ${s.project_name || 'Không có'}`);
      console.log(`    - Trạng thái: ${s.status}`);
      console.log(`    - Lý do chưa HT (incomplete_reason): "${s.incomplete_reason}"`);
      console.log(`    - Khó khăn vướng mắc (obstacles): "${s.obstacles}"`);
      console.log(`    - Mức độ vướng mắc (type): ${s.incomplete_reason_type}`);
    });
    
    console.log(`\n✓ Đã hoàn thành chạy thử. Không có thay đổi nào được ghi vào cơ sở dữ liệu.`);
    return;
  }
  
  // 4. Chế độ chạy thực tế: cập nhật hàng loạt batch update
  console.log(`- Đang tiến hành cập nhật trực tiếp ${updates.length} vướng mắc công việc vào database...`);
  
  const batchSize = 30;
  let updatedCount = 0;
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    const promises = batch.map(u => 
      supabase
        .from('tasks')
        .update({
          incomplete_reason: u.incomplete_reason,
          obstacles: u.obstacles,
          incomplete_reason_type: u.incomplete_reason_type,
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
  
  console.log(`\n🎉 HOÀN THÀNH XUẤT SẮC! Đã cập nhật thành công vướng mắc cho ${updatedCount} / ${updates.length} công việc chưa hoàn thành trong database.`);
}

runUpdateObstacles().catch(err => {
  console.error('Lỗi nghiêm trọng khi thực thi script:', err);
});
