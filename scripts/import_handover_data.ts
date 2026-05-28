import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL or Key missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to parse currency (Million VND in CSV -> VND in DB)
function parseMoney(val: string): number {
  if (!val) return 0;
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === '-' || trimmed.toLowerCase() === '#n/a' || trimmed === '0') return 0;
  
  let clean = trimmed.replace(/\s/g, ''); // Bỏ khoảng trắng
  clean = clean.replace(/\./g, '');       // Bỏ tất cả dấu chấm (phân tách hàng nghìn)
  clean = clean.replace(/,/g, '.');       // Thay dấu phẩy thành dấu chấm (thập phân)
  
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num * 1000000);
}

// Helper to parse date (DD/MM/YYYY or MM/DD/YYYY in CSV -> YYYY-MM-DD in DB)
function parseDate(val: string): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === '-' || trimmed.toLowerCase() === '#n/a' || trimmed === '0') return null;
  
  const parts = trimmed.split('/');
  if (parts.length !== 3) return null;
  
  const p0 = parseInt(parts[0]);
  const p1 = parseInt(parts[1]);
  const y = parseInt(parts[2]);
  if (isNaN(p0) || isNaN(p1) || isNaN(y)) return null;

  let day = p0;
  let month = p1;
  
  if (p0 > 12) {
    day = p0;
    month = p1;
  } else if (p1 > 12) {
    day = p1;
    month = p0;
  } else {
    // Mặc định là ngày/tháng/năm cho hành chính VN
    day = p0;
    month = p1;
  }
  
  const mm = month < 10 ? `0${month}` : `${month}`;
  const dd = day < 10 ? `0${day}` : `${day}`;
  return `${y}-${mm}-${dd}`;
}

function cleanVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

