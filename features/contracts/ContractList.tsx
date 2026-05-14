
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatShortCurrency as formatCurrency } from '../../utils/format';
import { Contract, ContractStatus, PaymentStatus } from '../../types';
import {
    FileText, Search, Plus, Filter,
    Building2, TrendingUp, CheckCircle2, Clock, DollarSign,
    ChevronRight, BarChart3, ArrowUpRight, ArrowDownRight, Briefcase,
    ShieldCheck, ShieldAlert, Landmark, CalendarDays, Eye
} from 'lucide-react';
import { useContracts } from '../../hooks/useContracts';
import { useAuth } from '../../context/AuthContext';
import { usePayments } from '../../hooks/usePayments';
import { useScopedProjects } from '../../hooks/useScopedProjects';
import { useContractors } from '../../hooks/useContractors';
import { useAllBiddingPackages } from '../../hooks/useAllBiddingPackages';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusBadge, ProgressBar, StatCard } from '../../components/ui';
import { ContractModal } from './components/ContractModal';

const ContractList: React.FC<{ projectFilter?: string }> = ({ projectFilter = 'all' }) => {
    const navigate = useNavigate();
    const { contracts, isLoading } = useContracts();
    const { payments } = usePayments();
    const { scopedProjects: projects, scopedProjectIds } = useScopedProjects();
    const { contractors } = useContractors();
    const { biddingPackages } = useAllBiddingPackages();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ContractStatus>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // === Cross-module helpers ===
    const getContractorName = (contractorId: string): string => {
        const contractor = contractors.find(c => c.ContractorID === contractorId);
        return contractor?.FullName || contractorId;
    };

    const getProjectName = (contract: Contract): string => {
        const pkg = biddingPackages.find(p => p.PackageID === contract.PackageID);
        if (!pkg) return '—';
        const project = projects.find(p => p.ProjectID === pkg.ProjectID);
        return project?.ProjectName || '—';
    };

    const getProjectId = (contract: Contract): string | null => {
        const pkg = biddingPackages.find(p => p.PackageID === contract.PackageID);
        return pkg?.ProjectID || null;
    };

    const getPaymentProgress = (contractId: string, contractValue: number) => {
        const contractPayments = payments.filter(p => p.ContractID === contractId);
        const paid = contractPayments
            .filter(p => p.Status === PaymentStatus.Transferred)
            .reduce((sum, p) => sum + p.Amount, 0);
        const pending = contractPayments
            .filter(p => p.Status === PaymentStatus.Pending)
            .reduce((sum, p) => sum + p.Amount, 0);
        const percent = contractValue > 0 ? (paid / contractValue) * 100 : 0;
        return { paid, pending, percent, count: contractPayments.length };
    };

    const { userType, contractorId } = useAuth();

    // === Scope filter: only contracts for scoped projects ===
    const scopedContracts = useMemo(() => {
        let result = contracts.filter(c => {
            const pkg = biddingPackages.find(p => p.PackageID === c.PackageID);
            return pkg ? scopedProjectIds.has(pkg.ProjectID) : false;
        });
        // Contractors only see their own contracts
        if (userType === 'contractor' && contractorId) {
            result = result.filter(c => c.ContractorID === contractorId);
        }
        return result;
    }, [contracts, biddingPackages, scopedProjectIds, userType, contractorId]);

    // === Scoped payments ===
    const scopedPayments = useMemo(() => {
        const scopedContractIds = new Set(scopedContracts.map(c => c.ContractID));
        return payments.filter(p => scopedContractIds.has(p.ContractID));
    }, [payments, scopedContracts]);

    // === Stats (filtered by project) ===
    const projectFilteredContracts = useMemo(() => {
        if (projectFilter === 'all') return scopedContracts;
        return scopedContracts.filter(c => getProjectId(c) === projectFilter);
    }, [scopedContracts, projectFilter]);

    const projectFilteredPayments = useMemo(() => {
        const ids = new Set(projectFilteredContracts.map(c => c.ContractID));
        return scopedPayments.filter(p => ids.has(p.ContractID));
    }, [scopedPayments, projectFilteredContracts]);

    const stats = useMemo(() => {
        const totalValue = projectFilteredContracts.reduce((sum, c) => sum + c.Value, 0);
        const executingContracts = projectFilteredContracts.filter(c => c.Status === ContractStatus.Executing);
        const executingCount = executingContracts.length;
        const executingValue = executingContracts.reduce((sum, c) => sum + c.Value, 0);
        const liquidatedCount = projectFilteredContracts.filter(c => c.Status === ContractStatus.Liquidated).length;
        const totalPaid = projectFilteredPayments
            .filter(p => p.Status === PaymentStatus.Transferred)
            .reduce((sum, p) => sum + p.Amount, 0);
        const totalPending = projectFilteredPayments
            .filter(p => p.Status === PaymentStatus.Pending)
            .reduce((sum, p) => sum + p.Amount, 0);
        const disbursementRate = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;
        const uniqueContractors = new Set(projectFilteredContracts.map(c => c.ContractorID)).size;
        return { total: projectFilteredContracts.length, totalValue, executingCount, executingValue, liquidatedCount, totalPaid, totalPending, disbursementRate, uniqueContractors };
    }, [projectFilteredContracts, projectFilteredPayments]);

    // === Filtering ===
    const filteredContracts = useMemo(() => {
        return scopedContracts.filter(c => {
            const contractorName = getContractorName(c.ContractorID).toLowerCase();
            const projectName = getProjectName(c).toLowerCase();
            const qLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                c.ContractID.toLowerCase().includes(qLower) ||
                contractorName.includes(qLower) ||
                projectName.includes(qLower);
            const matchesStatus = statusFilter === 'all' || c.Status === statusFilter;
            const matchesProject = projectFilter === 'all' || getProjectId(c) === projectFilter;
            return matchesSearch && matchesStatus && matchesProject;
        });
    }, [scopedContracts, searchQuery, statusFilter, projectFilter, projects]);

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
            label: 'Tổng hợp đồng',
            value: stats.total,
            suffix: 'HĐ',
            sub: `${stats.uniqueContractors} nhà thầu`,
            icon: FileText,
        },
        {
            label: 'Tổng giá trị',
            value: formatCurrency(stats.totalValue),
            sub: `Đang TH: ${formatCurrency(stats.executingValue)}`,
            icon: DollarSign,
        },
        {
            label: 'Đang thực hiện',
            value: stats.executingCount,
            suffix: 'HĐ',
            sub: `${stats.liquidatedCount} đã thanh lý`,
            icon: TrendingUp,
        },
        {
            label: 'Tỷ lệ giải ngân',
            value: `${stats.disbursementRate.toFixed(1)}%`,
            sub: `${formatCurrency(stats.totalPaid)} / ${formatCurrency(stats.totalValue)}`,
            icon: BarChart3,
            progressPercent: stats.disbursementRate,
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* === Stat Cards === */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((card, idx) => {
                    const color = CARD_COLORS[idx] || "blue";
                    return (
                        <StatCard
                            key={idx}
                            label={card.label}
                            value={
                                <span>
                                    {card.value}
                                    {card.suffix && <span className="text-[12px] font-semibold ml-1 text-slate-500">{card.suffix}</span>}
                                </span>
                            }
                            icon={<card.icon className="w-5 h-5" />}
                            color={color}
                            progressPercentage={card.progressPercent}
                            footer={
                                <p className="text-xs text-slate-500 mt-1 font-medium">{card.sub}</p>
                            }
                        />
                    );
                })}
            </div>

            {/* === Toolbar === */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm mã HĐ, nhà thầu, dự án..."
                            className="filter-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1 gap-0.5">
                        {[
                            { value: 'all' as const, label: 'Tất cả', count: stats.total },
                            { value: ContractStatus.Executing, label: 'Đang TH', count: stats.executingCount },
                            { value: ContractStatus.Liquidated, label: 'Thanh lý', count: stats.liquidatedCount },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${statusFilter === opt.value
                                    ? 'bg-white dark:bg-slate-800 dark:bg-slate-600 text-gray-900 dark:text-slate-200 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                {opt.label}
                                <span className={`ml-1 text-[10px] ${statusFilter === opt.value ? 'text-primary-600' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {opt.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden lg:inline">
                            Hiển thị {filteredContracts.length} / {stats.total}
                        </span>
                        
                        {userType !== 'contractor' && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="btn btn-primary"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Thêm hợp đồng</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* === Contract Table === */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)]">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                            <tr className="text-slate-500 dark:text-slate-400">
                                <th className="px-3 py-3 text-center w-12 border-b border-slate-200 dark:border-slate-700">STT</th>
                                <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Số hợp đồng</th>
                                <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Nhà thầu</th>
                                <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Dự án</th>
                                <th className="px-4 py-3 text-right whitespace-nowrap border-b border-slate-200 dark:border-slate-700">Giá trị HĐ</th>
                                <th className="px-4 py-3 text-center border-b border-slate-200 dark:border-slate-700">Giải ngân</th>
                                <th className="px-4 py-3 text-center border-b border-slate-200 dark:border-slate-700">Ngày ký</th>
                                <th className="px-4 py-3 text-center border-b border-slate-200 dark:border-slate-700">Trạng thái</th>
                                <th className="px-6 py-3 w-10 border-b border-slate-200 dark:border-slate-700"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredContracts.map((contract, rowIdx) => {
                                const payProgress = getPaymentProgress(contract.ContractID, contract.Value);
                                const contractorName = getContractorName(contract.ContractorID);
                                const projectName = getProjectName(contract);

                                return (
                                    <tr
                                        key={contract.ContractID}
                                        className="group cursor-pointer transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-"
                                        onClick={() => navigate(`/contracts/${encodeURIComponent(contract.ContractID)}`)}
                                    >
                                        {/* STT */}
                                        <td className="px-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">{rowIdx + 1}</td>
                                        {/* Contract ID */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 relative z-10">
                                                <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-900/20 flex items-center justify-center ring-1 ring-primary-200/50 dark:ring-primary-800/50 group-hover:ring-primary-400 dark:group-hover:ring-primary-600 transition-colors">
                                                    <Briefcase className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 text-xs block whitespace-nowrap leading-tight mb-0.5">{contract.ContractID}</span>
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Gói {contract.PackageID?.split('-').pop() || '—'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contractor */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center ring-1 ring-slate-200 dark:ring-slate-600 shadow-sm">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                                </div>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[200px] truncate leading-tight text-xs" title={contractorName}>
                                                    {contractorName}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Project */}
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px] max-w-[200px] truncate block leading-tight" title={projectName}>
                                                {projectName}
                                            </span>
                                        </td>

                                        {/* Contract Value */}
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-gray-900 dark:text-slate-100 font-mono text-xs tracking-tight whitespace-nowrap">{formatCurrency(contract.Value)}</span>
                                        </td>

                                        {/* Payment Progress */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1.5">
                                                {payProgress.count === 0 && payProgress.percent === 0 ? (
                                                    <span className="text-[10px] text-gray-300 dark:text-slate-600 italic">—</span>
                                                ) : (
                                                    <>
                                                        <ProgressBar value={payProgress.percent} size="sm" />
                                                        <div className="flex items-center gap-1.5 text-[10px]">
                                                            <span className="font-bold text-slate-600 dark:text-slate-300">{payProgress.percent.toFixed(0)}%</span>
                                                            <span className="text-gray-300 dark:text-slate-600">·</span>
                                                            <span className="text-slate-500 dark:text-slate-400">{payProgress.count} đợt</span>
                                                            {payProgress.pending > 0 && (
                                                                <>
                                                                    <span className="text-gray-300 dark:text-slate-600">·</span>
                                                                    <span className="text-primary-500 font-semibold flex items-center gap-0.5">
                                                                        <Clock className="w-2.5 h-2.5" /> {formatCurrency(payProgress.pending)}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>

                                        {/* Sign Date */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                <CalendarDays className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                                {contract.SignDate ? new Date(contract.SignDate).toLocaleDateString('vi-VN') : '—'}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 text-center">
                                            {contract.Status === ContractStatus.Executing ? (
                                                <StatusBadge variant="info" label="Đang TH" animated />
                                            ) : contract.Status === ContractStatus.Liquidated ? (
                                                <StatusBadge variant="success" label="Thanh lý" icon={<CheckCircle2 className="w-3 h-3" />} />
                                            ) : (
                                                <StatusBadge variant="warning" label="Tạm dừng" icon={<Clock className="w-3 h-3" />} />
                                            )}
                                        </td>

                                        {/* Arrow */}
                                        <td className="px-4 py-4">
                                            <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:ring-1 group-hover:ring-blue-200 dark:group-hover:ring-blue-800 transition-all">
                                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
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
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Đang thực hiện: <span className="font-bold text-gray-700 dark:text-slate-200">{stats.executingCount}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Đã thanh lý: <span className="font-bold text-gray-700 dark:text-slate-200">{stats.liquidatedCount}</span></span>
                            </div>
                            <div className="w-px h-4 bg-gray-200 dark:bg-slate-600"></div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Tổng giá trị: <span className="font-bold text-gray-900 dark:text-slate-100">{formatCurrency(stats.totalValue)}</span></span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{filteredContracts.length} hợp đồng</span>
                    </div>
                </div>

                {filteredContracts.length === 0 && (
                    <div className="p-20 text-center dark:text-slate-400">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mx-auto mb-5 ring-1 ring-gray-200 dark:ring-slate-600">
                            <FileText className="w-10 h-10 text-gray-300 dark:text-slate-400" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-bold text-lg">Không tìm thấy hợp đồng</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                )}
            </div>

            {/* Modal Tạo mới hợp đồng */}
            <ContractModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default ContractList;
