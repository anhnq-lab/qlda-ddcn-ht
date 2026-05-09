import React, { useState } from 'react';
import { FileText, CheckCircle2, X, PenTool, Shield, History, Loader2, ArrowLeft, MessageSquare, Lock } from 'lucide-react';
import type { CDEDocument, CDEWorkflowEntry, CDEPermission } from '../types';
import { CDE_WORKFLOW_STEPS, CONTAINER_COLORS, getStatusLabel, getContainerFromStatus } from '../constants';
import { CDEService } from '../../../services/CDEService';
import { useCDERevisions } from '../../../hooks/useCDE';
import CDECommentThread from './CDECommentThread';
import CDERevisionHistory from './CDERevisionHistory';

interface CDEWorkflowPanelProps {
    doc: CDEDocument;
    workflowHistory: CDEWorkflowEntry[];
    isPending: boolean;
    userPermission?: CDEPermission | null;
    onApprove: (comment: string) => void;
    onReject: (comment: string) => void;
    onReturn: (comment: string) => void;
    onClose: () => void;
}

const CDEWorkflowPanel: React.FC<CDEWorkflowPanelProps> = ({
    doc, workflowHistory, isPending, userPermission, onApprove, onReject, onReturn, onClose,
}) => {
    const [actionComment, setActionComment] = useState('');

    // Fetch real revision history
    const { data: revisions } = useCDERevisions(doc.doc_id);

    // Determine completed steps from cde_status
    // Status progression: S0 -> S1 -> S2 -> S3 -> A1
    const STATUS_ORDER = ['S0', 'S1', 'S2', 'S3', 'A1'];
    const currentStatusIdx = STATUS_ORDER.indexOf(doc.cde_status || 'S0');

    // A step is completed if its nextStatus is at or below the doc's current status
    const isStepCompleted = (step: typeof CDE_WORKFLOW_STEPS[0]) => {
        const stepTargetIdx = STATUS_ORDER.indexOf(step.nextStatus);
        if (stepTargetIdx === -1) return false;
        return stepTargetIdx <= currentStatusIdx;
    };

    // Also check workflow history for step completion (match by code)
    const isStepInHistory = (step: typeof CDE_WORKFLOW_STEPS[0]) => {
        return workflowHistory.some(h => h.step_code === step.code && h.status === 'Approved');
    };

    // Find next workflow step
    const getNextStep = () => {
        if (workflowHistory.length === 0 && currentStatusIdx <= 0) return CDE_WORKFLOW_STEPS[0];
        const last = workflowHistory.length > 0 ? workflowHistory[workflowHistory.length - 1] : null;
        if (last?.status === 'Rejected' || last?.status === 'Returned') return CDE_WORKFLOW_STEPS[0];
        if (last?.status === 'Pending') return CDE_WORKFLOW_STEPS.find(s => s.code === last.step_code || s.name === last.step_name);
        // Find first non-completed step
        const nextUncompleted = CDE_WORKFLOW_STEPS.find(s => !isStepCompleted(s) && !isStepInHistory(s));
        return nextUncompleted || null;
    };

    const nextStep = getNextStep();
    const containerType = getContainerFromStatus(doc.cde_status || 'S0');
    const colors = CONTAINER_COLORS[containerType];

    // Check if user can perform this step
    const canPerformAction = nextStep
        ? CDEService.canPerformStep(userPermission?.user_role, nextStep.role)
        : false;

    // Handle actions with comment
    const handleApprove = () => { onApprove(actionComment || 'Đã duyệt'); setActionComment(''); };
    const handleReject = () => {
        if (!actionComment.trim()) { alert('Vui lòng nhập lý do từ chối'); return; }
        onReject(actionComment); setActionComment('');
    };
    const handleReturn = () => {
        if (!actionComment.trim()) { alert('Vui lòng nhập yêu cầu bổ sung'); return; }
        onReturn(actionComment); setActionComment('');
    };

    return (
        <div className="w-[340px] bg-bg-surface rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden shrink-0 animate-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-bg-subtle">
                <span className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-[0.15em]">Phê duyệt hồ sơ</span>
                <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Doc Info */}
                <div className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-800 dark:text-slate-100 line-clamp-2">{doc.doc_name}</h4>
                        <p className="text-[10px] font-mono text-gray-400 mt-1">
                            v{doc.version || 'P01.01'} • {doc.size}
                        </p>
                        {doc.submitted_by && (
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                                Nộp bởi: {doc.submitted_by} {doc.submitted_by_org ? `(${doc.submitted_by_org})` : ''}
                            </p>
                        )}
                    </div>
                </div>

                {/* Workflow Progress */}
                <div>
                    <h5 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Tiến trình duyệt</h5>
                    <div className="flex justify-between mb-2">
                        {CDE_WORKFLOW_STEPS.map((step, idx) => {
                            const isCompleted = isStepCompleted(step) || isStepInHistory(step);
                            const isCurrent = nextStep?.id === step.id;
                            return (
                                <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 relative">
                                    {idx < CDE_WORKFLOW_STEPS.length - 1 && (
                                        <div className={`absolute left-1/2 right-[-50%] top-3 h-0.5 z-0 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-slate-700'}`} />
                                    )}
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 text-[9px] font-black border-2 transition-all ${isCompleted
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : isCurrent ? 'bg-bg-surface border-blue-600 text-blue-600 ring-2 ring-blue-100 dark:ring-blue-900/40'
                                            : 'bg-bg-surface border-gray-200 dark:border-slate-600 text-gray-300 dark:text-slate-400'
                                        }`}>
                                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : (idx + 1)}
                                    </div>
                                    <span className={`text-[8px] font-bold text-center leading-tight ${isCompleted
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : isCurrent ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                                            : 'text-gray-400 dark:text-slate-400'
                                        }`}>
                                        {step.name.split(' ').pop()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Current Status */}
                <div className={`rounded-xl p-3.5 border ${colors.lightBg} ${colors.border}`}>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase mb-1.5">Trạng thái hiện tại</p>
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-white/80 dark:bg-slate-700 rounded-lg">
                            <Shield className={`w-4 h-4 ${colors.text}`} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 dark:text-slate-100">
                                {getStatusLabel(doc.cde_status || 'S0')}
                            </p>
                            {nextStep && (
                                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                                    Đang chờ: {nextStep.name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Workflow History */}
                {workflowHistory.length > 0 && (
                    <div>
                        <h5 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <History className="w-3 h-3" /> Lịch sử luân chuyển
                        </h5>
                        <div className="relative pl-4 space-y-3 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-slate-700">
                            {[...workflowHistory].reverse().map((hist, idx) => (
                                <div key={idx} className="relative">
                                    <div className={`absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${hist.status === 'Approved' ? 'bg-emerald-500' : hist.status === 'Returned' ? 'bg-primary-500' : 'bg-red-500'}`} />
                                    <div>
                                        <p className="text-xs font-bold text-gray-800 dark:text-slate-100">{hist.step_name}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5">
                                            {hist.actor_name} ({hist.actor_role || ''}) • {new Date(hist.created_at).toLocaleString('vi-VN')}
                                        </p>
                                        {hist.comment && (
                                            <p className={`text-[10px] mt-1 p-2 rounded border italic ${hist.status === 'Approved'
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800'
                                                : hist.status === 'Returned'
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-100 dark:border-primary-800'
                                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800'
                                                }`}>
                                                "{hist.comment}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Revision History — Real data */}
                <CDERevisionHistory
                    docName={doc.doc_name}
                    currentVersion={doc.version || 'P01.01'}
                    revisions={revisions || []}
                />

                {/* Comment Thread */}
                <CDECommentThread docId={doc.doc_id} docName={doc.doc_name} />
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800">
                {nextStep ? (
                    <div className="space-y-2.5">
                        {/* Comment input for workflow actions */}
                        <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <MessageSquare className="w-3 h-3 text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Nhận xét</span>
                            </div>
                            <textarea
                                value={actionComment}
                                onChange={e => setActionComment(e.target.value)}
                                placeholder="Nhập nhận xét, lý do từ chối hoặc yêu cầu bổ sung..."
                                rows={2}
                                disabled={!canPerformAction}
                                className="w-full text-xs bg-bg-surface border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 dark:text-slate-200 disabled:opacity-50"
                            />
                        </div>

                        {canPerformAction ? (
                            <div className="flex gap-2">
                                <button
                                    disabled={isPending}
                                    onClick={handleReturn}
                                    className="flex-1 py-2.5 bg-bg-surface border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                    title="Yêu cầu bổ sung"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> Bổ sung
                                </button>
                                <button
                                    disabled={isPending}
                                    onClick={handleReject}
                                    className="flex-1 py-2.5 bg-bg-surface border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                >
                                    <X className="w-3.5 h-3.5" /> Từ chối
                                </button>
                                <button
                                    disabled={isPending}
                                    onClick={handleApprove}
                                    className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-200 dark:shadow-emerald-900/30 flex items-center justify-center gap-1.5"
                                >
                                    {isPending ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <>
                                            {nextStep.id === 'DIRECTOR_SIGN' ? <PenTool className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                            {nextStep.name}
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl">
                                <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                                <div>
                                    <p className="text-[11px] font-bold text-gray-600 dark:text-slate-300">
                                        Bạn không có quyền thực hiện bước này
                                    </p>
                                    <p className="text-[10px] text-gray-400 dark:text-slate-400">
                                        Yêu cầu: {nextStep.roleLabel}
                                    </p>
                                </div>
                            </div>
                        )}
                        <p className="text-[9px] text-gray-400 dark:text-slate-400 text-center font-medium">
                            Quyền hạn: {nextStep.roleLabel}
                        </p>
                    </div>
                ) : (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <p className="text-[11px] font-bold">Hồ sơ đã hoàn tất quy trình phê duyệt.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CDEWorkflowPanel;
