import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { 
    X, Loader2, Save, Calendar, FileText, Building2, AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BiddingPackage, PackageStatus } from '../../../types';
import { formatCurrency } from '../../../utils/format';
import ProjectService from '../../../services/ProjectService';
import ContractorService from '../../../services/ContractorService';
import { BiddingPackageFormSchema, type BiddingPackageFormValues, parseFormattedNumber } from '../../../schemas/biddingPackage.schema';
import { useToast } from '../../../components/ui/Toast';

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
    { value: 'Appointed', label: 'Chỉ định thầu thông thường' },
    { value: 'AppointedSimplified', label: 'Chỉ định thầu rút gọn' },
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
    { value: 'Online', label: 'Qua mạng' },
    { value: 'Offline', label: 'Không qua mạng' },
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


const PUBLIC_INVESTMENT_FUNDING_SOURCES = [
    'Vốn ngân sách trung ương',
    'Vốn ngân sách địa phương',
    'Vốn từ nguồn thu hợp pháp của cơ quan nhà nước, đơn vị sự nghiệp công lập dành để đầu tư',
];

const getTabForField = (field: string): 'basic' | 'legal' | 'timeline' | 'result' => {
    if (['PackageNumber', 'PackageName', 'Price', 'Duration', 'Status', 'FundingSource', 'Description', 'HasOption'].includes(field)) {
        return 'basic';
    }
    if (['Field', 'SelectionMethod', 'SelectionProcedure', 'BidType', 'ContractType', 'BiddingScope'].includes(field)) {
        return 'legal';
    }
    if (['DecisionNumber', 'DecisionDate', 'PostingDate', 'BidClosingDate', 'BidOpeningDate', 'SelectionDuration', 'SelectionStartDate'].includes(field)) {
        return 'timeline';
    }
    if (['WinningContractorID', 'WinningPrice', 'ApprovalDate_Result', 'BiddersCount', 'EvaluationBiddersCount'].includes(field)) {
        return 'result';
    }
    return 'basic';
};

const normalizeField = (val?: string | null): BiddingPackageFormValues['Field'] => {
    const map: Record<string, BiddingPackageFormValues['Field']> = {
        'xây lắp': 'Construction',
        'tư vấn': 'Consultancy',
        'phi tư vấn': 'NonConsultancy',
        'hàng hóa': 'Goods',
        'hỗn hợp': 'Mixed',
        'construction': 'Construction',
        'consultancy': 'Consultancy',
        'nonconsultancy': 'NonConsultancy',
        'goods': 'Goods',
        'mixed': 'Mixed',
    };
    const norm = (val || '').toLowerCase().trim();
    return map[norm] || 'Construction';
};

const normalizeSelectionMethod = (val?: string | null): BiddingPackageFormValues['SelectionMethod'] => {
    const map: Record<string, BiddingPackageFormValues['SelectionMethod']> = {
        'đấu thầu rộng rãi': 'OpenBidding',
        'đấu thầu hạn chế': 'LimitedBidding',
        'chỉ định thầu': 'Appointed',
        'chỉ định thầu thông thường': 'Appointed',
        'chỉ định thầu rút gọn': 'AppointedSimplified',
        'chào hàng cạnh tranh': 'CompetitiveShopping',
        'mua sắm trực tiếp': 'DirectProcurement',
        'tự thực hiện': 'SelfExecution',
        'cộng đồng tham gia': 'CommunityParticipation',
        'openbidding': 'OpenBidding',
        'limitedbidding': 'LimitedBidding',
        'appointed': 'Appointed',
        'appointedsimplified': 'AppointedSimplified',
        'simplifiedappointed': 'AppointedSimplified',
        'competitiveshopping': 'CompetitiveShopping',
        'directprocurement': 'DirectProcurement',
        'selfexecution': 'SelfExecution',
        'communityparticipation': 'CommunityParticipation',
    };
    const norm = (val || '').toLowerCase().trim();
    return map[norm] || 'OpenBidding';
};

