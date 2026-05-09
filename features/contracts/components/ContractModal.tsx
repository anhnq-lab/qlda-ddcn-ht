import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Save, Loader2, FileSignature, Calendar, Banknote,
    Percent, Shield, X, Building2, Hash, FileText, Clock, AlertTriangle
} from 'lucide-react';
import { Contract, ContractStatus, BiddingPackage } from '../../../types';
import { ContractService } from '../../../services/ContractService';
import { formatCurrency } from '../../../utils/format';
import { useProjects } from '../../../hooks/useProjects';
import { useAllBiddingPackages } from '../../../hooks/useAllBiddingPackages';
import { useContractors } from '../../../hooks/useContractors';

interface ContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingContract?: Contract | null;
    initialPackageId?: string;
    onSaved?: (contract: Contract) => void;
}

interface FormData {
    projectId: string;
    packageId: string;
    contractorId: string;
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

    const [form, setForm] = useState<FormData>({
        projectId: existingContract?.ProjectID || '',
        packageId: existingContract?.PackageID || initialPackageId || '',
        contractorId: existingContract?.ContractorID || '',
        contractId: existingContract?.ContractID || '',
        contractName: existingContract?.ContractName || '',
        signDate: existingContract?.SignDate || new Date().toISOString().split('T')[0],
        value: existingContract ? String(existingContract.Value) : '',
        advanceRate: existingContract ? String(existingContract.AdvanceRate) : '15',
        warranty: existingContract ? String(existingContract.Warranty) : '12',
        scope: existingContract?.Scope || '',
        durationMonths: existingContract?.DurationMonths ? String(existingContract.DurationMonths) : '',
        startDate: existingContract?.StartDate || '',
        endDate: existingContract?.EndDate || '',
        paymentTerms: existingContract?.PaymentTerms || '',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

    // When modal opens/changes existingContract, reset form
    useEffect(() => {
        if (isOpen) {
            setForm({
                projectId: existingContract?.ProjectID || '',
                packageId: existingContract?.PackageID || initialPackageId || '',
                contractorId: existingContract?.ContractorID || '',
                contractId: existingContract?.ContractID || (isEditing ? '' : `HD-${Date.now()}`),
                contractName: existingContract?.ContractName || '',
                signDate: existingContract?.SignDate || new Date().toISOString().split('T')[0],
                value: existingContract ? String(existingContract.Value) : '',
                advanceRate: existingContract ? String(existingContract.AdvanceRate) : '15',
                warranty: existingContract ? String(existingContract.Warranty) : '12',
                scope: existingContract?.Scope || '',
                durationMonths: existingContract?.DurationMonths ? String(existingContract.DurationMonths) : '',
                startDate: existingContract?.StartDate || '',
                endDate: existingContract?.EndDate || '',
                paymentTerms: existingContract?.PaymentTerms || '',
            });
            setErrors({});
            // If creating and we have initialPackageId, set the project id and fetch data from package
            if (!isEditing && initialPackageId) {
                const pkg = biddingPackages.find(p => p.PackageID === initialPackageId);
                if (pkg) {
                    handlePackageChange(initialPackageId);
                }
            }
        }
    }, [isOpen, existingContract, initialPackageId, biddingPackages, isEditing]);

    const handlePackageChange = (pkgId: string) => {
        const pkg = biddingPackages.find(p => p.PackageID === pkgId);
        if (pkg) {
            setForm(prev => ({
                ...prev,
                packageId: pkgId,
                projectId: pkg.ProjectID,
                contractorId: pkg.WinningContractorID || '',
                contractName: pkg.PackageName || '',
                value: String(pkg.WinningPrice || pkg.Price || 0),
                warranty: pkg.Field === 'Construction' ? '24' : '12'
            }));
        } else {
            setForm(prev => ({ ...prev, packageId: pkgId }));
        }
        if (errors.packageId) setErrors(prev => ({ ...prev, packageId: undefined }));
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        if (!form.projectId) newErrors.projectId = 'Vui lòng chọn Dự án';
        if (!form.packageId) newErrors.packageId = 'Vui lòng chọn Gói thầu';
        if (!form.contractorId) newErrors.contractorId = 'Vui lòng chọn Nhà thầu';
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
        onSuccess: (savedData) => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['project-packages'] });
            onSaved?.(savedData);
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const data: Partial<Contract> = {
            ContractID: form.contractId,
            PackageID: form.packageId,
            ContractorID: form.contractorId,
            ProjectID: form.projectId,
            ContractName: form.contractName,
            SignDate: form.signDate,
            Value: Number(form.value),
            AdvanceRate: Number(form.advanceRate) || 0,
            Warranty: Number(form.warranty) || 12,
            Status: form.startDate && new Date(form.startDate) <= new Date() ? ContractStatus.Executing : ContractStatus.Executing, // Default to executing
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
        `w-full px-3 py-2 text-sm bg-bg-surface border rounded-lg outline-none transition-colors
        ${errors[field]
            ? 'border-red-300 dark:border-red-600 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
            : 'border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
        } text-gray-800 dark:text-slate-200`;

    const labelClass = "block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1";

    if (!isOpen) return null;

    // Derived values for display
    const selectedPackage = biddingPackages.find(p => p.PackageID === form.packageId);
    const selectedContractorName = contractors.find(c => c.ContractorID === form.contractorId)?.FullName || form.contractorId;
    
    // Filter packages by selected project (only those that actually have a winning contractor make sense, but let them pick)
    const availablePackages = form.projectId 
        ? biddingPackages.filter(p => p.ProjectID === form.projectId) 
        : biddingPackages;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 dark:bg-slate-900 backdrop-blur-sm overflow-hidden p-4">
            <div className="bg-bg-surface w-full max-w-2xl rounded-2xl shadow-sm flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 shrink-0">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                        <FileSignature className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        {isEditing ? 'Chỉnh sửa Hợp đồng' : 'Tạo Hợp đồng mới'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4">
                    <form id="contract-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Association Fields (Project, Package, Contractor) */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Thông tin liên kết</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Thuộc dự án <span className="text-red-500">*</span></label>
                                    <select
                                        value={form.projectId}
                                        onChange={e => {
                                            handleChange('projectId', e.target.value);
                                            handleChange('packageId', ''); // reset package
                                            handleChange('contractorId', ''); // reset contractor
                                        }}
                                        className={inputClass('projectId')}
                                        disabled={isEditing}
                                    >
                                        <option value="">-- Chọn dự án --</option>
                                        {projects.map(p => (
                                            <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName}</option>
                                        ))}
                                    </select>
                                    {errors.projectId && <p className="text-xs text-red-500 mt-1">{errors.projectId}</p>}
                                </div>
                                
                                <div>
                                    <label className={labelClass}>Thuộc gói thầu <span className="text-red-500">*</span></label>
                                    <select
                                        value={form.packageId}
                                        onChange={e => handlePackageChange(e.target.value)}
                                        className={inputClass('packageId')}
                                        disabled={isEditing || !form.projectId}
                                    >
                                        <option value="">-- Chọn gói thầu --</option>
                                        {availablePackages.map(p => (
                                            <option key={p.PackageID} value={p.PackageID}>{p.PackageName}</option>
                                        ))}
                                    </select>
                                    {errors.packageId && <p className="text-xs text-red-500 mt-1">{errors.packageId}</p>}
                                </div>
                            </div>
                            
                            <div>
                                <label className={labelClass}>Nhà thầu thực hiện <span className="text-red-500">*</span></label>
                                <select
                                    value={form.contractorId}
                                    onChange={e => handleChange('contractorId', e.target.value)}
                                    className={inputClass('contractorId')}
                                    disabled={isEditing}
                                >
                                    <option value="">-- Chọn nhà thầu --</option>
                                    {contractors.map(c => (
                                        <option key={c.ContractorID} value={c.ContractorID}>{c.FullName}</option>
                                    ))}
                                </select>
                                {errors.contractorId && <p className="text-xs text-red-500 mt-1">{errors.contractorId}</p>}
                                
                                {!isEditing && form.packageId && selectedPackage && !selectedPackage.WinningContractorID && (
                                    <p className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-500 mt-2 bg-primary-50 dark:bg-primary-900/20 p-2 rounded border border-primary-200 dark:border-primary-800">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Gói thầu này chưa có thông tin nhà thầu trúng thầu. Nên cập nhật KQLCNT trên Hệ thống trước.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Contract Core Info */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 border-b border-gray-100 dark:border-slate-800 pb-2">Chi tiết Hợp đồng</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
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
                                    {errors.contractId && <p className="text-xs text-red-500 mt-1">{errors.contractId}</p>}
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
                                    {errors.signDate && <p className="text-xs text-red-500 mt-1">{errors.signDate}</p>}
                                </div>
                            </div>

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

                            <div className="grid grid-cols-3 gap-4">
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
                                    {form.value && !errors.value && (
                                        <p className="text-[10px] text-gray-500 mt-1 font-mono">{formatCurrency(Number(form.value))}</p>
                                    )}
                                    {errors.value && <p className="text-xs text-red-500 mt-1">{errors.value}</p>}
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
                                        value={form.advanceRate}
                                        onChange={e => handleChange('advanceRate', e.target.value)}
                                        placeholder="15"
                                        className={inputClass('advanceRate')}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        <Shield className="w-3 h-3 inline mr-1" />Bảo hành (thg)
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

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>
                                        <Clock className="w-3 h-3 inline mr-1" />TG thực hiện (thg)
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
                        </div>

                        {saveMutation.isError && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
                                Lỗi: {(saveMutation.error as Error)?.message || 'Không thể lưu hợp đồng'}
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-bg-surface border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-bg-subtle dark:hover:bg-slate-700 transition-colors"
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
