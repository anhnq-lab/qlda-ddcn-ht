import React, { useState, useEffect, useCallback } from 'react';
import {
    ClipboardList, Send, Save, ChevronDown, ChevronUp, Info,
    CheckCircle2, AlertTriangle, User, Building2, Calendar,
} from 'lucide-react';
import {
    EVALUATION_CRITERIA,
    MONTHS_VI,
    calcSelfTotal,
    getClassification,
    CLASSIFICATION_CONFIG,
    STATUS_CONFIG,
    type EvaluationForm,
} from '../types/evaluation.types';
import { EvaluationService } from '../services/evaluationService';
import { useAuth } from '../../../context/AuthContext';

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
    /** Nếu có form sẵn → edit mode; nếu null → create mode */
    existingForm?: EvaluationForm | null;
    /** Tháng/năm mặc định khi tạo mới */
    defaultMonth?: number;
    defaultYear?: number;
    onSaved?: (form: EvaluationForm) => void;
    onClose?: () => void;
}

// ─── Score slider with progress bar ──────────────────────────────────────────
const CriteriaCard: React.FC<{
    index: number;
    label: string;
    description: string;
    maxScore: number;
    value: number;
    onChange: (v: number) => void;
    disabled?: boolean;
}> = ({ index, label, description, maxScore, value, onChange, disabled }) => {
    const [expanded, setExpanded] = useState(false);
    const min = maxScore === 5 && index === 6 ? -5 : 0; // tiêu chí 7 có thể âm
    const pct = Math.max(0, Math.min(100, ((value - min) / (maxScore - min)) * 100));

    const barColor =
        pct >= 80 ? 'bg-emerald-500' :
        pct >= 60 ? 'bg-blue-500' :
        pct >= 40 ? 'bg-amber-400' :
        'bg-red-400';

    const step = maxScore >= 10 ? 1 : 0.5;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all">
            {/* Header row */}
            <div className="flex items-start gap-3 p-4">
                {/* Index badge */}
                <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-black text-primary-600 dark:text-primary-400">{index}</span>
                </div>

                {/* Label + toggle description */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug flex-1">{label}</p>
                        <button
                            onClick={() => setExpanded(v => !v)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
                        >
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>

                    {/* Score display */}
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <input
                                type="number"
                                min={min}
                                max={maxScore}
                                step={step}
                                value={value}
                                disabled={disabled}
                                onChange={e => {
                                    const v = parseFloat(e.target.value);
                                    if (!isNaN(v)) onChange(Math.min(maxScore, Math.max(min, v)));
                                }}
                                className="w-14 text-center text-base font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="text-xs text-slate-400 font-medium">/{maxScore}</span>
                        </div>
                    </div>

                    {/* Slider */}
                    {!disabled && (
                        <input
                            type="range"
                            min={min}
                            max={maxScore}
                            step={step}
                            value={value}
                            onChange={e => onChange(parseFloat(e.target.value))}
                            className="w-full mt-2 accent-primary-500 cursor-pointer"
                        />
                    )}
                </div>
            </div>

            {/* Expandable description */}
            {expanded && (
                <div className="px-4 pb-4 pt-0">
                    <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main SlidePanel Content ──────────────────────────────────────────────────
const EvaluationSlidePanel: React.FC<Props> = ({
    existingForm,
    defaultMonth,
    defaultYear,
    onSaved,
    onClose,
}) => {
    const { currentUser } = useAuth();
    const now = new Date();

    // Period selector (only for new forms)
    const [month, setMonth] = useState(defaultMonth ?? now.getMonth() + 1);
    const [year, setYear] = useState(defaultYear ?? now.getFullYear());

    // Scores — initialize from existing or zero
    const initScores = useCallback(() => ({
        s1: existingForm?.self_score_1 ?? 0,
        s2: existingForm?.self_score_2 ?? 0,
        s3: existingForm?.self_score_3 ?? 0,
        s4: existingForm?.self_score_4 ?? 0,
        s5: existingForm?.self_score_5 ?? 0,
        s6: existingForm?.self_score_6 ?? 0,
        s7: existingForm?.self_score_7 ?? 0,
    }), [existingForm]);

    const [scores, setScores] = useState<{s1:number;s2:number;s3:number;s4:number;s5:number;s6:number;s7:number}>(initScores);
    const [notes, setNotes] = useState(existingForm?.self_notes ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Reset khi existingForm thay đổi
    useEffect(() => {
        setScores(initScores());
        setNotes(existingForm?.self_notes ?? '');
    }, [existingForm, initScores]);

    const scoreValues = Object.values(scores);
    const total = scoreValues.reduce((a, b) => a + b, 0);
    const classification = getClassification(total);
    const clsCfg = CLASSIFICATION_CONFIG[classification];

    const isEditable = !existingForm || existingForm.status === 'draft' || existingForm.status === 'rejected';

    const setScore = (key: keyof typeof scores) => (v: number) =>
        setScores(prev => ({ ...prev, [key]: v }));

    const buildScorePayload = () => ({
        self_score_1: scores.s1,
        self_score_2: scores.s2,
        self_score_3: scores.s3,
        self_score_4: scores.s4,
        self_score_5: scores.s5,
        self_score_6: scores.s6,
        self_score_7: scores.s7,
        self_notes: notes || null,
    });

    // ── Lưu nháp ──────────────────────────────────────────────────
    const handleSaveDraft = async () => {
        if (!currentUser) return;
        setSaving(true); setError(null); setSuccess(null);

        let form = existingForm;

        // Tạo mới nếu chưa có
        if (!form) {
            const check = await EvaluationService.getByEmployeePeriod({
                employee_id: currentUser.EmployeeID,
                eval_month: month,
                eval_year: year,
            });
            if (check.data) {
                form = check.data;
            } else {
                const { data, error: createErr } = await EvaluationService.create({
                    employee_id: currentUser.EmployeeID,
                    employee_name: currentUser.FullName,
                    department_code: currentUser.Department,
                    department_name: currentUser.Department,
                    eval_month: month,
                    eval_year: year,
                    ...buildScorePayload(),
                });
                if (createErr || !data) {
                    setError(createErr ?? 'Không thể tạo phiếu. Vui lòng thử lại.');
                    setSaving(false);
                    return;
                }
                setSaving(false);
                setSuccess('Đã lưu nháp!');
                onSaved?.(data);
                return;
            }
        }

        // Cập nhật nếu đã có
        const { error: updateErr } = await EvaluationService.updateSelfScores(form.id, buildScorePayload());
        setSaving(false);
        if (updateErr) { setError(updateErr); return; }
        setSuccess('Đã lưu nháp!');

        // Refresh form
        const { data: refreshed } = await EvaluationService.getById(form.id);
        if (refreshed) onSaved?.(refreshed);
    };

    // ── Nộp phiếu ─────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!currentUser) return;
        setSaving(true); setError(null); setSuccess(null);

        let form = existingForm;

        // Tạo/cập nhật trước
        if (!form) {
            const check = await EvaluationService.getByEmployeePeriod({
                employee_id: currentUser.EmployeeID,
                eval_month: month,
                eval_year: year,
            });
            if (check.data) {
                form = check.data;
                await EvaluationService.updateSelfScores(form.id, buildScorePayload());
            } else {
                const { data, error: createErr } = await EvaluationService.create({
                    employee_id: currentUser.EmployeeID,
                    employee_name: currentUser.FullName,
                    department_code: currentUser.Department,
                    department_name: currentUser.Department,
                    eval_month: month,
                    eval_year: year,
                    ...buildScorePayload(),
                });
                if (createErr || !data) {
                    setError(createErr ?? 'Không thể tạo phiếu. Vui lòng thử lại.');
                    setSaving(false);
                    return;
                }
                form = data;
            }
        } else {
            await EvaluationService.updateSelfScores(form.id, buildScorePayload());
        }

        // Nộp
        const { error: submitErr } = await EvaluationService.submit(form!.id);
        setSaving(false);
        if (submitErr) { setError(submitErr); return; }

        setSuccess('Đã nộp phiếu thành công!');
        const { data: refreshed } = await EvaluationService.getById(form!.id);
        if (refreshed) onSaved?.(refreshed);

        // Đóng panel sau 1.5s
        setTimeout(() => onClose?.(), 1500);
    };

    const scoreKeys = ['s1','s2','s3','s4','s5','s6','s7'] as const;

    return (
        <div className="flex flex-col h-full">
            {/* ── Header info ─────────────────────────────────── */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 space-y-4">

                {/* Thông tin kỳ */}
                {!existingForm ? (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Kỳ đánh giá — Tháng</label>
                            <select value={month} onChange={e => setMonth(+e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400">
                                {MONTHS_VI.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Năm</label>
                            <select value={year} onChange={e => setYear(+e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400">
                                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <User size={14} className="text-slate-400" />
                            <span className="font-semibold">{existingForm.employee_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Building2 size={14} className="text-slate-400" />
                            <span>{existingForm.department_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar size={14} className="text-slate-400" />
                            <span>{MONTHS_VI[existingForm.eval_month - 1]} {existingForm.eval_year}</span>
                        </div>
                        {/* Status */}
                        {(() => {
                            const sc = STATUS_CONFIG[existingForm.status];
                            return (
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.darkBg} ${sc.color} ${sc.darkColor}`}>
                                    {sc.label}
                                </span>
                            );
                        })()}
                    </div>
                )}

                {/* Total score preview */}
                <div className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${clsCfg.border} ${clsCfg.bg} ${clsCfg.darkBg}`}>
                    <div className="text-center">
                        <div className={`text-3xl font-black ${clsCfg.color} ${clsCfg.darkColor}`}>
                            {total.toFixed(1)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">/ 100</div>
                    </div>
                    <div className="flex-1">
                        <div className={`text-sm font-bold ${clsCfg.color} ${clsCfg.darkColor}`}>{classification}</div>
                        <div className="text-xs text-slate-400 mt-0.5">Dự kiến xếp loại</div>
                        {/* Mini breakdown */}
                        <div className="flex gap-1 mt-2 flex-wrap">
                            {scoreKeys.map((k, i) => (
                                <span key={k} className="text-[10px] bg-white dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                    T{i+1}: {scores[k]}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Criteria list ────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {EVALUATION_CRITERIA.map((c, i) => (
                    <CriteriaCard
                        key={c.key}
                        index={i + 1}
                        label={c.label}
                        description={c.description}
                        maxScore={c.maxScore}
                        value={scores[scoreKeys[i]]}
                        onChange={setScore(scoreKeys[i])}
                        disabled={!isEditable}
                    />
                ))}

                {/* Ghi chú */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                        Nhận xét / Ghi chú cá nhân
                    </label>
                    <textarea
                        rows={4}
                        value={notes}
                        disabled={!isEditable}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Mô tả kết quả công việc trong tháng, thành tích nổi bật, khó khăn gặp phải..."
                        className="w-full text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Nhận xét từ chối (nếu có) */}
                {existingForm?.status === 'rejected' && existingForm.manager_notes && (
                    <div className="flex gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">
                                Lý do từ chối (bởi {existingForm.manager_name}):
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-300">{existingForm.manager_notes}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Footer ──────────────────────────────────────── */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                {/* Feedback messages */}
                {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{success}</p>
                    </div>
                )}

                {isEditable ? (
                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveDraft}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                        >
                            <Save size={15} />
                            {saving ? 'Đang lưu...' : 'Lưu nháp'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-primary-500/20"
                        >
                            <Send size={15} />
                            {saving ? 'Đang nộp...' : 'Nộp phiếu'}
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-3 text-sm text-slate-400">
                        {existingForm?.status === 'submitted' && '⏳ Đang chờ trưởng phòng phê duyệt'}
                        {existingForm?.status === 'approved' && '✅ Phiếu đã được phê duyệt'}
                    </div>
                )}

                <p className="text-center text-[10px] text-slate-300 dark:text-slate-600">
                    Quy chế đánh giá, xếp loại QCDGXL-2026 · Tổng tối đa 100 điểm
                </p>
            </div>
        </div>
    );
};

export default EvaluationSlidePanel;
