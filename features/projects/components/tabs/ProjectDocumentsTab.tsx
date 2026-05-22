import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
    FileText, ChevronRight, ChevronDown,
    Upload, Search, FolderOpen,
    CheckCircle2, AlertCircle, Clock,
    Target, Building2, HardHat, RefreshCw,
    Plus, X, FileCheck, ClipboardList
} from 'lucide-react';
import {
    ProjectStage, InvestmentPolicyDecision, FeasibilityStudy,
    Document, DocCategory, ISO19650Status
} from '@/types';
import { generateFromImage } from '@/services/ai/geminiProxy';
import { supabase } from '@/lib/supabase';
import { FilePreviewModal } from '../FilePreviewModal';
import { getFileIcon } from '@/utils/fileIcons';
import { getStageColor } from '@/utils/stageColors';
import { formatCurrency } from '@/utils/format';

// Sub-components
import { useProjectDocuments } from '../../hooks/useProjectDocuments';
import { VersionHistoryModal } from '../documents/VersionHistoryModal';
import { DocMetadataPanel } from '../documents/DocMetadataPanel';
import { UploadDocumentSlidePanel } from '../documents/UploadDocumentSlidePanel';
import { StatCard } from '../../../../components/ui';
import { useSlidePanel } from '../../../../context/SlidePanelContext';

interface ProjectDocumentsTabProps {
    projectID: string;
    projectStage?: ProjectStage;
    investmentPolicy?: InvestmentPolicyDecision;
    feasibilityStudy?: FeasibilityStudy;
    approvalDecision?: {
        number: string;
        date: string;
        authority: string;
    };
}

// Legal document types by project stage — with matching keywords for auto-detection
const LEGAL_DOC_CATEGORIES = [
    {
        stage: ProjectStage.Preparation,
        label: 'Chuẩn bị dự án',
        color: 'amber',
        icon: Target,
        docs: [
            { name: 'QĐ Chủ trương đầu tư', keywords: ['chủ trương', 'qđ chủ trương'] },
            { name: 'QĐ phê duyệt Quy hoạch', keywords: ['quy hoạch'] },
            { name: 'Báo cáo NCKT (F/S)', keywords: ['nghiên cứu khả thi', 'nckt', 'f/s', 'bcnckt'] },
            { name: 'Thiết kế cơ sở', keywords: ['thiết kế cơ sở', 'tkcs'] },
            { name: 'ĐTM', keywords: ['đánh giá tác động', 'đtm', 'môi trường'] },
        ]
    },
    {
        stage: ProjectStage.Execution,
        label: 'Thực hiện dự án',
        color: 'emerald',
        icon: Building2,
        docs: [
            { name: 'TKKT', keywords: ['thiết kế kỹ thuật', 'tkkt'] },
            { name: 'TKBVTC', keywords: ['bản vẽ thi công', 'tkbvtc'] },
            { name: 'Dự toán', keywords: ['dự toán'] },
            { name: 'QĐ Phê duyệt TK-DT', keywords: ['phê duyệt thiết kế', 'phê duyệt dự toán'] },
            { name: 'HSMT / HSYC', keywords: ['hồ sơ mời thầu', 'hsmt', 'hồ sơ yêu cầu', 'hsyc'] },
            { name: 'QĐ Phê duyệt KQLCNT', keywords: ['kết quả lựa chọn', 'kqlcnt'] },
            { name: 'Hợp đồng XD', keywords: ['hợp đồng xây dựng', 'hđ xd'] },
            { name: 'GPXD', keywords: ['giấy phép xây dựng', 'gpxd'] },
            { name: 'PCCC', keywords: ['pccc', 'phòng cháy'] },
        ]
    },
    {
        stage: ProjectStage.Completion,
        label: 'Kết thúc xây dựng',
        color: 'blue',
        icon: HardHat,
        docs: [
            { name: 'Biên bản nghiệm thu', keywords: ['nghiệm thu'] },
            { name: 'QĐ Quyết toán', keywords: ['quyết toán'] },
            { name: 'Biên bản bàn giao', keywords: ['bàn giao'] },
            { name: 'Sổ tay vận hành', keywords: ['vận hành', 'sổ tay'] },
        ]
    }
];

