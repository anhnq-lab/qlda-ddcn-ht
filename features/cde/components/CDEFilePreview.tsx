// ═══════════════════════════════════════════════════════════════
// CDE File Preview Modal — Extracted from DocumentManager
// Supports: PDF, Image (real viewer), Word/Excel/IFC (mock preview)
// ═══════════════════════════════════════════════════════════════

import React, { useMemo, useEffect } from 'react';
import { FileText, Download, X, Box, Image as ImageIcon, Printer } from 'lucide-react';

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
    // For local file uploads
    isLocal?: boolean;
    fileObj?: File;
}

interface CDEFilePreviewProps {
    file: PreviewFile;
    onClose: () => void;
    onDownload?: () => void;
}

const CDEFilePreview: React.FC<CDEFilePreviewProps> = ({ file, onClose, onDownload }) => {
    const fileName = (file.doc_name || file.DocName || file.name || '').toLowerCase();
    const displayName = file.doc_name || file.DocName || file.name || 'Tài liệu';
    const isPDF = fileName.endsWith('.pdf');
    const isImage = /\.(png|jpg|jpeg|gif|webp)$/.test(fileName);
    const isIFC = fileName.endsWith('.ifc');
    const isExcel = /\.(xlsx|xls|csv)$/.test(fileName);

    // Create Blob URL for local files or use publicUrl
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#F1F5F9] dark:bg-slate-800 w-full max-w-6xl h-[90vh] rounded-3xl shadow-sm overflow-hidden flex flex-col border border-white/20 dark:border-slate-700">
                {/* Header */}
                <div className="bg-bg-surface px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${isIFC ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                            {isIFC ? <Box className="w-6 h-6" /> : isImage ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-800 dark:text-slate-200 tracking-tight">{displayName}</h3>
                            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest">
                                {file.isLocal ? 'TÀI LIỆU VỪA TẢI LÊN' : `PHIÊN BẢN: ${version}`} • {size}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all" title="In"><Printer className="w-5 h-5" /></button>
                        {onDownload && (
                            <button onClick={onDownload} className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all" title="Tải xuống"><Download className="w-5 h-5" /></button>
                        )}
                        <div className="w-px h-6 bg-gray-200 dark:bg-slate-600 mx-2" />
                        <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><X className="w-6 h-6" /></button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 flex justify-center bg-[#525659]">
                    {(isPDF || isImage) && viewUrl ? (
                        <div className="bg-bg-surface w-full h-full rounded-sm shadow-sm overflow-hidden flex flex-col">
                            {isPDF ? (
                                <iframe src={`${viewUrl}#toolbar=0`} className="w-full h-full border-0" title="PDF Viewer" />
                            ) : (
                                <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
                                    <img src={viewUrl} className="max-w-full max-h-full object-contain shadow-sm" alt="Preview" />
                                </div>
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
                    ) : isExcel ? (
                        <div className="bg-bg-surface w-full max-w-5xl shadow-sm rounded-sm overflow-hidden flex flex-col h-fit">
                            <div className="bg-[#217346] text-white px-4 py-1 text-xs font-medium uppercase tracking-tighter">Microsoft Excel Online Preview</div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-[12px]">
                                    <thead>
                                        <tr className="bg-[#E6E6E6] text-gray-600 text-center">
                                            <th className="border border-gray-300 w-10 py-1 font-normal"></th>
                                            <th className="border border-gray-300 px-4 py-1 font-normal uppercase">Cột A</th>
                                            <th className="border border-gray-300 px-4 py-1 font-normal uppercase">Cột B</th>
                                            <th className="border border-gray-300 px-4 py-1 font-normal uppercase">Cột C</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(row => (
                                            <tr key={row}>
                                                <td className="bg-[#E6E6E6] border border-gray-300 text-center text-gray-500 py-1">{row}</td>
                                                <td className="border border-gray-200 px-3 py-1 bg-bg-surface">Dữ liệu dòng {row}</td>
                                                <td className="border border-gray-200 px-3 py-1 bg-bg-surface"></td>
                                                <td className="border border-gray-200 px-3 py-1 bg-bg-surface"></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-bg-surface w-full max-w-[800px] min-h-[1100px] shadow-sm p-[80px] text-gray-800 font-serif relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 pointer-events-none select-none">
                                <h1 className="text-9xl font-black">CONFIDENTIAL</h1>
                            </div>
                            <div className="text-center mb-16 underline decoration-double underline-offset-8">
                                <h2 className="text-xl font-bold uppercase tracking-widest">{displayName}</h2>
                            </div>
                            <div className="space-y-6 text-justify text-[15px] leading-relaxed">
                                <p className="font-bold">Ghi chú quan trọng:</p>
                                <p>Định dạng Office (.docx, .xlsx) hiện tại đang được mô phỏng xem trước. Trong phiên bản chính thức, hệ thống sẽ tích hợp Microsoft Office 365 / Google Workspace Viewer API để hiển thị nội dung gốc.</p>
                                <p>Đối với định dạng PDF và Hình ảnh tải lên, hệ thống đã hỗ trợ xem trực tiếp 100%.</p>
                                <div className="mt-20 flex justify-between">
                                    <div className="text-center"><p className="font-bold">ĐƠN VỊ THỰC HIỆN</p><p className="text-xs italic">(Ký, ghi rõ họ tên)</p></div>
                                    <div className="text-center"><p className="font-bold">BAN QUẢN LÝ DỰ ÁN</p><p className="text-xs italic">(Ký tên và đóng dấu)</p></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CDEFilePreview;
