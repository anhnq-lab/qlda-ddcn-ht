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
import { StatCard } from '../../../../components/ui';
// CdeExplorer removed — CDE now has dedicated /cde page

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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingDocType, setPendingDocType] = useState<string>('');

    // Doc metadata editing
    const [expandedDocIdx, setExpandedDocIdx] = useState<string | null>(null);
    const [editingMeta, setEditingMeta] = useState<Record<string, any>>({});
    const [savingMeta, setSavingMeta] = useState(false);
    const [extractingDoc, setExtractingDoc] = useState<string | null>(null);

    // Data from custom hook
    const {
        folders, documents, dbDocs, setDbDocs,
        uploadedDocs, setUploadedDocs,
        isLoading, stats, matchDocToCategory, folderDocCount,
    } = useProjectDocuments(projectID, projectStage);

    // Search filter
    const filteredDocuments = useMemo(() => {
        if (!searchQuery.trim()) return documents;
        const q = searchQuery.toLowerCase();
        return documents.filter((d: any) => (d.DocName || d.doc_name || '').toLowerCase().includes(q));
    }, [documents, searchQuery]);

    // Toggle category expansion
    const toggleCategory = (stage: string) => {
        setExpandedCategories(prev =>
            prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
        );
    };

    /** Extract document metadata using Gemini AI via Edge Function */
    const extractDocMetadata = async (file: File): Promise<Record<string, string>> => {
        try {
            const buffer = await file.arrayBuffer();
            const base64 = btoa(
                new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            const prompt = `Bạn là chuyên gia pháp lý xây dựng Việt Nam. Đọc văn bản đính kèm và trích xuất thông tin.

Trả về JSON object với đúng các key:
{
  "document_number": "Số hiệu văn bản (VD: 123/QĐ-TTg)",
  "issue_date": "Ngày ban hành dạng YYYY-MM-DD",
  "issuing_authority": "Đơn vị / cơ quan ban hành",
  "notes": "Tóm tắt ngắn gọn nội dung chính (1-2 câu)"
}

Nếu không tìm thấy, để giá trị rỗng "". CHỈ TRẢ VỀ JSON, KHÔNG markdown.`;

            const text = await generateFromImage(base64, file.type || 'application/pdf', prompt);
            const jsonStr = text.trim().replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
            return JSON.parse(jsonStr);
        } catch (err) {
            console.error('Gemini extract error:', err);
            return {};
        }
    };

    // Upload handler
    const handleUpload = (docTypeName?: string, docKey?: string) => {
        if (docTypeName) setPendingDocType(docTypeName);
        if (docKey) setExtractingDoc(docKey);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        for (const file of Array.from(files) as File[]) {
            try {
                const ext = file.name.split('.').pop();
                const path = `${projectID}/docs/${Date.now()}.${ext}`;
                const { error: uploadError } = await (supabase as any).storage
                    .from('documents').upload(path, file, { cacheControl: '3600', upsert: false });
                if (uploadError) throw uploadError;

                const { data: urlData } = (supabase as any).storage.from('documents').getPublicUrl(path);
                const finalDocName = pendingDocType ? `${pendingDocType} - ${file.name}` : file.name;

                const { data: insertedDoc } = await (supabase.from('documents') as any).insert({
                    project_id: projectID,
                    doc_name: finalDocName,
                    storage_path: urlData.publicUrl,
                    size: `${(file.size / 1024).toFixed(0)} KB`,
                    category: 0,
                    source: 'manual',
                    is_digitized: true,
                    doc_type: pendingDocType || null,
                }).select('doc_id').single();

                const docId = insertedDoc?.doc_id || Math.floor(Math.random() * 100000);

                const newDoc: any = {
                    DocID: docId, ReferenceID: projectID, ProjectID: projectID,
                    Category: DocCategory.Legal,
                    DocName: finalDocName,
                    StoragePath: urlData.publicUrl, IsDigitized: true,
                    UploadDate: new Date().toLocaleDateString('vi-VN'),
                    Version: 'P01.01', Size: `${(file.size / 1024).toFixed(0)} KB`,
                    ISOStatus: ISO19650Status.S0, source: 'manual',
                };
                setDbDocs(prev => [newDoc, ...prev]);

                // AI extraction
                const currentDocKey = extractingDoc;
                if (currentDocKey) {
                    try {
                        const extracted = await extractDocMetadata(file);
                        if (extracted && Object.keys(extracted).length > 0) {
                            const metaUpdate: any = {};
                            if (extracted.document_number) metaUpdate.document_number = extracted.document_number;
                            if (extracted.issue_date) metaUpdate.issue_date = extracted.issue_date;
                            if (extracted.issuing_authority) metaUpdate.issuing_authority = extracted.issuing_authority;
                            if (extracted.notes) metaUpdate.notes = extracted.notes;
                            if (Object.keys(metaUpdate).length > 0) {
                                await (supabase.from('documents') as any).update(metaUpdate).eq('doc_id', docId);
                            }
                            setDbDocs(prev => prev.map(d => d.DocID === docId ? { ...d, ...metaUpdate } : d));
                            setEditingMeta(prev => ({ ...prev, [currentDocKey]: { ...extracted } }));
                            setExpandedDocIdx(currentDocKey);
                        }
                    } catch { /* user can fill manually */ }
                    setExtractingDoc(null);
                }
            } catch (err) {
                console.error('Upload failed:', err);
            }
        }
        e.target.value = '';
        setPendingDocType('');
        setExtractingDoc(null);
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

    // Compute legal doc stats from LEGAL_DOC_CATEGORIES
    const legalStats = useMemo(() => {
        const totalTypes = LEGAL_DOC_CATEGORIES.reduce((sum, cat) => sum + cat.docs.length, 0);
        const matched = LEGAL_DOC_CATEGORIES.reduce(
            (sum, cat) => sum + cat.docs.filter(d => matchDocToCategory(d.keywords)).length, 0
        );
        const missing = totalTypes - matched;
        const pct = totalTypes > 0 ? Math.round((matched / totalTypes) * 100) : 0;
        return { totalTypes, matched, missing, pct };
    }, [matchDocToCategory]);

    const statCards = [
        { label: 'Tổng loại VB', value: legalStats.totalTypes, icon: FileText, color: 'blue' as const },
        { label: 'Đã có', value: legalStats.matched, icon: CheckCircle2, color: 'emerald' as const },
        { label: 'Chưa có', value: legalStats.missing, icon: AlertCircle, color: 'amber' as const },
        { label: 'Hoàn thiện', value: `${legalStats.pct}%`, icon: Target, color: 'violet' as const },
    ];

    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500">
            {/* Hidden file input */}
            <input
                type="file" ref={fileInputRef} className="hidden" multiple
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg"
            />

            {/* Header with View Toggle */}
            <div className="bg-bg-surface rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 mb-6 overflow-hidden">
                <div className="px-5 py-3 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-600" />
                        <span className="text-sm font-bold text-gray-700 dark:text-slate-200">Văn bản pháp lý</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text" placeholder="Tìm kiếm..."
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-8 py-2 bg-bg-subtle dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all dark:text-slate-200 dark:placeholder-slate-400"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => handleUpload()}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-lg transition-colors shadow-sm shadow-primary-200"
                        >
                            <Upload className="w-4 h-4" /> Tải lên
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ TABLE-BASED LEGAL DOCUMENTS VIEW ═══ */}
            <div className="space-y-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {statCards.map((stat, idx) => (
                            <StatCard
                                key={idx}
                                label={stat.label}
                                value={stat.value.toString()}
                                icon={<stat.icon className="w-5 h-5 flex-shrink-0" />}
                                color={stat.color}
                            />
                        ))}
                    </div>

                    {/* Table */}
                    <div className="bg-bg-surface rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-bg-subtle border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-3 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-10">STT</th>
                                    <th className="px-3 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tài liệu</th>
                                    <th className="px-3 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-36">Số công văn</th>
                                    <th className="px-3 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-28">Ngày ban hành</th>
                                    <th className="px-3 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-40">CQ ban hành</th>
                                    <th className="px-3 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-24 text-center">Trạng thái</th>
                                    <th className="px-3 py-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-20 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {LEGAL_DOC_CATEGORIES.map((category) => {
                                    const isExpanded = expandedCategories.includes(category.stage);
                                    const isCurrent = category.stage === projectStage;
                                    const colors = getStageColor(category.color);
                                    const CategoryIcon = category.icon;
                                    const matchedCount = category.docs.filter(d => matchDocToCategory(d.keywords)).length;
                                    const totalCount = category.docs.length;

                                    return (
                                        <React.Fragment key={category.stage}>
                                            {/* Stage group header row */}
                                            <tr
                                                className={`cursor-pointer transition-colors ${isCurrent ? 'bg-blue-50/80 dark:bg-blue-900/20' : 'bg-bg-subtle dark:bg-slate-700 hover:bg-gray-100/50 dark:hover:bg-slate-700'}`}
                                                onClick={() => toggleCategory(category.stage)}
                                            >
                                                <td colSpan={7} className="px-3 py-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {isExpanded ? <ChevronDown className={`w-4 h-4 ${colors.text}`} /> : <ChevronRight className={`w-4 h-4 ${colors.text}`} />}
                                                            <CategoryIcon className={`w-4 h-4 ${colors.text}`} />
                                                            <span className={`text-sm font-bold ${colors.text}`}>{category.label}</span>
                                                            {isCurrent && <span className="px-2 py-0.5 bg-primary-600 text-white text-[10px] font-bold rounded-full uppercase">Hiện tại</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-bold ${matchedCount === totalCount ? 'text-emerald-600' : 'text-gray-500 dark:text-slate-400'}`}>
                                                                {matchedCount}/{totalCount}
                                                            </span>
                                                            <div className="w-20 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all ${matchedCount === totalCount ? 'bg-emerald-500' : matchedCount > 0 ? `bg-${category.color}-500` : 'bg-gray-300'}`} style={{ width: `${totalCount > 0 ? (matchedCount / totalCount) * 100 : 0}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Document rows for this stage */}
                                            {isExpanded && (
                                                <>
                                                    {/* Investment Policy special row */}
                                                    {category.stage === ProjectStage.Preparation && investmentPolicy && (
                                                        <tr className="bg-blue-50/40 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30">
                                                            <td className="px-3 py-2.5 text-xs text-gray-400 text-center">—</td>
                                                            <td className="px-3 py-2.5">
                                                                <div className="flex items-center gap-2">
                                                                    <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                                                                    <span className="text-sm font-bold text-gray-800 dark:text-slate-100">QĐ Chủ trương đầu tư</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-slate-300">{investmentPolicy.DecisionNumber}</td>
                                                            <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-slate-400">{investmentPolicy.DecisionDate}</td>
                                                            <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-slate-400">{investmentPolicy.Authority}</td>
                                                            <td className="px-3 py-2.5 text-center">
                                                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full">Đã có</span>
                                                            </td>
                                                            <td className="px-3 py-2.5 text-center text-xs text-gray-400">
                                                                <span className="text-[10px] text-blue-600 font-bold">{formatCurrency(investmentPolicy.PreliminaryInvestment)}</span>
                                                            </td>
                                                        </tr>
                                                    )}

                                                    {/* Feasibility Study special row */}
                                                    {category.stage === ProjectStage.Preparation && feasibilityStudy && (
                                                        <tr className="bg-emerald-50/40 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/30">
                                                            <td className="px-3 py-2.5 text-xs text-gray-400 text-center">—</td>
                                                            <td className="px-3 py-2.5">
                                                                <div className="flex items-center gap-2">
                                                                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                                                    <span className="text-sm font-bold text-gray-800 dark:text-slate-100">Báo cáo NCKT (F/S)</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-slate-300">{feasibilityStudy.ApprovalNumber}</td>
                                                            <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-slate-400">{feasibilityStudy.ApprovalDate}</td>
                                                            <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-slate-400">{feasibilityStudy.ApprovalAuthority}</td>
                                                            <td className="px-3 py-2.5 text-center">
                                                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full">Đã có</span>
                                                            </td>
                                                            <td className="px-3 py-2.5 text-center text-xs text-gray-400">
                                                                <span className="text-[10px] text-emerald-600 font-bold">{formatCurrency(feasibilityStudy.TotalInvestment)}</span>
                                                            </td>
                                                        </tr>
                                                    )}

                                                    {/* Regular document type rows */}
                                                    {category.docs.map((docType, idx) => {
                                                        const matchedDoc = matchDocToCategory(docType.keywords);
                                                        const hasDoc = !!matchedDoc;
                                                        const fileInfo = hasDoc ? getFileIcon(matchedDoc!.DocName) : null;
                                                        const docKey = `${category.stage}-${idx}`;
                                                        const isDocExpanded = expandedDocIdx === docKey;
                                                        const currentMeta = editingMeta[docKey] || {};
                                                        const md = matchedDoc as any;

                                                        return (
                                                            <React.Fragment key={idx}>
                                                                <tr
                                                                    className={`border-b border-gray-100 dark:border-slate-700/50 cursor-pointer transition-colors ${isDocExpanded ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                                                                    onClick={() => {
                                                                        if (hasDoc) {
                                                                            setExpandedDocIdx(isDocExpanded ? null : docKey);
                                                                            if (!isDocExpanded) {
                                                                                setEditingMeta(prev => ({
                                                                                    ...prev,
                                                                                    [docKey]: {
                                                                                        document_number: md?.document_number || '',
                                                                                        issue_date: md?.issue_date || '',
                                                                                        issuing_authority: md?.issuing_authority || '',
                                                                                        updated_by: md?.updated_by || '',
                                                                                        notes: md?.notes || '',
                                                                                        legal_status: md?.legal_status || 'active',
                                                                                    }
                                                                                }));
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    {/* STT */}
                                                                    <td className="px-3 py-2.5 text-xs text-gray-400 dark:text-slate-400 text-center font-medium">
                                                                        {idx + 1}
                                                                    </td>
                                                                    {/* Tài liệu */}
                                                                    <td className="px-3 py-2.5">
                                                                        <div className="flex items-center gap-2">
                                                                            {hasDoc && fileInfo ? (
                                                                                <div className={`w-7 h-7 rounded-lg ${fileInfo.bg} flex items-center justify-center shrink-0`}>
                                                                                    <fileInfo.icon className={`w-3.5 h-3.5 ${fileInfo.color}`} />
                                                                                </div>
                                                                            ) : (
                                                                                <div className="w-7 h-7 rounded-lg bg-bg-subtle dark:bg-slate-700 border border-dashed border-gray-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                                                                                    <FileText className="w-3.5 h-3.5 text-gray-300 dark:text-slate-400" />
                                                                                </div>
                                                                            )}
                                                                            <span className={`text-sm ${hasDoc ? 'text-gray-800 dark:text-slate-100 font-medium' : 'text-gray-400 dark:text-slate-400'}`}>
                                                                                {docType.name}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    {/* Số công văn */}
                                                                    <td className="px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-slate-300">
                                                                        {md?.document_number || '—'}
                                                                    </td>
                                                                    {/* Ngày ban hành */}
                                                                    <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-slate-400">
                                                                        {md?.issue_date || matchedDoc?.UploadDate || '—'}
                                                                    </td>
                                                                    {/* CQ ban hành */}
                                                                    <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-slate-400 truncate max-w-[160px]">
                                                                        {md?.issuing_authority || '—'}
                                                                    </td>
                                                                    {/* Trạng thái */}
                                                                    <td className="px-3 py-2.5 text-center">
                                                                        {hasDoc ? (
                                                                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full inline-flex items-center gap-1">
                                                                                <CheckCircle2 className="w-3 h-3" /> Đã có
                                                                            </span>
                                                                        ) : (
                                                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400 text-[10px] font-medium rounded-full">
                                                                                Chưa có
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    {/* Thao tác */}
                                                                    <td className="px-3 py-2.5 text-center">
                                                                        {hasDoc ? (
                                                                            <div className="flex items-center justify-center gap-1">
                                                                                {(matchedDoc as any)?.source && (
                                                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${(matchedDoc as any).source === 'task' ? 'bg-violet-100 text-violet-600' : (matchedDoc as any).source === 'tt24' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                                                        {(matchedDoc as any).source === 'task' ? 'CV' : (matchedDoc as any).source === 'tt24' ? 'TT24' : 'UP'}
                                                                                    </span>
                                                                                )}
                                                                                {isDocExpanded ? <ChevronDown className="w-4 h-4 text-blue-500" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                                                            </div>
                                                                        ) : (
                                                                            extractingDoc === docKey ? (
                                                                                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin mx-auto" />
                                                                            ) : (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleUpload(docType.name, docKey); }}
                                                                                    className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-gray-400 hover:text-blue-600 transition-all mx-auto block"
                                                                                    title="Tải lên văn bản"
                                                                                >
                                                                                    <Plus className="w-4 h-4" />
                                                                                </button>
                                                                            )
                                                                        )}
                                                                    </td>
                                                                </tr>

                                                                {/* Expanded metadata panel row */}
                                                                {isDocExpanded && hasDoc && (
                                                                    <tr>
                                                                        <td colSpan={7} className="p-0">
                                                                            <DocMetadataPanel
                                                                                doc={matchedDoc!}
                                                                                meta={currentMeta}
                                                                                onMetaChange={(field, value) => setEditingMeta(prev => ({ ...prev, [docKey]: { ...prev[docKey], [field]: value } }))}
                                                                                onSave={() => handleSaveMetadata(matchedDoc!.DocID, currentMeta)}
                                                                                onClose={() => setExpandedDocIdx(null)}
                                                                                onPreview={() => setPreviewFile(matchedDoc)}
                                                                                savingMeta={savingMeta}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Recently uploaded docs */}
                    {uploadedDocs.length > 0 && (
                        <div className="bg-bg-surface rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/30 dark:to-slate-800 border-b border-emerald-100 dark:border-emerald-800 flex items-center gap-2">
                                <Upload className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Mới tải lên ({uploadedDocs.length})</span>
                            </div>
                            <div className="divide-y divide-gray-50 dark:divide-slate-700">
                                {uploadedDocs.map((doc) => {
                                    const fIcon = getFileIcon(doc.DocName);
                                    return (
                                        <div key={doc.DocID} className="flex items-center gap-3 px-5 py-3 hover:bg-blue-50/30 dark:hover:bg-slate-700 transition-colors">
                                            <div className={`w-8 h-8 rounded-lg ${fIcon.bg} flex items-center justify-center ring-2 ring-emerald-200`}>
                                                <fIcon.icon className={`w-4 h-4 ${fIcon.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{doc.DocName}</p>
                                                <p className="text-[11px] text-gray-400 dark:text-slate-400">{doc.Size} • {doc.UploadDate}</p>
                                            </div>
                                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase">Mới</span>
                                            <span className="text-[10px] bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full font-bold">WIP</span>
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
