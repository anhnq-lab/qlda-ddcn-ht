import React, { useState, useMemo, useCallback } from 'react';
import { Project } from '@/types';
import { GitBranch, Play, Pencil, Plus, Clock, CheckCircle2, XCircle, RotateCcw, ListChecks } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useSlidePanel } from '@/context/SlidePanelContext';
import { WorkflowVisualizer, WorkflowNodeStatus } from '../workflow/WorkflowVisualizer';
import { ApprovalActions } from '../workflow/ApprovalActions';
import { useProjectWorkflow, WorkflowNode } from '../../hooks/useProjectWorkflow';
import { TaskStatus } from '@/types/task.types';
import { getInternalWorkflowTemplates } from '../../../workflows/data/seedInternalWorkflows';
import { isDesignWorkflow } from '../../../workflows/constants/designWorkflowStates';
import {
    WorkflowInstance,
    createWorkflowInstance,
    getInstancesByProject,
} from '../../../workflows/services/workflowInstanceService';
import { WorkflowRunnerPanel } from '../../../workflows/components/WorkflowRunnerPanel';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ProjectWorkflowTabProps {
    projectID: string;
    project: Project;
}

// Badge trạng thái instance
const STATUS_BADGE: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    active: {
        label: 'Đang chạy',
        cls: 'bg-primary-500/10 text-primary-500 border-primary-500/20 rounded-xl',
        icon: <RotateCcw className="w-3 h-3" />,
    },
    completed: {
        label: 'Hoàn thành',
        cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-xl',
        icon: <CheckCircle2 className="w-3 h-3" />,
    },
    cancelled: {
        label: 'Đã hủy',
        cls: 'bg-bg-muted text-txt-muted border-border rounded-xl',
        icon: <XCircle className="w-3 h-3" />,
    },
};

