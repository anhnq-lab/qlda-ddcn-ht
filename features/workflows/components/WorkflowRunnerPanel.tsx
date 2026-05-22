import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    ChevronLeft, ChevronRight, CheckCircle2, Circle, Clock,
    AlertCircle, FileText, BookOpen, ListChecks, Loader2, Flag, ExternalLink
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useSlidePanel } from '@/context/SlidePanelContext';
import { getInternalWorkflowTemplates } from '../data/seedInternalWorkflows';
import { getFormDefinition } from '../data/formChecklist';
import { FormChecklistPanel, FormSavePayload } from './FormChecklistPanel';
import {
    WorkflowInstance,
    WorkflowStepRecord,
    getInstanceWithSteps,
    saveStepRecord,
    advanceStep,
    completeInstance,
} from '../services/workflowInstanceService';

// ─── Types ───────────────────────────────────────────────────────────
interface Props {
    instanceId: string;
    projectName: string;
    onClose?: () => void;
    onComplete?: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────
const PHASE_LABELS: Record<string, { label: string; color: string }> = {
    initiation:    { label: 'Khởi tạo',               color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
    consultant:    { label: 'Tư vấn',                  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    reception:     { label: 'Tiếp nhận HS',            color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
    review:        { label: 'Kiểm tra',                 color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    consolidation: { label: 'Tổng hợp / Thẩm định',   color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
    approval:      { label: 'Phê duyệt',               color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    handover:      { label: 'Bàn giao',                color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
};

// ─── Render guidelines ───────────────────────────────────────────────
function renderGuidelines(raw: string): React.ReactNode {
    return raw.split('\n').map((line, i) => {
        const trimmed = line.trim().replace(/^- /, '');
        const formatted = trimmed.replace(/\*\*(.+?)\*\*/g, (_, m) => `<strong>${m}</strong>`);
        return (
            <li key={i} className="text-[12px] text-gray-600 dark:text-slate-300 leading-relaxed list-none"
                dangerouslySetInnerHTML={{ __html: formatted }} />
        );
    });
}

// ─── Main Component ───────────────────────────────────────────────────
/**
 * WorkflowRunnerPanel — dùng bên trong SlidePanel của SlidePanelContext.
 * ProjectWorkflowTab gọi openPanel({ component: <WorkflowRunnerPanel .../> }).
 */
export const WorkflowRunnerPanel: React.FC<Props> = ({ instanceId, projectName, onComplete }) => {
    const { addToast } = useToast();
    const { openPanel } = useSlidePanel();

    const [instance, setInstance] = useState<WorkflowInstance | null>(null);
    const [stepRecords, setStepRecords] = useState<WorkflowStepRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state cho bước hiện tại
    const [conclusion, setConclusion] = useState<'pass' | 'fail' | 'na' | null>(null);
    const [notes, setNotes] = useState('');

    // Lưu checkedIds từng biểu mẫu theo step index: { [stepIdx]: number[] }
    const [formCheckedByStep, setFormCheckedByStep] = useState<Record<number, number[]>>({});

    const allTemplates = useMemo(() => getInternalWorkflowTemplates(), []);

    // Load instance + step records
    const loadData = useCallback(async () => {
        try {
            const data = await getInstanceWithSteps(instanceId);
            setInstance(data);
            setStepRecords(data.step_records);
            
            // Khôi phục checkedIds từ database
            const initialChecked: Record<number, number[]> = {};
            data.step_records.forEach(r => {
                if (r.form_data && Array.isArray(r.form_data.checkedIds)) {
                    initialChecked[r.step_index] = r.form_data.checkedIds;
                }
            });
            setFormCheckedByStep(initialChecked);
        } catch {
            addToast({ title: 'Lỗi', message: 'Không tải được dữ liệu quy trình.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [instanceId, addToast]);

    useEffect(() => { loadData(); }, [loadData]);

    // Reset form khi chuyển bước
    useEffect(() => {
        if (!instance) return;
        const existing = stepRecords.find(r => r.step_index === instance.current_step_index);
        setConclusion(existing?.conclusion ?? null);
        setNotes(existing?.notes ?? '');
    }, [instance?.current_step_index, stepRecords]);

    const template = useMemo(() =>
        allTemplates.find(t => t.code === instance?.workflow_code),
    [allTemplates, instance?.workflow_code]);

    const steps = template?.steps ?? [];
    const currentIdx = instance?.current_step_index ?? 0;
    const currentStep = steps[currentIdx];
    const currentMeta = currentStep?.metadata as any;
    const formCode: string | null = currentMeta?.form_code ?? null;
    const phase = currentMeta?.phase ?? '';
    const phaseInfo = PHASE_LABELS[phase];

    const currentRecord = stepRecords.find(r => r.step_index === currentIdx);
    const isCurrentCompleted = currentRecord?.is_completed ?? false;

    // Checklist state cho bước hiện tại
    const currentFormDef = formCode ? getFormDefinition(formCode) : null;
    const currentFormTotal = currentFormDef?.type === 'checklist' ? currentFormDef.items.length : 0;
    const currentCheckedIds = formCheckedByStep[currentIdx] ?? [];
    const currentFormDone  = currentCheckedIds.length;
    const isFormAllDone    = currentFormTotal === 0 || currentFormDone >= currentFormTotal;

    const needsStep11 = useMemo(() =>
        [7, 8, 9].some(i => stepRecords.find(r => r.step_index === i && r.conclusion === 'fail')),
    [stepRecords]);

    const canAdvance = useMemo(() => {
        if (isCurrentCompleted) return true;
        if (currentIdx === 10 && !needsStep11) return true;
        if (!formCode) return true;
        // Biểu mẫu checklist: phải lưu đủ hết + chọn kết luận
        if (currentFormTotal > 0 && !isFormAllDone) return false;
        return conclusion === 'pass' || conclusion === 'na';
    }, [isCurrentCompleted, formCode, conclusion, currentIdx, needsStep11, currentFormTotal, isFormAllDone]);

    // Ref để tránh stale closure trong setTimeout (phải khai báo TRƯỚC handleFormSave)
    const handleSaveAndAdvanceRef = React.useRef<(() => void) | null>(null);
    // Ref cho handleFormSave — để FormChecklistPanel luôn gọi phiên bản mới nhất dù panel đã mount
    const handleFormSaveRef = React.useRef<((p: FormSavePayload) => void) | null>(null);

    // ── Xử lý lưu biểu mẫu từ FormChecklistPanel ──
    const handleFormSave = useCallback(async (payload: FormSavePayload) => {
        if (!instance) return;
        setFormCheckedByStep(prev => ({ ...prev, [currentIdx]: payload.checkedIds }));
        
        try {
            // Lưu trực tiếp vào DB mỗi lần nhấn "Lưu tiến độ" trong checklist
            const updated = await saveStepRecord({
                instanceId: instance.id,
                stepIndex: currentIdx,
                formCode,
                conclusion,
                notes,
                isCompleted: payload.allDone,
                formData: { checkedIds: payload.checkedIds }
            });
            setStepRecords(prev => [...prev.filter(r => r.step_index !== currentIdx), updated]);

            if (payload.allDone) {
                setConclusion('pass');
                addToast({
                    title: '✅ Biểu mẫu hoàn tất!',
                    message: 'Đã lưu đủ checklist. Đang chuyển bước tiếp theo...',
                    type: 'success',
                });
                setTimeout(() => { handleSaveAndAdvanceRef.current?.(); }, 800);
            } else {
                addToast({
                    title: 'Đã lưu tiến độ',
                    message: `${payload.checkedIds.length}/${payload.totalItems} mục đã hoàn thành.`,
                    type: 'success',
                });
            }
        } catch (err) {
            console.error('Lưu checklist lỗi:', err);
            addToast({ title: 'Lỗi', message: 'Không thể lưu tiến độ checklist.', type: 'error' });
        }
    }, [currentIdx, addToast, instance, formCode, conclusion, notes]);
    // Gán ref trực tiếp trong render — luôn mới nhất
    handleFormSaveRef.current = handleFormSave;

    // ── Mở checklist biểu mẫu trong panel con ──
    const handleOpenFormChecklist = useCallback(() => {
        if (!formCode) return;
        openPanel({
            title: formCode,
            icon: <FileText className="w-4 h-4 text-amber-500" />,
            width: 500,
            // Dùng render function — SlidePanel sẽ gọi lại mỗi render, luôn nhận onSave mới nhất
            component: () => (
                <FormChecklistPanel
                    formCode={formCode}
                    initialCheckedIds={formCheckedByStep[currentIdx] ?? []}
                    onSave={handleFormSaveRef.current ?? undefined}
                    projectId={instance?.project_id}
                />
            ),
        });
    }, [formCode, currentIdx, formCheckedByStep, openPanel]);

    // ── Handlers ──
    const handleSaveAndAdvance = async () => {
        if (!instance) return;
        setSaving(true);
        try {
            const updated = await saveStepRecord({
                instanceId: instance.id,
                stepIndex: currentIdx,
                formCode,
                conclusion,
                notes,
                isCompleted: true,
                formData: { checkedIds: formCheckedByStep[currentIdx] || [] }
            });
            setStepRecords(prev => [...prev.filter(r => r.step_index !== currentIdx), updated]);

            let actualNext = currentIdx + 1;
            if (actualNext === 10 && !needsStep11) actualNext = 11;

            if (actualNext >= steps.length) {
                await completeInstance(instance.id);
                addToast({ title: '🎉 Hoàn thành!', message: 'Quy trình đã kết thúc thành công.', type: 'success' });
                onComplete?.();
            } else {
                const newInst = await advanceStep(instance.id, actualNext);
                setInstance(newInst);
            }
        } catch {
            addToast({ title: 'Lỗi', message: 'Không thể lưu bước. Vui lòng thử lại.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // Sync ref mỗi render
    React.useEffect(() => { handleSaveAndAdvanceRef.current = handleSaveAndAdvance; });

    const handleSaveDraft = async () => {
        if (!instance) return;
        setSaving(true);
        try {
            const updated = await saveStepRecord({
                instanceId: instance.id, stepIndex: currentIdx,
                formCode, conclusion, notes, isCompleted: false,
                formData: { checkedIds: formCheckedByStep[currentIdx] || [] }
            });
            setStepRecords(prev => [...prev.filter(r => r.step_index !== currentIdx), updated]);
            addToast({ title: 'Đã lưu nháp', message: 'Dữ liệu bước hiện tại đã được lưu.', type: 'success' });
        } catch {
            addToast({ title: 'Lỗi', message: 'Không lưu được nháp.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleGoBack = async () => {
        if (!instance || currentIdx === 0) return;
        const newInst = await advanceStep(instance.id, currentIdx - 1);
        setInstance(newInst);
    };

    // ── Render ──
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                <span className="text-sm text-gray-600 dark:text-slate-300">Đang tải quy trình...</span>
            </div>
        );
    }

    if (!instance || !currentStep) return null;

    const progress = Math.round((currentIdx / steps.length) * 100);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">

            {/* ── Sub-header: dự án + bước ── */}
            <div className="shrink-0 px-5 py-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-white dark:from-slate-800 dark:to-slate-900">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">{instance.workflow_code}</p>
                        <p className="text-xs font-bold text-gray-700 dark:text-slate-200 truncate max-w-[340px]">{projectName}</p>
                    </div>
                    <span className="shrink-0 text-[11px] font-black text-gray-500 dark:text-slate-400">
                        Bước {currentIdx + 1}/{steps.length}
                    </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 min-h-0">

                {/* Sidebar: Timeline */}
                <div className="w-48 shrink-0 border-r border-gray-100 dark:border-slate-700 overflow-y-auto bg-gray-50 dark:bg-slate-800 py-2">
                    {steps.map((step, idx) => {
                        const record = stepRecords.find(r => r.step_index === idx);
                        const isActive = idx === currentIdx;
                        const isDone = record?.is_completed;
                        const isFail = record?.conclusion === 'fail';
                        const isSkipped = idx === 10 && !needsStep11 && currentIdx > 10;

                        return (
                            <div key={idx} className={`flex items-start gap-2 px-3 py-1.5 ${isActive ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                                <div className="mt-0.5 shrink-0">
                                    {isSkipped ? (
                                        <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
                                            <span className="text-[7px] text-gray-400">–</span>
                                        </div>
                                    ) : isDone ? (
                                        <CheckCircle2 className={`w-4 h-4 ${isFail ? 'text-red-500' : 'text-emerald-500'}`} />
                                    ) : isActive ? (
                                        <div className="w-4 h-4 rounded-full border-2 border-primary-500 bg-primary-100 dark:bg-primary-900/40" />
                                    ) : (
                                        <Circle className="w-4 h-4 text-gray-300 dark:text-slate-600" />
                                    )}
                                </div>
                                <p className={`text-[10px] leading-tight ${
                                    isActive ? 'font-black text-primary-700 dark:text-primary-400' :
                                    isDone ? 'font-semibold text-gray-500 dark:text-slate-400' :
                                    'text-gray-400 dark:text-slate-500'
                                }`}>
                                    {step.name}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 overflow-y-auto flex flex-col">
                    <div className="flex-1 p-5 space-y-4">

                        {/* Step header */}
                        <div>
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                                {phaseInfo && (
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${phaseInfo.color}`}>
                                        {phaseInfo.label}
                                    </span>
                                )}
                                {currentStep.sla && (
                                    <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500">
                                        <Clock className="w-3 h-3" /> SLA: {currentStep.sla}
                                    </span>
                                )}
                                {/* Form badge — CLICK để mở checklist + hiện tiến độ */}
                                {formCode && (
                                    <button
                                        onClick={handleOpenFormChecklist}
                                        className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border transition-colors group ${
                                            isFormAllDone
                                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                                : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                                        }`}
                                        title={isFormAllDone ? 'Biểu mẫu đã hoàn tất' : 'Nhấn để mở checklist biểu mẫu'}
                                    >
                                        <FileText className="w-3 h-3" />
                                        {formCode}
                                        {currentFormTotal > 0 && (
                                            <span className={`ml-0.5 font-black ${
                                                isFormAllDone ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500'
                                            }`}>
                                                · {currentFormDone}/{currentFormTotal}
                                            </span>
                                        )}
                                        <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                                    </button>
                                )}
                                {isCurrentCompleted && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                        <CheckCircle2 className="w-3 h-3" /> Đã hoàn thành
                                    </span>
                                )}
                            </div>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug">{currentStep.name}</h3>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">Chủ trì: {currentStep.role}</p>
                        </div>

                        {/* Guidelines */}
                        {currentMeta?.guidelines && (
                            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/40 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">Hướng dẫn thực hiện</span>
                                </div>
                                <ul className="space-y-1">
                                    {renderGuidelines(currentMeta.guidelines)}
                                </ul>
                            </div>
                        )}

                        {/* Sub-tasks */}
                        {currentMeta?.sub_tasks?.length > 0 && (
                            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ListChecks className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                                    <span className="text-[10px] font-black text-gray-600 dark:text-slate-300 uppercase tracking-wider">Công việc cụ thể</span>
                                </div>
                                <ul className="space-y-2">
                                    {currentMeta.sub_tasks.map((st: any, i: number) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="mt-0.5 w-4 h-4 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-black text-gray-500 shrink-0">{i + 1}</span>
                                            <div>
                                                <p className="text-[11px] text-gray-700 dark:text-slate-300">{st.name}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-slate-500">👤 {st.assignee_role}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Form kết luận */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
                            <p className="text-[10px] font-black text-gray-600 dark:text-slate-300 uppercase tracking-wider">Kết quả bước này</p>

                            {formCode ? (
                                <div>
                                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-2">
                                        Hoàn thành biểu mẫu{' '}
                                        <button onClick={handleOpenFormChecklist} className="font-black text-amber-600 dark:text-amber-400 hover:underline">
                                            {formCode} ↗
                                        </button>
                                        {' '}và chọn kết luận:
                                    </p>
                                    {/* Cảnh báo checklist chưa đủ */}
                                    {currentFormTotal > 0 && !isFormAllDone && (
                                        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                            <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                                Cần hoàn thành checklist{' '}
                                                <button onClick={handleOpenFormChecklist} className="font-black underline">{formCode}</button>
                                                {' '}({currentFormDone}/{currentFormTotal} mục) trước khi chuyển bước.
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        {([
                                            { val: 'pass', label: '✅ Đạt',            cls: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400' },
                                            { val: 'fail', label: '❌ Chưa đạt',       cls: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400' },
                                            { val: 'na',   label: '— Không áp dụng', cls: 'border-gray-300 bg-gray-50 text-gray-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300' },
                                        ] as const).map(opt => (
                                            <button
                                                key={opt.val}
                                                onClick={() => setConclusion(conclusion === opt.val ? null : opt.val)}
                                                disabled={opt.val === 'pass' && currentFormTotal > 0 && !isFormAllDone}
                                                className={`flex-1 text-[11px] font-bold py-2 px-2 rounded-lg border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                                                    conclusion === opt.val ? opt.cls + ' ring-2 ring-offset-1 ring-current' : 'border-gray-200 dark:border-slate-600 text-gray-400 dark:text-slate-500 hover:border-gray-300'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    {!conclusion && isFormAllDone && (
                                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Phải chọn kết luận để hoàn thành bước này.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-[11px] text-gray-400 dark:text-slate-500 italic">
                                    Bước này không có biểu mẫu bắt buộc. Ghi chú (tuỳ chọn) và chuyển bước tiếp theo.
                                </p>
                            )}

                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Ghi chú bổ sung (tuỳ chọn)..."
                                rows={2}
                                className="w-full text-[12px] rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3 py-2 text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-700"
                            />
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60">
                        <button
                            onClick={handleGoBack}
                            disabled={currentIdx === 0 || saving}
                            className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" /> Quay lại
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSaveDraft}
                                disabled={saving}
                                className="px-3 py-2 text-[11px] font-bold text-gray-600 dark:text-slate-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-40"
                            >
                                Lưu nháp
                            </button>
                            <button
                                onClick={handleSaveAndAdvance}
                                disabled={!canAdvance || saving}
                                className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-black rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                    currentIdx === steps.length - 1
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                        : 'gradient-btn text-white shadow-sm hover:-translate-y-0.5'
                                }`}
                            >
                                {saving ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...</>
                                ) : currentIdx === steps.length - 1 ? (
                                    <><Flag className="w-3.5 h-3.5" /> Hoàn thành QT</>
                                ) : (
                                    <>Hoàn thành bước <ChevronRight className="w-3.5 h-3.5" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
