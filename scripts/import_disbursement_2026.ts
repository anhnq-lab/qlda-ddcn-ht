import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Tải biến môi trường
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase URL or Service Role Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const filePath = path.resolve(process.cwd(), 'ks/Giải ngân 2026.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File không tồn tại: ${filePath}`);
    process.exit(1);
  }

  console.log(`🚀 Đang đọc dữ liệu từ: ${filePath}`);
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Chuyển đổi thành mảng các mảng (raw data)
  const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  // Dữ liệu bắt đầu từ dòng index 5 (dòng 6 trong Excel)
  const dataRows = rows.slice(5);

  let successCount = 0;
  let newProjectCount = 0;
  let errorCount = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    
    // Tương ứng với cấu trúc file Excel hiện tại
    const tt = row[0];
    const projectCode = row[1];
    const projectName = row[2];
    const decisionNumber = row[4];
    const decisionDateRaw = row[5];
    const amount = row[8] || 0; // KHV giao
    const disbursedAmount = row[9] || 0; // Lũy kế giải ngân
    
    // Bỏ qua nếu không có mã dự án
    if (!projectCode || String(projectCode).trim() === '') {
      continue;
    }

    // Nếu tên dự án là 'Tổng cộng' thì bỏ qua
    if (projectName === 'Tổng cộng') {
      continue;
    }

    let decisionDateStr = null;
    if (decisionDateRaw instanceof Date) {
      decisionDateStr = decisionDateRaw.toISOString().split('T')[0];
    } else if (typeof decisionDateRaw === 'number') {
       // Thường thư viện xlsx đã xử lý ngày tháng với `cellDates: true`, nhưng fallback
       // Excel dates are number of days since 1900-01-01
       const date = new Date((decisionDateRaw - (25567 + 2)) * 86400 * 1000);
       decisionDateStr = date.toISOString().split('T')[0];
    }

    try {
      // 1. Tìm dự án theo mã national_project_code
      let { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('project_id')
        .eq('national_project_code', String(projectCode));

      if (projectError) throw projectError;

      let projectId;

      if (!projects || projects.length === 0) {
        // Dự án không tồn tại, tạo mới
        console.log(`⚠️ Dự án [${projectCode}] chưa có trong DB. Đang tạo mới...`);
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert({
            project_id: crypto.randomUUID(),
            national_project_code: String(projectCode),
            project_name: projectName,
            status: 0, // Default status
            investor_name: 'Ban Quản lý dự án đầu tư xây dựng công trình dân dụng và công nghiệp tỉnh Hà Tĩnh' // Thông tin chung
          })
          .select('project_id')
          .single();

        if (createError) throw createError;
        projectId = newProject.project_id;
        newProjectCount++;
      } else {
        projectId = projects[0].project_id;
      }

      // 2. Kiểm tra xem đã có kế hoạch vốn cho năm 2026 chưa
      const { data: plans, error: planFetchError } = await supabase
        .from('capital_plans')
        .select('plan_id')
        .eq('project_id', projectId)
        .eq('year', 2026);

      if (planFetchError) throw planFetchError;

      const planData = {
        project_id: projectId,
        year: 2026,
        amount: Number(amount),
        disbursed_amount: Number(disbursedAmount),
        decision_number: decisionNumber ? String(decisionNumber) : null,
        date_assigned: decisionDateStr,
        source: 'Ngân sách nhà nước'
      };

      if (plans && plans.length > 0) {
        // Cập nhật
        const { error: updateError } = await supabase
          .from('capital_plans')
          .update({
            amount: planData.amount,
            disbursed_amount: planData.disbursed_amount,
            decision_number: planData.decision_number,
            date_assigned: planData.date_assigned
          })
          .eq('plan_id', plans[0].plan_id);
          
        if (updateError) throw updateError;
        console.log(`✅ [Cập nhật] Kế hoạch vốn 2026 cho dự án ${projectCode}`);
      } else {
        // Thêm mới
        const { error: insertError } = await supabase
          .from('capital_plans')
          .insert({
            plan_id: crypto.randomUUID(),
            ...planData
          });
          
        if (insertError) throw insertError;
        console.log(`✅ [Thêm mới] Kế hoạch vốn 2026 cho dự án ${projectCode}`);
      }

      successCount++;
    } catch (err: any) {
      console.error(`❌ Lỗi khi xử lý dự án ${projectCode}:`, err.message || err);
      errorCount++;
    }
  }

  console.log('----------------------------------------------------');
  console.log('🎉 XỬ LÝ HOÀN TẤT');
  console.log(`- Thành công: ${successCount} bản ghi`);
  console.log(`- Tạo mới dự án: ${newProjectCount}`);
  console.log(`- Lỗi: ${errorCount}`);
  console.log('----------------------------------------------------');
}

main().catch(console.error);