export const ProjectWorkflowTab: React.FC<ProjectWorkflowTabProps> = ({ projectID, project }) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const { openPanel, closePanel } = useSlidePanel();

    const { nodes, loading, isInitiailizing, initializeWorkflow, updateNodeStatus } = useProjectWorkflow(projectID);

    // Templates
    const allTemplates = useMemo(() => getInternalWorkflowTemplates(), []);
    const templates = useMemo(() => allTemplates.filter(t => !isDesignWorkflow(t.code)), [allTemplates]);
    const designTemplates = useMemo(() => allTemplates.filter(t => isDesignWorkflow(t.code)), [allTemplates]);

    // Auto-select theo DesignSteps
    const defaultDesignCode = useMemo(() => {
        const steps = (project as any).DesignSteps ?? (project as any).design_steps ?? 1;
        if (steps === 3) return 'QT-TK3B';
        if (steps === 2) return 'QT-TK2B';
        return 'QT-TK1B';
    }, [project]);

    const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>(templates[0]?.code);
    const [selectedDesignCode, setSelectedDesignCode] = useState<string>(defaultDesignCode);
    const [selectedNode, setSelectedNode] = useState<WorkflowNodeStatus | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Helper mở panel runner
    const openRunnerPanel = useCallback((inst: WorkflowInstance) => {
        openPanel({
            id: `wf-runner-${inst.id}`,
            title: `${inst.workflow_code} — ${project.ProjectName}`,
            icon: <ListChecks className="w-4 h-4 text-primary-500" />,
            width: 820,
            component: (
                <WorkflowRunnerPanel
                    instanceId={inst.id}
                    projectName={project.ProjectName}
                    onComplete={() => {
                        closePanel();
                        refetchInstances();
                    }}
                />
            ),
        });
    }, [openPanel, closePanel, project.ProjectName]);

    // ── Instances của dự án ──
    const { data: instances = [], refetch: refetchInstances } = useQuery({
        queryKey: ['workflow-instances', projectID],
        queryFn: () => getInstancesByProject(projectID),
        staleTime: 60_000,
    });



    // ── Khởi tạo phiên quy trình thiết kế ──
    const handleInitiateDesignWorkflow = useCallback(async () => {
        const tmpl = designTemplates.find(t => t.code === selectedDesignCode);
        if (!tmpl) return;

        // Kiểm tra đã có phiên active chưa
        const existing = instances.find(
            i => i.workflow_code === selectedDesignCode && i.status === 'active'
        );
        if (existing) {
            addToast({
                title: 'Đã có phiên đang chạy',
                message: `Quy trình ${selectedDesignCode} đang ở bước ${existing.current_step_index + 1}. Nhấn "Tiếp tục" để vào.`,
                type: 'warning',
            });
            return;
        }

        setIsCreating(true);
        try {
            const inst = await createWorkflowInstance({
                projectId: projectID,
                workflowCode: selectedDesignCode,
                officerName: (project as any).officerName ?? undefined,
                totalSteps: tmpl.steps.length,
            });
            await refetchInstances();
            // Mở SlidePanel runner ngay sau khi tạo
            openRunnerPanel(inst);
            addToast({ title: 'Đã khởi tạo!', message: `Phiên ${selectedDesignCode} bắt đầu.`, type: 'success' });
        } catch (err) {
            console.error(err);
            addToast({ title: 'Lỗi', message: 'Không thể khởi tạo quy trình. Vui lòng thử lại.', type: 'error' });
        } finally {
            setIsCreating(false);
        }
    }, [designTemplates, selectedDesignCode, instances, projectID, project, refetchInstances, addToast]);

    // ── Quy trình phê duyệt chung ──
    const handleRunProcess = () => {
        const tmpl = templates.find(t => t.code === selectedTemplateCode);
        if (tmpl) initializeWorkflow(tmpl);
    };

    const handleActionComplete = async (actionType: 'submit' | 'approve' | 'reject', comment?: string, files?: File[]) => {
        if (!selectedNode) return;
        let newStatus: TaskStatus = TaskStatus.Review;
        if (actionType === 'approve') newStatus = TaskStatus.Done;
        if (actionType === 'reject') newStatus = TaskStatus.Todo;
        await updateNodeStatus(selectedNode.id, newStatus, comment, files);
        setSelectedNode(null);
    };

    const groupedNodes = useMemo(() => {
        return nodes.reduce((acc, node) => {
            const tmpl = node.workflow_template || 'unk';
            if (!acc[tmpl]) acc[tmpl] = [];
            acc[tmpl].push(node);
            return acc;
        }, {} as Record<string, WorkflowNode[]>);
    }, [nodes]);

    // ── Render active instances ──
    const activeInstances = instances.filter(i => i.status === 'active');
    const doneInstances = instances.filter(i => i.status !== 'active');

    return (
        <div className="space-y-4">

            {/* ── Section: Quy trình Thiết kế Nội bộ ── */}
            <div className="bg-bg-surface rounded-2xl border border-border p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-4">
                    <div>
                        <h2 className="text-sm font-black text-txt-primary flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-primary-500" />
                            Quy trình Thiết kế Nội bộ
                        </h2>
                        <p className="text-[11px] text-txt-muted mt-0.5">
                            Lập, thẩm định, phê duyệt BCKTKT — QT-DAXD-TK-QLDA2-2026
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedDesignCode}
                            onChange={e => setSelectedDesignCode(e.target.value)}
                            className="text-sm rounded-xl border border-border bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500/20 outline-none min-w-[220px] transition-all py-1.5"
                        >
                            {designTemplates.map(t => (
                                <option key={t.code} value={t.code}>{t.code} — {t.name.split('(')[0].trim()}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleInitiateDesignWorkflow}
                            disabled={isCreating}
                            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-sm whitespace-nowrap disabled:opacity-50 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            {isCreating ? 'Đang tạo...' : 'Khởi tạo'}
                        </button>
                    </div>
                </div>

                <p className="text-xs text-txt-muted bg-bg-muted rounded-xl px-3 py-2 border border-border mb-4">
                    <strong>Lưu ý:</strong> Chỉ chuyên viên phụ trách dự án mới khởi tạo quy trình thiết kế.
                    Áp dụng từ <strong>01/7/2026</strong> theo Luật Xây dựng số 135/2025/QH15.
                </p>

                {/* Phiên đang chạy */}
                {activeInstances.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-txt-muted uppercase tracking-wider">
                            Phiên đang chạy
                        </p>
                        {activeInstances.map(inst => (
                            <InstanceRow
                                key={inst.id}
                                instance={inst}
                                onContinue={() => openRunnerPanel(inst)}
                            />
                        ))}
                    </div>
                )}

                {/* Phiên hoàn thành */}
                {doneInstances.length > 0 && (
                    <div className="mt-3 space-y-2">
                        <p className="text-[10px] font-black text-txt-muted uppercase tracking-wider">
                            Lịch sử quy trình
                        </p>
                        {doneInstances.map(inst => (
                            <InstanceRow
                                key={inst.id}
                                instance={inst}
                            />
                        ))}
                    </div>
                )}

                {instances.length === 0 && (
                    <div className="flex items-center justify-center py-6 text-center">
                        <div>
                            <GitBranch className="w-8 h-8 text-txt-muted mx-auto mb-2" />
                            <p className="text-xs text-txt-muted">
                                Chưa có phiên quy trình nào. Chọn loại quy trình và nhấn "Khởi tạo".
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Section: Quy trình Phê duyệt Chung ── */}
            <div className="bg-bg-surface rounded-2xl border border-border p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <div>
                        <h2 className="text-sm font-black text-txt-primary flex items-center gap-2">
                            <GitBranch className="w-4 h-4 text-primary-500" />
                            Quy trình Phê duyệt
                        </h2>
                        <p className="text-[11px] text-txt-muted mt-0.5">
                            Quản lý tiến trình và các bước phê duyệt nội bộ
                        </p>
                    </div>
                    {nodes.length > 0 && (
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedTemplateCode}
                                onChange={e => setSelectedTemplateCode(e.target.value)}
                                className="flex-1 text-sm rounded-xl border border-border bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500/20 outline-none min-w-[200px] transition-all py-1.5"
                            >
                                {templates.map(tmpl => (
                                    <option key={tmpl.code} value={tmpl.code}>{tmpl.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleRunProcess}
                                disabled={isInitiailizing}
                                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-sm disabled:opacity-50 transition-all"
                            >
                                <Play className="w-4 h-4" />
                                {isInitiailizing ? '...' : 'Khởi chạy'}
                            </button>
                        </div>
                    )}
                </div>

                {nodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <GitBranch className="w-8 h-8 text-txt-muted mb-3" />
                        <p className="text-sm font-bold text-txt-primary mb-1">Chưa chạy quy trình nào</p>
                        <p className="text-xs text-txt-muted max-w-sm mb-5">
                            Chọn mẫu quy trình và khởi chạy.
                        </p>
                        <div className="flex gap-2">
                            <select
                                value={selectedTemplateCode}
                                onChange={e => setSelectedTemplateCode(e.target.value)}
                                className="text-sm rounded-xl border border-border bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500/20 outline-none py-2 min-w-[200px] transition-all"
                            >
                                {templates.map(tmpl => (
                                    <option key={tmpl.code} value={tmpl.code}>{tmpl.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleRunProcess}
                                disabled={isInitiailizing}
                                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm disabled:opacity-50 transition-all"
                            >
                                <Play className="w-4 h-4" />
                                {isInitiailizing ? 'Đang tạo...' : 'Khởi chạy'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedNodes).map(([tmplCode, tmplNodes]) => {
                            const tmpl = allTemplates.find(t => t.code === tmplCode);
                            return (
                                <div key={tmplCode} className="space-y-4">
                                    <h3 className="font-bold text-sm text-txt-secondary border-b border-border pb-2">
                                        Quy trình: {tmpl?.name || tmplCode}
                                    </h3>
                                    <WorkflowVisualizer
                                        nodes={tmplNodes as WorkflowNodeStatus[]}
                                        onActionClick={node => setSelectedNode(node)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Approval modal */}
            {selectedNode && (
                <ApprovalActions
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onComplete={handleActionComplete}
                />
            )}
        </div>
    );
};

// ── InstanceRow ──────────────────────────────────────────────────────
const InstanceRow: React.FC<{ instance: WorkflowInstance; onContinue?: () => void }> = ({ instance, onContinue }) => {
    const badge = STATUS_BADGE[instance.status] ?? STATUS_BADGE.active;
    const progress = Math.round((instance.current_step_index / instance.total_steps) * 100);
    const createdDate = new Date(instance.created_at).toLocaleDateString('vi-VN');

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-bg-muted">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-txt-primary">{instance.workflow_code}</span>
                    <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${badge.cls}`}>
                        {badge.icon} {badge.label}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-bg-surface rounded-full overflow-hidden">
                        <div
                            className="h-1.5 bg-primary-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-txt-muted shrink-0">
                        Bước {instance.current_step_index + 1}/{instance.total_steps}
                    </span>
                </div>
                <p className="text-[10px] text-txt-muted mt-0.5 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> Khởi tạo {createdDate}
                    {instance.officer_name && ` · ${instance.officer_name}`}
                </p>
            </div>
            {instance.status === 'active' && onContinue && (
                <button
                    onClick={onContinue}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-bold rounded-xl shadow-sm transition-all"
                >
                    <Play className="w-3 h-3" /> Tiếp tục
                </button>
            )}
        </div>
    );
};
