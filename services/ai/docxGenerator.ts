// docxGenerator.ts — Soạn thảo tài liệu và bài trình chiếu chuyên nghiệp cho Ban QLDA
import {
    Document, Paragraph, Table, TableRow, TableCell, AlignmentType, WidthType,
    TextRun, Header, Footer, TabStopPosition, TabStopType, PageNumber, NumberFormat,
    convertMillimetersToTwip, Packer
} from 'docx';
import {
    exportDocx, p, pBody, pHeading, pEmpty, pMulti, headerCell, dataCell,
    buildDocumentHeader, buildTitleBlock, buildSignatureBlockTable,
    formatCurrencyVN, amountInWords
} from '../../utils/docxHelpers';
import pptxgen from 'pptxgenjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Palette màu Midnight Gold cho PPTX
const C_PPTX = {
    bg: '1A1A2E',
    bg2: '16213E',
    gold: 'D4A017',
    goldLight: 'F0D68A',
    white: 'FFFFFF',
    muted: '8899AA',
    accent: '3B82F6',
    card: '1E2A4A',
    cardBorder: '2A3A5E'
};

export const docxGenerator = {
    /**
     * Sinh báo cáo hành chính Word (chuẩn NĐ 30/2020)
     */
    generateWordReport: async (projectName: string, data: {
        projectCode?: string;
        investor?: string;
        totalInvestment?: number;
        disbursedAmount?: number;
        tasks?: any[];
        compliance?: any;
    }): Promise<void> => {
        const elements: (Paragraph | Table)[] = [];

        // 1. Tiêu đề quốc gia & Tên cơ quan
        const header = buildDocumentHeader(
            data.investor || 'BAN QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG',
            '01/BC-BQLDA',
            new Date().toISOString(),
            'TP. Hồ Chí Minh',
            { parentOrg: 'ỦY BAN NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH' }
        );
        elements.push(...header);

        // 2. Tên loại văn bản & trích yếu
        const title = buildTitleBlock(
            'BÁO CÁO TÌNH HÌNH THỰC HIỆN DỰ ÁN',
            projectName.toUpperCase()
        );
        elements.push(...title);

        // 3. I. THÔNG TIN CHUNG
        elements.push(pHeading('I. THÔNG TIN CHUNG'));
        elements.push(pBody(`- Tên dự án: ${projectName}`));
        if (data.projectCode) {
            elements.push(pBody(`- Mã dự án: ${data.projectCode}`));
        }
        elements.push(pBody(`- Chủ đầu tư: ${data.investor || 'Ban QLDA ĐTXD các công trình Dân dụng và Công nghiệp'}`));
        
        if (data.totalInvestment) {
            elements.push(pBody(`- Tổng mức đầu tư: ${formatCurrencyVN(data.totalInvestment)} (${amountInWords(data.totalInvestment)})`));
        }
        if (data.disbursedAmount !== undefined && data.totalInvestment) {
            const rate = ((data.disbursedAmount / data.totalInvestment) * 100).toFixed(2);
            elements.push(pBody(`- Lũy kế giải ngân: ${formatCurrencyVN(data.disbursedAmount)} (Đạt ${rate}% tổng mức đầu tư)`));
        }

        elements.push(pEmpty(120));

        // 4. II. TIẾN ĐỘ THỰC HIỆN & DANH SÁCH CÔNG VIỆC
        elements.push(pHeading('II. TIẾN ĐỘ & KẾ HOẠCH CÔNG VIỆC CHÍNH'));
        elements.push(pBody('Dưới đây là danh sách các hạng mục công việc đang được theo dõi và triển khai trong kế hoạch tổng thể:'));

        if (data.tasks && data.tasks.length > 0) {
            const tableRows = [
                new TableRow({
                    children: [
                        headerCell('STT', 600),
                        headerCell('Tên công việc', 4500),
                        headerCell('Hạn hoàn thành', 1800),
                        headerCell('Trạng thái', 1500),
                        headerCell('Kế hoạch vốn (VNĐ)', 2000),
                    ]
                })
            ];

            data.tasks.forEach((t, i) => {
                const planCost = t.estimated_cost ? t.estimated_cost.toLocaleString('vi-VN') : '0';
                tableRows.push(
                    new TableRow({
                        children: [
                            dataCell((i + 1).toString(), AlignmentType.CENTER),
                            dataCell(t.title || ''),
                            dataCell(t.due_date || t.dueDate || 'Chưa rõ', AlignmentType.CENTER),
                            dataCell(t.status === 'done' ? 'Hoàn thành' : t.status === 'in_progress' ? 'Đang chạy' : 'Chưa bắt đầu', AlignmentType.CENTER),
                            dataCell(planCost, AlignmentType.RIGHT),
                        ]
                    })
                );
            });

            const tasksTable = new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE }
            });
            elements.push(tasksTable);
        } else {
            elements.push(pBody('Không có thông tin công việc chi tiết.'));
        }

        elements.push(pEmpty(150));

        // 5. III. ĐÁNH GIÁ TUÂN THỦ PHÁP LÝ
        elements.push(pHeading('III. ĐÁNH GIÁ TUÂN THỦ PHÁP LÝ'));
        if (data.compliance && data.compliance.checks && data.compliance.checks.length > 0) {
            elements.push(pBody(`Điểm số tuân thủ chung của dự án đạt: ${data.compliance.complianceScore || 100}/100.`));
            
            data.compliance.checks.forEach((c: any, index: number) => {
                const statusStr = c.status === 'passed' ? '✔ ĐÃ ĐẠT' : c.status === 'warning' ? '⚠ CẢNH BÁO' : '✘ VI PHẠM';
                elements.push(pHeading(`${index + 1}. Quy định: ${c.regulation} (${c.article})`, { before: 100, after: 60 }));
                elements.push(pBody(`- Trạng thái kiểm tra: ${statusStr}`));
                elements.push(pBody(`- Chi tiết: ${c.detail}`));
                if (c.recommendation) {
                    elements.push(pBody(`- Khuyến nghị: ${c.recommendation}`, { bold: false, italics: true }));
                }
            });
        } else {
            elements.push(pBody('Dự án đã được phân tích tự động bằng AI, ghi nhận các hồ sơ pháp lý cơ bản đầy đủ và tuân thủ các quy định hiện hành về Đầu tư công và Xây dựng.'));
        }

        elements.push(pEmpty(200));

        // 6. Chữ ký phê duyệt
        const signatureTable = buildSignatureBlockTable(
            ['Ủy ban Nhân dân TP.HCM (để b/c)', 'Sở Xây dựng TP.HCM', 'Lưu hồ sơ'],
            'GIÁM ĐỐC BAN QLDA',
            'LÊ VĂN KHÁNH'
        );
        elements.push(signatureTable);

        // Xuất file
        await exportDocx(`Bao_cao_tiendo_${projectName.replace(/\s+/g, '_')}.docx`, [
            { children: elements }
        ]);
    },

    /**
     * Sinh slide trình chiếu PowerPoint (PPTX - Midnight Gold Theme)
     */
    generatePowerPoint: async (projectName: string, data: {
        investor?: string;
        totalInvestment?: number;
        disbursedAmount?: number;
        tasks?: any[];
        compliance?: any;
    }): Promise<void> => {
        const pres: any = new pptxgen();
        pres.layout = 'LAYOUT_16x9';
        pres.author = 'Ban QLDA ĐTXD';
        pres.title = `Báo cáo tiến độ - ${projectName}`;

        // Helper helper
        const addCard = (slide: pptxgen.Slide, x: number, y: number, w: number, h: number) => {
            slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
                x, y, w, h, rectRadius: 0.12,
                fill: { color: C_PPTX.card },
                line: { color: C_PPTX.cardBorder, width: 1 },
                shadow: { type: 'outer', color: '000000', blur: 8, offset: 2, angle: 135, opacity: 0.2 }
            });
        };

        const addTitle = (slide: pptxgen.Slide, text: string) => {
            slide.addText(text, {
                x: 0.6, y: 0.3, w: 8.8, h: 0.6,
                fontSize: 26, fontFace: 'Arial', bold: true,
                color: C_PPTX.gold, align: 'left'
            });
            slide.addShape(pres.shapes.RECTANGLE, {
                x: 0.6, y: 0.95, w: 1.5, h: 0.04,
                fill: { color: C_PPTX.gold }
            });
        };

        // ----------------------------------------
        // SLIDE 1: COVER
        // ----------------------------------------
        const s1 = pres.addSlide();
        s1.background = { color: C_PPTX.bg };
        s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C_PPTX.gold } });
        s1.addText('BÁO CÁO TIẾN ĐỘ DỰ ÁN\nHÀNG TUẦN & HÀNG THÁNG', {
            x: 0.6, y: 1.4, w: 8.8, h: 1.6,
            fontSize: 32, fontFace: 'Arial', bold: true, color: C_PPTX.white,
            align: 'left', lineSpacingMultiple: 1.2
        });
        s1.addText(projectName.toUpperCase(), {
            x: 0.6, y: 3.1, w: 8.8, h: 0.8,
            fontSize: 18, fontFace: 'Arial', color: C_PPTX.goldLight, bold: true
        });
        s1.addText(`Đơn vị báo cáo: ${data.investor || 'Ban QLDA ĐTXD các công trình Dân dụng & Công nghiệp'}`, {
            x: 0.6, y: 4.5, w: 8.8, h: 0.4,
            fontSize: 12, fontFace: 'Arial', color: C_PPTX.muted
        });
        s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: C_PPTX.gold } });

        // ----------------------------------------
        // SLIDE 2: OVERVIEW KPI
        // ----------------------------------------
        const s2 = pres.addSlide();
        s2.background = { color: C_PPTX.bg2 };
        addTitle(s2, 'TỔNG QUAN CHỈ SỐ DỰ ÁN');
        
        // 4 KPI Cards
        const totalStr = data.totalInvestment ? `${(data.totalInvestment / 1_000_000_000).toFixed(1)} Tỷ` : 'Chưa cập nhật';
        const disbursedStr = data.disbursedAmount ? `${(data.disbursedAmount / 1_000_000_000).toFixed(1)} Tỷ` : '0 Tỷ';
        const rateStr = data.totalInvestment && data.disbursedAmount ? `${((data.disbursedAmount / data.totalInvestment) * 100).toFixed(1)}%` : '0%';
        const complianceScore = data.compliance?.complianceScore ? `${data.compliance.complianceScore}/100` : '100/100';

        const kpis = [
            { label: 'Tổng Mức Đầu Tư', val: totalStr, col: C_PPTX.gold, x: 0.5 },
            { label: 'Lũy Kế Giải Ngân', val: disbursedStr, col: C_PPTX.accent, x: 2.75 },
            { label: 'Tỷ Lệ Giải Ngân', val: rateStr, col: '10B981', x: 5.0 },
            { label: 'Điểm Tuân Thủ', val: complianceScore, col: 'EF4444', x: 7.25 }
        ];

        kpis.forEach(kpi => {
            addCard(s2, kpi.x, 1.8, 2.1, 2.5);
            s2.addText(kpi.val, {
                x: kpi.x, y: 2.1, w: 2.1, h: 0.6,
                fontSize: 28, fontFace: 'Arial', bold: true, color: kpi.col, align: 'center'
            });
            s2.addText(kpi.label, {
                x: kpi.x + 0.1, y: 2.8, w: 1.9, h: 0.8,
                fontSize: 13, fontFace: 'Arial', color: C_PPTX.white, align: 'center', bold: true
            });
        });

        // ----------------------------------------
        // SLIDE 3: KEY TASKS
        // ----------------------------------------
        const s3 = pres.addSlide();
        s3.background = { color: C_PPTX.bg };
        addTitle(s3, 'CÁC CÔNG VIỆC TRỌNG TÂM');

        if (data.tasks && data.tasks.length > 0) {
            // Lấy tối đa 5 tasks để hiển thị trên slide
            const listTasks = data.tasks.slice(0, 5);
            listTasks.forEach((t, i) => {
                const y = 1.6 + i * 0.75;
                addCard(s3, 0.6, y, 8.8, 0.6);
                
                const statusColor = t.status === 'done' ? '10B981' : t.status === 'in_progress' ? '3B82F6' : 'F59E0B';
                const statusLabel = t.status === 'done' ? 'Hoàn thành' : t.status === 'in_progress' ? 'Đang chạy' : 'Chưa bắt đầu';
                
                s3.addText(`●`, { x: 0.8, y: y + 0.1, w: 0.3, h: 0.4, fontSize: 16, color: statusColor });
                s3.addText(t.title || '', { x: 1.2, y, w: 5.0, h: 0.6, fontSize: 13, fontFace: 'Arial', bold: true, color: C_PPTX.white, valign: 'middle' });
                s3.addText(`Hạn: ${t.due_date || t.dueDate || 'Chưa có'}`, { x: 6.3, y, w: 1.4, h: 0.6, fontSize: 11, fontFace: 'Arial', color: C_PPTX.muted, valign: 'middle' });
                s3.addText(statusLabel, { x: 7.7, y, w: 1.5, h: 0.6, fontSize: 11, fontFace: 'Arial', bold: true, color: statusColor, align: 'center', valign: 'middle' });
            });
        } else {
            s3.addText('Không có thông tin công việc trong kế hoạch.', { x: 1.0, y: 2.5, w: 8.0, h: 1.0, fontSize: 16, color: C_PPTX.muted, align: 'center' });
        }

        // Save
        const filename = `Slide_tiendo_${projectName.replace(/\s+/g, '_')}.pptx`;
        await pres.writeFile({ fileName: filename });
    },

    /**
     * Sinh bảng tính Excel kế hoạch vốn & giải ngân
     */
    generateExcelCapitalPlan: async (projectName: string, data: {
        tasks?: any[];
    }): Promise<void> => {
        const wb = XLSX.utils.book_new();
        const headers = [['STT', 'Hạng mục/Nội dung công việc', 'Kế hoạch vốn (VNĐ)', 'Đã giải ngân (VNĐ)', 'Tỷ lệ giải ngân (%)', 'Trạng thái']];
        
        const rows = (data.tasks || []).map((t: any, index: number) => {
            const plan = t.estimated_cost || 0;
            const actual = t.actual_cost || 0;
            const rate = plan > 0 ? (actual / plan) * 100 : 0;
            return [
                index + 1,
                t.title,
                plan,
                actual,
                rate / 100, // Để Excel format dạng % (0.xx)
                t.status === 'done' ? 'Đã hoàn thành' : 'Đang triển khai'
            ];
        });

        // Hàng tổng cộng
        const totalPlan = rows.reduce((acc: number, r: any) => acc + r[2], 0);
        const totalActual = rows.reduce((acc: number, r: any) => acc + r[3], 0);
        
        // Hàng tổng cộng sẽ được lưu ở hàng cuối
        const totalRowIdx = rows.length + 2; // +1 cho header (1-indexed), +1 cho hàng sau
        rows.push([
            '', 
            'TỔNG CỘNG', 
            totalPlan, 
            totalActual, 
            `=IF(C${totalRowIdx}>0, D${totalRowIdx}/C${totalRowIdx}, 0)`, // Formula tính tỷ lệ giải ngân tổng
            ''
        ]);

        const wsData = [...headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Định dạng cột số và phần trăm trong SheetJS
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:F1');
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            // Cột C (Kế hoạch vốn) - Index 2
            const planCellRef = XLSX.utils.encode_cell({ r: R, c: 2 });
            if (ws[planCellRef]) {
                ws[planCellRef].z = '#,##0'; // Định dạng tiền tệ VND nguyên tệ
            }
            // Cột D (Đã giải ngân) - Index 3
            const actualCellRef = XLSX.utils.encode_cell({ r: R, c: 3 });
            if (ws[actualCellRef]) {
                ws[actualCellRef].z = '#,##0';
            }
            // Cột E (Tỷ lệ giải ngân) - Index 4
            const rateCellRef = XLSX.utils.encode_cell({ r: R, c: 4 });
            if (ws[rateCellRef]) {
                if (typeof ws[rateCellRef].v === 'string' && ws[rateCellRef].v.startsWith('=')) {
                    ws[rateCellRef].f = ws[rateCellRef].v; // Gán công thức thực sự cho ô tổng cộng
                    delete ws[rateCellRef].v;
                }
                ws[rateCellRef].z = '0.0%';
            }
        }

        // Định dạng cột rộng
        ws['!cols'] = [
            { wch: 6 },   // STT
            { wch: 45 },  // Nội dung
            { wch: 22 },  // Kế hoạch vốn
            { wch: 22 },  // Đã giải ngân
            { wch: 20 },  // Tỷ lệ
            { wch: 18 }   // Trạng thái
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'KeHoachCapital');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        saveAs(blob, `Ke_hoach_von_${projectName.replace(/\s+/g, '_')}.xlsx`);
    }
};

