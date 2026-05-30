import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../components/ui/Toast';
import { Save, FileText, Tag, Hash, ToggleLeft, LayoutList, Settings2, Clock, Shield, FileInput, CheckCircle2, ChevronRight, ArrowRight, PenLine, ArrowUp, ArrowDown, Trash2, Plus, X, FileSpreadsheet, ChevronDown, Download, Upload } from 'lucide-react';
import type { Workflow, WorkflowCategory, WorkflowNode } from '../../../types/workflow.types';
import { useSlidePanel } from '../../../context/SlidePanelContext';
import NodeDetailPanel from './NodeDetailPanel';
import { SubTaskDetailPanel } from './SubTaskDetailPanel';
import LegalDocumentSearch from '../../legal-documents/LegalDocumentSearch';

import { parseSla, resolveLegalReference } from '../utils/workflowUtils';
import { groupNodesByPhase, PHASE_CONFIG } from '../utils/phaseUtils';

interface WorkflowSlidePanelProps {
    workflowId: string; // empty string = CREATE mode
    onClose: () => void;
    onUpdate?: () => void;
    initialTab?: 'overview' | 'settings';
    onViewFlowchart?: () => void;
}

const WorkflowSlidePanel: React.FC<WorkflowSlidePanelProps> = ({
    workflowId, onClose, onUpdate, initialTab = 'overview', onViewFlowchart
}) => {
    const isCreateMode = !workflowId;
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [nodes, setNodes] = useState<WorkflowNode[]>([]);
    const [isLoading, setIsLoading] = useState(!isCreateMode);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'settings'>(isCreateMode ? 'settings' : initialTab);
    const { addToast } = useToast();
    const { openPanel, closePanel } = useSlidePanel();

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<WorkflowCategory>('project');
    const [isActive, setIsActive] = useState(true);
    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
    const [expandedSubProcesses, setExpandedSubProcesses] = useState<Record<string, boolean>>({});
    const [isWorkflowCodeExpanded, setIsWorkflowCodeExpanded] = useState(true);
    const importFileRef = React.useRef<HTMLInputElement>(null);

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

    const togglePhase = (phaseKey: string) => {
        setExpandedPhases(prev => ({ ...prev, [phaseKey]: prev[phaseKey] === undefined ? false : !prev[phaseKey] }));
    };

    const toggleSubProcess = (subProcessKey: string) => {
        setExpandedSubProcesses(prev => ({ ...prev, [subProcessKey]: prev[subProcessKey] === undefined ? false : !prev[subProcessKey] }));
    };

    useEffect(() => {
        if (isCreateMode) return;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [wfRes, nodesRes] = await Promise.all([
                    supabase.from('workflows').select('*').eq('id', workflowId).single(),
                    supabase.from('workflow_nodes').select('*').eq('workflow_id', workflowId).or('is_deleted.eq.false,is_deleted.is.null').order('sort_order', { ascending: true }).order('created_at', { ascending: true })
                ]);
                if (wfRes.error) throw wfRes.error;
                setWorkflow(wfRes.data as any);
                setName(wfRes.data.name || '');
                setCode(wfRes.data.code || '');
                setDescription(wfRes.data.description || '');
                setCategory((wfRes.data.category || 'project') as any);
                setIsActive(wfRes.data.is_active ?? true);
                setNodes((nodesRes.data || []) as any);
            } catch (err: any) {
                addToast({ title: 'Lỗi tải dữ liệu', message: err.message, type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [workflowId, addToast, isCreateMode]);

    // ─── CREATE ───────────────────────────────────────────────
    const handleCreate = async () => {
        if (!name.trim()) {
            addToast({ title: 'Thiếu thông tin', message: 'Vui lòng nhập tên quy trình.', type: 'error' });
            return;
        }
        if (!code.trim()) {
            addToast({ title: 'Thiếu thông tin', message: 'Vui lòng nhập mã quy trình.', type: 'error' });
            return;
        }
        setIsSaving(true);
        try {
            const { data, error } = await supabase.from('workflows')
                .insert({
                    name: name.trim(),
                    code: code.trim().toUpperCase(),
                    description: description || null,
                    category: category as any,
                    is_active: isActive,
                    version: 1
                } as any)
                .select()
                .single();
            if (error) throw error;
            
            addToast({ title: 'Tạo thành công', message: `Quy trình "${data.name}" đã được tạo.`, type: 'success' });
            if (onUpdate) onUpdate();
        } catch (err: any) {
            addToast({ title: 'Lỗi tạo quy trình', message: err.message, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    // ─── UPDATE ───────────────────────────────────────────────
    const handleSave = async () => {
        if (!workflow) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.from('workflows')
                .update({ name, code, description: description || null, category: category as any, is_active: isActive, updated_at: new Date().toISOString() })
                .eq('id', workflowId);
            if (error) throw error;
            addToast({ title: 'Cập nhật thành công', message: 'Đã lưu cấu hình quy trình.', type: 'success' });
            if (onUpdate) onUpdate();
        } catch (err: any) {
            addToast({ title: 'Lỗi khi lưu', message: err.message, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    // ─── DELETE WORKFLOW ──────────────────────────────────────
    const handleDeleteWorkflow = async () => {
        if (!workflow) return;
        if (!window.confirm(`Xác nhận xóa quy trình "${workflow.name}"?\n\nHệ thống sẽ xóa mạnh (hard delete) toàn bộ dữ liệu. Nếu không thể xóa do phân quyền hoặc dữ liệu đã được gán, quy trình sẽ được vô hiệu hóa. Bạn có chắc chắn?`)) return;
        
        try {
            // Delete instances first to cascade delete workflow_tasks and bypass RESTRICT constraint
            const { error: instanceErr } = await supabase.from('workflow_instances').delete().eq('workflow_id', workflowId);
            if (instanceErr) { /* non-fatal: cascade may already handle this */ }

            const { error: edgeErr } = await supabase.from('workflow_edges').delete().eq('workflow_id', workflowId);
            if (edgeErr) { /* non-fatal */ }

            const { error: nodeErr } = await supabase.from('workflow_nodes').delete().eq('workflow_id', workflowId);
            if (nodeErr) { /* non-fatal: will fallback to soft-deactivate */ }
            
            // Delete the workflow and return the deleted rows to check for RLS block
            const { data: deletedData, error } = await supabase.from('workflows').delete().eq('id', workflowId).select();
            
            if (error || !deletedData || deletedData.length === 0) {
                // Fallback: If any error happens (like 23503 or 400), or if RLS blocks (0 rows), we softly deactivate it
                const { error: softErr } = await supabase.from('workflows').update({ is_active: false }).eq('id', workflowId);
                if (softErr) {
                    throw new Error(`Xóa thất bại toàn phần. Bạn có thể không có quyền hoặc có lỗi DB.`);
                }
                addToast({ title: 'Đã chuyển trạng thái', message: `Đã vô hiệu hóa quy trình "${workflow.name}" (Có thể do thiếu quyền Admin hoặc bị ràng buộc dữ liệu).`, type: 'success' });
            } else {
                addToast({ title: 'Đã xóa', message: `Xóa quy trình "${workflow.name}" thành công.`, type: 'success' });
            }
            
            if (onUpdate) onUpdate();
            onClose();
        } catch (err: any) {
            addToast({ title: 'Lỗi xóa quy trình', message: err.message || JSON.stringify(err), type: 'error' });
        }
    };

    // ─── NODE CRUD ────────────────────────────────────────────
    const handleSaveNode = async (nodeId: string, updatedData: any) => {
        try {
            const { error } = await supabase.from('workflow_nodes')
                .update(updatedData)
                .eq('id', nodeId);
            if (error) throw error;
            addToast({ title: 'Cập nhật thành công', message: 'Đã lưu thay đổi bước quy trình.', type: 'success' });
            setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updatedData } : n));
        } catch (err: any) {
            addToast({ title: 'Lỗi cập nhật', message: err.message, type: 'error' });
        }
    };

    const rebuildLinearEdges = async (orderedNodes: WorkflowNode[]) => {
        try {
            await supabase.from('workflow_edges').delete().eq('workflow_id', workflowId);
            const newEdges = [];
            for (let i = 0; i < orderedNodes.length - 1; i++) {
                newEdges.push({
                    workflow_id: workflowId,
                    source_node: orderedNodes[i].id,
                    target_node: orderedNodes[i + 1].id
                });
            }
            if (newEdges.length > 0) {
                await supabase.from('workflow_edges').insert(newEdges);
            }
        } catch (err) {
            console.error('Lỗi khi cập nhật liên kết:', err);
        }
    };

    const reorderNodeSortOrders = async (orderedNodes: WorkflowNode[]) => {
        // Update sort_order column (integer) — replaces the old created_at timestamp hack
        for (let i = 0; i < orderedNodes.length; i++) {
            await supabase.from('workflow_nodes')
                .update({ sort_order: i } as any)
                .eq('id', orderedNodes[i].id);
        }
        return orderedNodes;
    };

    const moveNodeUp = async (nodeId: string) => {
        const idx = nodes.findIndex(n => n.id === nodeId);
        if (idx <= 0) return;
        const newNodes = [...nodes];
        [newNodes[idx - 1], newNodes[idx]] = [newNodes[idx], newNodes[idx - 1]];
        setNodes(newNodes);
        
        const finalNodes = await reorderNodeSortOrders(newNodes);
        await rebuildLinearEdges(finalNodes);
        addToast({ title: 'Cập nhật', message: 'Đã đẩy bước lên trên', type: 'success' });
    };

    const moveNodeDown = async (nodeId: string) => {
        const idx = nodes.findIndex(n => n.id === nodeId);
        if (idx < 0 || idx >= nodes.length - 1) return;
        const newNodes = [...nodes];
        [newNodes[idx], newNodes[idx + 1]] = [newNodes[idx + 1], newNodes[idx]];
        setNodes(newNodes);

        const finalNodes = await reorderNodeSortOrders(newNodes);
        await rebuildLinearEdges(finalNodes);
        addToast({ title: 'Cập nhật', message: 'Đã kéo bước xuống dưới', type: 'success' });
    };

    const addNode = async () => {
        try {
            const newNodeCode = (nodes.length + 1).toString().padStart(2, '0');
            const nextSortOrder = nodes.length; // 0-indexed, place at end
            const { data, error } = await supabase.from('workflow_nodes')
                .insert({
                    workflow_id: workflowId,
                    name: `[NEW-${newNodeCode}] Bước mới`,
                    type: 'input',
                    assignee_role: 'Chưa giao',
                    sort_order: nextSortOrder
                } as any)
                .select()
                .single();
            if (error) throw error;
            
            const newNodes = [...nodes, data] as any[];
            setNodes(newNodes as any);
            await rebuildLinearEdges(newNodes);
            addToast({ title: 'Thêm bước', message: 'Đã thêm bước mới vào cuối', type: 'success' });
        } catch (err: any) {
            addToast({ title: 'Lỗi thêm bước', message: err.message, type: 'error' });
        }
    };

    const deleteNode = async (nodeId: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bước này?')) return;
        try {
            // 1. Delete related edges FIRST (FK constraint: workflow_edges → workflow_nodes)
            const { error: edgeErr } = await supabase.from('workflow_edges')
                .delete()
                .or(`source_node.eq.${nodeId},target_node.eq.${nodeId}`);
            
            if (edgeErr) { /* non-fatal: edges may not exist */ }

            // 2. Then delete the node
            const { data: deletedData, error } = await supabase
                .from('workflow_nodes')
                .delete()
                .eq('id', nodeId)
                .select();
            
            if (error) {
                // Fallback to soft delete
                const { data: softData, error: softErr } = await supabase
                    .from('workflow_nodes')
                    .update({ is_deleted: true })
                    .eq('id', nodeId)
                    .select();
                
                if (softErr) {
                    throw new Error(`Không thể xóa: ${error.message}`);
                }
                
                if (!softData || softData.length === 0) {
                    throw new Error('Không tìm thấy bước để xóa. Có thể bước đã bị xóa trước đó.');
                }
                
                addToast({ title: 'Đã ẩn bước', message: 'Bước này đã bị ẩn (soft delete).', type: 'info' });
            } else if (!deletedData || deletedData.length === 0) {
                // RLS might block — try soft delete
                const { error: softErr } = await supabase
                    .from('workflow_nodes')
                    .update({ is_deleted: true })
                    .eq('id', nodeId);
                
                if (softErr) throw new Error(`Soft delete failed: ${softErr.message}`);
                addToast({ title: 'Đã ẩn bước', message: 'Bước đã bị ẩn do ràng buộc phân quyền.', type: 'info' });
            } else {
                addToast({ title: 'Đã xóa', message: 'Xóa bước thành công.', type: 'success' });
            }

            // 3. Update UI and rebuild remaining edges
            const newNodes = nodes.filter(n => n.id !== nodeId);
            setNodes(newNodes);
            await rebuildLinearEdges(newNodes);
        } catch (err: any) {
            addToast({ title: 'Lỗi xóa bước', message: err.message || 'Lỗi không xác định', type: 'error' });
        }
    };

    if (isLoading) return (
        <div className="flex flex-col h-full bg-bg-surface p-4 pt-16">
            <div className="animate-pulse space-y-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-slate-200 dark:bg-slate-800 rounded" />)}
            </div>
        </div>
    );

    if (!isCreateMode && !workflow) return null;

    const displayNodes = nodes;

    const isInternalWorkflow = ['hr', 'finance', 'document', 'asset', 'other'].includes(workflow?.category || 'project');

    const groupedPhases = groupNodesByPhase(displayNodes);

    const openEditPanel = (node: WorkflowNode) => {
        openPanel({
            id: 'node-detail-' + node.id,
            title: 'Chi tiết Bước',
            icon: <PenLine size={16} />,
            component: <NodeDetailPanel node={node} onSave={handleSaveNode} />
        });
    };


    const nodeTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
        approval: { icon: Shield, color: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30', label: 'Phê duyệt' },
        input: { icon: FileInput, color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30', label: 'Lập hồ sơ' },
        automated: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30', label: 'Tự động' },
        start: { icon: ChevronRight, color: 'text-emerald-600 bg-emerald-100', label: 'Bắt đầu' },
        end: { icon: CheckCircle2, color: 'text-slate-500 bg-slate-100', label: 'Kết thúc' },
    };

    const CATEGORY_OPTIONS: { value: WorkflowCategory; label: string }[] = [
        { value: 'project', label: 'Quản lý dự án' },
        { value: 'implementation', label: 'Thực hiện Dự án' },
        { value: 'investment', label: 'Đầu tư công' },
        { value: 'procurement', label: 'Đấu thầu' },
        { value: 'document', label: 'Văn bản' },
        { value: 'finance', label: 'Tài chính' },
        { value: 'hr', label: 'Nhân sự' },
        { value: 'asset', label: 'Tài sản' },
        { value: 'other', label: 'Khác' },
    ];

    // ─── Export/Import JSON (Admin feature) ─────────────────────────

    const exportWorkflowJson = () => {
        if (!workflow) return;
        const data = {
            _version: 1,
            _exported_at: new Date().toISOString(),
            workflow: {
                name,
                code,
                category,
                description,
                is_active: isActive,
            },
            nodes: nodes.map((n, idx) => ({
                name: n.name,
                type: n.type,
                assignee_role: n.assignee_role,
                sla_formula: n.sla_formula,
                sort_order: idx,
                metadata: n.metadata,
            })),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${code || 'workflow'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addToast({ title: 'Export thành công', message: `Đã xuất file ${code}.json`, type: 'success' });
    };

    const importWorkflowJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !workflow) return;
        try {
            const text = await file.text();
            const json = JSON.parse(text);
            if (!json._version || !json.nodes) throw new Error('File JSON không hợp lệ');

            // Update workflow metadata
            const { error: wfErr } = await supabase.from('workflows').update({
                name: json.workflow.name,
                code: json.workflow.code,
                category: json.workflow.category,
                description: json.workflow.description,
            }).eq('id', workflow.id);
            if (wfErr) throw wfErr;

            // Delete existing nodes then re-insert
            await supabase.from('workflow_edges').delete().eq('workflow_id', workflow.id);
            await supabase.from('workflow_nodes').delete().eq('workflow_id', workflow.id);

            const baseDate = new Date('2020-01-01T00:00:00Z');
            const newNodes = json.nodes.map((n: any, idx: number) => ({
                workflow_id: workflow.id,
                name: n.name,
                type: n.type,
                assignee_role: n.assignee_role || null,
                sla_formula: n.sla_formula || null,
                created_at: new Date(baseDate.getTime() + idx * 60000).toISOString(),
                metadata: n.metadata || {},
            }));

            const { data: insertedNodes, error: nodesErr } = await supabase
                .from('workflow_nodes')
                .insert(newNodes)
                .select();
            if (nodesErr) throw nodesErr;

            // Rebuild linear edges
            if (insertedNodes && insertedNodes.length > 1) {
                const edges = insertedNodes.slice(0, -1).map((n: any, i: number) => ({
                    workflow_id: workflow.id,
                    source_node: n.id,
                    target_node: insertedNodes[i + 1].id,
                }));
                await supabase.from('workflow_edges').insert(edges);
            }

            addToast({ title: 'Import thành công', message: `Đã nhập ${json.nodes.length} bước từ file`, type: 'success' });
            // Refresh by reloading the panel
            onClose();
        } catch (err: any) {
            addToast({ title: 'Import thất bại', message: err.message, type: 'error' });
        } finally {
            if (importFileRef.current) importFileRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#FAFAF8] dark:bg-slate-900 relative">
            <div className="p-4 pb-0 bg-bg-surface border-b border-border-subtle">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <LayoutList size={20} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-txt-primary leading-tight font-display">
                                {isCreateMode ? 'Tạo Quy Trình Mới' : workflow?.name}
                            </h2>
                            {!isCreateMode && (
                                <p className="text-xs font-mono text-slate-400">{workflow?.code} · v{workflow?.version}.0</p>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-bg-muted dark:hover:text-white transition-colors"
                        title="Đóng panel"
                    >
                        <X size={20} />
                    </button>
                </div>
                {!isCreateMode && (
                    <div className="flex gap-1">
                        {[
                            { id: 'overview', label: 'Tổng quan', icon: LayoutList },
                            { id: 'settings', label: 'Cài đặt', icon: Settings2 },
                        ].map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
                                    activeTab === t.id
                                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                        : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}>
                                <t.icon size={14} />{t.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-hidden p-4 pb-20 flex flex-col">
                {!isCreateMode && activeTab === 'overview' && (
                    <div className="flex flex-col gap-3 animate-fade-in h-full">
                        <div className="bg-bg-surface rounded-xl p-3 border border-border-subtle shadow-sm">
                            <p className="text-sm text-txt-muted leading-relaxed">
                                {workflow?.description || 'Chưa có mô tả quy trình.'}
                            </p>
                            <div className="flex items-center gap-2 pt-2">
                                <div className="px-2.5 py-1 bg-bg-muted rounded-lg text-xs font-bold text-txt-muted">
                                    {displayNodes.length} bước thực hiện
                                </div>
                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                    isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                             : 'bg-slate-100 text-slate-500'}`}>
                                    {isActive ? '● Đang hoạt động' : '○ Tạm dừng'}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 flex-1 min-h-0">
                            <div className="flex items-center justify-between flex-shrink-0">
                                <h3 className="text-[13px] font-bold text-txt-primary uppercase tracking-wider">Quy trình chi tiết</h3>
                                {onViewFlowchart && (
                                    <button onClick={onViewFlowchart}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs transition shadow-sm"
                                        title="Xem Sơ đồ Quy trình">
                                        <ArrowRight size={13} /> Sơ đồ
                                    </button>
                                )}
                            </div>
                            <div className="overflow-y-auto flex-1 min-h-0 rounded-xl border border-border bg-bg-surface shadow-sm custom-scrollbar">
                                <table className="w-full text-left text-[13px] border-collapse table-fixed">
                                    <thead className="bg-bg-subtle sticky top-0 z-10 shadow-sm shadow-slate-200/20 dark:shadow-slate-900/50">
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-txt-muted">
                                            <th className="p-2.5 border-r border-b border-border text-center w-10 align-middle">TT</th>
                                            {isInternalWorkflow ? (
                                                <>
                                                    <th className="p-2.5 border-r border-b border-border w-[30%] align-middle">Nội dung công việc</th>
                                                    <th className="p-2.5 border-r border-b border-border w-[12%] align-middle">Đơn vị thực hiện</th>
                                                    <th className="p-2.5 border-r border-b border-border w-[12%] align-middle">Đơn vị phối hợp</th>
                                                    <th className="p-2.5 border-r border-b border-border w-[20%] align-middle">Thời gian thực hiện</th>
                                                    <th className="p-2.5 border-r border-b border-border w-[12%] align-middle">Ghi chú</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="p-2.5 border-r border-b border-border w-14 align-middle text-center">SLA</th>
                                                    <th className="p-2.5 border-r border-b border-border w-[26%] align-middle">Công việc chi tiết</th>
                                                    <th className="p-2.5 border-r border-b border-border w-[13%] align-middle">Đơn vị thực hiện</th>
                                                    <th className="p-2.5 border-r border-b border-border w-[13%] align-middle">Đầu ra</th>
                                                    <th className="p-2.5 border-r border-b border-border w-[10%] align-middle">Biểu mẫu</th>
                                                    <th className="p-2.5 border-r border-b border-border w-[13%] align-middle">Cơ sở pháp lý</th>
                                                </>
                                            )}
                                            <th className="p-2.5 border-b border-border text-center w-20 align-middle">Tác vụ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-txt-secondary">
                                        {groupedPhases.map((group) => {
                                            const phaseKey = group.phase;
                                            const phaseConf = group.config;
                                            const isExpanded = expandedPhases[phaseKey] !== false;
                                            return (
                                                <React.Fragment key={phaseKey}>
                                                    {!isInternalWorkflow && (
                                                        <tr 
                                                            className="bg-bg-subtle cursor-pointer hover:bg-bg-hover-row transition-colors"
                                                            onClick={() => togglePhase(phaseKey)}
                                                        >
                                                            <td colSpan={8} className="p-3 font-bold text-txt-primary uppercase tracking-wide text-[13px] border-b border-slate-300 dark:border-slate-600">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-txt-muted">
                                                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                                    </span>
                                                                    Giai đoạn: {phaseConf.title} 
                                                                    <span className="text-txt-muted font-medium text-xs normal-case ml-2">
                                                                        ({Object.values(group.subProcesses).reduce((count: number, nodes: any) => count + nodes.length, 0)} bước)
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}

                                                    {(isExpanded || isInternalWorkflow) && Object.entries(group.subProcesses).map(([subKey, subNodes]: [string, any]) => {
                                                        const spToggleKey = `${phaseKey}-${subKey}`;
                                                        const isSpExpanded = expandedSubProcesses[spToggleKey] !== false;

                                                        return (
                                                            <React.Fragment key={spToggleKey}>
                                                                {!isInternalWorkflow && subKey !== 'Mặc định' && (
                                                                    <tr 
                                                                        className="bg-emerald-50/70 dark:bg-emerald-900/40 cursor-pointer hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60 transition-colors"
                                                                        onClick={() => toggleSubProcess(spToggleKey)}
                                                                    >
                                                                        <td colSpan={8} className="p-2 pl-6 font-semibold text-emerald-800 dark:text-emerald-300 tracking-wide text-[13px] border-b border-emerald-200 dark:border-emerald-800/50">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-emerald-600 dark:text-emerald-500">
                                                                                    {isSpExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                                                </span>
                                                                                <FileSpreadsheet size={16} className="text-emerald-500 dark:text-emerald-500" />
                                                                                <span>{subKey}</span>
                                                                                <span className="text-emerald-600/70 dark:text-emerald-400/70 font-medium text-[11px] normal-case ml-2">({(subNodes as any[]).length} bước)</span>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}

                                                                {(isSpExpanded || isInternalWorkflow) && (subNodes as any[]).map((node: any, index: number) => {
                                                                    const meta = (node.metadata as any) || {};
                                                                    const duration = parseSla(node.sla_formula);
                                                                    const subTasks = meta.sub_tasks || [];
                                                                    const displayIndex = isInternalWorkflow ? displayNodes.findIndex(n => n.id === node.id) + 1 : index + 1;

                                                                    return (
                                                                        <React.Fragment key={node.id}>
                                                                            <tr className="bg-bg-subtle group border-b text-txt-primary border-border">
                                                                                <td className="p-3 border-r border-border text-center font-bold text-slate-500">
                                                                                    {displayIndex}
                                                                                </td>
                                                                                {isInternalWorkflow ? (
                                                                                    <>
                                                                                        <td className="p-3 border-r border-border cursor-pointer" onClick={() => openEditPanel(node)}>
                                                                                            <div className="font-bold text-sm text-primary-700 dark:text-primary-400 whitespace-pre-wrap">{node.name}</div>
                                                                                            {meta.description && <div className="text-xs text-slate-500 mt-0.5">{meta.description}</div>}
                                                                                        </td>
                                                                                        <td className="p-3 border-r border-border">
                                                                                            <div className="whitespace-pre-wrap text-[12.5px]">{node.assignee_role}</div>
                                                                                        </td>
                                                                                        <td className="p-3 border-r border-border">
                                                                                            <div className="whitespace-pre-wrap text-[12.5px]">{meta.coordinating_role}</div>
                                                                                        </td>
                                                                                        <td className="p-3 border-r border-border text-[12px]">
                                                                                            {meta.sla_regulated && (
                                                                                                <div className="mb-2">
                                                                                                    <span className="font-semibold text-txt-muted">Theo quy định:</span><br/>
                                                                                                    <span className="whitespace-pre-wrap block leading-snug">{meta.sla_regulated}</span>
                                                                                                </div>
                                                                                            )}
                                                                                            {node.sla_formula && (
                                                                                                <div>
                                                                                                    <span className="font-semibold text-txt-muted">Theo quy trình:</span><br/>
                                                                                                    <span className="whitespace-pre-wrap block leading-snug">{node.sla_formula}</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="p-3 border-r border-border">
                                                                                            <div className="whitespace-pre-wrap text-[12px] leading-snug">{meta.notes}</div>
                                                                                        </td>
                                                                                    </>
                                                                                ) : (
                                                                                    <td colSpan={6} className="p-3 cursor-pointer" onClick={() => openEditPanel(node)}>
                                                                                        <div className="font-bold text-sm text-primary-700 dark:text-primary-400">{node.name}</div>
                                                                                        {meta.description && <div className="text-xs text-slate-500 mt-0.5">{meta.description}</div>}
                                                                                    </td>
                                                                                )}
                                                                                <td className="p-2 text-center align-middle border-border">
                                                                                    <div className="flex items-center justify-center gap-1 opacity-100">
                                                                                        <button onClick={(e) => { e.stopPropagation(); moveNodeUp(node.id); }}
                                                                                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" title="Lên trên">
                                                                                            <ArrowUp size={14} />
                                                                                        </button>
                                                                                        <button onClick={(e) => { e.stopPropagation(); moveNodeDown(node.id); }}
                                                                                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" title="Xuống dưới">
                                                                                            <ArrowDown size={14} />
                                                                                        </button>
                                                                                        <button onClick={(e) => { e.stopPropagation(); openEditPanel(node); }}
                                                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Chỉnh sửa">
                                                                                            <PenLine size={14} />
                                                                                        </button>
                                                                                        <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                                                                                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="Xóa">
                                                                                            <Trash2 size={14} />
                                                                                        </button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                            {/* Render Sub Tasks */}
                                                                            {subTasks.map((st: any, stIdx: number) => {
                                                                                const stSlaStr = st.sla ? `${st.sla}${st.sla_unit || 'd'}` : null;
                                                                                const stSla = stSlaStr ? parseSla(stSlaStr) : null;
                                                                                return (
                                                                                <tr key={st.id || stIdx}
                                                                                    className="bg-bg-surface hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                                                    onClick={() => openPanel({
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
                                                                                    })}
                                                                                >
                                                                                    <td className="p-2.5 border-r border-border-subtle text-center text-xs font-semibold text-slate-400">
                                                                                        {displayIndex}.{stIdx + 1}
                                                                                    </td>
                                                                                    {isInternalWorkflow ? (
                                                                                        <>
                                                                                            <td className="p-2.5 border-r border-border-subtle">
                                                                                                <div className="font-medium text-txt-secondary text-[12px] whitespace-pre-wrap leading-snug">{st.name}</div>
                                                                                            </td>
                                                                                            <td className="p-2.5 border-r border-border-subtle text-[11px] whitespace-pre-wrap">
                                                                                                {st.assignee_role}
                                                                                            </td>
                                                                                            <td className="p-2.5 border-r border-border-subtle text-[11px] whitespace-pre-wrap">
                                                                                                {st.coordinating_role}
                                                                                            </td>
                                                                                            <td className="p-2.5 border-r border-border-subtle text-[12px]">
                                                                                                {st.sla_regulated && (
                                                                                                    <div className="mb-2">
                                                                                                        <span className="font-semibold text-txt-muted">Theo quy định:</span><br/>
                                                                                                        <span className="whitespace-pre-wrap block leading-snug">{st.sla_regulated}</span>
                                                                                                    </div>
                                                                                                )}
                                                                                                {stSla && (
                                                                                                    <div>
                                                                                                        <span className="font-semibold text-txt-muted">Theo quy trình:</span><br/>
                                                                                                        <span className="whitespace-pre-wrap block leading-snug">{stSla}</span>
                                                                                                    </div>
                                                                                                )}
                                                                                            </td>
                                                                                            <td className="p-2.5 border-r border-border-subtle text-[11px] whitespace-pre-wrap leading-snug">
                                                                                                {st.notes}
                                                                                            </td>
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <td className="p-2.5 border-r border-border-subtle text-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10">
                                                                                                {stSla || ''}
                                                                                            </td>
                                                                                            <td className="p-2.5 border-r border-border-subtle">
                                                                                                <div className="font-medium text-txt-secondary text-[12px] whitespace-pre-wrap leading-snug">{st.name}</div>
                                                                                            </td>
                                                                                            <td className="p-2.5 border-r border-border-subtle text-[11px]">
                                                                                                {st.assignee_role}
                                                                                            </td>
                                                                                            <td className="p-2.5 border-r border-border-subtle text-[12px] text-txt-muted whitespace-pre-wrap">
                                                                                                {st.output}
                                                                                            </td>
                                                                                            <td className="p-2.5 border-r border-border-subtle text-[11px] align-middle">
                                                                                                {st.template_url ? (
                                                                                                    <a href={st.template_url} target="_blank" rel="noreferrer" 
                                                                                                       onClick={(e) => e.stopPropagation()}
                                                                                                       className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 text-primary-600 dark:text-primary-400 transition-colors group border border-primary-100 dark:border-primary-800/50"
                                                                                                       title="Tải biểu mẫu đính kèm">
                                                                                                        <Download size={13} className="shrink-0 group-hover:-translate-y-0.5 transition-transform" />
                                                                                                        <span className="font-semibold italic line-clamp-2">
                                                                                                            {st.template_forms || "Biểu mẫu đính kèm"}
                                                                                                        </span>
                                                                                                    </a>
                                                                                                ) : (
                                                                                                    <span className="text-txt-muted italic break-words line-clamp-2" title={st.template_forms}>
                                                                                                        {st.template_forms || "-"}
                                                                                                    </span>
                                                                                                )}
                                                                                            </td>
                                                                                            <td className="p-2.5 border-r border-border-subtle text-[11px] text-txt-muted">
                                                                                                {st.legal_basis ? (
                                                                                                    <button 
                                                                                                        type="button"
                                                                                                        onClick={(e) => {
                                                                                                            e.preventDefault();
                                                                                                            e.stopPropagation();
                                                                                                            handleOpenLegalSearch(st.legal_basis);
                                                                                                        }}
                                                                                                        className="text-left text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline transition-colors focus:outline-none"
                                                                                                        title="Nhấn để tra cứu nhanh"
                                                                                                    >
                                                                                                        {st.legal_basis}
                                                                                                    </button>
                                                                                                ) : null}
                                                                                            </td>
                                                                                        </>
                                                                                    )}
                                                                                    <td className="p-1.5 border-border-subtle text-center">
                                                                                        <ChevronRight size={12} className="text-slate-300 mx-auto" />
                                                                                    </td>
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
                                        {displayNodes.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="p-10 text-center text-slate-500 font-medium">
                                                    Chưa có bước nghiệp vụ nào. Hãy thêm bước đầu tiên.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                <div className="p-3 border-t border-border bg-bg-subtle flex justify-center">
                                    <button onClick={addNode} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-colors border border-dashed border-primary-200 dark:border-primary-800">
                                        <Plus size={16} /> Thêm Bước Nghiệp Vụ Mới
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB CÀI ĐẶT (also used for CREATE) ── */}
                {(activeTab === 'settings' || isCreateMode) && (
                    <div className="space-y-6 animate-fade-in overflow-auto custom-scrollbar flex-1 pb-8">
                        {isCreateMode && (
                            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 flex items-start gap-3">
                                <Plus size={18} className="text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-primary-800 dark:text-primary-300">Tạo quy trình mới</p>
                                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">Điền thông tin bên dưới để tạo khung quy trình. Sau khi tạo, bạn có thể thêm các bước nghiệp vụ.</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-bg-surface p-5 rounded-2xl border border-border shadow-sm space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-txt-muted uppercase tracking-wide flex items-center gap-1.5">
                                    <FileText size={14} className="text-primary-500" /> Tên quy trình <span className="text-rose-500">*</span>
                                </label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)}
                                    placeholder="VD: Quy trình phê duyệt thiết kế cơ sở"
                                    className="w-full h-11 bg-bg-subtle border border-border rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-txt-muted uppercase tracking-wide flex items-center gap-1.5">
                                        <Hash size={14} className="text-emerald-500" /> Mã quy trình <span className="text-rose-500">*</span>
                                    </label>
                                    <input type="text" value={code} onChange={e => setCode(e.target.value)}
                                        placeholder="VD: QT-TKCS"
                                        className="w-full h-11 bg-bg-subtle border border-border rounded-xl px-4 text-sm font-semibold uppercase font-mono focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-txt-muted uppercase tracking-wide flex items-center gap-1.5">
                                        <Tag size={14} className="text-blue-500" /> Phân loại
                                    </label>
                                    <select value={category} onChange={e => setCategory(e.target.value as WorkflowCategory)}
                                        className="w-full h-11 bg-bg-subtle border border-border rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors">
                                        {CATEGORY_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-txt-muted uppercase tracking-wide flex items-center gap-1.5">
                                    <FileText size={14} className="text-slate-500" /> Mô tả
                                </label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                                    placeholder="Mô tả quy trình, mục đích, phạm vi áp dụng..."
                                    className="w-full bg-bg-subtle border border-border rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors custom-scrollbar" />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-bg-subtle rounded-xl border border-border-subtle">
                                <div>
                                    <h4 className="text-sm font-bold text-txt-primary flex items-center gap-2">
                                        <ToggleLeft size={16} className={isActive ? 'text-emerald-500' : 'text-slate-400'} />
                                        Trạng thái hoạt động
                                    </h4>
                                    <p className="text-[11px] text-slate-500 mt-1">Bật để hệ thống có thể tạo hồ sơ từ chuẩn này.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-bg-surface after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500" />
                                </label>
                            </div>
                        </div>

                        {/* Delete zone (only for edit mode) */}
                        {!isCreateMode && (
                            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/50 rounded-xl p-4">
                                <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-2">Vùng nguy hiểm</h4>
                                <p className="text-xs text-rose-600 dark:text-rose-500 mb-3">Xóa quy trình sẽ xóa tất cả các bước nghiệp vụ liên quan. Thao tác này không thể hoàn tác.</p>
                                <button onClick={handleDeleteWorkflow}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors">
                                    <Trash2 size={15} /> Xóa Quy Trình Này
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-bg-surface dark:bg-slate-800 backdrop-blur-md border-t border-border flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    {!isCreateMode && (
                        <>
                            <button onClick={exportWorkflowJson}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-txt-muted hover:bg-bg-muted transition border border-border"
                                title="Xuất cấu hình JSON">
                                <Download size={14} /> Export
                            </button>
                            <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-txt-muted hover:bg-bg-muted transition border border-border cursor-pointer"
                                title="Nhập cấu hình từ file JSON">
                                <Upload size={14} /> Import
                                <input ref={importFileRef} type="file" accept=".json" onChange={importWorkflowJson} className="hidden" />
                            </label>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-txt-muted hover:bg-bg-muted transition border border-border">
                        Đóng
                    </button>
                    {(activeTab === 'settings' || isCreateMode) && (
                        <button onClick={isCreateMode ? handleCreate : handleSave} disabled={isSaving}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition shadow-md flex items-center gap-2 disabled:opacity-50">
                            {isSaving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
                            {isCreateMode ? 'Tạo Quy Trình' : 'Lưu cài đặt'}
                        </button>
                    )}
                </div>
            </div>

            {/* Removal of NodeEditModal Component since we are using openEditPanel slide panel */}
        </div>
    );
};

export default WorkflowSlidePanel;
