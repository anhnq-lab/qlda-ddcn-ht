import React, { useState } from 'react';
import {
    X, ExternalLink, Calendar, FileText, Building2, Banknote, Clock, Award,
    TrendingDown, CreditCard, Receipt, Edit, ArrowLeft, BarChart3, Users,
    AlertTriangle, CheckCircle2, Phone, Mail, MapPin, Target, DollarSign,
    ClipboardList, Gavel, FileSignature, Calculator, Shield, Percent, Package, UserCheck
} from 'lucide-react';
import { BiddingPackage, PackageStatus, ContractStatus, PaymentStatus } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/format';
import { useContracts } from '../../../hooks/useContracts';
import { usePayments, useSubmitPayment, useApprovePayment, useTransferPayment, useRejectPayment, useRevertPaymentToDraft, useDeletePayment } from '../../../hooks/usePayments';
import { useContractors } from '../../../hooks/useContractors';
import { PaymentService } from '../../../services/PaymentService';
import { useAuth } from '../../../context/AuthContext';
import { getMSCRequirements, getMSCPlanLink, getMSCPackageLink } from '../../../utils/mscCompliance';
import { LegalReferenceLink } from '../../../components/common/LegalReferenceLink';
import { WinningContractorSelector } from './WinningContractorSelector';
import { BidderListSection, EvaluationSection } from './BidderEvaluationSection';
import { DirectAppointmentSection } from './DirectAppointmentSection';
import { SelfExecutionSection } from './SelfExecutionSection';
import { ContractFormInline } from './ContractFormInline';
import { PaymentFormInline } from './PaymentFormInline';
import { useVariationOrders } from '../../../hooks/useVariationOrders';
import { AcceptanceSection } from './AcceptanceSection';
import { DocumentAttachments } from '../../../components/common/DocumentAttachments';
import { SettlementSection } from './SettlementSection';
import ContractDetail from '../../contracts/ContractDetail';
import { useSlidePanel } from '../../../context/SlidePanelContext';
import { EmptyState } from '../../../components/ui/EmptyState';

// ========================================
// BIDDING PACKAGE DETAIL - Full Lifecycle Management
// Differentiated by Package Field:
// - XÂY LẮP: KHLCNT → TBMT → Bidding → Evaluation → Contract → Execution → Acceptance → Warranty → Settlement
// - TƯ VẤN: KHLCNT → TBMT → Bidding → Evaluation → Contract → Execution → Settlement (NO Acceptance/Warranty)
// - HÀNG HÓA: KHLCNT → TBMT → Bidding → Evaluation → Contract → Delivery → Warranty → Settlement
// ========================================

interface BiddingPackageDetailProps {
    isOpen: boolean;
    onClose: () => void;
    package_data: BiddingPackage | null;
    onEdit?: (pkg: BiddingPackage) => void;
    initialTab?: TabType;
    asSlidePanel?: boolean;
}

type TabType = 'khlcnt' | 'selection' | 'contract' | 'settlement';

// Helper: Categorize selection method (handles both English enum and Vietnamese DB text)
type MethodCategory = 'competitive' | 'appointed' | 'self_execution' | 'direct_procurement' | 'competitive_shopping';

function getMethodCategory(method?: string): MethodCategory {
    if (!method) return 'competitive';
    const m = method.toLowerCase();
    // Vietnamese text matching
    if (m.includes('chỉ định') || m.includes('chi dinh')) return 'appointed';
    if (m.includes('tự thực hiện') || m.includes('tu thuc hien')) return 'self_execution';
    if (m.includes('mua sắm trực tiếp') || m.includes('mua sam truc tiep')) return 'direct_procurement';
    if (m.includes('chào hàng') || m.includes('chao hang')) return 'competitive_shopping';
    // English enum matching
    if (m === 'appointed') return 'appointed';
    if (m === 'selfexecution') return 'self_execution';
    if (m === 'directprocurement') return 'direct_procurement';
    if (m === 'competitiveshopping') return 'competitive_shopping';
    // Default: competitive (OpenBidding, LimitedBidding, CommunityParticipation)
    return 'competitive';
}

// Helper: Get lifecycle stages based on package field
const getLifecycleStages = (field?: string) => {
    // Stages 1-5 are common to all package types
    const commonStages = [
        { id: 1, name: 'Kế hoạch', status: ['Planning'], icon: ClipboardList },
        { id: 2, name: 'TBMT', status: ['Posted'], icon: ExternalLink },
        { id: 3, name: 'Mời thầu', status: ['Bidding'], icon: Users },
        { id: 4, name: 'Đánh giá', status: ['Evaluating'], icon: Gavel },
        { id: 5, name: 'Hợp đồng', status: ['Awarded'], icon: FileSignature },
    ];

    switch (field) {
        case 'Construction': // Xây lắp
            return [
                ...commonStages,
                { id: 6, name: 'Thực hiện', status: [], icon: Building2 },
                { id: 7, name: 'Nghiệm thu', status: [], icon: CheckCircle2 },
                { id: 8, name: 'Bảo hành', status: [], icon: Shield },
                { id: 9, name: 'Quyết toán', status: [], icon: Calculator },
            ];
        case 'Goods': // Hàng hóa
            return [
                ...commonStages,
                { id: 6, name: 'Giao hàng', status: [], icon: Package },
                { id: 7, name: 'Bảo hành', status: [], icon: Shield },
                { id: 8, name: 'Quyết toán', status: [], icon: Calculator },
            ];
        case 'Consultancy': // Tư vấn - NO acceptance/warranty for consulting services
        case 'NonConsultancy': // Phi tư vấn
        case 'Mixed':
        default:
            return [
                ...commonStages,
                { id: 6, name: 'Thực hiện', status: [], icon: Building2 },
                { id: 7, name: 'Quyết toán', status: [], icon: Calculator },
            ];
    }
};

