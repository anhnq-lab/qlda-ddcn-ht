import React, { useState } from 'react';
import { X, CreditCard, FileText, Calendar, DollarSign, Building2, Hash, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatShortCurrency as formatCurrency } from '../../utils/format';
import { useContractors } from '../../hooks/useContractors';
import { PaymentType, PaymentStatus } from '../../types';
import { useContracts } from '../../hooks/useContracts';
import { useVariationOrders } from '../../hooks/useVariationOrders';
import { usePayments } from '../../hooks/usePayments';
import { PaymentFormSchema, type PaymentFormValues } from '../../schemas/payment.schema';

interface PaymentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payment: any) => void;
    contractId?: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ isOpen, onClose, onSubmit, contractId }) => {
    const { contracts } = useContracts();
    const { contractors } = useContractors();
    const { payments } = usePayments();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<PaymentFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(PaymentFormSchema) as any,
        defaultValues: {
            contractId: contractId || '',
            batchNo: 1,
            type: PaymentType.Advance,
            amount: 0,
            treasuryRef: '',
            note: '',
            formType: '03a',
        },
    });

    const watchContractId = watch('contractId');
    const watchAmount = watch('amount');
    const watchFormType = watch('formType');

    const selectedContract = contracts.find(c => c.ContractID === watchContractId);
    const contractor = selectedContract ? contractors.find(ct => ct.ContractorID === selectedContract.ContractorID) : null;

    const { variationOrders } = useVariationOrders(watchContractId);

    // Tính toán Remaining
    const sumVariationOrders = variationOrders.reduce((sum, vo) => sum + vo.AdjustedAmount, 0);
    const totalAdjustedValue = (selectedContract?.Value || 0) + sumVariationOrders;

    const relatedPayments = payments.filter(p => selectedContract && p.ContractID === selectedContract.ContractID);
    const totalPaid = relatedPayments
        .filter(p => p.Status === PaymentStatus.Transferred)
        .reduce((sum, p) => sum + p.Amount, 0);
    const remaining = totalAdjustedValue - totalPaid;

    const onFormSubmit = handleSubmit(async (data) => {
        if (data.amount > remaining) return; // extra guard

        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        const newPayment = {
            PaymentID: Date.now(),
            ContractID: data.contractId,
            BatchNo: data.batchNo,
            Type: data.type,
            Amount: data.amount,
            TreasuryRef: data.treasuryRef,
            Status: PaymentStatus.Pending
        };

        onSubmit(newPayment);
        setIsSubmitting(false);
        setShowSuccess(true);

        setTimeout(() => {
            setShowSuccess(false);
            onClose();
        }, 2000);
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-sm overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 text-white flex items-center justify-between bg-primary-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Tạo phiếu thanh toán</h2>
                            <p className="text-emerald-100 text-xs">Biểu mẫu kho bạc Nhà nước</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {showSuccess ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-2">Tạo phiếu thành công!</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Phiếu thanh toán đã được gửi để chờ duyệt</p>
                    </div>
                ) : (
                    <form onSubmit={onFormSubmit} className="p-4 space-y-5">
                        {/* Contract Selection */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                                <Building2 className="w-3.5 h-3.5 inline mr-1" />
                                Hợp đồng
                            </label>
                            <select
                                {...register('contractId')}
                                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-bg-surface text-txt-primary ${errors.contractId ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-border'
                                    }`}
                            >
                                <option value="">-- Chọn hợp đồng --</option>
                                {contracts.map(c => {
                                    const ct = contractors.find(x => x.ContractorID === c.ContractorID);
                                    return (
                                        <option key={c.ContractID} value={c.ContractID}>
                                            {c.ContractID} - {ct?.FullName || 'Nhà thầu'} ({formatCurrency(c.Value)})
                                        </option>
                                    );
                                })}
                            </select>
                            {errors.contractId && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.contractId.message}</p>}
                        </div>

                        {/* Contract Info */}
                        {selectedContract && (
                            <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 border border-gray-200 dark:border-slate-600 space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500 dark:text-slate-400">Nhà thầu:</span>
                                        <p className="font-medium text-gray-800 dark:text-slate-100">{contractor?.FullName}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-slate-400">Giá trị HĐ (sau phụ lục):</span>
                                        <p className="font-bold text-emerald-600">{formatCurrency(totalAdjustedValue)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-slate-400">Tỷ lệ tạm ứng:</span>
                                        <p className="font-medium text-gray-800 dark:text-slate-100">{selectedContract.AdvanceRate}%</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-slate-400">Còn lại thanh toán:</span>
                                        <p className="font-bold text-warning-600">{formatCurrency(remaining)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Batch Number */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    <Hash className="w-3.5 h-3.5 inline mr-1" />
                                    Đợt thanh toán
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    {...register('batchNo', { valueAsNumber: true })}
                                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-bg-surface text-txt-primary"
                                />
                            </div>

                            {/* Payment Type */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    <FileText className="w-3.5 h-3.5 inline mr-1" />
                                    Loại thanh toán
                                </label>
                                <select
                                    {...register('type')}
                                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-bg-surface text-txt-primary"
                                >
                                    <option value={PaymentType.Advance}>Tạm ứng</option>
                                    <option value={PaymentType.Volume}>Thanh toán khối lượng</option>
                                </select>
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                                <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                                Số tiền đề nghị thanh toán (VNĐ)
                            </label>
                            <input
                                type="number"
                                {...register('amount', { valueAsNumber: true })}
                                placeholder="0"
                                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg font-bold bg-bg-surface text-txt-primary ${errors.amount ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-border'
                                    }`}
                            />
                            {(watchAmount ?? 0) > 0 && (
                                <p className="text-xs text-emerald-600 mt-1 font-medium">
                                    = {formatCurrency(watchAmount ?? 0)}
                                </p>
                            )}
                            {errors.amount && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.amount.message}</p>}
                        </div>

                        {/* Treasury Reference */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    Mã giao dịch Kho bạc
                                </label>
                                <input
                                    type="text"
                                    {...register('treasuryRef')}
                                    placeholder="VD: KB-2025-001234"
                                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono bg-bg-surface text-txt-primary ${errors.treasuryRef ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-border'
                                        }`}
                                />
                                {errors.treasuryRef && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.treasuryRef.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    Biểu mẫu Kho bạc
                                </label>
                                <div className="flex gap-3">
                                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all ${watchFormType === '03a' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'border-gray-200 dark:border-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                                        }`}>
                                        <input
                                            type="radio"
                                            value="03a"
                                            {...register('formType')}
                                            className="sr-only"
                                        />
                                        <span className="text-sm font-bold">Mẫu 03a</span>
                                    </label>
                                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all ${watchFormType === '04a' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'border-gray-200 dark:border-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                                        }`}>
                                        <input
                                            type="radio"
                                            value="04a"
                                            {...register('formType')}
                                            className="sr-only"
                                        />
                                        <span className="text-sm font-bold">Mẫu 04a</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Note */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Ghi chú
                            </label>
                            <textarea
                                {...register('note')}
                                placeholder="Nhập nội dung ghi chú (nếu có)"
                                rows={2}
                                className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-bg-surface text-txt-primary placeholder-gray-400 dark:placeholder-slate-500"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4" />
                                        Tạo phiếu thanh toán
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PaymentForm;

