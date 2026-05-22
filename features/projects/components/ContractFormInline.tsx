import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Save, Loader2, FileSignature, Calendar, Banknote,
    Percent, Shield, X, Building2, Hash, FileText, Clock
} from 'lucide-react';
import { Contract, ContractStatus, BiddingPackage } from '../../../types';
import { ContractService } from '../../../services/ContractService';
import { formatCurrency } from '../../../utils/format';

// ========================================
// CONTRACT FORM INLINE
// Form tạo/sửa hợp đồng ngay trong chi tiết gói thầu
// ========================================

interface ContractFormInlineProps {
    packageData: BiddingPackage;
    contractorName?: string;
    existingContract?: Contract | null;
    onSaved?: () => void;
    onCancel?: () => void;
}

interface FormData {
    contractId: string;
    contractName: string;
    signDate: string;
    value: string;
    advanceRate: string;
    warranty: string;
    scope: string;
    durationMonths: string;
    startDate: string;
    endDate: string;
    paymentTerms: string;
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
    'LumpSum': 'Trọn gói',
    'UnitPrice': 'Đơn giá cố định',
    'AdjustableUnitPrice': 'Đơn giá điều chỉnh',
    'TimeBased': 'Theo thời gian',
    'Percentage': 'Theo tỷ lệ phần trăm',
    'Mixed': 'Hỗn hợp',
};

