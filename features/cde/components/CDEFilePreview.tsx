// ═══════════════════════════════════════════════════════════════
// CDE File Preview Modal
// PDF / Image: real viewer  |  DOCX: mammoth.js  |  XLSX: SheetJS
// ═══════════════════════════════════════════════════════════════

import React, { useMemo, useEffect, useState } from 'react';
import { FileText, Download, X, Box, Image as ImageIcon, Printer, Loader2, AlertCircle, MapPin } from 'lucide-react';
import CDEMarkup2DLayer from './CDEMarkup2DLayer';

interface PreviewFile {
    doc_name?: string;
    DocName?: string;
    name?: string;
    storage_path?: string;
    version?: string;
    Version?: string;
    size?: string;
    Size?: string;
    publicUrl?: string;
    isLocal?: boolean;
    fileObj?: File;
}

interface CDEFilePreviewProps {
    file: PreviewFile;
    onClose: () => void;
    onDownload?: () => void;
    /** Bật markup/issue 2D khi mở từ CDE (cần doc_id + project_id) */
    docId?: number;
    projectId?: string;
    createdBy?: string;
}

// ─── Office viewer hooks ──────────────────────────────────────────────────────

function useDocxContent(viewUrl: string | null, isDocx: boolean) {
    const [html, setHtml] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isDocx || !viewUrl) return;
        setLoading(true);
        setError(null);
        (async () => {
            try {
                const res = await fetch(viewUrl);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const arrayBuffer = await res.arrayBuffer();
                const mammoth = await import('mammoth');
                const result = await mammoth.convertToHtml({ arrayBuffer });
                setHtml(result.value);
            } catch (e: any) {
                setError(e.message || 'Không thể đọc file DOCX');
            } finally {
                setLoading(false);
            }
        })();
    }, [viewUrl, isDocx]);

    return { html, loading, error };
}

function useXlsxContent(viewUrl: string | null, isSpreadsheet: boolean) {
    const [html, setHtml] = useState<string | null>(null);
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [activeSheet, setActiveSheet] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isSpreadsheet || !viewUrl) return;
        setLoading(true);
        setError(null);
        (async () => {
            try {
                const res = await fetch(viewUrl);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const arrayBuffer = await res.arrayBuffer();
                const XLSX = await import('xlsx');
                const wb = XLSX.read(arrayBuffer, { type: 'array' });
                setSheetNames(wb.SheetNames);
                const sheetHtml = XLSX.utils.sheet_to_html(wb.Sheets[wb.SheetNames[0]], { id: 'xlsx-table' });
                setHtml(sheetHtml);
                return { wb };
            } catch (e: any) {
                setError(e.message || 'Không thể đọc file Excel');
            } finally {
                setLoading(false);
            }
        })();
    }, [viewUrl, isSpreadsheet]);

    return { html, sheetNames, activeSheet, setActiveSheet, loading, error };
}

// ─── Main component ───────────────────────────────────────────────────────────

