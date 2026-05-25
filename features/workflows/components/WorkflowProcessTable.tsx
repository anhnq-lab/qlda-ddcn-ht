import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import {
    ChevronDown, ChevronRight, Search, Printer, Download, ArrowRight,
    Clock, Shield, FileText, FileSpreadsheet, BookOpen, PenLine, Trash2,
    ArrowUp, ArrowDown, Plus, LayoutList, GitBranch, ExternalLink, Upload, Loader2
} from 'lucide-react';
import type { Workflow, WorkflowNode, WorkflowNodeMetadata, PhaseType } from '../../../types/workflow.types';
import { useSlidePanel } from '../../../context/SlidePanelContext';
import { useToast } from '../../../components/ui/Toast';
import NodeDetailPanel from './NodeDetailPanel';
import LegalDocumentSearch from '../../legal-documents/LegalDocumentSearch';
import { parseSla, resolveLegalReference, uploadTemplateFile } from '../utils/workflowUtils';
import { PHASE_CONFIG, groupNodesByPhase, computeTotalSla } from '../utils/phaseUtils';
import { useWorkflowRaci } from '../hooks/useWorkflowRaci';
import { RaciInline } from './RaciBadges';

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
        <div className="flex flex-col gap-0.5 items-start">
            {initialUrl ? (
                <a href={initialUrl} target="_blank" rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 text-primary-600 dark:text-primary-400 transition-colors border border-primary-100 dark:border-primary-800/50 text-[9.5px] max-w-full"
                    title="Tải biểu mẫu">
                    <Download size={10} className="shrink-0" />
                    <span className="font-medium truncate">{formsStr || 'Biểu mẫu'}</span>
                </a>
            ) : (
                <span className="text-slate-500 dark:text-slate-400 italic text-[9.5px] truncate block max-w-full">
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
                        className="inline-flex items-center gap-0.5 text-[9px] font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 px-1 py-0.5 rounded transition-colors disabled:opacity-50 mt-0.5 cursor-pointer"
                    >
                        {isUploading ? <Loader2 size={8} className="animate-spin" /> : <Upload size={8} />}
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


// PHASE_CONFIG is now imported from phaseUtils.ts
// Rename-phase? Just edit features/workflows/utils/phaseUtils.ts


// ─── SLA Badge ──────────────────────────────────────────────
const SlaBadge: React.FC<{ sla: string | null | undefined }> = ({ sla }) => {
    if (!sla) return <span className="text-slate-400 text-[9.5px]">—</span>;
    const parsed = parseSla(sla);
    if (!parsed) return <span className="text-slate-500 text-[9px] font-mono">{sla}</span>;
    
    // Color by duration
    const numMatch = sla.match(/(\d+)/);
    const days = numMatch ? parseInt(numMatch[1]) : 0;
    const color = days <= 7 
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
        : days <= 30 
            ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-400 border-warning-200 dark:border-warning-800'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    
    return (
        <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8.5px] font-bold border ${color} whitespace-nowrap`}>
            <Clock size={8.5} className="shrink-0" />
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
    const { raciMap, getStakeholderName } = useWorkflowRaci(workflowId);

    // ─── Fetch Data ──────────────────────────────────────────
    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const [wfRes, nodesRes] = await Promise.all([
                supabase.from('workflows').select('*').eq('id', workflowId).single(),
                supabase.from('workflow_nodes').select('*').eq('workflow_id', workflowId)
                    .or('is_deleted.eq.false,is_deleted.is.null')
                    .order('sort_order', { ascending: true })
                    .order('created_at', { ascending: true })
            ]);
            if (wfRes.error) throw wfRes.error;
            setWorkflow(wfRes.data as any);
            setNodes((nodesRes.data || []) as any);
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
            return (
                n.name.toLowerCase().includes(q) ||
                (n.assignee_role || '').toLowerCase().includes(q) ||
                (meta.legal_basis || '').toLowerCase().includes(q) ||
                (meta.output || '').toLowerCase().includes(q) ||
                (meta.description || '').toLowerCase().includes(q)
            );
        });
    }, [nodes, searchQuery]);

    // ─── Group by Phase → SubProcess (from phaseUtils) ─────────────
    const groupedPhases = useMemo(() => groupNodesByPhase(filteredNodes), [filteredNodes]);

    // ─── Summary stats ───────────────────────────────────────
    const stats = useMemo(() => {
        const totalSteps = filteredNodes.length;
        const totalSla = computeTotalSla(filteredNodes);
        return { totalSteps, totalSla };
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



    // ─── Print ───────────────────────────────────────────────
    const handlePrint = () => {
        window.print();
    };

    // ─── Loading state ───────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-800 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-2/3" />
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (!workflow) return null;

    const colCount = isInternalWorkflow ? 7 : 11;

    return (
        <div className="flex flex-col h-full bg-[#FAFAF8] dark:bg-slate-900 relative print:bg-white">
            {/* ── HEADER ── */}
            <div className="px-5 py-2.5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 print:border-b-2 print:border-slate-300 flex-shrink-0">
                {/* Title row */}
                <div className="flex items-start justify-between gap-4 mb-1.5">
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
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">
                        {workflow.description}
                    </p>
                )}
            </div>

            {/* ── TABLE BODY ── */}
            <div className="flex-1 overflow-auto custom-scrollbar print:overflow-visible">
                <table className="w-full text-left text-[11px] border-collapse table-fixed min-w-[1000px]">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-[5] shadow-sm shadow-slate-200/20 dark:shadow-slate-900/50 print:bg-slate-200">
                        <tr className="text-[9.5px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 text-center w-12">TT</th>
                            {isInternalWorkflow ? (
                                <>
                                    <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 w-[30%]">Nội dung công việc</th>
                                    <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 w-[14%]">Đơn vị thực hiện</th>
                                    <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 w-[14%]">Đơn vị phối hợp</th>
                                    <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 w-[16%]">Thời gian</th>
                                    <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 w-[16%]">Biểu mẫu</th>
                                    <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 w-[10%]">Ghi chú</th>
                                </>
                            ) : (
                                <>
                                    <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 w-14 text-center">SLA</th>
                                    <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 w-[30%]">Nội dung thực hiện</th>
                                    <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 w-[6%] text-center">R</th>
                                    <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 w-[6%] text-center">A</th>
                                    <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 w-[6%] text-center">C</th>
                                    <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 w-[6%] text-center">I</th>
                                    <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 w-[15%]">Đầu ra</th>
                                    <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 w-[13%]">Biểu mẫu</th>
                                    <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 w-[18%]">Cơ sở pháp lý</th>
                                </>
                            )}
                            {isAdmin && (
                                <th className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 text-center w-16 print:hidden">Thao tác</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                        {groupedPhases.map((group) => {
                            const phaseKey = group.phase;
                            const phaseConf = group.config;
                            const isPhaseExpanded = expandedPhases[phaseKey] !== false;
                            const phaseNodeCount = Object.values(group.subProcesses).reduce((c, arr) => c + arr.length, 0);

                            return (
                                <React.Fragment key={phaseKey}>
                                    {/* ── PHASE HEADER ROW ── */}
                                    <tr
                                        className={`bg-gradient-to-r ${phaseConf.gradient} cursor-pointer hover:brightness-95 transition-all print:bg-slate-100`}
                                        onClick={() => togglePhase(phaseKey)}
                                    >
                                        <td colSpan={isAdmin ? colCount + 1 : colCount}
                                            className="px-3 py-1 font-black text-slate-800 dark:text-white uppercase tracking-wide text-[10.5px] border-b border-slate-300 dark:border-slate-600">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-slate-500 dark:text-slate-400 print:hidden">
                                                    {isPhaseExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </span>
                                                <span className="text-sm print:hidden">{phaseConf.icon}</span>
                                                <span>{phaseConf.title}</span>
                                                <span className="text-slate-500 dark:text-slate-400 font-medium text-[9px] normal-case ml-1.5">
                                                    ({phaseNodeCount} bước)
                                                </span>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* ── SUB-PROCESS + NODES ── */}
                                    {isPhaseExpanded && (Object.entries(group.subProcesses) as [string, WorkflowNode[]][]).map(([subKey, subNodes]) => {
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
                                                            className="px-3 py-1 pl-6 font-semibold text-emerald-800 dark:text-emerald-300 tracking-wide text-[10px] border-b border-emerald-200 dark:border-emerald-800/50">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-emerald-600 dark:text-emerald-500 print:hidden">
                                                                    {isSpExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                                </span>
                                                                <FileSpreadsheet size={11} className="text-emerald-500" />
                                                                <span>{subKey}</span>
                                                                <span className="text-emerald-600/70 dark:text-emerald-400/70 font-medium text-[9px] normal-case ml-1">
                                                                    ({subNodes.length} bước)
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}

                                                {/* ── NODE ROWS ── */}
                                                {(isSpExpanded || isInternalWorkflow) && subNodes.map((node, index) => {
                                                    const meta = (node.metadata || {}) as WorkflowNodeMetadata;
                                                    const displayIndex = nodes.findIndex(n => n.id === node.id) + 1;

                                                    return (
                                                        <React.Fragment key={node.id}>
                                                            {/* Main step row */}
                                                            <tr className="bg-white dark:bg-slate-800 group border-b border-slate-200 dark:border-slate-700 hover:bg-blue-50/30 dark:hover:bg-slate-800 transition-colors">
                                                                {/* TT */}
                                                                <td className="px-1.5 py-1 border-r border-slate-200 dark:border-slate-700 text-center font-black text-slate-500 dark:text-slate-400 align-top">
                                                                    {displayIndex}
                                                                </td>

                                                                {isInternalWorkflow ? (
                                                                    <>
                                                                        {/* Nội dung (Internal) */}
                                                                        <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700 cursor-pointer align-top"
                                                                            onClick={() => openNodePanel(node)}>
                                                                            <div className="font-bold text-[12px] text-primary-700 dark:text-primary-400 whitespace-pre-wrap leading-snug">{node.name}</div>
                                                                            {meta.description && <div className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5 whitespace-pre-wrap">{meta.description}</div>}
                                                                        </td>
                                                                        {/* Đơn vị thực hiện */}
                                                                        <td className="px-1.5 py-1 border-r border-slate-200 dark:border-slate-700 text-[10px] whitespace-pre-wrap align-top">
                                                                            {node.assignee_role}
                                                                        </td>
                                                                        {/* Đơn vị phối hợp */}
                                                                        <td className="px-1.5 py-1 border-r border-slate-200 dark:border-slate-700 text-[10px] whitespace-pre-wrap align-top">
                                                                            {meta.coordinating_role}
                                                                        </td>
                                                                        {/* Thời gian */}
                                                                        <td className="px-1.5 py-1 border-r border-slate-200 dark:border-slate-700 text-[10px] align-top">
                                                                            {meta.sla_regulated && (
                                                                                <div className="mb-1">
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
                                                                        <td className="px-1.5 py-1 border-r border-slate-200 dark:border-slate-700 text-[9.5px] align-top">
                                                                            <TemplateCell 
                                                                                node={node}
                                                                                initialForms={meta.template_forms || ''}
                                                                                initialUrl={(meta as any).template_url}
                                                                                isAdmin={!!isAdmin}
                                                                                onSuccess={handleNodeUpdateLocally}
                                                                            />
                                                                        </td>
                                                                        {/* Ghi chú */}
                                                                        <td className="px-1.5 py-1 border-r border-slate-200 dark:border-slate-700 text-[9.5px] whitespace-pre-wrap leading-snug align-top">
                                                                            {meta.notes}
                                                                        </td>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {/* SLA */}
                                                                        <td className="px-1.5 py-1 border-r border-slate-200 dark:border-slate-700 text-center align-top">
                                                                            <SlaBadge sla={node.sla_formula} />
                                                                        </td>
                                                                        {/* Nội dung (Project) */}
                                                                        <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700 cursor-pointer align-top"
                                                                            onClick={() => openNodePanel(node)}>
                                                                            <div className="font-bold text-[11px] text-primary-700 dark:text-primary-400 whitespace-pre-wrap leading-snug">{node.name}</div>
                                                                            {meta.description && <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{meta.description}</div>}
                                                                        </td>
                                                                        {/* R */}
                                                                        <td className="px-1.5 py-1 border-r border-slate-200 dark:border-slate-700 align-top text-center">
                                                                            <RaciInline summary={raciMap.get(node.id)} type="R" getStakeholderName={getStakeholderName} />
                                                                        </td>
                                                                        {/* A */}
                                                                        <td className="px-1.5 py-1 border-r border-slate-200 dark:border-slate-700 align-top text-center">
                                                                            <RaciInline summary={raciMap.get(node.id)} type="A" getStakeholderName={getStakeholderName} />
                                                                        </td>
                                                                        {/* C */}
                                                                        <td className="px-1.5 py-1 border-r border-slate-200 dark:border-slate-700 align-top text-center">
                                                                            <RaciInline summary={raciMap.get(node.id)} type="C" getStakeholderName={getStakeholderName} />
                                                                        </td>
                                                                        {/* I */}
                                                                        <td className="px-1.5 py-1 border-r border-slate-200 dark:border-slate-700 align-top text-center">
                                                                            <RaciInline summary={raciMap.get(node.id)} type="I" getStakeholderName={getStakeholderName} />
                                                                        </td>
                                                                        {/* Đầu ra */}
                                                                        <td className="px-1.5 py-1 border-r border-slate-200 dark:border-slate-700 text-[9.5px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap align-top">
                                                                            {meta.output}
                                                                        </td>
                                                                        {/* Biểu mẫu */}
                                                                        <td className="px-1.5 py-1 border-r border-slate-200 dark:border-slate-700 align-top">
                                                                            <TemplateCell 
                                                                                node={node}
                                                                                initialForms={meta.template_forms || ''}
                                                                                initialUrl={(meta as any).template_url}
                                                                                isAdmin={!!isAdmin}
                                                                                onSuccess={handleNodeUpdateLocally}
                                                                            />
                                                                        </td>
                                                                        {/* CSPL */}
                                                                        <td className="px-1.5 py-1 border-r border-slate-200 dark:border-slate-700 text-[9.5px] align-top">
                                                                            {meta.legal_basis ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => { e.stopPropagation(); handleOpenLegalSearch(meta.legal_basis!); }}
                                                                                    className="text-left text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline transition-colors focus:outline-none whitespace-pre-wrap text-[9.5px]"
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
                                                                    <td className="px-1 py-0.5 text-center align-top print:hidden">
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); openNodePanel(node); }}
                                                                                className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                                                title="Chỉnh sửa bước"
                                                                            >
                                                                                <PenLine size={12} />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => handleDeleteNode(e, node)}
                                                                                className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
                                                                                title="Xóa bước này"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                )}
                                                            </tr>

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
            <div className="px-5 py-3 bg-white dark:bg-slate-800 dark:bg-slate-800 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs flex-shrink-0 print:bg-slate-100 print:border-t-2">
                <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                        <LayoutList size={13} />
                        <strong className="text-slate-700 dark:text-slate-200">{stats.totalSteps}</strong> bước
                    </span>

                    {stats.totalSla && (
                        <span className="flex items-center gap-1.5 ml-4 px-2 py-1 bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 rounded-lg border border-warning-200 dark:border-warning-800/50 print:border-none print:bg-transparent">
                            <Clock size={13} />
                            <span>Tổng T.gian ước tính:</span>
                            <strong className="font-bold">{stats.totalSla}</strong>
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
