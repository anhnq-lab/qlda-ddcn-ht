import React, { useMemo } from 'react';
import { ChevronRight, Search, FolderOpen, Upload, Eye, Download, Loader2, PenTool } from 'lucide-react';
import type { CDEFolder, CDEDocument } from '../types';
import { getStatusColor, getStatusLabel } from '../constants';
import { getFileIcon } from '@/utils/fileIcons';

interface CDEDocumentTableProps {
    folders: CDEFolder[];
    activeFolder: CDEFolder | undefined;
    activeFolderId: string | null;
    docs: CDEDocument[];
    isLoading: boolean;
    searchQuery: string;
    selectedDocId: number | null;
    onSearchChange: (q: string) => void;
    onSelectDoc: (doc: CDEDocument) => void;
    onPreview: (doc: CDEDocument) => void;
    onDownload: (doc: CDEDocument) => void;
    onSign?: (doc: CDEDocument) => void;
    onUpload: () => void;
    onFolderClick: (folderId: string) => void;
    selectedIds?: number[];
    onToggleSelect?: (docId: number) => void;
}

const CDEDocumentTable: React.FC<CDEDocumentTableProps> = ({
    folders, activeFolder, activeFolderId, docs, isLoading,
    searchQuery, selectedDocId, onSearchChange, onSelectDoc, onPreview, onDownload, onSign, onUpload, onFolderClick,
    selectedIds = [], onToggleSelect,
}) => {

    const breadcrumbs = useMemo(() => {
        const path: CDEFolder[] = [];
        let current = activeFolder;
        while (current) {
            path.unshift(current);
            if (!current.parent_id) break;
            current = folders.find(f => f.id === current!.parent_id);
        }
        return path;
    }, [activeFolder, folders]);

    const filteredDocs = useMemo(() => {
        if (!searchQuery.trim()) return docs;
        const q = searchQuery.toLowerCase();
        return docs.filter(d => d.doc_name.toLowerCase().includes(q));
    }, [docs, searchQuery]);

    return (
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden min-w-0">
            {/* Toolbar */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 min-w-0">
                    {breadcrumbs.map((f, i) => (
                        <React.Fragment key={f.id}>
                            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600 shrink-0" />}
                            <span
                                className={`truncate ${i === breadcrumbs.length - 1 ? 'font-bold text-gray-800 dark:text-slate-100' : 'hover:text-blue-600 cursor-pointer text-xs'}`}
                                onClick={() => onFolderClick(f.id)}
                            >
                                {f.name}
                            </span>
                        </React.Fragment>
                    ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-xs w-48 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all dark:text-slate-200"
                        />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                        {filteredDocs.length} tài liệu
                    </span>
                </div>
            </div>

            {/* Document Table */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-gray-400">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
                            <FolderOpen className="w-10 h-10 text-gray-200 dark:text-slate-400" />
                        </div>
                        <h3 className="text-base font-bold text-gray-600 dark:text-slate-300 mb-1">Thư mục trống</h3>
                        <p className="text-sm text-gray-400 dark:text-slate-400 mb-4">
                            {searchQuery ? 'Không tìm thấy tài liệu phù hợp' : 'Tải lên tài liệu đầu tiên vào thư mục này'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={onUpload}
                                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            >
                                <Upload className="w-4 h-4 inline mr-2" />Tải lên ngay
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                {onToggleSelect && (
                                    <th className="px-3 py-3 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            checked={filteredDocs.length > 0 && selectedIds.length === filteredDocs.length}
                                            onChange={() => {
                                                if (selectedIds.length === filteredDocs.length) filteredDocs.forEach(d => onToggleSelect(d.doc_id));
                                                else filteredDocs.filter(d => !selectedIds.includes(d.doc_id)).forEach(d => onToggleSelect(d.doc_id));
                                            }}
                                            className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                        />
                                    </th>
                                )}
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Tên tài liệu</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Phiên bản</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Trạng thái</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Người nộp</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Ngày nộp</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredDocs.map((doc) => {
                                const fileInfo = getFileIcon(doc.doc_name);
                                const FileTypeIcon = fileInfo.icon;
                                const isSelected = selectedDocId === doc.doc_id;
                                const isChecked = selectedIds.includes(doc.doc_id);
                                const statusColor = getStatusColor(doc.cde_status || 'S0');

                                return (
                                    <tr
                                        key={doc.doc_id}
                                        onClick={() => onSelectDoc(doc)}
                                        className={`group cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-slate-700/50 ${isSelected ? 'bg-primary-50/70 dark:bg-primary-900/20' : ''} ${isChecked ? 'bg-primary-50/50 dark:bg-primary-900/15' : ''}`}
                                    >
                                        {onToggleSelect && (
                                            <td className="px-3 py-3.5">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={() => onToggleSelect(doc.doc_id)}
                                                    className="w-3.5 h-3.5 rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                                />
                                            </td>
                                        )}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${fileInfo.bg} shrink-0`}>
                                                    <FileTypeIcon className={`w-5 h-5 ${fileInfo.color}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-800 dark:text-slate-100 text-sm truncate">{doc.doc_name}</p>
                                                    <p className="text-[10px] text-gray-400 dark:text-slate-400 font-medium mt-0.5">
                                                        {doc.size || '—'} {doc.discipline ? `• ${doc.discipline}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className="text-[11px] font-bold text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2.5 py-1 rounded-full font-mono">
                                                {doc.version || 'P01.01'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
                                                <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                                                    {getStatusLabel(doc.cde_status || 'S0')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-slate-400 font-medium truncate max-w-[120px]">
                                            {doc.submitted_by || doc.uploaded_by || '—'}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-slate-400 font-medium">
                                            {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString('vi-VN') : '—'}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onPreview(doc); }}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="Xem trước"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {onSign && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onSign(doc); }}
                                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                                        title="Ký số CA"
                                                    >
                                                        <PenTool className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDownload(doc); }}
                                                    className="p-1.5 text-gray-400 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Tải xuống"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CDEDocumentTable;
