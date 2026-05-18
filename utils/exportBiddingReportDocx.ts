/**
 * Báo cáo hoạt động đấu thầu bằng DOCX
 * 
 * Aggregation logic sửa key tiếng Việt.
 */

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, PageOrientation, BorderStyle, WidthType, ShadingType, VerticalAlign } from "docx";
import { saveAs } from "file-saver";
import type { BiddingPackage } from "../types/bidding.types";
import type { Project, ProjectGroup } from "../types/project.types";

const FIELDS = [
  { key: 'NonConsultancy', label: '1. Phi tư vấn', dbValue: 'Phi tư vấn' },
  { key: 'Consultancy', label: '2. Tư vấn', dbValue: 'Tư vấn' },
  { key: 'Goods', label: '3. Mua sắm hàng hóa', dbValue: 'Hàng hóa' },
  { key: 'Construction', label: '4. Xây lắp', dbValue: 'Xây lắp' },
  { key: 'Mixed', label: '5. Hỗn hợp', dbValue: 'Hỗn hợp' },
] as const;

const SELECTION_METHODS = [
  { key: 'OpenBidding', label: '1. Đấu thầu rộng rãi', dbValue: 'Đấu thầu rộng rãi', hasScope: true, hasQM: true },
  { key: 'LimitedBidding', label: '2. Đấu thầu hạn chế', dbValue: 'Đấu thầu hạn chế', hasScope: true, hasQM: true },
  { key: 'Appointed', label: '3. Chỉ định thầu', dbValue: 'Chỉ định thầu', hasScope: true, hasQM: false },
  // Map thêm Cho phép 'Chỉ định thầu rút gọn' vào 'Chỉ định thầu'
  { key: 'AppointedShort', label: '3. Chỉ định thầu', dbValue: 'Chỉ định thầu rút gọn', hasScope: true, hasQM: false },
  { key: 'CompetitiveShopping', label: '4. Chào hàng cạnh tranh', dbValue: 'Chào hàng cạnh tranh', hasScope: true, hasQM: true },
  { key: 'DirectProcurement', label: '5. Mua sắm trực tiếp', dbValue: 'Mua sắm trực tiếp', hasScope: true, hasQM: false },
  { key: 'SelfExecution', label: '6. Tự thực hiện', dbValue: 'Tự thực hiện', hasScope: false, hasQM: false },
  { key: 'Special', label: '7. Lựa chọn nhà thầu trong trường hợp đặc biệt', dbValue: 'Trường hợp đặc biệt', hasScope: true, hasQM: false },
  { key: 'CommunityParticipation', label: '8. Tham gia thực hiện của cộng đồng', dbValue: 'Tham gia thực hiện của cộng đồng', hasScope: false, hasQM: false },
  { key: 'PriceNegotiation', label: '9. Đàm phán giá', dbValue: 'Đàm phán giá', hasScope: false, hasQM: false },
] as const;

const PROJECT_GROUPS = [
  { key: 'QN', label: 'Dự án quan trọng quốc gia (1)' },
  { key: 'A', label: 'Dự án nhóm A (2)' },
  { key: 'B', label: 'Dự án nhóm B (3)' },
  { key: 'C', label: 'Dự án nhóm C (4)' },
] as const;

interface AggregatedData {
  count: number;
  packageValue: number;
  winningValue: number;
  difference: number;
}

type GroupKey = 'QN' | 'A' | 'B' | 'C';
type BidTypeKey = 'KQM' | 'QM';

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

