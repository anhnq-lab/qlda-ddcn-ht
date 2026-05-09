import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatShortCurrency as formatCurrency } from '../../utils/format';
import { PaymentType, PaymentStatus, Payment } from '../../types';
import { usePayments } from '../../hooks/usePayments';
import { useAuth } from '../../context/AuthContext';
import { PaymentService } from '../../services/PaymentService';
import { useContracts } from '../../hooks/useContracts';
import { useContractors } from '../../hooks/useContractors';
import { useAllBiddingPackages } from '../../hooks/useAllBiddingPackages';
import { useScopedProjects } from '../../hooks/useScopedProjects';
import {
    CreditCard, Download, Search, Plus,
    DollarSign, Clock, CheckCircle2, FileText,
    Building2, ChevronRight, Filter,
    BarChart3, Wallet, CalendarDays, TrendingUp,
    ArrowUpRight, Hash, Landmark
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ProgressBar, StatCard } from '../../components/ui';

const PaymentList: React.FC<{ projectFilter?: string }> = ({ projectFilter = 'all' }) => {
    const navigate = useNavigate();
    const { payments, isLoading } = usePayments();
    const { contracts } = useContracts();
    const { scopedProjects: projects, scopedProjectIds } = useScopedProjects();
    const { contractors } = useContractors();
    const { biddingPackages } = useAllBiddingPackages();
    const [filterStatus, setFilterStatus] = useState<'all' | PaymentStatus>('all');
    const [filterType, setFilterType] = useState<'all' | PaymentType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // === Cross-module helpers ===
    const getContractorName = (contractId: string): string => {
        const contract = contracts.find(c => c.ContractID === contractId);
        if (!contract) return '—';
        const contractor = contractors.find(ct => ct.ContractorID === contract.ContractorID);
        return contractor?.FullName || contract.ContractorID;
    };

    const getProjectName = (contractId: string): string => {
        const contract = contracts.find(c => c.ContractID === contractId);
        if (!contract) return '—';
        const pkg = biddingPackages.find(p => p.PackageID === contract.PackageID);
        if (!pkg) return '—';
        const project = projects.find(p => p.ProjectID === pkg.ProjectID);
        return project?.ProjectName || '—';
    };

    const getProjectId = (contractId: string): string | null => {
        const contract = contracts.find(c => c.ContractID === contractId);
        if (!contract) return null;
        const pkg = biddingPackages.find(p => p.PackageID === contract.PackageID);
        if (!pkg) return null;
        return pkg.ProjectID || null;
    };

    const getContractValue = (contractId: string): number => {
        const contract = contracts.find(c => c.ContractID === contractId);
        return contract?.Value || 0;
    };

    const { userType, contractorId } = useAuth();

    // === Scope filter: only payments for scoped projects ===
    const scopedPayments = useMemo(() => {
        return payments.filter(p => {
            const contract = contracts.find(c => c.ContractID === p.ContractID);
            if (!contract) return false;
            // Contractors only see payments for their own contracts
            if (userType === 'contractor' && contractorId && contract.ContractorID !== contractorId) return false;
            const pkg = biddingPackages.find(bp => bp.PackageID === contract.PackageID);
            return pkg ? scopedProjectIds.has(pkg.ProjectID) : false;
        });
    }, [payments, contracts, biddingPackages, scopedProjectIds, userType, contractorId]);

    // === Stats (filtered by project) ===
    const projectFilteredPayments = useMemo(() => {
        if (projectFilter === 'all') return scopedPayments;
        return scopedPayments.filter(p => getProjectId(p.ContractID) === projectFilter);
    }, [scopedPayments, projectFilter]);

    const stats = useMemo(() => {
        const totalAmount = projectFilteredPayments.reduce((sum, p) => sum + p.Amount, 0);
        const byStatus = (s: PaymentStatus) => projectFilteredPayments.filter(p => p.Status === s);
        const sumAmount = (arr: Payment[]) => arr.reduce((sum, p) => sum + p.Amount, 0);
        const draft = byStatus(PaymentStatus.Draft);
        const pending = byStatus(PaymentStatus.Pending);
        const approved = byStatus(PaymentStatus.Approved);
        const transferred = byStatus(PaymentStatus.Transferred);
        const rejected = byStatus(PaymentStatus.Rejected);
        const advancePayments = projectFilteredPayments.filter(p => p.Type === PaymentType.Advance);
        const volumePayments = projectFilteredPayments.filter(p => p.Type === PaymentType.Volume);
        const uniqueContracts = new Set(projectFilteredPayments.map(p => p.ContractID)).size;
        return {
            total: projectFilteredPayments.length,
            totalAmount,
            draftCount: draft.length, draftAmount: sumAmount(draft),
            pendingCount: pending.length, pendingAmount: sumAmount(pending),
            approvedCount: approved.length, approvedAmount: sumAmount(approved),
            transferredCount: transferred.length, transferredAmount: sumAmount(transferred),
            rejectedCount: rejected.length, rejectedAmount: sumAmount(rejected),
            advanceAmount: sumAmount(advancePayments), advanceCount: advancePayments.length,
            volumeAmount: sumAmount(volumePayments), volumeCount: volumePayments.length,
            uniqueContracts,
        };
    }, [projectFilteredPayments]);

    // === Filtering ===
    const filteredPayments = useMemo(() => {
        return scopedPayments.filter(p => {
            const qLower = searchQuery.toLowerCase();
            const contractorName = getContractorName(p.ContractID).toLowerCase();
            const matchesSearch = !searchQuery ||
                p.ContractID.toLowerCase().includes(qLower) ||
                p.TreasuryRef.toLowerCase().includes(qLower) ||
                contractorName.includes(qLower) ||
                String(p.PaymentID).includes(qLower);
            const matchesStatus = filterStatus === 'all' || p.Status === filterStatus;
            const matchesType = filterType === 'all' || p.Type === filterType;
            const matchesProject = projectFilter === 'all' || getProjectId(p.ContractID) === projectFilter;
            return matchesSearch && matchesStatus && matchesType && matchesProject;
        });
    }, [scopedPayments, searchQuery, filterStatus, filterType, projectFilter, contracts]);

    const handleNavigateToSource = (contractId: string) => {
        const projectId = getProjectId(contractId);
        const contract = contracts.find(c => c.ContractID === contractId);
        const packageId = contract?.PackageID || null;
        if (projectId) {
            // Navigate directly to Thanh quyết toán tab of the specific bidding package
            navigate(`/projects/${encodeURIComponent(projectId)}`, {
                state: {
                    activeTab: 'packages',
                    openPackageId: packageId,
                    initialDetailTab: 'settlement',
                }
            });
        } else {
            navigate(`/contracts/${encodeURIComponent(contractId)}`);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
                <Skeleton className="h-14 rounded-2xl" />
                <Card className="p-4"><div className="space-y-4">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div></Card>
            </div>
        );
    }

    const CARD_COLORS: Record<number, "blue" | "emerald" | "amber" | "violet"> = {
        0: 'blue',
        1: 'emerald',
        2: 'amber',
        3: 'violet',
    };

    const statCards = [
        {
            label: 'Tổng giải ngân',
            value: formatCurrency(stats.totalAmount),
            sub: `${stats.total} phiếu · ${stats.uniqueContracts} hợp đồng`,
            icon: DollarSign,
        },
        {
            label: 'Đã chuyển tiền',
            value: formatCurrency(stats.transferredAmount),
            sub: `${stats.transferredCount}/${stats.total} phiếu hoàn thành`,
            icon: CheckCircle2,
            progressPercent: stats.total > 0 ? (stats.transferredCount / stats.total) * 100 : 0,
        },
        {
            label: 'Chờ xử lý',
            value: formatCurrency(stats.pendingAmount + stats.draftAmount),
            sub: `${stats.draftCount} nháp · ${stats.pendingCount} chờ duyệt · ${stats.approvedCount} đã duyệt`,
            icon: Clock,
            highlight: stats.pendingCount > 0,
        },
        {
            label: 'Tạm ứng',
            value: formatCurrency(stats.advanceAmount),
            sub: `KL: ${formatCurrency(stats.volumeAmount)} (${stats.volumeCount} phiếu)`,
            icon: Wallet,
        },
    ];

    return (
        <>
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* === Stat Cards === */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {statCards.map((card, idx) => {
                        const color = CARD_COLORS[idx] || "blue";
                        return (
                            <StatCard
                                key={idx}
                                label={
                                    <span className="flex items-center gap-2">
                                        {card.label}
                                        {(card as any).highlight && (
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                                            </span>
                                        )}
                                    </span>
                                }
                                value={card.value}
                                icon={<card.icon className="w-5 h-5" />}
                                color={color}
                                progressPercentage={(card as any).progressPercent}
                                footer={
                                    <p className="text-xs text-slate-500 mt-1 font-medium">{card.sub}</p>
                                }
                            />
                        );
                    })}
                </div>

                {/* === Toolbar === */}
                <div className="bg-[#FCF9F2] dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm mã TT, mã HĐ, nhà thầu, Kho bạc..."
                                className="filter-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Status segmented control */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1 gap-0.5">
                            {[
                                { value: 'all' as const, label: 'Tất cả', count: stats.total },
                                { value: PaymentStatus.Draft, label: 'Nháp', count: stats.draftCount },
                                { value: PaymentStatus.Pending, label: 'Chờ duyệt', count: stats.pendingCount },
                                { value: PaymentStatus.Approved, label: 'Đã duyệt', count: stats.approvedCount },
                                { value: PaymentStatus.Transferred, label: 'Đã chuyển', count: stats.transferredCount },
                                { value: PaymentStatus.Rejected, label: 'Từ chối', count: stats.rejectedCount },
                            ].filter(opt => opt.value === 'all' || opt.count > 0).map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setFilterStatus(opt.value)}
                                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${filterStatus === opt.value
                                        ? 'bg-[#FCF9F2] dark:bg-slate-600 text-slate-700 dark:text-slate-200 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {opt.label}
                                    <span className={`ml-1 text-[10px] ${filterStatus === opt.value ? 'text-primary-600' : 'text-gray-400'}`}>
                                        {opt.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Type pills */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mr-1">Loại</span>
                            {[
                                { value: 'all' as const, label: 'Tất cả' },
                                { value: PaymentType.Advance, label: 'Tạm ứng' },
                                { value: PaymentType.Volume, label: 'Khối lượng' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setFilterType(opt.value)}
                                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${filterType === opt.value
                                        ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-200 shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            <button className="px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-[#FCF9F2] dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 hover:shadow-lg">
                                <Download className="w-4 h-4" />
                                Xuất Excel
                            </button>
                        </div>
                    </div>
                </div>

                {/* === Table === */}
                <div className="bg-[#FCF9F2] dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)]">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-[#F5EFE6] dark:bg-slate-800">
                                    <th className="px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-widest w-12">STT</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest">Mã TT</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest">Hợp đồng</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest">Nhà thầu</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest">Dự án</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-center">Đợt</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest">Loại</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-right">Số tiền</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-center">Trạng thái</th>
                                    <th className="px-5 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {filteredPayments.map((payment, rowIdx) => {
                                    const contractorName = getContractorName(payment.ContractID);
                                    const projectName = getProjectName(payment.ContractID);
                                    const contractValue = getContractValue(payment.ContractID);
                                    const payPercent = contractValue > 0 ? (payment.Amount / contractValue) * 100 : 0;
                                    return (
                                        <tr
                                            key={payment.PaymentID}
                                            className="group cursor-pointer transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-700/60"
                                            onClick={() => handleNavigateToSource(payment.ContractID)}
                                        >
                                            {/* STT */}
                                            <td className="px-3 py-4 text-center text-xs text-gray-500 dark:text-slate-400 font-medium">{rowIdx + 1}</td>
                                            {/* Payment ID */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center ring-1 ring-gray-200 dark:from-slate-700 dark:to-slate-800 dark:ring-slate-600">
                                                        <Hash className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                                                    </div>
                                                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">{payment.PaymentID}</span>
                                                </div>
                                            </td>

                                            {/* Contract */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                                    <span className="font-medium text-blue-600 text-xs group-hover:text-blue-700 truncate max-w-[140px]">{payment.ContractID}</span>
                                                </div>
                                            </td>

                                            {/* Contractor */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ring-1 ring-slate-200 dark:from-slate-700 dark:to-slate-800 dark:ring-slate-600 flex-shrink-0">
                                                        <Building2 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                                    </div>
                                                    <span className="text-gray-700 text-xs max-w-[160px] truncate font-medium dark:text-slate-300" title={contractorName}>
                                                        {contractorName}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Project */}
                                            <td className="px-5 py-4">
                                                <span className="text-gray-500 text-xs max-w-[160px] truncate block dark:text-slate-400" title={projectName}>
                                                    {projectName}
                                                </span>
                                            </td>

                                            {/* Batch */}
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-xs font-black text-gray-700 ring-1 ring-gray-200 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300 dark:ring-slate-600">
                                                    {payment.BatchNo}
                                                </span>
                                            </td>

                                            {/* Type */}
                                            <td className="px-5 py-4">
                                                {payment.Type === PaymentType.Advance ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 ring-1 ring-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-900">
                                                        <Wallet className="w-2.5 h-2.5" />
                                                        Tạm ứng
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-300 dark:ring-cyan-900">
                                                        <BarChart3 className="w-2.5 h-2.5" />
                                                        Khối lượng
                                                    </span>
                                                )}
                                            </td>

                                            {/* Amount */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="text-right">
                                                    <span className="font-bold text-gray-900 font-mono text-xs tracking-tight block whitespace-nowrap dark:text-slate-100">{formatCurrency(payment.Amount)}</span>
                                                    {contractValue > 0 && (
                                                        <span className="text-[10px] text-gray-400 font-medium dark:text-slate-500">{payPercent.toFixed(1)}% giá trị HĐ</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4 text-center">
                                                {(() => {
                                                    const sc = PaymentService.getStatusColor(payment.Status);
                                                    return (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold whitespace-nowrap ring-1 ${sc.bg} ${sc.text} ${sc.ring} ${sc.darkBg} ${sc.darkText} ${sc.darkRing}`}>
                                                            {payment.Status === PaymentStatus.Pending && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>}
                                                            {payment.Status === PaymentStatus.Transferred && <CheckCircle2 className="w-3 h-3" />}
                                                            {PaymentService.getStatusLabel(payment.Status)}
                                                        </span>
                                                    );
                                                })()}
                                            </td>

                                            {/* Arrow */}
                                            <td className="px-4 py-4">
                                                <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:ring-1 group-hover:ring-blue-200 transition-all dark:bg-slate-700 dark:group-hover:bg-blue-900/20 dark:group-hover:ring-blue-800">
                                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors dark:text-slate-500 dark:group-hover:text-blue-400" />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="table-footer">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-xs text-gray-500 dark:text-slate-400">Đã chuyển: <span className="font-bold text-emerald-700">{formatCurrency(stats.transferredAmount)}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-primary-500" />
                                    <span className="text-xs text-gray-500 dark:text-slate-400">Chờ duyệt: <span className="font-bold text-primary-700">{formatCurrency(stats.pendingAmount)}</span></span>
                                </div>
                                <div className="w-px h-4 bg-gray-200 dark:bg-slate-600"></div>
                                <span className="text-xs text-gray-500 dark:text-slate-400">Tổng: <span className="font-bold text-gray-900 dark:text-slate-100">{formatCurrency(stats.totalAmount)}</span></span>
                            </div>
                            <span className="text-xs text-slate-400 dark:text-slate-500">{filteredPayments.length} phiếu thanh toán</span>
                        </div>
                    </div>

                    {filteredPayments.length === 0 && (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mx-auto mb-5 ring-1 ring-gray-200 dark:ring-slate-600">
                                <CreditCard className="w-10 h-10 text-gray-300 dark:text-slate-500" />
                            </div>
                            <p className="text-gray-600 font-bold text-lg">Không tìm thấy phiếu thanh toán</p>
                            <p className="text-gray-400 text-sm mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                        </div>
                    )}
                </div>
            </div >

        </>
    );
};

export default PaymentList;
