/**
 * Xuất Báo Cáo Đấu Thầu — Biểu 01A (PL2)
 * 
 * Biểu tổng hợp kết quả lựa chọn nhà thầu
 * Các gói thầu thuộc dự án đầu tư theo Điểm a Khoản 1 Điều 2 Luật Đấu Thầu
 * 
 * Đơn vị: Triệu đồng
 */

import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { BiddingPackage } from '../types/bidding.types';
import type { Project } from '../types/project.types';

// ===== Constants =====

/** Lĩnh vực đấu thầu */
const FIELDS = [
  { key: 'NonConsultancy', label: '1. Phi tư vấn', dbValue: 'Phi tư vấn' },
  { key: 'Consultancy', label: '2. Tư vấn', dbValue: 'Tư vấn' },
  { key: 'Goods', label: '3. Mua sắm hàng hóa', dbValue: 'Hàng hóa' },
  { key: 'Construction', label: '4. Xây lắp', dbValue: 'Xây lắp' },
  { key: 'Mixed', label: '5. Hỗn hợp', dbValue: 'Hỗn hợp' },
] as const;

/** Hình thức LCNT */
const SELECTION_METHODS = [
  { key: 'OpenBidding', label: '1. Đấu thầu rộng rãi', dbValue: 'Đấu thầu rộng rãi', hasScope: true, hasQM: true },
  { key: 'LimitedBidding', label: '2. Đấu thầu hạn chế', dbValue: 'Đấu thầu hạn chế', hasScope: true, hasQM: true },
  { key: 'Appointed', label: '3. Chỉ định thầu', dbValue: 'Chỉ định thầu', hasScope: true, hasQM: false },
  { key: 'AppointedShort', label: '3. Chỉ định thầu', dbValue: 'Chỉ định thầu rút gọn', hasScope: true, hasQM: false },
  { key: 'CompetitiveShopping', label: '4. Chào hàng cạnh tranh', dbValue: 'Chào hàng cạnh tranh', hasScope: true, hasQM: true },
  { key: 'DirectProcurement', label: '5. Mua sắm trực tiếp', dbValue: 'Mua sắm trực tiếp', hasScope: true, hasQM: false },
  { key: 'SelfExecution', label: '6. Tự thực hiện', dbValue: 'Tự thực hiện', hasScope: false, hasQM: false },
  { key: 'Special', label: '7. Lựa chọn nhà thầu trong trường hợp đặc biệt', dbValue: 'Trường hợp đặc biệt', hasScope: true, hasQM: false },
  { key: 'CommunityParticipation', label: '8. Tham gia thực hiện của cộng đồng', dbValue: 'Tham gia thực hiện của cộng đồng', hasScope: false, hasQM: false },
  { key: 'PriceNegotiation', label: '9. Đàm phán giá', dbValue: 'Đàm phán giá', hasScope: false, hasQM: false },
] as const;

/** Nhóm dự án — 4 cột nhóm + 1 cột cộng */
const PROJECT_GROUPS = [
  { key: 'QN', label: 'Dự án quan trọng quốc gia (1)' },
  { key: 'A', label: 'Dự án nhóm A (2)' },
  { key: 'B', label: 'Dự án nhóm B (3)' },
  { key: 'C', label: 'Dự án nhóm C (4)' },
] as const;

// ===== Types =====

interface AggregatedData {
  count: number;        // Tổng số gói thầu
  packageValue: number; // Tổng giá gói thầu (triệu đồng)
  winningValue: number; // Tổng giá trúng thầu (triệu đồng)
  difference: number;   // Chênh lệch
}

type GroupKey = 'QN' | 'A' | 'B' | 'C';
type BidTypeKey = 'KQM' | 'QM'; // Không qua mạng / Qua mạng(Online)

// ===== Aggregation Logic =====

function emptyAgg(): AggregatedData {
  return { count: 0, packageValue: 0, winningValue: 0, difference: 0 };
}

function addToAgg(agg: AggregatedData, pkg: BiddingPackage): void {
  agg.count += 1;
  const priceMillion = (pkg.Price || 0) / 1_000_000;
  const winMillion = (pkg.WinningPrice || 0) / 1_000_000;
  agg.packageValue += priceMillion;
  agg.winningValue += winMillion;
  agg.difference += (priceMillion - winMillion);
}

function mergeAgg(a: AggregatedData, b: AggregatedData): AggregatedData {
  return {
    count: a.count + b.count,
    packageValue: a.packageValue + b.packageValue,
    winningValue: a.winningValue + b.winningValue,
    difference: a.difference + b.difference,
  };
}