export function aggregateBiddingData(packages: BiddingPackage[], projects: Project[]) {
  const projectMap = new Map(projects.map(p => [p.ProjectID, p]));
  const awardedPackages = packages.filter(p => (p.Status === 'Execution' || p.Status === 'Completed') && p.WinningPrice != null);

  const byField: Record<string, Record<GroupKey, Record<BidTypeKey, AggregatedData>>> = {};
  for (const f of FIELDS) {
    byField[f.key] = {
      QN: { KQM: emptyAgg(), QM: emptyAgg() },
      A: { KQM: emptyAgg(), QM: emptyAgg() },
      B: { KQM: emptyAgg(), QM: emptyAgg() },
      C: { KQM: emptyAgg(), QM: emptyAgg() },
    };
  }

  const byMethod: Record<string, Record<string, Record<GroupKey, AggregatedData>>> = {};
  for (const m of SELECTION_METHODS) {
    if (!byMethod[m.key]) byMethod[m.key] = {};
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
    const bidType: BidTypeKey = (pkg.BidType === 'Online' || pkg.BidType === ('Đấu thầu qua mạng' as any)) ? 'QM' : 'KQM';
    const scope = pkg.BiddingScope || 'Domestic';

    // 1. Map Field
    const matchedField = FIELDS.find(f => f.dbValue === (pkg.Field as unknown as string));
    const fieldKey = matchedField ? matchedField.key : 'Construction';
    addToAgg(byField[fieldKey][groupCode][bidType], pkg);

    // 2. Map Selection Method
    const matchedMethod = SELECTION_METHODS.find(m => m.dbValue === (pkg.SelectionMethod as unknown as string));
    const methodKey = matchedMethod ? matchedMethod.key : 'OpenBidding';
    
    if (byMethod[methodKey]) {
      const scopeKey = `${scope}_${bidType}`;
      if (byMethod[methodKey][scopeKey]) {
        addToAgg(byMethod[methodKey][scopeKey][groupCode], pkg);
      } else {
        const fallback = 'Domestic_KQM';
        if (byMethod[methodKey][fallback]) {
          addToAgg(byMethod[methodKey][fallback][groupCode], pkg);
        }
      }
    }
  }

  return { byField, byMethod };
}

// DOCX Render Helpers
const tableBorder = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

