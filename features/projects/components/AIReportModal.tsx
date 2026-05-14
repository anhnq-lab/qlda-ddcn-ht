import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    X, Loader2, Copy, Check, Printer, RefreshCw, FileDown,
    Sparkles, AlertTriangle, Calendar, Building2, Hash
} from 'lucide-react';
import {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    AlignmentType, BorderStyle, TabStopPosition, TabStopType,
    Header, Footer, PageNumber, NumberFormat
} from 'docx';
import { saveAs } from 'file-saver';

interface AIReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportContent: string;
    isLoading: boolean;
    error?: string;
    projectName: string;
    onRegenerate: () => void;
}

export const AIReportModal: React.FC<AIReportModalProps> = ({
    isOpen, onClose, reportContent, isLoading, error, projectName, onRegenerate
}) => {
    const [copied, setCopied] = useState(false);
    const [exporting, setExporting] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) { setCopied(false); setExporting(false); }
    }, [isOpen]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(reportContent).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [reportContent]);

    const handlePrint = useCallback(() => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`<!DOCTYPE html><html><head>
            <title>Báo cáo tháng — ${projectName}</title>
            <style>
                @page { margin: 2cm 2.5cm; size: A4; }
                body { font-family: 'Times New Roman', serif; font-size: 13px; line-height: 1.7; color: #222; max-width: 700px; margin: 0 auto; padding: 20px; }
                h1 { text-align: center; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
                h2 { font-size: 14px; margin-top: 20px; padding-bottom: 3px; border-bottom: 1.5px solid #333; text-transform: uppercase; }
                h3 { font-size: 13px; margin-top: 14px; }
                ul { padding-left: 20px; } li { margin-bottom: 3px; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { border: 1px solid #999; padding: 5px 8px; font-size: 12px; }
                th { background: #f0f0f0; font-weight: bold; text-align: center; }
                hr { border: none; border-top: 1px solid #ccc; margin: 16px 0; }
                em, .footer { color: #888; font-size: 11px; }
                strong { color: #111; }
                .report-header { text-align: center; margin-bottom: 20px; padding: 10px; border: 2px solid #333; }
                .report-header p { margin: 2px 0; font-size: 12px; }
            </style>
        </head><body>${contentRef.current?.innerHTML || ''}</body></html>`);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    }, [projectName]);

    // ── Export DOCX ──
    const handleExportDocx = useCallback(async () => {
        if (!reportContent) return;
        setExporting(true);

        try {
            const paragraphs = markdownToDocxParagraphs(reportContent, projectName);

            const doc = new Document({
                styles: {
                    default: {
                        document: {
                            run: { font: 'Times New Roman', size: 26 },
                            paragraph: { spacing: { after: 120, line: 300 } },
                        },
                    },
                },
                sections: [{
                    properties: {
                        page: {
                            margin: { top: 1134, bottom: 1134, left: 1418, right: 1134 },
                            size: { width: 11906, height: 16838 }, // A4
                        },
                    },
                    headers: {
                        default: new Header({
                            children: [new Paragraph({
                                children: [new TextRun({
                                    text: 'BAN QLDA ĐTXD DDCN - TP.HCM',
                                    font: 'Times New Roman', size: 18, color: '888888', italics: true,
                                })],
                                alignment: AlignmentType.RIGHT,
                            })],
                        }),
                    },
                    footers: {
                        default: new Footer({
                            children: [new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({ text: 'Trang ', font: 'Times New Roman', size: 18, color: '888888' }),
                                    new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 18, color: '888888' }),
                                    new TextRun({ text: ' / ', font: 'Times New Roman', size: 18, color: '888888' }),
                                    new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Times New Roman', size: 18, color: '888888' }),
                                ],
                            })],
                        }),
                    },
                    children: paragraphs,
                }],
            });

            const blob = await Packer.toBlob(doc);
            const fileName = `BaoCaoThang_${projectName.replace(/\s+/g, '_').substring(0, 30)}_T${new Date().getMonth() + 1}_${new Date().getFullYear()}.docx`;
            saveAs(blob, fileName);
        } catch (err) {
            console.error('DOCX export error:', err);
        } finally {
            setExporting(false);
        }
    }, [reportContent, projectName]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-warning-50 dark:from-primary-900/20 dark:to-warning-900/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm shadow-primary-200/50 dark:shadow-primary-900/30">
                            <Sparkles className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-gray-900 dark:text-slate-100">Báo Cáo Tháng — AI</h2>
                            <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate max-w-xs">{projectName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {reportContent && !isLoading && (
                            <>
                                <ActionBtn onClick={handleCopy} icon={copied ? Check : Copy} label={copied ? 'Đã sao chép!' : 'Copy'} highlight={copied} />
                                <ActionBtn onClick={handlePrint} icon={Printer} label="In" />
                                <ActionBtn onClick={handleExportDocx} icon={FileDown} label={exporting ? 'Đang xuất...' : 'DOCX'} loading={exporting} accent />
                                <ActionBtn onClick={onRegenerate} icon={RefreshCw} label="Tạo lại" amber />
                            </>
                        )}
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-gray-400 dark:text-slate-400 ml-1">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading && <LoadingState />}
                    {error && !isLoading && <ErrorState error={error} onRetry={onRegenerate} />}
                    {reportContent && !isLoading && (
                        <div className="p-4 max-w-3xl mx-auto">
                            <div
                                ref={contentRef}
                                className="report-rendered"
                                dangerouslySetInnerHTML={{ __html: markdownToHtml(reportContent) }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Report styles */}
            <style>{reportStyles}</style>
        </div>
    );
};

