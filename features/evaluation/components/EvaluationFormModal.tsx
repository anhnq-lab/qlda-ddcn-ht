import React, { useState, useCallback } from 'react';
import { X, Send, CheckCircle2, XCircle, ChevronRight, AlertTriangle, Pencil, User, Calendar } from 'lucide-react';
import { EVALUATION_CRITERIA, STATUS_CONFIG, calcSelfTotal, calcManagerTotal, getClassification, CLASSIFICATION_CONFIG, MONTHS_VI, type EvaluationForm } from '../types/evaluation.types';
import { EvaluationService } from '../services/evaluationService';
import { EvaluationStatusBadge, ClassificationBadge } from './EvaluationBadges';
import { useAuth } from '../../../context/AuthContext';

interface Props {
    form: EvaluationForm;
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
    canManage: boolean; // true nếu là Manager/Admin
}

const ScoreInput: React.FC<{
    label: string;
    description: string;
    maxScore: number;
    value: number;
    onChange: (v: number) => void;
    disabled?: boolean;
    highlight?: boolean;
}> = ({ label, description, maxScore, value, onChange, disabled, highlight }) => {
    const pct = Math.max(0, Math.min(100, (value / maxScore) * 100));
    const trackColor = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-400';

    return (
        <div className={`p-4 rounded-xl border transition-all ${highlight ? 'border-primary-300 dark:border-primary-700 bg-primary-50/40 dark:bg-primary-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">{label}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{description}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <input
                        type="number"
                        min={maxScore === 5 && label.includes('thưởng') ? -5 : 0}
                        max={maxScore}
                        step={0.5}
                        value={value}
                        disabled={disabled}
                        onChange={e => onChange(Math.min(maxScore, Math.max(-5, parseFloat(e.target.value) || 0)))}
                        className="w-16 text-center text-lg font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-1 px-1 focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-xs text-slate-400 font-medium">/{maxScore}</span>
                </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${trackColor}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

const EvaluationFormModal: React.FC<Props> = ({ form: initialForm, isOpen, onClose, onRefresh, canManage }) => {
    const { currentUser } = useAuth();
    const [form, setForm] = useState<EvaluationForm>(initialForm);
    const [managerMode, setManagerMode] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    const [showRejectBox, setShowRejectBox] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isOwner = currentUser?.EmployeeID === form.employee_id;
    const canEdit = isOwner && (form.status === 'draft' || form.status === 'rejected');
    const canReview = canManage && form.status === 'submitted';

    const selfTotal = calcSelfTotal(form);
    const managerTotal = form.manager_score_1 !== null ? calcManagerTotal(form) : null;

    const updateSelfScore = useCallback((key: keyof EvaluationForm, val: number) => {
        setForm(prev => ({ ...prev, [key]: val }));
    }, []);

    const updateManagerScore = useCallback((key: keyof EvaluationForm, val: number) => {
        setForm(prev => ({ ...prev, [key]: val }));
    }, []);

    const handleSaveDraft = async () => {
        setSaving(true); setError(null);
        const { error: err } = await EvaluationService.updateSelfScores(form.id, {
            self_score_1: form.self_score_1, self_score_2: form.self_score_2,
            self_score_3: form.self_score_3, self_score_4: form.self_score_4,
            self_score_5: form.self_score_5, self_score_6: form.self_score_6,
            self_score_7: form.self_score_7, self_notes: form.self_notes,
        });
        setSaving(false);
        if (err) { setError(err); return; }
        onRefresh();
    };

    const handleSubmit = async () => {
        setSaving(true); setError(null);
        await EvaluationService.updateSelfScores(form.id, {
            self_score_1: form.self_score_1, self_score_2: form.self_score_2,
            self_score_3: form.self_score_3, self_score_4: form.self_score_4,
            self_score_5: form.self_score_5, self_score_6: form.self_score_6,
            self_score_7: form.self_score_7, self_notes: form.self_notes,
        });
        const { error: err } = await EvaluationService.submit(form.id);
        setSaving(false);
        if (err) { setError(err); return; }
        onRefresh(); onClose();
    };

    const handleApprove = async () => {
        if (!currentUser) return;
        setSaving(true); setError(null);
        const { error: err } = await EvaluationService.approve(form.id, {
            manager_score_1: form.manager_score_1 ?? form.self_score_1,
            manager_score_2: form.manager_score_2 ?? form.self_score_2,
            manager_score_3: form.manager_score_3 ?? form.self_score_3,
            manager_score_4: form.manager_score_4 ?? form.self_score_4,
            manager_score_5: form.manager_score_5 ?? form.self_score_5,
            manager_score_6: form.manager_score_6 ?? form.self_score_6,
            manager_score_7: form.manager_score_7 ?? form.self_score_7,
            manager_notes: form.manager_notes,
            manager_id: currentUser.EmployeeID,
            manager_name: currentUser.FullName,
        });
        setSaving(false);
        if (err) { setError(err); return; }
        onRefresh(); onClose();
    };

    const handleReject = async () => {
        if (!currentUser || !rejectNote.trim()) return;
        setSaving(true); setError(null);
        const { error: err } = await EvaluationService.reject(form.id, {
            manager_notes: rejectNote,
            manager_id: currentUser.EmployeeID,
            manager_name: currentUser.FullName,
        });
        setSaving(false);
        if (err) { setError(err); return; }
        onRefresh(); onClose();
    };

    if (!isOpen) return null;

    const selfClassification = getClassification(selfTotal);
    const selfCfg = CLASSIFICATION_CONFIG[selfClassification];
    const managerClassification = managerTotal !== null ? getClassification(managerTotal) : null;
    const managerCfg = managerClassification ? CLASSIFICATION_CONFIG[managerClassification] : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col">

                {/* Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                            <User size={18} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{form.employee_name}</h2>
                            <p className="text-xs text-slate-400">{form.department_name} · {MONTHS_VI[form.eval_month - 1]} {form.eval_year}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <EvaluationStatusBadge status={form.status} />
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <X size={18} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Score summary */}
                    <div className="px-6 pt-5 pb-3 grid grid-cols-2 gap-3">
                        <div className={`p-4 rounded-xl border ${selfCfg.border} ${selfCfg.bg} ${selfCfg.darkBg} text-center`}>
                            <div className={`text-3xl font-black ${selfCfg.color} ${selfCfg.darkColor}`}>{selfTotal.toFixed(1)}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Tự đánh giá</div>
                            <div className={`text-xs font-bold mt-1 ${selfCfg.color} ${selfCfg.darkColor}`}>{selfClassification}</div>
                        </div>
                        <div className={`p-4 rounded-xl border ${managerCfg ? managerCfg.border : 'border-slate-200 dark:border-slate-700'} ${managerCfg ? managerCfg.bg + ' ' + managerCfg.darkBg : 'bg-slate-50 dark:bg-slate-800/50'} text-center`}>
                            <div className={`text-3xl font-black ${managerCfg ? managerCfg.color + ' ' + managerCfg.darkColor : 'text-slate-300 dark:text-slate-600'}`}>
                                {managerTotal !== null ? managerTotal.toFixed(1) : '—'}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Trưởng phòng</div>
                            <div className={`text-xs font-bold mt-1 ${managerCfg ? managerCfg.color + ' ' + managerCfg.darkColor : 'text-slate-400'}`}>
                                {managerClassification ?? 'Chưa đánh giá'}
                            </div>
                        </div>
                    </div>

                    {/* Tab: Self / Manager */}
                    {(canManage || form.status === 'approved') && (
                        <div className="px-6 pb-2 flex gap-2">
                            <button onClick={() => setManagerMode(false)} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!managerMode ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                Tự đánh giá
                            </button>
                            <button onClick={() => setManagerMode(true)} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${managerMode ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                Trưởng phòng
                            </button>
                        </div>
                    )}

                    {/* Criteria list */}
                    <div className="px-6 pb-4 space-y-3">
                        {EVALUATION_CRITERIA.map((c) => {
                            if (managerMode) {
                                const mv = (form[c.managerKey] as number | null) ?? (form[c.key] as number);
                                return (
                                    <ScoreInput key={c.key} label={c.label} description={c.description}
                                        maxScore={c.maxScore} value={mv}
                                        onChange={v => updateManagerScore(c.managerKey, v)}
                                        disabled={!canReview}
                                        highlight={canReview}
                                    />
                                );
                            }
                            return (
                                <ScoreInput key={c.key} label={c.label} description={c.description}
                                    maxScore={c.maxScore} value={form[c.key] as number}
                                    onChange={v => updateSelfScore(c.key, v)}
                                    disabled={!canEdit}
                                    highlight={canEdit}
                                />
                            );
                        })}

                        {/* Notes */}
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                                {managerMode ? 'Nhận xét trưởng phòng' : 'Nhận xét cá nhân'}
                            </label>
                            <textarea
                                rows={3}
                                value={managerMode ? (form.manager_notes ?? '') : (form.self_notes ?? '')}
                                disabled={managerMode ? !canReview : !canEdit}
                                onChange={e => {
                                    if (managerMode) setForm(p => ({ ...p, manager_notes: e.target.value }));
                                    else setForm(p => ({ ...p, self_notes: e.target.value }));
                                }}
                                placeholder="Thêm nhận xét..."
                                className="w-full text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Reject note */}
                        {form.status === 'rejected' && form.manager_notes && (
                            <div className="flex gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">Lý do từ chối:</p>
                                    <p className="text-sm text-red-600 dark:text-red-300">{form.manager_notes}</p>
                                </div>
                            </div>
                        )}

                        {/* Reject input */}
                        {showRejectBox && (
                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 space-y-2">
                                <label className="text-sm font-semibold text-red-700 dark:text-red-400">Lý do từ chối *</label>
                                <textarea rows={3} value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                                    placeholder="Nhập lý do từ chối để nhân viên chỉnh sửa lại..."
                                    className="w-full text-sm bg-white dark:bg-slate-800 border border-red-200 dark:border-red-700 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-red-400 text-slate-700 dark:text-slate-300"
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => setShowRejectBox(false)} className="flex-1 py-2 text-sm font-medium text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50">Hủy</button>
                                    <button onClick={handleReject} disabled={!rejectNote.trim() || saving} className="flex-1 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors">
                                        {saving ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">{error}</div>
                        )}

                        {/* Review metadata */}
                        {form.reviewed_at && (
                            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                                <Calendar size={12} />
                                <span>Đã {form.status === 'approved' ? 'duyệt' : 'từ chối'} bởi <strong>{form.manager_name}</strong> · {new Date(form.reviewed_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Bar */}
                <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex gap-3 rounded-b-2xl">
                    {canEdit && !managerMode && (
                        <>
                            <button onClick={handleSaveDraft} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50">
                                <Pencil size={15} />
                                {saving ? 'Đang lưu...' : 'Lưu nháp'}
                            </button>
                            <button onClick={handleSubmit} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-primary-500/20">
                                <Send size={15} />
                                {saving ? 'Đang nộp...' : 'Nộp phiếu'}
                            </button>
                        </>
                    )}
                    {canReview && managerMode && !showRejectBox && (
                        <>
                            <button onClick={() => setShowRejectBox(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl transition-colors">
                                <XCircle size={15} />
                                Từ chối
                            </button>
                            <button onClick={handleApprove} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 size={15} />
                                {saving ? 'Đang duyệt...' : 'Phê duyệt'}
                            </button>
                        </>
                    )}
                    {!canEdit && !canReview && (
                        <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors">
                            Đóng
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EvaluationFormModal;
