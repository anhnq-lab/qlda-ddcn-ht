import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Save, Loader2, DollarSign, Calendar, FileText,
    X, CreditCard, Hash
} from 'lucide-react';
import { Payment, PaymentType, PaymentStatus } from '../../../types';
import { PaymentService } from '../../../services/PaymentService';
import { formatCurrency } from '../../../utils/format';

// ========================================
// PAYMENT FORM INLINE
// Form thêm đợt thanh toán trong Tab 4
// ========================================

interface PaymentFormInlineProps {
    contractId: string;
    projectId: string;
    contractValue: number;
    totalPaid: number;
    onSaved?: () => void;
    onCancel?: () => void;
}

interface FormData {
    type: PaymentType;
    amount: string;
    description: string;
    requestDate: string;
    treasuryRef: string;
}

export const PaymentFormInline: React.FC<PaymentFormInlineProps> = ({
    contractId,
    projectId,
    contractValue,
    totalPaid,
    onSaved,
    onCancel,
}) => {
    const queryClient = useQueryClient();
    const remaining = contractValue - totalPaid;

    const [form, setForm] = useState<FormData>({
        type: PaymentType.Volume,
        amount: '',
        description: '',
        requestDate: new Date().toISOString().split('T')[0],
        treasuryRef: '',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        if (!form.amount || Number(form.amount) <= 0) newErrors.amount = 'Số tiền phải > 0';
        if (Number(form.amount) > remaining) newErrors.amount = `Số tiền vượt quá còn lại (${formatCurrency(remaining)})`;
        if (!form.requestDate) newErrors.requestDate = 'Chọn ngày đề nghị';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveMutation = useMutation({
        mutationFn: (data: Partial<Payment>) => PaymentService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            onSaved?.();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        saveMutation.mutate({
            ContractID: contractId,
            ProjectID: projectId,
            Type: form.type,
            Amount: Number(form.amount),
            Description: form.description,
            RequestDate: form.requestDate,
            TreasuryRef: form.treasuryRef,
            Status: PaymentStatus.Draft,
        });
    };

    const handleChange = (field: keyof FormData, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const inputClass = (field: keyof FormData) =>
        `w-full px-3 py-2 text-sm bg-bg-surface border rounded-lg outline-none transition-colors
        ${errors[field]
            ? 'border-red-300 dark:border-red-600 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
            : 'border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
        } text-gray-800 dark:text-slate-200`;

    const labelClass = "block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                    Thêm đợt thanh toán
                </h4>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Info bar */}
            <div className="flex items-center gap-4 text-sm bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <span className="text-gray-500 dark:text-slate-400">Giá trị HĐ:</span>
                <span className="font-medium">{formatCurrency(contractValue)}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500 dark:text-slate-400">Đã TT:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500 dark:text-slate-400">Còn lại:</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">{formatCurrency(remaining)}</span>
            </div>

            {/* Row 1: Type + Amount */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={labelClass}>
                        <CreditCard className="w-3 h-3 inline mr-1" />Loại thanh toán
                    </label>
                    <select
                        value={form.type}
                        onChange={e => handleChange('type', e.target.value)}
                        className={inputClass('type')}
                    >
                        <option value={PaymentType.Advance}>Tạm ứng</option>
                        <option value={PaymentType.Volume}>Thanh toán khối lượng</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>
                        <DollarSign className="w-3 h-3 inline mr-1" />Số tiền (VND) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={form.amount}
                        onChange={e => handleChange('amount', e.target.value)}
                        placeholder="0"
                        className={inputClass('amount')}
                    />
                    {errors.amount && <p className="text-xs text-red-500 mt-0.5">{errors.amount}</p>}
                </div>
            </div>

            {/* Row 2: Date + Treasury Ref */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={labelClass}>
                        <Calendar className="w-3 h-3 inline mr-1" />Ngày đề nghị <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={form.requestDate}
                        onChange={e => handleChange('requestDate', e.target.value)}
                        className={inputClass('requestDate')}
                    />
                    {errors.requestDate && <p className="text-xs text-red-500 mt-0.5">{errors.requestDate}</p>}
                </div>
                <div>
                    <label className={labelClass}>
                        <Hash className="w-3 h-3 inline mr-1" />Mã kho bạc
                    </label>
                    <input
                        type="text"
                        value={form.treasuryRef}
                        onChange={e => handleChange('treasuryRef', e.target.value)}
                        placeholder="Mã giao dịch KB..."
                        className={inputClass('treasuryRef')}
                    />
                </div>
            </div>

            {/* Description */}
            <div>
                <label className={labelClass}>
                    <FileText className="w-3 h-3 inline mr-1" />Nội dung
                </label>
                <input
                    type="text"
                    value={form.description}
                    onChange={e => handleChange('description', e.target.value)}
                    placeholder="VD: Thanh toán đợt 1 - khối lượng hoàn thành..."
                    className={inputClass('description')}
                />
            </div>

            {/* Error */}
            {saveMutation.isError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
                    Lỗi: {(saveMutation.error as Error)?.message || 'Không thể lưu'}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                {onCancel && (
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        Hủy
                    </button>
                )}
                <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Thêm thanh toán
                </button>
            </div>
        </form>
    );
};

export default PaymentFormInline;
