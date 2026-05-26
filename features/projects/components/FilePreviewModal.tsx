import React, { useMemo, useEffect } from 'react';
import { X, Printer, Download, FileText, Image as ImageIcon } from 'lucide-react';

interface FilePreviewModalProps {
    file: any;
    onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
    const f = file as any;
    const fileName = (f.DocName || f.title || f.number || f.name || '').toLowerCase();
    const isPDF = fileName.endsWith('.pdf');
    const isImage = fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.webp');
    const isWord = fileName.endsWith('.docx') || fileName.endsWith('.doc');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isPowerPoint = fileName.endsWith('.pptx') || fileName.endsWith('.ppt');
    const isOffice = isWord || isExcel || isPowerPoint;

    // Create blob URL for local files
    const blobUrl = useMemo(() => {
        if (f.isLocal && f.fileObj) {
            return URL.createObjectURL(f.fileObj);
        }
        return null;
    }, [f]);

    // Cleanup blob URL
    useEffect(() => {
        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [blobUrl]);

    if (!file) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#F1F5F9] w-full max-w-6xl h-[90vh] rounded-3xl shadow-sm overflow-hidden flex flex-col border border-white/20">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            {isImage ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-800 tracking-tight">{f.DocName || f.title || f.number || f.name}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{f.isLocal ? 'TÀI LIỆU VỪA TẢI LÊN' : f.Version ? `PHIÊN BẢN: ${f.Version}` : f.code || 'TÀI LIỆU DỰ ÁN'}{f.Size ? ` • ${f.Size}` : ''}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all" title="In tài liệu"><Printer className="w-5 h-5" /></button>
                        <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all" title="Tải xuống"><Download className="w-5 h-5" /></button>
                        <div className="w-px h-6 bg-gray-200 mx-2"></div>
                        <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 flex justify-center bg-[#525659]">
                    {(() => {
                        // Determine the viewable URL
                        const viewUrl = blobUrl || f.storage_path || f.StoragePath || f.url || null;
                        const canViewPDF = isPDF && viewUrl;
                        const canViewImage = isImage && viewUrl;

                        if (canViewPDF) {
                            return (
                                <div className="bg-white dark:bg-slate-800 w-full h-full rounded-sm shadow-sm overflow-hidden flex flex-col relative">
                                    <iframe
                                        src={`${viewUrl}#toolbar=0`}
                                        className="w-full h-full border-0"
                                        title="PDF Viewer"
                                    />
                                </div>
                            );
                        }

                        if (canViewImage) {
                            return (
                                <div className="bg-white dark:bg-slate-800 w-full h-full rounded-sm shadow-sm overflow-hidden flex items-center justify-center p-4 bg-gray-100">
                                    <img src={viewUrl} crossOrigin="anonymous" className="max-w-full max-h-full object-contain shadow-sm" alt="Preview" />
                                </div>
                            );
                        }

                        if (isOffice) {
                            // Office Viewer requires a public URL
                            if (f.isLocal || blobUrl) {
                                return (
                                    <div className="bg-white dark:bg-slate-800 w-full max-w-5xl shadow-sm rounded-sm overflow-hidden flex flex-col h-fit">
                                        <div className="bg-[#217346] text-white px-4 py-1 text-xs font-medium uppercase tracking-tighter">Office Viewer</div>
                                        <div className="overflow-x-auto p-4">
                                            <p className="text-gray-500 text-sm mb-4">
                                                Tài liệu Office vừa tải lên chưa được lưu trên hệ thống lưu trữ (chưa có đường dẫn công khai) nên không thể xem trực tiếp qua Office Web Viewer. Vui lòng bấm lưu để hệ thống tải file lên đám mây, sau đó bạn có thể xem trực tiếp.
                                            </p>
                                        </div>
                                    </div>
                                );
                            }

                            if (viewUrl) {
                                const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewUrl)}`;
                                return (
                                    <div className="bg-white dark:bg-slate-800 w-full h-full rounded-sm shadow-sm overflow-hidden flex flex-col relative">
                                        <iframe
                                            src={officeUrl}
                                            className="w-full h-full border-0"
                                            title="Office Viewer"
                                        />
                                    </div>
                                );
                            }
                        }

                        // Fallback — try to embed if we have a URL
                        if (viewUrl && !f.isLocal) {
                            return (
                                <div className="bg-white dark:bg-slate-800 w-full h-full rounded-sm shadow-sm overflow-hidden flex flex-col relative">
                                    <iframe
                                        src={viewUrl}
                                        className="w-full h-full border-0"
                                        title="Document Viewer"
                                    />
                                </div>
                            );
                        }

                        // No URL available — show placeholder
                        return (
                            <div className="bg-white dark:bg-slate-800 w-full max-w-[800px] min-h-[1100px] shadow-sm p-[60px] text-gray-800 font-serif leading-relaxed">
                                <div className="flex justify-between mb-12 italic text-sm">
                                    <div>BAN QLDA ĐẦU TƯ CÔNG<br /><b>SỐ: {f.code || f.number || '00/BQL'}</b></div>
                                    <div className="text-right">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />Độc lập - Tự do - Hạnh phúc</div>
                                </div>
                                <div className="text-center mb-10">
                                    <h2 className="text-xl font-bold uppercase tracking-widest">{f.title || f.name || 'VĂN BẢN TRÌNH DUYỆT'}</h2>
                                </div>
                                <div className="space-y-6 text-justify">
                                    <p className="p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100 font-sans italic">
                                        Hệ thống hiện tại hỗ trợ hiển thị nội dung thực cho file PDF và Hình ảnh.
                                        Đối với file thiết kế (CAD, BIM), vui lòng sử dụng phần mềm chuyên dụng trên máy tính.
                                    </p>
                                    <p>Căn cứ tình hình triển khai thực tế của dự án, Ban Quản lý báo cáo nội dung sau:</p>
                                    <div className="h-4 bg-gray-50 rounded w-full animate-pulse"></div>
                                    <div className="h-4 bg-gray-50 rounded w-3/4 animate-pulse"></div>
                                    <div className="mt-20 flex justify-between">
                                        <div className="text-center font-bold">NGƯỜI LẬP BIỂU</div>
                                        <div className="text-center font-bold">GIÁM ĐỐC BAN</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;
