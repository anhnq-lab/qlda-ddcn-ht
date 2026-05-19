import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Loader2, Save, Calendar, FileText, Building2, AlertCircle, Lightbulb } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BiddingPackage, PackageStatus, BIDDING_THRESHOLDS } from '../../../types';
import { formatCurrency } from '../../../utils/format';
import ApiClient from '../../../services/api';
import { detectApplicableMethod, getMethodGuidance, checkPackageCompliance } from '../../../utils/biddingCompliance';
import { LegalReferenceLink } from '../../../components/common/LegalReferenceLink';
import { BiddingPackageFormSchema, type BiddingPackageFormValues } from '../../../schemas/biddingPackage.schema';

// ========================================
// BIDDING PACKAGE MODAL - NĐ 214/2025 Compliance
// ========================================

interface BiddingPackagePanelProps {
    onClose: () => void;
    projectId: string;
    packageToEdit?: BiddingPackage | null;
    planId?: string;
}

// Options theo Luật Đấu thầu
const FIELD_OPTIONS = [
    { value: 'Construction', label: 'Xây lắp' },
    { value: 'Consultancy', label: 'Tư vấn' },
    { value: 'NonConsultancy', label: 'Phi tư vấn' },
    { value: 'Goods', label: 'Hàng hóa' },
    { value: 'Mixed', label: 'Hỗn hợp' },
];

const SELECTION_METHOD_OPTIONS = [
    { value: 'OpenBidding', label: 'Đấu thầu rộng rãi' },
    { value: 'LimitedBidding', label: 'Đấu thầu hạn chế' },
    { value: 'Appointed', label: 'Chỉ định thầu' },
    { value: 'CompetitiveShopping', label: 'Chào hàng cạnh tranh' },
    { value: 'DirectProcurement', label: 'Mua sắm trực tiếp' },
    { value: 'SelfExecution', label: 'Tự thực hiện' },
    { value: 'CommunityParticipation', label: 'Cộng đồng tham gia' },
];

const SELECTION_PROCEDURE_OPTIONS = [
    { value: 'OneStageOneEnvelope', label: '1 giai đoạn 1 túi hồ sơ' },
    { value: 'OneStageTwoEnvelope', label: '1 giai đoạn 2 túi hồ sơ' },
    { value: 'TwoStageOneEnvelope', label: '2 giai đoạn 1 túi hồ sơ' },
    { value: 'TwoStageTwoEnvelope', label: '2 giai đoạn 2 túi hồ sơ' },
    { value: 'Reduced', label: 'Rút gọn' },
    { value: 'Normal', label: 'Thông thường' },
];

const BID_TYPE_OPTIONS = [
    { value: 'Online', label: 'Đấu thầu qua mạng' },
    { value: 'Offline', label: 'Đấu thầu trực tiếp' },
];

const CONTRACT_TYPE_OPTIONS = [
    { value: 'LumpSum', label: 'Trọn gói' },
    { value: 'UnitPrice', label: 'Đơn giá cố định' },
    { value: 'AdjustableUnitPrice', label: 'Đơn giá điều chỉnh' },
    { value: 'TimeBased', label: 'Theo thời gian' },
    { value: 'Percentage', label: 'Theo tỷ lệ phần trăm' },
    { value: 'Mixed', label: 'Hỗn hợp' },
];

const STATUS_OPTIONS = [
    { value: PackageStatus.Selection, label: 'Lựa chọn nhà thầu' },
    { value: PackageStatus.Execution, label: 'Đang thực hiện' },
    { value: PackageStatus.Completed, label: 'Kết thúc' },
];


const FUNDING_SOURCE_OPTIONS = [
    'Ngân sách Nhà nước',
    'Ngân sách Trung ương',
    'Ngân sách địa phương',
    'Ngân sách tỉnh',
    'Ngân sách tỉnh và Trung ương',
    'Vốn ODA',
    'Vốn vay ưu đãi',
    'Vốn hỗn hợp (NSNN + ODA)',
    'Khác',
];