const normalizeSelectionProcedure = (val?: string | null): BiddingPackageFormValues['SelectionProcedure'] => {
    const map: Record<string, BiddingPackageFormValues['SelectionProcedure']> = {
        'một giai đoạn một túi hồ sơ': 'OneStageOneEnvelope',
        'một giai đoạn hai túi hồ sơ': 'OneStageTwoEnvelope',
        'hai giai đoạn một túi hồ sơ': 'TwoStageOneEnvelope',
        'hai giai đoạn hai túi hồ sơ': 'TwoStageTwoEnvelope',
        'rút gọn': 'Reduced',
        'thông thường': 'Normal',
        'không có phương thức lcnt': 'Reduced',
        'onestageoneenvelope': 'OneStageOneEnvelope',
        'onestagetwoenvelope': 'OneStageTwoEnvelope',
        'twostageoneenvelope': 'TwoStageOneEnvelope',
        'twostagetwoenvelope': 'TwoStageTwoEnvelope',
        'reduced': 'Reduced',
        'normal': 'Normal',
    };
    const norm = (val || '').toLowerCase().trim();
    return map[norm] || 'OneStageOneEnvelope';
};

const normalizeBidType = (val?: string | null): BiddingPackageFormValues['BidType'] => {
    const map: Record<string, BiddingPackageFormValues['BidType']> = {
        'online': 'Online',
        'offline': 'Offline',
        'đấu thầu qua mạng': 'Online',
        'qua mạng': 'Online',
        'đấu thầu trực tiếp': 'Offline',
        'trực tiếp': 'Offline',
        'không qua mạng': 'Offline',
    };
    const norm = (val || '').toLowerCase().trim();
    return map[norm] || 'Online';
};

const normalizeContractType = (val?: string | null): BiddingPackageFormValues['ContractType'] => {
    const map: Record<string, BiddingPackageFormValues['ContractType']> = {
        'trọn gói': 'LumpSum',
        'đơn giá cố định': 'UnitPrice',
        'đơn giá': 'UnitPrice',
        'đơn giá điều chỉnh': 'AdjustableUnitPrice',
        'theo thời gian': 'TimeBased',
        'theo tỷ lệ phần trăm': 'Percentage',
        'theo tỷ lệ %': 'Percentage',
        'hỗn hợp': 'Mixed',
        'fixedunitprice': 'UnitPrice',
        'lumpsum': 'LumpSum',
        'unitprice': 'UnitPrice',
        'adjustableunitprice': 'AdjustableUnitPrice',
        'timebased': 'TimeBased',
        'percentage': 'Percentage',
        'mixed': 'Mixed',
    };
    const norm = (val || '').toLowerCase().trim();
    return map[norm] || 'LumpSum';
};

