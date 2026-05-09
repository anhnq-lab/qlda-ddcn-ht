import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import type { CDEFolder } from '../types';
import { CDE_DISCIPLINES, CDE_DOC_TYPES, formatFileSize } from '../constants';

interface CDESubmitModalProps {
    isOpen: boolean;
    folder: CDEFolder | undefined;
    folders: CDEFolder[];
    onClose: () => void;
    onSubmit: (data: {
        file: File;
        folderId: string;
        discipline: string;
        docType: string;
        notes: string;
    }) => void;
    isPending: boolean;
}

const CDESubmitModal: React.FC<CDESubmitModalProps> = ({
    isOpen, folder, folders, onClose, onSubmit, isPending,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [folderId, setFolderId] = useState(folder?.id || '');
    const [discipline, setDiscipline] = useState('');
    const [docType, setDocType] = useState('');
    const [notes, setNotes] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    // Update folder when prop changes
    React.useEffect(() => {
        if (folder?.id) setFolderId(folder.id);
    }, [folder?.id]);

    if (!isOpen) return null;

    const wipFolders = folders.filter(f => f.container_type === 'WIP' && f.parent_id !== null);
    const canSubmit = file && folderId && discipline && docType;

    const handleSubmit = () => {
        if (!canSubmit || !file) return;
        onSubmit({ file, folderId, discipline, docType, notes });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-bg-surface rounded-2xl shadow-sm w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-bg-subtle">
                    <div>
                        <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Nộp hồ sơ</h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            Chọn file, điền thông tin và nộp vào CDE
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* File Upload */}
                    <div>
                        <label className="text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                            Tệp đính kèm <span className="text-red-500">*</span>
                        </label>
                        {file ? (
                            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate">{file.name}</p>
                                    <p className="text-[10px] text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                                <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-gray-400 hover:text-red-500">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileRef.current?.click()}
                                className="border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 dark:hover:border-blue-500 dark:hover:bg-blue-900/10 transition-all"
                            >
                                <Upload className="w-10 h-10 text-gray-300 dark:text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Click để chọn file hoặc kéo thả vào đây</p>
                                <p className="text-[10px] text-gray-400 mt-1">PDF, DOCX, DWG, ZIP, hình ảnh — Max 50MB</p>
                            </div>
                        )}
                        <input ref={fileRef} type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
                    </div>

                    {/* Folder Select */}
                    <div>
                        <label className="text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                            Thư mục nộp hồ sơ <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={folderId}
                            onChange={(e) => setFolderId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-bg-surface border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                        >
                            <option value="">— Chọn thư mục —</option>
                            {wipFolders.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Discipline + Doc Type */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                                Lĩnh vực <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={discipline}
                                onChange={(e) => setDiscipline(e.target.value)}
                                className="w-full px-3 py-2.5 bg-bg-surface border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-800 dark:text-slate-200"
                            >
                                <option value="">— Chọn —</option>
                                {CDE_DISCIPLINES.map(d => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                                Loại hồ sơ <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={docType}
                                onChange={(e) => setDocType(e.target.value)}
                                className="w-full px-3 py-2.5 bg-bg-surface border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-800 dark:text-slate-200"
                            >
                                <option value="">— Chọn —</option>
                                {CDE_DOC_TYPES.map(d => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                            Ghi chú
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Mô tả ngắn gọn về tài liệu, nội dung đính kèm..."
                            className="w-full px-4 py-2.5 bg-bg-surface border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-800 dark:text-slate-200 resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                        />
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-2.5 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-primary-700 dark:text-primary-300 leading-relaxed">
                            Hồ sơ nộp sẽ được gửi qua quy trình kiểm tra: <strong>Tư vấn giám sát → Chuyên viên Ban QLDA → Trưởng phòng → Lãnh đạo</strong>. Đảm bảo tài liệu đầy đủ trước khi nộp.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3 bg-gray-50/80 dark:bg-slate-800">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || isPending}
                        className="px-6 py-2.5 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Nộp hồ sơ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CDESubmitModal;
