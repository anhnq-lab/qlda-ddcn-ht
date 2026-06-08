/**
 * excelReportGenerator.ts
 * Xuất báo cáo Excel thực sự dùng exceljs — chạy hoàn toàn trên browser (Blob).
 * 3 báo cáo:
 *   BC01 — Giám sát đầu tư (sheet: DuAn + TongHop)
 *   BC02 — Giải ngân       (sheet: GiaiNgan + TongKet)
 *   BC03 — Vướng mắc       (sheet: VuongMac)
 */
import ExcelJS from 'exceljs';
import { Project, Payment, Task } from '../types';
import { ProjectStatus, PaymentStatus, TaskStatus } from '../types';

export interface ExcelReportSource {
    projects: Project[];
    payments: Payment[];
    tasks: Task[];
}

// ── Palette ──────────────────────────────────────────────────────────────────
const COLOR = {
    headerFill: 'FF1A3C6E',      // dark navy
    headerFont: 'FFFFFFFF',
    subHeaderFill: 'FFE8F0FE',   // light blue
    subHeaderFont: 'FF1A3C6E',
    altRow: 'FFF8FAFF',
    border: 'FFD0D7E5',
    goodGreen: 'FF16A34A',
    warnAmber: 'FFD97706',
    dangerRed: 'FFDC2626',
    totalFill: 'FFEFF6FF',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function applyHeaderStyle(cell: ExcelJS.Cell, colSpan?: number) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.headerFill } };
    cell.font = { bold: true, color: { argb: COLOR.headerFont }, size: 11, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
        top: { style: 'thin', color: { argb: COLOR.border } },
        bottom: { style: 'thin', color: { argb: COLOR.border } },
        left: { style: 'thin', color: { argb: COLOR.border } },
        right: { style: 'thin', color: { argb: COLOR.border } },
    };
}

function applyDataCell(cell: ExcelJS.Cell, isAlt: boolean, align: 'left' | 'center' | 'right' = 'left') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? COLOR.altRow : 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: align, wrapText: true };
    cell.border = {
        top: { style: 'hair', color: { argb: COLOR.border } },
        bottom: { style: 'hair', color: { argb: COLOR.border } },
        left: { style: 'thin', color: { argb: COLOR.border } },
        right: { style: 'thin', color: { argb: COLOR.border } },
    };
    cell.font = { name: 'Calibri', size: 10 };
}

function applyTotalRow(row: ExcelJS.Row, colCount: number) {
    for (let i = 1; i <= colCount; i++) {
        const cell = row.getCell(i);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.totalFill } };
        cell.font = { bold: true, name: 'Calibri', size: 10, color: { argb: COLOR.subHeaderFont } };
        cell.border = {
            top: { style: 'medium', color: { argb: COLOR.headerFill } },
            bottom: { style: 'thin', color: { argb: COLOR.border } },
            left: { style: 'thin', color: { argb: COLOR.border } },
            right: { style: 'thin', color: { argb: COLOR.border } },
        };
    }
}