const initialFormData: BiddingPackageFormValues = {
    PackageNumber: '',
    PackageName: '',
    Price: '',
    Duration: '',
    Field: 'Construction',
    SelectionMethod: 'OpenBidding',
    SelectionProcedure: 'OneStageOneEnvelope',
    BidType: 'Online',
    ContractType: 'LumpSum',
    Status: PackageStatus.Selection,
    NotificationCode: '',
    DecisionNumber: '',
    DecisionDate: '',
    PostingDate: '',
    BidClosingDate: '',
    BidOpeningDate: '',
    WinningContractorID: '',
    WinningPrice: '',
    ApprovalDate_Result: '',
    FundingSource: 'Ngân sách Nhà nước',
    Description: '',
    SelectionDuration: '45 ngày',
    SelectionStartDate: '',
    HasOption: 'false',
    // Báo cáo đấu thầu
    BiddingScope: 'Domestic',
    BiddersCount: '',
    EvaluationBiddersCount: '',
};

export const BiddingPackagePanel: React.FC<BiddingPackagePanelProps> = ({
    onClose,
    projectId,
    packageToEdit,
    planId,
}) => {
    const queryClient = useQueryClient();
    const isEditMode = !!packageToEdit;

    const [activeTab, setActiveTab] = useState<'basic' | 'legal' | 'timeline' | 'result'>('basic');

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<BiddingPackageFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(BiddingPackageFormSchema) as any,
        defaultValues: initialFormData,
    });

    // Watch fields needed for computed values
    const watchPrice = watch('Price');
    const watchField = watch('Field');
    const watchSelectionMethod = watch('SelectionMethod');
    const watchStatus = watch('Status');
    const watchWinningPrice = watch('WinningPrice');

    const { data: contractors } = useQuery({
        queryKey: ['contractors'],
        queryFn: (): Promise<any[]> => ApiClient.get('/api/contractors', (): any[] => []),
    });

    // NĐ 214/2025: Auto-detect applicable selection method based on price + field
    const methodGuidance = useMemo(() => {
        const price = parseFloat(watchPrice) || 0;
        if (price === 0) return null;

        const field = watchField as BiddingPackage['Field'];
        const method = detectApplicableMethod(price, field, true);
        return getMethodGuidance(method);
    }, [watchPrice, watchField]);

    // Live Compliance Check
    const complianceResult = useMemo(() => {
        const compliancePkg = {
            Price: parseFloat(watchPrice) || 0,
            Field: watchField,
            SelectionMethod: watchSelectionMethod
        } as BiddingPackage;
        return checkPackageCompliance(compliancePkg, true);
    }, [watchPrice, watchField, watchSelectionMethod]);

    // Initialize form when editing
    useEffect(() => {
        if (packageToEdit) {
            reset({
                PackageNumber: packageToEdit.PackageNumber || '',
                PackageName: packageToEdit.PackageName || '',
                Price: packageToEdit.Price?.toString() || '',
                Duration: packageToEdit.Duration || '',
                Field: (packageToEdit.Field as BiddingPackageFormValues['Field']) || 'Construction',
                SelectionMethod: (packageToEdit.SelectionMethod as BiddingPackageFormValues['SelectionMethod']) || 'OpenBidding',
                SelectionProcedure: (packageToEdit.SelectionProcedure as BiddingPackageFormValues['SelectionProcedure']) || 'OneStageOneEnvelope',
                BidType: (packageToEdit.BidType as BiddingPackageFormValues['BidType']) || 'Online',
                ContractType: (packageToEdit.ContractType as BiddingPackageFormValues['ContractType']) || 'LumpSum',
                Status: packageToEdit.Status || PackageStatus.Selection,
                NotificationCode: packageToEdit.NotificationCode || '',
                DecisionNumber: packageToEdit.DecisionNumber || '',
                DecisionDate: packageToEdit.DecisionDate || '',
                PostingDate: packageToEdit.PostingDate || '',
                BidClosingDate: packageToEdit.BidClosingDate || '',
                BidOpeningDate: packageToEdit.BidOpeningDate || '',
                WinningContractorID: packageToEdit.WinningContractorID || '',
                WinningPrice: packageToEdit.WinningPrice?.toString() || '',
                ApprovalDate_Result: packageToEdit.ApprovalDate_Result || '',
                FundingSource: packageToEdit.FundingSource || 'Ngân sách Nhà nước',
                Description: packageToEdit.Description || '',
                SelectionDuration: packageToEdit.SelectionDuration || '45 ngày',
                SelectionStartDate: packageToEdit.SelectionStartDate || '',
                HasOption: packageToEdit.HasOption ? 'true' : 'false',
                BiddingScope: (packageToEdit.BiddingScope as BiddingPackageFormValues['BiddingScope']) || 'Domestic',
                BiddersCount: packageToEdit.BiddersCount?.toString() || '',
                EvaluationBiddersCount: packageToEdit.EvaluationBiddersCount?.toString() || '',
            });
        } else {
            reset(initialFormData);
        }
        setActiveTab('basic');
    }, [packageToEdit, reset]);

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: Partial<BiddingPackage>) =>
            ApiClient.post('/api/bidding-packages', data, () => data as BiddingPackage),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-packages', projectId] });
            onClose();
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: Partial<BiddingPackage>) =>
            ApiClient.put(`/api/bidding-packages/${packageToEdit?.PackageID}`, data, () => data as BiddingPackage),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-packages', projectId] });
            onClose();
        },
    });

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const onFormSubmit = handleSubmit((data) => {
        const payload: Partial<BiddingPackage> = {
            ProjectID: projectId,
            PackageNumber: data.PackageNumber,
            PackageName: data.PackageName,
            Price: parseFloat(data.Price),
            Duration: data.Duration,
            Field: data.Field as any,
            SelectionMethod: data.SelectionMethod as any,
            SelectionProcedure: data.SelectionProcedure as any,
            BidType: data.BidType as any,
            ContractType: data.ContractType as any,
            Status: data.Status as PackageStatus,
            NotificationCode: data.NotificationCode || undefined,
            DecisionNumber: data.DecisionNumber || undefined,
            DecisionDate: data.DecisionDate || undefined,
            PostingDate: data.PostingDate || undefined,
            BidClosingDate: data.BidClosingDate || undefined,
            BidOpeningDate: data.BidOpeningDate || undefined,
            WinningContractorID: data.WinningContractorID || undefined,
            WinningPrice: data.WinningPrice ? parseFloat(data.WinningPrice) : undefined,
            ApprovalDate_Result: data.ApprovalDate_Result || undefined,
            FundingSource: data.FundingSource || undefined,
            Description: data.Description || undefined,
            SelectionDuration: data.SelectionDuration || undefined,
            SelectionStartDate: data.SelectionStartDate || undefined,
            HasOption: data.HasOption === 'true',
            // Báo cáo đấu thầu
            BiddingScope: (data.BiddingScope as any) || 'Domestic',
            BiddersCount: data.BiddersCount ? parseInt(data.BiddersCount) : undefined,
            EvaluationBiddersCount: data.EvaluationBiddersCount ? parseInt(data.EvaluationBiddersCount) : undefined,
        };

        if (isEditMode) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    });

    const tabs = [
        { id: 'basic', label: 'Thông tin cơ bản', icon: FileText },
        { id: 'legal', label: 'Phân loại pháp lý', icon: Building2 },
        { id: 'timeline', label: 'Mốc thời gian', icon: Calendar },
        { id: 'result', label: 'Kết quả LCNT', icon: AlertCircle },
    ] as const;

    return (
        <form onSubmit={onFormSubmit} className="flex flex-col h-full bg-white dark:bg-slate-800">
            {/* Subtitle / Context */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
                <p className="text-sm text-gray-500 dark:text-slate-400">
                    <LegalReferenceLink text="Theo quy định NĐ 175/2024 và Luật Đấu thầu" />
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-700 px-6 shrink-0 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-3 text-sm font-medium 
                                border-b-2 transition-colors -mb-px
                                ${activeTab === tab.id
                                    ? 'text-primary-600 border-primary-600'
                                    : 'text-gray-500 dark:text-slate-400 border-transparent hover:text-gray-700 dark:hover:text-slate-200'}
                            `}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
                        {/* Tab: Basic Info */}
                        {activeTab === 'basic' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Số hiệu gói thầu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="VD: XL-01"
                                        {...register('PackageNumber')}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:bg-slate-700 dark:text-slate-100 ${errors.PackageNumber ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'}`}
                                    />
                                    {errors.PackageNumber && (
                                        <p className="mt-1 text-xs text-red-500">{errors.PackageNumber.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Trạng thái <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register('Status')}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        {STATUS_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Tên gói thầu <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        placeholder="Nhập tên đầy đủ của gói thầu..."
                                        {...register('PackageName')}
                                        rows={2}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none dark:bg-slate-700 dark:text-slate-100 ${errors.PackageName ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'}`}
                                    />
                                    {errors.PackageName && (
                                        <p className="mt-1 text-xs text-red-500">{errors.PackageName.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Giá gói thầu (VNĐ) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="0"
                                        {...register('Price')}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100 ${errors.Price ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'}`}
                                    />
                                    {watchPrice && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                            {formatCurrency(parseFloat(watchPrice) || 0)}
                                        </p>
                                    )}
                                    {errors.Price && (
                                        <p className="mt-1 text-xs text-red-500">{errors.Price.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Thời gian thực hiện <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="VD: 360 ngày"
                                        {...register('Duration')}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100 ${errors.Duration ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'}`}
                                    />
                                    {errors.Duration && (
                                        <p className="mt-1 text-xs text-red-500">{errors.Duration.message}</p>
                                    )}
                                </div>

                                {/* Tóm tắt công việc */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Tóm tắt công việc chính
                                    </label>
                                    <textarea
                                        placeholder="Mô tả ngắn gọn nội dung công việc chính của gói thầu..."
                                        {...register('Description')}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                    />
                                </div>

                                {/* Nguồn vốn */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Nguồn vốn
                                    </label>
                                    <select
                                        {...register('FundingSource')}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        {FUNDING_SOURCE_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tùy chọn mua thêm */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Tùy chọn mua thêm
                                    </label>
                                    <select
                                        {...register('HasOption')}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="false">Không</option>
                                        <option value="true">Có</option>
                                    </select>
                                </div>

                                {/* NĐ 214/2025 Guidance Banner & Live Compliance Result */}
                                {(methodGuidance || complianceResult.suggestions.length > 0 || !complianceResult.isValid) && (
                                    <div className="col-span-2 space-y-3">
                                        {/* Auto-detected Guidance */}
                                        {methodGuidance && (
                                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                                                <div className="flex items-start gap-3">
                                                    <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                                            Gợi ý phương án LCNT (NĐ 214/2025)
                                                        </h5>
                                                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                                            Nên áp dụng: <strong>{methodGuidance.label}</strong>
                                                        </p>
                                                        <p className="text-xs text-blue-600 mt-1">
                                                            {methodGuidance.description} • <em><LegalReferenceLink text={methodGuidance.legalBasis} /></em>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Compliance Error */}
                                        {!complianceResult.isValid && (
                                            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1 text-sm text-red-700 dark:text-red-300">
                                                        <ul className="list-disc pl-4 space-y-1">
                                                            {complianceResult.errors.map((err, i) => (
                                                                <li key={i}>{err}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Compliance Suggestions */}
                                        {complianceResult.isValid && complianceResult.suggestions.length > 0 && (
                                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                                                <div className="flex items-start gap-3">
                                                    <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1 text-sm text-emerald-700 dark:text-emerald-300">
                                                        <ul className="list-disc pl-4 space-y-1">
                                                            {complianceResult.suggestions.map((sug, i) => (
                                                                <li key={i}>{sug}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Legal Classification */}
                        {activeTab === 'legal' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Lĩnh vực
                                    </label>
                                    <select
                                        {...register('Field')}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        {FIELD_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Hình thức lựa chọn nhà thầu
                                    </label>
                                    <select
                                        {...register('SelectionMethod')}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors dark:bg-slate-700 dark:text-slate-100 ${!complianceResult.isValid ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'}`}
                                    >
                                        {SELECTION_METHOD_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {!complianceResult.isValid && (
                                        <p className="mt-1 text-xs text-red-500">
                                            Hình thức chọn không khả dụng. Xem cảnh báo bên dưới.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Phương thức lựa chọn
                                    </label>
                                    <select
                                        {...register('SelectionProcedure')}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        {SELECTION_PROCEDURE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Hình thức đấu thầu
                                    </label>
                                    <select
                                        {...register('BidType')}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        {BID_TYPE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Loại hợp đồng
                                    </label>
                                    <select
                                        {...register('ContractType')}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        {CONTRACT_TYPE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Phạm vi đấu thầu */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Phạm vi đấu thầu
                                    </label>
                                    <select
                                        {...register('BiddingScope')}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="Domestic">Trong nước</option>
                                        <option value="International">Quốc tế</option>
                                    </select>
                                </div>

                                {/* Số nhà thầu nộp HSDT */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Số NTh nộp HSDT/HSĐX
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        {...register('BiddersCount')}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                {/* Số NTh vào đánh giá tài chính */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Số NTh vào đánh giá TC
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        {...register('EvaluationBiddersCount')}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Tab: Timeline */}
                        {activeTab === 'timeline' && (
                            <div className="space-y-6">
                                {/* TBMT Section */}
                                {/* TBMT Section */}
                                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                                    <h4 className="font-semibold text-gray-800 dark:text-slate-100 mb-3">Thông báo mời thầu (E-TBMT)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                Mã TBMT
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="VD: IB2400001234"
                                                {...register('NotificationCode')}
                                                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                Ngày đăng tải
                                            </label>
                                            <input
                                                type="date"
                                                {...register('PostingDate')}
                                                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                Thời điểm đóng thầu
                                            </label>
                                            <input
                                                type="date"
                                                {...register('BidClosingDate')}
                                                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                Thời điểm mở thầu
                                            </label>
                                            <input
                                                type="date"
                                                {...register('BidOpeningDate')}
                                                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Result */}
                        {activeTab === 'result' && (
                            <div className="space-y-4">
                                {watchStatus !== PackageStatus.Execution && watchStatus !== PackageStatus.Completed ? (
                                    <div className="p-4 text-center bg-gray-50 dark:bg-slate-700 rounded-xl">
                                        <AlertCircle className="w-12 h-12 text-gray-400 dark:text-slate-400 mx-auto mb-3" />
                                        <p className="text-gray-600 dark:text-slate-300">
                                            Chỉ nhập kết quả khi gói thầu có trạng thái <strong>"Đang thực hiện"</strong> hoặc <strong>"Kết thúc"</strong>
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                            Thay đổi trạng thái ở tab "Thông tin cơ bản"
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl">
                                        <h4 className="font-semibold text-gray-800 dark:text-slate-100 mb-3">Kết quả lựa chọn nhà thầu</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                    Nhà thầu trúng thầu
                                                </label>
                                                <select
                                                    {...register('WinningContractorID')}
                                                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                >
                                                    <option value="">-- Chọn nhà thầu --</option>
                                                    {((contractors as any)?.data || contractors || []).map((c: any) => (
                                                        <option key={c.ContractorID} value={c.ContractorID}>
                                                            {c.ContractorName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                    Giá trúng thầu (VNĐ)
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    {...register('WinningPrice')}
                                                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                />
                                                {watchWinningPrice && (
                                                    <p className="mt-1 text-xs text-green-600 font-medium">
                                                        {formatCurrency(parseFloat(watchWinningPrice) || 0)}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                    Ngày phê duyệt KQLCNT
                                                </label>
                                                <input
                                                    type="date"
                                                    {...register('ApprovalDate_Result')}
                                                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang xử lý...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            {isEditMode ? 'Cập nhật' : 'Tạo gói thầu'}
                        </>
                    )}
                </button>
            </div>

            {/* Error display */}
            {(createMutation.isError || updateMutation.isError) && (
                <div className="absolute bottom-20 left-6 right-6 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    Có lỗi xảy ra. Vui lòng thử lại.
                </div>
            )}
        </form>
    );
};

export default BiddingPackagePanel;