const normalizeBiddingScope = (val?: string | null): BiddingPackageFormValues['BiddingScope'] => {
    const map: Record<string, BiddingPackageFormValues['BiddingScope']> = {
        'domestic': 'Domestic',
        'international': 'International',
        'trong nước': 'Domestic',
        'trongnuoc': 'Domestic',
        'quốc tế': 'International',
    };
    const norm = (val || '').toLowerCase().trim();
    return map[norm] || 'Domestic';
};

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
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const isEditMode = !!packageToEdit;

    const [activeTab, setActiveTab] = useState<'basic' | 'legal' | 'timeline' | 'result'>('basic');
    const [fundingSourceSelect, setFundingSourceSelect] = useState('Vốn ngân sách trung ương');
    const [customFundingSource, setCustomFundingSource] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        reset,
        setError,
        setValue,
        formState: { errors },
    } = useForm<BiddingPackageFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(BiddingPackageFormSchema) as any,
        defaultValues: initialFormData,
    });

    const hasTabErrors = (tabId: 'basic' | 'legal' | 'timeline' | 'result'): boolean => {
        const fieldsForTab = {
            basic: ['PackageNumber', 'PackageName', 'Price', 'Duration', 'Status', 'FundingSource', 'Description', 'HasOption'],
            legal: ['Field', 'SelectionMethod', 'SelectionProcedure', 'BidType', 'ContractType', 'BiddingScope'],
            timeline: ['DecisionNumber', 'DecisionDate', 'PostingDate', 'BidClosingDate', 'BidOpeningDate', 'SelectionDuration', 'SelectionStartDate'],
            result: ['WinningContractorID', 'WinningPrice', 'ApprovalDate_Result', 'BiddersCount', 'EvaluationBiddersCount']
        };
        const errorFields = Object.keys(errors);
        return errorFields.some(field => fieldsForTab[tabId].includes(field));
    };

    // Watch fields needed for computed values
    const watchPrice = watch('Price');
    const watchStatus = watch('Status');
    const watchWinningPrice = watch('WinningPrice');
    const watchSelectionMethod = watch('SelectionMethod');

    const { data: contractors } = useQuery({
        queryKey: ['contractors'],
        queryFn: () => ContractorService.getAll(),
    });

    // Initialize form when editing
    useEffect(() => {
        if (packageToEdit) {
            const fs = packageToEdit.FundingSource || '';
            if (PUBLIC_INVESTMENT_FUNDING_SOURCES.includes(fs)) {
                setFundingSourceSelect(fs);
                setCustomFundingSource('');
            } else if (fs) {
                setFundingSourceSelect('Khác');
                setCustomFundingSource(fs);
            } else {
                setFundingSourceSelect('Vốn ngân sách trung ương');
                setCustomFundingSource('');
            }
            reset({
                PackageNumber: packageToEdit.PackageNumber || '',
                PackageName: packageToEdit.PackageName || '',
                Price: packageToEdit.Price ? new Intl.NumberFormat('vi-VN').format(Number(packageToEdit.Price)) : '',
                Duration: packageToEdit.Duration || '',
                Field: normalizeField(packageToEdit.Field),
                SelectionMethod: normalizeSelectionMethod(packageToEdit.SelectionMethod),
                SelectionProcedure: normalizeSelectionProcedure(packageToEdit.SelectionProcedure),
                BidType: normalizeBidType(packageToEdit.BidType),
                ContractType: normalizeContractType(packageToEdit.ContractType),
                Status: packageToEdit.Status || PackageStatus.Selection,
                NotificationCode: packageToEdit.NotificationCode || '',
                DecisionNumber: packageToEdit.DecisionNumber || '',
                DecisionDate: packageToEdit.DecisionDate || '',
                PostingDate: packageToEdit.PostingDate || '',
                BidClosingDate: packageToEdit.BidClosingDate || '',
                BidOpeningDate: packageToEdit.BidOpeningDate || '',
                WinningContractorID: packageToEdit.WinningContractorID || '',
                WinningPrice: packageToEdit.WinningPrice ? new Intl.NumberFormat('vi-VN').format(Number(packageToEdit.WinningPrice)) : '',
                ApprovalDate_Result: packageToEdit.ApprovalDate_Result || '',
                FundingSource: fs || 'Vốn ngân sách trung ương',
                Description: packageToEdit.Description || '',
                SelectionDuration: packageToEdit.SelectionDuration || '45 ngày',
                SelectionStartDate: packageToEdit.SelectionStartDate || '',
                HasOption: packageToEdit.HasOption ? 'true' : 'false',
                BiddingScope: normalizeBiddingScope(packageToEdit.BiddingScope),
                BiddersCount: packageToEdit.BiddersCount?.toString() || '',
                EvaluationBiddersCount: packageToEdit.EvaluationBiddersCount?.toString() || '',
            });
        } else {
            setFundingSourceSelect('Vốn ngân sách trung ương');
            setCustomFundingSource('');
            reset(initialFormData);
        }
        setActiveTab('basic');
    }, [packageToEdit, reset]);

    // Tự động điều chỉnh Hình thức đấu thầu và Phương thức lựa chọn khi đổi sang Chỉ định thầu rút gọn
    useEffect(() => {
        if (watchSelectionMethod === 'AppointedSimplified') {
            setValue('BidType', 'Offline');
            setValue('SelectionProcedure', 'Reduced');
        } else if (watchSelectionMethod === 'Appointed') {
            setValue('SelectionProcedure', 'Normal');
        }
    }, [watchSelectionMethod, setValue]);

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: Partial<BiddingPackage>) =>
            ProjectService.createPackage(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-packages', projectId] });
            onClose();
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: Partial<BiddingPackage>) =>
            ProjectService.updatePackage(packageToEdit!.PackageID, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-packages', projectId] });
            onClose();
        },
    });

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const onFormSubmit = handleSubmit((data) => {
        const finalFundingSource = fundingSourceSelect === 'Khác' ? customFundingSource.trim() : fundingSourceSelect;
        if (fundingSourceSelect === 'Khác' && !finalFundingSource) {
            setError('FundingSource', { type: 'manual', message: 'Vui lòng nhập nguồn vốn khác' });
            setActiveTab('basic');
            showToast('Vui lòng nhập nguồn vốn khác', 'error');
            return;
        }

        // Ngăn chặn chuyển trạng thái không hợp lệ khi chưa có nhà thầu trúng thầu
        if (data.Status === PackageStatus.Execution && (!data.WinningContractorID || data.WinningContractorID.trim() === '')) {
            setError('Status', { type: 'manual', message: 'Không thể chọn trạng thái "Đang thực hiện" khi chưa chọn nhà thầu trúng thầu' });
            setActiveTab('basic');
            showToast('Không thể chọn trạng thái "Đang thực hiện" khi chưa chọn nhà thầu trúng thầu', 'error');
            return;
        }

        if (data.Status === PackageStatus.Completed && (!data.WinningContractorID || data.WinningContractorID.trim() === '')) {
            setError('Status', { type: 'manual', message: 'Không thể chọn trạng thái "Kết thúc" khi chưa chọn nhà thầu trúng thầu' });
            setActiveTab('basic');
            showToast('Không thể chọn trạng thái "Kết thúc" khi chưa chọn nhà thầu trúng thầu', 'error');
            return;
        }

        const payload: Partial<BiddingPackage> = {
            ProjectID: projectId,
            PackageNumber: data.PackageNumber,
            PackageName: data.PackageName,
            Price: parseFormattedNumber(data.Price),
            Duration: data.Duration,
            Field: data.Field as any,
            SelectionMethod: data.SelectionMethod as any,
            SelectionProcedure: data.SelectionProcedure as any,
            BidType: data.BidType as any,
            ContractType: data.ContractType as any,
            Status: data.Status as PackageStatus,
            NotificationCode: data.NotificationCode || null,
            DecisionNumber: data.DecisionNumber || null,
            DecisionDate: data.DecisionDate || null,
            PostingDate: data.PostingDate || null,
            BidClosingDate: data.BidClosingDate || null,
            BidOpeningDate: data.BidOpeningDate || null,
            WinningContractorID: data.WinningContractorID || null,
            WinningPrice: data.WinningPrice ? parseFormattedNumber(data.WinningPrice) : null,
            ApprovalDate_Result: data.ApprovalDate_Result || null,
            FundingSource: finalFundingSource || null,
            Description: data.Description || null,
            SelectionDuration: data.SelectionDuration || null,
            SelectionStartDate: data.SelectionStartDate || null,
            HasOption: data.HasOption === 'true',
            // Báo cáo đấu thầu
            BiddingScope: (data.BiddingScope as any) || 'Domestic',
            BiddersCount: data.BiddersCount ? parseInt(data.BiddersCount) : null,
            EvaluationBiddersCount: data.EvaluationBiddersCount ? parseInt(data.EvaluationBiddersCount) : null,
        };

        if (isEditMode) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    }, (errors) => {
        console.error('BiddingPackagePanel validation errors:', errors);
        const errorFields = Object.keys(errors);
        if (errorFields.length > 0) {
            const firstErrorField = errorFields[0];
            const targetTab = getTabForField(firstErrorField);
            setActiveTab(targetTab);
            
            const firstErrorMessage = errors[firstErrorField as keyof typeof errors]?.message || 'Có lỗi nhập liệu';
            showToast(firstErrorMessage as string, 'error');
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
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-700 px-6 shrink-0 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button" // make sure it's type="button" to prevent form submission on click
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
                            <span>{tab.label}</span>
                            {hasTabErrors(tab.id) && (
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1 shrink-0" />
                            )}
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
                                        {...register('Price', {
                                            onChange: (e) => {
                                                const rawVal = e.target.value;
                                                const cleanDigits = rawVal.replace(/[^\d]/g, '');
                                                if (!cleanDigits) {
                                                    e.target.value = '';
                                                    return;
                                                }
                                                const num = parseInt(cleanDigits, 10);
                                                e.target.value = new Intl.NumberFormat('vi-VN').format(num);
                                            }
                                        })}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100 ${errors.Price ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'}`}
                                    />
                                    {watchPrice && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                            {formatCurrency(parseFormattedNumber(watchPrice) || 0)}
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
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                            Nguồn vốn (Luật ĐTC số 58/2024/QH15)
                                        </label>
                                        <select
                                            value={fundingSourceSelect}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFundingSourceSelect(val);
                                                if (val !== 'Khác') {
                                                    setCustomFundingSource('');
                                                }
                                            }}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100 ${errors.FundingSource ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'}`}
                                        >
                                            {PUBLIC_INVESTMENT_FUNDING_SOURCES.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                            <option value="Khác">Khác (Nhập thủ công)</option>
                                        </select>
                                    </div>
                                    {fundingSourceSelect === 'Khác' && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                                                Nhập nguồn vốn khác *
                                            </label>
                                            <input
                                                type="text"
                                                value={customFundingSource}
                                                onChange={(e) => setCustomFundingSource(e.target.value)}
                                                placeholder="Ví dụ: Vốn vay thương mại, Vốn hợp tác..."
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100 ${errors.FundingSource ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'}`}
                                            />
                                        </div>
                                    )}
                                    {errors.FundingSource && (
                                        <p className="mt-1 text-xs text-red-500">{errors.FundingSource.message}</p>
                                    )}
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
                            </div>
                        )}

                        {/* Tab: Legal Classification */}
                        {activeTab === 'legal' && (
                            <div className="space-y-4">
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
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            {SELECTION_METHOD_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                            Đấu thầu qua mạng
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

                                    {/* Số nhà thầu vào đánh giá tài chính */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                            Số NTh vào đánh giá TC
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            {...register('EvaluationBiddersCount')}
                                            className="w-full px-3 py-2 border border-gray-250 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
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
                                                         {c.FullName || c.ContractorName || 'Chưa rõ'}
                                                     </option>
                                                 ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                Giá trúng thầu (VNĐ)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="0"
                                                {...register('WinningPrice', {
                                                    onChange: (e) => {
                                                        const rawVal = e.target.value;
                                                        const cleanDigits = rawVal.replace(/[^\d]/g, '');
                                                        if (!cleanDigits) {
                                                            e.target.value = '';
                                                            return;
                                                        }
                                                        const num = parseInt(cleanDigits, 10);
                                                        e.target.value = new Intl.NumberFormat('vi-VN').format(num);
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                            {watchWinningPrice && (
                                                <p className="mt-1 text-xs text-green-600 font-medium">
                                                    {formatCurrency(parseFormattedNumber(watchWinningPrice) || 0)}
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
                <div className="absolute bottom-20 left-6 right-6 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex flex-col gap-1">
                    <span className="font-semibold">Có lỗi xảy ra khi lưu gói thầu:</span>
                    <span className="font-mono text-xs">
                        {((createMutation.error || updateMutation.error) as any)?.message || 'Vui lòng thử lại.'}
                    </span>
                </div>
            )}
        </form>
    );
};

export default BiddingPackagePanel;