/**
 * Phân loại và tổng hợp dữ liệu gói thầu theo cấu trúc Biểu 01A
 */
export function aggregateBiddingData(
  packages: BiddingPackage[],
  projects: Project[]
): {
  byField: Record<string, Record<GroupKey, Record<BidTypeKey, AggregatedData>>>;
  byMethod: Record<string, Record<string, Record<GroupKey, AggregatedData>>>;
} {
  const projectMap = new Map(projects.map(p => [p.ProjectID, p]));

  // Chỉ tính gói thầu đã có kết quả
  const awardedPackages = packages.filter(p => (p.Status === 'Execution' || p.Status === 'Completed') && p.WinningPrice != null);

  // === I. Theo lĩnh vực ===
  const byField: Record<string, Record<GroupKey, Record<BidTypeKey, AggregatedData>>> = {};
  for (const f of FIELDS) {
    byField[f.key] = {
      QN: { KQM: emptyAgg(), QM: emptyAgg() },
      A: { KQM: emptyAgg(), QM: emptyAgg() },
      B: { KQM: emptyAgg(), QM: emptyAgg() },
      C: { KQM: emptyAgg(), QM: emptyAgg() },
    };
  }

  // === II. Theo hình thức LCNT ===
  const byMethod: Record<string, Record<string, Record<GroupKey, AggregatedData>>> = {};
  for (const m of SELECTION_METHODS) {
    byMethod[m.key] = {};
    if (m.hasScope) {
      byMethod[m.key]['Domestic_KQM'] = { QN: emptyAgg(), A: emptyAgg(), B: emptyAgg(), C: emptyAgg() };
      if (m.hasQM) {
        byMethod[m.key]['Domestic_QM'] = { QN: emptyAgg(), A: emptyAgg(), B: emptyAgg(), C: emptyAgg() };
      }
      byMethod[m.key]['International_KQM'] = { QN: emptyAgg(), A: emptyAgg(), B: emptyAgg(), C: emptyAgg() };
    } else {
      byMethod[m.key]['Domestic_KQM'] = { QN: emptyAgg(), A: emptyAgg(), B: emptyAgg(), C: emptyAgg() };
    }
  }

  for (const pkg of awardedPackages) {
    const project = projectMap.get(pkg.ProjectID);
    if (!project) continue;

    const groupCode = (project.GroupCode || 'C') as GroupKey;
    const bidType: BidTypeKey = pkg.BidType === 'Online' ? 'QM' : 'KQM';
    const scope = pkg.BiddingScope || 'Domestic';

    // I. Lĩnh vực
    const matchedField = FIELDS.find(f => f.dbValue === (pkg.Field as unknown as string));
    const fieldKey = matchedField ? matchedField.key : 'Construction';
    if (byField[fieldKey]) {
      addToAgg(byField[fieldKey][groupCode][bidType], pkg);
    }

    // II. Hình thức LCNT
    const matchedMethod = SELECTION_METHODS.find(m => m.dbValue === (pkg.SelectionMethod as unknown as string));
    const methodKey = matchedMethod ? matchedMethod.key : 'OpenBidding';
    if (byMethod[methodKey]) {
      const scopeKey = `${scope}_${bidType}`;
      if (byMethod[methodKey][scopeKey]) {
        addToAgg(byMethod[methodKey][scopeKey][groupCode], pkg);
      } else {
        // Fallback: KQM trong nước
        const fallback = `Domestic_KQM`;
        if (byMethod[methodKey][fallback]) {
          addToAgg(byMethod[methodKey][fallback][groupCode], pkg);
        }
      }
    }
  }

  return { byField, byMethod };
}

// ===== Excel Generation (ExcelJS) =====

function getBorder() {
  return {
    top: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: 'FF000000' } },
    left: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: 'FF000000' } },
    bottom: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: 'FF000000' } },
    right: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: 'FF000000' } }
  };
}

