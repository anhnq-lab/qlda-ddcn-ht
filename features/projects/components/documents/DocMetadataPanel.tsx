import React from 'react';
import { Document } from '@/types';
import { Eye, Download, FileCheck, Trash2 } from 'lucide-react';

interface DocMetadataPanelProps {
    doc: Document;
    meta: Record<string, any>;
    onMetaChange: (field: string, value: string) => void;
    onSave: () => void;
    onClose: () => void;
    onPreview: () => void;
    onDelete?: () => void;
    savingMeta: boolean;
}

export const DocMetadataPanel: React.FC<DocMetadataPanelProps> = ({
    doc, meta, onMetaChange, onSave, onClose, onPreview, onDelete, savingMeta
}) => {
    return (
        <div className="mx-3 mb-3 p-5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-700 shadow-inner space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* File info row */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-slate-700">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Tệp đính kèm</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{doc.DocName}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onPreview(); }}
                        className="p-2 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
                        title="Xem"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); /* download */ }}
                        className="p-2 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm"
                        title="Tải về"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">

                <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Loại văn bản</label>
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={meta.doc_type || ''}
                            onChange={e => onMetaChange('doc_type', e.target.value)}
                            placeholder="VD: Quyết định, Tờ trình"
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all outline-none"
                        />
                        <div className="flex flex-wrap gap-1.5">
                            {['Quyết định', 'Tờ trình', 'Báo cáo', 'Thông báo', 'Công văn'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => onMetaChange('doc_type', t)}
                                    className="px-2 py-1 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded transition-colors"
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Số, ký hiệu văn bản</label>
                    <input
                        type="text"
                        value={meta.document_number || ''}
                        onChange={e => onMetaChange('document_number', e.target.value)}
                        placeholder="VD: 123/QĐ-TTg"
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all outline-none"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Ký hiệu văn bản</label>
                    <input
                        type="text"
                        value={meta.document_symbol || ''}
                        onChange={e => onMetaChange('document_symbol', e.target.value)}
                        placeholder="VD: QĐ-BQLDA"
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all outline-none"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Ngày ban hành</label>
                    <input
                        type="date"
                        value={meta.issue_date || ''}
                        onChange={e => onMetaChange('issue_date', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all outline-none"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Cơ quan ban hành</label>
                    <input
                        type="text"
                        value={meta.issuing_authority || ''}
                        onChange={e => onMetaChange('issuing_authority', e.target.value)}
                        placeholder="VD: BQL Dự án"
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all outline-none"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Người ký</label>
                    <input
                        type="text"
                        value={meta.signer || ''}
                        onChange={e => onMetaChange('signer', e.target.value)}
                        placeholder="VD: Nguyễn Văn A"
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all outline-none"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Đơn vị thảo</label>
                    <input
                        type="text"
                        value={meta.drafting_department || ''}
                        onChange={e => onMetaChange('drafting_department', e.target.value)}
                        placeholder="VD: Phòng Kỹ thuật"
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all outline-none"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Người soạn thảo</label>
                    <input
                        type="text"
                        value={meta.drafter || ''}
                        onChange={e => onMetaChange('drafter', e.target.value)}
                        placeholder="VD: Lê Văn B"
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all outline-none"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Người cập nhật</label>
                    <input
                        type="text"
                        value={meta.updated_by || ''}
                        onChange={e => onMetaChange('updated_by', e.target.value)}
                        placeholder="VD: Hệ thống"
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all outline-none"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Trạng thái hiệu lực</label>
                    <select
                        value={meta.legal_status || 'active'}
                        onChange={e => onMetaChange('legal_status', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all outline-none"
                    >
                        <option value="active">✅ Còn hiệu lực</option>
                        <option value="expired">❌ Hết hiệu lực</option>
                        <option value="replaced">🔄 Đã thay thế</option>
                        <option value="draft">📝 Bản nháp</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Trích yếu nội dung</label>
                    <textarea
                        value={meta.summary || ''}
                        onChange={e => onMetaChange('summary', e.target.value)}
                        placeholder="Tóm tắt nội dung chính..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all outline-none resize-none"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Ghi chú thêm</label>
                    <textarea
                        value={meta.notes || ''}
                        onChange={e => onMetaChange('notes', e.target.value)}
                        placeholder="Nhập ghi chú..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all outline-none resize-none"
                    />
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                <div className="text-xs font-mono text-gray-400 dark:text-slate-500 flex gap-4">
                    {doc.Size && <span>SIZE: {doc.Size}</span>}
                    {doc.Version && <span>VER: {doc.Version}</span>}
                </div>
                <div className="flex gap-2">
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-all"
                        >
                            <Trash2 className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                            Xóa văn bản
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSave(); }}
                        disabled={savingMeta}
                        className="px-5 py-2 text-sm font-bold bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-all shadow-sm shadow-primary-200 disabled:opacity-50 flex items-center gap-2"
                    >
                        <FileCheck className="w-4 h-4" />
                        {savingMeta ? 'Đang lưu...' : 'Lưu thông tin'}
                    </button>
                </div>
            </div>
        </div>
    );
};