const CDEFilePreview: React.FC<CDEFilePreviewProps> = ({ file, onClose, onDownload, docId, projectId, createdBy }) => {
    const [markupActive, setMarkupActive] = useState(false);
    const fileName = (file.doc_name || file.DocName || file.name || '').toLowerCase();
    const displayName = file.doc_name || file.DocName || file.name || 'Tài liệu';
    const isPDF = fileName.endsWith('.pdf');
    const isImage = /\.(png|jpg|jpeg|gif|webp)$/.test(fileName);
    const isIFC = fileName.endsWith('.ifc');
    const isDocx = /\.docx?$/.test(fileName);
    const isSpreadsheet = /\.(xlsx?|csv)$/.test(fileName);

    const viewUrl = useMemo(() => {
        if (file.isLocal && file.fileObj) return URL.createObjectURL(file.fileObj);
        return file.publicUrl || file.storage_path || null;
    }, [file]);

    useEffect(() => {
        return () => {
            if (file.isLocal && viewUrl) URL.revokeObjectURL(viewUrl);
        };
    }, [file.isLocal, viewUrl]);

    const version = file.version || file.Version || '1.0';
    const size = file.size || file.Size || 'N/A';

    const { html: docxHtml, loading: docxLoading, error: docxError } = useDocxContent(viewUrl, isDocx);
    const { html: xlsxHtml, loading: xlsxLoading, error: xlsxError } = useXlsxContent(viewUrl, isSpreadsheet);

    const isOfficeLoading = docxLoading || xlsxLoading;
    const officeError = docxError || xlsxError;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#F1F5F9] dark:bg-slate-800 w-full max-w-6xl h-[90vh] rounded-3xl shadow-sm overflow-hidden flex flex-col border border-white/20 dark:border-slate-700">
                {/* Header */}
                <div className="bg-bg-surface px-6 py-4 flex items-center justify-between border-b border-border shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${isIFC ? 'bg-warning-50 text-warning-600' : 'bg-blue-50 text-blue-600'}`}>
                            {isIFC ? <Box className="w-6 h-6" /> : isImage ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-base font-black text-txt-primary tracking-tight">{displayName}</h3>
                            <p className="text-[10px] text-txt-placeholder font-bold uppercase tracking-widest">
                                {file.isLocal ? 'TÀI LIỆU VỪA TẢI LÊN' : `PHIÊN BẢN: ${version}`} • {size}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {docId && projectId && (isPDF || isImage) && (
                            <button
                                className={`px-3 py-2 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 ${markupActive ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
                                title="Ghi chú / Issue trên tài liệu"
                                onClick={() => setMarkupActive((v) => !v)}
                            >
                                <MapPin className="w-4 h-4" /> {markupActive ? 'Đang markup' : 'Markup'}
                            </button>
                        )}
                        <button className="p-2.5 text-gray-500 hover:bg-bg-muted rounded-xl transition-all" title="In"
                            onClick={() => window.print()}>
                            <Printer className="w-5 h-5" />
                        </button>
                        {onDownload && (
                            <button onClick={onDownload} className="p-2.5 text-gray-500 hover:bg-bg-muted rounded-xl transition-all" title="Tải xuống">
                                <Download className="w-5 h-5" />
                            </button>
                        )}
                        <div className="w-px h-6 bg-gray-200 dark:bg-slate-600 mx-2" />
                        <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 flex justify-center bg-[#525659]">
                    {(isPDF || isImage) && viewUrl ? (
                        <div className="relative bg-bg-surface w-full h-full rounded-sm shadow-sm overflow-hidden flex flex-col">
                            {isPDF ? (
                                <iframe src={`${viewUrl}#toolbar=0`} className="w-full h-full border-0" title="PDF Viewer" />
                            ) : (
                                <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
                                    <img src={viewUrl} crossOrigin="anonymous" className="max-w-full max-h-full object-contain shadow-sm" alt="Preview" />
                                </div>
                            )}
                            {docId && projectId && (
                                <CDEMarkup2DLayer docId={docId} projectId={projectId} createdBy={createdBy} active={markupActive} />
                            )}
                        </div>
                    ) : isIFC ? (
                        <div className="bg-gray-900 w-full h-full rounded-xl flex items-center justify-center">
                            <div className="text-center">
                                <Box className="w-24 h-24 text-blue-500 mx-auto mb-6 animate-pulse" />
                                <h3 className="text-xl font-bold text-gray-300 uppercase tracking-tighter">BIM INTEGRATED VIEWER</h3>
                                <p className="text-gray-500 mt-2 text-sm">Rendering 3D Model: {displayName}</p>
                            </div>
                        </div>
                    ) : isOfficeLoading ? (
                        <div className="flex flex-col items-center justify-center gap-3 text-gray-300">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
                            <p className="text-sm">Đang tải nội dung tài liệu…</p>
                        </div>
                    ) : officeError ? (
                        <div className="flex flex-col items-center justify-center gap-3 text-gray-300 max-w-sm text-center">
                            <AlertCircle className="w-10 h-10 text-red-400" />
                            <p className="text-sm font-semibold">Không thể xem trước</p>
                            <p className="text-xs text-gray-400">{officeError}</p>
                            {onDownload && (
                                <button onClick={onDownload} className="flex items-center gap-2 mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all">
                                    <Download className="w-4 h-4" /> Tải xuống để xem
                                </button>
                            )}
                        </div>
                    ) : isDocx && docxHtml ? (
                        <div className="bg-bg-surface w-full max-w-[850px] shadow-sm rounded-sm overflow-hidden flex flex-col">
                            <div className="bg-[#2b579a] text-white px-4 py-1 text-xs font-medium uppercase tracking-tighter shrink-0">
                                Microsoft Word — {displayName}
                            </div>
                            <div
                                className="p-12 text-txt-primary prose prose-sm max-w-none overflow-y-auto flex-1"
                                dangerouslySetInnerHTML={{ __html: docxHtml }}
                            />
                        </div>
                    ) : isSpreadsheet && xlsxHtml ? (
                        <div className="bg-bg-surface w-full shadow-sm rounded-sm overflow-hidden flex flex-col">
                            <div className="bg-[#217346] text-white px-4 py-1 text-xs font-medium uppercase tracking-tighter shrink-0">
                                Microsoft Excel — {displayName}
                            </div>
                            <div className="flex-1 overflow-auto">
                                <style>{`
                                    #xlsx-table { border-collapse: collapse; font-size: 12px; width: 100%; }
                                    #xlsx-table td, #xlsx-table th { border: 1px solid #d1d5db; padding: 4px 8px; white-space: nowrap; }
                                    #xlsx-table tr:nth-child(even) { background: #f9fafb; }
                                `}</style>
                                <div dangerouslySetInnerHTML={{ __html: xlsxHtml }} />
                            </div>
                        </div>
                    ) : (
                        // Unknown format fallback
                        <div className="flex flex-col items-center justify-center gap-3 text-gray-300 max-w-sm text-center">
                            <FileText className="w-16 h-16 text-gray-500" />
                            <p className="text-sm font-semibold">Định dạng chưa hỗ trợ xem trực tiếp</p>
                            <p className="text-xs text-gray-400">{fileName.split('.').pop()?.toUpperCase()} — Tải xuống để xem nội dung</p>
                            {onDownload && (
                                <button onClick={onDownload} className="flex items-center gap-2 mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all">
                                    <Download className="w-4 h-4" /> Tải xuống
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CDEFilePreview;