// ── Action Button ──
const ActionBtn: React.FC<{
    onClick: () => void; icon: React.ElementType; label: string;
    highlight?: boolean; loading?: boolean; accent?: boolean; amber?: boolean;
}> = ({ onClick, icon: Icon, label, highlight, loading, accent, amber }) => (
    <button
        onClick={onClick}
        disabled={loading}
        className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
            highlight ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
            accent ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-sm' :
            amber ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200' :
            'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600'
        }`}
    >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
        {label}
    </button>
);

// ── Loading State ──
const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
        <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
            </div>
            <Loader2 className="absolute -bottom-1 -right-1 w-6 h-6 text-primary-500 animate-spin" />
        </div>
        <div className="text-center">
            <p className="text-sm font-bold text-gray-700 dark:text-slate-200">AI đang tổng hợp báo cáo...</p>
            <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">Phân tích dữ liệu dự án và soạn báo cáo tháng</p>
        </div>
        <div className="w-full max-w-md space-y-3 mt-2 px-8">
            {[90, 75, 85, 60, 70, 50].map((w, i) => (
                <div key={i} className="h-3.5 bg-gray-100 dark:bg-slate-800 rounded-md animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }} />
            ))}
        </div>
    </div>
);

// ── Error State ──
const ErrorState: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-sm font-bold text-red-600 dark:text-red-400">Không thể tạo báo cáo</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-400 max-w-sm text-center leading-relaxed">{error}</p>
        <button onClick={onRetry} className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-sm shadow-primary-200/50">
            <RefreshCw className="w-3.5 h-3.5" /> Thử lại
        </button>
    </div>
);

// ── Markdown → HTML ──
function markdownToHtml(md: string): string {
    let html = md
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^---$/gm, '<hr/>')
        .replace(/^\|(.+)\|$/gm, (line) => {
            const cells = line.split('|').filter(c => c.trim());
            if (cells.every(c => /^[\s-:]+$/.test(c))) return '<!-- sep -->';
            const isHeader = cells.every(c => c.trim().length > 0);
            return `<tr>${cells.map(c => `<td>${c.trim()}</td>`).join('')}</tr>`;
        });

    // Wrap table rows
    html = html.replace(/((?:<tr>.+<\/tr>\s*)+)/g, (match) => {
        const cleaned = match.replace(/<!-- sep -->\s*/g, '');
        // Make first row header
        const first = cleaned.match(/<tr>(.+?)<\/tr>/);
        if (first) {
            const headerRow = first[0].replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
            const rest = cleaned.replace(first[0], '');
            return `<table><thead>${headerRow}</thead><tbody>${rest}</tbody></table>`;
        }
        return `<table><tbody>${cleaned}</tbody></table>`;
    });

    // Lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.+?<\/li>(?:\n<li>.+?<\/li>)*)/gs, '<ul>$1</ul>');

    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br/>');

    return `<div class="report-doc"><p>${html}</p></div>`;
}

// ── Markdown → DOCX Paragraphs ──
function markdownToDocxParagraphs(md: string, projectName: string): Paragraph[] {
    const lines = md.split('\n');
    const paragraphs: Paragraph[] = [];

    // Report header
    paragraphs.push(
        new Paragraph({
            children: [new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, size: 26, font: 'Times New Roman' })],
            alignment: AlignmentType.CENTER, spacing: { after: 0 },
        }),
        new Paragraph({
            children: [new TextRun({ text: 'Độc lập - Tự do - Hạnh phúc', bold: true, size: 26, font: 'Times New Roman' })],
            alignment: AlignmentType.CENTER, spacing: { after: 80 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, space: 4, color: '000000' } },
        }),
        new Paragraph({ spacing: { after: 200 } }),
    );

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            paragraphs.push(new Paragraph({ spacing: { after: 80 } }));
            continue;
        }

        // Headers
        if (trimmed.startsWith('# ')) {
            paragraphs.push(new Paragraph({
                children: [new TextRun({ text: trimmed.slice(2), bold: true, size: 30, font: 'Times New Roman' })],
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { before: 240, after: 120 },
            }));
        } else if (trimmed.startsWith('## ')) {
            paragraphs.push(new Paragraph({
                children: [new TextRun({ text: trimmed.slice(3), bold: true, size: 28, font: 'Times New Roman' })],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 80 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 1, space: 2, color: '999999' } },
            }));
        } else if (trimmed.startsWith('### ')) {
            paragraphs.push(new Paragraph({
                children: [new TextRun({ text: trimmed.slice(4), bold: true, italics: true, size: 26, font: 'Times New Roman' })],
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 160, after: 60 },
            }));
        } else if (trimmed.startsWith('---')) {
            paragraphs.push(new Paragraph({
                border: { bottom: { style: BorderStyle.SINGLE, size: 1, space: 8, color: 'CCCCCC' } },
                spacing: { before: 120, after: 120 },
            }));
        } else if (trimmed.startsWith('- ')) {
            const text = trimmed.slice(2);
            const runs = parseBoldItalic(text);
            paragraphs.push(new Paragraph({
                children: [new TextRun({ text: '•  ', font: 'Times New Roman', size: 26 }), ...runs],
                indent: { left: 360 },
                spacing: { after: 60 },
            }));
        } else if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
            // Italic line (e.g., footer)
            paragraphs.push(new Paragraph({
                children: [new TextRun({ text: trimmed.replace(/\*/g, ''), italics: true, size: 22, font: 'Times New Roman', color: '888888' })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 120, after: 60 },
            }));
        } else {
            // Normal paragraph
            const runs = parseBoldItalic(trimmed);
            paragraphs.push(new Paragraph({
                children: runs,
                spacing: { after: 100 },
            }));
        }
    }

    // Signature block
    paragraphs.push(
        new Paragraph({ spacing: { before: 400, after: 0 } }),
        new Paragraph({
            children: [new TextRun({ text: `TP. Hồ Chí Minh, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`, italics: true, size: 26, font: 'Times New Roman' })],
            alignment: AlignmentType.RIGHT, spacing: { after: 40 },
        }),
        new Paragraph({
            children: [new TextRun({ text: 'GIÁM ĐỐC BAN QLDA', bold: true, size: 26, font: 'Times New Roman' })],
            alignment: AlignmentType.RIGHT, spacing: { after: 0 },
        }),
        new Paragraph({
            children: [new TextRun({ text: '(Ký, ghi rõ họ tên)', italics: true, size: 22, font: 'Times New Roman', color: '888888' })],
            alignment: AlignmentType.RIGHT, spacing: { after: 400 },
        }),
    );

    return paragraphs;
}

function parseBoldItalic(text: string): TextRun[] {
    const runs: TextRun[] = [];
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            runs.push(new TextRun({ text: text.slice(lastIndex, match.index), font: 'Times New Roman', size: 26 }));
        }
        if (match[1]) {
            runs.push(new TextRun({ text: match[1], bold: true, font: 'Times New Roman', size: 26 }));
        } else if (match[2]) {
            runs.push(new TextRun({ text: match[2], italics: true, font: 'Times New Roman', size: 26 }));
        }
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        runs.push(new TextRun({ text: text.slice(lastIndex), font: 'Times New Roman', size: 26 }));
    }

    return runs.length > 0 ? runs : [new TextRun({ text, font: 'Times New Roman', size: 26 })];
}

// ── Report CSS ──
const reportStyles = `
.report-rendered {
    font-family: 'Times New Roman', 'Georgia', serif;
    color: #1a1a1a;
    line-height: 1.8;
    font-size: 14px;
}
.dark .report-rendered { color: #e2e8f0; }

.report-rendered h1 {
    text-align: center;
    font-size: 18px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 8px 0 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #fb923c;
}
.dark .report-rendered h1 { border-color: #92702a; }

.report-rendered h2 {
    font-size: 15px;
    font-weight: 800;
    text-transform: uppercase;
    margin-top: 28px;
    margin-bottom: 8px;
    padding: 6px 12px;
    background: linear-gradient(90deg, #fef9ee 0%, transparent 100%);
    border-left: 3px solid #fb923c;
    border-radius: 0 6px 6px 0;
}
.dark .report-rendered h2 {
    background: linear-gradient(90deg, rgba(196,160,53,0.12) 0%, transparent 100%);
    border-color: #92702a;
}

.report-rendered h3 {
    font-size: 14px;
    font-weight: 700;
    font-style: italic;
    margin-top: 16px;
    color: #555;
}
.dark .report-rendered h3 { color: #94a3b8; }

.report-rendered strong { color: #111; font-weight: 700; }
.dark .report-rendered strong { color: #f1f5f9; }

.report-rendered ul {
    padding-left: 20px;
    margin: 8px 0;
}
.report-rendered li {
    margin-bottom: 4px;
    position: relative;
}
.report-rendered li::marker { color: #fb923c; }

.report-rendered table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 12px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.report-rendered thead th {
    background: #f8f5ec;
    font-weight: 700;
    text-align: center;
    padding: 8px 10px;
    border: 1px solid #e5dcc8;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.dark .report-rendered thead th {
    background: rgba(196,160,53,0.15);
    border-color: #334155;
}
.report-rendered td {
    padding: 6px 10px;
    border: 1px solid #e5e7eb;
}
.dark .report-rendered td { border-color: #334155; }
.report-rendered tbody tr:nth-child(even) { background: #fafaf8; }
.dark .report-rendered tbody tr:nth-child(even) { background: rgba(255,255,255,0.02); }

.report-rendered hr {
    border: none;
    border-top: 1px dashed #d4c89a;
    margin: 20px 0;
}
.dark .report-rendered hr { border-color: #475569; }

.report-rendered em { color: #777; }
.dark .report-rendered em { color: #64748b; }

.report-rendered p { margin-bottom: 6px; }
`;

export default AIReportModal;

