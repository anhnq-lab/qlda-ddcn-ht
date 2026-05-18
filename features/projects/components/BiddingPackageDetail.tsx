import React, { useState, useCallback } from 'react';
import {
    X, ExternalLink, Building2, Banknote, Clock, Award,
    Receipt, Edit, ArrowLeft, BarChart3, Users,
    AlertTriangle, CheckCircle2, Phone, Mail, MapPin, Target, DollarSign,
    ClipboardList, Gavel, FileSignature, Calculator, Package,
    Plus, Trash2, Save, UserCheck, TrendingDown, Globe, BadgeCheck,
    CalendarDays, ChevronRight,
} from 'lucide-react';
import { BiddingPackage, PackageStatus, ContractStatus, PaymentStatus, PackagePersonnel } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/format';
import { useContracts } from '../../../hooks/useContracts';
import { usePayments, useSubmitPayment, useApprovePayment, useTransferPayment, useRejectPayment, useRevertPaymentToDraft, useDeletePayment } from '../../../hooks/usePayments';
import { useContractors } from '../../../hooks/useContractors';
import { PaymentService } from '../../../services/PaymentService';
import { useAuth } from '../../../context/AuthContext';
import { WinningContractorSelector } from './WinningContractorSelector';
import { BidderListSection } from './BidderEvaluationSection';
import { ContractFormInline } from './ContractFormInline';
import { PaymentFormInline } from './PaymentFormInline';
import { useVariationOrders } from '../../../hooks/useVariationOrders';
import { AcceptanceSection } from './AcceptanceSection';
import { DocumentAttachments } from '../../../components/common/DocumentAttachments';
import { SettlementSection } from './SettlementSection';
import ContractDetail from '../../contracts/ContractDetail';
import { useSlidePanel } from '../../../context/SlidePanelContext';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ProjectService } from '../../../services/ProjectService';

// ========================================
// BIDDING PACKAGE DETAIL — Vòng đời quản lý gói thầu
// 3 trạng thái: Lựa chọn nhà thầu → Đang thực hiện → Kết thúc
// 4 tab: Tổng quan | Nhà thầu | Hợp đồng | Thanh quyết toán
// ========================================

interface BiddingPackageDetailProps {
    isOpen: boolean;
    onClose: () => void;
    package_data: BiddingPackage | null;
    onEdit?: (pkg: BiddingPackage) => void;
    initialTab?: TabType;
    asSlidePanel?: boolean;
}

type TabType = 'overview' | 'contractor' | 'contract' | 'settlement';