function writeAggRow(
  ws: ExcelJS.Worksheet,
  row: number,
  startCol: number,
  groups: GroupKey[],
  getData: (g: GroupKey) => AggregatedData,
  isBold = false
): void {
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    const agg = getData(g);
    const col = startCol + gi * 4;
    
    for (let i = 0; i < 4; i++) {
        const cell = ws.getCell(row, col + i);
        cell.border = getBorder();
        cell.font = { name: 'Times New Roman', size: 11, bold: isBold };
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        
        if (i === 0) cell.value = agg.count || '';
        else if (i === 1) cell.value = agg.packageValue ? Math.round(agg.packageValue) : '';
        else if (i === 2) cell.value = agg.winningValue ? Math.round(agg.winningValue) : '';
        else if (i === 3) cell.value = agg.difference ? Math.round(agg.difference) : 0;

        if (i > 0 && cell.value !== '') cell.numFmt = '#,##0';
    }
  }

  // Cộng (1+2+3+4)
  const totalCol = startCol + groups.length * 4;
  const total = groups.reduce((acc, g) => mergeAgg(acc, getData(g)), emptyAgg());
  
  for (let i = 0; i < 4; i++) {
      const cell = ws.getCell(row, totalCol + i);
      cell.border = getBorder();
      cell.font = { name: 'Times New Roman', size: 11, bold: isBold };
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      
      if (i === 0) cell.value = total.count || '';
      else if (i === 1) cell.value = total.packageValue ? Math.round(total.packageValue) : '';
      else if (i === 2) cell.value = total.winningValue ? Math.round(total.winningValue) : '';
      else if (i === 3) cell.value = total.difference ? Math.round(total.difference) : 0;

      if (i > 0 && cell.value !== '') cell.numFmt = '#,##0';
  }
}

function styleCell(ws: ExcelJS.Worksheet, row: number, col: number, text: string, bold = false, align: ExcelJS.Alignment['horizontal'] = 'left') {
    const cell = ws.getCell(row, col);
    cell.value = text;
    cell.border = getBorder();
    cell.font = { name: 'Times New Roman', size: 11, bold };
    cell.alignment = { vertical: 'middle', horizontal: align, wrapText: true };
}

/**
 * Xuất Excel Biểu 01A — Tổng hợp kết quả LCNT bằng exceljs
 */
