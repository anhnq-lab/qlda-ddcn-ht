// ═══════════════════════════════════════════════════════════════
// CDE Archive View — "Kho lưu trữ số hóa hồ sơ"
// Integrated from DocumentManager into CDE Module
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef, useMemo } from 'react';
import {
    Folder, File as FileIcon, Download, Eye, PenTool, Box,
    History, Search, Upload, Image as ImageIcon, X, HardDrive,
    CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { getFileIcon } from '@/utils/fileIcons';
import CDEFilePreview from './CDEFilePreview';
import CDEDigitalSign from './CDEDigitalSign';

// Static folder structure for QLDA document categories
const ARCHIVE_FOLDERS = [
    { id: 'F1', name: '01. Hồ sơ Pháp lý dự án' },
    { id: 'F2', name: '02. Hồ sơ Thiết kế & Khảo sát' },
    { id: 'F3', name: '03. Hồ sơ Đấu thầu' },
    { id: 'F4', name: '04. Hồ sơ Quản lý chất lượng' },
    { id: 'F5', name: '05. Hồ sơ Thanh quyết toán' },
    { id: 'F6', name: '06. Mô hình BIM & Bản vẽ' },
    { id: 'F7', name: '07. Hồ sơ Hoàn công' },
];

type FilterType = 'all' | 'pdf' | 'office' | 'bim' | 'image';

interface ArchiveDoc {
    id: number;
    name: string;
    size: string;
    version: string;
    uploadDate: string;
    storagePath?: string;
    publicUrl?: string;
    isLocal?: boolean;
    fileObj?: File;
    history?: Array<{ version: string; date: string; user: string; size: string }>;
}

interface CDEArchiveViewProps {
    projectId: string;
    projectName: string;
}

const FilterChip: React.FC<{ label: string; active: boolean; onClick: () => void; icon?: React.ReactNode }> = ({ label, active, onClick, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${active
            ? 'bg-primary-600 text-white border-blue-600 shadow-md shadow-primary-200 dark:shadow-primary-900/30'
            : 'bg-bg-surface text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600 hover:bg-bg-subtle dark:hover:bg-slate-700'
            }`}
    >
        {icon}
        {label}
    </button>
);

// Version History Modal
const VersionHistoryModal: React.FC<{ file: ArchiveDoc; onClose: () => void }> = ({ file, onClose }) => {
    const history = [
        { version: file.version, date: file.uploadDate, user: 'Admin', size: file.size, isCurrent: true },
        ...(file.history || []).map(h => ({ ...h, isCurrent: false }))
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in zoom-in-95">
            <div className="bg-bg-surface w-full max-w-2xl rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-bg-subtle">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200">Lịch sử phiên bản</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 truncate max-w-md">{file.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500"><X className="w-5 h-5" /></button>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-bg-subtle text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4">Phiên bản</th>
                            <th className="px-6 py-4">Thời gian</th>
                            <th className="px-6 py-4">Người cập nhật</th>
                            <th className="px-6 py-4 text-right">Dung lượng</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {history.map((ver, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-md font-mono text-xs font-bold ${ver.isCurrent ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'}`}>
                                            {ver.version}
                                        </span>
                                        {ver.isCurrent && <span className="text-[10px] uppercase font-bold text-emerald-600 bg-bg-surface border border-emerald-200 dark:border-emerald-800 px-1.5 rounded">Hiện tại</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-slate-400">{ver.date}</td>
                                <td className="px-6 py-4 font-medium text-gray-800 dark:text-slate-300">{ver.user}</td>
                                <td className="px-6 py-4 text-right font-mono text-gray-500 dark:text-slate-400">{ver.size}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4 bg-bg-subtle border-t border-gray-200 dark:border-slate-700 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-bg-surface border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-600 dark:text-slate-300">Đóng</button>
                </div>
            </div>
        </div>
    );
};

const CDEArchiveView: React.FC<CDEArchiveViewProps> = ({ projectId, projectName }) => {
    const [selectedFolder, setSelectedFolder] = useState<string>('F1');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [previewFile, setPreviewFile] = useState<ArchiveDoc | null>(null);
    const [historyFile, setHistoryFile] = useState<ArchiveDoc | null>(null);
    const [signFile, setSignFile] = useState<ArchiveDoc | null>(null);
    const [uploadedDocs, setUploadedDocs] = useState<Record<string, ArchiveDoc[]>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    React.useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }
    }, [toast]);

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !selectedFolder) return;

        const folderKey = `${projectId}-${selectedFolder}`;
        const currentDocs = [...(uploadedDocs[folderKey] || [])];
        let newCount = 0;
        let updatedCount = 0;

        for (const file of Array.from(files) as File[]) {
            // Upload to Supabase Storage
            const ext = file.name.split('.').pop();
            const storagePath = `archive/${projectId}/${selectedFolder}/${Date.now()}.${ext}`;
            try {
                const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);

                const existingIdx = currentDocs.findIndex(d => d.name === file.name);
                if (existingIdx > -1) {
                    // Version update
                    const old = currentDocs[existingIdx];
                    const oldVer = parseFloat(old.version.replace('v', ''));
                    const newVer = `v${(oldVer + 1.0).toFixed(1)}`;
                    currentDocs[existingIdx] = {
                        ...old,
                        version: newVer,
                        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                        uploadDate: new Date().toLocaleDateString('vi-VN'),
                        storagePath, publicUrl: urlData.publicUrl,
                        isLocal: true, fileObj: file,
                        history: [{ version: old.version, date: old.uploadDate, user: 'Admin', size: old.size }, ...(old.history || [])],
                    };
                    updatedCount++;
                } else {
                    // New file
                    currentDocs.unshift({
                        id: Date.now() + Math.random(),
                        name: file.name,
                        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                        version: 'v1.0',
                        uploadDate: new Date().toLocaleDateString('vi-VN'),
                        storagePath, publicUrl: urlData.publicUrl,
                        isLocal: true, fileObj: file, history: [],
                    });
                    newCount++;
                }
            } catch (err: any) {
                console.error('Upload error:', err);
                setToast({ message: `Tải lên thất bại: ${err.message}`, type: 'error' });
            }
        }

        setUploadedDocs(prev => ({ ...prev, [folderKey]: currentDocs }));
        e.target.value = '';

        if (newCount > 0 || updatedCount > 0) {
            const parts = [];
            if (newCount > 0) parts.push(`${newCount} tài liệu mới`);
            if (updatedCount > 0) parts.push(`${updatedCount} cập nhật phiên bản`);
            setToast({ message: `Đã tải lên: ${parts.join(', ')}`, type: 'success' });
        }
    };

    // Get docs for current folder
    const folderKey = `${projectId}-${selectedFolder}`;
    const folderDocs = uploadedDocs[folderKey] || [];

    // Apply filters
    const filteredDocs = useMemo(() => {
        let result = folderDocs;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(d => d.name.toLowerCase().includes(q));
        }
        if (filterType !== 'all') {
            result = result.filter(d => {
                const ext = d.name.split('.').pop()?.toLowerCase() || '';
                if (filterType === 'pdf') return ext === 'pdf';
                if (filterType === 'office') return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
                if (filterType === 'bim') return ['ifc', 'rvt', 'dwg'].includes(ext);
                if (filterType === 'image') return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                return true;
            });
        }
        return result;
    }, [folderDocs, searchQuery, filterType]);

    return (
        <div className="flex flex-col h-full">
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} accept=".pdf,.docx,.doc,.xlsx,.xls,.ifc,.png,.jpg,.jpeg" />

            {/* Search & Filter Bar */}
            <div className="flex items-stretch gap-4 mb-4">
                <div className="flex-1 bg-bg-surface rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex items-center px-4 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        type="text" placeholder="Tìm kiếm tài liệu theo tên..."
                        className="flex-1 h-full outline-none text-sm font-medium text-gray-700 dark:text-slate-300 placeholder-gray-400 bg-transparent py-3"
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="p-1 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                    )}
                </div>
                <button onClick={handleUploadClick} className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:shadow-xl hover:shadow-primary-200/50 transition-all">
                    <Upload className="w-5 h-5" /> Tải lên
                </button>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase mr-2 shrink-0">Bộ lọc:</span>
                <FilterChip label="Tất cả" active={filterType === 'all'} onClick={() => setFilterType('all')} />
                <FilterChip label="PDF" active={filterType === 'pdf'} onClick={() => setFilterType('pdf')} icon={<FileIcon className="w-3 h-3" />} />
                <FilterChip label="Office" active={filterType === 'office'} onClick={() => setFilterType('office')} icon={<FileIcon className="w-3 h-3" />} />
                <FilterChip label="BIM" active={filterType === 'bim'} onClick={() => setFilterType('bim')} icon={<Box className="w-3 h-3" />} />
                <FilterChip label="Hình ảnh" active={filterType === 'image'} onClick={() => setFilterType('image')} icon={<ImageIcon className="w-3 h-3" />} />
            </div>

            {/* Main Content */}
            <div className="flex flex-1 gap-4 overflow-hidden">
                {/* Folder Tree */}
                <div className="w-72 bg-bg-surface rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 flex flex-col overflow-y-auto shrink-0">
                    <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Cấu trúc thư mục</h3>
                    <div className="space-y-1.5">
                        {ARCHIVE_FOLDERS.map(folder => {
                            const count = (uploadedDocs[`${projectId}-${folder.id}`] || []).length;
                            return (
                                <div
                                    key={folder.id}
                                    onClick={() => setSelectedFolder(folder.id)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${selectedFolder === folder.id
                                        ? 'bg-primary-600 text-white shadow-sm shadow-primary-100 dark:shadow-primary-900/30'
                                        : 'text-gray-500 dark:text-slate-400 hover:bg-bg-subtle dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <Folder className={`w-4 h-4 ${selectedFolder === folder.id ? 'fill-white/30' : ''}`} />
                                    <span className="text-xs font-bold truncate flex-1">{folder.name}</span>
                                    {count > 0 && (
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${selectedFolder === folder.id ? 'bg-white/20 text-white' : 'bg-emerald-500 text-white'}`}>
                                            {count}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Document Table */}
                <div className="flex-1 bg-bg-surface rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-bg-subtle flex justify-between items-center">
                        <h3 className="font-black text-gray-800 dark:text-slate-200 text-sm flex items-center gap-2 uppercase tracking-widest">
                            <Folder className="w-4 h-4 text-blue-500" />
                            {ARCHIVE_FOLDERS.find(f => f.id === selectedFolder)?.name}
                        </h3>
                        <span className="bg-bg-surface text-gray-400 text-[10px] px-3 py-1 rounded-xl font-black border border-gray-200 dark:border-slate-600">
                            {filteredDocs.length} TÀI LIỆU
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filteredDocs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-4">
                                <div className="w-24 h-24 bg-bg-subtle dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
                                    <Folder className="w-10 h-10 text-gray-300 dark:text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-2">Chưa có tài liệu nào</h3>
                                <p className="text-gray-400 text-sm text-center max-w-xs mb-6">
                                    {searchQuery ? 'Không tìm thấy tài liệu phù hợp' : 'Tải lên tài liệu đầu tiên vào thư mục này'}
                                </p>
                                {!searchQuery && (
                                    <button onClick={handleUploadClick} className="px-6 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-100 transition-colors">
                                        Tải lên ngay
                                    </button>
                                )}
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-bg-surface text-[10px] uppercase font-black text-gray-400 dark:text-slate-400 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 tracking-[0.1em]">
                                    <tr>
                                        <th className="px-5 py-4">Tên tài liệu</th>
                                        <th className="px-5 py-4 w-28 text-center">Phiên bản</th>
                                        <th className="px-5 py-4 w-36">Ngày cập nhật</th>
                                        <th className="px-5 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                    {filteredDocs.map((doc) => {
                                        const fIcon = getFileIcon(doc.name);
                                        const FIcon = fIcon.icon;
                                        const isBIM = doc.name.toLowerCase().endsWith('.ifc');
                                        return (
                                            <tr key={doc.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-700 transition-all group">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2.5 rounded-xl shadow-sm ${isBIM ? 'bg-orange-50 text-orange-600' : fIcon.bg} ${doc.isLocal ? 'ring-2 ring-emerald-400/30' : ''}`}>
                                                            {isBIM ? <Box className="w-5 h-5" /> : <FIcon className={`w-5 h-5 ${fIcon.color}`} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 dark:text-slate-200 text-sm flex items-center gap-2">
                                                                {doc.name}
                                                                {doc.isLocal && <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-black uppercase">Mới</span>}
                                                            </p>
                                                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{doc.size}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span className="text-[11px] font-black text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full font-mono border border-gray-200 dark:border-slate-600">
                                                        {doc.version}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400">{doc.uploadDate}</td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button onClick={() => setPreviewFile(doc)} className="p-2 bg-bg-surface text-blue-600 rounded-lg hover:bg-primary-600 hover:text-white shadow-sm border border-gray-200 dark:border-slate-600 transition-all" title="Xem">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setSignFile(doc)} className="p-2 bg-bg-surface text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white shadow-sm border border-gray-200 dark:border-slate-600 transition-all" title="Ký số">
                                                            <PenTool className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setHistoryFile(doc)} className="p-2 bg-bg-surface text-orange-600 rounded-lg hover:bg-orange-600 hover:text-white shadow-sm border border-gray-200 dark:border-slate-600 transition-all" title="Lịch sử">
                                                            <History className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 bg-bg-surface text-gray-400 rounded-lg hover:bg-gray-600 hover:text-white shadow-sm border border-gray-200 dark:border-slate-600 transition-all" title="Tải xuống">
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
            </div>

            {/* Modals */}
            {previewFile && (
                <CDEFilePreview
                    file={{ doc_name: previewFile.name, size: previewFile.size, Version: previewFile.version, publicUrl: previewFile.publicUrl, isLocal: previewFile.isLocal, fileObj: previewFile.fileObj }}
                    onClose={() => setPreviewFile(null)}
                />
            )}
            {historyFile && (
                <VersionHistoryModal file={historyFile} onClose={() => setHistoryFile(null)} />
            )}
            {signFile && (
                <CDEDigitalSign
                    file={{ doc_name: signFile.name, size: signFile.size }}
                    isOpen={true}
                    onClose={() => setSignFile(null)}
                    onSignComplete={(name) => setToast({ message: `Ký số thành công: ${name}`, type: 'success' })}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-sm text-sm font-bold flex items-center gap-2 animate-in slide-in-from-bottom-4 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success'
                        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                        : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {toast.message}
                    <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 p-0.5">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default CDEArchiveView;
