import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL or Key missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const excelFilePath = './Ks/28.5.26 BC  dự án các huyện chuyển về.xlsx';
const errorsJsonPath = './scratch/audit_errors.json';

const getStr = (val: any): string => (val !== null && val !== undefined) ? String(val).trim() : '';

// Formula-aware parseNum function
function parseNum(val: any, limit: number | null = null): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object') {
    if (val.result !== undefined && val.result !== null) {
      return parseNum(val.result, limit);
    }
    return 0;
  }
  let str = String(val).trim().replace(/\s+/g, '');
  if (str === '-' || str === '') return 0;
  
  if (str.includes(',') && str.includes('.')) {
    const firstComma = str.indexOf(',');
    const firstDot = str.indexOf('.');
    if (firstComma < firstDot) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(/\./g, '').replace(/,/g, '.');
    }
    return parseFloat(str) || 0;
  }
  
  if (str.includes(',') && !str.includes('.')) {
    const parts = str.split(',');
    if (parts.length === 2) {
      const valWithDot = parseFloat(str.replace(/,/g, '.'));
      const valStrip = parseFloat(str.replace(/,/g, ''));
      if (limit !== null && valStrip > limit * 1.5) {
        return valWithDot;
      }
      return valWithDot;
    }
  }
  
  return parseFloat(str) || 0;
}

// Convert million VND in Excel -> VND in Database
function parseMoney(val: any): number {
  const num = parseNum(val);
  return Math.round(num * 1000000);
}

// String date parser helper
function parseStringDate(val: string): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === '-' || trimmed.toLowerCase() === '#n/a' || trimmed === '0') return null;
  
  const parts = trimmed.split('/');
  if (parts.length !== 3) {
    // Thử tách bằng dấu gạch ngang
    const partsDash = trimmed.split('-');
    if (partsDash.length === 3) {
      const p0 = parseInt(partsDash[0]);
      const p1 = parseInt(partsDash[1]);
      const y = parseInt(partsDash[2]);
      if (isNaN(p0) || isNaN(p1) || isNaN(y)) return null;
      // Dạng YYYY-MM-DD nếu năm ở đầu
      if (partsDash[0].length === 4) {
        return trimmed;
      }
      const mm = p1 < 10 ? `0${p1}` : `${p1}`;
      const dd = p0 < 10 ? `0${p0}` : `${p0}`;
      return `${y}-${mm}-${dd}`;
    }
    return null;
  }
  
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
    day = p0;
    month = p1;
  }
  
  const mm = month < 10 ? `0${month}` : `${month}`;
  const dd = day < 10 ? `0${day}` : `${day}`;
  return `${y}-${mm}-${dd}`;
}

// Safe Excel Date parser
function parseExcelDate(val: any): string | null {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = val.getMonth() + 1;
    const d = val.getDate();
    const mm = m < 10 ? `0${m}` : `${m}`;
    const dd = d < 10 ? `0${d}` : `${d}`;
    return `${y}-${mm}-${dd}`;
  }
  return parseStringDate(String(val));
}

function cleanVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`🚀 BẮT ĐẦU IMPORT DỮ LIỆU BÀN GIAO (XLSX)... [Chế độ: ${isDryRun ? 'DRY_RUN (Chạy thử)' : 'LIVE (Ghi thật)'}]`);

  if (!fs.existsSync(excelFilePath)) {
    console.error(`❌ Không tìm thấy file Excel tại: ${excelFilePath}`);
    process.exit(1);
  }

  // Load audit errors JSON
  let errorsJson: any = { PL03: [], PL04: [] };
  if (fs.existsSync(errorsJsonPath)) {
    try {
      errorsJson = JSON.parse(fs.readFileSync(errorsJsonPath, 'utf8'));
      console.log(`🔍 Đã tải registry lỗi từ: ${errorsJsonPath}`);
    } catch (err) {
      console.warn('⚠️ Lỗi đọc registry lỗi JSON. Sẽ không gắn cờ lỗi.');
    }
  } else {
    console.warn('⚠️ Không tìm thấy registry lỗi JSON. Sẽ không gắn cờ lỗi.');
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

  // 2. Mở file Excel
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelFilePath);
  console.log(`📖 Đã đọc file Excel thành công.`);

  const projectsToUpsert: any[] = [];
  const capitalPlansToUpsert: any[] = [];
  const disbursementsToInsert: any[] = [];

  // --- SHEET PL03 ---
  const sheet03 = workbook.getWorksheet('PL03');
  if (sheet03) {
    console.log('\nProcessing PL03 (Dự án đã hoàn thành)...');
    let currentDistrict = '';

    sheet03.eachRow((row, rowNumber) => {
      if (rowNumber <= 7) return;

      const col0 = getStr(row.getCell(1).value); // TT
      const col1 = getStr(row.getCell(2).value); // Tên hoặc huyện
      const col2 = getStr(row.getCell(3).value); // Mã dự án

      if (col0 && /^[IVXLCDM]+$/.test(col0) && col1.toLowerCase().includes('huyện')) {
        currentDistrict = col1;
        return;
      }

      if (col0 === '1' && col1 === '2' && col2 === '3') return;
      if (col0 === 'TT' || !col2 || !/^\d+$/.test(col2)) return;

      const projectIdOrCode = col2;
      const projectName = col1;
      const policyDecision = getStr(row.getCell(4).value);
      const investmentDecision = getStr(row.getCell(5).value);
      const totalInvestment = parseMoney(row.getCell(6).value);
      
      const khvDaBoTriTong = parseMoney(row.getCell(7).value);
      const khvNSTW = parseMoney(row.getCell(8).value);
      const khvNSTinh = parseMoney(row.getCell(9).value);
      const khvNSHuyen = parseMoney(row.getCell(10).value);
      const khvNSKhac = parseMoney(row.getCell(11).value);

      const luyKeNghiemThu = parseMoney(row.getCell(12).value);
      const luyKeNghiemThuXL = parseMoney(row.getCell(13).value);
      const luyKeGiaiNgan = parseMoney(row.getCell(14).value);
      const luyKeGiaiNganXL = parseMoney(row.getCell(15).value);
      const congNoDaBoTri = parseMoney(row.getCell(16).value);
      const tinhTrangQuyetToan = getStr(row.getCell(17).value);
      const banQLDATiepNhan = getStr(row.getCell(18).value);
      const thoiDiemBanGiao = parseExcelDate(row.getCell(19).value);
      const hoSoBanGiao = getStr(row.getCell(20).value);
      const klThucHienBanGiao = parseMoney(row.getCell(21).value);
      
      const khVonBanGiaoTong = parseMoney(row.getCell(22).value);
      const khVonBanGiaoHuyen = parseMoney(row.getCell(23).value);
      const khVonBanGiaoKhac = parseMoney(row.getCell(24).value);

      const tonTaiBanGiao = getStr(row.getCell(25).value);
      const khVonDieuChinhBoSung = parseMoney(row.getCell(26).value);
      const giaiNganGiaiDoan2 = parseMoney(row.getCell(27).value);
      const congNoGiaiDoan2 = parseMoney(row.getCell(28).value);
      const tinhTrangQTGiaiDoan2 = getStr(row.getCell(29).value);

      // Get validation errors for this specific row in PL03
      const rowErrors = errorsJson.PL03?.filter((err: any) => err.row === rowNumber) || [];

      // So khớp dự án trong DB
      let matched = projectMap.get(projectIdOrCode);
      let targetProjectId = projectIdOrCode;

      if (projectIdOrCode === '7874264') {
        targetProjectId = `7874264_${cleanVietnamese(projectName).substring(0, 30)}`;
      }

      const isNewProject = !matched && projectIdOrCode !== '7874264';
      const pId = matched?.project_id || targetProjectId;

      projectsToUpsert.push({
        project_id: pId,
        project_name: projectName,
        national_project_code: projectIdOrCode,
        group_code: 'C', 
        investment_type: 1, 
        total_investment: totalInvestment,
        old_investor: currentDistrict || null,
        decision_level_before_handover: 'H', 
        transfer_decision: investmentDecision || policyDecision || null,
        handover_date: thoiDiemBanGiao,
        current_status_code: 7, // Đã quyết toán còn công nợ
        project_management: {
          ban_tiep_nhan: banQLDATiepNhan || null,
          thoi_diem_ban_giao: thoiDiemBanGiao || null,
          ho_so_ban_giao: hoSoBanGiao || null,
          gia_tri_khoi_luong_ban_giao: klThucHienBanGiao,
        },
        project_status_info: {
          cong_no_den_30_6_2025: congNoDaBoTri,
          tinh_trang_quyet_toan_den_30_6_2025: tinhTrangQuyetToan || null,
          ton_tai_vuong_mac_ban_giao: tonTaiBanGiao || null,
          cong_no_sau_ban_giao: congNoGiaiDoan2,
          tinh_trang_quyet_toan_sau_ban_giao: tinhTrangQTGiaiDoan2 || null,
          validation_errors: rowErrors.map((e: any) => ({ type: e.type, detail: e.detail }))
        },
        adjusted_approval: {
          chu_truong_dau_tu: { quyet_dinh: policyDecision || null },
          quyet_dinh_dau_tu: { quyet_dinh: investmentDecision || null }
        }
      });

      // Kế hoạch vốn 2025 (Kỳ trước bàn giao)
      capitalPlansToUpsert.push({
        plan_id: `CP_${pId}_2025`,
        project_id: pId,
        year: 2025,
        amount: khvDaBoTriTong,
        disbursed_amount: luyKeGiaiNgan,
        luy_ke_nghiem_thu: luyKeNghiemThu,
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
          luy_ke_giai_ngan_xay_lap: luyKeGiaiNganXL
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
          luy_ke_nghiem_thu: 0, // PL03 đã hoàn thành trước bàn giao nên Phase 2 nghiệm thu = 0
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
            status: 'Completed',
            form_type: 'payment',
            created_at: new Date().toISOString()
          });
        }
      }
    });
  }

  // --- SHEET PL04 ---
  const sheet04 = workbook.getWorksheet('PL04');
  if (sheet04) {
    console.log('\nProcessing PL04 (Dự án dở dang/chuẩn bị đầu tư)...');
    let currentDistrict = '';

    sheet04.eachRow((row, rowNumber) => {
      if (rowNumber <= 7) return;

      const col0 = getStr(row.getCell(1).value); // TT
      const col1 = getStr(row.getCell(2).value); // Tên hoặc huyện
      const col2 = getStr(row.getCell(3).value); // Mã dự án

      if (col0 && /^[IVXLCDM]+$/.test(col0) && col1.toLowerCase().includes('huyện')) {
        currentDistrict = col1;
        return;
      }

      if (col0 === '1' && col1 === '2' && col2 === '3') return;
      if (col0 === 'TT' || !col2 || !/^\d+$/.test(col2)) return;

      const projectIdOrCode = col2;
      const projectName = col1;
      const policyDecision = getStr(row.getCell(4).value);
      const investmentDecision = getStr(row.getCell(5).value);
      const totalInvestment = parseMoney(row.getCell(6).value);
      
      const khvDaBoTriTong = parseMoney(row.getCell(7).value);
      const khvNSTW = parseMoney(row.getCell(8).value);
      const khvNSTinh = parseMoney(row.getCell(9).value);
      const khvNSHuyen = parseMoney(row.getCell(10).value);
      const khvNSKhac = parseMoney(row.getCell(11).value);

      const luyKeNghiemThu = parseMoney(row.getCell(12).value);
      const luyKeNghiemThuXL = parseMoney(row.getCell(13).value);
      const luyKeNghiemThuXLPct = getStr(row.getCell(14).value);
      
      const luyKeGiaiNgan = parseMoney(row.getCell(15).value);
      const luyKeGiaiNganXL = parseMoney(row.getCell(16).value);
      const luyKeTamUngXL = parseMoney(row.getCell(17).value);
      const progressRatio = parseNum(row.getCell(18).value); // Tỷ lệ giải ngân
      
      const banQLDATiepNhan = getStr(row.getCell(19).value);
      const thoiDiemBanGiao = parseExcelDate(row.getCell(20).value);
      const hoSoBanGiao = getStr(row.getCell(21).value);
      const klThucHienBanGiao = parseMoney(row.getCell(22).value);

      const khVonBanGiaoTong = parseMoney(row.getCell(23).value);
      const khVonBanGiaoHuyen = parseMoney(row.getCell(24).value);
      const khVonBanGiaoKhac = parseMoney(row.getCell(25).value);

      const tonTaiBanGiao = getStr(row.getCell(26).value);
      const khVonDieuChinhBoSung = parseMoney(row.getCell(27).value);
      const dieuChinhDuAnHopDong = getStr(row.getCell(28).value);

      const luyKeNghiemThuG2Tong = parseMoney(row.getCell(29).value);
      const luyKeNghiemThuG2XL = parseMoney(row.getCell(30).value);
      const luyKeNghiemThuG2XLPct = getStr(row.getCell(31).value);

      const luyKeGiaiNganG2Tong = parseMoney(row.getCell(32).value);
      const luyKeGiaiNganG2TamUng = parseMoney(row.getCell(33).value);

      const tinhTrangQTGiaiDoan2 = getStr(row.getCell(34).value);
      const thoiGianHoanThanh = getStr(row.getCell(35).value);
      const nguyenNhanCham = getStr(row.getCell(36).value);
      const kienNghiDeXuat = getStr(row.getCell(37).value);

      // Get validation errors for this specific row in PL04
      const rowErrors = errorsJson.PL04?.filter((err: any) => err.row === rowNumber) || [];

      // So khớp dự án trong DB
      let matched = projectMap.get(projectIdOrCode);
      let targetProjectId = projectIdOrCode;

      if (projectIdOrCode === '7874264') {
        targetProjectId = `7874264_${cleanVietnamese(projectName).substring(0, 30)}`;
      }

      const pId = matched?.project_id || targetProjectId;

      // Trạng thái dự án chuyển tiếp dở dang
      let currentStatusCode = 3; // Đang thi công
      if (tinhTrangQTGiaiDoan2.includes('Đã quyết toán')) {
        currentStatusCode = 9; // Đã kết thúc
      } else if (tinhTrangQTGiaiDoan2.includes('Đang quyêt toán') || tinhTrangQTGiaiDoan2.includes('nghiệm thu hoàn thành')) {
        currentStatusCode = 5; // Bàn giao chưa quyết toán
      } else if (thoiGianHoanThanh.toLowerCase().includes('chậm tiến độ')) {
        currentStatusCode = 8; // Xử lý tài chính / chậm tiến độ
      }

      projectsToUpsert.push({
        project_id: pId,
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
        progress: progressRatio * 100, // Convert decimal ratio to percentage (e.g. 0.89 -> 89)
        project_management: {
          ban_tiep_nhan: banQLDATiepNhan || null,
          thoi_diem_ban_giao: thoiDiemBanGiao || null,
          ho_so_ban_giao: hoSoBanGiao || null,
          gia_tri_khoi_luong_ban_giao: klThucHienBanGiao,
        },
        project_status_info: {
          ton_tai_vuong_mac_ban_giao: tonTaiBanGiao || null,
          tinh_trang_quyet_toan_sau_ban_giao: tinhTrangQTGiaiDoan2 || null,
          validation_errors: rowErrors.map((e: any) => ({ type: e.type, detail: e.detail })),
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

      // Kế hoạch vốn 2025 (Kỳ trước bàn giao)
      capitalPlansToUpsert.push({
        plan_id: `CP_${pId}_2025`,
        project_id: pId,
        year: 2025,
        amount: khvDaBoTriTong,
        disbursed_amount: luyKeGiaiNgan,
        luy_ke_nghiem_thu: luyKeNghiemThu,
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
        const giaiNganTrongKy = luyKeGiaiNganG2Tong - luyKeGiaiNgan; // Giải ngân thực tế giai đoạn sau bàn giao
        capitalPlansToUpsert.push({
          plan_id: `CP_${pId}_2026`,
          project_id: pId,
          year: 2026,
          amount: khVonBanGiaoTong + khVonDieuChinhBoSung,
          disbursed_amount: luyKeGiaiNganG2Tong,
          luy_ke_nghiem_thu: luyKeNghiemThuG2Tong,
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

        // Tạo giao dịch giải ngân thực tế cho năm 2026 (số giải ngân tăng thêm)
        if (giaiNganTrongKy > 0) {
          disbursementsToInsert.push({
            disbursement_id: `DISB_${pId}_2026`,
            project_id: pId,
            capital_plan_id: `CP_${pId}_2026`,
            amount: giaiNganTrongKy,
            date: thoiDiemBanGiao || '2026-03-31',
            status: 'Completed',
            form_type: 'payment',
            created_at: new Date().toISOString()
          });
        }
      }
    });
  }

  // Khử trùng lặp an toàn
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

  console.log('\n--- TỔNG HỢP DỮ LIỆU SẼ IMPORT ---');
  console.log(`- Tổng số dự án cần ghi (Upsert): ${finalProjects.length}`);
  console.log(`- Tổng số kế hoạch vốn cần ghi (Upsert): ${finalCapitalPlans.length}`);
  console.log(`- Tổng số giao dịch giải ngân cần tạo (Upsert): ${finalDisbursements.length}`);

  const errorTaggedProjectsCount = finalProjects.filter(p => p.project_status_info?.validation_errors?.length > 0).length;
  console.log(`- Số dự án sẽ bị gắn cờ cảnh báo lỗi số liệu: ${errorTaggedProjectsCount}`);

  if (isDryRun) {
    console.log('\n--- XEM TRƯỚC BẢN GHI ĐẦU TIÊN (PREVIEW) ---');
    console.log('Project Record:', JSON.stringify(finalProjects[0], null, 2));
    console.log('Capital Plan Record:', JSON.stringify(finalCapitalPlans[0], null, 2));
    if (finalDisbursements.length > 0) {
      console.log('Disbursement Record:', JSON.stringify(finalDisbursements[0], null, 2));
    }
    console.log('\n❌ Đang ở chế độ --dry-run. Database không bị thay đổi.');
    return;
  }

  // --- LIVE WRITE TO DATABASE (UPSERT / OVERWRITE) ---
  console.log('\n--- ĐANG GHI ĐÈ DỮ LIỆU VÀO DATABASE SUPABASE ---');

  const batchSize = 100;

  // Step 1: Batch upsert Projects
  console.log(`💾 Đang ghi đè các dự án (${finalProjects.length} bản ghi)...`);
  for (let idx = 0; idx < finalProjects.length; idx += batchSize) {
    const batch = finalProjects.slice(idx, idx + batchSize);
    const { error } = await supabase.from('projects').upsert(batch);
    if (error) {
      console.error(`❌ Lỗi ghi batch dự án ${idx / batchSize + 1}:`, error);
      process.exit(1);
    }
    console.log(`   Đã ghi xong project batch ${idx / batchSize + 1}`);
  }

  // Step 2: Batch upsert Capital Plans
  console.log(`💾 Đang ghi đè kế hoạch vốn (${finalCapitalPlans.length} bản ghi)...`);
  for (let idx = 0; idx < finalCapitalPlans.length; idx += batchSize) {
    const batch = finalCapitalPlans.slice(idx, idx + batchSize);
    const { error } = await supabase.from('capital_plans').upsert(batch);
    if (error) {
      console.error(`❌ Lỗi ghi batch kế hoạch vốn ${idx / batchSize + 1}:`, error);
      process.exit(1);
    }
    console.log(`   Đã ghi xong capital_plans batch ${idx / batchSize + 1}`);
  }

  // Step 3: Batch upsert Disbursements
  if (finalDisbursements.length > 0) {
    console.log(`💾 Đang ghi đè lịch sử giải ngân (${finalDisbursements.length} bản ghi)...`);
    for (let idx = 0; idx < finalDisbursements.length; idx += batchSize) {
      const batch = finalDisbursements.slice(idx, idx + batchSize);
      const { error } = await supabase.from('disbursements').upsert(batch);
      if (error) {
        console.error(`❌ Lỗi ghi batch giải ngân ${idx / batchSize + 1}:`, error);
        process.exit(1);
      }
      console.log(`   Đã ghi xong disbursements batch ${idx / batchSize + 1}`);
    }
  }

  console.log('\n🌟 ĐÃ IMPORT VÀ GHI ĐÈ DỮ LIỆU THÀNH CÔNG LÊN DATABASE SUPABASE! 🌟');
}

main().catch(err => {
  console.error('💥 LỖI CRITICAL HỆ THỐNG:', err);
  process.exit(1);
});