const getStatusConfig = (status: PackageStatus) => {
    const configs = {
        [PackageStatus.Selection]: { label: 'Lựa chọn nhà thầu', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700', dot: 'bg-blue-500' },
        [PackageStatus.Execution]: { label: 'Đang thực hiện', bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700', dot: 'bg-green-500' },
        [PackageStatus.Completed]: { label: 'Kết thúc', bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-600 dark:text-slate-300', border: 'border-gray-200 dark:border-slate-600', dot: 'bg-gray-400' },
    };
    return configs[status] || configs[PackageStatus.Selection];
};

const FIELD_LABELS: Record<string, string> = {
    Construction: 'Xây lắp', Consultancy: 'Tư vấn', NonConsultancy: 'Phi tư vấn',
    Goods: 'Hàng hóa', Mixed: 'Hỗn hợp',
};
const METHOD_LABELS: Record<string, string> = {
    OpenBidding: 'Đấu thầu rộng rãi', LimitedBidding: 'Đấu thầu hạn chế',
    Appointed: 'Chỉ định thầu', CompetitiveShopping: 'Chào hàng cạnh tranh',
    DirectProcurement: 'Mua sắm trực tiếp', SelfExecution: 'Tự thực hiện',
    CommunityParticipation: 'Cộng đồng tham gia',
};
const PROCEDURE_LABELS: Record<string, string> = {
    OneStageOneEnvelope: '1 giai đoạn 1 túi hồ sơ', OneStageTwoEnvelope: '1 giai đoạn 2 túi hồ sơ',
    TwoStageOneEnvelope: '2 giai đoạn 1 túi hồ sơ', TwoStageTwoEnvelope: '2 giai đoạn 2 túi hồ sơ',
    Reduced: 'Rút gọn', Normal: 'Thông thường',
};
const CONTRACT_TYPE_LABELS: Record<string, string> = {
    LumpSum: 'Trọn gói', UnitPrice: 'Đơn giá cố định', AdjustableUnitPrice: 'Đơn giá điều chỉnh',
    TimeBased: 'Theo thời gian', Percentage: 'Theo tỷ lệ phần trăm', Mixed: 'Hỗn hợp',
};

export const BiddingPackageDetail: React.FC<BiddingPackageDetailProps> = ({
    isOpen,
    onClose,
    package_data: pkg,
    onEdit,
    initialTab,
    asSlidePanel,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'overview');
    const [isCreatingContract, setIsCreatingContract] = useState(false);
    const [isEditingContract, setIsEditingContract] = useState(false);
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [personnelList, setPersonnelList] = useState<PackagePersonnel[]>([]);
    const [personnelLoaded, setPersonnelLoaded] = useState(false);
    const [isSavingPersonnel, setIsSavingPersonnel] = useState(false);
    const { openPanel } = useSlidePanel();

    React.useEffect(() => {
        if (initialTab) setActiveTab(initialTab as TabType);
    }, [initialTab]);

    // Load personnel from pkg when pkg changes
    React.useEffect(() => {
        if (pkg) {
            setPersonnelList(pkg.Personnel || []);
            setPersonnelLoaded(true);
        }
    }, [pkg?.PackageID]);

    // All hooks before conditional return
    const { contracts } = useContracts();
    const { payments } = usePayments();
    const { contractors } = useContractors();

    const relatedContractInit = contracts.find(c => c.PackageID === pkg?.PackageID);
    const { variationOrders } = useVariationOrders(relatedContractInit?.ContractID || '');

    if (!isOpen || !pkg) return null;

    const statusConfig = getStatusConfig(pkg.Status);
    const relatedContract = relatedContractInit;
    const relatedPayments = payments.filter(p => relatedContract && p.ContractID === relatedContract.ContractID);
    const winningContractor = pkg.WinningContractorID ? contractors.find(c => c.ContractorID === pkg.WinningContractorID) : null;

    const sumVariationOrders = variationOrders.reduce((sum, vo) => sum + (vo.AdjustedAmount || 0), 0);
    const baseContractValue = relatedContract ? relatedContract.Value : 0;
    const contractValue = baseContractValue + sumVariationOrders;

    const totalPaid = relatedPayments
        .filter(p => p.Status === PaymentStatus.Transferred)
        .reduce((sum, p) => sum + p.Amount, 0);
    const paymentProgress = contractValue > 0 ? (totalPaid / contractValue) * 100 : 0;

    const savings = pkg.WinningPrice && pkg.Price ? pkg.Price - pkg.WinningPrice : 0;
    const savingsPercent = pkg.Price && savings > 0 ? ((savings / pkg.Price) * 100).toFixed(1) : '0';

    const savePersonnel = async (list: PackagePersonnel[]) => {
        setIsSavingPersonnel(true);
        try {
            await ProjectService.updatePackage(pkg.PackageID, { Personnel: list });
        } finally {
            setIsSavingPersonnel(false);
        }
    };

    const addPersonnel = () => {
        const newList = [...personnelList, { name: '', title: '', role: '', certNo: '' }];
        setPersonnelList(newList);
    };

    const updatePersonnel = (idx: number, field: keyof PackagePersonnel, value: string) => {
        const updated = personnelList.map((p, i) => i === idx ? { ...p, [field]: value } : p);
        setPersonnelList(updated);
    };

    const removePersonnel = (idx: number) => {
        const updated = personnelList.filter((_, i) => i !== idx);
        setPersonnelList(updated);
        savePersonnel(updated);
    };

    const tabs = [
        { id: 'overview' as TabType, label: 'Tổng quan', icon: BarChart3 },
        { id: 'contractor' as TabType, label: 'Nhà thầu', icon: Users },
        { id: 'contract' as TabType, label: 'Hợp đồng', icon: FileSignature },
        { id: 'settlement' as TabType, label: 'Thanh quyết toán', icon: Calculator },
    ];

    const content = (
        <div className={asSlidePanel ? 'flex flex-col h-full bg-white dark:bg-slate-800' : 'relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm w-full max-w-6xl max-h-[95vh] overflow-hidden animate-scale-in flex flex-col'}>
            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 via-blue-50 to-primary-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        {!asSlidePanel && (
                            <button onClick={onClose} className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 mb-2">
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại danh sách
                            </button>
                        )}
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl font-bold text-gray-800 dark:text-slate-100">{pkg.PackageNumber}</span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                                {statusConfig.label}
                            </span>
                            {pkg.Field && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${pkg.Field === 'Construction' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700' : pkg.Field === 'Consultancy' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700' : 'bg-slate-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600'}`}>
                                    {FIELD_LABELS[pkg.Field] || pkg.Field}
                                </span>
                            )}
                        </div>
                        <h2 className="text-base text-gray-600 dark:text-slate-400 leading-relaxed max-w-4xl line-clamp-2">{pkg.PackageName}</h2>
                        <div className="flex items-center gap-3 mt-3">
                            {pkg.NotificationCode && (
                                <a href={`https://muasamcong.mpi.gov.vn/web/guest/contractor-selection?type=es-contractor-selection&noticeNo=${pkg.NotificationCode}`} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-500 transition-colors">
                                    <ExternalLink className="w-3.5 h-3.5" /> Xem trên muasamcong.vn
                                </a>
                            )}
                            {onEdit && (
                                <button onClick={() => onEdit(pkg)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                                    <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                                </button>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="shrink-0 flex border-b border-gray-200 dark:border-slate-700 px-6 bg-slate-50 dark:bg-slate-800">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-800' : 'text-gray-400 dark:text-slate-600 border-transparent hover:text-gray-800 dark:hover:text-slate-200'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900">

                {/* ===== TAB: TỔNG QUAN ===== */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        {/* Phần A: Thông tin chung */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SectionCard title="Kế hoạch lựa chọn nhà thầu" icon={ClipboardList} color="blue">
                                <InfoRow label="Mã KHLCNT" value={pkg.KHLCNTCode ? <span className="font-mono">{pkg.KHLCNTCode}</span> : '-'} />
                                <InfoRow label="QĐ phê duyệt KHLCNT" value={pkg.DecisionNumber || '-'} />
                                <InfoRow label="Ngày phê duyệt" value={pkg.DecisionDate ? formatDate(pkg.DecisionDate) : '-'} />
                                <div className="border-t border-gray-100 dark:border-slate-700 my-2" />
                                <InfoRow label="Giá gói thầu" value={<span className="font-bold text-gray-900 dark:text-slate-100">{formatCurrency(pkg.Price)}</span>} />
                                <InfoRow label="Nguồn vốn" value={pkg.FundingSource || 'Ngân sách Nhà nước'} />
                                <InfoRow label="Thời gian thực hiện" value={pkg.Duration || '-'} />
                            </SectionCard>

                            <SectionCard title="Phương thức & Hình thức" icon={Gavel} color="purple">
                                <InfoRow label="Lĩnh vực" value={FIELD_LABELS[pkg.Field || ''] || pkg.Field || '-'} />
                                <InfoRow label="Hình thức LCNT" value={METHOD_LABELS[pkg.SelectionMethod] || pkg.SelectionMethod || '-'} />
                                <InfoRow label="Phương thức" value={PROCEDURE_LABELS[pkg.SelectionProcedure || ''] || pkg.SelectionProcedure || '-'} />
                                <InfoRow label="Loại hợp đồng" value={CONTRACT_TYPE_LABELS[pkg.ContractType] || pkg.ContractType || '-'} />
                                <InfoRow label="Hình thức đấu thầu" value={
                                    <span className={pkg.BidType === 'Online' ? 'text-blue-600 dark:text-blue-400' : ''}>
                                        {pkg.BidType === 'Online' ? '🌐 Qua mạng (E-Bidding)' : '📋 Trực tiếp'}
                                    </span>
                                } />
                            </SectionCard>
                        </div>

                        {/* Phần B: Tình hình thực hiện — context-aware theo Status */}
                        {pkg.Status === PackageStatus.Selection && (
                            <SectionCard title="Tiến trình lựa chọn nhà thầu" icon={CalendarDays} color="indigo">
                                <div className="relative">
                                    {/* Timeline */}
                                    <div className="flex items-start gap-0 overflow-x-auto pb-2">
                                        {[
                                            { label: 'Đăng tải TBMT', date: pkg.PostingDate, done: !!pkg.PostingDate, active: !!pkg.PostingDate && !pkg.BidClosingDate },
                                            { label: 'Đóng thầu', date: pkg.BidClosingDate, done: !!pkg.BidClosingDate, active: !!pkg.BidClosingDate && !pkg.BidOpeningDate },
                                            { label: 'Mở thầu', date: pkg.BidOpeningDate, done: !!pkg.BidOpeningDate, active: !!pkg.BidOpeningDate && !pkg.ApprovalDate_Result },
                                            { label: 'Phê duyệt KQLCNT', date: pkg.ApprovalDate_Result, done: !!pkg.ApprovalDate_Result, active: !!pkg.ApprovalDate_Result },
                                        ].map((step, idx, arr) => (
                                            <div key={idx} className="flex items-center flex-1 min-w-0">
                                                <div className="flex flex-col items-center flex-1 min-w-0">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 ${step.done ? 'bg-green-500 border-green-500 text-white' : step.active ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400'}`}>
                                                        {step.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                                    </div>
                                                    <p className={`text-xs mt-1.5 font-medium text-center ${step.done ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'}`}>{step.label}</p>
                                                    <p className="text-[11px] text-gray-400 dark:text-slate-500 text-center">{step.date ? formatDate(step.date) : '—'}</p>
                                                </div>
                                                {idx < arr.length - 1 && (
                                                    <div className={`h-0.5 w-full mt-[-28px] mx-1 ${step.done ? 'bg-green-400' : 'bg-gray-200 dark:bg-slate-700'}`} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {pkg.NotificationCode && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                                        <InfoRow label="Mã TBMT" value={<span className="font-mono text-blue-600 dark:text-blue-400">{pkg.NotificationCode}</span>} />
                                    </div>
                                )}
                                {!pkg.PostingDate && !pkg.NotificationCode && (
                                    <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-3">Chưa có thông tin tiến trình lựa chọn nhà thầu</p>
                                )}
                            </SectionCard>
                        )}

                        {pkg.Status === PackageStatus.Execution && (
                            <SectionCard title="Tình hình thực hiện" icon={TrendingDown} color="green">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    <StatBox label="Giá gói thầu" value={formatCurrency(pkg.Price)} color="slate" />
                                    <StatBox label="Giá trúng thầu" value={pkg.WinningPrice ? formatCurrency(pkg.WinningPrice) : '-'} color="green" />
                                    <StatBox label="Giá trị HĐ (sau ĐC)" value={relatedContract ? formatCurrency(contractValue) : '-'} color="blue" />
                                    <StatBox label="Tiết kiệm" value={savings > 0 ? `${formatCurrency(savings)}` : '-'} sub={savings > 0 ? `${savingsPercent}%` : undefined} color="purple" />
                                </div>
                                {relatedContract ? (
                                    <>
                                        <div className="mb-2">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-500 dark:text-slate-400">Tiến độ thanh toán</span>
                                                <span className="font-bold text-green-600 dark:text-green-400">{paymentProgress.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(paymentProgress, 100)}%` }} />
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 mt-1">
                                                <span>Đã TT: {formatCurrency(totalPaid)}</span>
                                                <span>Còn lại: {formatCurrency(contractValue - totalPaid)}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={() => setActiveTab('contract')} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                                Hợp đồng <ChevronRight className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => setActiveTab('settlement')} className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline">
                                                Thanh quyết toán <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-3">
                                        <AlertTriangle className="w-5 h-5 text-warning-500 mx-auto mb-1" />
                                        <p className="text-sm text-gray-400 dark:text-slate-500">Chưa có hợp đồng —
                                            <button onClick={() => setActiveTab('contract')} className="text-blue-600 dark:text-blue-400 hover:underline ml-1">Tạo hợp đồng</button>
                                        </p>
                                    </div>
                                )}
                            </SectionCard>
                        )}

                        {pkg.Status === PackageStatus.Completed && (
                            <SectionCard title="Tổng kết gói thầu" icon={BadgeCheck} color="emerald">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    <StatBox label="Giá gói thầu" value={formatCurrency(pkg.Price)} color="slate" />
                                    <StatBox label="Giá trúng thầu" value={pkg.WinningPrice ? formatCurrency(pkg.WinningPrice) : '-'} color="green" />
                                    <StatBox label="Tổng đã thanh toán" value={formatCurrency(totalPaid)} color="blue" />
                                    <StatBox label="Tiết kiệm" value={savings > 0 ? formatCurrency(savings) : '-'} sub={savings > 0 ? `${savingsPercent}%` : undefined} color="purple" />
                                </div>
                                {relatedContract && (
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <InfoRow label="Nhà thầu" value={winningContractor?.FullName || '-'} />
                                        <InfoRow label="Ngày ký HĐ" value={relatedContract.SignDate ? formatDate(relatedContract.SignDate) : '-'} />
                                        <InfoRow label="Trạng thái HĐ" value={
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${relatedContract.Status === ContractStatus.Liquidated ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'}`}>
                                                {relatedContract.Status === ContractStatus.Liquidated ? 'Đã thanh lý' : 'Đang thực hiện'}
                                            </span>
                                        } />
                                        <InfoRow label="Số đợt thanh toán" value={`${relatedPayments.length} đợt`} />
                                    </div>
                                )}
                            </SectionCard>
                        )}
                    </div>
                )}

                {/* ===== TAB: NHÀ THẦU ===== */}
                {activeTab === 'contractor' && (
                    <div className="space-y-4">
                        {/* Khi đang Lựa chọn nhà thầu: hiện danh sách + form chọn */}
                        {pkg.Status === PackageStatus.Selection && (
                            <>
                                <SectionCard title="Kết quả lựa chọn nhà thầu" icon={Award} color="green">
                                    <WinningContractorSelector packageId={pkg.PackageID} />
                                    {pkg.WinningPrice ? (
                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                                            <InfoRow label="Giá trúng thầu" value={<span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(pkg.WinningPrice)}</span>} />
                                            <InfoRow label="Tiết kiệm" value={savings > 0 ? <span className="text-blue-600 dark:text-blue-400">{formatCurrency(savings)} ({savingsPercent}%)</span> : '-'} />
                                            <InfoRow label="Ngày phê duyệt KQLCNT" value={pkg.ApprovalDate_Result ? formatDate(pkg.ApprovalDate_Result) : '-'} />
                                        </div>
                                    ) : null}
                                </SectionCard>
                                <SectionCard title="Danh sách nhà thầu tham dự" icon={Users} color="blue">
                                    <BidderListSection packageId={pkg.PackageID} />
                                </SectionCard>
                            </>
                        )}

                        {/* Khi Đang thực hiện / Kết thúc: hiện profile nhà thầu + nhân sự */}
                        {(pkg.Status === PackageStatus.Execution || pkg.Status === PackageStatus.Completed) && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Profile nhà thầu */}
                                    <SectionCard title="Thông tin nhà thầu" icon={Building2} color="green">
                                        {winningContractor ? (
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                                                        <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-slate-100 leading-tight">{winningContractor.FullName}</p>
                                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{FIELD_LABELS[winningContractor.ContractorType] || winningContractor.ContractorType}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5 text-sm">
                                                    <InfoRow label="Mã số thuế" value={winningContractor.TaxCode || winningContractor.ContractorID} />
                                                    {winningContractor.Representative && <InfoRow label="Người đại diện" value={winningContractor.Representative} />}
                                                    {winningContractor.ContactInfo && (
                                                        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 py-1">
                                                            <Phone className="w-3.5 h-3.5 shrink-0" />
                                                            <span>{winningContractor.ContactInfo}</span>
                                                        </div>
                                                    )}
                                                    {winningContractor.Email && (
                                                        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 py-1">
                                                            <Mail className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="truncate">{winningContractor.Email}</span>
                                                        </div>
                                                    )}
                                                    {winningContractor.Address && (
                                                        <div className="flex items-start gap-2 text-gray-500 dark:text-slate-400 py-1">
                                                            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                            <span>{winningContractor.Address}</span>
                                                        </div>
                                                    )}
                                                    {winningContractor.Website && (
                                                        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 py-1">
                                                            <Globe className="w-3.5 h-3.5 shrink-0" />
                                                            <a href={winningContractor.Website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">{winningContractor.Website}</a>
                                                        </div>
                                                    )}
                                                    {winningContractor.CapCertCode && <InfoRow label="Chứng chỉ NL" value={winningContractor.CapCertCode} />}
                                                </div>
                                            </div>
                                        ) : (
                                            <EmptyState icon={<Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600" />} title="Chưa có nhà thầu" className="bg-transparent border-0 shadow-none py-6" />
                                        )}
                                    </SectionCard>

                                    {/* Kết quả trúng thầu */}
                                    <SectionCard title="Kết quả trúng thầu" icon={Award} color="blue">
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-center">
                                                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Giá gói thầu</p>
                                                <p className="font-bold text-gray-700 dark:text-slate-200 text-sm">{formatCurrency(pkg.Price)}</p>
                                            </div>
                                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                                                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Giá trúng thầu</p>
                                                <p className="font-bold text-green-600 dark:text-green-400 text-sm">{pkg.WinningPrice ? formatCurrency(pkg.WinningPrice) : '-'}</p>
                                            </div>
                                        </div>
                                        {savings > 0 && (
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-3 flex items-center justify-between">
                                                <span className="text-sm text-blue-700 dark:text-blue-300">Tiết kiệm ngân sách</span>
                                                <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(savings)} <span className="text-xs">({savingsPercent}%)</span></span>
                                            </div>
                                        )}
                                        <InfoRow label="QĐ phê duyệt KQLCNT" value={pkg.DecisionNumber || '-'} />
                                        <InfoRow label="Ngày phê duyệt" value={pkg.ApprovalDate_Result ? formatDate(pkg.ApprovalDate_Result) : '-'} />
                                        {pkg.DecisionAgency && <InfoRow label="Cơ quan phê duyệt" value={pkg.DecisionAgency} />}
                                    </SectionCard>
                                </div>

                                {/* Nhân sự tham gia gói thầu */}
                                <SectionCard title="Nhân sự nhà thầu tham gia gói thầu" icon={UserCheck} color="indigo"
                                    badge={personnelList.length > 0 ? `${personnelList.length} người` : undefined}
                                    action={
                                        <div className="flex items-center gap-2">
                                            {isSavingPersonnel && <span className="text-xs text-gray-400 animate-pulse">Đang lưu...</span>}
                                            <button onClick={addPersonnel} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium rounded-lg transition-colors">
                                                <Plus className="w-3.5 h-3.5" /> Thêm nhân sự
                                            </button>
                                        </div>
                                    }
                                >
                                    {personnelList.length === 0 ? (
                                        <div className="text-center py-6">
                                            <UserCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                            <p className="text-sm text-gray-400 dark:text-slate-500">Chưa có nhân sự được thêm</p>
                                            <button onClick={addPersonnel} className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">+ Thêm nhân sự đầu tiên</button>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-100 dark:border-slate-700">
                                                        <th className="text-left py-2 pr-3 text-xs font-medium text-gray-400 dark:text-slate-500 w-8">#</th>
                                                        <th className="text-left py-2 pr-3 text-xs font-medium text-gray-400 dark:text-slate-500">Họ và tên</th>
                                                        <th className="text-left py-2 pr-3 text-xs font-medium text-gray-400 dark:text-slate-500">Chức vụ</th>
                                                        <th className="text-left py-2 pr-3 text-xs font-medium text-gray-400 dark:text-slate-500">Vai trò trong GT</th>
                                                        <th className="text-left py-2 pr-3 text-xs font-medium text-gray-400 dark:text-slate-500">Số CCHN</th>
                                                        <th className="w-16" />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {personnelList.map((person, idx) => (
                                                        <tr key={idx} className="border-b border-gray-50 dark:border-slate-700/50 group">
                                                            <td className="py-1.5 pr-3 text-gray-400 dark:text-slate-500 text-xs">{idx + 1}</td>
                                                            <td className="py-1.5 pr-3">
                                                                <input value={person.name} onChange={e => updatePersonnel(idx, 'name', e.target.value)}
                                                                    onBlur={() => savePersonnel(personnelList)}
                                                                    placeholder="Nguyễn Văn A"
                                                                    className="w-full px-2 py-1 text-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-600 focus:border-blue-400 dark:focus:border-blue-500 rounded bg-transparent focus:bg-white dark:focus:bg-slate-800 outline-none transition-colors"
                                                                />
                                                            </td>
                                                            <td className="py-1.5 pr-3">
                                                                <input value={person.title} onChange={e => updatePersonnel(idx, 'title', e.target.value)}
                                                                    onBlur={() => savePersonnel(personnelList)}
                                                                    placeholder="Giám đốc dự án"
                                                                    className="w-full px-2 py-1 text-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-600 focus:border-blue-400 dark:focus:border-blue-500 rounded bg-transparent focus:bg-white dark:focus:bg-slate-800 outline-none transition-colors"
                                                                />
                                                            </td>
                                                            <td className="py-1.5 pr-3">
                                                                <input value={person.role} onChange={e => updatePersonnel(idx, 'role', e.target.value)}
                                                                    onBlur={() => savePersonnel(personnelList)}
                                                                    placeholder="Chỉ huy trưởng"
                                                                    className="w-full px-2 py-1 text-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-600 focus:border-blue-400 dark:focus:border-blue-500 rounded bg-transparent focus:bg-white dark:focus:bg-slate-800 outline-none transition-colors"
                                                                />
                                                            </td>
                                                            <td className="py-1.5 pr-3">
                                                                <input value={person.certNo || ''} onChange={e => updatePersonnel(idx, 'certNo', e.target.value)}
                                                                    onBlur={() => savePersonnel(personnelList)}
                                                                    placeholder="CCHN-..."
                                                                    className="w-full px-2 py-1 text-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-600 focus:border-blue-400 dark:focus:border-blue-500 rounded bg-transparent focus:bg-white dark:focus:bg-slate-800 outline-none transition-colors font-mono"
                                                                />
                                                            </td>
                                                            <td className="py-1.5">
                                                                <button onClick={() => removePersonnel(idx)}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-all rounded">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div className="mt-3 flex justify-end">
                                                <button onClick={() => savePersonnel(personnelList)} disabled={isSavingPersonnel}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                                                    <Save className="w-3.5 h-3.5" />
                                                    {isSavingPersonnel ? 'Đang lưu...' : 'Lưu danh sách'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </SectionCard>
                            </>
                        )}
                    </div>
                )}

                {/* ===== TAB: HỢP ĐỒNG ===== */}
                {activeTab === 'contract' && (
                    <div className="space-y-4">
                        {/* Tóm tắt nhà thầu + hợp đồng */}
                        <div className="grid grid-cols-2 gap-4">
                            <SectionCard title="Nhà thầu thực hiện" icon={Building2} color="green">
                                {winningContractor ? (
                                    <div className="space-y-2">
                                        <p className="font-semibold text-gray-800 dark:text-slate-100">{winningContractor.FullName}</p>
                                        <div className="text-sm text-gray-600 dark:text-slate-400 space-y-1.5">
                                            <p className="flex items-center gap-2"><Target className="w-3.5 h-3.5 text-gray-400" /> MST: {winningContractor.TaxCode || winningContractor.ContractorID}</p>
                                            {winningContractor.ContactInfo && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" />{winningContractor.ContactInfo}</p>}
                                            {winningContractor.Address && <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400" />{winningContractor.Address}</p>}
                                        </div>
                                    </div>
                                ) : (
                                    <EmptyState icon={<Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600" />} title="Chưa có nhà thầu" className="bg-transparent border-0 shadow-none py-6" />
                                )}
                            </SectionCard>

                            <SectionCard title="Thông tin hợp đồng" icon={FileSignature} color="blue">
                                {relatedContract && !isEditingContract ? (
                                    <div className="space-y-2">
                                        <InfoRow label="Số hợp đồng" value={
                                            <button onClick={() => openPanel({ title: `Hợp đồng ${relatedContract.ContractID}`, icon: <FileSignature className="w-5 h-5 text-blue-500" />, component: <ContractDetail contractId={relatedContract.ContractID} asSlidePanel={true} /> })}
                                                className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1">
                                                {relatedContract.ContractID} <ExternalLink className="w-3 h-3" />
                                            </button>
                                        } />
                                        <InfoRow label="Tên HĐ" value={relatedContract.ContractName || '-'} />
                                        <InfoRow label="Giá trị HĐ" value={<span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(relatedContract.Value)}</span>} />
                                        {variationOrders.length > 0 && <InfoRow label="Giá trị (sau ĐC)" value={<span className="font-bold text-sky-600 dark:text-sky-400">{formatCurrency(contractValue)}</span>} />}
                                        <InfoRow label="Ngày ký" value={relatedContract.SignDate ? formatDate(relatedContract.SignDate) : '-'} />
                                        <InfoRow label="Thời gian TH" value={pkg.Duration || '-'} />
                                        <InfoRow label="Tỷ lệ tạm ứng" value={relatedContract.AdvanceRate ? `${relatedContract.AdvanceRate}%` : '-'} />
                                        <InfoRow label="Bảo hành" value={relatedContract.Warranty ? `${relatedContract.Warranty} tháng` : '-'} />
                                        <InfoRow label="Trạng thái" value={
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${relatedContract.Status === ContractStatus.Executing ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' : relatedContract.Status === ContractStatus.Liquidated ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
                                                {relatedContract.Status === ContractStatus.Executing ? 'Đang thực hiện' : relatedContract.Status === ContractStatus.Liquidated ? 'Đã thanh lý' : 'Tạm dừng'}
                                            </span>
                                        } />
                                        <div className="pt-2 border-t border-gray-100 dark:border-slate-700 flex gap-2">
                                            <button onClick={() => setIsEditingContract(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                                <Edit className="w-3.5 h-3.5" /> Sửa hợp đồng
                                            </button>
                                        </div>
                                    </div>
                                ) : relatedContract && isEditingContract ? (
                                    <ContractFormInline packageData={pkg} contractorName={winningContractor?.FullName} existingContract={relatedContract} onSaved={() => setIsEditingContract(false)} onCancel={() => setIsEditingContract(false)} />
                                ) : null}
                            </SectionCard>
                        </div>

                        {/* Tạo hợp đồng nếu chưa có */}
                        {!relatedContract && !isCreatingContract && (
                            <EmptyState icon={<FileSignature className="w-10 h-10 text-warning-500 dark:text-warning-600" />} title="Chưa có hợp đồng" description="Tạo hợp đồng để quản lý thực hiện gói thầu" className="bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800">
                                {pkg.WinningContractorID ? (
                                    <button onClick={() => setIsCreatingContract(true)} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors">
                                        <FileSignature className="w-4 h-4" /> Tạo hợp đồng
                                    </button>
                                ) : (
                                    <p className="text-xs text-warning-500 dark:text-warning-400 mt-3"><AlertTriangle className="w-3.5 h-3.5 inline mr-1" />Cần chọn nhà thầu trúng thầu trước khi tạo hợp đồng</p>
                                )}
                            </EmptyState>
                        )}
                        {!relatedContract && isCreatingContract && (
                            <SectionCard title="Tạo hợp đồng" icon={FileSignature} color="blue">
                                <ContractFormInline packageData={pkg} contractorName={winningContractor?.FullName} onSaved={() => setIsCreatingContract(false)} onCancel={() => setIsCreatingContract(false)} />
                            </SectionCard>
                        )}

                        {/* Phụ lục điều chỉnh */}
                        {relatedContract && variationOrders.length > 0 && (
                            <SectionCard title="Phụ lục điều chỉnh hợp đồng" icon={Receipt} color="amber" badge={`${variationOrders.length} phụ lục`}>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100 dark:border-slate-700">
                                                <th className="text-left py-2 pr-3 text-xs font-medium text-gray-400 dark:text-slate-500">Số phụ lục</th>
                                                <th className="text-left py-2 pr-3 text-xs font-medium text-gray-400 dark:text-slate-500">Ngày ký</th>
                                                <th className="text-right py-2 text-xs font-medium text-gray-400 dark:text-slate-500">Điều chỉnh giá trị</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variationOrders.map((vo, idx) => (
                                                <tr key={idx} className="border-b border-gray-50 dark:border-slate-700/50">
                                                    <td className="py-2 pr-3 font-mono text-xs text-gray-700 dark:text-slate-300">{vo.Number || `PL-${idx + 1}`}</td>
                                                    <td className="py-2 pr-3 text-gray-500 dark:text-slate-400">{vo.SignDate ? formatDate(vo.SignDate) : '-'}</td>
                                                    <td className={`py-2 text-right font-medium ${(vo.AdjustedAmount || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {(vo.AdjustedAmount || 0) >= 0 ? '+' : ''}{formatCurrency(vo.AdjustedAmount || 0)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan={2} className="py-2 pr-3 text-sm font-medium text-gray-600 dark:text-slate-300">Tổng điều chỉnh</td>
                                                <td className={`py-2 text-right font-bold ${sumVariationOrders >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {sumVariationOrders >= 0 ? '+' : ''}{formatCurrency(sumVariationOrders)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </SectionCard>
                        )}

                        {/* File đính kèm hợp đồng */}
                        {relatedContract && (
                            <SectionCard title="Tài liệu đính kèm" icon={ClipboardList} color="slate">
                                <DocumentAttachments relatedType="contract" relatedId={relatedContract.ContractID} />
                            </SectionCard>
                        )}
                    </div>
                )}

                {/* ===== TAB: THANH QUYẾT TOÁN ===== */}
                {activeTab === 'settlement' && (
                    <div className="space-y-4">
                        {/* Tổng hợp giá trị */}
                        <SectionCard title="Tổng hợp giá trị" icon={Package} color="slate">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <StatBox label="Giá gói thầu" value={formatCurrency(pkg.Price)} color="slate" />
                                <StatBox label="Giá trúng thầu" value={pkg.WinningPrice ? formatCurrency(pkg.WinningPrice) : '-'} color="green" />
                                <StatBox label="Giá trị HĐ (sau ĐC)" value={relatedContract ? formatCurrency(contractValue) : '-'} color="blue" />
                                <StatBox label="Tiết kiệm" value={savings > 0 ? formatCurrency(savings) : '-'} sub={savings > 0 ? `${savingsPercent}%` : undefined} color="purple" />
                            </div>
                        </SectionCard>

                        {relatedContract ? (
                            <>
                                {/* Tiến độ thanh toán */}
                                <SectionCard title="Tiến độ thanh toán" icon={DollarSign} color="emerald">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</span>
                                            <span className="text-gray-400 dark:text-slate-500"> / </span>
                                            <span className="text-gray-600 dark:text-slate-300">{formatCurrency(contractValue)}</span>
                                        </div>
                                        <span className="text-lg font-bold text-green-600 dark:text-green-400">{paymentProgress.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(paymentProgress, 100)}%` }} />
                                    </div>
                                    <div className="flex justify-between text-sm mt-2">
                                        <span className="text-gray-400 dark:text-slate-500">Đã thanh toán</span>
                                        <span className="text-warning-600 dark:text-warning-400 font-medium">Còn lại: {formatCurrency(contractValue - totalPaid)}</span>
                                    </div>
                                </SectionCard>

                                {/* Danh sách đợt thanh toán */}
                                <SectionCard title="Danh sách đợt thanh toán" icon={Receipt} color="gray" badge={`${relatedPayments.length} đợt`}>
                                    {relatedPayments.length > 0 && (
                                        <div className="space-y-3 mb-3">
                                            {relatedPayments.map((payment, idx) => {
                                                const sc = PaymentService.getStatusColor(payment.Status);
                                                const transitions = PaymentService.getAvailableTransitions(payment.Status);
                                                return (
                                                    <div key={payment.PaymentID} className="p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                                                                    <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-800 dark:text-slate-200">Đợt {idx + 1}: {payment.Type === 'Advance' ? 'Tạm ứng' : 'Khối lượng'}</p>
                                                                    <p className="text-xs text-gray-400 dark:text-slate-500">
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
                                                        <div className="ml-11">
                                                            <DocumentAttachments relatedType="payment" relatedId={String(payment.PaymentID)} compact />
                                                        </div>
                                                        {transitions.length > 0 && <PaymentActions payment={payment} transitions={transitions} />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {/* Thêm đợt thanh toán */}
                                    {isAddingPayment ? (
                                        <PaymentFormInline contractId={relatedContract.ContractID} projectId={pkg.ProjectID} contractValue={contractValue} totalPaid={totalPaid} onSaved={() => setIsAddingPayment(false)} onCancel={() => setIsAddingPayment(false)} />
                                    ) : (
                                        <button onClick={() => setIsAddingPayment(true)} className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-500 dark:text-slate-400 hover:border-green-400 hover:text-green-600 dark:hover:border-green-500 dark:hover:text-green-400 transition-colors flex items-center justify-center gap-2">
                                            <DollarSign className="w-4 h-4" /> + Thêm đợt thanh toán
                                        </button>
                                    )}
                                </SectionCard>

                                {/* Nghiệm thu */}
                                <SectionCard title="" icon={CheckCircle2} color="green">
                                    <AcceptanceSection contractId={relatedContract.ContractID} />
                                </SectionCard>

                                {/* Quyết toán & Bảo hành */}
                                <SectionCard title="" icon={Calculator} color="blue">
                                    <SettlementSection contractId={relatedContract.ContractID} contractValue={contractValue} totalPaid={totalPaid} packageField={pkg.Field} />
                                </SectionCard>
                            </>
                        ) : (
                            <EmptyState icon={<AlertTriangle className="w-10 h-10 text-warning-500 dark:text-warning-600" />} title="Chưa có hợp đồng" description={'Cần tạo hợp đồng ở tab "Hợp đồng" trước khi quản lý thanh quyết toán'} className="bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800">
                                <button onClick={() => setActiveTab('contract')} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors">
                                    <FileSignature className="w-4 h-4" /> Đi tới tab Hợp đồng
                                </button>
                            </EmptyState>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    if (asSlidePanel) return content;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            {content}
        </div>
    );
};

// ========================================
// Helper Components
// ========================================

const SectionCard = ({ title, icon: Icon, color, children, badge, action }: {
    title: string;
    icon: React.ElementType;
    color: string;
    children?: React.ReactNode;
    badge?: string;
    action?: React.ReactNode;
}) => {
    const colorMap: Record<string, string> = {
        blue: 'text-blue-600 dark:text-blue-400',
        green: 'text-green-600 dark:text-green-400',
        purple: 'text-purple-600 dark:text-purple-400',
        indigo: 'text-primary-600 dark:text-primary-400',
        amber: 'text-amber-600 dark:text-amber-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        gray: 'text-gray-600 dark:text-slate-400',
        slate: 'text-slate-600 dark:text-slate-400',
    };
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            {title && (
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${colorMap[color] || 'text-gray-500 dark:text-slate-400'}`} />
                        {title}
                    </h4>
                    <div className="flex items-center gap-2">
                        {badge && <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">{badge}</span>}
                        {action}
                    </div>
                </div>
            )}
            <div className="space-y-2 text-sm">{children}</div>
        </div>
    );
};

const InfoRow = ({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
    <div className={`flex justify-between py-1.5 ${highlight ? 'bg-warning-50 dark:bg-warning-900/20 -mx-2 px-2 rounded' : ''}`}>
        <span className="text-gray-500 dark:text-slate-400 shrink-0 mr-3">{label}</span>
        <span className={`font-medium text-gray-800 dark:text-slate-200 text-right ${highlight ? 'text-warning-600 dark:text-warning-400' : ''}`}>{value || '-'}</span>
    </div>
);

const StatBox = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) => {
    const colorMap: Record<string, string> = {
        slate: 'bg-slate-50 dark:bg-slate-800/60 text-gray-700 dark:text-slate-200',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    };
    return (
        <div className={`p-3 rounded-lg text-center ${colorMap[color] || colorMap.slate}`}>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">{label}</p>
            <p className="font-bold text-sm leading-tight">{value}</p>
            {sub && <p className="text-xs mt-0.5 opacity-75">{sub}</p>}
        </div>
    );
};

// ========================================
// PaymentActions — Status transition buttons
// ========================================
import { Payment as PaymentType2, PaymentStatus as PS } from '../../../types';

const PaymentActions = ({ payment, transitions }: { payment: PaymentType2; transitions: PS[] }) => {
    const { currentUser: user } = useAuth();
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
            {showRejectInput && (
                <div className="flex items-center gap-2">
                    <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Lý do từ chối..."
                        className="flex-1 px-2.5 py-1.5 text-xs border border-red-200 dark:border-red-800 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-red-500/20 outline-none" autoFocus />
                    <button onClick={() => { if (rejectReason.trim()) { rejectMutation.mutate({ id: payment.PaymentID, rejectedBy: userName, reason: rejectReason }); setShowRejectInput(false); setRejectReason(''); } }} disabled={!rejectReason.trim() || isPending} className={`${btnBase} bg-red-600 hover:bg-red-700 text-white`}>Xác nhận</button>
                    <button onClick={() => { setShowRejectInput(false); setRejectReason(''); }} className={`${btnBase} text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700`}>Hủy</button>
                </div>
            )}
            {showTransferInput && (
                <div className="flex items-center gap-2">
                    <input type="text" value={treasuryRef} onChange={e => setTreasuryRef(e.target.value)} placeholder="Mã giao dịch kho bạc (tùy chọn)..."
                        className="flex-1 px-2.5 py-1.5 text-xs border border-emerald-200 dark:border-emerald-800 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" autoFocus />
                    <button onClick={() => { transferMutation.mutate({ id: payment.PaymentID, treasuryRef: treasuryRef || undefined }); setShowTransferInput(false); setTreasuryRef(''); }} disabled={isPending} className={`${btnBase} bg-emerald-600 hover:bg-emerald-700 text-white`}>Xác nhận</button>
                    <button onClick={() => { setShowTransferInput(false); setTreasuryRef(''); }} className={`${btnBase} text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700`}>Hủy</button>
                </div>
            )}
            {!showRejectInput && !showTransferInput && (
                <div className="flex items-center gap-1.5 flex-wrap">
                    {transitions.includes(PaymentStatus.Pending) && (
                        <button onClick={() => submitMutation.mutate(payment.PaymentID)} disabled={isPending} className={`${btnBase} bg-primary-500 hover:bg-primary-600 text-white`}>
                            <Clock className="w-3 h-3" /> Gửi duyệt
                        </button>
                    )}
                    {transitions.includes(PaymentStatus.Approved) && (
                        <button onClick={() => approveMutation.mutate({ id: payment.PaymentID, approvedBy: userName })} disabled={isPending} className={`${btnBase} bg-primary-600 hover:bg-primary-500 text-white`}>
                            <CheckCircle2 className="w-3 h-3" /> Duyệt
                        </button>
                    )}
                    {transitions.includes(PaymentStatus.Transferred) && (
                        <button onClick={() => setShowTransferInput(true)} disabled={isPending} className={`${btnBase} bg-emerald-600 hover:bg-emerald-700 text-white`}>
                            <Banknote className="w-3 h-3" /> Chuyển tiền
                        </button>
                    )}
                    {transitions.includes(PaymentStatus.Draft) && (
                        <button onClick={() => revertMutation.mutate(payment.PaymentID)} disabled={isPending} className={`${btnBase} bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300`}>
                            <Edit className="w-3 h-3" /> Sửa lại
                        </button>
                    )}
                    {transitions.includes(PaymentStatus.Rejected) && (
                        <button onClick={() => setShowRejectInput(true)} disabled={isPending} className={`${btnBase} text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800`}>
                            <X className="w-3 h-3" /> Từ chối
                        </button>
                    )}
                    {payment.Status === PaymentStatus.Draft && (
                        <button onClick={() => { if (confirm('Xóa đợt thanh toán này?')) deleteMutation.mutate(payment.PaymentID); }} disabled={isPending} className={`${btnBase} text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20`}>
                            <X className="w-3 h-3" /> Xóa
                        </button>
                    )}
                    {isPending && <span className="text-xs text-gray-400 animate-pulse">Đang xử lý...</span>}
                </div>
            )}
        </div>
    );
};

export default BiddingPackageDetail;
