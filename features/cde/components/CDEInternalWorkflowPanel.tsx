// ═══════════════════════════════════════════════════════════════
// CDEInternalWorkflowPanel — Quy trình nội bộ giữa các phòng ban
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CDEService } from '../../../services/CDEService';
import {
    GitBranch, Plus, ChevronRight, Clock, CheckCircle2, XCircle,
    RotateCcw, AlertCircle, Building2, ExternalLink, FileText,
    Play, Loader2, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import type {
    InternalWorkflowTemplate, InternalWorkflowInstance,
    InternalWorkflowStepRecord, InternalStepStatus, InternalDepartment,
} from '../types';
import { CDE_INTERNAL_WORKFLOW_TEMPLATES, DEPT_COLORS } from '../constants';

// ─── Props ───────────────────────────────────────────────────────────────────

interface CDEInternalWorkflowPanelProps {
    projectId: string;
    instances: InternalWorkflowInstance[];
    isLoading: boolean;
    currentUserDept?: InternalDepartment;
    onCreateInstance: (templateId: string, title: string, docId?: number) => Promise<void>;
    onStepAction: (instanceId: string, stepNo: number, action: 'done' | 'rejected' | 'return_to_prev', comment: string) => Promise<void>;
}

// Hook nhỏ để load step records theo instance — lazy khi expand
const useInstanceSteps = (instanceId: string | null) =>
    useQuery({
        queryKey: ['cde-internal-workflow-steps', instanceId],
        queryFn: () => CDEService.getInternalWorkflowStepRecords(instanceId!),
        enabled: !!instanceId,
    });

// ─── Step Status Badge ────────────────────────────────────────────────────────

const StepStatusBadge: React.FC<{ status: InternalStepStatus; overdue?: boolean }> = ({ status, overdue }) => {
    const cfg: Record<InternalStepStatus, { label: string; cls: string; icon: React.ElementType }> = {
        waiting:  { label: 'Chờ xử lý',      cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: Clock },
        pending:  { label: 'Cần xử lý',      cls: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300 animate-pulse', icon: AlertCircle },
        done:     { label: 'Hoàn thành',     cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
        rejected: { label: 'Từ chối',        cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
        returned: { label: 'Trả lại trước',  cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', icon: RotateCcw },
        skipped:  { label: 'Bỏ qua',         cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400', icon: ChevronRight },
    };
    const { label, cls, icon: Icon } = cfg[status];
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
            <Icon className="w-3 h-3" />{label}
            {overdue && <span className="ml-1 text-red-600 font-black">⚠ QH</span>}
        </span>
    );
};

// ─── Department Badge ─────────────────────────────────────────────────────────

const DeptBadge: React.FC<{ dept: InternalDepartment; label: string }> = ({ dept, label }) => {
    const colors = DEPT_COLORS[dept] || DEPT_COLORS.HC_TH;
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
            <Building2 className="w-3 h-3" />{label}
        </span>
    );
};

// ─── Instance Detail View ────────────────────────────────────────────────────

const InstanceDetail: React.FC<{
    instance: InternalWorkflowInstance;
    template: InternalWorkflowTemplate;
    currentUserDept?: InternalDepartment;
    onStepAction: (instanceId: string, stepNo: number, action: 'done' | 'rejected' | 'return_to_prev', comment: string) => Promise<void>;
}> = ({ instance, template, currentUserDept, onStepAction }) => {
    const { data: steps = [] } = useInstanceSteps(instance.id);
    const [comment, setComment] = useState('');
    const [acting, setActing] = useState(false);
    const [expandedStep, setExpandedStep] = useState<number | null>(null);

    const currentStepDef = template.steps.find(s => s.step_no === instance.current_step_no);
    const hasPrevStep = instance.current_step_no > 1;
    const canAct = currentStepDef && currentUserDept === currentStepDef.department && instance.status === 'in_progress';

    const getStepRecord = (stepNo: number) => steps.find(s => s.step_no === stepNo);

    const isOverdue = (deadline: string | null | undefined) => {
        if (!deadline) return false;
        return new Date(deadline) < new Date();
    };

    const handleAction = async (action: 'done' | 'rejected' | 'return_to_prev') => {
        if ((action === 'rejected' || action === 'return_to_prev') && !comment.trim()) {
            alert('Vui lòng nhập lý do trả lại / từ chối');
            return;
        }
        setActing(true);
        try {
            await onStepAction(instance.id, instance.current_step_no, action, comment || 'Đã xử lý');
            setComment('');
        } finally {
            setActing(false);
        }
    };

    // Progress percentage
    const totalInternal = template.steps.filter(s => !s.is_external).length;
    const doneInternal = steps.filter(s => s.status === 'done' && !template.steps.find(t => t.step_no === s.step_no)?.is_external).length;
    const progress = totalInternal > 0 ? Math.round((doneInternal / totalInternal) * 100) : 0;

    return (
        <div className="space-y-4">
            {/* Progress bar */}
            <div>
                <div className="flex justify-between text-xs text-txt-muted mb-1">
                    <span>Tiến độ nội bộ</span>
                    <span className="font-semibold">{progress}%</span>
                </div>
                <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Steps timeline */}
            <div className="space-y-1">
                {template.steps.map((stepDef, idx) => {
                    const rec = getStepRecord(stepDef.step_no);
                    const isCurrent = stepDef.step_no === instance.current_step_no;
                    const isExpanded = expandedStep === stepDef.step_no;

                    const stepStatus: InternalStepStatus = (rec?.status as InternalStepStatus)
                        ?? (isCurrent && instance.status === 'in_progress' ? 'pending'
                            : stepDef.step_no < instance.current_step_no ? 'done' : 'waiting');
                    const stepOverdue = stepStatus === 'pending' && isOverdue(rec?.deadline);

                    const isLast = idx === template.steps.length - 1;

                    return (
                        <div key={stepDef.step_no} className="relative">
                            {/* Connector line */}
                            {!isLast && (
                                <div className={`absolute left-[18px] top-[36px] w-px h-4 ${stepStatus === 'done' ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-slate-700'}`} />
                            )}

                            <div
                                className={`flex gap-3 p-3 rounded-xl border transition-all cursor-pointer
                                    ${isCurrent && instance.status === 'in_progress'
                                        ? 'border-warning-300 bg-warning-50 dark:border-warning-700 dark:bg-warning-900/10 shadow-sm'
                                        : stepStatus === 'done'
                                            ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10'
                                            : 'border-border hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                                onClick={() => setExpandedStep(isExpanded ? null : stepDef.step_no)}
                            >
                                {/* Step number circle */}
                                <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border-2
                                    ${stepStatus === 'done' ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : stepStatus === 'rejected' ? 'bg-red-500 border-red-500 text-white'
                                        : isCurrent && instance.status === 'in_progress' ? 'bg-warning-500 border-warning-500 text-white'
                                        : 'bg-bg-surface border-gray-300 dark:border-slate-600 text-gray-400'
                                    }`}>
                                    {stepStatus === 'done' ? <CheckCircle2 className="w-4 h-4" />
                                        : stepStatus === 'rejected' ? <XCircle className="w-4 h-4" />
                                        : `B${stepDef.step_no}`}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <p className={`text-sm font-semibold leading-tight ${isCurrent ? 'text-warning-800 dark:text-warning-200' : 'text-txt-primary'}`}>
                                                {stepDef.name}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                <DeptBadge dept={stepDef.department} label={stepDef.department_label} />
                                                {stepDef.sla_days > 0 && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-txt-muted">
                                                        <Clock className="w-3 h-3" />≤{stepDef.sla_days} ngày
                                                    </span>
                                                )}
                                                {stepDef.is_external && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                                        <ExternalLink className="w-3 h-3" />Cơ quan ngoài
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <StepStatusBadge status={stepStatus} overdue={stepOverdue} />
                                            {rec?.deadline && stepStatus === 'pending' && (
                                                <span className={`text-[10px] font-mono ${stepOverdue ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                                    HH: {new Date(rec.deadline).toLocaleDateString('vi-VN')}
                                                </span>
                                            )}
                                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                                        </div>
                                    </div>

                                    {/* Expanded detail */}
                                    {isExpanded && (
                                        <div className="mt-3 space-y-2 text-sm">
                                            <p className="text-txt-muted leading-relaxed">{stepDef.description}</p>
                                            {stepDef.forms && stepDef.forms.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {stepDef.forms.map(f => (
                                                        <span key={f} className="inline-flex items-center gap-1 text-[11px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-700">
                                                            <FileText className="w-3 h-3" />{f}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {rec?.comment && (
                                                <div className="bg-bg-subtle rounded-lg p-2.5 border border-border">
                                                    <p className="text-xs text-txt-muted mb-0.5">Ghi chú:</p>
                                                    <p className="text-txt-secondary">{rec.comment}</p>
                                                </div>
                                            )}
                                            {rec?.actor_name && (
                                                <p className="text-xs text-gray-400">
                                                    Xử lý bởi: <strong>{rec.actor_name}</strong>
                                                    {rec.acted_at && ` — ${new Date(rec.acted_at).toLocaleDateString('vi-VN')}`}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Action panel — only for current step actor */}
            {canAct && (
                <div className="border-t border-border pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-warning-500 rounded-full animate-pulse" />
                        <p className="text-sm font-semibold text-warning-700 dark:text-warning-300">
                            Đến lượt bạn xử lý: {currentStepDef?.action_label}
                        </p>
                    </div>
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Ghi chú / ý kiến xử lý (bắt buộc khi trả lại)…"
                        rows={3}
                        className="w-full text-sm border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                    />
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => handleAction('done')}
                            disabled={acting}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60"
                        >
                            {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {currentStepDef?.action_label || 'Xác nhận'}
                        </button>
                        {hasPrevStep && (
                            <button
                                onClick={() => handleAction('return_to_prev')}
                                disabled={acting}
                                title="Trả lại bước trước (giữ nguyên quy trình, chỉ quay lại 1 bước)"
                                className="flex items-center gap-1.5 px-3 py-2 border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-sm font-semibold rounded-xl transition-all disabled:opacity-60"
                            >
                                <RotateCcw className="w-4 h-4" />Bước trước
                            </button>
                        )}
                        <button
                            onClick={() => handleAction('rejected')}
                            disabled={acting}
                            title="Từ chối toàn bộ quy trình"
                            className="flex items-center gap-1.5 px-3 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold rounded-xl transition-all disabled:opacity-60"
                        >
                            <XCircle className="w-4 h-4" />Từ chối
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Create Instance Modal ────────────────────────────────────────────────────

const CreateInstanceModal: React.FC<{
    templates: InternalWorkflowTemplate[];
    onClose: () => void;
    onCreate: (templateId: string, title: string) => Promise<void>;
}> = ({ templates, onClose, onCreate }) => {
    const [selectedTemplate, setSelectedTemplate] = useState(templates[0]?.id || '');
    const [title, setTitle] = useState('');
    const [creating, setCreating] = useState(false);

    const template = templates.find(t => t.id === selectedTemplate);

    const handleCreate = async () => {
        if (!title.trim()) { alert('Vui lòng nhập tiêu đề hồ sơ'); return; }
        setCreating(true);
        try {
            await onCreate(selectedTemplate, title);
            onClose();
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-lg">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-base font-bold text-txt-primary">Khởi tạo quy trình nội bộ</h3>
                    <p className="text-sm text-txt-muted mt-0.5">Chọn quy trình và nhập tiêu đề hồ sơ cần xử lý</p>
                </div>
                <div className="p-6 space-y-4">
                    {/* Template selector */}
                    <div>
                        <label className="text-sm font-semibold text-txt-secondary mb-1.5 block">Loại quy trình</label>
                        <div className="space-y-2">
                            {templates.map(t => (
                                <label key={t.id} className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedTemplate === t.id ? 'border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20' : 'border-border hover:border-gray-300'}`}>
                                    <input type="radio" className="mt-1" name="template" value={t.id} checked={selectedTemplate === t.id} onChange={() => setSelectedTemplate(t.id)} />
                                    <div>
                                        <p className="text-sm font-semibold text-txt-primary">{t.name}</p>
                                        <p className="text-xs text-txt-muted mt-0.5">{t.code} · {t.steps.length} bước</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-sm font-semibold text-txt-secondary mb-1.5 block">Tiêu đề hồ sơ <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="VD: Quyết toán A-B Gói thầu XD01 – Hạng mục móng"
                            className="w-full text-sm border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-400"
                        />
                    </div>

                    {/* Legal basis info */}
                    {template && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                            <div className="flex gap-2">
                                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Căn cứ pháp lý</p>
                                    <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-0.5">
                                        {template.legal_basis.map(b => <li key={b}>• {b}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-txt-muted hover:bg-bg-muted rounded-xl transition-all">
                        Hủy
                    </button>
                    <button onClick={handleCreate} disabled={creating} className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60">
                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Khởi tạo
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Instance Card ────────────────────────────────────────────────────────────

const statusConfig = {
    draft:       { label: 'Nháp',          cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    in_progress: { label: 'Đang xử lý',    cls: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300' },
    completed:   { label: 'Hoàn thành',    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    rejected:    { label: 'Từ chối',       cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    on_hold:     { label: 'Tạm dừng',      cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

// ─── Main Panel ──────────────────────────────────────────────────────────────

const CDEInternalWorkflowPanel: React.FC<CDEInternalWorkflowPanelProps> = ({
    projectId,
    instances,
    isLoading,
    currentUserDept,
    onCreateInstance,
    onStepAction,
}) => {
    const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    // Group instances by status
    const pending = instances.filter(i => i.status === 'in_progress');
    const completed = instances.filter(i => i.status === 'completed');
    const others = instances.filter(i => i.status !== 'in_progress' && i.status !== 'completed');

    const renderInstanceCard = (inst: InternalWorkflowInstance) => {
        const template = CDE_INTERNAL_WORKFLOW_TEMPLATES.find(t => t.id === inst.template_id);
        const isSelected = inst.id === selectedInstanceId;
        const sc = statusConfig[inst.status];
        const totalSteps = template?.steps.length || 1;

        // Check if current user needs to act
        const currentStepDef = template?.steps.find(s => s.step_no === inst.current_step_no);
        const needsMyAction = currentStepDef?.department === currentUserDept && inst.status === 'in_progress';

        return (
            <div
                key={inst.id}
                onClick={() => setSelectedInstanceId(isSelected ? null : inst.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected
                    ? 'border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/10 shadow-sm'
                    : needsMyAction
                        ? 'border-warning-300 bg-warning-50/60 dark:border-warning-700 dark:bg-warning-900/10 hover:shadow-sm'
                        : 'border-border hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {needsMyAction && <div className="w-2 h-2 bg-warning-500 rounded-full animate-pulse shrink-0" />}
                            <p className="text-sm font-semibold text-txt-primary truncate">{inst.title}</p>
                        </div>
                        <p className="text-xs text-txt-muted">{inst.template_name}</p>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span>
                            <span className="text-[11px] text-gray-400">Bước {inst.current_step_no}/{totalSteps}</span>
                            {needsMyAction && (
                                <span className="text-[11px] font-semibold text-warning-700 dark:text-warning-400">• Cần xử lý</span>
                            )}
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-xs text-gray-400">{new Date(inst.created_at).toLocaleDateString('vi-VN')}</div>
                        {totalSteps > 0 && (
                            <div className="mt-1.5 w-20">
                                <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((inst.current_step_no / totalSteps) * 100)}%` }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expanded instance detail — steps loaded lazily */}
                {isSelected && template && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <InstanceDetail
                            instance={inst}
                            template={template}
                            currentUserDept={currentUserDept}
                            onStepAction={onStepAction}
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                        <GitBranch className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-txt-primary">Quy trình nội bộ</h3>
                        <p className="text-xs text-txt-muted">{instances.length} hồ sơ đang lưu chuyển</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition-all"
                >
                    <Plus className="w-3.5 h-3.5" />Khởi tạo
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
            ) : instances.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-bg-muted rounded-2xl flex items-center justify-center mb-4">
                        <GitBranch className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-semibold text-txt-muted mb-1">Chưa có quy trình nào</p>
                    <p className="text-xs text-txt-placeholder max-w-xs">
                        Khởi tạo quy trình nội bộ (quyết toán, thanh toán…) để theo dõi lưu chuyển hồ sơ giữa các phòng ban.
                    </p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all"
                    >
                        <Plus className="w-4 h-4" />Khởi tạo quy trình đầu tiên
                    </button>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
                    {/* Cần xử lý */}
                    {pending.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-warning-700 dark:text-warning-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />Đang xử lý ({pending.length})
                            </p>
                            <div className="space-y-2">{pending.map(renderInstanceCard)}</div>
                        </div>
                    )}

                    {/* Đã xong */}
                    {completed.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />Hoàn thành ({completed.length})
                            </p>
                            <div className="space-y-2">{completed.map(renderInstanceCard)}</div>
                        </div>
                    )}

                    {/* Khác */}
                    {others.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-2">Khác ({others.length})</p>
                            <div className="space-y-2">{others.map(renderInstanceCard)}</div>
                        </div>
                    )}
                </div>
            )}

            {/* Create modal */}
            {showCreate && (
                <CreateInstanceModal
                    templates={CDE_INTERNAL_WORKFLOW_TEMPLATES}
                    onClose={() => setShowCreate(false)}
                    onCreate={onCreateInstance}
                />
            )}
        </div>
    );
};

export default CDEInternalWorkflowPanel;