// Simple CSV parser supporting quotes
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(s => s.trim().replace(/^["']|["']$/g, ''));
}

function parseCSVFile(filePath: string): string[][] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const data: string[][] = [];
  
  for (const line of lines) {
    if (!line || line.trim() === '') continue;
    data.push(parseCSVLine(line));
  }
  return data;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`🚀 BẮT ĐẦU IMPORT DỮ LIỆU BÀN GIAO... [Chế độ: ${isDryRun ? 'DRY_RUN (Chạy thử)' : 'LIVE (Ghi thật)'}]`);

  const pl03Path = path.resolve(__dirname, '../Ks/Bc dự huyện chuyển về - PL03.csv');
  const pl04Path = path.resolve(__dirname, '../Ks/Bc dự huyện chuyển về - PL04.csv');

  if (!fs.existsSync(pl03Path) || !fs.existsSync(pl04Path)) {
    console.error('❌ Thiếu file CSV phụ lục trong thư mục Ks!');
    process.exit(1);
  }

  // 1. Tải danh sách dự án hiện có trong DB để so khớp
  console.log('🕵️ Đang đọc danh sách dự án hiện có từ DB...');
  const { data: dbProjects, error: dbProjErr } = await supabase
    .from('projects')
    .select('project_id, project_name, national_project_code');

  if (dbProjErr) {
    console.error('❌ Lỗi tải dự án từ DB:', dbProjErr);
    process.exit(1);
  }
  console.log(`💾 Đã tải ${dbProjects.length} dự án từ database.`);

  const projectMap = new Map<string, any>();
  dbProjects.forEach(p => {
    projectMap.set(p.project_id, p);
    if (p.national_project_code) {
      projectMap.set(p.national_project_code, p);
    }
  });

  // 2. Parse PL03 & PL04
  const pl03Rows = parseCSVFile(pl03Path);
  const pl04Rows = parseCSVFile(pl04Path);

  let currentDistrict = '';
  const projectsToUpsert: any[] = [];
  const capitalPlansToUpsert: any[] = [];
  const disbursementsToInsert: any[] = [];

  // --- Xử lý PL03 ---
  console.log('\nProcessing PL03 (Dự án đã hoàn thành)...');
  for (let i = 0; i < pl03Rows.length; i++) {
    const cols = pl03Rows[i];
    if (cols.length < 5) continue;
    
    const col0 = cols[0]?.trim(); // TT
    const col1 = cols[1]?.trim(); // Tên hoặc Huyện
    const col2 = cols[2]?.trim(); // Mã dự án

    // Nhận diện dòng huyện (VD: "I", "Huyện Vũ Quang", "")
    if (/^[IVXLCDM]+$/.test(col0) && col1.toLowerCase().includes('huyện')) {
      currentDistrict = col1;
      continue;
    }

    // Bỏ qua dòng tiêu đề phụ/số cột
    if (col0 === '1' && col1 === '2' && col2 === '3') continue;
    if (col0 === 'TT' || !col2 || !/^\d+$/.test(col2)) continue;

    const projectIdOrCode = col2;
    const projectName = col1;
    const policyDecision = cols[3];
    const investmentDecision = cols[4];
    const totalInvestment = parseMoney(cols[5]);
    
    // Kế hoạch vốn đã bố trí đến 30/6/2025
    const khvDaBoTriTong = parseMoney(cols[6]);
    const khvNSTW = parseMoney(cols[7]);
    const khvNSTinh = parseMoney(cols[8]);
    const khvNSHuyen = parseMoney(cols[9]);
    const khvNSKhac = parseMoney(cols[10]);

    // Khối lượng nghiệm thu & Giải ngân đến 30/6/2025
    const luyKeNghiemThu = parseMoney(cols[11]);
    const luyKeGiaiNgan = parseMoney(cols[13]);
    const luyKeTamUng = parseMoney(cols[14]);
    const congNoDaBoTri = parseMoney(cols[15]);
    const tinhTrangQuyetToan = cols[16];

    // Bàn giao & Giai đoạn sau 1/7/2025
    const banQLDATiepNhan = cols[17];
    const thoiDiemBanGiao = parseDate(cols[18]);
    const hoSoBanGiao = cols[19];
    const klThucHienBanGiao = parseMoney(cols[20]);
    
    const khVonBanGiaoTong = parseMoney(cols[21]);
    const khVonBanGiaoHuyen = parseMoney(cols[22]);
    const khVonBanGiaoKhac = parseMoney(cols[23]);

    const tonTaiBanGiao = cols[24];
    const khVonDieuChinhBoSung = parseMoney(cols[25]);
    const giaiNganGiaiDoan2 = parseMoney(cols[26]);
    const congNoGiaiDoan2 = parseMoney(cols[27]);
    const tinhTrangQTGiaiDoan2 = cols[28];

    // So khớp dự án trong DB
    let matched = projectMap.get(projectIdOrCode);
    let targetProjectId = projectIdOrCode;

    // Xử lý đặc biệt trùng mã 7874264
    if (projectIdOrCode === '7874264') {
      targetProjectId = `7874264_${cleanVietnamese(projectName).substring(0, 30)}`;
    }

    const isNewProject = !matched && projectIdOrCode !== '7874264';
    
    // Ghi nhận thông tin dự án
    projectsToUpsert.push({
      project_id: isNewProject ? projectIdOrCode : (matched?.project_id || targetProjectId),
      project_name: projectName,
      national_project_code: projectIdOrCode,
      group_code: 'C', // Mặc định nhóm C cho các dự án chuyển giao huyện
      investment_type: 1, // Đầu tư công
      total_investment: totalInvestment,
      old_investor: currentDistrict || null,
      decision_level_before_handover: 'H', // Huyện
      transfer_decision: investmentDecision || policyDecision || null,
      handover_date: thoiDiemBanGiao,
      current_status_code: 7, // Mặc định Đã quyết toán còn công nợ cho PL03
      project_management: {
        ban_tiep_nhan: banQLDATiepNhan || null,
        thoi_diem_ban_giao: cols[17] || null,
        ho_so_ban_giao: hoSoBanGiao || null,
        gia_tri_khoi_luong_ban_giao: klThucHienBanGiao,
      },
      project_status_info: {
        cong_no_den_30_6_2025: congNoDaBoTri,
        tinh_trang_quyet_toan_den_30_6_2025: tinhTrangQuyetToan || null,
        ton_tai_vuong_mac_ban_giao: tonTaiBanGiao || null,
        cong_no_sau_ban_giao: congNoGiaiDoan2,
        tinh_trang_quyet_toan_sau_ban_giao: tinhTrangQTGiaiDoan2 || null,
      },
      adjusted_approval: {
        chu_truong_dau_tu: { quyet_dinh: policyDecision || null },
        quyet_dinh_dau_tu: { quyet_dinh: investmentDecision || null }
      }
    });

    const pId = matched?.project_id || targetProjectId;

    // Kế hoạch vốn 2025 (Kỳ trước bàn giao)
    capitalPlansToUpsert.push({
      plan_id: `CP_${pId}_2025`,
      project_id: pId,
      year: 2025,
      amount: khvDaBoTriTong,
      disbursed_amount: luyKeGiaiNgan,
      source: 'Ngân sách nhà nước',
      plan_type: 'annual',
      status: 'Approved',
      notes: JSON.stringify({
        source_breakdown: {
          ns_tw: khvNSTW,
          ns_tinh: khvNSTinh,
          ns_huyen: khvNSHuyen,
          nguon_khac: khvNSKhac
        },
        luy_ke_nghiem_thu: luyKeNghiemThu,
        luy_ke_tam_ung: luyKeTamUng
      })
    });

    // Kế hoạch vốn 2026 (Kỳ sau bàn giao)
    if (khVonBanGiaoTong > 0 || khVonDieuChinhBoSung > 0 || giaiNganGiaiDoan2 > 0) {
      capitalPlansToUpsert.push({
        plan_id: `CP_${pId}_2026`,
        project_id: pId,
        year: 2026,
        amount: khVonBanGiaoTong + khVonDieuChinhBoSung,
        disbursed_amount: giaiNganGiaiDoan2,
        source: 'Ngân sách nhà nước',
        plan_type: 'annual',
        status: 'Approved',
        notes: JSON.stringify({
          kh_von_ban_giao: {
            tong: khVonBanGiaoTong,
            huyen: khVonBanGiaoHuyen,
            khac: khVonBanGiaoKhac
          },
          kh_von_dieu_chinh_bo_sung: khVonDieuChinhBoSung
        })
      });

      // Tạo giao dịch giải ngân thực tế cho năm 2026
      if (giaiNganGiaiDoan2 > 0) {
        disbursementsToInsert.push({
          disbursement_id: `DISB_${pId}_2026`,
          project_id: pId,
          capital_plan_id: `CP_${pId}_2026`,
          amount: giaiNganGiaiDoan2,
          date: thoiDiemBanGiao || '2026-03-31',
          description: 'Giải ngân giai đoạn sau bàn giao (01/7/2025 - 31/3/2026)',
          type: 'payment',
          status: 'Completed',
          advance_balance: 0,
          cumulative_before: luyKeGiaiNgan
        });
      }
    }
  }

  // --- Xử lý PL04 ---
  console.log('Processing PL04 (Dự án dở dang/chuẩn bị đầu tư)...');
  currentDistrict = '';
  for (let i = 0; i < pl04Rows.length; i++) {
    const cols = pl04Rows[i];
    if (cols.length < 5) continue;

    const col0 = cols[0]?.trim(); // TT
    const col1 = cols[1]?.trim(); // Tên hoặc Huyện
    const col2 = cols[2]?.trim(); // Mã dự án

    // Nhận diện dòng huyện
    if (/^[IVXLCDM]+$/.test(col0) && col1.toLowerCase().includes('huyện')) {
      currentDistrict = col1;
      continue;
    }

    // Bỏ qua dòng tiêu đề phụ/số cột
    if (col0 === '1' && col1 === '2' && col2 === '3') continue;
    if (col0 === 'TT' || !col2 || !/^\d+$/.test(col2)) continue;

    const projectIdOrCode = col2;
    const projectName = col1;
    const policyDecision = cols[3];
    const investmentDecision = cols[4];
    const totalInvestment = parseMoney(cols[5]);

    // Kế hoạch vốn đã bố trí đến 30/6/2025
    const khvDaBoTriTong = parseMoney(cols[6]);
    const khvNSTW = parseMoney(cols[7]);
    const khvNSTinh = parseMoney(cols[8]);
    const khvNSHuyen = parseMoney(cols[9]);
    const khvNSKhac = parseMoney(cols[10]);

    // Khối lượng nghiệm thu & Giải ngân đến 30/6/2025
    const luyKeNghiemThu = parseMoney(cols[11]);
    const luyKeNghiemThuXL = parseMoney(cols[12]);
    const luyKeNghiemThuXLPct = cols[13]; // tỷ lệ %
    
    const luyKeGiaiNgan = parseMoney(cols[14]);
    const luyKeGiaiNganXL = parseMoney(cols[15]);
    const luyKeTamUngXL = parseMoney(cols[16]);
    
    const tyLeThucHienDuAn = parseFloat(cols[17]?.replace(/%/g, '')) || 0;

    // Bàn giao & Giai đoạn sau 1/7/2025
    const banQLDATiepNhan = cols[18];
    const thoiDiemBanGiao = parseDate(cols[19]);
    const hoSoBanGiao = cols[20];
    const klThucHienBanGiao = parseMoney(cols[21]);

    const khVonBanGiaoTong = parseMoney(cols[22]);
    const khVonBanGiaoHuyen = parseMoney(cols[23]);
    const khVonBanGiaoKhac = parseMoney(cols[24]);

    const tonTaiBanGiao = cols[25];
    const khVonDieuChinhBoSung = parseMoney(cols[26]);
    const dieuChinhDuAnHopDong = cols[27];

    // Lũy kế nghiệm thu đến 31/3/2026
    const luyKeNghiemThuG2Tong = parseMoney(cols[28]);
    const luyKeNghiemThuG2XL = parseMoney(cols[29]);
    const luyKeNghiemThuG2XLPct = cols[30];

    // Lũy kế giải ngân đến 31/3/2026
    const luyKeGiaiNganG2Tong = parseMoney(cols[31]);
    const luyKeGiaiNganG2TamUng = parseMoney(cols[32]);

    const tinhTrangQTGiaiDoan2 = cols[33];
    
    // Trạng thái chậm tiến độ
    const thoiGianHoanThanh = cols[34];
    const nguyenNhanCham = cols[35];
    const kienNghiDeXuat = cols[36];

    // So khớp dự án trong DB
    let matched = projectMap.get(projectIdOrCode);
    let targetProjectId = projectIdOrCode;

    // Xử lý đặc biệt trùng mã 7874264
    if (projectIdOrCode === '7874264') {
      targetProjectId = `7874264_${cleanVietnamese(projectName).substring(0, 30)}`;
    }

    const isNewProject = !matched && projectIdOrCode !== '7874264';

    // Xác định trạng thái chi tiết dựa trên cột Quyết toán hoặc Chậm tiến độ
    let currentStatusCode = 3; // Đang thi công mặc định
    if (tinhTrangQTGiaiDoan2?.includes('Đã quyết toán')) {
      currentStatusCode = 9; // Đã kết thúc
    } else if (tinhTrangQTGiaiDoan2?.includes('Đang quyêt toán') || tinhTrangQTGiaiDoan2?.includes('nghiệm thu hoàn thành')) {
      currentStatusCode = 5; // Bàn giao chưa quyết toán
    } else if (thoiGianHoanThanh?.toLowerCase().includes('chậm tiến độ')) {
      currentStatusCode = 8; // Xử lý tài chính / chậm tiến độ
    }

    projectsToUpsert.push({
      project_id: isNewProject ? projectIdOrCode : (matched?.project_id || targetProjectId),
      project_name: projectName,
      national_project_code: projectIdOrCode,
      group_code: 'C',
      investment_type: 1,
      total_investment: totalInvestment,
      old_investor: currentDistrict || null,
      decision_level_before_handover: 'H',
      transfer_decision: investmentDecision || policyDecision || null,
      handover_date: thoiDiemBanGiao,
      current_status_code: currentStatusCode,
      progress: tyLeThucHienDuAn,
      project_management: {
        ban_tiep_nhan: banQLDATiepNhan || null,
        thoi_diem_ban_giao: cols[19] || null,
        ho_so_ban_giao: hoSoBanGiao || null,
        gia_tri_khoi_luong_ban_giao: klThucHienBanGiao,
      },
      project_status_info: {
        ton_tai_vuong_mac_ban_giao: tonTaiBanGiao || null,
        tinh_trang_quyet_toan_sau_ban_giao: tinhTrangQTGiaiDoan2 || null,
        cham_tien_do: {
          thoi_gian_hoan_thanh: thoiGianHoanThanh || null,
          nguyen_nhan: nguyenNhanCham || null,
          kien_nghi_de_xuat: kienNghiDeXuat || null,
          dieu_chinh_du_an_hop_dong: dieuChinhDuAnHopDong || null
        }
      },
      adjusted_approval: {
        chu_truong_dau_tu: { quyet_dinh: policyDecision || null },
        quyet_dinh_dau_tu: { quyet_dinh: investmentDecision || null },
        dieu_chinh_du_an_hop_dong: dieuChinhDuAnHopDong || null
      }
    });

    const pId = matched?.project_id || targetProjectId;

    // Kế hoạch vốn 2025 (Kỳ trước bàn giao)
    capitalPlansToUpsert.push({
      plan_id: `CP_${pId}_2025`,
      project_id: pId,
      year: 2025,
      amount: khvDaBoTriTong,
      disbursed_amount: luyKeGiaiNgan,
      source: 'Ngân sách nhà nước',
      plan_type: 'annual',
      status: 'Approved',
      notes: JSON.stringify({
        source_breakdown: {
          ns_tw: khvNSTW,
          ns_tinh: khvNSTinh,
          ns_huyen: khvNSHuyen,
          nguon_khac: khvNSKhac
        },
        luy_ke_nghiem_thu: luyKeNghiemThu,
        luy_ke_nghiem_thu_xay_lap: luyKeNghiemThuXL,
        ty_le_nghiem_thu_xay_lap: luyKeNghiemThuXLPct,
        luy_ke_giai_ngan_xay_lap: luyKeGiaiNganXL,
        luy_ke_tam_ung_xay_lap: luyKeTamUngXL
      })
    });

    // Kế hoạch vốn 2026 (Kỳ sau bàn giao)
    if (khVonBanGiaoTong > 0 || khVonDieuChinhBoSung > 0 || luyKeGiaiNganG2Tong > 0) {
      const giaiNganTrongKy = luyKeGiaiNganG2Tong - luyKeGiaiNgan; // Giải ngân thực tế giai đoạn 2
      capitalPlansToUpsert.push({
        plan_id: `CP_${pId}_2026`,
        project_id: pId,
        year: 2026,
        amount: khVonBanGiaoTong + khVonDieuChinhBoSung,
        disbursed_amount: luyKeGiaiNganG2Tong,
        source: 'Ngân sách nhà nước',
        plan_type: 'annual',
        status: 'Approved',
        notes: JSON.stringify({
          kh_von_ban_giao: {
            tong: khVonBanGiaoTong,
            huyen: khVonBanGiaoHuyen,
            khac: khVonBanGiaoKhac
          },
          kh_von_dieu_chinh_bo_sung: khVonDieuChinhBoSung,
          luy_ke_nghiem_thu_den_31_3_2026: {
            tong: luyKeNghiemThuG2Tong,
            xay_lap: luyKeNghiemThuG2XL,
            ty_le: luyKeNghiemThuG2XLPct
          },
          luy_ke_giai_ngan_den_31_3_2026: {
            tong: luyKeGiaiNganG2Tong,
            tam_ung: luyKeGiaiNganG2TamUng
          }
        })
      });

      // Tạo giao dịch giải ngân thực tế cho năm 2026 (số tiền tăng thêm trong giai đoạn 2)
      if (giaiNganTrongKy > 0) {
        disbursementsToInsert.push({
          disbursement_id: `DISB_${pId}_2026`,
          project_id: pId,
          capital_plan_id: `CP_${pId}_2026`,
          amount: giaiNganTrongKy,
          date: thoiDiemBanGiao || '2026-03-31',
          description: 'Giải ngân giai đoạn sau bàn giao (01/7/2025 - 31/3/2026)',
          type: 'payment',
          status: 'Completed',
          advance_balance: 0,
          cumulative_before: luyKeGiaiNgan
        });
      }
    }
  }

  // Khử trùng lặp an toàn trước khi ghi vào database
  const uniqueProjectsMap = new Map<string, any>();
  projectsToUpsert.forEach(p => {
    const existing = uniqueProjectsMap.get(p.project_id);
    if (existing) {
      uniqueProjectsMap.set(p.project_id, { ...existing, ...p });
    } else {
      uniqueProjectsMap.set(p.project_id, p);
    }
  });
  const finalProjects = Array.from(uniqueProjectsMap.values());

  const uniqueCapitalPlansMap = new Map<string, any>();
  capitalPlansToUpsert.forEach(cp => {
    const existing = uniqueCapitalPlansMap.get(cp.plan_id);
    if (existing) {
      uniqueCapitalPlansMap.set(cp.plan_id, { ...existing, ...cp });
    } else {
      uniqueCapitalPlansMap.set(cp.plan_id, cp);
    }
  });
  const finalCapitalPlans = Array.from(uniqueCapitalPlansMap.values());

  const uniqueDisbursementsMap = new Map<string, any>();
  disbursementsToInsert.forEach(d => {
    const existing = uniqueDisbursementsMap.get(d.disbursement_id);
    if (existing) {
      uniqueDisbursementsMap.set(d.disbursement_id, { ...existing, ...d });
    } else {
      uniqueDisbursementsMap.set(d.disbursement_id, d);
    }
  });
  const finalDisbursements = Array.from(uniqueDisbursementsMap.values());

  console.log('\n--- TỔNG HỢP DỮ LIỆU IMPORT ---');
  console.log(`- Tổng số dự án cần upsert: ${finalProjects.length}`);
  console.log(`- Tổng số kế hoạch vốn cần upsert: ${finalCapitalPlans.length}`);
  console.log(`- Tổng số giao dịch giải ngân cần tạo: ${finalDisbursements.length}`);

  if (isDryRun) {
    console.log('\n--- PREVIEW BẢN GHI ĐẦU TIÊN ---');
    console.log('Project:', JSON.stringify(finalProjects[0], null, 2));
    console.log('Capital Plan:', JSON.stringify(finalCapitalPlans[0], null, 2));
    if (finalDisbursements.length > 0) {
      console.log('Disbursement:', JSON.stringify(finalDisbursements[0], null, 2));
    }
    console.log('\n❌ dry-run mode active. Không có dữ liệu nào được thay đổi trong database.');
    return;
  }

  // --- LIVE WRITE TO DATABASE ---
  console.log('\n--- ĐANG GHI DỮ LIỆU VÀO DATABASE ---');

  // Step 1: Batch upsert Projects
  const batchSize = 100;
  console.log(`💾 Đang ghi nhận các dự án (${finalProjects.length} bản ghi)...`);
  for (let idx = 0; idx < finalProjects.length; idx += batchSize) {
    const batch = finalProjects.slice(idx, idx + batchSize);
    const { error } = await supabase.from('projects').upsert(batch);
    if (error) {
      console.error(`❌ Lỗi batch dự án ${idx / batchSize + 1}:`, error);
      process.exit(1);
    }
    console.log(`   Processed project batch ${idx / batchSize + 1}`);
  }

  // Step 2: Batch upsert Capital Plans
  console.log(`💾 Đang ghi nhận kế hoạch vốn (${finalCapitalPlans.length} bản ghi)...`);
  for (let idx = 0; idx < finalCapitalPlans.length; idx += batchSize) {
    const batch = finalCapitalPlans.slice(idx, idx + batchSize);
    const { error } = await supabase.from('capital_plans').upsert(batch);
    if (error) {
      console.error(`❌ Lỗi batch kế hoạch vốn ${idx / batchSize + 1}:`, error);
      process.exit(1);
    }
    console.log(`   Processed capital_plans batch ${idx / batchSize + 1}`);
  }

  // Step 3: Batch insert Disbursements
  if (finalDisbursements.length > 0) {
    console.log(`💾 Đang ghi nhận lịch sử giải ngân (${finalDisbursements.length} bản ghi)...`);
    for (let idx = 0; idx < finalDisbursements.length; idx += batchSize) {
      const batch = finalDisbursements.slice(idx, idx + batchSize);
      const { error } = await supabase.from('disbursements').upsert(batch);
      if (error) {
        console.error(`❌ Lỗi batch giải ngân ${idx / batchSize + 1}:`, error);
        process.exit(1);
      }
      console.log(`   Processed disbursements batch ${idx / batchSize + 1}`);
    }
  }

  console.log('\n🌟 ĐÃ HOÀN THÀNH IMPORT DỮ LIỆU THÀNH CÔNG! 🌟');
}

main().catch(err => {
  console.error('💥 LỖI CRITICAL HỆ THỐNG:', err);
  process.exit(1);
});
