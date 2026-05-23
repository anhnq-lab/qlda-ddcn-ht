import React, { useState, useEffect } from 'react';
import { CapitalPlan } from '../../../types';
import { X, Landmark, Save } from 'lucide-react';
import { LegalReferenceLink } from '../../../components/common/LegalReferenceLink';
import { SOURCE_OPTIONS, normalizeSource } from '../../../utils/capitalConstants';

interface CapitalPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<CapitalPlan, 'PlanID'>) => void;
    editingPlan?: CapitalPlan | null;
    projectID: string;
    isSaving?: boolean;
    planType?: 'mid_term' | 'annual';
    totalInvestment?: number;
    maxAllowable?: number;
}

export const CapitalPlanModal: React.FC<CapitalPlanModalProps> = ({
    isOpen, onClose, onSave, editingPlan, projectID, isSaving, planType = 'annual',
    totalInvestment = 0, maxAllowable = Infinity
}) => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [periodStart, setPeriodStart] = useState(new Date().getFullYear());
    const [periodEnd, setPeriodEnd] = useState(new Date().getFullYear() + 4);
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('NganSachTrungUong');
    const [decisionNumber, setDecisionNumber] = useState('');
    const [dateAssigned, setDateAssigned] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (editingPlan) {
            setYear(editingPlan.Year || new Date().getFullYear());
            setPeriodStart(editingPlan.PeriodStart || new Date().getFullYear());
            setPeriodEnd(editingPlan.PeriodEnd || new Date().getFullYear() + 4);
            setAmount(String(editingPlan.Amount || ''));
            // Normalize source từ DB sang canonical key (NSTW/NSĐP/ODA/Khác)
            setSource(normalizeSource(editingPlan.Source || 'NSĐP'));
            setDecisionNumber(editingPlan.DecisionNumber || '');
            setDateAssigned(editingPlan.DateAssigned || '');
            setNotes(editingPlan.Notes || '');
        } else {
            setYear(new Date().getFullYear());
            setPeriodStart(new Date().getFullYear());
            setPeriodEnd(new Date().getFullYear() + 4);
            setAmount('');
            setSource('NSTW');
            setDecisionNumber('');
            setDateAssigned('');
            setNotes('');
        }
    }, [editingPlan, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return;
        
        const isMidTerm = editingPlan ? editingPlan.PlanType === 'mid_term' : planType === 'mid_term';
        
        onSave({
            ProjectID: projectID,
            Year: isMidTerm ? periodStart : year,
            Amount: Number(amount),
            Source: source,
            DecisionNumber: decisionNumber || undefined,
            DateAssigned: dateAssigned || undefined,
            DisbursedAmount: editingPlan?.DisbursedAmount || 0,
            Status: editingPlan?.Status || 'Approved',
            PlanType: isMidTerm ? 'mid_term' : 'annual',
            PeriodStart: isMidTerm ? periodStart : undefined,
            PeriodEnd: isMidTerm ? periodEnd : undefined,
            Notes: notes || undefined,
        });
    };

    const isEdit = !!editingPlan;
    const isMidTermUI = editingPlan ? editingPlan.PlanType === 'mid_term' : planType === 'mid_term';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-bg-surface rounded-2xl shadow-sm w-full max-w-lg mx-4 border border-border animate-in fade-in zoom-in-95"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <Landmark className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-txt-primary">
                                {isEdit ? 'Sửa kế hoạch vốn' : (isMidTermUI ? 'Nhập kế hoạch trung hạn' : 'Nhập kế hoạch hằng năm')}
                            </h2>
                            <p className="text-xs text-txt-muted"><LegalReferenceLink text="Luật ĐTC 58/2024/QH15" /></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-bg-muted text-txt-muted hover:text-txt-primary rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Giai đoạn / Năm */}
                        {isMidTermUI ? (
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
                                        Từ năm <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={periodStart}
                                        onChange={e => setPeriodStart(Number(e.target.value))}
                                        min={2000} max={2050}
                                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg-surface text-txt-primary text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
                                        Đến năm <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={periodEnd}
                                        onChange={e => setPeriodEnd(Number(e.target.value))}
                                        min={periodStart} max={2050}
                                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg-surface text-txt-primary text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
                                    Năm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={year}
                                    onChange={e => setYear(Number(e.target.value))}
                                    min={2020} max={2035}
                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg-surface text-txt-primary text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        )}

                        {/* Nguồn vốn */}
                        <div>
                            <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
                                Nguồn vốn <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={source}
                                onChange={e => setSource(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg-surface text-txt-primary text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                            >
                                {SOURCE_OPTIONS.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Số tiền */}
                    <div>
                        <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
                            Vốn giao (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={amount ? Number(amount).toLocaleString('vi-VN') : ''}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setAmount(val);
                            }}
                            placeholder="Nhập số tiền..."
                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg-surface text-txt-primary text-sm font-mono focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                            required
                        />
                        {(() => {
                            const numAmount = Number(amount) || 0;
                            const isOverMax = maxAllowable < Infinity && numAmount > maxAllowable;
                            const isMidTermOver = isMidTermUI && totalInvestment > 0 && numAmount > totalInvestment;
                            if (isMidTermOver) return (
                                <p className="mt-1.5 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/50">
                                    ⚠️ Vượt Tổng mức đầu tư ({Number(totalInvestment).toLocaleString('vi-VN')} đ)
                                </p>
                            );
                            if (isOverMax) return (
                                <p className="mt-1.5 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/50">
                                    ⚠️ Vượt hạn mức cho phép ({Number(maxAllowable).toLocaleString('vi-VN')} đ). Còn lại: {Number(maxAllowable).toLocaleString('vi-VN')} đ
                                </p>
                            );
                            if (numAmount > 0 && maxAllowable < Infinity) return (
                                <p className="mt-1 text-[10px] text-gray-400 dark:text-slate-400">Hạn mức còn lại: {Number(maxAllowable).toLocaleString('vi-VN')} đ</p>
                            );
                            return null;
                        })()}
                    </div>

                    {/* Quyết định */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
                                Số QĐ giao vốn
                            </label>
                            <input
                                type="text"
                                value={decisionNumber}
                                onChange={e => setDecisionNumber(e.target.value)}
                                placeholder="VD: 123/QĐ-UBND"
                                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg-surface text-txt-primary text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
                                Ngày giao
                            </label>
                            <input
                                type="date"
                                value={dateAssigned}
                                onChange={e => setDateAssigned(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg-surface text-txt-primary text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Ghi chú */}
                    <div>
                        <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
                            Ghi chú / Thuyết minh
                        </label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Nhập ghi chú hoặc lý do điều chỉnh..."
                            rows={2}
                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg-surface text-txt-primary text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-medium text-txt-secondary bg-bg-muted rounded-xl hover:bg-bg-muted/80 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || !amount || ((Number(amount) || 0) > maxAllowable) || (isMidTermUI && totalInvestment > 0 && (Number(amount) || 0) > totalInvestment)}
                            className="px-5 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Bổ sung'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