// ── NĐ30 Constants ──────────────────────────────────────────────────
const FONT = 'Times New Roman';
const FONT_SIZE_13 = 26; // half-points
const FONT_SIZE_14 = 28;
const FONT_SIZE_12 = 24;
const FONT_SIZE_11 = 22;

// Margins in mm → twips
const MARGIN_TOP = convertMillimetersToTwip(20);
const MARGIN_BOTTOM = convertMillimetersToTwip(20);
const MARGIN_LEFT = convertMillimetersToTwip(30);
const MARGIN_RIGHT = convertMillimetersToTwip(15);

const LINE_SPACING = 276; // 1.15 lines × 240 = ~276 (close to NĐ30 standard)

export interface DocxOptions {
    organizationName?: string;     // Tên cơ quan ban hành
    organizationParent?: string;   // Cơ quan chủ quản
    documentNumber?: string;       // Số văn bản
    documentSymbol?: string;       // Ký hiệu
    location?: string;             // Địa danh
    date?: Date;                   // Ngày ban hành
    title?: string;                // Trích yếu nội dung
    content: string;               // Nội dung văn bản (markdown-like)
    signerTitle?: string;          // Chức vụ người ký
    signerName?: string;           // Tên người ký
    recipientList?: string[];      // Nơi nhận
}