export async function exportBiddingReportBieu01A(
  packages: BiddingPackage[],
  projects: Project[],
  reportYear: number = new Date().getFullYear(),
  unitName: string = 'Ban QLDA Đầu tư xây dựng công trình Dân dụng và Công nghiệp TP.HCM'
): Promise<void> {
  const { byField, byMethod } = aggregateBiddingData(packages, projects);
  const groups: GroupKey[] = ['QN', 'A', 'B', 'C'];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Bieu 01A', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  // Default font
  ws.columns = [
      { width: 45 }, // A: Lĩnh vực/Hình thức
      { width: 14 }, // B: Scope
      { width: 8 },  // C: KQM/QM
      ...Array(20).fill({ width: 12 }), // D to W: Data columns
  ];

  // === Header rows ===
  ws.getCell('A1').value = 'BIỂU SỐ 01A';
  ws.getCell('A1').font = { name: 'Times New Roman', size: 12, bold: true };
  
  ws.getCell('A3').value = 'BIỂU TỔNG HỢP KẾT QUẢ LỰA CHỌN NHÀ THẦU';
  ws.getCell('A3').font = { name: 'Times New Roman', size: 14, bold: true };
  ws.getCell('A3').alignment = { horizontal: 'center' };
  ws.mergeCells(`A3:W3`);

  ws.getCell('A4').value = `CÁC GÓI THẦU THUỘC DỰ ÁN ĐẦU TƯ THEO QUY ĐỊNH TẠI ĐIỂM A KHOẢN 1 ĐIỀU 2 LUẬT ĐẤU THẦU (Đính kèm Báo cáo ngày ${new Date().toLocaleDateString('vi-VN')} của ${unitName})`;
  ws.getCell('A4').font = { name: 'Times New Roman', size: 11, italic: true };
  ws.getCell('A4').alignment = { horizontal: 'center' };
  ws.mergeCells(`A4:W4`);

  ws.getCell('T5').value = 'Đơn vị: Triệu đồng';
  ws.getCell('T5').font = { name: 'Times New Roman', size: 11, italic: true };
  ws.getCell('T5').alignment = { horizontal: 'right' };
  ws.mergeCells(`T5:W5`);

  // Column headers (Row 6-7)
  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF1DE' } }; // Light green

  const cellA6 = ws.getCell('A6');
  cellA6.value = 'LĨNH VỰC VÀ HÌNH THỨC';
  cellA6.font = { name: 'Times New Roman', size: 11, bold: true };
  cellA6.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cellA6.border = getBorder();
  cellA6.fill = headerFill;
  ws.mergeCells('A6:C7');
  
  const startCol = 4; // Column D (1-indexed)
  for (let gi = 0; gi < PROJECT_GROUPS.length; gi++) {
    const col = startCol + gi * 4;
    const groupCell = ws.getCell(6, col);
    groupCell.value = PROJECT_GROUPS[gi].label;
    groupCell.font = { name: 'Times New Roman', size: 11, bold: true };
    groupCell.alignment = { vertical: 'middle', horizontal: 'center' };
    groupCell.border = getBorder();
    groupCell.fill = headerFill;
    ws.mergeCells(6, col, 6, col + 3);

    // Sub headers
    const subCols = ['Tổng số gói thầu', 'Tổng giá gói thầu', 'Tổng giá trúng thầu', 'Chênh lệch'];
    for (let si = 0; si < 4; si++) {
        const sub = ws.getCell(7, col + si);
        sub.value = subCols[si];
        sub.font = { name: 'Times New Roman', size: 10, bold: true };
        sub.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        sub.border = getBorder();
        sub.fill = headerFill;
    }
  }

  // Cột Cộng
  const totalStartCol = startCol + 4 * 4;
  const totalGroupCell = ws.getCell(6, totalStartCol);
  totalGroupCell.value = 'Cộng (1+2+3+4)';
  totalGroupCell.font = { name: 'Times New Roman', size: 11, bold: true };
  totalGroupCell.alignment = { vertical: 'middle', horizontal: 'center' };
  totalGroupCell.border = getBorder();
  totalGroupCell.fill = headerFill;
  ws.mergeCells(6, totalStartCol, 6, totalStartCol + 3);

  const subCols = ['Tổng số gói thầu', 'Tổng giá gói thầu', 'Tổng giá trúng thầu', 'Chênh lệch'];
  for (let si = 0; si < 4; si++) {
      const sub = ws.getCell(7, totalStartCol + si);
      sub.value = subCols[si];
      sub.font = { name: 'Times New Roman', size: 10, bold: true };
      sub.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      sub.border = getBorder();
      sub.fill = headerFill;
  }

  // Set row heights for headers
  ws.getRow(6).height = 25;
  ws.getRow(7).height = 40;

  // === I. THEO LĨNH VỰC ĐẤU THẦU ===
  let currentRow = 8;
  styleCell(ws, currentRow, 1, 'I. THEO LĨNH VỰC ĐẤU THẦU', true);
  ws.mergeCells(currentRow, 1, currentRow, 3);
  for(let c=4; c<=totalStartCol+3; c++) { const cell = ws.getCell(currentRow, c); cell.border = getBorder(); cell.fill = { type: 'pattern', pattern: 'solid', fgColor:{argb:'FFF2F2F2'}}; }
  currentRow++;

  for (const field of FIELDS) {
    const data = byField[field.key];
    // KQM row
    styleCell(ws, currentRow, 1, field.label, false);
    ws.mergeCells(currentRow, 1, currentRow + 1, 1);
    
    styleCell(ws, currentRow, 2, '', false);
    ws.mergeCells(currentRow, 2, currentRow + 1, 2);

    styleCell(ws, currentRow, 3, 'KQM', false, 'center');
    writeAggRow(ws, currentRow, startCol, groups, g => data[g].KQM);
    currentRow++;

    // QM row
    // merged columns 1 and 2 already handle borders for these, but we need to set C
    styleCell(ws, currentRow, 3, 'QM', false, 'center');
    writeAggRow(ws, currentRow, startCol, groups, g => data[g].QM);
    currentRow++;
  }

  // Tổng cộng I
  styleCell(ws, currentRow, 1, 'Tổng cộng I', true);
  ws.mergeCells(currentRow, 1, currentRow + 2, 1);

  styleCell(ws, currentRow, 2, '', false);
  ws.mergeCells(currentRow, 2, currentRow + 2, 2);

  styleCell(ws, currentRow, 3, '', false); // blank center
  writeAggRow(ws, currentRow, startCol, groups, g => {
    let total = emptyAgg();
    for (const f of FIELDS) {
      total = mergeAgg(total, mergeAgg(byField[f.key][g].KQM, byField[f.key][g].QM));
    }
    return total;
  }, true);
  currentRow++;

  // Tổng cộng I - KQM
  styleCell(ws, currentRow, 3, 'KQM', true, 'center');
  writeAggRow(ws, currentRow, startCol, groups, g => {
    let total = emptyAgg();
    for (const f of FIELDS) total = mergeAgg(total, byField[f.key][g].KQM);
    return total;
  }, true);
  currentRow++;

  // Tổng cộng I - QM
  styleCell(ws, currentRow, 3, 'QM', true, 'center');
  writeAggRow(ws, currentRow, startCol, groups, g => {
    let total = emptyAgg();
    for (const f of FIELDS) total = mergeAgg(total, byField[f.key][g].QM);
    return total;
  }, true);
  currentRow++;

  // === II. THEO HÌNH THỨC LỰA CHỌN NHÀ THẦU ===
  styleCell(ws, currentRow, 1, 'II. THEO HÌNH THỨC LỰA CHỌN NHÀ THẦU', true);
  ws.mergeCells(currentRow, 1, currentRow, 3);
  for(let c=4; c<=totalStartCol+3; c++) { const cell = ws.getCell(currentRow, c); cell.border = getBorder(); cell.fill = { type: 'pattern', pattern: 'solid', fgColor:{argb:'FFF2F2F2'}}; }
  currentRow++;

  // Chỉ xuất các unique label (tránh duplicate dòng cho Appointed vs AppointedShort)
  const uniqueMethods = Array.from(new Set(SELECTION_METHODS.map(m => m.key))).map(k => SELECTION_METHODS.find(m => m.key === k)!);

  for (const method of uniqueMethods) {
    const data = byMethod[method.key];
    if (!data) continue;
    
    if (method.hasScope) {
      const rsSpan = method.hasQM ? 3 : 2;
      styleCell(ws, currentRow, 1, method.label, false);
      ws.mergeCells(currentRow, 1, currentRow + rsSpan - 1, 1);
      
      // Trong nước - KQM
      styleCell(ws, currentRow, 2, 'Trong nước', false);
      ws.mergeCells(currentRow, 2, currentRow + (method.hasQM ? 1 : 0), 2);
      
      styleCell(ws, currentRow, 3, 'KQM', false, 'center');
      writeAggRow(ws, currentRow, startCol, groups, g => data['Domestic_KQM']?.[g] || emptyAgg());
      currentRow++;

      // Trong nước - QM
      if (method.hasQM && data['Domestic_QM']) {
        styleCell(ws, currentRow, 3, 'QM', false, 'center');
        writeAggRow(ws, currentRow, startCol, groups, g => data['Domestic_QM']?.[g] || emptyAgg());
        currentRow++;
      }

      // Quốc tế - KQM
      styleCell(ws, currentRow, 2, 'Quốc tế', false);
      styleCell(ws, currentRow, 3, 'KQM', false, 'center');
      writeAggRow(ws, currentRow, startCol, groups, g => data['International_KQM']?.[g] || emptyAgg());
      currentRow++;
    } else {
      // Chỉ có Trong nước - KQM
      styleCell(ws, currentRow, 1, method.label, false);
      styleCell(ws, currentRow, 2, 'Trong nước', false);
      styleCell(ws, currentRow, 3, 'KQM', false, 'center');
      writeAggRow(ws, currentRow, startCol, groups, g => data['Domestic_KQM']?.[g] || emptyAgg());
      currentRow++;
    }
  }

  // Footer
  currentRow += 2;
  const dateCell = ws.getCell(currentRow, 16); // Column P (approx)
  dateCell.value = `TP.HCM, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${reportYear}`;
  dateCell.font = { name: 'Times New Roman', size: 11, italic: true };
  dateCell.alignment = { horizontal: 'center' };
  ws.mergeCells(currentRow, 16, currentRow, totalStartCol + 3);
  currentRow++;
  
  const signerCell = ws.getCell(currentRow, 16);
  signerCell.value = 'Người báo cáo';
  signerCell.font = { name: 'Times New Roman', size: 11, bold: true };
  signerCell.alignment = { horizontal: 'center' };
  ws.mergeCells(currentRow, 16, currentRow, totalStartCol + 3);
  currentRow++;
  
  const subSignerCell = ws.getCell(currentRow, 16);
  subSignerCell.value = '(Ký, ghi rõ họ tên)';
  subSignerCell.font = { name: 'Times New Roman', size: 11, italic: true };
  subSignerCell.alignment = { horizontal: 'center' };
  ws.mergeCells(currentRow, 16, currentRow, totalStartCol + 3);

  // Download logic (Browser)
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `Bieu01A_BC_Dau_thau_${reportYear}.xlsx`;
  saveAs(blob, fileName);
}