export const ProjectDocumentsTab: React.FC<ProjectDocumentsTabProps> = ({
    projectID,
    projectStage = ProjectStage.Execution,
    investmentPolicy,
    feasibilityStudy,
    approvalDecision
}) => {
    // View modes
    const [activeFolderId, setActiveFolderId] = useState<string>('FLD-ROOT');
    const [expandedCategories, setExpandedCategories] = useState<string[]>([projectStage]);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [previewFile, setPreviewFile] = useState<any>(null);
    const [historyDoc, setHistoryDoc] = useState<Document | null>(null);

    // Upload
    const { openPanel, closePanel } = useSlidePanel();
    const [pendingDocType, setPendingDocType] = useState<string>('');

    // Doc metadata editing
    const [expandedDocIdx, setExpandedDocIdx] = useState<string | null>(null);
    const [editingMeta, setEditingMeta] = useState<Record<string, any>>({});
    const [savingMeta, setSavingMeta] = useState(false);
    const [extractingDoc, setExtractingDoc] = useState<string | null>(null);

    // Data from custom hook
    const {
        folders, documents, dbDocs, setDbDocs,
        uploadedDocs, setUploadedDocs, projectDocuments,
        isLoading, stats, matchDocToCategory, folderDocCount,
    } = useProjectDocuments(projectID, projectStage);

    // Search filter
    const filteredDocuments = useMemo(() => {
        if (!searchQuery.trim()) return projectDocuments;
        const q = searchQuery.toLowerCase();
        return projectDocuments.filter((d: any) => (d.DocName || d.doc_name || '').toLowerCase().includes(q));
    }, [projectDocuments, searchQuery]);

    // Toggle category expansion
    const toggleCategory = (stage: string) => {
        setExpandedCategories(prev =>
            prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
        );
    };

    // Upload handler using SlidePanel
    const handleUpload = (docTypeName?: string, docKey?: string) => {
        openPanel({
            id: 'upload-doc',
            title: 'Tải hồ sơ dự án',
            icon: <Upload size={14} />,
            width: 500,
            component: (
                <UploadDocumentSlidePanel 
                    projectId={projectID}
                    initialDocType={docTypeName}
                    docKey={docKey}
                    onUploadSuccess={(newDoc) => {
                        setDbDocs(prev => [newDoc, ...prev]);
                        closePanel('upload-doc');
                    }}
                />
            )
        });
    };

    // Save document metadata
    const handleSaveMetadata = async (docId: number, meta: Record<string, any>) => {
        setSavingMeta(true);
        try {
            const updateData: any = {};
            if (meta.document_number !== undefined) updateData.document_number = meta.document_number;
            if (meta.issue_date !== undefined) updateData.issue_date = meta.issue_date || null;
            if (meta.updated_by !== undefined) updateData.updated_by = meta.updated_by;
            if (meta.notes !== undefined) updateData.notes = meta.notes;
            if (meta.legal_status !== undefined) updateData.legal_status = meta.legal_status;
            if (meta.issuing_authority !== undefined) updateData.issuing_authority = meta.issuing_authority;
            if (meta.document_symbol !== undefined) updateData.document_symbol = meta.document_symbol;
            if (meta.summary !== undefined) updateData.summary = meta.summary;
            if (meta.signer !== undefined) updateData.signer = meta.signer;
            if (meta.drafter !== undefined) updateData.drafter = meta.drafter;
            if (meta.drafting_department !== undefined) updateData.drafting_department = meta.drafting_department;
            if (meta.doc_type !== undefined) updateData.doc_type = meta.doc_type;

            await (supabase.from('documents') as any).update(updateData).eq('doc_id', docId);
            setDbDocs(prev => prev.map(d => d.DocID === docId ? { ...d, ...meta } : d));
            setExpandedDocIdx(null);
            setEditingMeta({});
        } catch (err) {
            console.error('Save metadata failed:', err);
        } finally {
            setSavingMeta(false);
        }
    };

    // Delete document
    const handleDeleteDocument = async (docId: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa văn bản này? Dữ liệu sẽ không thể khôi phục.')) return;
        try {
            const { error } = await supabase.from('documents').delete().eq('doc_id', docId);
            if (error) throw error;
            
            setDbDocs(prev => prev.filter(d => d.DocID !== docId));
            setExpandedDocIdx(null);
            setEditingMeta(prev => {
                const newMeta = { ...prev };
                delete newMeta[docId.toString()];
                return newMeta;
            });
        } catch (err) {
            console.error('Delete document failed:', err);
            alert('Có lỗi xảy ra khi xóa văn bản!');
        }
    };

    // Compute legal doc stats
    const legalStats = useMemo(() => {
        const matched = projectDocuments.length;
        const missing = 0; // Removing missing stats since we only show uploaded docs
        const totalTypes = matched;
        const pct = 100;
        return { totalTypes, matched, missing, pct };
    }, [projectDocuments]);

    const statCards = [
        { label: 'Tổng loại VB', value: legalStats.totalTypes, icon: FileText, color: 'blue' as const },
        { label: 'Đã có', value: legalStats.matched, icon: CheckCircle2, color: 'emerald' as const },
        { label: 'Chưa có', value: legalStats.missing, icon: AlertCircle, color: 'amber' as const },
        { label: 'Hoàn thiện', value: `${legalStats.pct}%`, icon: Target, color: 'violet' as const },
    ];

    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500">

            {/* Header with View Toggle */}
            <div className="bg-bg-surface rounded-2xl border border-border mb-6 overflow-hidden">
                <div className="px-5 py-3 flex justify-between items-center border-b border-border">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-500" />
                        <span className="text-sm font-bold text-txt-primary">Văn bản pháp lý</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted w-4 h-4" />
                            <input
                                type="text" placeholder="Tìm kiếm..."
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-8 py-2 bg-bg-muted border border-border rounded-xl text-sm w-64 focus:ring-2 focus:ring-primary-500/20 outline-none text-txt-primary placeholder-txt-muted transition-all"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-primary">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => handleUpload()}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                        >
                            <Upload className="w-4 h-4" /> Tải lên
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ TABLE-BASED LEGAL DOCUMENTS VIEW ═══ */}
            <div className="space-y-4">

                    {/* Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                                <tr>
                                    <th className="px-3 py-2.5 text-slate-500 dark:text-slate-400 w-10">STT</th>
                                    <th className="px-3 py-2.5 text-slate-500 dark:text-slate-400 w-1/3">Tài liệu</th>
                                    <th className="px-3 py-2.5 text-slate-500 dark:text-slate-400 w-32">Số công văn</th>
                                    <th className="px-3 py-2.5 text-slate-500 dark:text-slate-400 w-28">Ngày ban hành</th>
                                    <th className="px-3 py-2.5 text-slate-500 dark:text-slate-400">Cơ quan ban hành</th>
                                    <th className="px-3 py-2.5 text-slate-500 dark:text-slate-400 w-20 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDocuments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-slate-700 flex items-center justify-center mb-4">
                                                    <FileText className="w-8 h-8 text-gray-300 dark:text-slate-500" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-800 dark:text-slate-200 mb-1">Chưa có tài liệu nào</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">Bảng dữ liệu đang trống, vui lòng tải tài liệu lên để hệ thống ghi nhận.</p>
                                                <button
                                                    onClick={() => handleUpload()}
                                                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 text-sm font-bold rounded-lg transition-colors"
                                                >
                                                    <Upload className="w-4 h-4" /> Tải tài liệu đầu tiên
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDocuments.map((doc: any, idx: number) => {
                                        const docKey = doc.DocID.toString();
                                        const isDocExpanded = expandedDocIdx === docKey;
                                        const fileInfo = getFileIcon(doc.DocName);
                                        const currentMeta = editingMeta[docKey] || {
                                            document_number: doc.document_number || '',
                                            issue_date: doc.issue_date || '',
                                            issuing_authority: doc.issuing_authority || '',
                                            updated_by: doc.updated_by || '',
                                            notes: doc.notes || '',
                                            legal_status: doc.legal_status || 'active',
                                            document_symbol: doc.document_symbol || '',
                                            summary: doc.summary || '',
                                            signer: doc.signer || '',
                                            drafter: doc.drafter || '',
                                            drafting_department: doc.drafting_department || '',
                                            doc_type: doc.doc_type || '',
                                        };

                                        const formatAuthority = (text: string) => {
                                            if (!text) return '—';
                                            const acronyms = ['UBND', 'HĐND', 'QLDA', 'BQLDA', 'SXD', 'STC', 'SKHĐT', 'CP', 'TTG', 'BXD', 'SXD'];
                                            if (text === text.toUpperCase()) {
                                                return text.split(' ').map((word, index) => {
                                                    if (acronyms.includes(word)) return word;
                                                    if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                                                    return word.toLowerCase();
                                                }).join(' ');
                                            }
                                            return text;
                                        };

                                        return (
                                            <React.Fragment key={docKey}>
                                                <tr
                                                    className={`border-b border-border cursor-pointer transition-colors ${isDocExpanded ? 'bg-primary-500/5' : 'hover:bg-bg-muted'}`}
                                                    onClick={() => {
                                                        setExpandedDocIdx(isDocExpanded ? null : docKey);
                                                        if (!isDocExpanded) {
                                                            setEditingMeta(prev => ({
                                                                ...prev,
                                                                [docKey]: {
                                                                    document_number: doc.document_number || '',
                                                                    issue_date: doc.issue_date || '',
                                                                    issuing_authority: doc.issuing_authority || '',
                                                                    updated_by: doc.updated_by || '',
                                                                    notes: doc.notes || '',
                                                                    legal_status: doc.legal_status || 'active',
                                                                    document_symbol: doc.document_symbol || '',
                                                                    summary: doc.summary || '',
                                                                    signer: doc.signer || '',
                                                                    drafter: doc.drafter || '',
                                                                    drafting_department: doc.drafting_department || '',
                                                                    doc_type: doc.doc_type || '',
                                                                }
                                                            }));
                                                        }
                                                    }}
                                                >
                                                    {/* STT */}
                                                    <td className="px-3 py-2.5 text-xs text-txt-muted text-center font-bold">
                                                        {idx + 1}
                                                    </td>
                                                    {/* Tài liệu */}
                                                    <td className="px-3 py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-7 h-7 rounded-xl ${fileInfo.bg} flex items-center justify-center shrink-0`}>
                                                                 <fileInfo.icon className={`w-3.5 h-3.5 ${fileInfo.color}`} />
                                                            </div>
                                                            <span className="text-sm text-txt-primary font-bold line-clamp-2" title={doc.DocName}>
                                                                {doc.DocName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {/* Số công văn */}
                                                    <td className="px-3 py-2.5 text-xs font-semibold text-txt-secondary">
                                                        {doc.document_number || '—'}
                                                    </td>
                                                    {/* Ngày ban hành */}
                                                    <td className="px-3 py-2.5 text-xs text-txt-muted">
                                                        {doc.issue_date || doc.UploadDate || '—'}
                                                    </td>
                                                    {/* CQ ban hành */}
                                                    <td className="px-3 py-2.5 text-xs text-txt-muted pr-4">
                                                        <span className="normal-case line-clamp-2" title={doc.issuing_authority}>{formatAuthority(doc.issuing_authority)}</span>
                                                    </td>
                                                    {/* Thao tác */}
                                                    <td className="px-3 py-2.5 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {(doc as any).source && (
                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${(doc as any).source === 'task' ? 'bg-purple-500/10 text-purple-500' : (doc as any).source === 'tt24' ? 'bg-primary-500/10 text-primary-500' : 'bg-bg-muted text-txt-muted'}`}>
                                                                    {(doc as any).source === 'task' ? 'CV' : (doc as any).source === 'tt24' ? 'TT24' : 'UP'}
                                                                </span>
                                                            )}
                                                            {isDocExpanded ? <ChevronDown className="w-4 h-4 text-primary-500" /> : <ChevronRight className="w-4 h-4 text-txt-muted" />}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded metadata panel row */}
                                                {isDocExpanded && (
                                                    <tr>
                                                        <td colSpan={6} className="p-0">
                                                            <DocMetadataPanel
                                                                doc={doc}
                                                                meta={currentMeta}
                                                                onMetaChange={(field, value) => setEditingMeta(prev => ({ ...prev, [docKey]: { ...prev[docKey], [field]: value } }))}
                                                                onSave={() => handleSaveMetadata(doc.DocID, currentMeta)}
                                                                onClose={() => setExpandedDocIdx(null)}
                                                                onPreview={() => setPreviewFile(doc)}
                                                                onDelete={() => handleDeleteDocument(doc.DocID)}
                                                                savingMeta={savingMeta}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Recently uploaded docs */}
                    {uploadedDocs.length > 0 && (
                        <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                            <div className="px-5 py-3 bg-bg-muted border-b border-border flex items-center gap-2">
                                <Upload className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-bold text-emerald-500">Mới tải lên ({uploadedDocs.length})</span>
                            </div>
                            <div className="divide-y divide-border">
                                {uploadedDocs.map((doc) => {
                                    const fIcon = getFileIcon(doc.DocName);
                                    return (
                                        <div key={doc.DocID} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-muted transition-colors">
                                            <div className={`w-8 h-8 rounded-xl ${fIcon.bg} flex items-center justify-center ring-2 ring-emerald-500/20`}>
                                                <fIcon.icon className={`w-4 h-4 ${fIcon.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-txt-primary truncate">{doc.DocName}</p>
                                                <p className="text-[11px] text-txt-muted">{doc.Size} • {doc.UploadDate}</p>
                                            </div>
                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-xl font-bold uppercase">Mới</span>
                                            <span className="text-[10px] bg-primary-500/10 text-primary-500 border border-primary-500/20 px-2 py-0.5 rounded-xl font-bold">WIP</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
            </div>

            {/* MODALS */}
            {previewFile && (
                <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
            )}
            {historyDoc && (
                <VersionHistoryModal doc={historyDoc} onClose={() => setHistoryDoc(null)} />
            )}
        </div>
    );
};