/**
 * Parse markdown-like content into paragraphs
 */
function sanitizeAIContent(content: string): string {
    // Strip duplicate header that AI sometimes generates
    let cleaned = content;
    // Remove lines that look like the document header (org name, doc number, date, etc.)
    const headerPatterns = [
        /^\s*```\s*$/gm,
        /^\s*CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM.*$/gm,
        /^\s*Độc lập\s*[-–]\s*Tự do\s*[-–]\s*Hạnh phúc.*$/gm,
        /^\s*ĐẢNG CỘNG SẢN VIỆT NAM.*$/gm,
        /^\s*HỌC VIỆN\s*(CHÍNH TRỊ|CTQG).*$/gm,
        /^\s*BAN\s*(QUẢN LÝ|QLDA).*ĐT(XD)?.*$/gm,
        /^\s*Số:\s*[\.…]+.*$/gm,
        /^\s*\*?Hà Nội,\s*ngày.*tháng.*năm.*\*?$/gm,
        /^\s*[-─═_]{3,}\s*$/gm, // horizontal rules
    ];
    for (const pattern of headerPatterns) {
        cleaned = cleaned.replace(pattern, '');
    }
    // Remove leading empty lines
    cleaned = cleaned.replace(/^\s*\n{2,}/g, '\n');
    return cleaned.trim();
}

function parseContentToParagraphs(rawContent: string): Paragraph[] {
    const content = sanitizeAIContent(rawContent);
    const paragraphs: Paragraph[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines — add spacing
        if (!trimmed) {
            paragraphs.push(new Paragraph({
                spacing: { after: 60 },
            }));
            continue;
        }

        // Heading level 1: **BOLD TEXT**
        if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.includes(':**')) {
            const text = trimmed.replace(/\*\*/g, '');
            paragraphs.push(new Paragraph({
                spacing: { before: 120, after: 60, line: LINE_SPACING },
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text,
                        font: FONT,
                        size: FONT_SIZE_14,
                        bold: true,
                    }),
                ],
            }));
            continue;
        }

        // Heading with colon: **Label:** content
        if (trimmed.startsWith('**') && trimmed.includes(':**')) {
            const match = trimmed.match(/^\*\*(.+?):\*\*\s*(.*)/);
            if (match) {
                const children: TextRun[] = [
                    new TextRun({
                        text: `${match[1]}: `,
                        font: FONT,
                        size: FONT_SIZE_13,
                        bold: true,
                    }),
                ];
                if (match[2]) {
                    children.push(new TextRun({
                        text: match[2],
                        font: FONT,
                        size: FONT_SIZE_13,
                    }));
                }
                paragraphs.push(new Paragraph({
                    spacing: { before: 60, after: 60, line: LINE_SPACING },
                    indent: { firstLine: convertMillimetersToTwip(12.7) }, // first line indent
                    children,
                }));
                continue;
            }
        }

        // Bullet points: - text or * text
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const text = trimmed.substring(2);
            // Handle bold within bullet: **text**
            const parts = text.split(/(\*\*.+?\*\*)/g);
            const children: TextRun[] = parts.map(part => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return new TextRun({
                        text: part.replace(/\*\*/g, ''),
                        font: FONT,
                        size: FONT_SIZE_13,
                        bold: true,
                    });
                }
                return new TextRun({
                    text: part,
                    font: FONT,
                    size: FONT_SIZE_13,
                });
            });

            paragraphs.push(new Paragraph({
                spacing: { before: 40, after: 40, line: LINE_SPACING },
                indent: { left: convertMillimetersToTwip(15), hanging: convertMillimetersToTwip(5) },
                children: [
                    new TextRun({ text: '– ', font: FONT, size: FONT_SIZE_13 }),
                    ...children,
                ],
            }));
            continue;
        }

        // Numbered items: 1. text, 2. text
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
        if (numberedMatch) {
            const parts = numberedMatch[2].split(/(\*\*.+?\*\*)/g);
            const children: TextRun[] = parts.map(part => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return new TextRun({
                        text: part.replace(/\*\*/g, ''),
                        font: FONT,
                        size: FONT_SIZE_13,
                        bold: true,
                    });
                }
                return new TextRun({ text: part, font: FONT, size: FONT_SIZE_13 });
            });

            paragraphs.push(new Paragraph({
                spacing: { before: 40, after: 40, line: LINE_SPACING },
                indent: { left: convertMillimetersToTwip(12.7), hanging: convertMillimetersToTwip(7) },
                children: [
                    new TextRun({ text: `${numberedMatch[1]}. `, font: FONT, size: FONT_SIZE_13 }),
                    ...children,
                ],
            }));
            continue;
        }

        // Section headers: I. II. III. etc.
        const romanMatch = trimmed.match(/^(I{1,3}V?|IV|V|VI{0,3})\.\s+(.+)/);
        if (romanMatch) {
            paragraphs.push(new Paragraph({
                spacing: { before: 120, after: 60, line: LINE_SPACING },
                children: [
                    new TextRun({
                        text: `${romanMatch[1]}. ${romanMatch[2]}`,
                        font: FONT,
                        size: FONT_SIZE_14,
                        bold: true,
                    }),
                ],
            }));
            continue;
        }

        // Default paragraph
        const parts = trimmed.split(/(\*\*.+?\*\*)/g);
        const children: TextRun[] = parts.map(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return new TextRun({
                    text: part.replace(/\*\*/g, ''),
                    font: FONT,
                    size: FONT_SIZE_13,
                    bold: true,
                });
            }
            return new TextRun({ text: part, font: FONT, size: FONT_SIZE_13 });
        });

        paragraphs.push(new Paragraph({
            spacing: { before: 40, after: 40, line: LINE_SPACING },
            indent: { firstLine: convertMillimetersToTwip(12.7) },
            alignment: AlignmentType.JUSTIFIED,
            children,
        }));
    }

    return paragraphs;
}

/**
 * Tạo DOCX chuẩn NĐ30/2020/NĐ-CP
 */
export async function generateNd30Docx(options: DocxOptions): Promise<Blob> {
    const {
        organizationName = 'BAN QUẢN LÝ DỰ ÁN ĐTXD CN',
        organizationParent = 'UBND THÀNH PHỐ HỒ CHÍ MINH',
        documentNumber = '……/BC-BQLDA',
        location = 'Hà Nội',
        date = new Date(),
        title = 'BÁO CÁO',
        content,
        signerTitle = 'TRƯỞNG BAN',
        signerName = '(Ký, ghi rõ họ tên)',
        recipientList = ['UBND TP.HCM (để b/c)', 'Các phòng ban liên quan', 'Lưu: VT.'],
    } = options;

    const dateStr = `${location}, ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;

    // Parse content to paragraphs
    const contentParagraphs = parseContentToParagraphs(content);

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: FONT,
                        size: FONT_SIZE_13,
                    },
                    paragraph: {
                        spacing: { line: LINE_SPACING },
                    },
                },
            },
        },
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: MARGIN_TOP,
                        bottom: MARGIN_BOTTOM,
                        left: MARGIN_LEFT,
                        right: MARGIN_RIGHT,
                    },
                    pageNumbers: {
                        start: 1,
                        formatType: NumberFormat.DECIMAL,
                    },
                },
            },
            headers: {
                default: new Header({
                    children: [], // Clean header
                }),
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    children: [PageNumber.CURRENT],
                                    font: FONT,
                                    size: FONT_SIZE_11,
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [
                // ═══ PHẦN ĐẦU: Quốc hiệu + Tên CQ ═══

                // Row 1: Cơ quan chủ quản (left) + ĐẢNG CỘNG SẢN VIỆT NAM (right)
                new Paragraph({
                    spacing: { after: 0 },
                    children: [
                        new TextRun({
                            text: organizationParent,
                            font: FONT,
                            size: FONT_SIZE_12,
                            bold: false,
                        }),
                        new TextRun({
                            text: '\t',
                        }),
                        new TextRun({
                            text: 'ĐẢNG CỘNG SẢN VIỆT NAM',
                            font: FONT,
                            size: FONT_SIZE_14,
                            bold: true,
                        }),
                    ],
                    tabStops: [{
                        type: TabStopType.CENTER,
                        position: TabStopPosition.MAX / 2 + 2000,
                    }],
                }),

                // Row 2: Tên cơ quan (left)
                new Paragraph({
                    spacing: { after: 0 },
                    children: [
                        new TextRun({
                            text: organizationName,
                            font: FONT,
                            size: FONT_SIZE_13,
                            bold: true,
                        }),
                    ],
                }),

                // Row 3: Số văn bản (left) + Địa danh, ngày tháng (right)
                new Paragraph({
                    spacing: { before: 120, after: 0 },
                    children: [
                        new TextRun({
                            text: `Số: ${documentNumber}`,
                            font: FONT,
                            size: FONT_SIZE_13,
                        }),
                        new TextRun({ text: '\t' }),
                        new TextRun({
                            text: dateStr,
                            font: FONT,
                            size: FONT_SIZE_13,
                            italics: true,
                        }),
                    ],
                    tabStops: [{
                        type: TabStopType.RIGHT,
                        position: TabStopPosition.MAX - 200,
                    }],
                }),

                // ═══ TRÍCH YẾU NỘI DUNG ═══
                new Paragraph({
                    spacing: { before: 360, after: 120, line: LINE_SPACING },
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: title.toUpperCase(),
                            font: FONT,
                            size: FONT_SIZE_14,
                            bold: true,
                        }),
                    ],
                }),

                // ═══ NỘI DUNG VĂN BẢN ═══
                ...contentParagraphs,

                // ═══ CHỮ KÝ ═══
                new Paragraph({
                    spacing: { before: 480 },
                    alignment: AlignmentType.RIGHT,
                    indent: { right: convertMillimetersToTwip(10) },
                    children: [
                        new TextRun({
                            text: signerTitle,
                            font: FONT,
                            size: FONT_SIZE_14,
                            bold: true,
                        }),
                    ],
                }),

                // Khoảng trống cho chữ ký
                new Paragraph({ spacing: { before: 120 } }),
                new Paragraph({ spacing: { before: 120 } }),

                // Tên người ký
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    indent: { right: convertMillimetersToTwip(10) },
                    children: [
                        new TextRun({
                            text: signerName,
                            font: FONT,
                            size: FONT_SIZE_14,
                            bold: true,
                        }),
                    ],
                }),

                // ═══ NƠI NHẬN ═══
                new Paragraph({
                    spacing: { before: 480 },
                    children: [
                        new TextRun({
                            text: 'Nơi nhận:',
                            font: FONT,
                            size: FONT_SIZE_11,
                            bold: true,
                            italics: true,
                        }),
                    ],
                }),

                ...recipientList.map(r => new Paragraph({
                    spacing: { before: 0, after: 0 },
                    indent: { left: convertMillimetersToTwip(5) },
                    children: [
                        new TextRun({
                            text: `– ${r}`,
                            font: FONT,
                            size: FONT_SIZE_11,
                        }),
                    ],
                })),
            ],
        }],
    });

    return await Packer.toBlob(doc);
}
