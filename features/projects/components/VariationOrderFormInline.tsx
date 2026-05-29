import React, { useState } from 'react';
import { VariationOrder } from '../../../types';
import { formatCurrency } from '../../../utils/format';
import { Save, X, Plus, Trash2, Receipt, CalendarDays, FileText, TrendingUp } from 'lucide-react';

// ================================================
// VARIATION ORDER FORM INLINE
// Tạo / chỉnh sửa phụ lục điều chỉnh hợp đồng
// ================================================

interface VariationOrderFormInlineProps {
    contractId: string;
    /** Nếu có thì ở chế độ sửa, không có thì tạo mới */
    existing?: VariationOrder;
    /** Giá trị hợp đồng gốc — để hiển thị giá trị sau điều chỉnh */
    baseContractValue?: number;
    /** Tổng điều chỉnh hiện tại (không kể phụ lục đang sửa) */
    currentAdjustedTotal?: number;
    onSaved: (vo: Partial<VariationOrder>) => void;
    onCancel: () => void;
    isSaving?: boolean;
}

export const VariationOrderFormInline: React.FC<VariationOrderFormInlineProps> = ({
    contractId,
    existing,
    baseContractValue = 0,
    currentAdjustedTotal = 0,
    onSaved,
    onCancel,
    isSaving = false,
}) => {
    const [form, setForm] = useState<Partial<VariationOrder>>({
        ContractID: contractId,
        VOID: existing?.VOID,
        Number: existing?.Number || '',
        SignDate: existing?.SignDate || '',
        Content: existing?.Content || '',
        AdjustedAmount: existing?.AdjustedAmount ?? 0,
        AdjustedDuration: existing?.AdjustedDuration ?? 0,
        ApprovalFile: existing?.ApprovalFile || '',
    });

    const [amountInput, setAmountInput] = useState<string>(
        existing?.AdjustedAmount !== undefined ? String(existing.AdjustedAmount) : '0'
    );

    const set = (field: keyof VariationOrder, value: any) =>
        setForm(f => ({ ...f, [field]: value }));

    const handleAmountChange = (raw: string) => {
        setAmountInput(raw);
        const parsed = parseInt(raw.replace(/[^0-9-]/g, ''), 10);
        if (!isNaN(parsed)) set('AdjustedAmount', parsed);
    };

    const newContractValue = baseContractValue + currentAdjustedTotal + (form.AdjustedAmount ?? 0);
    const adjustmentColor = (form.AdjustedAmount ?? 0) >= 0
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.Number?.trim()) return;
        onSaved(form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Preview giá trị sau điều chỉnh */}
            {baseContractValue > 0 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-sm">
                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="flex gap-4 flex-wrap">
                        <span className="text-txt-muted">
                            HĐ gốc: <span className="font-medium text-txt-secondary">{formatCurrency(baseContractValue)}</span>
                        </span>
                        <span className={adjustmentColor}>
                            Điều chỉnh: <span className="font-bold">{(form.AdjustedAmount ?? 0) >= 0 ? '+' : ''}{formatCurrency(form.AdjustedAmount ?? 0)}</span>
                        </span>
                        <span className="text-blue-700 dark:text-blue-300 font-semibold">
                            → Sau ĐC: {formatCurrency(newContractValue)}
                        </span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Số phụ lục */}
                <div>
                    <label className="block text-xs font-medium text-txt-muted mb-1">
                        <Receipt className="w-3.5 h-3.5 inline mr-1" />
                        Số phụ lục <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.Number}
                        onChange={e => set('Number', e.target.value)}
                        placeholder="VD: PL-01/HĐ..."
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-bg-surface text-txt-primary focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors font-mono"
                    />
                </div>

                {/* Ngày ký */}
                <div>
                    <label className="block text-xs font-medium text-txt-muted mb-1">
                        <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
                        Ngày ký phụ lục
                    </label>
                    <input
                        type="date"
                        value={form.SignDate}
                        onChange={e => set('SignDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-bg-surface text-txt-primary focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                    />
                </div>

                {/* Điều chỉnh giá trị */}
                <div>
                    <label className="block text-xs font-medium text-txt-muted mb-1">
                        Giá trị điều chỉnh (VNĐ)
                        <span className="ml-1 text-txt-placeholder font-normal">(âm = giảm)</span>
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={amountInput}
                        onChange={e => handleAmountChange(e.target.value)}
                        placeholder="VD: 50000000 hoặc -20000000"
                        className={`w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-bg-surface focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors font-mono ${adjustmentColor}`}
                    />
                </div>

                {/* Điều chỉnh thời gian */}
                <div>
                    <label className="block text-xs font-medium text-txt-muted mb-1">
                        Điều chỉnh thời gian (ngày)
                        <span className="ml-1 text-txt-placeholder font-normal">(âm = rút ngắn)</span>
                    </label>
                    <input
                        type="number"
                        value={form.AdjustedDuration ?? 0}
                        onChange={e => set('AdjustedDuration', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-bg-surface text-txt-primary focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Nội dung / lý do */}
            <div>
                <label className="block text-xs font-medium text-txt-muted mb-1">
                    <FileText className="w-3.5 h-3.5 inline mr-1" />
                    Nội dung / Lý do điều chỉnh
                </label>
                <textarea
                    rows={3}
                    value={form.Content}
                    onChange={e => set('Content', e.target.value)}
                    placeholder="Mô tả lý do điều chỉnh hợp đồng..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-bg-surface text-txt-primary focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors resize-none"
                />
            </div>

            {/* File đính kèm QĐ */}
            <div>
                <label className="block text-xs font-medium text-txt-muted mb-1">
                    Link file QĐ phê duyệt phụ lục (tùy chọn)
                </label>
                <input
                    type="url"
                    value={form.ApprovalFile}
                    onChange={e => set('ApprovalFile', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-bg-surface text-txt-primary focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-txt-muted hover:bg-bg-muted rounded-lg transition-colors disabled:opacity-50"
                >
                    <X className="w-4 h-4" /> Hủy
                </button>
                <button
                    type="submit"
                    disabled={isSaving || !form.Number?.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Đang lưu...' : (existing ? 'Cập nhật' : 'Tạo phụ lục')}
                </button>
            </div>
        </form>
    );
};

export default VariationOrderFormInline;
