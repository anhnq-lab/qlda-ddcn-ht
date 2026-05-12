import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import {
    ChevronDown, ChevronRight, Search, Printer, Download, ArrowRight,
    Clock, Shield, FileText, FileSpreadsheet, BookOpen, PenLine, Trash2,
    ArrowUp, ArrowDown, Plus, LayoutList, GitBranch, ExternalLink, Upload, Loader2
} from 'lucide-react';
import type { Workflow, WorkflowNode, WorkflowNodeMetadata, SubTask, PhaseType } from '../../../types/workflow.types';
import { useSlidePanel } from '../../../context/SlidePanelContext';
import { useToast } from '../../../components/ui/Toast';
import NodeDetailPanel from './NodeDetailPanel';
import { SubTaskDetailPanel } from './SubTaskDetailPanel';
import LegalDocumentSearch from '../../legal-documents/LegalDocumentSearch';
import { parseSla, resolveLegalReference, uploadTemplateFile } from '../utils/workflowUtils';

// ─── Inline Component: TemplateCell ────────────────────────────
function TemplateCell({ 
    node,
    subTaskId,
    initialForms, 
    initialUrl, 
    isAdmin,
    onSuccess
}: { 
    node: WorkflowNode;
    subTaskId?: string;
    initialForms: string | string[]; 
    initialUrl?: string; 
    isAdmin: boolean;
    onSuccess: (updatedNode: WorkflowNode) => void;
}) {
    const { addToast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const { url, name } = await uploadTemplateFile(file, node.id);

            let updatedMeta = { ...(node.metadata || {}) };
            if (subTaskId) {
                if (updatedMeta.sub_tasks) {
                    updatedMeta.sub_tasks = updatedMeta.sub_tasks.map((st: any) => 
                        st.id === subTaskId 
                            ? { ...st, template_url: url, template_forms: name }
                            : st
                    );
                }
            } else {
                (updatedMeta as any).template_url = url;
                updatedMeta.template_forms = name;
            }

            const { data, error } = await supabase
                .from('workflow_nodes')
                .update({ metadata: updatedMeta as any })
                .eq('id', node.id)
                .select()
                .single();

            if (error) throw error;
            addToast({ title: 'Tải lên thành công', message: 'Hệ thống đã lưu biểu mẫu', type: 'success' });
            onSuccess(data as WorkflowNode);
        } catch (err: any) {
            addToast({ title: 'Lỗi tải lên', message: err.message, type: 'error' });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const formsStr = Array.isArray(initialForms) ? initialForms.join(', ') : (initialForms || '');

    return (
        <div className="flex flex-col gap-1 items-start">
            {initialUrl ? (
                <a href={initialUrl} target="_blank" rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 transition-colors border border-indigo-100 dark:border-indigo-800/50 text-[11px] max-w-full"
                    title="Tải biểu mẫu">
                    <Download size={12} className="shrink-0" />
                    <span className="font-medium truncate">{formsStr || 'Biểu mẫu'}</span>
                </a>
            ) : (
                <span className="text-slate-500 dark:text-slate-400 italic text-[11px] truncate block max-w-full">
                    {formsStr || (isAdmin ? 'Chưa có biểu mẫu' : '')}
                </span>
            )}

            {isAdmin && (
                <div onClick={(e) => e.stopPropagation()}>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleUpload} 
                        accept=".doc,.docx,.xls,.xlsx,.pdf,.rar,.zip"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 px-1.5 py-0.5 rounded transition-colors disabled:opacity-50 mt-1 cursor-pointer"
                    >
                        {isUploading ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                        <span>Tải lên</span>
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Props ──────────────────────────────────────────────────
interface WorkflowProcessTableProps {
    workflowId: string;
    onClose: () => void;
    onViewFlowchart?: () => void;
    onEdit?: () => void;
    onUpdate?: () => void;
    isAdmin?: boolean;
}

// ─── Phase config ───────────────────────────────────────────
const PHASE_CONFIG: Record<string, { title: string; gradient: string; icon: string }> = {
    preparation: {
        title: 'GIAI ĐOẠN CHUẨN BỊ DỰ ÁN',
        gradient: 'from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/10',
        icon: '📋',
    },
    execution: {
        title: 'GIAI ĐOẠN THỰC HIỆN DỰ ÁN',
        gradient: 'from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-900/10',
        icon: '🏗️',
    },
    completion: {
        title: 'GIAI ĐOẠN KẾT THÚC XÂY DỰNG',
        gradient: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-900/10',
        icon: '✅',
    },
    // Internal workflow phases
    reception: {
        title: 'TIẾP NHẬN HỒ SƠ',
        gradient: 'from-sky-50 to-sky-100/50 dark:from-sky-900/30 dark:to-sky-900/10',
        icon: '📥',
    },
    review: {
        title: 'THẨM ĐỊNH',
        gradient: 'from-violet-50 to-violet-100/50 dark:from-violet-900/30 dark:to-violet-900/10',
        icon: '🔍',
    },
    consolidation: {
        title: 'TỔNG HỢP & THÔNG BÁO',
        gradient: 'from-teal-50 to-teal-100/50 dark:from-teal-900/30 dark:to-teal-900/10',
        icon: '📊',
    },
    approval: {
        title: 'PHÊ DUYỆT',
        gradient: 'from-rose-50 to-rose-100/50 dark:from-rose-900/30 dark:to-rose-900/10',
        icon: '✍️',
    },
    other: {
        title: 'KHÁC',
        gradient: 'from-slate-50 to-slate-100/50 dark:from-slate-900/30 dark:to-slate-900/10',
        icon: '📎',
    },
};

// ─── SLA Badge ──────────────────────────────────────────────
const SlaBadge: React.FC<{ sla: string | null | undefined }> = ({ sla }) => {
    if (!sla) return <span className="text-slate-400 text-[11px]">—</span>;
    const parsed = parseSla(sla);
    if (!parsed) return <span className="text-slate-500 text-[11px] font-mono">{sla}</span>;
    
    // Color by duration
    const numMatch = sla.match(/(\d+)/);
    const days = numMatch ? parseInt(numMatch[1]) : 0;
    const color = days <= 7 
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
        : days <= 30 
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${color}`}>
            <Clock size={10} />
            {parsed}
        </span>
    );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const WorkflowProcessTable: React.FC<WorkflowProcessTableProps> = ({
    workflowId, onClose, onViewFlowchart, onEdit, onUpdate, isAdmin = true
}) => {
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [nodes, setNodes] = useState<WorkflowNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
    const [expandedSubProcesses, setExpandedSubProcesses] = useState<Record<string, boolean>>({});
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
    const { openPanel, closePanel } = useSlidePanel();
    const { addToast } = useToast();

    // ─── Fetch Data ──────────────────────────────────────────
    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const [wfRes, nodesRes] = await Promise.all([
                supabase.from('workflows').select('*').eq('id', workflowId).single(),
                supabase.from('workflow_nodes').select('*').eq('workflow_id', workflowId)
                    .or('is_deleted.eq.false,is_deleted.is.null')
                    .order('created_at', { ascending: true })
            ]);
            if (wfRes.error) throw wfRes.error;
            setWorkflow(wfRes.data);
            setNodes(nodesRes.data || []);
        } catch (err: any) {
            addToast({ title: 'Lỗi tải dữ liệu', message: err.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [workflowId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleNodeUpdateLocally = (updatedNode: WorkflowNode) => {
        setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
    };

    // ─── Determine workflow type ─────────────────────────────
    const isInternalWorkflow = useMemo(() => {
        return ['hr', 'finance', 'document', 'asset', 'other'].includes(workflow?.category || 'project');
    }, [workflow]);

    // ─── Filter by search ────────────────────────────────────
    const filteredNodes = useMemo(() => {
        if (!searchQuery.trim()) return nodes;
        const q = searchQuery.toLowerCase();
        return nodes.filter(n => {
            const meta = (n.metadata || {}) as WorkflowNodeMetadata;
            const subTasks = meta.sub_tasks || [];
            return (
                n.name.toLowerCase().includes(q) ||
                (n.assignee_role || '').toLowerCase().includes(q) ||
                (meta.legal_basis || '').toLowerCase().includes(q) ||
                (meta.output || '').toLowerCase().includes(q) ||
                (meta.description || '').toLowerCase().includes(q) ||
                subTasks.some(st =>
                    st.name.toLowerCase().includes(q) ||
                    (st.assignee_role || '').toLowerCase().includes(q) ||
                    (st.legal_basis || '').toLowerCase().includes(q)
                )
            );
        });
    }, [nodes, searchQuery]);

    // ─── Group by Phase → SubProcess ─────────────────────────
    type PhaseGroup = { title: string; sub_processes: Record<string, WorkflowNode[]> };
    const groupedPhases = useMemo(() => {
        return filteredNodes.reduce<Record<string, PhaseGroup>>((acc, node) => {
            const meta = (node.metadata || {}) as WorkflowNodeMetadata;
            const phaseKey = meta.phase || 'other';
            const subProcessKey = meta.sub_process || 'Mặc định';
            const phaseConf = PHASE_CONFIG[phaseKey] || PHASE_CONFIG.other;

            if (!acc[phaseKey]) {
                acc[phaseKey] = { title: phaseConf.title, sub_processes: {} };
            }
            if (!acc[phaseKey].sub_processes[subProcessKey]) {
                acc[phaseKey].sub_processes[subProcessKey] = [];
            }
            acc[phaseKey].sub_processes[subProcessKey].push(node);
            return acc;
        }, {});
    }, [filteredNodes]);

    // ─── Summary stats ───────────────────────────────────────
    const stats = useMemo(() => {
        let totalSteps = filteredNodes.length;
        let totalSubTasks = 0;
        filteredNodes.forEach(n => {
            const meta = (n.metadata || {}) as WorkflowNodeMetadata;
            totalSubTasks += (meta.sub_tasks || []).length;
        });
        return { totalSteps, totalSubTasks };
    }, [filteredNodes]);

    // ─── Toggle helpers ──────────────────────────────────────
    const togglePhase = (key: string) => {
        setExpandedPhases(prev => ({ ...prev, [key]: prev[key] === undefined ? false : !prev[key] }));
    };
    const toggleSubProcess = (key: string) => {
        setExpandedSubProcesses(prev => ({ ...prev, [key]: prev[key] === undefined ? false : !prev[key] }));
    };
    const toggleNode = (id: string) => {
        setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // ─── Panel openers ───────────────────────────────────────
    const handleOpenLegalSearch = (basisText: string) => {
        const target = resolveLegalReference(basisText);
        openPanel({
            id: target.docId ? 'legal-search-parsed' : 'legal-search',
            title: 'Tra cứu pháp luật',
            component: <LegalDocumentSearch 
                isEmbedded 
                initialDocId={target.docId} 
                initialArticleId={target.articleId} 
                initialSearchQuery={target.searchQuery || ''} 
            />
        });
    };

    const handleSaveNode = async (nodeId: string, updatedData: any) => {
        try {
            const { error } = await supabase
                .from('workflow_nodes')
                .update(updatedData)
                .eq('id', nodeId);
            if (error) throw error;

            // Refresh local state
            setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updatedData, metadata: { ...n.metadata, ...updatedData.metadata } } : n));
            addToast({ title: 'Đã lưu', message: 'Cập nhật bước thành công.', type: 'success' });
            onUpdate?.();
        } catch (err: any) {
            addToast({ title: 'Lỗi lưu', message: err.message, type: 'error' });
        }
    };

    const handleDeleteNode = async (e: React.MouseEvent, node: WorkflowNode) => {
        e.stopPropagation();
        if (!window.confirm(`Xác nhận xóa bước "${node.name}"?\n\nBước này sẽ bị ẩn khỏi quy trình.`)) return;
        try {
            const { error } = await supabase
                .from('workflow_nodes')
                .update({ is_deleted: true } as any)
                .eq('id', node.id);
            if (error) throw error;
            setNodes(prev => prev.filter(n => n.id !== node.id));
            addToast({ title: 'Đã xóa', message: `Bước "${node.name}" đã được xóa.`, type: 'success' });
            onUpdate?.();
        } catch (err: any) {
            addToast({ title: 'Lỗi xóa', message: err.message, type: 'error' });
        }
    };

    const openNodePanel = (node: WorkflowNode) => {
        openPanel({
            id: 'node-detail-' + node.id,
            title: 'Chi tiết Bước',
            icon: <PenLine size={16} />,
            component: <NodeDetailPanel node={node} onSave={handleSaveNode} />
        });
    };

    const openSubTaskPanel = (node: WorkflowNode, st: SubTask, displayIndex: number, stIdx: number) => {
        openPanel({
            id: 'subtask-' + (st.id || `${node.id}-${stIdx}`),
            title: `Công việc con: ${st.name?.substring(0, 50)}`,
            icon: <FileText size={16} className="text-blue-500" />,
            component: (
                <SubTaskDetailPanel 
                    node={node} 
                    subTaskId={st.id} 
                    onSave={handleSaveNode} 
                    closePanel={() => closePanel()} 
                />
            )
        });
    };

    // ─── Print ───────────────────────────────────────────────
    const handlePrint = () => {
        window.print();
    };

    // ─── Loading state ───────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-bg-surface p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-2/3" />
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (!workflow) return null;

    const colCount = isInternalWorkflow ? 7 : 8;

    return (
        <div className="flex flex-col h-full bg-[#FAFAF8] dark:bg-slate-900 relative print:bg-white">
            {/* ── HEADER ── */}
            <div className="px-5 py-4 bg-bg-surface border-b border-slate-200 dark:border-slate-700 print:border-b-2 print:border-slate-300 flex-shrink-0">
                {/* Title row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                            <LayoutList size={20} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight font-display truncate">
                                {workflow.name}
                            </h2>
                            <p className="text-xs font-mono text-slate-400 mt-0.5">
                                {workflow.code} · v{workflow.version}.0
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 print:hidden">
                        {onViewFlowchart && (
                            <button onClick={onViewFlowchart}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs transition shadow-sm"
                                title="Xem Sơ đồ">
                                <GitBranch size={13} /> Sơ đồ
                            </button>
                        )}
                        {isAdmin && onEdit && (
                            <button onClick={onEdit}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition"
                                title="Chỉnh sửa cài đặt">
                                <PenLine size={13} /> Cài đặt
                            </button>
                        )}
                        <button onClick={handlePrint}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition"
                            title="In bảng quy trình">
                            <Printer size={13} /> In
                        </button>
                    </div>
                </div>
                
                {/* Description */}
                {workflow.description && (
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3 max-w-4xl">
                        {workflow.description}
                    </p>
                )}

                {/* Search */}
                <div className="relative max-w-sm print:hidden">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm bước, đơn vị, pháp lý..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition font-medium"
                    />
                </div>
            </div>

            {/* ── TABLE BODY ── */}
            <div className="flex-1 overflow-auto custom-scrollbar print:overflow-visible">
                <table className="w-full text-left text-[13px] border-collapse table-fixed min-w-[900px]">
                    <thead className="bg-slate-100 dark:bg-slate-900/80 border-b-2 border-slate-300 dark:border-slate-600 sticky top-0 z-[5] print:bg-slate-200">
                        <tr className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                            <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 text-center w-12">TT</th>
                            {isInternalWorkflow ? (
                                <>
                                    <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-[24%]">Nội dung công việc</th>
                                    <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-[12%]">Đơn vị thực hiện</th>
                                    <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-[12%]">Đơn vị phối hợp</th>
                                    <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-[14%]">Thời gian</th>
                                    <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-[16%]">Biểu mẫu</th>
                                    <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-[12%]">Ghi chú</th>
                                </>
                            ) : (
                                <>
                                    <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-14 text-center">SLA</th>
                                    <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-[26%]">Nội dung thực hiện</th>
                                    <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-[13%]">Đơn vị thực hiện</th>
                                    <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-[13%]">Đầu ra</th>
                                    <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-[10%]">Biểu mẫu</th>
                                    <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-[13%]">Cơ sở pháp lý</th>
                                </>
                            )}
                            {isAdmin && (
                                <th className="p-2.5 text-center w-20 print:hidden">Thao tác</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                        {(Object.entries(groupedPhases) as [string, PhaseGroup][]).map(([phaseKey, phaseGroup]) => {
                            const isPhaseExpanded = expandedPhases[phaseKey] !== false;
                            const phaseConf = PHASE_CONFIG[phaseKey] || PHASE_CONFIG.other;
                            const phaseNodeCount = Object.values(phaseGroup.sub_processes).reduce((c, arr) => c + arr.length, 0);

                            return (
                                <React.Fragment key={phaseKey}>
                                    {/* ── PHASE HEADER ROW ── */}
                                    <tr
                                        className={`bg-gradient-to-r ${phaseConf.gradient} cursor-pointer hover:brightness-95 transition-all print:bg-slate-100`}
                                        onClick={() => togglePhase(phaseKey)}
                                    >
                                        <td colSpan={isAdmin ? colCount + 1 : colCount}
                                            className="p-3 font-black text-slate-800 dark:text-white uppercase tracking-wide text-[13px] border-b-2 border-slate-300 dark:border-slate-600">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 dark:text-slate-400 print:hidden">
                                                    {isPhaseExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                </span>
                                                <span className="text-lg print:hidden">{phaseConf.icon}</span>
                                                <span>{phaseGroup.title}</span>
                                                <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] normal-case ml-2">
                                                    ({phaseNodeCount} bước)
                                                </span>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* ── SUB-PROCESS + NODES ── */}
                                    {isPhaseExpanded && (Object.entries(phaseGroup.sub_processes) as [string, WorkflowNode[]][]).map(([subKey, subNodes]) => {
                                        const spToggleKey = `${phaseKey}-${subKey}`;
                                        const isSpExpanded = expandedSubProcesses[spToggleKey] !== false;

                                        return (
                                            <React.Fragment key={spToggleKey}>
                                                {/* Sub-process header (only for project workflows with non-default sub_process) */}
                                                {!isInternalWorkflow && subKey !== 'Mặc định' && (
                                                    <tr
                                                        className="bg-emerald-50/70 dark:bg-emerald-900/40 cursor-pointer hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60 transition-colors print:bg-emerald-50"
                                                        onClick={() => toggleSubProcess(spToggleKey)}
                                                    >
                                                        <td colSpan={isAdmin ? colCount + 1 : colCount}
                                                            className="p-2 pl-6 font-semibold text-emerald-800 dark:text-emerald-300 tracking-wide text-[12px] border-b border-emerald-200 dark:border-emerald-800/50">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-emerald-600 dark:text-emerald-500 print:hidden">
                                                                    {isSpExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                                </span>
                                                                <FileSpreadsheet size={14} className="text-emerald-500" />
                                                                <span>{subKey}</span>
                                                                <span className="text-emerald-600/70 dark:text-emerald-400/70 font-medium text-[11px] normal-case ml-1">
                                                                    ({subNodes.length} bước)
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}

                                                {/* ── NODE ROWS ── */}
                                                {(isSpExpanded || isInternalWorkflow) && subNodes.map((node, index) => {
                                                    const meta = (node.metadata || {}) as WorkflowNodeMetadata;
                                                    const subTasks = meta.sub_tasks || [];
                                                    const displayIndex = nodes.findIndex(n => n.id === node.id) + 1;
                                                    const hasSubTasks = subTasks.length > 0;
                                                    const isNodeExpanded = expandedNodes[node.id] !== false;

                                                    return (
                                                        <React.Fragment key={node.id}>
                                                            {/* Main step row */}
                                                            <tr className="bg-white dark:bg-slate-800/50 group border-b border-slate-200 dark:border-slate-700 hover:bg-blue-50/30 dark:hover:bg-slate-800 transition-colors">
                                                                {/* TT */}
                                                                <td className="p-3 border-r border-slate-200 dark:border-slate-700 text-center font-black text-slate-500 dark:text-slate-400 align-top">
                                                                    {hasSubTasks ? (
                                                                        <button
                                                                            onClick={() => toggleNode(node.id)}
                                                                            className="flex items-center justify-center gap-0.5 text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors w-full print:text-slate-600"
                                                                        >
                                                                            <span className="print:hidden">{isNodeExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}</span>
                                                                            {displayIndex}
                                                                        </button>
                                                                    ) : (
                                                                        displayIndex
                                                                    )}
                                                                </td>

                                                                {isInternalWorkflow ? (
                                                                    <>
                                                                        {/* Nội dung (Internal) */}
                                                                        <td className="p-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer align-top"
                                                                            onClick={() => openNodePanel(node)}>
                                                                            <div className="font-bold text-sm text-primary-700 dark:text-primary-400 whitespace-pre-wrap leading-snug">{node.name}</div>
                                                                            {meta.description && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap">{meta.description}</div>}
                                                                        </td>
                                                                        {/* Đơn vị thực hiện */}
                                                                        <td className="p-3 border-r border-slate-200 dark:border-slate-700 text-[12px] whitespace-pre-wrap align-top">
                                                                            {node.assignee_role}
                                                                        </td>
                                                                        {/* Đơn vị phối hợp */}
                                                                        <td className="p-3 border-r border-slate-200 dark:border-slate-700 text-[12px] whitespace-pre-wrap align-top">
                                                                            {meta.coordinating_role}
                                                                        </td>
                                                                        {/* Thời gian */}
                                                                        <td className="p-3 border-r border-slate-200 dark:border-slate-700 text-[12px] align-top">
                                                                            {meta.sla_regulated && (
                                                                                <div className="mb-2">
                                                                                    <span className="font-semibold text-slate-600 dark:text-slate-400">Theo quy định:</span><br/>
                                                                                    <span className="whitespace-pre-wrap block leading-snug">{meta.sla_regulated}</span>
                                                                                </div>
                                                                            )}
                                                                            {node.sla_formula && (
                                                                                <div>
                                                                                    <span className="font-semibold text-slate-600 dark:text-slate-400">Theo quy trình:</span><br/>
                                                                                    <span className="whitespace-pre-wrap block leading-snug">{node.sla_formula}</span>
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                        {/* Biểu mẫu (Internal) */}
                                                                        <td className="p-3 border-r border-slate-200 dark:border-slate-700 text-[11px] align-top">
                                                                            <TemplateCell 
                                                                                node={node}
                                                                                initialForms={meta.template_forms || ''}
                                                                                initialUrl={(meta as any).template_url}
                                                                                isAdmin={!!isAdmin}
                                                                                onSuccess={handleNodeUpdateLocally}
                                                                            />
                                                                        </td>
                                                                        {/* Ghi chú */}
                                                                        <td className="p-3 border-r border-slate-200 dark:border-slate-700 text-[12px] whitespace-pre-wrap leading-snug align-top">
                                                                            {meta.notes}
                                                                        </td>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {/* SLA */}
                                                                        <td className="p-3 border-r border-slate-200 dark:border-slate-700 text-center align-top">
                                                                            <SlaBadge sla={node.sla_formula} />
                                                                        </td>
                                                                        {/* Nội dung (Project) */}
                                                                        <td className="p-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer align-top"
                                                                            onClick={() => openNodePanel(node)}>
                                                                            <div className="font-bold text-sm text-primary-700 dark:text-primary-400 whitespace-pre-wrap leading-snug">{node.name}</div>
                                                                            {meta.description && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{meta.description}</div>}
                                                                            {hasSubTasks && (
                                                                                <div className="mt-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                                                    <ArrowRight size={10}/> {subTasks.length} công việc con
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                        {/* Đơn vị */}
                                                                        <td className="p-3 border-r border-slate-200 dark:border-slate-700 text-[12px] whitespace-pre-wrap align-top">
                                                                            {node.assignee_role}
                                                                        </td>
                                                                        {/* Đầu ra */}
                                                                        <td className="p-3 border-r border-slate-200 dark:border-slate-700 text-[12px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap align-top">
                                                                            {meta.output}
                                                                        </td>
                                                                        {/* Biểu mẫu */}
                                                                        <td className="p-3 border-r border-slate-200 dark:border-slate-700 align-top">
                                                                            <TemplateCell 
                                                                                node={node}
                                                                                initialForms={meta.template_forms || ''}
                                                                                initialUrl={(meta as any).template_url}
                                                                                isAdmin={!!isAdmin}
                                                                                onSuccess={handleNodeUpdateLocally}
                                                                            />
                                                                        </td>
                                                                        {/* CSPL */}
                                                                        <td className="p-3 border-r border-slate-200 dark:border-slate-700 text-[11px] align-top">
                                                                            {meta.legal_basis ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => { e.stopPropagation(); handleOpenLegalSearch(meta.legal_basis!); }}
                                                                                    className="text-left text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline transition-colors focus:outline-none whitespace-pre-wrap"
                                                                                    title="Nhấn để tra cứu nhanh"
                                                                                >
                                                                                    {meta.legal_basis}
                                                                                </button>
                                                                            ) : null}
                                                                        </td>
                                                                    </>
                                                                )}

                                                                {/* Admin actions */}
                                                                {isAdmin && (
                                                                    <td className="p-2 text-center align-top print:hidden">
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); openNodePanel(node); }}
                                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                                title="Chỉnh sửa bước"
                                                                            >
                                                                                <PenLine size={13} />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => handleDeleteNode(e, node)}
                                                                                className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                                title="Xóa bước này"
                                                                            >
                                                                                <Trash2 size={13} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                )}
                                                            </tr>

                                                            {/* ── SUB-TASK ROWS ── */}
                                                            {hasSubTasks && isNodeExpanded && subTasks.map((st, stIdx) => {
                                                                const stSlaStr = st.sla ? `${st.sla}${st.sla_unit || 'd'}` : null;

                                                                return (
                                                                    <tr key={st.id || stIdx}
                                                                        className="bg-bg-surface hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800"
                                                                        onClick={() => openSubTaskPanel(node, st, displayIndex, stIdx)}
                                                                    >
                                                                        {/* TT */}
                                                                        <td className="p-2.5 border-r border-slate-100 dark:border-slate-800 text-center text-xs font-semibold text-slate-400">
                                                                            {displayIndex}.{stIdx + 1}
                                                                        </td>

                                                                        {isInternalWorkflow ? (
                                                                            <>
                                                                                <td className="p-2.5 border-r border-slate-100 dark:border-slate-800">
                                                                                    <div className="font-medium text-slate-700 dark:text-slate-300 text-[12px] whitespace-pre-wrap leading-snug pl-3 border-l-2 border-primary-300 dark:border-primary-700">
                                                                                        {st.name}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="p-2.5 border-r border-slate-100 dark:border-slate-800 text-[11px] whitespace-pre-wrap">{st.assignee_role}</td>
                                                                                <td className="p-2.5 border-r border-slate-100 dark:border-slate-800 text-[11px] whitespace-pre-wrap">{(st as any).coordinating_role}</td>
                                                                                <td className="p-2.5 border-r border-slate-100 dark:border-slate-800 text-[12px]">
                                                                                    {(st as any).sla_regulated && (
                                                                                        <div className="mb-2">
                                                                                            <span className="font-semibold text-slate-600 dark:text-slate-400">Theo quy định:</span><br/>
                                                                                            <span className="whitespace-pre-wrap block leading-snug">{(st as any).sla_regulated}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {stSlaStr && (
                                                                                        <div>
                                                                                            <span className="font-semibold text-slate-600 dark:text-slate-400">Theo quy trình:</span><br/>
                                                                                            <SlaBadge sla={stSlaStr} />
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                                <td className="p-2.5 border-r border-slate-100 dark:border-slate-800 align-top">
                                                                                    <TemplateCell 
                                                                                        node={node}
                                                                                        subTaskId={st.id}
                                                                                        initialForms={st.template_forms || ''}
                                                                                        initialUrl={st.template_url}
                                                                                        isAdmin={!!isAdmin}
                                                                                        onSuccess={handleNodeUpdateLocally}
                                                                                    />
                                                                                </td>
                                                                                <td className="p-2.5 border-r border-slate-100 dark:border-slate-800 text-[11px] whitespace-pre-wrap leading-snug align-top">
                                                                                    {(st as any).notes}
                                                                                </td>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                {/* SLA */}
                                                                                <td className="p-2.5 border-r border-slate-100 dark:border-slate-800 text-center">
                                                                                    <SlaBadge sla={stSlaStr} />
                                                                                </td>
                                                                                {/* Name */}
                                                                                <td className="p-2.5 border-r border-slate-100 dark:border-slate-800">
                                                                                    <div className="font-medium text-slate-700 dark:text-slate-300 text-[12px] whitespace-pre-wrap leading-snug pl-3 border-l-2 border-primary-300 dark:border-primary-700">
                                                                                        {st.name}
                                                                                    </div>
                                                                                </td>
                                                                                {/* Assignee */}
                                                                                <td className="p-2.5 border-r border-slate-100 dark:border-slate-800 text-[11px]">{st.assignee_role}</td>
                                                                                {/* Output */}
                                                                                <td className="p-2.5 border-r border-slate-100 dark:border-slate-800 text-[12px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{st.output}</td>
                                                                                {/* Template */}
                                                                                <td className="p-2.5 border-r border-slate-100 dark:border-slate-800 align-top">
                                                                                    <TemplateCell 
                                                                                        node={node}
                                                                                        subTaskId={st.id}
                                                                                        initialForms={st.template_forms || ''}
                                                                                        initialUrl={st.template_url}
                                                                                        isAdmin={!!isAdmin}
                                                                                        onSuccess={handleNodeUpdateLocally}
                                                                                    />
                                                                                </td>
                                                                                {/* Legal */}
                                                                                <td className="p-2.5 border-r border-slate-100 dark:border-slate-800 text-[11px]">
                                                                                    {st.legal_basis ? (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenLegalSearch(st.legal_basis); }}
                                                                                            className="text-left text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline transition-colors focus:outline-none"
                                                                                            title="Tra cứu nhanh"
                                                                                        >
                                                                                            {st.legal_basis}
                                                                                        </button>
                                                                                    ) : null}
                                                                                </td>
                                                                            </>
                                                                        )}

                                                                        {isAdmin && (
                                                                            <td className="p-1.5 text-center print:hidden">
                                                                                <ChevronRight size={12} className="text-slate-300 mx-auto" />
                                                                            </td>
                                                                        )}
                                                                    </tr>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}

                        {/* Empty state */}
                        {filteredNodes.length === 0 && (
                            <tr>
                                <td colSpan={isAdmin ? colCount + 1 : colCount} className="p-12 text-center text-slate-500 font-medium">
                                    {searchQuery ? 'Không tìm thấy bước nào phù hợp.' : 'Chưa có bước nghiệp vụ nào.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── FOOTER ── */}
            <div className="px-5 py-3 bg-bg-surface/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs flex-shrink-0 print:bg-slate-100 print:border-t-2">
                <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                        <LayoutList size={13} />
                        <strong className="text-slate-700 dark:text-slate-200">{stats.totalSteps}</strong> bước
                    </span>
                    {stats.totalSubTasks > 0 && (
                        <span className="flex items-center gap-1.5">
                            <FileText size={13} />
                            <strong className="text-slate-700 dark:text-slate-200">{stats.totalSubTasks}</strong> công việc con
                        </span>
                    )}
                </div>
                <button onClick={onClose}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700 print:hidden">
                    Đóng
                </button>
            </div>
        </div>
    );
};

export default WorkflowProcessTable;
