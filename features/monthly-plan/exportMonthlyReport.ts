import ExcelJS from 'exceljs';
import { MonthlyPlanService, MonthlyPlanItemService } from '../../services/PlanService';
import { DEPARTMENT_CODES, DEPARTMENT_NAMES, MONTHLY_STATUS_LABELS } from '../../types/plan.types';
import type { MonthlyPlanItem } from '../../types/plan.types';

// ─── Palette ────────────────────────────────────────────────────
const COLOR = {
    headerFill:  'FFF4B083', // orange header row
    sectionFill: 'FFFFFF00', // yellow section row (I / II)
    groupFill:   'FFFFE599', // light-yellow group row
    deptFill:    'FFFFFF00', // yellow dept row
    white:       'FFFFFFFF',
    border:      'FFD0D0D0',
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

// ─── Main export function ────────────────────────────────────────
export async function exportMonthlyReport(month: number, year: number): Promise<void> {
    const wb = new ExcelJS.Workbook();
    const sheetName = `BC T${month} - KH T${month < 12 ? month + 1 : 1}/${year}`;
    const ws = wb.addWorksheet(sheetName);

    // ── Column widths ──────────────────────────────────────────
    ws.columns = [
        { width: 7 },   // A: index
        { width: 48 },  // B: task name
        { width: 32 },  // C: deliverable / result
        { width: 16 },  // D: deadline
        { width: 28 },  // E: collaborating depts
        { width: 22 },  // F: result status
        { width: 28 },  // G: reason
        { width: 22 },  // H: notes
    ];

    // ── Title rows ─────────────────────────────────────────────
    const titleRow1 = ws.addRow([null, null, 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc']);
    ws.mergeCells(`C1:H1`);
    titleRow1.height = 40;
    titleRow1.getCell(3).font = { name: 'Times New Roman', bold: true, size: 12 };
    titleRow1.getCell(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    ws.addRow([]); // empty row 2

    const titleRow3 = ws.addRow([null, null, 'BÁO CÁO']);
    ws.mergeCells(`C3:H3`);
    titleRow3.height = 20;
    titleRow3.getCell(3).font = { name: 'Times New Roman', bold: true, size: 14 };
    titleRow3.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };

    const nextMonth = month < 12 ? month + 1 : 1;
    const nextYear  = month < 12 ? year : year + 1;
    const titleRow4 = ws.addRow([
        null, null,
        `Kết quả thực hiện nhiệm vụ tháng ${month}/${year} - Kế hoạch thực hiện tháng ${nextMonth}/${nextYear}`,
    ]);
    ws.mergeCells(`C4:H4`);
    titleRow4.height = 20;
    titleRow4.getCell(3).font = { name: 'Times New Roman', bold: true, size: 12 };
    titleRow4.getCell(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    ws.addRow([]); // empty row 5

    // ── Column headers (row 6) ──────────────────────────────────
    const headerRow = ws.addRow([
        'TT',
        'Nội dung công việc/nhiệm vụ',
        'Kết quả đầu ra của nhiệm vụ',
        'Thời gian\nhoàn thành',
        'Đơn vị phối hợp',
        'Kết quả\n(Hoàn thành/\nchưa HT)',
        'Lý do chưa\nhoàn thành\n(nếu có)',
        'Ghi chú',
    ]);
    headerRow.height = 50;
    applyRow(headerRow, { fillColor: COLOR.headerFill, bold: true, hAlign: 'center', vAlign: 'middle' });

    // ── Section I: BC kết quả tháng hiện tại ───────────────────
    const secRow1 = ws.addRow(['I', `Nhiệm vụ đã thực hiện trong tháng ${month}/${year}`]);
    ws.mergeCells(`B${secRow1.number}:H${secRow1.number}`);
    secRow1.height = 20;
    applyRow(secRow1, { fillColor: COLOR.sectionFill, bold: true });

    await writeAllDepts(ws, month, year, 'report');

    // ── Section II: KH tháng tiếp theo ─────────────────────────
    const secRow2 = ws.addRow(['II', `Kế hoạch thực hiện tháng ${nextMonth}/${nextYear}`]);
    ws.mergeCells(`B${secRow2.number}:H${secRow2.number}`);
    secRow2.height = 20;
    applyRow(secRow2, { fillColor: COLOR.sectionFill, bold: true });

    await writeAllDepts(ws, nextMonth, nextYear, 'plan');

    // ── Download ────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `BC_T${month}-KH_T${nextMonth}_${year}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Write all departments for a given mode ─────────────────────
async function writeAllDepts(
    ws: ExcelJS.Worksheet,
    month: number,
    year: number,
    mode: 'report' | 'plan'
) {
    for (let di = 0; di < DEPARTMENT_CODES.length; di++) {
        const deptCode = DEPARTMENT_CODES[di];
        const deptName = DEPARTMENT_NAMES[deptCode];

        // Roman numeral for department index
        const romanIdx = ['I','II','III','IV','V','VI','VII'][di];

        // Dept header row
        const deptRow = ws.addRow([romanIdx, deptName]);
        ws.mergeCells(`B${deptRow.number}:H${deptRow.number}`);
        deptRow.height = 18;
        applyRow(deptRow, { fillColor: COLOR.deptFill, bold: true });

        // Fetch plan + items
        let items: MonthlyPlanItem[] = [];
        try {
            const plan = await MonthlyPlanService.getOrCreate(month, year, deptCode, deptName);
            const detail = await MonthlyPlanService.getWithItems(plan.id);
            items = detail.items ?? [];
            if (mode === 'plan') {
                items = items.filter(i => i.status === 'planned' || i.status === 'deferred');
            }
        } catch {
            // skip if no plan
        }

        if (items.length === 0) {
            const emptyRow = ws.addRow([null, '(Không có nhiệm vụ)']);
            ws.mergeCells(`B${emptyRow.number}:H${emptyRow.number}`);
            emptyRow.height = 16;
            applyRow(emptyRow, { fillColor: COLOR.white });
            continue;
        }

        // Group tasks
        const groups = new Map<string, MonthlyPlanItem[]>();
        for (const item of items) {
            const g = item.source_type === 'project_step' ? 'Kế hoạch dự án' : (item.source_type === 'from_annual' ? 'KH Khung năm' : 'Công việc khác');
            if (!groups.has(g)) groups.set(g, []);
            groups.get(g)!.push(item);
        }

        let taskCounter = 1;
        for (const [groupName, groupItems] of groups.entries()) {
            // Group header row (if group name exists)
            if (groupName) {
                const groupRow = ws.addRow([null, groupName]);
                ws.mergeCells(`B${groupRow.number}:H${groupRow.number}`);
                groupRow.height = 18;
                applyRow(groupRow, { fillColor: COLOR.groupFill, bold: true });
            }

            for (const item of groupItems) {
                const resultText = mode === 'report'
                    ? (item.completion_result || MONTHLY_STATUS_LABELS[item.status])
                    : '';
                const collaboratingTextParts = [
                    item.collaborating_dept_codes && item.collaborating_dept_codes.length > 0
                        ? item.collaborating_dept_codes.join(', ')
                        : '',
                    item.collaborating_text || ''
                ].filter(Boolean).join('; ');

                const taskRow = ws.addRow([
                    taskCounter++,
                    item.task_name,
                    item.deliverable ?? '',
                    item.deadline_note ?? `Tháng ${month}`,
                    collaboratingTextParts,
                    resultText,
                    item.incomplete_reason ?? '',
                    item.notes ?? '',
                ]);
                taskRow.height = 18;
                applyRow(taskRow, { fillColor: COLOR.white, vAlign: 'top' });
                // Center specific columns: A=1, D=4, E=5, F=6
                [1, 4, 5, 6].forEach(colNum => {
                    taskRow.getCell(colNum).alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
                });
            }
        }
    }
}