function createCell(text: string | number, widthDXA: number, isHeader = false, bold = false) {
  return new TableCell({
    borders: cellBorders,
    width: { size: widthDXA, type: WidthType.DXA },
    shading: isHeader ? { fill: "E0E0E0", type: ShadingType.CLEAR } : { fill: "FFFFFF", type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    children: [
      new Paragraph({
        alignment: typeof text === 'number' ? AlignmentType.RIGHT : (isHeader ? AlignmentType.CENTER : AlignmentType.LEFT),
        children: [new TextRun({ text: text.toString(), bold: bold || isHeader, font: "Arial", size: 16 })]
      })
    ]
  });
}

function createAggCells(dataFn: (g: GroupKey) => AggregatedData, isBold = false) {
  const groups: GroupKey[] = ['QN', 'A', 'B', 'C'];
  const cells: TableCell[] = [];
  let total = emptyAgg();
  
  for (const g of groups) {
    const agg = dataFn(g);
    total = mergeAgg(total, agg);
    cells.push(createCell(agg.count || 0, 804, false, isBold));
    cells.push(createCell(agg.count ? Math.round(agg.packageValue) : 0, 804, false, isBold));
    cells.push(createCell(agg.count ? Math.round(agg.winningValue) : 0, 804, false, isBold));
    cells.push(createCell(agg.count ? Math.round(agg.difference) : 0, 804, false, isBold));
  }
  
  // Tổng cộng
  cells.push(createCell(total.count || 0, 804, false, true));
  cells.push(createCell(total.count ? Math.round(total.packageValue) : 0, 804, false, true));
  cells.push(createCell(total.count ? Math.round(total.winningValue) : 0, 804, false, true));
  cells.push(createCell(total.count ? Math.round(total.difference) : 0, 804, false, true));
  
  return cells;
}

export async function exportBiddingReportDocxBieu01A(
  packages: BiddingPackage[],
  projects: Project[],
  reportYear: number = new Date().getFullYear(),
  unitName: string = 'Ban QLDA Đầu tư xây dựng công trình Dân dụng và Công nghiệp TP.HCM'
) {
  const { byField, byMethod } = aggregateBiddingData(packages, projects);
  const groups: GroupKey[] = ['QN', 'A', 'B', 'C'];

  // Cấu hình mảng widths
  // 0: Lĩnh vực, 1: Phạm vi, 2: KQM/QM => 3000, 900, 900
  // 20 cột data => 804 each
  const totalCols = 23;
  const colWidths = [3000, 900, 900, ...Array(20).fill(804)];

  const tableRows: TableRow[] = [];

  // Header 1: Nhóm DA
  tableRows.push(new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: cellBorders, width: { size: 4800, type: WidthType.DXA }, columnSpan: 3, verticalAlign: VerticalAlign.CENTER,
        shading: { fill: "D9E2F3", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "LĨNH VỰC VÀ HÌNH THỨC", bold: true, font: "Arial", size: 16 })]})]
      }),
      // QN
      new TableCell({
        borders: cellBorders, width: { size: 3216, type: WidthType.DXA }, columnSpan: 4, verticalAlign: VerticalAlign.CENTER,
        shading: { fill: "D9E2F3", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Dự án quan trọng QG", bold: true, font: "Arial", size: 16 })]})]
      }),
      // A
      new TableCell({
        borders: cellBorders, width: { size: 3216, type: WidthType.DXA }, columnSpan: 4, verticalAlign: VerticalAlign.CENTER,
        shading: { fill: "D9E2F3", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Dự án nhóm A", bold: true, font: "Arial", size: 16 })]})]
      }),
      // B
      new TableCell({
        borders: cellBorders, width: { size: 3216, type: WidthType.DXA }, columnSpan: 4, verticalAlign: VerticalAlign.CENTER,
        shading: { fill: "D9E2F3", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Dự án nhóm B", bold: true, font: "Arial", size: 16 })]})]
      }),
      // C
      new TableCell({
        borders: cellBorders, width: { size: 3216, type: WidthType.DXA }, columnSpan: 4, verticalAlign: VerticalAlign.CENTER,
        shading: { fill: "D9E2F3", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Dự án nhóm C", bold: true, font: "Arial", size: 16 })]})]
      }),
      // Total
      new TableCell({
        borders: cellBorders, width: { size: 3216, type: WidthType.DXA }, columnSpan: 4, verticalAlign: VerticalAlign.CENTER,
        shading: { fill: "D9E2F3", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Cộng (1+2+3+4)", bold: true, font: "Arial", size: 16 })]})]
      }),
    ]
  }));

  // Header 2: Sub-cols
  const subCols = ["Số gói", "Giá gói", "Trúng thầu", "Chênh lệch"];
  const subHeaders = [
    new TableCell({ borders: cellBorders, width: { size: 4800, type: WidthType.DXA }, columnSpan: 3, children: [] })
  ];
  for(let i = 0; i < 5; i++) {
    for (const sc of subCols) {
      subHeaders.push(
        new TableCell({
          borders: cellBorders, width: { size: 804, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
          shading: { fill: "D9E2F3", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: sc, bold: true, font: "Arial", size: 14 })]})]
        })
      );
    }
  }
  tableRows.push(new TableRow({ tableHeader: true, children: subHeaders }));

  // I. THEO LĨNH VỰC
  tableRows.push(new TableRow({
    children: [
      new TableCell({ borders: cellBorders, width: { size: 4800, type: WidthType.DXA }, columnSpan: 3, children: [new Paragraph({ children: [new TextRun({ text: "I. THEO LĨNH VỰC", bold: true, font: "Arial", size: 16 })]})]}),
      ...Array(20).fill(null).map(() => createCell('', 804))
    ]
  }));

  for (const field of FIELDS) {
    const data = byField[field.key];
    tableRows.push(new TableRow({
      children: [
        new TableCell({ borders: cellBorders, width: { size: 3000, type: WidthType.DXA }, rowSpan: 2, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: field.label, font: "Arial", size: 16 })]})]}),
        new TableCell({ borders: cellBorders, width: { size: 900, type: WidthType.DXA }, rowSpan: 2, children: []}),
        createCell('KQM', 900, false, false),
        ...createAggCells(g => data[g].KQM)
      ]
    }));
    tableRows.push(new TableRow({
      children: [
        createCell('QM', 900, false, false),
        ...createAggCells(g => data[g].QM)
      ]
    }));
  }

  // Tổng cộng I
  tableRows.push(new TableRow({
    children: [
      new TableCell({ borders: cellBorders, width: { size: 3000, type: WidthType.DXA }, rowSpan: 3, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: "Tổng cộng I", bold: true, font: "Arial", size: 16 })]})]}),
      new TableCell({ borders: cellBorders, width: { size: 900, type: WidthType.DXA }, rowSpan: 3, children: []}),
      createCell('', 900, false, true),
      ...createAggCells(g => {
        let total = emptyAgg();
        for (const f of FIELDS) total = mergeAgg(total, mergeAgg(byField[f.key][g].KQM, byField[f.key][g].QM));
        return total;
      }, true)
    ]
  }));
  tableRows.push(new TableRow({
    children: [
      createCell('KQM', 900, false, true),
      ...createAggCells(g => {
        let total = emptyAgg();
        for (const f of FIELDS) total = mergeAgg(total, byField[f.key][g].KQM);
        return total;
      }, true)
    ]
  }));
  tableRows.push(new TableRow({
    children: [
      createCell('QM', 900, false, true),
      ...createAggCells(g => {
        let total = emptyAgg();
        for (const f of FIELDS) total = mergeAgg(total, byField[f.key][g].QM);
        return total;
      }, true)
    ]
  }));

  // II. THEO HÌNH THỨC
  tableRows.push(new TableRow({
    children: [
      new TableCell({ borders: cellBorders, width: { size: 4800, type: WidthType.DXA }, columnSpan: 3, children: [new Paragraph({ children: [new TextRun({ text: "II. THEO HÌNH THỨC", bold: true, font: "Arial", size: 16 })]})]}),
      ...Array(20).fill(null).map(() => createCell('', 804))
    ]
  }));

  // Chỉ map 1 unique phương thức để in dòng (tránh trùng)
  const uniqueMethods = Array.from(new Set(SELECTION_METHODS.map(m => m.key))).map(k => SELECTION_METHODS.find(m => m.key === k)!);

  for (const method of uniqueMethods) {
    const data = byMethod[method.key];
    if (!data) continue;
    
    if (method.hasScope) {
      const rsSpan = method.hasQM ? 3 : 2;
      tableRows.push(new TableRow({
        children: [
          new TableCell({ borders: cellBorders, width: { size: 3000, type: WidthType.DXA }, rowSpan: rsSpan, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: method.label, font: "Arial", size: 16 })]})]}),
          new TableCell({ borders: cellBorders, width: { size: 900, type: WidthType.DXA }, rowSpan: method.hasQM ? 2 : 1, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: "Trong nước", font: "Arial", size: 16 })]})]}),
          createCell('KQM', 900, false, false),
          ...createAggCells(g => data['Domestic_KQM']?.[g] || emptyAgg())
        ]
      }));
      if (method.hasQM && data['Domestic_QM']) {
        tableRows.push(new TableRow({
          children: [
            createCell('QM', 900, false, false),
            ...createAggCells(g => data['Domestic_QM']?.[g] || emptyAgg())
          ]
        }));
      }
      tableRows.push(new TableRow({
        children: [
          new TableCell({ borders: cellBorders, width: { size: 900, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: "Quốc tế", font: "Arial", size: 16 })]})]}),
          createCell('KQM', 900, false, false),
          ...createAggCells(g => data['International_KQM']?.[g] || emptyAgg())
        ]
      }));
    } else {
      tableRows.push(new TableRow({
        children: [
          new TableCell({ borders: cellBorders, width: { size: 3000, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: method.label, font: "Arial", size: 16 })]})]}),
          createCell('Trong nước', 900, false, false),
          createCell('KQM', 900, false, false),
          ...createAggCells(g => data['Domestic_KQM']?.[g] || emptyAgg())
        ]
      }));
    }
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 24, color: "000000" } } }
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1100, right: 1100, bottom: 1100, left: 1100 },
          size: { orientation: PageOrientation.LANDSCAPE, width: 23760, height: 16838 } // A3 Landscape size (297x420mm) ~ 16838x23760 dxa
        }
      },
      children: [
        new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: "BIỂU SỐ 01A", bold: true })] }),
        new Paragraph({ spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BIỂU TỔNG HỢP KẾT QUẢ LỰA CHỌN NHÀ THẦU", bold: true, size: 28 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Các gói thầu thuộc dự án đầu tư theo quy định tại Điểm a Khoản 1 Điều 2 Luật Đấu Thầu`, italics: true })] }),
        new Paragraph({ spacing: { after: 240 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `(Đính kèm Báo cáo ngày ${new Date().toLocaleDateString('vi-VN')} của ${unitName})`, italics: true })] }),
        new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 120 }, children: [new TextRun({ text: "Đơn vị: Triệu đồng", italics: true })] }),
        new Table({
          columnWidths: colWidths,
          margins: { top: 60, bottom: 60, left: 60, right: 60 },
          rows: tableRows
        }),
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `TP.HCM, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${reportYear}`, italics: true })] }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Người báo cáo", bold: true })] }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "(Ký, ghi rõ họ tên)" })] }),
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Bieu01A_BC_Dau_thau_${reportYear}.docx`);
}
