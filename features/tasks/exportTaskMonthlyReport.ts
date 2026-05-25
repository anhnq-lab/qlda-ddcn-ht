import ExcelJS from 'exceljs';
import { DashboardService, TaskBriefingSummary, TaskBriefingCategoryGroup } from '../../services/DashboardService';
import { TASK_CATEGORY_LABELS, TaskCategory } from '../../types/task.types';

// ─── Palette ────────────────────────────────────────────────────
const COLOR = {
    headerFill:  'FFF4B083',
    sectionFill: 'FFFFFF00',
    groupFill:   'FFFFE599',
    summaryFill: 'FFD9E2F3',
    white:       'FFFFFFFF',
    border:      'FFD0D0D0',
    doneFill:    'FFE2EFDA',
    incompleteFill: 'FFFCE4EC',
} as const;

function fill(argb: string): ExcelJS.Fill {
    return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function border(): Partial<ExcelJS.Borders> {
    const s: ExcelJS.BorderStyle = 'thin';
    const c = { style: s, color: { argb: COLOR.border } };
    return { top: c, left: c, bottom: c, right: c };
}

function applyRow(
    row: ExcelJS.Row,
    options: {
        fillColor?: string;
        bold?: boolean;
        wrapText?: boolean;
        hAlign?: ExcelJS.Alignment['horizontal'];
        vAlign?: ExcelJS.Alignment['vertical'];
        fontSize?: number;
    }
) {
    const { fillColor, bold = false, wrapText = true, hAlign = 'left', vAlign = 'middle', fontSize } = options;
    row.eachCell({ includeEmpty: true }, cell => {
        if (fillColor) cell.fill = fill(fillColor);
        cell.font = { name: 'Times New Roman', bold, size: fontSize ?? 11 };
        cell.alignment = { horizontal: hAlign, vertical: vAlign, wrapText };
        cell.border = border();
    });
}

const STATUS_LABELS: Record<string, string> = {
    done: 'Hoàn thành',
    in_progress: 'Đang thực hiện',
    incomplete: 'Chưa hoàn thành',
    todo: 'Chưa bắt đầu',
};

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII'];

// ─── Export BC phòng ban ────────────────────────────────────────
export async function exportDepartmentTaskReport(
    month: number,
    year: number,
    departmentName: string
): Promise<void> {
    const allSummaries = await DashboardService.getTaskBriefingSummary(month, year);
    const summary = allSummaries.find(s => s.department_name === departmentName);
    if (!summary || summary.total_tasks === 0) {
        alert(`Không có dữ liệu công việc cho ${departmentName} tháng ${month}/${year}`);
        return;
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`BC ${departmentName} T${month}`);

    ws.columns = [
        { width: 6 },   // A: STT
        { width: 42 },  // B: Nội dung
        { width: 28 },  // C: Dự án
        { width: 30 },  // D: Kết quả
        { width: 20 },  // E: Cán bộ PT
        { width: 16 },  // F: Trạng thái
        { width: 8 },   // G: %
        { width: 24 },  // H: Ghi chú
    ];

    writeDeptTitle(ws, month, year, departmentName);
    writeDeptHeader(ws);
    writeCategoryGroups(ws, summary.by_category);
    writeDeptFooter(ws, summary);

    await downloadWorkbook(wb, `BC_CV_${departmentName}_T${month}_${year}.xlsx`);
}

// ─── Export BC giao ban tổng hợp ────────────────────────────────
export async function exportConsolidatedBriefingReport(
    month: number,
    year: number
): Promise<void> {
    const allSummaries = await DashboardService.getTaskBriefingSummary(month, year);
    if (allSummaries.length === 0) {
        alert(`Không có dữ liệu công việc tháng ${month}/${year}`);
        return;
    }

    const wb = new ExcelJS.Workbook();

    // Sheet 1: Tổng hợp
    const wsSummary = wb.addWorksheet('TỔNG HỢP');
    writeSummarySheet(wsSummary, month, year, allSummaries);

    // Sheet 2+: Chi tiết từng phòng
    for (const summary of allSummaries) {
        if (summary.total_tasks === 0) continue;
        const sheetName = summary.department_name.substring(0, 31);
        const ws = wb.addWorksheet(sheetName);

        ws.columns = [
            { width: 6 },
            { width: 42 },
            { width: 28 },
            { width: 30 },
            { width: 20 },
            { width: 16 },
            { width: 8 },
            { width: 24 },
        ];

        writeDeptTitle(ws, month, year, summary.department_name);
        writeDeptHeader(ws);
        writeCategoryGroups(ws, summary.by_category);
        writeDeptFooter(ws, summary);
    }

    await downloadWorkbook(wb, `BC_GiaoBan_T${month}_${year}.xlsx`);
}

// ─── Summary sheet (Sheet 1) ────────────────────────────────────
function writeSummarySheet(
    ws: ExcelJS.Worksheet,
    month: number,
    year: number,
    summaries: TaskBriefingSummary[]
) {
    ws.columns = [
        { width: 6 },   // A: STT
        { width: 28 },  // B: Phòng ban
        { width: 12 },  // C: Tổng CV
        { width: 14 },  // D: Hoàn thành
        { width: 14 },  // E: Đang làm
        { width: 14 },  // F: Chưa HT
        { width: 12 },  // G: Tỷ lệ
    ];

    // Title
    const t1 = ws.addRow([null, `BÁO CÁO GIAO BAN THÁNG ${month}/${year}`]);
    ws.mergeCells(`B1:G1`);
    t1.height = 28;
    t1.getCell(2).font = { name: 'Times New Roman', bold: true, size: 14 };
    t1.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

    const t2 = ws.addRow([null, 'TỔNG HỢP KẾT QUẢ CÔNG VIỆC CÁC PHÒNG BAN']);
    ws.mergeCells(`B2:G2`);
    t2.height = 22;
    t2.getCell(2).font = { name: 'Times New Roman', bold: true, size: 12 };
    t2.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

    ws.addRow([]);

    // Header
    const hdr = ws.addRow(['STT', 'Phòng ban', 'Tổng CV', 'Hoàn thành', 'Đang làm', 'Chưa HT', 'Tỷ lệ (%)']);
    hdr.height = 30;
    applyRow(hdr, { fillColor: COLOR.headerFill, bold: true, hAlign: 'center' });

    // Data rows
    let totalAll = 0, doneAll = 0, ipAll = 0, incAll = 0;
    summaries.forEach((s, i) => {
        const row = ws.addRow([
            i + 1,
            s.department_name,
            s.total_tasks,
            s.completed,
            s.in_progress,
            s.incomplete,
            `${s.completion_rate}%`,
        ]);
        row.height = 20;
        applyRow(row, { fillColor: COLOR.white });
        [1, 3, 4, 5, 6, 7].forEach(c => {
            row.getCell(c).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        });

        totalAll += s.total_tasks;
        doneAll += s.completed;
        ipAll += s.in_progress;
        incAll += s.incomplete;
    });

    // Footer total
    const rateAll = totalAll > 0 ? Math.round((doneAll / totalAll) * 1000) / 10 : 0;
    const footerRow = ws.addRow([null, 'TỔNG CỘNG', totalAll, doneAll, ipAll, incAll, `${rateAll}%`]);
    footerRow.height = 22;
    applyRow(footerRow, { fillColor: COLOR.summaryFill, bold: true, hAlign: 'center' });
    footerRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
}

// ─── Dept title rows ────────────────────────────────────────────
function writeDeptTitle(ws: ExcelJS.Worksheet, month: number, year: number, deptName: string) {
    const t1 = ws.addRow([null, `BÁO CÁO KẾT QUẢ CÔNG VIỆC THÁNG ${month}/${year}`]);
    ws.mergeCells(`B${t1.number}:H${t1.number}`);
    t1.height = 28;
    t1.getCell(2).font = { name: 'Times New Roman', bold: true, size: 14 };
    t1.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

    const t2 = ws.addRow([null, `Phòng: ${deptName}`]);
    ws.mergeCells(`B${t2.number}:H${t2.number}`);
    t2.height = 22;
    t2.getCell(2).font = { name: 'Times New Roman', bold: true, size: 12 };
    t2.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

    ws.addRow([]);
}

// ─── Dept header row ────────────────────────────────────────────
function writeDeptHeader(ws: ExcelJS.Worksheet) {
    const hdr = ws.addRow([
        'STT',
        'Nội dung công việc',
        'Dự án liên quan',
        'Kết quả thực hiện',
        'Cán bộ phụ trách',
        'Trạng thái',
        '%',
        'Ghi chú',
    ]);
    hdr.height = 36;
    applyRow(hdr, { fillColor: COLOR.headerFill, bold: true, hAlign: 'center' });
}

// ─── Write category groups ──────────────────────────────────────
function writeCategoryGroups(ws: ExcelJS.Worksheet, groups: TaskBriefingCategoryGroup[]) {
    groups.forEach((group, gi) => {
        const label = `${ROMAN[gi] || String(gi + 1)}. ${group.category_label.toUpperCase()} (${group.completed}/${group.total} hoàn thành)`;
        const catRow = ws.addRow([null, label]);
        ws.mergeCells(`B${catRow.number}:H${catRow.number}`);
        catRow.height = 20;
        applyRow(catRow, { fillColor: COLOR.groupFill, bold: true });

        group.items.forEach((item, ii) => {
            const statusLabel = STATUS_LABELS[item.status] || item.status;
            const resultText = item.completion_result || (item.status === 'incomplete' ? item.incomplete_reason : '');

            const row = ws.addRow([
                ii + 1,
                item.title,
                item.project_name || '',
                resultText || '',
                item.assignee_name,
                statusLabel,
                item.progress,
                item.notes || '',
            ]);
            row.height = 18;

            const rowFill = item.status === 'done' ? COLOR.doneFill
                : item.status === 'incomplete' ? COLOR.incompleteFill
                : COLOR.white;
            applyRow(row, { fillColor: rowFill, vAlign: 'top' });

            [1, 6, 7].forEach(c => {
                row.getCell(c).alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
            });
        });
    });
}

// ─── Dept footer ────────────────────────────────────────────────
function writeDeptFooter(ws: ExcelJS.Worksheet, summary: TaskBriefingSummary) {
    ws.addRow([]);
    const footer = ws.addRow([
        null,
        `TỔNG HỢP: ${summary.completed}/${summary.total_tasks} công việc hoàn thành (${summary.completion_rate}%)`,
    ]);
    ws.mergeCells(`B${footer.number}:H${footer.number}`);
    footer.height = 22;
    applyRow(footer, { fillColor: COLOR.summaryFill, bold: true });
}

// ─── Download helper ────────────────────────────────────────────
async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