const getStatusConfig = (status: PackageStatus) => {
    const configs = {
        [PackageStatus.Planning]: { label: 'Trong kế hoạch', bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-600 dark:text-slate-300', border: 'border-gray-200 dark:border-slate-600', stage: 1 },
        [PackageStatus.Posted]: { label: 'Đã đăng TBMT', bg: 'bg-primary-100 dark:bg-primary-900/40', text: 'text-primary-700 dark:text-primary-300', border: 'border-primary-200 dark:border-primary-700', stage: 2 },
        [PackageStatus.Bidding]: { label: 'Đang mời thầu', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700', stage: 3 },
        [PackageStatus.Evaluating]: { label: 'Đang xét thầu', bg: 'bg-warning-100 dark:bg-warning-900/40', text: 'text-primary-700 dark:text-warning-300', border: 'border-warning-200 dark:border-warning-700', stage: 4 },
        [PackageStatus.Awarded]: { label: 'Đã có KQLCNT', bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700', stage: 5 },
        [PackageStatus.Cancelled]: { label: 'Hủy thầu', bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-700', stage: 0 },
    };
    return configs[status] || configs[PackageStatus.Planning];
};

const getLabelMaps = () => ({
    field: { 'Construction': 'Xây lắp', 'Consultancy': 'Tư vấn', 'NonConsultancy': 'Phi tư vấn', 'Goods': 'Hàng hóa', 'Mixed': 'Hỗn hợp' },
    method: { 'OpenBidding': 'Đấu thầu rộng rãi', 'LimitedBidding': 'Đấu thầu hạn chế', 'Appointed': 'Chỉ định thầu', 'CompetitiveShopping': 'Chào hàng cạnh tranh', 'DirectProcurement': 'Mua sắm trực tiếp', 'SelfExecution': 'Tự thực hiện', 'CommunityParticipation': 'Cộng đồng tham gia' },
    procedure: { 'OneStageOneEnvelope': '1 giai đoạn 1 túi hồ sơ', 'OneStageTwoEnvelope': '1 giai đoạn 2 túi hồ sơ', 'TwoStageOneEnvelope': '2 giai đoạn 1 túi hồ sơ', 'TwoStageTwoEnvelope': '2 giai đoạn 2 túi hồ sơ', 'Reduced': 'Rút gọn', 'Normal': 'Thông thường' },
    contractType: { 'LumpSum': 'Trọn gói', 'UnitPrice': 'Đơn giá cố định', 'AdjustableUnitPrice': 'Đơn giá điều chỉnh', 'TimeBased': 'Theo thời gian', 'Percentage': 'Theo tỷ lệ phần trăm', 'Mixed': 'Hỗn hợp' },
});

export const BiddingPackageDetail: React.FC<BiddingPackageDetailProps> = ({
    isOpen,
    onClose,
    package_data: pkg,
    onEdit,
    initialTab,
    asSlidePanel
}) => {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'khlcnt');
    const [isCreatingContract, setIsCreatingContract] = useState(false);
    const [isEditingContract, setIsEditingContract] = useState(false);
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const { openPanel } = useSlidePanel();

    // Sync activeTab when initialTab prop changes (deep-link from PaymentList)
    React.useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);

    // Hooks MUST be called before any conditional return (React Rules of Hooks)
    const { contracts } = useContracts();
    const { payments } = usePayments();
    const { contractors } = useContractors();

    const relatedContractInit = contracts.find(c => c.PackageID === pkg?.PackageID);
    const { variationOrders } = useVariationOrders(relatedContractInit?.ContractID || '');

    if (!isOpen || !pkg) return null;

    // Get lifecycle stages based on package field type
    const lifecycleStages = getLifecycleStages(pkg.Field);
    const statusConfig = getStatusConfig(pkg.Status);
    const labels = getLabelMaps();
    const currentStage = statusConfig.stage;

    // Get related data
    const relatedContract = relatedContractInit;
    const relatedPayments = payments.filter(p => relatedContract && p.ContractID === relatedContract.ContractID);
    const winningContractor = pkg.WinningContractorID ? contractors.find(c => c.ContractorID === pkg.WinningContractorID) : null;

    // Calculate sum of variation orders
    const sumVariationOrders = variationOrders.reduce((sum, vo) => sum + (vo.AdjustedAmount || 0), 0);
    const baseContractValue = relatedContract ? relatedContract.Value : 0;
    const contractValue = baseContractValue + sumVariationOrders;

    const totalPaid = relatedPayments
        .filter(p => p.Status === PaymentStatus.Transferred)
        .reduce((sum, p) => sum + p.Amount, 0);
    const paymentProgress = contractValue > 0 ? (totalPaid / contractValue) * 100 : 0;

    // Calculate stats
    const savings = pkg.WinningPrice && pkg.Price ? pkg.Price - pkg.WinningPrice : 0;
    const savingsPercent = pkg.Price && savings > 0 ? ((savings / pkg.Price) * 100).toFixed(2) : '0';

    // Determine actual stage (including contract execution stages) based on field type
    const maxStage = lifecycleStages.length;
    const settlementStageId = lifecycleStages[maxStage - 1].id; // Last stage is always settlement
    const executionStageId = 6; // Execution is always stage 6

    // Use enum values for comparison
    const actualStage = relatedContract
        ? (relatedContract.Status === ContractStatus.Liquidated ? settlementStageId : executionStageId)
        : currentStage;

    // Dynamic tabs based on package field type
    const tabs = [
        { id: 'khlcnt', label: 'KHLCNT & TBMT', icon: ClipboardList, stages: [1, 2] },
        { id: 'selection', label: 'Lựa chọn nhà thầu', icon: Users, stages: [3, 4] },
        { id: 'contract', label: 'Hợp đồng', icon: FileSignature, stages: [5, 6] },
        { id: 'settlement', label: 'Thanh quyết toán', icon: Calculator, stages: [7, 8, 9] },
    ] as const;

    const content = (
        <div className={asSlidePanel ? "flex flex-col h-full bg-white dark:bg-slate-800" : "relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm w-full max-w-6xl max-h-[95vh] overflow-hidden animate-scale-in flex flex-col"}>
            {/* Header with Package Info */}
            <div className="shrink-0 px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 via-blue-50 to-primary-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        {!asSlidePanel && (
                            <button
                                onClick={onClose}
                                className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 mb-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại danh sách
                            </button>
                        )}
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl font-bold text-gray-800 dark:text-slate-100">{pkg.PackageNumber}</span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                    {statusConfig.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${pkg.Field === 'Construction' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700' :
                                    pkg.Field === 'Consultancy' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700' :
                                        'bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600'
                                    }`}>
                                    {labels.field[pkg.Field as keyof typeof labels.field] || pkg.Field}
                                </span>
                            </div>
                            <h2 className="text-base text-gray-600 dark:text-slate-400 leading-relaxed max-w-4xl line-clamp-2">{pkg.PackageName}</h2>

                            <div className="flex items-center gap-3 mt-3">
                                {pkg.NotificationCode && (
                                    <a
                                        href={`https://muasamcong.mpi.gov.vn/web/guest/contractor-selection?type=es-contractor-selection&noticeNo=${pkg.NotificationCode}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-500 transition-colors"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Xem trên muasamcong.vn
                                    </a>
                                )}
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(pkg)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        Chỉnh sửa
                                    </button>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* LIFECYCLE TIMELINE HEADER */}
                <div className="shrink-0 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-5">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Vòng đời gói thầu</h4>
                    <div className="relative flex items-center justify-between">
                        {/* Connector Line - Background */}
                        <div className="absolute left-0 right-0 top-5 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full" style={{ left: '2.5rem', right: '2.5rem' }} />
                        {/* Connector Line - Progress */}
                        <div
                            className="absolute top-5 h-1.5 rounded-full transition-all duration-500"
                            style={{
                                background: 'linear-gradient(90deg, #fb923c, #4a90e2)',
                                left: '2.5rem',
                                width: actualStage > 0 ? `calc(${Math.min((actualStage - 1) / (lifecycleStages.length - 1) * 100, 100)}% - 5rem)` : '0%'
                            }}
                        />

                        {lifecycleStages.map((stage, idx) => {
                            const isCompleted = actualStage > stage.id;
                            const isCurrent = actualStage === stage.id;
                            const isPending = actualStage < stage.id;

                            return (
                                <div key={stage.id} className="flex flex-col items-center z-10 relative" style={{ width: `${100 / lifecycleStages.length}%` }}>
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm
                                        ${isCompleted ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-primary-200 dark:shadow-primary-900' :
                                            isCurrent ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white ring-4 ring-primary-100 dark:ring-primary-900 shadow-primary-200 dark:shadow-primary-900' :
                                                'bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-400 border-2 border-gray-200 dark:border-slate-600'}
                                    `}>
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <stage.icon className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-[11px] mt-2 font-medium whitespace-nowrap ${isCompleted ? 'text-green-600 dark:text-green-400' :
                                        isCurrent ? 'text-blue-600 dark:text-blue-400' :
                                            'text-gray-400 dark:text-slate-400'
                                        }`}>{stage.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tabs - 4 Lifecycle Groups */}
                <div className="shrink-0 flex border-b border-gray-200 dark:border-slate-700 px-6 bg-slate-50 dark:bg-slate-800">
                    {tabs.map(tab => {
                        const tabHasProgress = tab.stages.some(s => actualStage >= s);
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-3 text-sm font-medium 
                                    border-b-2 transition-colors -mb-px
                                    ${activeTab === tab.id
                                        ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-800'
                                        : tabHasProgress
                                            ? 'text-gray-600 dark:text-slate-400 border-transparent hover:text-gray-800 dark:hover:text-slate-200'
                                            : 'text-gray-400 dark:text-slate-600 border-transparent'}
                                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800 dark:bg-slate-900">
                    {/* Tab 1: KHLCNT & TBMT */}
                    {activeTab === 'khlcnt' && (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Left: KHLCNT Info */}
                            <div className="space-y-4">
                                <SectionCard title="Kế hoạch lựa chọn nhà thầu" icon={ClipboardList} color="blue">
                                    <InfoRow label="Mã KHLCNT" value={pkg.KHLCNTCode ? <span className="font-mono">{pkg.KHLCNTCode}</span> : '-'} />
                                    <InfoRow label="QĐ phê duyệt KHLCNT" value={pkg.DecisionNumber || '-'} />
                                    <InfoRow label="Ngày phê duyệt" value={pkg.DecisionDate ? formatDate(pkg.DecisionDate) : '-'} />
                                    <div className="border-t border-gray-200 my-2" />
                                    <InfoRow label="Giá gói thầu" value={<span className="font-bold text-gray-900 dark:text-slate-100">{formatCurrency(pkg.Price)}</span>} />
                                    <InfoRow label="Nguồn vốn" value={pkg.FundingSource || 'Ngân sách Nhà nước'} />
                                    <InfoRow label="Thời gian thực hiện" value={pkg.Duration || '-'} />
                                </SectionCard>

                                <SectionCard title="Phương thức đấu thầu" icon={Gavel} color="purple">
                                    <InfoRow label="Lĩnh vực" value={labels.field[pkg.Field as keyof typeof labels.field] || pkg.Field} />
                                    <InfoRow label="Hình thức LCNT" value={labels.method[pkg.SelectionMethod as keyof typeof labels.method] || pkg.SelectionMethod} />
                                    <InfoRow label="Phương thức" value={labels.procedure[pkg.SelectionProcedure as keyof typeof labels.procedure] || pkg.SelectionProcedure} />
                                    <InfoRow label="Loại hợp đồng" value={labels.contractType[pkg.ContractType as keyof typeof labels.contractType] || pkg.ContractType} />
                                    <InfoRow
                                        label="Hình thức đấu thầu"
                                        value={<span className={pkg.BidType === 'Online' ? 'text-blue-600 dark:text-blue-400' : ''}>{pkg.BidType === 'Online' ? '🌐 Qua mạng (E-Bidding)' : '📋 Trực tiếp'}</span>}
                                    />
                                </SectionCard>
                            </div>

                            {/* Right: TBMT Info */}
                            <div className="space-y-4">
                                <SectionCard title="Thông báo mời thầu (TBMT)" icon={ExternalLink} color="indigo">
                                    {pkg.NotificationCode ? (
                                        <>
                                            <InfoRow label="Mã TBMT" value={<span className="font-mono text-blue-600 dark:text-blue-400">{pkg.NotificationCode}</span>} />
                                            <InfoRow label="Ngày đăng tải" value={pkg.PostingDate ? formatDate(pkg.PostingDate) : '-'} />
                                            <InfoRow label="Thời điểm đóng thầu" value={pkg.BidClosingDate ? formatDate(pkg.BidClosingDate) : '-'} highlight />
                                            <InfoRow label="Thời điểm mở thầu" value={pkg.BidOpeningDate ? formatDate(pkg.BidOpeningDate) : '-'} />
                                            <div className="mt-3">
                                                <a
                                                    href={`https://muasamcong.mpi.gov.vn/web/guest/contractor-selection?noticeNo=${pkg.NotificationCode}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    Xem TBMT trên Hệ thống ĐTQG
                                                </a>
                                            </div>
                                        </>
                                    ) : (
                                        <EmptyState
                                            icon={<ExternalLink className="w-8 h-8 text-slate-300 dark:text-slate-600" />}
                                            title="Chưa đăng tải TBMT"
                                            description="Gói thầu đang trong giai đoạn lập kế hoạch"
                                            className="bg-transparent border-0 shadow-none py-6"
                                        />
                                    )}
                                </SectionCard>

                                <SectionCard title="Thời gian tổ chức LCNT" icon={Calendar} color="cyan">
                                    <InfoRow label="Thời gian tổ chức" value={pkg.SelectionDuration || '45 ngày'} />
                                    <InfoRow label="Thời gian bắt đầu" value={pkg.SelectionStartDate || '-'} />
                                    <InfoRow label="Tùy chọn mua thêm" value={pkg.HasOption ? 'Có' : 'Không'} />
                                    {pkg.PlanGroupName && (
                                        <>
                                            <div className="border-t border-gray-200 dark:border-slate-700 my-2" />
                                            <InfoRow label="Nhóm KH" value={<span className="font-medium text-primary-600 dark:text-primary-400">{pkg.PlanGroupName}</span>} />
                                            {pkg.PlanDecisionNumber && <InfoRow label="QĐ phê duyệt KH" value={pkg.PlanDecisionNumber} />}
                                            {pkg.PlanDecisionDate && <InfoRow label="Ngày QĐ" value={formatDate(pkg.PlanDecisionDate)} />}
                                        </>
                                    )}
                                </SectionCard>

                                {/* MSC Compliance Checklist */}
                                <SectionCard title="Đăng tải muasamcong.vn" icon={ExternalLink} color="green">
                                    {(() => {
                                        const reqs = getMSCRequirements(pkg);
                                        if (reqs.length === 0) return (
                                            <EmptyState
                                                icon={<CheckCircle2 className="w-8 h-8 text-green-400 dark:text-green-500" />}
                                                title="Không có yêu cầu đăng tải"
                                                className="bg-transparent border-0 shadow-none py-4"
                                            />
                                        );
                                        return (
                                            <div className="space-y-2">
                                                {reqs.map((req, i) => (
                                                    <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${req.status === 'Done' ? 'bg-green-50 dark:bg-green-900/20' :
                                                        req.status === 'Overdue' ? 'bg-red-50 dark:bg-red-900/20' :
                                                            'bg-primary-50 dark:bg-primary-900/20'
                                                        }`}>
                                                        {req.status === 'Done' ? (
                                                            <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 shrink-0" />
                                                        ) : req.status === 'Overdue' ? (
                                                            <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                                                        ) : (
                                                            <Clock className="w-4 h-4 text-primary-500 dark:text-primary-400 mt-0.5 shrink-0" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-medium ${req.status === 'Done' ? 'text-green-800 dark:text-green-300' :
                                                                req.status === 'Overdue' ? 'text-red-800 dark:text-red-300' :
                                                                    'text-primary-800 dark:text-primary-300'
                                                                }`}>{req.documentType}</p>
                                                            <p className="text-gray-500 dark:text-slate-400 text-[10px] mt-0.5">
                                                                <LegalReferenceLink text={req.legalBasis} />
                                                                {req.deadline && ` • Hạn: ${req.deadline}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* MSC Links */}
                                                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-slate-700">
                                                    {pkg.MSCPlanCode && (
                                                        <a href={getMSCPlanLink(pkg.MSCPlanCode)} target="_blank" rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50">
                                                            <ExternalLink className="w-3 h-3" />
                                                            KHLCNT: {pkg.MSCPlanCode}
                                                        </a>
                                                    )}
                                                    {pkg.NotificationCode && (
                                                        <a href={getMSCPackageLink(pkg.NotificationCode)} target="_blank" rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded hover:bg-primary-100 dark:hover:bg-primary-900/50">
                                                            <ExternalLink className="w-3 h-3" />
                                                            TBMT: {pkg.NotificationCode}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </SectionCard>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Lựa chọn nhà thầu — branched by SelectionMethod */}
                    {activeTab === 'selection' && (() => {
                        const methodCat = getMethodCategory(pkg.SelectionMethod);

                        // Mode: Chỉ định thầu / Mua sắm trực tiếp
                        if (methodCat === 'appointed' || methodCat === 'direct_procurement') {
                            return (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <SectionCard title="Nhà thầu được chỉ định" icon={UserCheck} color="blue">
                                            <DirectAppointmentSection packageId={pkg.PackageID} packagePrice={pkg.Price} />
                                        </SectionCard>
                                    </div>
                                    <div className="space-y-4">
                                        <SectionCard title="Kết quả lựa chọn nhà thầu" icon={Award} color="green">
                                            <WinningContractorSelector packageId={pkg.PackageID} />
                                            {pkg.WinningPrice ? (
                                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                                                    <InfoRow label="Giá trúng thầu" value={<span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(pkg.WinningPrice)}</span>} />
                                                    <InfoRow label="Tiết kiệm" value={savings > 0 ? <span className="text-blue-600 dark:text-blue-400">{formatCurrency(savings)} ({savingsPercent}%)</span> : '-'} />
                                                    <InfoRow label="Ngày phê duyệt KQLCNT" value={pkg.ApprovalDate_Result ? formatDate(pkg.ApprovalDate_Result) : '-'} />
                                                </div>
                                            ) : null}
                                        </SectionCard>
                                    </div>
                                </div>
                            );
                        }

                        // Mode: Tự thực hiện
                        if (methodCat === 'self_execution') {
                            return (
                                <SelfExecutionSection packageId={pkg.PackageID} />
                            );
                        }

                        // Mode: Đấu thầu cạnh tranh (OpenBidding, LimitedBidding, CompetitiveShopping, etc.)
                        return (
                            <div className="space-y-6">
                                {/* Row 1: Bidders + KQLCNT side by side */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left: Nhà thầu tham gia */}
                                    <SectionCard title="Nhà thầu tham gia" icon={Users} color="blue">
                                        <BidderListSection packageId={pkg.PackageID} />
                                    </SectionCard>

                                    {/* Right: Kết quả lựa chọn nhà thầu */}
                                    <SectionCard title="Kết quả lựa chọn nhà thầu" icon={Award} color="green">
                                        <WinningContractorSelector packageId={pkg.PackageID} filterByBidders={true} />
                                        {pkg.WinningPrice ? (
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                                                <InfoRow label="Giá trúng thầu" value={<span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(pkg.WinningPrice)}</span>} />
                                                <InfoRow label="Tiết kiệm" value={savings > 0 ? <span className="text-blue-600 dark:text-blue-400">{formatCurrency(savings)} ({savingsPercent}%)</span> : '-'} />
                                                <InfoRow label="Ngày phê duyệt KQLCNT" value={pkg.ApprovalDate_Result ? formatDate(pkg.ApprovalDate_Result) : '-'} />
                                            </div>
                                        ) : null}
                                    </SectionCard>
                                </div>

                                {/* Row 2: Đánh giá HSDT — full width */}
                                <SectionCard title="Đánh giá HSDT" icon={BarChart3} color="yellow">
                                    <EvaluationSection packageId={pkg.PackageID} />
                                </SectionCard>
                            </div>
                        );
                    })()}

                    {/* Tab 3: Hợp đồng */}
                    {activeTab === 'contract' && (
                        <div className="space-y-6">
                            {/* Contract & Contractor Overview */}
                            <div className="grid grid-cols-2 gap-4">
                                <SectionCard title="Nhà thầu thực hiện" icon={Building2} color="green">
                                    {winningContractor ? (
                                        <div className="space-y-2">
                                            <p className="font-semibold text-gray-800 dark:text-slate-100">{winningContractor.FullName}</p>
                                            <div className="text-sm text-gray-600 dark:text-slate-400 space-y-1.5">
                                                <p className="flex items-center gap-2"><Target className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400" /> MST: {winningContractor.ContractorID}</p>
                                                {winningContractor.ContactInfo && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400" /> {winningContractor.ContactInfo}</p>}
                                                {winningContractor.Address && <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400" /> {winningContractor.Address}</p>}
                                            </div>
                                        </div>
                                    ) : (
                                        <EmptyState
                                            icon={<Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600" />}
                                            title="Chưa có nhà thầu"
                                            className="bg-transparent border-0 shadow-none py-6"
                                        />
                                    )}
                                </SectionCard>

                                <SectionCard title="Hợp đồng" icon={FileSignature} color="blue">
                                    {relatedContract && !isEditingContract ? (
                                        <div className="space-y-2">
                                            <InfoRow label="Số hợp đồng" value={
                                                <button
                                                    onClick={() => {
                                                        openPanel({
                                                            title: `Hợp đồng ${relatedContract.ContractID}`,
                                                            icon: <FileSignature className="w-5 h-5 text-blue-500" />,
                                                            component: <ContractDetail contractId={relatedContract.ContractID} asSlidePanel={true} />,
                                                        });
                                                    }}
                                                    className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1 transition-colors"
                                                    title="Xem chi tiết hợp đồng"
                                                >
                                                    {relatedContract.ContractID}
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </button>
                                            } />
                                            <InfoRow label="Tên HĐ" value={relatedContract.ContractName || '-'} />
                                            <InfoRow label="Giá trị HĐ" value={<span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(relatedContract.Value)}</span>} />
                                            <InfoRow label="Ngày ký" value={formatDate(relatedContract.SignDate)} />
                                            <InfoRow label="Thời gian thực hiện" value={pkg.Duration || '-'} />
                                            <InfoRow label="Tỷ lệ tạm ứng" value={relatedContract.AdvanceRate ? `${relatedContract.AdvanceRate}%` : '-'} />
                                            <InfoRow label="Bảo hành" value={relatedContract.Warranty ? `${relatedContract.Warranty} tháng` : '-'} />
                                            <InfoRow label="Trạng thái" value={
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${relatedContract.Status === ContractStatus.Executing ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' :
                                                    relatedContract.Status === ContractStatus.Liquidated ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                                                    }`}>
                                                    {relatedContract.Status === ContractStatus.Executing ? 'Đang thực hiện' :
                                                        relatedContract.Status === ContractStatus.Liquidated ? 'Đã thanh lý' : 'Tạm dừng'}
                                                </span>
                                            } />
                                            <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                                                <button
                                                    onClick={() => setIsEditingContract(true)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                    Sửa hợp đồng
                                                </button>
                                            </div>
                                            <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                                                <DocumentAttachments relatedType="contract" relatedId={relatedContract.ContractID} />
                                            </div>
                                        </div>
                                    ) : relatedContract && isEditingContract ? (
                                        <ContractFormInline
                                            packageData={pkg}
                                            contractorName={winningContractor?.FullName}
                                            existingContract={relatedContract}
                                            onSaved={() => setIsEditingContract(false)}
                                            onCancel={() => setIsEditingContract(false)}
                                        />
                                    ) : null}
                                </SectionCard>
                            </div>

                            {/* Create contract form */}
                            {!relatedContract && !isCreatingContract && (
                                <EmptyState
                                    icon={<FileSignature className="w-10 h-10 text-warning-500 dark:text-warning-600" />}
                                    title="Chưa có hợp đồng"
                                    description="Tạo hợp đồng để quản lý thực hiện gói thầu"
                                    className="bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800"
                                >
                                    {pkg.WinningContractorID ? (
                                        <button
                                            onClick={() => setIsCreatingContract(true)}
                                            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            <FileSignature className="w-4 h-4" />
                                            Tạo hợp đồng
                                        </button>
                                    ) : (
                                        <p className="text-xs text-warning-500 dark:text-warning-400 mt-3">
                                            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                                            Cần chọn nhà thầu trúng thầu trước khi tạo hợp đồng
                                        </p>
                                    )}
                                </EmptyState>
                            )}

                            {!relatedContract && isCreatingContract && (
                                <SectionCard title="Tạo hợp đồng" icon={FileSignature} color="blue">
                                    <ContractFormInline
                                        packageData={pkg}
                                        contractorName={winningContractor?.FullName}
                                        onSaved={() => setIsCreatingContract(false)}
                                        onCancel={() => setIsCreatingContract(false)}
                                    />
                                </SectionCard>
                            )}
                        </div>
                    )}

                    {/* Tab 4: Thanh quyết toán */}
                    {activeTab === 'settlement' && (
                        <div className="space-y-6">
                            {/* Tổng hợp giá trị */}
                            <SectionCard title="Tổng hợp giá trị" icon={Package} color="slate">
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Giá gói thầu</p>
                                        <p className="font-bold text-gray-800 dark:text-slate-100">{formatCurrency(pkg.Price)}</p>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Giá trúng thầu</p>
                                        <p className="font-bold text-green-600 dark:text-green-400">{pkg.WinningPrice ? formatCurrency(pkg.WinningPrice) : '-'}</p>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Giá trị HĐ (sau ĐC)</p>
                                        <p className="font-bold text-blue-600 dark:text-blue-400">{relatedContract ? formatCurrency(contractValue) : '-'}</p>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Tiết kiệm</p>
                                        <p className="font-bold text-purple-600 dark:text-purple-400">
                                            {savings > 0 ? `${formatCurrency(savings)} (${savingsPercent}%)` : '-'}
                                        </p>
                                    </div>
                                </div>
                            </SectionCard>

                            {relatedContract ? (
                                <>
                                    {/* Tiến độ thanh toán */}
                                    <SectionCard title="Tiến độ thanh toán" icon={DollarSign} color="emerald">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</span>
                                                <span className="text-gray-400 dark:text-slate-400"> / </span>
                                                <span className="text-gray-600 dark:text-slate-300">{formatCurrency(contractValue)}</span>
                                            </div>
                                            <span className="text-lg font-bold text-green-600 dark:text-green-400">{paymentProgress.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                                                style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-sm mt-2">
                                            <span className="text-gray-500 dark:text-slate-400">Đã thanh toán</span>
                                            <span className="text-warning-600 dark:text-warning-400 font-medium">Còn lại: {formatCurrency(contractValue - totalPaid)}</span>
                                        </div>
                                    </SectionCard>

                                    {/* Danh sách đợt thanh toán */}
                                    <SectionCard title="Danh sách đợt thanh toán" icon={Receipt} color="gray" badge={`${relatedPayments.length} đợt`}>
                                        {relatedPayments.length > 0 ? (
                                            <div className="space-y-3">
                                                {relatedPayments.map((payment, idx) => {
                                                    const sc = PaymentService.getStatusColor(payment.Status);
                                                    const transitions = PaymentService.getAvailableTransitions(payment.Status);
                                                    return (
                                                        <div key={payment.PaymentID} className="p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                                                                        <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-800 dark:text-slate-200">Đợt {idx + 1}: {payment.Type === 'Advance' ? 'Tạm ứng' : 'Khối lượng'}</p>
                                                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                                                            {payment.RequestDate ? `Ngày ĐN: ${formatDate(payment.RequestDate)}` : 'Chưa gửi duyệt'}
                                                                            {payment.TreasuryRef ? ` • KB: ${payment.TreasuryRef}` : ''}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold text-gray-800 dark:text-slate-100">{formatCurrency(payment.Amount)}</p>
                                                                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ring-1 ${sc.bg} ${sc.text} ${sc.ring} ${sc.darkBg} ${sc.darkText} ${sc.darkRing}`}>
                                                                        {PaymentService.getStatusLabel(payment.Status)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Approval info */}
                                                            {payment.ApprovedBy && (
                                                                <p className="text-xs text-blue-600 dark:text-blue-400 ml-11">✓ Duyệt bởi: {payment.ApprovedBy} {payment.ApprovedDate ? `(${formatDate(payment.ApprovedDate)})` : ''}</p>
                                                            )}
                                                            {payment.PaidDate && (
                                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 ml-11">✓ Chuyển tiền: {formatDate(payment.PaidDate)}</p>
                                                            )}
                                                            {payment.Status === PaymentStatus.Rejected && payment.RejectedReason && (
                                                                <div className="ml-11 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                                                    <p className="text-xs text-red-600 dark:text-red-400">✗ Từ chối: {payment.RejectedReason}</p>
                                                                    <p className="text-[10px] text-red-400 dark:text-red-500">{payment.RejectedBy} {payment.RejectedDate ? `— ${formatDate(payment.RejectedDate)}` : ''}</p>
                                                                </div>
                                                            )}

                                                            {/* Attachments */}
                                                            <div className="ml-11">
                                                                <DocumentAttachments relatedType="payment" relatedId={String(payment.PaymentID)} compact />
                                                            </div>

                                                            {/* Action buttons */}
                                                            {transitions.length > 0 && (
                                                                <PaymentActions payment={payment} transitions={transitions} />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : null}

                                        {/* Nút thêm đợt thanh toán */}
                                        {isAddingPayment ? (
                                            <PaymentFormInline
                                                contractId={relatedContract.ContractID}
                                                projectId={pkg.ProjectID}
                                                contractValue={contractValue}
                                                totalPaid={totalPaid}
                                                onSaved={() => setIsAddingPayment(false)}
                                                onCancel={() => setIsAddingPayment(false)}
                                            />
                                        ) : (
                                            <button
                                                onClick={() => setIsAddingPayment(true)}
                                                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-500 dark:text-slate-400 hover:border-green-400 hover:text-green-600 dark:hover:border-green-500 dark:hover:text-green-400 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <DollarSign className="w-4 h-4" />
                                                + Thêm đợt thanh toán
                                            </button>
                                        )}
                                    </SectionCard>

                                    {/* Nghiệm thu — component thật */}
                                    <SectionCard title="" icon={CheckCircle2} color="green">
                                        <AcceptanceSection contractId={relatedContract.ContractID} />
                                    </SectionCard>

                                    {/* Quyết toán + Bảo hành — component thật */}
                                    <SectionCard title="" icon={Calculator} color="blue">
                                        <SettlementSection
                                            contractId={relatedContract.ContractID}
                                            contractValue={contractValue}
                                            totalPaid={totalPaid}
                                            packageField={pkg.Field}
                                        />
                                    </SectionCard>
                                </>
                            ) : (
                                <EmptyState
                                    icon={<AlertTriangle className="w-10 h-10 text-warning-500 dark:text-warning-600" />}
                                    title="Chưa có hợp đồng"
                                    description="Cần tạo hợp đồng ở tab &quot;Hợp đồng&quot; trước khi quản lý thanh quyết toán"
                                    className="bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
    );

    if (asSlidePanel) {
        return content;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />
            {content}
        </div>
    );
};

// ========================================
// Helper Components
// ========================================

const SectionCard = ({ title, icon: Icon, color, children, badge }: {
    title: string;
    icon: React.ElementType;
    color: string;
    children?: React.ReactNode;
    badge?: string;
}) => {
    const colorMap: Record<string, string> = {
        blue: 'text-blue-600 dark:text-blue-400',
        green: 'text-green-600 dark:text-green-400',
        purple: 'text-purple-600 dark:text-purple-400',
        indigo: 'text-primary-600 dark:text-primary-400',
        yellow: 'text-primary-600 dark:text-warning-400',
        cyan: 'text-cyan-600 dark:text-cyan-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        gray: 'text-gray-600 dark:text-slate-400',
        slate: 'text-slate-600 dark:text-slate-400',
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${colorMap[color] || 'text-gray-500 dark:text-slate-400'}`} />
                    {title}
                </h4>
                {badge && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">{badge}</span>
                )}
            </div>
            <div className="space-y-2 text-sm">{children}</div>
        </div>
    );
};

const InfoRow = ({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
    <div className={`flex justify-between py-1.5 ${highlight ? 'bg-warning-50 dark:bg-warning-900/20 -mx-2 px-2 rounded' : ''}`}>
        <span className="text-gray-500 dark:text-slate-400">{label}</span>
        <span className={`font-medium text-gray-800 dark:text-slate-200 text-right ${highlight ? 'text-warning-600 dark:text-warning-400' : ''}`}>{value || '-'}</span>
    </div>
);

// ========================================
// PaymentActions — Status transition buttons
// ========================================
import { Payment as PaymentType2, PaymentStatus as PS } from '../../../types';

const PaymentActions = ({ payment, transitions }: { payment: PaymentType2; transitions: PS[] }) => {
    const { user } = useAuth();
    const submitMutation = useSubmitPayment();
    const approveMutation = useApprovePayment();
    const transferMutation = useTransferPayment();
    const rejectMutation = useRejectPayment();
    const revertMutation = useRevertPaymentToDraft();
    const deleteMutation = useDeletePayment();
    const [showRejectInput, setShowRejectInput] = React.useState(false);
    const [rejectReason, setRejectReason] = React.useState('');
    const [treasuryRef, setTreasuryRef] = React.useState('');
    const [showTransferInput, setShowTransferInput] = React.useState(false);

    const isPending = submitMutation.isPending || approveMutation.isPending || transferMutation.isPending || rejectMutation.isPending || revertMutation.isPending || deleteMutation.isPending;
    const userName = user?.FullName || user?.Username || 'System';

    const btnBase = 'px-2.5 py-1 text-xs font-medium rounded-lg transition-all disabled:opacity-50 flex items-center gap-1';

    return (
        <div className="ml-11 space-y-2">
            {/* Reject reason input */}
            {showRejectInput && (
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Lý do từ chối..."
                        className="flex-1 px-2.5 py-1.5 text-xs border border-red-200 dark:border-red-800 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-red-500/20 outline-none"
                        autoFocus
                    />
                    <button
                        onClick={() => {
                            if (rejectReason.trim()) {
                                rejectMutation.mutate({ id: payment.PaymentID, rejectedBy: userName, reason: rejectReason });
                                setShowRejectInput(false);
                                setRejectReason('');
                            }
                        }}
                        disabled={!rejectReason.trim() || isPending}
                        className={`${btnBase} bg-red-600 hover:bg-red-700 text-white`}
                    >Xác nhận</button>
                    <button onClick={() => { setShowRejectInput(false); setRejectReason(''); }} className={`${btnBase} text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700`}>Hủy</button>
                </div>
            )}

            {/* Transfer treasury ref input */}
            {showTransferInput && (
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={treasuryRef}
                        onChange={e => setTreasuryRef(e.target.value)}
                        placeholder="Mã giao dịch kho bạc (tùy chọn)..."
                        className="flex-1 px-2.5 py-1.5 text-xs border border-emerald-200 dark:border-emerald-800 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        autoFocus
                    />
                    <button
                        onClick={() => {
                            transferMutation.mutate({ id: payment.PaymentID, treasuryRef: treasuryRef || undefined });
                            setShowTransferInput(false);
                            setTreasuryRef('');
                        }}
                        disabled={isPending}
                        className={`${btnBase} bg-emerald-600 hover:bg-emerald-700 text-white`}
                    >Xác nhận</button>
                    <button onClick={() => { setShowTransferInput(false); setTreasuryRef(''); }} className={`${btnBase} text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700`}>Hủy</button>
                </div>
            )}

            {/* Action buttons row */}
            {!showRejectInput && !showTransferInput && (
                <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Draft → Pending */}
                    {transitions.includes(PaymentStatus.Pending) && (
                        <button onClick={() => submitMutation.mutate(payment.PaymentID)} disabled={isPending} className={`${btnBase} bg-primary-500 hover:bg-primary-600 text-white`}>
                            <Clock className="w-3 h-3" /> Gửi duyệt
                        </button>
                    )}

                    {/* Pending → Approved */}
                    {transitions.includes(PaymentStatus.Approved) && (
                        <button onClick={() => approveMutation.mutate({ id: payment.PaymentID, approvedBy: userName })} disabled={isPending} className={`${btnBase} bg-primary-600 hover:bg-primary-500 text-white`}>
                            <CheckCircle2 className="w-3 h-3" /> Duyệt
                        </button>
                    )}

                    {/* Approved → Transferred */}
                    {transitions.includes(PaymentStatus.Transferred) && (
                        <button onClick={() => setShowTransferInput(true)} disabled={isPending} className={`${btnBase} bg-emerald-600 hover:bg-emerald-700 text-white`}>
                            <Banknote className="w-3 h-3" /> Chuyển tiền
                        </button>
                    )}

                    {/* Rejected → Draft */}
                    {transitions.includes(PaymentStatus.Draft) && (
                        <button onClick={() => revertMutation.mutate(payment.PaymentID)} disabled={isPending} className={`${btnBase} bg-slate-50 dark:bg-slate-8000 hover:bg-slate-600 text-white`}>
                            <Edit className="w-3 h-3" /> Sửa lại
                        </button>
                    )}

                    {/* Reject button (from Pending or Approved) */}
                    {transitions.includes(PaymentStatus.Rejected) && (
                        <button onClick={() => setShowRejectInput(true)} disabled={isPending} className={`${btnBase} text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800`}>
                            <X className="w-3 h-3" /> Từ chối
                        </button>
                    )}

                    {/* Delete (only Draft) */}
                    {payment.Status === PaymentStatus.Draft && (
                        <button
                            onClick={() => { if (confirm('Xóa đợt thanh toán này?')) deleteMutation.mutate(payment.PaymentID); }}
                            disabled={isPending}
                            className={`${btnBase} text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20`}
                        >
                            <X className="w-3 h-3" /> Xóa
                        </button>
                    )}

                    {/* Loading indicator */}
                    {isPending && <span className="text-xs text-gray-400 animate-pulse">Đang xử lý...</span>}
                </div>
            )}
        </div>
    );
};

export default BiddingPackageDetail;

