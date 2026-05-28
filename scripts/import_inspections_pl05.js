import xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkaddjllseephsiaqvds.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWRkamxsc2VlcGhzaWFxdmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI5ODY3MCwiZXhwIjoyMDkzODc0NjcwfQ.VJzDdr4Fy76SROCXMgjM6MXET9D6Z3Xv34X6fIhrUQU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const excelPath = 'ks/28.5.26 BC  dự án các huyện chuyển về.xlsx';

async function importInspections() {
  console.log('Starting data import from PL05 (2) sheet...');
  
  let workbook;
  try {
    workbook = xlsx.readFile(excelPath);
  } catch (err) {
    console.error(`Failed to read Excel file at ${excelPath}:`, err);
    return;
  }

  const sheetName = 'PL05 (2)';
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.error(`Sheet "${sheetName}" not found in Excel!`);
    return;
  }

  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const mappedRecords = [];
  let lastConclusionInfo = '';

  // Đọc dữ liệu từ Row 10 (chỉ mục 9)
  for (let i = 9; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const name = row[1];
    const projectId = row[2];

    // Bỏ qua tiêu đề huyện và dòng Tổng cộng
    if (name && (name.startsWith('Huyện ') || name === 'Tổng')) {
      continue;
    }

    // Yêu cầu bắt đầu phải có mã dự án hợp lệ
    if (!projectId || isNaN(projectId)) {
      continue;
    }

    const conclusionInfo = row[5];

    // Áp dụng thuật toán kế thừa kết luận thanh tra
    if (conclusionInfo && String(conclusionInfo).trim()) {
      lastConclusionInfo = String(conclusionInfo).trim();
    }

    // Giai đoạn đến 30/6/2025
    const thuHoi25_k = Number(row[6]) || 0;
    const thuHoi25_t = Number(row[7]) || 0;
    const giamTru25_k = Number(row[8]) || 0;
    const giamTru25_t = Number(row[9]) || 0;
    const xlKhac25_k = Number(row[10]) || 0;
    const xlKhac25_t = Number(row[11]) || 0;
    const xlHanhChinh25_k = Number(row[12]) || 0;
    const xlHanhChinh25_t = Number(row[13]) || 0;

    // Giai đoạn 1/7/2025 - 31/3/2026
    const thuHoi26_k = Number(row[15]) || 0;
    const thuHoi26_t = Number(row[16]) || 0;
    const giamTru26_k = Number(row[17]) || 0;
    const giamTru26_t = Number(row[18]) || 0;
    const xlKhac26_k = Number(row[19]) || 0;
    const xlKhac26_t = Number(row[20]) || 0;
    const xlHanhChinh26_k = Number(row[21]) || 0;
    const xlHanhChinh26_t = Number(row[22]) || 0;

    const vuongMac = row[23];
    const bienPhap = row[24];
    const ghiChu = row[25];

    // Chuyển đổi định dạng quyết định thanh tra/kiểm toán
    let inspectionType = 'thanh_tra';
    let inspectionAgency = 'Thanh tra cơ quan';
    let decNum = '';
    let decDate = null;

    const finalConclusionInfo = lastConclusionInfo || 'Kết luận thanh tra/kiểm toán';
    const infoLower = finalConclusionInfo.toLowerCase();

    if (infoLower.includes('ktnn') || infoLower.includes('kiểm toán')) {
      inspectionType = 'kiem_toan';
      inspectionAgency = 'Kiểm toán Nhà nước';
    } else if (infoLower.includes('kl-kvii')) {
      inspectionType = 'kiem_toan';
      inspectionAgency = 'Kiểm toán Nhà nước Khu vực VII';
    } else if (infoLower.includes('kl-ubnd') || infoLower.includes('kết luận') || infoLower.includes('kl-ttr')) {
      inspectionType = 'thanh_tra';
      inspectionAgency = 'Thanh tra Tỉnh / Huyện';
    }

    const parts = finalConclusionInfo.split(/ngày/i);
    if (parts.length > 0) {
      decNum = parts[0].trim();
    }
    if (parts.length > 1) {
      const dateStr = parts[1].trim();
      const dateParts = dateStr.split('/');
      if (dateParts.length === 3) {
        let day = dateParts[0].trim();
        let month = dateParts[1].trim();
        let year = dateParts[2].trim();
        if (year.includes(' ')) {
          year = year.split(' ')[0];
        }
        if (year.length === 2) year = '20' + year;
        if (day.length === 1) day = '0' + day;
        if (month.length === 1) month = '0' + month;
        decDate = `${year}-${month}-${day}`;
      }
    }

    const inspectionName = inspectionType === 'kiem_toan' 
      ? `Kiểm toán dự án theo Quyết định ${decNum || finalConclusionInfo}`
      : `Thanh tra dự án theo Quyết định ${decNum || finalConclusionInfo}`;

    // Tính tổng số tiền kiến nghị xử lý tài chính (Penalties)
    const totalKn = (thuHoi25_k + giamTru25_k + xlKhac25_k + thuHoi26_k + giamTru26_k + xlKhac26_k) * 1000000;
    const totalTh = (thuHoi25_t + giamTru25_t + xlKhac25_t + thuHoi26_t + giamTru26_t + xlKhac26_t) * 1000000;

    // Xác định trạng thái xử lý sau thanh tra
    let followUpStatus = 'pending';
    if (totalKn > 0) {
      if (totalTh === totalKn) {
        followUpStatus = 'completed';
      } else if (totalTh > 0) {
        followUpStatus = 'in_progress';
      }
    } else {
      followUpStatus = 'completed';
    }

    // Soạn nội dung Kết luận chi tiết
    let conclusion = `Thông tin kết luận: ${finalConclusionInfo}\n\n`;
    conclusion += `* Giai đoạn đến ngày 30/6/2025:\n`;
    conclusion += `  - Thu hồi: Kiến nghị ${thuHoi25_k.toFixed(3)} tr.đ, đã thực hiện ${thuHoi25_t.toFixed(3)} tr.đ\n`;
    conclusion += `  - Giảm trừ: Kiến nghị ${giamTru25_k.toFixed(3)} tr.đ, đã thực hiện ${giamTru25_t.toFixed(3)} tr.đ\n`;
    conclusion += `  - Xử lý khác: Kiến nghị ${xlKhac25_k.toFixed(3)} tr.đ, đã thực hiện ${xlKhac25_t.toFixed(3)} tr.đ\n`;
    conclusion += `  - Xử lý hành chính: Kiến nghị ${xlHanhChinh25_k.toFixed(3)} tập thể/cá nhân, đã thực hiện ${xlHanhChinh25_t.toFixed(3)}\n\n`;

    conclusion += `* Giai đoạn từ 01/7/2025 đến 31/3/2026:\n`;
    conclusion += `  - Thu hồi: Kiến nghị ${thuHoi26_k.toFixed(3)} tr.đ, đã thực hiện ${thuHoi26_t.toFixed(3)} tr.đ\n`;
    conclusion += `  - Giảm trừ: Kiến nghị ${giamTru26_k.toFixed(3)} tr.đ, đã thực hiện ${giamTru26_t.toFixed(3)} tr.đ\n`;
    conclusion += `  - Xử lý khác: Kiến nghị ${xlKhac26_k.toFixed(3)} tr.đ, đã thực hiện ${xlKhac26_t.toFixed(3)} tr.đ\n`;
    conclusion += `  - Xử lý hành chính: Kiến nghị ${xlHanhChinh26_k.toFixed(3)} tập thể/cá nhân, đã thực hiện ${xlHanhChinh26_t.toFixed(3)}`;

    let recs = bienPhap ? `Biện pháp xử lý đã áp dụng: ${bienPhap}` : '';
    if (vuongMac) recs += `\n\nTồn tại, vướng mắc: ${vuongMac}`;

    mappedRecords.push({
      project_id: String(projectId).trim(),
      inspection_type: inspectionType,
      inspection_name: inspectionName,
      inspection_agency: inspectionAgency,
      decision_number: decNum,
      decision_date: decDate,
      conclusion: conclusion,
      recommendations: recs || null,
      penalties: totalKn,
      follow_up_status: followUpStatus,
      follow_up_notes: ghiChu || null,
      attachments: [],
      status: 'active'
    });
  }

  console.log(`Parsed ${mappedRecords.length} records from Excel. Importing into Database...`);

  let successCount = 0;
  for (const record of mappedRecords) {
    // Kiểm tra xem dự án có tồn tại trong hệ thống hay không để tránh vi phạm khóa ngoại
    const { data: projectExist } = await supabase
      .from('projects')
      .select('project_id')
      .eq('project_id', record.project_id)
      .maybeSingle();

    if (!projectExist) {
      console.warn(`[WARNING] Project ID ${record.project_id} not found in database. Skipping.`);
      continue;
    }

    // Kiểm tra xem bản ghi thanh tra đã tồn tại hay chưa để tránh trùng lặp
    const { data: existingIns } = await supabase
      .from('inspections')
      .select('inspection_id')
      .eq('project_id', record.project_id)
      .eq('decision_number', record.decision_number)
      .maybeSingle();

    if (existingIns) {
      // Cập nhật
      const { error: updateErr } = await supabase
        .from('inspections')
        .update({
          inspection_type: record.inspection_type,
          inspection_name: record.inspection_name,
          inspection_agency: record.inspection_agency,
          decision_date: record.decision_date,
          conclusion: record.conclusion,
          recommendations: record.recommendations,
          penalties: record.penalties,
          follow_up_status: record.follow_up_status,
          follow_up_notes: record.follow_up_notes
        })
        .eq('inspection_id', existingIns.inspection_id);

      if (updateErr) {
        console.error(`[ERROR] Failed to update inspection for Project ${record.project_id}:`, updateErr);
      } else {
        console.log(`[SUCCESS] Updated inspection for Project ${record.project_id}`);
        successCount++;
      }
    } else {
      // Insert mới
      const { error: insertErr } = await supabase
        .from('inspections')
        .insert(record);

      if (insertErr) {
        console.error(`[ERROR] Failed to insert inspection for Project ${record.project_id}:`, insertErr);
      } else {
        console.log(`[SUCCESS] Inserted inspection for Project ${record.project_id}`);
        successCount++;
      }
    }
  }

  console.log(`\nImport complete! Successfully imported/updated ${successCount} / ${mappedRecords.length} records.`);
}

importInspections();