export const ContractFormInline: React.FC<ContractFormInlineProps> = ({
    packageData: pkg,
    contractorName,
    existingContract,
    onSaved,
    onCancel,
}) => {
    const queryClient = useQueryClient();
    const isEditing = !!existingContract;

    const getOneDayAfter = (dateStr?: string | null): string => {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
            d.setDate(d.getDate() + 1);
            return d.toISOString().split('T')[0];
        } catch {
            return new Date().toISOString().split('T')[0];
        }
    };

    const defaultDate = getOneDayAfter(pkg.ApprovalDate_Result || pkg.DecisionDate);

    const [form, setForm] = useState<FormData>({
        contractId: existingContract?.ContractID || '',
        contractName: existingContract?.ContractName || pkg.PackageName || '',
        signDate: existingContract?.SignDate || defaultDate,
        value: existingContract ? String(existingContract.Value) : String(pkg.WinningPrice || pkg.Price || 0),
        advanceRate: existingContract ? String(existingContract.AdvanceRate) : '15',
        warranty: existingContract ? String(existingContract.Warranty) : (pkg.Field === 'Construction' ? '24' : '12'),
        scope: existingContract?.Scope || '',
        durationMonths: existingContract?.DurationMonths ? String(existingContract.DurationMonths) : '',
        startDate: existingContract?.StartDate || defaultDate,
        endDate: existingContract?.EndDate || '',
        paymentTerms: existingContract?.PaymentTerms || '',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        if (!form.contractId.trim()) newErrors.contractId = 'Vui lòng nhập số hợp đồng';
        if (!form.signDate) newErrors.signDate = 'Vui lòng chọn ngày ký';
        if (!form.value || Number(form.value) <= 0) newErrors.value = 'Giá trị phải > 0';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveMutation = useMutation({
        mutationFn: async (data: Partial<Contract>) => {
            if (isEditing) {
                return ContractService.update(existingContract!.ContractID, data);
            } else {
                return ContractService.create(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['project-packages'] });
            onSaved?.();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const data: Partial<Contract> = {
            ContractID: form.contractId,
            PackageID: pkg.PackageID,
            ContractorID: pkg.WinningContractorID || '',
            ProjectID: pkg.ProjectID,
            ContractName: form.contractName,
            SignDate: form.signDate,
            Value: Number(form.value),
            AdvanceRate: Number(form.advanceRate) || 0,
            Warranty: Number(form.warranty) || 12,
            Status: ContractStatus.Executing,
            Scope: form.scope,
            DurationMonths: Number(form.durationMonths) || 0,
            StartDate: form.startDate,
            EndDate: form.endDate,
            PaymentTerms: form.paymentTerms,
        };

        saveMutation.mutate(data);
    };

    const handleChange = (field: keyof FormData, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const inputClass = (field: keyof FormData) =>
        `w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-lg outline-none transition-colors
        ${errors[field]
            ? 'border-red-300 dark:border-red-600 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
            : 'border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
        } text-gray-800 dark:text-slate-200`;

    const labelClass = "block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    {isEditing ? 'Chỉnh sửa hợp đồng' : 'Tạo hợp đồng mới'}
                </h4>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Auto-filled info */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm space-y-1.5">
                <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-600 dark:text-slate-400">Nhà thầu:</span>
                    <span className="font-medium text-gray-800 dark:text-slate-200">{contractorName || pkg.WinningContractorID || 'Chưa chọn'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Banknote className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-600 dark:text-slate-400">Giá trúng thầu:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(pkg.WinningPrice || 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-gray-600 dark:text-slate-400">Loại HĐ:</span>
                    <span className="font-medium text-gray-800 dark:text-slate-200">{CONTRACT_TYPE_LABELS[pkg.ContractType] || pkg.ContractType}</span>
                </div>
            </div>

            {/* Form fields - Row 1 */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={labelClass}>
                        <Hash className="w-3 h-3 inline mr-1" />Số hợp đồng <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.contractId}
                        onChange={e => handleChange('contractId', e.target.value)}
                        placeholder="VD: HD-2026/01-TV"
                        className={inputClass('contractId')}
                        disabled={isEditing}
                    />
                    {errors.contractId && <p className="text-xs text-red-500 mt-0.5">{errors.contractId}</p>}
                </div>
                <div>
                    <label className={labelClass}>
                        <Calendar className="w-3 h-3 inline mr-1" />Ngày ký <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={form.signDate}
                        onChange={e => handleChange('signDate', e.target.value)}
                        className={inputClass('signDate')}
                    />
                    {errors.signDate && <p className="text-xs text-red-500 mt-0.5">{errors.signDate}</p>}
                </div>
            </div>

            {/* Contract Name */}
            <div>
                <label className={labelClass}>Tên hợp đồng</label>
                <input
                    type="text"
                    value={form.contractName}
                    onChange={e => handleChange('contractName', e.target.value)}
                    placeholder="Tên hợp đồng..."
                    className={inputClass('contractName')}
                />
            </div>

            {/* Row 2: Value + Advance */}
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className={labelClass}>
                        <Banknote className="w-3 h-3 inline mr-1" />Giá trị HĐ (VND) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={form.value}
                        onChange={e => handleChange('value', e.target.value)}
                        placeholder="0"
                        className={inputClass('value')}
                    />
                    {errors.value && <p className="text-xs text-red-500 mt-0.5">{errors.value}</p>}
                </div>
                <div>
                    <label className={labelClass}>
                        <Percent className="w-3 h-3 inline mr-1" />Tỷ lệ tạm ứng (%)
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={form.advanceRate}
                        onChange={e => handleChange('advanceRate', e.target.value)}
                        placeholder="15"
                        className={inputClass('advanceRate')}
                    />
                </div>
                <div>
                    <label className={labelClass}>
                        <Shield className="w-3 h-3 inline mr-1" />Bảo hành (tháng)
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={form.warranty}
                        onChange={e => handleChange('warranty', e.target.value)}
                        placeholder="12"
                        className={inputClass('warranty')}
                    />
                </div>
            </div>

            {/* Row 3: Duration + Start/End */}
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className={labelClass}>
                        <Clock className="w-3 h-3 inline mr-1" />Thời gian TH (tháng)
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={form.durationMonths}
                        onChange={e => handleChange('durationMonths', e.target.value)}
                        placeholder="6"
                        className={inputClass('durationMonths')}
                    />
                </div>
                <div>
                    <label className={labelClass}>Ngày bắt đầu</label>
                    <input
                        type="date"
                        value={form.startDate}
                        onChange={e => handleChange('startDate', e.target.value)}
                        className={inputClass('startDate')}
                    />
                </div>
                <div>
                    <label className={labelClass}>Ngày kết thúc</label>
                    <input
                        type="date"
                        value={form.endDate}
                        onChange={e => handleChange('endDate', e.target.value)}
                        className={inputClass('endDate')}
                    />
                </div>
            </div>

            {/* Scope */}
            <div>
                <label className={labelClass}>Phạm vi công việc</label>
                <textarea
                    value={form.scope}
                    onChange={e => handleChange('scope', e.target.value)}
                    placeholder="Mô tả phạm vi công việc hợp đồng..."
                    rows={2}
                    className={`${inputClass('scope')} resize-none`}
                />
            </div>

            {/* Payment terms */}
            <div>
                <label className={labelClass}>Điều kiện thanh toán</label>
                <textarea
                    value={form.paymentTerms}
                    onChange={e => handleChange('paymentTerms', e.target.value)}
                    placeholder="VD: Tạm ứng 15% sau ký HĐ, thanh toán theo khối lượng..."
                    rows={2}
                    className={`${inputClass('paymentTerms')} resize-none`}
                />
            </div>

            {/* Error message */}
            {saveMutation.isError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
                    Lỗi: {(saveMutation.error as Error)?.message || 'Không thể lưu hợp đồng'}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                )}
                <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                    {saveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {isEditing ? 'Cập nhật' : 'Tạo hợp đồng'}
                </button>
            </div>
        </form>
    );
};

export default ContractFormInline;
