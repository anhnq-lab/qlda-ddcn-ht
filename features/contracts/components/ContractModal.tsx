import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Save, Loader2, FileSignature, Calendar, Banknote,
    Percent, Shield, X, Hash, Clock, AlertTriangle
} from 'lucide-react';
import { Contract, ContractStatus, BiddingPackage } from '../../../types';
import { ContractService } from '../../../services/ContractService';
import { formatCurrency } from '../../../utils/format';
import { useProjects } from '../../../hooks/useProjects';
import { useAllBiddingPackages } from '../../../hooks/useAllBiddingPackages';
import { useContractors } from '../../../hooks/useContractors';
import { ContractFormSchema, type ContractFormInput } from '../../../schemas/contract.schema';

interface ContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingContract?: Contract | null;
    initialPackageId?: string;
    onSaved?: (contract: Contract) => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({
    isOpen,
    onClose,
    existingContract,
    initialPackageId,
    onSaved
}) => {
    const queryClient = useQueryClient();
    const isEditing = !!existingContract;

    const { projects } = useProjects();
    const { biddingPackages } = useAllBiddingPackages();
    const { contractors } = useContractors();

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

    const buildDefaultValues = (): ContractFormInput => {
        const pkg = initialPackageId ? biddingPackages.find(p => p.PackageID === initialPackageId) : null;
        const defaultDate = pkg 
            ? getOneDayAfter(pkg.ApprovalDate_Result || pkg.DecisionDate)
            : new Date().toISOString().split('T')[0];

        return {
            projectId: existingContract?.ProjectID || '',
            packageId: existingContract?.PackageID || initialPackageId || '',
            contractorId: existingContract?.ContractorID || '',
            contractId: existingContract?.ContractID || (isEditing ? '' : `HD-${Date.now()}`),
            contractName: existingContract?.ContractName || '',
            signDate: existingContract?.SignDate || defaultDate,
            value: existingContract ? String(existingContract.Value) : '',
            advanceRate: existingContract ? String(existingContract.AdvanceRate) : '15',
            warranty: existingContract ? String(existingContract.Warranty) : '12',
            scope: existingContract?.Scope || '',
            durationMonths: existingContract?.DurationMonths ? String(existingContract.DurationMonths) : '',
            startDate: existingContract?.StartDate || (existingContract ? '' : defaultDate),
            endDate: existingContract?.EndDate || '',
            paymentTerms: existingContract?.PaymentTerms || '',
        };
    };

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<ContractFormInput>({
        resolver: zodResolver(ContractFormSchema),
        defaultValues: buildDefaultValues(),
    });

    const watchedProjectId = watch('projectId');
    const watchedPackageId = watch('packageId');
    const watchedValue = watch('value');

    // When modal opens/changes existingContract, reset form
    useEffect(() => {
        if (isOpen) {
            reset(buildDefaultValues());
            // If creating and we have initialPackageId, apply package data
            if (!isEditing && initialPackageId) {
                const pkg = biddingPackages.find(p => p.PackageID === initialPackageId);
                if (pkg) {
                    applyPackageData(initialPackageId, pkg);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, existingContract, initialPackageId, biddingPackages, isEditing]);

    const applyPackageData = (pkgId: string, pkg: BiddingPackage) => {
        setValue('packageId', pkgId);
        setValue('projectId', pkg.ProjectID);
        setValue('contractorId', pkg.WinningContractorID || '');
        setValue('contractName', pkg.PackageName || '');
        setValue('value', String(pkg.WinningPrice || pkg.Price || 0));
        setValue('warranty', pkg.Field === 'Construction' ? '24' : '12');

        const pkgApprovalDate = pkg.ApprovalDate_Result || pkg.DecisionDate;
        const oneDayAfter = getOneDayAfter(pkgApprovalDate);
        setValue('signDate', oneDayAfter);
        setValue('startDate', oneDayAfter);
    };

    const handlePackageChange = (pkgId: string) => {
        const pkg = biddingPackages.find(p => p.PackageID === pkgId);
        if (pkg) {
            applyPackageData(pkgId, pkg);
        } else {
            setValue('packageId', pkgId);
        }
    };

    const saveMutation = useMutation({
        mutationFn: async (data: Partial<Contract>) => {
            if (isEditing) {
                return ContractService.update(existingContract!.ContractID, data);
            } else {
                return ContractService.create(data);
            }
        },
        onSuccess: (savedData) => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['project-packages'] });
            onSaved?.(savedData);
            onClose();
        },
    });

    const onSubmit = handleSubmit(async (data) => {
        const contractData: Partial<Contract> = {
            ContractID: data.contractId,
            PackageID: data.packageId,
            ContractorID: data.contractorId,
            ProjectID: data.projectId,
            ContractName: data.contractName,
            SignDate: data.signDate,
            Value: Number(data.value),
            AdvanceRate: Number(data.advanceRate) || 0,
            Warranty: Number(data.warranty) || 12,
            Status: ContractStatus.Executing,
            Scope: data.scope,
            DurationMonths: Number(data.durationMonths) || 0,
            StartDate: data.startDate,
            EndDate: data.endDate,
            PaymentTerms: data.paymentTerms,
        };

        saveMutation.mutate(contractData);
    });

    const inputClass = (hasError: boolean) =>
        `w-full px-3 py-2 text-sm bg-bg-surface border rounded-lg outline-none transition-colors
        ${hasError
            ? 'border-red-300 dark:border-red-600 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
            : 'border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
        } text-txt-primary`;

    const labelClass = "block text-xs font-medium text-txt-muted mb-1";

    if (!isOpen) return null;

    // Derived values for display
    const selectedPackage = biddingPackages.find(p => p.PackageID === watchedPackageId);

    // Filter packages by selected project
    const availablePackages = watchedProjectId
        ? biddingPackages.filter(p => p.ProjectID === watchedProjectId)
        : biddingPackages;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 dark:bg-slate-900 backdrop-blur-sm overflow-hidden p-4">
            <div className="bg-bg-surface w-full max-w-2xl rounded-2xl shadow-sm flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <h3 className="text-lg font-bold text-txt-primary flex items-center gap-2">
                        <FileSignature className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        {isEditing ? 'Chỉnh sửa Hợp đồng' : 'Tạo Hợp đồng mới'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-bg-muted rounded-xl transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4">
                    <form id="contract-form" onSubmit={onSubmit} className="space-y-6">
                        {/* Association Fields (Project, Package, Contractor) */}
                        <div className="p-4 bg-bg-subtle rounded-xl border border-border space-y-4">
                            <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-2">Thông tin liên kết</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Thuộc dự án <span className="text-red-500">*</span></label>
                                    <select
                                        {...register('projectId')}
                                        onChange={e => {
                                            setValue('projectId', e.target.value);
                                            setValue('packageId', '');
                                            setValue('contractorId', '');
                                        }}
                                        className={inputClass(!!errors.projectId)}
                                        disabled={isEditing}
                                    >
                                        <option value="">-- Chọn dự án --</option>
                                        {projects.map(p => (
                                            <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName}</option>
                                        ))}
                                    </select>
                                    {errors.projectId && <p className="text-xs text-red-500 mt-1">{errors.projectId.message}</p>}
                                </div>

                                <div>
                                    <label className={labelClass}>Thuộc gói thầu <span className="text-red-500">*</span></label>
                                    <select
                                        {...register('packageId')}
                                        onChange={e => handlePackageChange(e.target.value)}
                                        className={inputClass(!!errors.packageId)}
                                        disabled={isEditing || !watchedProjectId}
                                    >
                                        <option value="">-- Chọn gói thầu --</option>
                                        {availablePackages.map(p => (
                                            <option key={p.PackageID} value={p.PackageID}>{p.PackageName}</option>
                                        ))}
                                    </select>
                                    {errors.packageId && <p className="text-xs text-red-500 mt-1">{errors.packageId.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Nhà thầu thực hiện <span className="text-red-500">*</span></label>
                                <select
                                    {...register('contractorId')}
                                    className={inputClass(!!errors.contractorId)}
                                    disabled={isEditing}
                                >
                                    <option value="">-- Chọn nhà thầu --</option>
                                    {contractors.map(c => (
                                        <option key={c.ContractorID} value={c.ContractorID}>{c.FullName}</option>
                                    ))}
                                </select>
                                {errors.contractorId && <p className="text-xs text-red-500 mt-1">{errors.contractorId.message}</p>}

                                {!isEditing && watchedPackageId && selectedPackage && !selectedPackage.WinningContractorID && (
                                    <p className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-500 mt-2 bg-primary-50 dark:bg-primary-900/20 p-2 rounded border border-primary-200 dark:border-primary-800">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Gói thầu này chưa có thông tin nhà thầu trúng thầu. Nên cập nhật KQLCNT trên Hệ thống trước.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Contract Core Info */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-2 border-b border-border-subtle pb-2">Chi tiết Hợp đồng</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>
                                        <Hash className="w-3 h-3 inline mr-1" />Số hợp đồng <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        {...register('contractId')}
                                        placeholder="VD: HD-2026/01-TV"
                                        className={inputClass(!!errors.contractId)}
                                        disabled={isEditing}
                                    />
                                    {errors.contractId && <p className="text-xs text-red-500 mt-1">{errors.contractId.message}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        <Calendar className="w-3 h-3 inline mr-1" />Ngày ký <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        {...register('signDate')}
                                        className={inputClass(!!errors.signDate)}
                                    />
                                    {errors.signDate && <p className="text-xs text-red-500 mt-1">{errors.signDate.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Tên hợp đồng</label>
                                <input
                                    type="text"
                                    {...register('contractName')}
                                    placeholder="Tên hợp đồng..."
                                    className={inputClass(false)}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>
                                        <Banknote className="w-3 h-3 inline mr-1" />Giá trị HĐ (VND) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        {...register('value')}
                                        placeholder="0"
                                        className={inputClass(!!errors.value)}
                                    />
                                    {watchedValue && !errors.value && (
                                        <p className="text-[10px] text-gray-500 mt-1 font-mono">{formatCurrency(Number(watchedValue))}</p>
                                    )}
                                    {errors.value && <p className="text-xs text-red-500 mt-1">{errors.value.message}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        <Percent className="w-3 h-3 inline mr-1" />Tạm ứng (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        {...register('advanceRate')}
                                        placeholder="15"
                                        className={inputClass(false)}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        <Shield className="w-3 h-3 inline mr-1" />Bảo hành (thg)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        {...register('warranty')}
                                        placeholder="12"
                                        className={inputClass(false)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>
                                        <Clock className="w-3 h-3 inline mr-1" />TG thực hiện (thg)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        {...register('durationMonths')}
                                        placeholder="6"
                                        className={inputClass(false)}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        {...register('startDate')}
                                        className={inputClass(false)}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Ngày kết thúc</label>
                                    <input
                                        type="date"
                                        {...register('endDate')}
                                        className={inputClass(false)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Phạm vi công việc</label>
                                <textarea
                                    {...register('scope')}
                                    placeholder="Mô tả phạm vi công việc hợp đồng..."
                                    rows={2}
                                    className={`${inputClass(false)} resize-none`}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Điều kiện thanh toán</label>
                                <textarea
                                    {...register('paymentTerms')}
                                    placeholder="VD: Tạm ứng 15% sau ký HĐ, thanh toán theo khối lượng..."
                                    rows={2}
                                    className={`${inputClass(false)} resize-none`}
                                />
                            </div>
                        </div>

                        {saveMutation.isError && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
                                Lỗi: {(saveMutation.error as Error)?.message || 'Không thể lưu hợp đồng'}
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-bg-subtle flex justify-end gap-3 shrink-0 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-txt-secondary bg-bg-surface border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-bg-subtle dark:hover:bg-slate-700 transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        form="contract-form"
                        disabled={saveMutation.isPending}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-primary-600 shadow-sm hover:bg-primary-500 focus:ring-4 focus:ring-blue-500/20 rounded-lg disabled:opacity-50 transition-all"
                    >
                        {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isEditing ? 'Lưu thay đổi' : 'Tạo hợp đồng'}
                    </button>
                </div>
            </div>
        </div>
    );
};