function addReportTitle(ws: ExcelJS.Worksheet, title: string, subtitle: string, colCount: number) {
    ws.addRow([]);
    const titleRow = ws.addRow([title]);
    titleRow.height = 30;
    const titleCell = titleRow.getCell(1);
    titleCell.font = { bold: true, size: 16, name: 'Calibri', color: { argb: COLOR.headerFill } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.mergeCells(titleRow.number, 1, titleRow.number, colCount);

    const subRow = ws.addRow([subtitle]);
    subRow.height = 18;
    const subCell = subRow.getCell(1);
    subCell.font = { italic: true, size: 10, name: 'Calibri', color: { argb: 'FF666666' } };
    subCell.alignment = { horizontal: 'center' };
    ws.mergeCells(subRow.number, 1, subRow.number, colCount);

    ws.addRow([]); // spacer
}

function setColWidths(ws: ExcelJS.Worksheet, widths: number[]) {
    widths.forEach((w, i) => {
        ws.getColumn(i + 1).width = w;
    });
}

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(n / 1_000_000_000) + ' tỷ';

const toDate = (s?: string | null) =>
    s ? new Date(s).toLocaleDateString('vi-VN') : '—';

// ── BC01 — GIÁM SÁT ĐẦU TƯ ──────────────────────────────────────────────────
async function buildBC01(wb: ExcelJS.Workbook, source: ExcelReportSource) {
    const ws = wb.addWorksheet('BC01 - Giám Sát DA');
    const COLS = 8;
    setColWidths(ws, [5, 45, 15, 18, 20, 14, 22, 22]);
    ws.getRow(1).height = 20;
    addReportTitle(ws, 'BÁO CÁO GIÁM SÁT ĐẦU TƯ CÔNG', `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} — Tổng số dự án: ${source.projects.length}`, COLS);

    // Header row
    const headers = ['STT', 'Tên dự án', 'Ban QLDA', 'Giai đoạn', 'Tổng vốn ĐT', 'Tiến độ (%)', 'Ngày bắt đầu', 'Kết thúc dự kiến'];
    const headerRow = ws.addRow(headers);
    headerRow.height = 32;
    headers.forEach((_, i) => applyHeaderStyle(headerRow.getCell(i + 1)));
    ws.getRow(headerRow.number).commit();

    // Data rows
    source.projects.forEach((p, idx) => {
        const isAlt = idx % 2 === 1;
        const statusLabel =
            p.Status === ProjectStatus.Preparation ? 'Chuẩn bị dự án' :
            p.Status === ProjectStatus.Execution ? 'Thực hiện dự án' : 'Kết thúc XD';

        const row = ws.addRow([
            idx + 1,
            p.ProjectName,
            p.ManagementBoard || '—',
            statusLabel,
            p.TotalInvestment / 1_000_000_000,
            p.ComputedStats?.PhysicalProgress || 0,
            toDate(p.StartDate),
            toDate(p.ExpectedEndDate),
        ]);
        row.height = 22;

        // Style cells
        [1, 2, 3, 4, 7, 8].forEach(c => applyDataCell(row.getCell(c), isAlt, c === 2 ? 'left' : 'center'));
        // Investment — number format
        const investCell = row.getCell(5);
        applyDataCell(investCell, isAlt, 'right');
        investCell.numFmt = '#,##0.00 "tỷ"';
        // Progress — conditional color
        const progCell = row.getCell(6);
        applyDataCell(progCell, isAlt, 'center');
        progCell.numFmt = '0"%"';
        const prog = p.ComputedStats?.PhysicalProgress || 0;
        progCell.font = {
            name: 'Calibri', size: 10, bold: true,
            color: { argb: prog >= 70 ? COLOR.goodGreen : prog >= 40 ? COLOR.warnAmber : COLOR.dangerRed }
        };
    });

    // Total row
    const totalRow = ws.addRow([
        '', 'TỔNG CỘNG', '', '',
        { formula: `SUM(E${headerRow.number + 1}:E${ws.rowCount})` },
        { formula: `AVERAGE(F${headerRow.number + 1}:F${ws.rowCount - 1})` },
        '', ''
    ]);
    totalRow.height = 24;
    applyTotalRow(totalRow, COLS);
    totalRow.getCell(5).numFmt = '#,##0.00 "tỷ"';
    totalRow.getCell(6).numFmt = '0.0"%"';

    ws.autoFilter = { from: { row: headerRow.number, column: 1 }, to: { row: headerRow.number, column: COLS } };
    ws.views = [{ state: 'frozen', ySplit: headerRow.number }];
}

// ── BC02 — GIẢI NGÂN ─────────────────────────────────────────────────────────
async function buildBC02(wb: ExcelJS.Workbook, source: ExcelReportSource) {
    const ws = wb.addWorksheet('BC02 - Giải Ngân');
    const COLS = 8;
    setColWidths(ws, [5, 20, 22, 12, 18, 20, 25, 18]);
    addReportTitle(ws, 'BÁO CÁO TÌNH HÌNH GIẢI NGÂN', `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} — Tổng: ${source.payments.length} thanh toán`, COLS);

    const headers = ['STT', 'Mã thanh toán', 'Số hợp đồng', 'Đợt', 'Loại', 'Số tiền (VNĐ)', 'Mã giao dịch KB', 'Trạng thái'];
    const headerRow = ws.addRow(headers);
    headerRow.height = 32;
    headers.forEach((_, i) => applyHeaderStyle(headerRow.getCell(i + 1)));

    let totalAmount = 0;
    let transferredAmount = 0;

    source.payments.forEach((p, idx) => {
        const isAlt = idx % 2 === 1;
        const typeLabel = p.Type === 'Advance' ? 'Tạm ứng' : 'Khối lượng';
        const statusLabel = p.Status === PaymentStatus.Transferred ? '✓ Đã chuyển' : '⏳ Chờ duyệt';
        totalAmount += p.Amount;
        if (p.Status === PaymentStatus.Transferred) transferredAmount += p.Amount;

        const row = ws.addRow([idx + 1, p.PaymentID, p.ContractID, p.BatchNo, typeLabel, p.Amount, p.TreasuryRef || '—', statusLabel]);
        row.height = 22;
        [1, 2, 3, 4, 5, 7, 8].forEach(c => applyDataCell(row.getCell(c), isAlt, c === 1 ? 'center' : 'left'));
        const amtCell = row.getCell(6);
        applyDataCell(amtCell, isAlt, 'right');
        amtCell.numFmt = '#,##0';
        // Status color
        const stCell = row.getCell(8);
        stCell.font = {
            name: 'Calibri', size: 10, bold: true,
            color: { argb: p.Status === PaymentStatus.Transferred ? COLOR.goodGreen : COLOR.warnAmber }
        };
    });

    // Summary rows
    ws.addRow([]);
    const r1 = ws.addRow(['', 'Tổng giải ngân', '', '', '', totalAmount, '', '']);
    const r2 = ws.addRow(['', 'Đã chuyển tiền', '', '', '', transferredAmount, '', '']);
    const r3 = ws.addRow(['', 'Đang chờ duyệt', '', '', '', totalAmount - transferredAmount, '', '']);
    [r1, r2, r3].forEach(r => {
        applyTotalRow(r, COLS);
        r.getCell(6).numFmt = '#,##0';
    });
    r2.getCell(6).font = { bold: true, name: 'Calibri', size: 10, color: { argb: COLOR.goodGreen } };
    r3.getCell(6).font = { bold: true, name: 'Calibri', size: 10, color: { argb: COLOR.warnAmber } };

    ws.autoFilter = { from: { row: headerRow.number, column: 1 }, to: { row: headerRow.number, column: COLS } };
    ws.views = [{ state: 'frozen', ySplit: headerRow.number }];
}

// ── BC03 — VƯỚNG MẮC ─────────────────────────────────────────────────────────
async function buildBC03(wb: ExcelJS.Workbook, source: ExcelReportSource) {
    const ws = wb.addWorksheet('BC03 - Vướng Mắc');
    const COLS = 7;
    const now = new Date();

    const overdueTasks = source.tasks.filter(t => {
        if (t.Status === TaskStatus.Done) return false;
        return new Date(t.DueDate) < now;
    });

    setColWidths(ws, [5, 18, 40, 18, 16, 16, 16]);
    addReportTitle(ws, 'BÁO CÁO XỬ LÝ VƯỚNG MẮC', `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} — Tổng tồn đọng: ${overdueTasks.length} mục`, COLS);

    if (overdueTasks.length === 0) {
        const emptyRow = ws.addRow(['', '✓ Không có vướng mắc tồn đọng', '', '', '', '', '']);
        emptyRow.getCell(2).font = { bold: true, color: { argb: COLOR.goodGreen }, name: 'Calibri', size: 12 };
        return;
    }

    const headers = ['STT', 'Mã công việc', 'Tiêu đề', 'Mã dự án', 'Ngày đến hạn', 'Trạng thái', 'Ưu tiên'];
    const headerRow = ws.addRow(headers);
    headerRow.height = 32;
    headers.forEach((_, i) => applyHeaderStyle(headerRow.getCell(i + 1)));

    overdueTasks.forEach((t, idx) => {
        const isAlt = idx % 2 === 1;
        const daysOverdue = Math.floor((now.getTime() - new Date(t.DueDate).getTime()) / 86400000);
        const row = ws.addRow([
            idx + 1, t.TaskID, t.Title, t.ProjectID,
            toDate(t.DueDate),
            t.Status,
            t.Priority
        ]);
        row.height = 22;
        [1, 2, 3, 4, 5, 6, 7].forEach(c => applyDataCell(row.getCell(c), isAlt, c === 3 ? 'left' : 'center'));
        // Overdue color
        row.getCell(5).font = {
            name: 'Calibri', size: 10, bold: true,
            color: { argb: daysOverdue > 30 ? COLOR.dangerRed : COLOR.warnAmber }
        };
    });

    ws.autoFilter = { from: { row: headerRow.number, column: 1 }, to: { row: headerRow.number, column: COLS } };
    ws.views = [{ state: 'frozen', ySplit: headerRow.number }];
}

// ── MAIN EXPORT FUNCTION ──────────────────────────────────────────────────────
export async function generateExcelReport(
    type: 'monitoring' | 'disbursement' | 'issues' | 'all',
    source: ExcelReportSource
): Promise<void> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Ban QLDA ĐTXD DDCN';
    wb.created = new Date();
    wb.modified = new Date();
    wb.properties.date1904 = false;

    const dateStr = new Date().toISOString().split('T')[0];

    if (type === 'monitoring' || type === 'all') await buildBC01(wb, source);
    if (type === 'disbursement' || type === 'all') await buildBC02(wb, source);
    if (type === 'issues' || type === 'all') await buildBC03(wb, source);

    const fileMap: Record<string, string> = {
        monitoring: `BC01_GiamSatDauTu_${dateStr}.xlsx`,
        disbursement: `BC02_GiaiNgan_${dateStr}.xlsx`,
        issues: `BC03_VuongMac_${dateStr}.xlsx`,
        all: `BaoCao_TongHop_${dateStr}.xlsx`,
    };

    // Download via Blob (browser-safe)
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileMap[type];
    link.click();
    URL.revokeObjectURL(url);
}
