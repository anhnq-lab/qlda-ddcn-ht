import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { GitBranch, Plus, AlertCircle, FileText, DownloadCloud, ArrowLeft, LayoutGrid, List as ListIcon, Search, Trash2, PenLine, FileSpreadsheet } from 'lucide-react';
import { getStandardWorkflowTemplates } from './data/seedWorkflows';

import type { Workflow, WorkflowNode, WorkflowEdge } from '../../types/workflow.types';
import { useToast } from '../../components/ui/Toast';
import { useSlidePanel } from '../../context/SlidePanelContext';
import FlowchartViewer from './components/FlowchartViewer';
import WorkflowBuilderPanel from './components/WorkflowBuilderPanel';
import WorkflowProcessTable from './components/WorkflowProcessTable';
import InternalWorkflowViewerPanel from './components/InternalWorkflowViewerPanel';
import { WorkflowStepDetailPanel } from './components/WorkflowStepDetailPanel';

const WorkflowManagerPage: React.FC = () => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSeeding, setIsSeeding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([]);
    const [workflowEdges, setWorkflowEdges] = useState<WorkflowEdge[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    
    // UI states
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'flowchart'>('grid');
    const [activeTab, setActiveTab] = useState<'project' | 'internal'>('project');
    const [searchQuery, setSearchQuery] = useState('');
    
    const { addToast } = useToast();
    const { openPanel, closePanel } = useSlidePanel();
    
    // Memoized data for FlowchartViewer to prevent infinite loop
    const processedNodes = useMemo(() => 
        workflowNodes.map(n => ({ 
            id: n.id, 
            name: n.name, 
            type: n.type as any, 
            assignee_role: n.assignee_role || undefined, 
            sla_formula: n.sla_formula || undefined, 
            metadata: n.metadata 
        })), 
        [workflowNodes]
    );

    const processedEdges = useMemo(() => 
        workflowEdges.map(e => ({ 
            source: e.source_node, 
            target: e.target_node,
            condition: e.condition_expr || undefined
        })), 
        [workflowEdges]
    );

    const isMissingStandardData = workflows.length === 0;

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const hasAutoSeeded = useRef(false);

    // Auto-seed disabled. Users can manually seed data via the UI if needed.

    const fetchWorkflows = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('workflows')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) {
                if (fetchError.code === '42P01') {
                    setError('Bảng workflows chưa có. Bạn hãy kiểm tra lại Migration.');
                } else {
                    throw fetchError;
                }
            } else {
                setWorkflows((data || []) as any);
            }
        } catch (err: any) {
            console.error('Error fetching workflows:', err);
            setError(err.message || 'Không thể tải danh sách quy trình.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadWorkflowDetails = async (wf: Workflow) => {
        setIsLoadingDetails(true);
        try {
            const [nodesRes, edgesRes] = await Promise.all([
                supabase.from('workflow_nodes').select('*').eq('workflow_id', wf.id).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
                supabase.from('workflow_edges').select('*').eq('workflow_id', wf.id)
            ]);

            if (nodesRes.error) throw nodesRes.error;
            if (edgesRes.error) throw edgesRes.error;

            setWorkflowNodes((nodesRes.data || []) as any);
            setWorkflowEdges(edgesRes.data || []);
            return { nodes: nodesRes.data, edges: edgesRes.data };
        } catch (err: any) {
            console.error('Error fetching details:', err);
            addToast({ title: 'Lỗi tải chi tiết', message: err.message, type: 'error' });
            return null;
        } finally {
            setIsLoadingDetails(false);
        }
    };

    // ─── CRUD: CREATE ─────────────────────────────────────────
    const handleCreateWorkflow = () => {
        let createdPanelId: string;
        createdPanelId = openPanel({
            title: 'Tạo Quy Trình Mới',
            icon: <Plus size={16} className="text-primary-500" />,
            component: <WorkflowBuilderPanel 
                           workflowId="" 
                           initialTab="settings"
                           onClose={() => closePanel(createdPanelId)} 
                           onUpdate={() => {
                               fetchWorkflows();
                               closePanel(createdPanelId);
                           }} 
                       />
        });
    };

    // ─── CRUD: DELETE ─────────────────────────────────────────
    const handleDeleteWorkflow = async (e: React.MouseEvent, wf: Workflow) => {
        e.stopPropagation();
        if (!window.confirm(`Xác nhận xóa quy trình "${wf.name}" (${wf.code})?\n\nDữ liệu các bước nghiệp vụ liên quan cũng sẽ bị xóa.`)) return;
        
        try {
            // Delete edges first, then nodes, then workflow (cascade)
            await supabase.from('workflow_edges').delete().eq('workflow_id', wf.id);
            await supabase.from('workflow_nodes').delete().eq('workflow_id', wf.id);
            const { error } = await supabase.from('workflows').delete().eq('id', wf.id);
            if (error) throw error;
            
            addToast({ title: 'Đã xóa', message: `Xóa quy trình "${wf.name}" thành công.`, type: 'success' });
            fetchWorkflows();
        } catch (err: any) {
            addToast({ title: 'Lỗi xóa', message: err.message, type: 'error' });
        }
    };

    // ─── VIEW: Overview Panel (uses WorkflowProcessTable as default) ──
    const handleViewWorkflowOverview = (wf: Workflow) => {
        let panelId: string;
        panelId = openPanel({
            title: wf.name,
            icon: <FileText size={16} className="text-primary-500" />,
            url: `/quy-trinh/${wf.id}`,
            component: <WorkflowProcessTable 
                           workflowId={wf.id}
                           isAdmin={true}
                           onClose={() => closePanel(panelId)} 
                           onViewFlowchart={() => {
                               setSelectedWorkflow(wf);
                               loadWorkflowDetails(wf).then(res => {
                                   if (res) setViewMode('flowchart');
                               });
                               closePanel(panelId);
                           }}
                           onEdit={() => {
                               closePanel(panelId);
                               let editPanelId: string;
                               editPanelId = openPanel({
                                   title: 'Chỉnh sửa: ' + wf.name,
                                   icon: <PenLine size={16} className="text-primary-500" />,
                                   component: <WorkflowBuilderPanel 
                                                  workflowId={wf.id} 
                                                  initialTab="overview"
                                                  onClose={() => closePanel(editPanelId)} 
                                                  onViewFlowchart={() => {
                                                      setSelectedWorkflow(wf);
                                                      loadWorkflowDetails(wf).then(res => {
                                                          if (res) setViewMode('flowchart');
                                                      });
                                                      closePanel(editPanelId);
                                                  }}
                                                  onUpdate={fetchWorkflows} 
                                              />
                               });
                           }}
                           onUpdate={fetchWorkflows} 
                       />
        });
    };

    const openNodeDetails = (nodeId: string, nodeName: string, staticNode?: any) => {
        openPanel({
            title: `Chi tiết Bước: ${nodeName}`,
            icon: <GitBranch size={16} className="text-emerald-500" />,
            component: <WorkflowStepDetailPanel 
                           nodeId={nodeId} 
                           projectId="" 
                           staticNode={staticNode}
                       />
        });
    };

    const filteredWorkflows = workflows.filter(wf => {
        const matchesTab = activeTab === 'project' 
            ? ['project', 'implementation', 'investment', 'procurement'].includes(wf.category)
            : ['hr', 'finance', 'document', 'asset', 'other'].includes(wf.category);
            
        const matchesSearch = wf.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              wf.code.toLowerCase().includes(searchQuery.toLowerCase());
                              
        return matchesTab && matchesSearch;
    });

    // ─── SEED: Quy trình thực hiện DAXD và Quy trình Nội bộ ───────────
    const handleSeedWorkflows = async (forceQuiet = true) => {
        if (!forceQuiet) {
            const confirmed = window.confirm(
                "CẢNH BÁO: Thao tác này sẽ NẠP LẠI toàn bộ dữ liệu quy trình mẫu hệ thống.\n\n" +
                "Mọi chỉnh sửa tùy biến (thêm/bớt bước, sửa SLA, gán người dùng) trên các quy trình mẫu này sẽ bị GHI ĐÈ và khôi phục về trạng thái gốc.\n\n" +
                "Bạn có chắc chắn muốn tiếp tục?"
            );
            if (!confirmed) return;
        }

        setIsSeeding(true);
        try {
            // Import dynamically or explicitly if already imported
            const { getInternalWorkflowTemplates } = await import('./data/seedInternalWorkflows');
            const allTemplates = [...getStandardWorkflowTemplates(), ...getInternalWorkflowTemplates()];

            // Dùng cơ chế UPSERT để tránh hoàn toàn lỗi duplicate key do race condition
            for (const wfInput of allTemplates) {
                // 1. Upsert workflow theo mã code
                const { data: wf, error: wfErr } = await supabase.from('workflows').upsert({
                    name: wfInput.name,
                    code: wfInput.code,
                    description: wfInput.description,
                    category: wfInput.category as any,
                    version: 1,
                    is_active: true
                }, { onConflict: 'code' }).select().single();
                
                if (wfErr) throw wfErr;

                // 2. Xóa các node và edge cũ của workflow này để chuẩn bị chèn data mới
                await supabase.from('workflow_edges').delete().eq('workflow_id', wf.id);
                await supabase.from('workflow_nodes').delete().eq('workflow_id', wf.id);

                // 3. Insert tuần tự các bước (node) mới
                const nodeIdMap: Record<string, string> = {}; 
                let prevId: string | null = null;
                for (const s of wfInput.steps) {
                    const { data: node, error: nErr } = await supabase.from('workflow_nodes').insert({
                        workflow_id: wf.id,
                        name: s.name,
                        type: s.type as any,
                        assignee_role: s.role,
                        sla_formula: s.sla,
                        metadata: (s as any).metadata || {}
                    }).select().single();
                    if (nErr) throw nErr;

                    if (s.id) {
                        nodeIdMap[s.id] = node.id;
                    }

                    if (!wfInput.edges && prevId) {
                        await supabase.from('workflow_edges').insert({
                            workflow_id: wf.id,
                            source_node: prevId,
                            target_node: node.id
                        });
                    }
                    prevId = node.id;
                }

                // 4. Insert Edges theo dạng lưới (Nếu có cấu hình edges)
                if (wfInput.edges) {
                    for (const edge of wfInput.edges) {
                        if (!nodeIdMap[edge.source] || !nodeIdMap[edge.target]) continue;
                        await supabase.from('workflow_edges').insert({
                            workflow_id: wf.id,
                            source_node: nodeIdMap[edge.source],
                            target_node: nodeIdMap[edge.target],
                            condition_expr: edge.label || null
                        });
                    }
                }
            }

            const internalCount = getInternalWorkflowTemplates().length;
            addToast({ 
                title: 'Khởi tạo thành công', 
                message: `Đã nạp ${allTemplates.length} quy trình (${internalCount} QT nội bộ gồm QT.KHTC.04 Quyết toán vốn đầu tư).`, 
                type: 'success' 
            });
            fetchWorkflows();
        } catch (error: any) {
            console.error(error);
            addToast({ title: 'Lỗi khởi tạo', message: error.message, type: 'error' });
        } finally {
            setIsSeeding(false);
        }
    };

    // ─── Category label helper ────────────────────────────────
    const getCategoryLabel = (cat: string) => {
        const map: Record<string, string> = {
            project: 'Dự án', implementation: 'Thực hiện DA', investment: 'Đầu tư', 
            procurement: 'Đấu thầu', finance: 'Tài chính', hr: 'Nhân sự',
            document: 'Văn bản', asset: 'Tài sản', other: 'Nghiệp vụ'
        };
        return map[cat] || cat;
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in relative z-10 pb-20 px-2 sm:px-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 dark:bg-primary-900/10 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
                
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400">
                        <div className="p-3 bg-primary-50 dark:bg-primary-500/10 rounded-xl">
                            <GitBranch size={28} className="animate-pulse" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white uppercase font-display">
                            Quản lý Quy trình
                        </h1>
                    </div>
                    <p className="text-slate-500 font-medium pl-14">Quản lý và thiết kế luồng công việc tự động cho toàn Ban QLDA.</p>
                </div>
                
                <div className="relative z-10 flex items-center gap-3 w-full md:w-auto flex-wrap md:flex-nowrap">
                    <a 
                        href="/templates/Template_KhaiBao_QuyTrinh.xlsx"
                        download
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition duration-200"
                        title="Tải mẫu Excel khai báo quy trình"
                    >
                        <FileSpreadsheet size={18} />
                        Template Excel
                    </a>
                    <button 
                        onClick={() => handleSeedWorkflows(false)} 
                        disabled={isSeeding} 
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition duration-200"
                    >
                        {isSeeding ? (
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <DownloadCloud size={18} />
                        )}
                        Nạp Dữ Liệu Mẫu
                    </button>
                    <button onClick={handleCreateWorkflow} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition duration-200 shadow-md shadow-primary-600/20">
                        <Plus size={18} /> Tạo Quy Trình
                    </button>
                </div>
            </div>

            {selectedWorkflow && viewMode === 'flowchart' ? (
                <div className="animate-fade-in space-y-4">
                    <div className="flex items-center justify-between">
                        <button onClick={() => setViewMode('grid')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold transition duration-200 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <ArrowLeft size={18} /> Quay lại danh sách
                        </button>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white font-display uppercase tracking-tight">{selectedWorkflow.name}</h2>
                    </div>
                    
                    {isLoadingDetails ? (
                        <div className="flex justify-center items-center h-[600px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="h-10 w-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="block h-[700px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-900">
                            <FlowchartViewer
                                workflowName={selectedWorkflow.name}
                                nodes={processedNodes}
                                edges={processedEdges}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-fade-in space-y-6">
                    {/* Toolbar: Tabs & View Toggles */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
                            <button onClick={() => setActiveTab('project')} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'project' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                Quy Trình Dự Án
                            </button>
                            <button onClick={() => setActiveTab('internal')} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'internal' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                Quy Trình Nội Bộ
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto px-2">
                            <div className="relative flex-1 sm:w-64">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 transition-all font-medium"
                                />
                            </div>
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <LayoutGrid size={18} />
                                </button>
                                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <ListIcon size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3">
                            <AlertCircle size={40} className="text-red-500" />
                            <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Database chưa sẵn sàng</h3>
                            <p className="text-red-600 dark:text-red-300 max-w-lg text-sm">{error}</p>
                        </div>
                    )}

                    {!error && isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>)}
                        </div>
                    )}

                    {!error && !isLoading && filteredWorkflows.length === 0 && (
                        <div className="bg-slate-50 dark:bg-slate- rounded-3xl p-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500">
                            <FileText size={48} className="text-slate-300 mb-4" />
                            <p className="text-lg font-bold mb-2">Chưa có quy trình nào.</p>
                            <p className="text-sm">Hãy tạo quy trình đầu tiên hoặc nạp dữ liệu mẫu.</p>
                        </div>
                    )}

                    {/* Grid View */}
                    {!error && !isLoading && filteredWorkflows.length > 0 && viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {filteredWorkflows.map(wf => (
                                <div key={wf.id} onClick={() => handleViewWorkflowOverview(wf)}
                                    className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary-500 dark:hover:border-primary-500 transition-all cursor-pointer group flex flex-col h-full relative">
                                    
                                    {/* Delete button */}
                                    <button
                                        onClick={(e) => handleDeleteWorkflow(e, wf)}
                                        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 opacity-0 group-hover:opacity-100 transition-all z-10"
                                        title="Xóa quy trình"
                                    >
                                        <Trash2 size={15} />
                                    </button>

                                    <div className="flex justify-between items-start mb-3 pr-8">
                                        <div className={`p-2 rounded-xl transition-colors ${activeTab === 'project' ? 'bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white dark:bg-primary-900/40' : 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white dark:bg-teal-900/40'}`}>
                                            <GitBranch size={18} />
                                        </div>
                                        <span className="text-[11px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">v{wf.version || 1}.0</span>
                                    </div>
                                    <h3 className="text-[14px] font-black tracking-tight text-slate-800 dark:text-white mb-1.5 group-hover:text-primary-600 transition-colors uppercase font-display line-clamp-2">{wf.name}</h3>
                                    <p className="text-[11px] font-bold font-mono text-slate-400 dark:text-slate-400 mb-2 uppercase tracking-wider">{wf.code}</p>
                                    <p className="text-[12px] text-slate-500 line-clamp-2 mb-4 flex-grow leading-relaxed">{wf.description || 'Chưa có mô tả'}</p>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{getCategoryLabel(wf.category)}</span>
                                        <div className="flex items-center gap-1.5 font-bold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 tracking-wider">{wf.is_active ? 'ACTIVE' : 'PAUSED'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* List View */}
                    {!error && !isLoading && filteredWorkflows.length > 0 && viewMode === 'list' && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left">
                                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                                    <tr className="text-slate-500 dark:text-slate-400">
                                        <th scope="col" className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Mã QT</th>
                                        <th scope="col" className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Tên Quy Trình</th>
                                        <th scope="col" className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Phân Loại</th>
                                        <th scope="col" className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Trạng Thái</th>
                                        <th scope="col" className="px-6 py-4 text-right border-b border-slate-200 dark:border-slate-700">Phiên Bản</th>
                                        <th scope="col" className="px-6 py-4 text-center w-20 border-b border-slate-200 dark:border-slate-700"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
                                    {filteredWorkflows.map(wf => (
                                        <tr key={wf.id} onClick={() => handleViewWorkflowOverview(wf)} className="hover:bg-slate-50 dark:hover:bg-slate- cursor-pointer transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">{wf.code}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-800 dark:text-white font-bold group-hover:text-primary-600 transition-colors uppercase font-display">{wf.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500">{getCategoryLabel(wf.category)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 font-bold">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${wf.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                                    <span className={`text-xs ${wf.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>{wf.is_active ? 'Đang hoạt động' : 'Tạm dừng'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-slate-400">v{wf.version}.0</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={(e) => handleDeleteWorkflow(e, wf)}
                                                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Xóa quy trình"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WorkflowManagerPage;
