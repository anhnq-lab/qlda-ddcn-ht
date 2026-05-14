import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Briefcase, FileText, CreditCard,
    Search, ChevronRight, Clock, ChevronDown,
    CheckCircle2, Circle, AlertTriangle, XCircle,
    Building2, DollarSign, TrendingUp, BarChart3, Bell, Globe, Eye, Filter, Download, RefreshCw
} from 'lucide-react';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { exportBiddingReportBieu01A } from '../../utils/exportBiddingReport';
import { useAllBiddingPackages } from '../../hooks/useAllBiddingPackages';
import { useScopedProjects } from '../../hooks/useScopedProjects';
import { useAuth } from '../../context/AuthContext';
import { PackageStatus, BiddingPackage } from '../../types';
import { formatShortCurrency as formatCurrency } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatCard } from '../../components/ui';

// Shared prop type for project filter
export interface ProjectFilterProps {
    projectFilter: string;
}

// Lazy-load existing list components
const ContractList = React.lazy(() => import('../contracts/ContractList'));
const PaymentList = React.lazy(() => import('../payments/PaymentList'));

// Shared project filter type is exported above

// ========================================
// BIDDING & CONTRACT PAGE — Unified Module
// ========================================

type TabKey = 'packages' | 'contracts' | 'payments';

interface TabDef {
    key: TabKey;
    label: string;
    icon: React.ElementType;
    description: string;
}

const TABS: TabDef[] = [
    { key: 'packages', label: 'Gói thầu', icon: Briefcase, description: 'Quản lý đấu thầu' },
    { key: 'contracts', label: 'Hợp đồng', icon: FileText, description: 'Danh sách hợp đồng' },
    { key: 'payments', label: 'Thanh toán', icon: CreditCard, description: 'Giải ngân & thanh toán' },
];

const BiddingContractPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as TabKey) || 'packages';
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
    const [projectFilter, setProjectFilter] = useState<string>('all');
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

    // Data for project filter dropdown
    const { biddingPackages } = useAllBiddingPackages();
    const { scopedProjects: projects, scopedProjectIds } = useScopedProjects();

    const scopedPackages = useMemo(() => {
        return biddingPackages.filter(p => scopedProjectIds.has(p.ProjectID));
    }, [biddingPackages, scopedProjectIds]);

    const availableProjects = useMemo(() => {
        const projectIds = Array.from(new Set(scopedPackages.map(p => p.ProjectID)));
        return projectIds.map((id: string) => {
            const project = projects.find(p => p.ProjectID === id);
            return {
                id,
                name: project?.ProjectName || '—',
                count: scopedPackages.filter(p => p.ProjectID === id).length,
            };
        }).sort((a, b) => b.count - a.count);
    }, [scopedPackages, projects]);

    const selectedProjectName = projectFilter === 'all'
        ? 'Tất cả dự án'
        : availableProjects.find(p => p.id === projectFilter)?.name || 'Dự án';

    // Close dropdown on outside click
    React.useEffect(() => {
        const handleClick = () => setIsProjectDropdownOpen(false);
        if (isProjectDropdownOpen) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [isProjectDropdownOpen]);

    const handleTabChange = (tab: TabKey) => {
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            {/* Tab Navigation + Project Filter */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-1.5">
                <div className="flex items-center gap-1">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`
                                    flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold
                                    transition-all duration-200 relative cursor-pointer
                                    ${isActive
                                        ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-200/50 dark:shadow-primary-900/30'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700'
                                    }
                                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Global Project Filter */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer whitespace-nowrap ${
                                projectFilter !== 'all'
                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400 shadow-sm'
                                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-500'
                            }`}
                        >
                            <Building2 className="w-3.5 h-3.5" />
                            <span className="max-w-[200px] truncate">{selectedProjectName}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isProjectDropdownOpen && (
                            <div className="absolute top-full right-0 mt-1.5 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-700">
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-slate-400">Lọc theo dự án</p>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    <button
                                        onClick={() => { setProjectFilter('all'); setIsProjectDropdownOpen(false); }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                                            projectFilter === 'all'
                                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-bold'
                                                : 'text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" />Tất cả dự án</span>
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{scopedPackages.length}</span>
                                    </button>
                                    <div className="h-px bg-gray-100 dark:bg-slate-700" />
                                    {availableProjects.map(proj => (
                                        <button
                                            key={proj.id}
                                            onClick={() => { setProjectFilter(proj.id); setIsProjectDropdownOpen(false); }}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                                                projectFilter === proj.id
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-bold'
                                                    : 'text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <span className="truncate max-w-[220px] text-left">{proj.name}</span>
                                            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded flex-shrink-0 ml-2">{proj.count}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {projectFilter !== 'all' && (
                        <button
                            onClick={() => setProjectFilter('all')}
                            className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg ring-1 ring-primary-200 dark:ring-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors cursor-pointer"
                        >
                            <XCircle className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'packages' && <BiddingPackagesTab projectFilter={projectFilter} />}
            {activeTab === 'contracts' && (
                <ErrorBoundary fallback={<TabErrorFallback />}>
                    <React.Suspense fallback={<TabLoadingFallback />}>
                        <ContractList projectFilter={projectFilter} />
                    </React.Suspense>
                </ErrorBoundary>
            )}
            {activeTab === 'payments' && (
                <ErrorBoundary fallback={<TabErrorFallback />}>
                    <React.Suspense fallback={<TabLoadingFallback />}>
                        <PaymentList projectFilter={projectFilter} />
                    </React.Suspense>
                </ErrorBoundary>
            )}
        </div>
    );
};

// ── Error fallback for lazy tabs ──
const TabErrorFallback: React.FC = () => (
    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 gap-3">
        <AlertTriangle className="w-8 h-8 text-warning-500" />
        <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">Không thể tải nội dung. Vui lòng tải lại trang.</p>
        <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
            <RefreshCw className="w-3.5 h-3.5" /> Tải lại
        </button>
    </div>
);

// ── Loading fallback ──
const TabLoadingFallback: React.FC = () => (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-14 rounded-2xl" />
        <Card className="p-4"><div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div></Card>
    </div>
);

// ========================================
// STATUS LABELS — Tiếng Việt
// ========================================
const STATUS_LABELS: Record<string, string> = {
    // PackageStatus
    'planning': 'Trong kế hoạch',
    'posted': 'Đã đăng tải',
    'bidding': 'Đang mời thầu',
    'evaluating': 'Đang xét thầu',
    'awarded': 'Đã có kết quả',
    'cancelled': 'Đã hủy',
    // PaymentStatus
    'draft': 'Nháp',
    'pending': 'Chờ duyệt',
    'approved': 'Đã duyệt',
    'completed': 'Hoàn thành',
    'transferred': 'Đã chuyển tiền',
    'rejected': 'Từ chối',
    'paid': 'Đã thanh toán',
    // ContractStatus
    'executing': 'Đang thực hiện',
    'liquidated': 'Thanh lý',
    'suspended': 'Tạm dừng',
    // General
    'active': 'Đang hoạt động',
    'inactive': 'Tạm dừng',
    'closed': 'Đã đóng',
    'open': 'Mở',
    'in_progress': 'Đang xử lý',
};

function getVietnameseStatus(status: string): string {
    if (!status) return '—';
    // Case-insensitive lookup
    const key = status.toLowerCase().trim();
    return STATUS_LABELS[key] || status;
}

// ========================================
// BIDDING PACKAGES TAB — Cross-project overview
// ========================================

const BiddingPackagesTab: React.FC<ProjectFilterProps> = ({ projectFilter }) => {
    const navigate = useNavigate();
    const { biddingPackages, isLoading } = useAllBiddingPackages();
    const { scopedProjects: projects, scopedProjectIds } = useScopedProjects();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | PackageStatus>('all');

    // === Helpers ===
    const getProjectName = (projectId: string): string => {
        const project = projects.find(p => p.ProjectID === projectId);
        return project?.ProjectName || '—';
    };

    // === Scope filter: only packages for scoped projects ===
    const scopedPackages = useMemo(() => {
        return biddingPackages.filter(p => scopedProjectIds.has(p.ProjectID));
    }, [biddingPackages, scopedProjectIds]);


    // === Stats ===
    const stats = useMemo(() => {
        const filtered = projectFilter === 'all'
            ? scopedPackages
            : scopedPackages.filter(p => p.ProjectID === projectFilter);
        const totalValue = filtered.reduce((sum, p) => sum + (p.Price || 0), 0);
        const byStatus = (s: PackageStatus) => filtered.filter(p => p.Status === s);
        const planningCount = byStatus(PackageStatus.Planning).length;
        const postedCount = byStatus(PackageStatus.Posted).length;
        const biddingCount = byStatus(PackageStatus.Bidding).length;
        const evaluatingCount = byStatus(PackageStatus.Evaluating).length;
        const awardedCount = byStatus(PackageStatus.Awarded).length;
        const cancelledCount = byStatus(PackageStatus.Cancelled).length;
        const awardedValue = byStatus(PackageStatus.Awarded).reduce((sum, p) => sum + (p.Price || 0), 0);
        const uniqueProjects = new Set(filtered.map(p => p.ProjectID)).size;
        return {
            total: filtered.length, totalValue,
            planningCount, postedCount, biddingCount, evaluatingCount,
            awardedCount, cancelledCount, awardedValue, uniqueProjects,
        };
    }, [scopedPackages, projectFilter]);

    // === Filtering ===
    const filteredPackages = useMemo(() => {
        return scopedPackages.filter(p => {
            const qLower = searchQuery.toLowerCase();
            const projectName = getProjectName(p.ProjectID).toLowerCase();
            const matchesSearch = !searchQuery ||
                p.PackageName.toLowerCase().includes(qLower) ||
                p.PackageNumber.toLowerCase().includes(qLower) ||
                projectName.includes(qLower) ||
                (p.NotificationCode?.toLowerCase().includes(qLower));
            const matchesStatus = statusFilter === 'all' || p.Status === statusFilter;
            const matchesProject = projectFilter === 'all' || p.ProjectID === projectFilter;
            return matchesSearch && matchesStatus && matchesProject;
        });
    }, [scopedPackages, searchQuery, statusFilter, projectFilter, projects]);

    const getStatusColor = (status: PackageStatus) => {
        switch (status) {
            case PackageStatus.Planning: return { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-600 dark:text-slate-300', ring: 'ring-gray-200 dark:ring-slate-600' };
            case PackageStatus.Posted: return { bg: 'bg-primary-50 dark:bg-primary-900/20', text: 'text-primary-700 dark:text-primary-400', ring: 'ring-primary-100 dark:ring-primary-900/30' };
            case PackageStatus.Bidding: return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', ring: 'ring-blue-100 dark:ring-blue-900/30' };
            case PackageStatus.Evaluating: return { bg: 'bg-warning-50 dark:bg-warning-900/20', text: 'text-primary-700 dark:text-warning-400', ring: 'ring-warning-100 dark:ring-warning-900/30' };
            case PackageStatus.Awarded: return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-100 dark:ring-emerald-900/30' };
            case PackageStatus.Cancelled: return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', ring: 'ring-red-100 dark:ring-red-900/30' };
            default: return { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-600 dark:text-slate-300', ring: 'ring-gray-200 dark:ring-slate-600' };
        }
    };

    const getStatusIcon = (status: PackageStatus) => {
        switch (status) {
            case PackageStatus.Planning: return <Circle className="w-2.5 h-2.5" />;
            case PackageStatus.Posted: return <FileText className="w-2.5 h-2.5" />;
            case PackageStatus.Bidding: return <Clock className="w-2.5 h-2.5 animate-pulse" />;
            case PackageStatus.Evaluating: return <AlertTriangle className="w-2.5 h-2.5" />;
            case PackageStatus.Awarded: return <CheckCircle2 className="w-2.5 h-2.5" />;
            case PackageStatus.Cancelled: return <XCircle className="w-2.5 h-2.5" />;
            default: return null;
        }
    };

    if (isLoading) {
        return <TabLoadingFallback />;
    }

    return (
        <div className="space-y-6">
            {/* === Stat Cards === */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    label="Tổng gói thầu"
                    value={<>{stats.total} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">gói</span></>}
                    sublabel={`${stats.uniqueProjects} dự án`}
                    icon={<Briefcase className="w-5 h-5 flex-shrink-0" />}
                    color="slate"
                />
                <StatCard
                    label="Tổng giá trị"
                    value={formatCurrency(stats.totalValue)}
                    sublabel={`Đã có KQ: ${formatCurrency(stats.awardedValue)}`}
                    icon={<DollarSign className="w-5 h-5 flex-shrink-0" />}
                    color="amber"
                />
                <StatCard
                    label="Đã có kết quả"
                    value={<>{stats.awardedCount} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">gói</span></>}
                    icon={<CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                    color="emerald"
                    progressPercentage={stats.total > 0 ? Math.round((stats.awardedCount / stats.total) * 100) : 0}
                    progressLabel="HOÀN THÀNH"
                />
                <StatCard
                    label="Đang thực hiện"
                    value={<>{stats.biddingCount + stats.evaluatingCount} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">gói</span></>}
                    sublabel={`${stats.biddingCount} mời thầu · ${stats.evaluatingCount} xét thầu`}
                    icon={<TrendingUp className="w-5 h-5 flex-shrink-0" />}
                    color="blue"
                />
            </div>

            {/* === Toolbar === */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex flex-col md:flex-row items-center gap-3">
                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm tên gói thầu, mã TBMT..."
                            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 dark:text-slate-200 focus:bg-white dark:bg-slate-800 dark:focus:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>


                    {/* Status Filter */}
                    <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-xl p-1 gap-0.5 flex-wrap">
                        {[
                            { value: 'all' as const, label: 'Tất cả', count: stats.total },
                            { value: PackageStatus.Planning, label: 'Trong KH', count: stats.planningCount },
                            { value: PackageStatus.Bidding, label: 'Mời thầu', count: stats.biddingCount },
                            { value: PackageStatus.Evaluating, label: 'Xét thầu', count: stats.evaluatingCount },
                            { value: PackageStatus.Awarded, label: 'Có KQ', count: stats.awardedCount },
                        ].filter(opt => opt.value === 'all' || opt.count > 0).map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${statusFilter === opt.value
                                    ? 'bg-white dark:bg-slate-800 dark:bg-slate-600 text-gray-900 dark:text-slate-200 shadow-sm'
                                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                                }`}
                            >
                                {opt.label}
                                <span className={`ml-1 text-[10px] ${statusFilter === opt.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-400'}`}>
                                    {opt.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-gray-400 dark:text-slate-400 font-medium hidden lg:inline">
                            Hiển thị {filteredPackages.length} / {scopedPackages.length}
                        </span>
                        <button
                            onClick={() => exportBiddingReportBieu01A(scopedPackages, projects)}
                            className="px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 hover:shadow-lg"
                            title="Xuất báo cáo đấu thầu Biểu 01A"
                        >
                            <Download className="w-4 h-4" />
                            Xuất BC đấu thầu
                        </button>
                    </div>
                </div>
            </div>

            {/* === Packages Table === */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)]">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                <th className="px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-widest w-12">STT</th>
                                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest min-w-[220px]">Tên gói thầu</th>
                                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest min-w-[160px]">Dự án</th>
                                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-right whitespace-nowrap">Giá gói thầu</th>
                                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-center">Hình thức LCNT</th>
                                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-center">Loại HĐ</th>
                                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-center">Trạng thái</th>
                                <th className="px-4 py-2.5 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredPackages.map((pkg, rowIdx) => {
                                const projectName = getProjectName(pkg.ProjectID);
                                const sc = getStatusColor(pkg.Status);
                                const selectionMethodLabel = getSelectionMethodLabel(pkg.SelectionMethod);
                                const contractTypeLabel = getContractTypeLabel(pkg.ContractType);
                                const statusLabel = getVietnameseStatus(pkg.Status);

                                return (
                                    <tr
                                        key={pkg.PackageID}
                                        className="group cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                                        onClick={() => navigate(`/projects/${encodeURIComponent(pkg.ProjectID)}`, {
                                            state: { activeTab: 'packages', openPackageId: pkg.PackageID }
                                        })}
                                    >
                                        {/* STT */}
                                        <td className="px-3 py-4 text-center text-xs text-gray-500 dark:text-slate-400 font-medium">{rowIdx + 1}</td>

                                        {/* Package Name */}
                                        <td className="px-4 py-4">
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-50 to-warning-100 dark:from-primary-900/30 dark:to-warning-900/30 flex items-center justify-center ring-1 ring-primary-200/50 dark:ring-primary-800/50 group-hover:ring-primary-300 dark:group-hover:ring-primary-600 transition-colors flex-shrink-0 mt-0.5">
                                                    <Briefcase className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-800 dark:text-slate-200 text-[13px] leading-snug line-clamp-2">{pkg.PackageName}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-gray-400 dark:text-slate-400 font-mono">{pkg.PackageNumber}</span>
                                                        {pkg.NotificationCode && (
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-blue-600 dark:text-blue-400">
                                                                <Bell className="w-2.5 h-2.5" />{pkg.NotificationCode}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Project */}
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0">
                                                    <Building2 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                                </div>
                                                <span className="text-gray-600 dark:text-slate-300 text-xs max-w-[180px] truncate leading-relaxed font-medium" title={projectName}>
                                                    {projectName}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Price */}
                                        <td className="px-4 py-4 text-right">
                                            <span className="font-bold text-gray-900 dark:text-slate-100 font-mono text-xs tracking-tight whitespace-nowrap">{formatCurrency(pkg.Price)}</span>
                                        </td>

                                        {/* Selection Method */}
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-xs text-gray-600 dark:text-slate-300">{selectionMethodLabel}</span>
                                        </td>

                                        {/* Contract Type */}
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-xs text-gray-600 dark:text-slate-300">{contractTypeLabel}</span>
                                        </td>

                                        {/* Status — TIẾNG VIỆT */}
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 ${sc.bg} ${sc.text} ${sc.ring}`}>
                                                {getStatusIcon(pkg.Status)}
                                                {statusLabel}
                                            </span>
                                        </td>

                                        {/* Arrow */}
                                        <td className="px-4 py-4">
                                            <div className="w-7 h-7 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:ring-1 group-hover:ring-blue-200 dark:group-hover:ring-blue-800 transition-all">
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
                <div className="bg-gradient-to-r from-gray-50 to-primary-50/30 dark:from-slate-900 dark:to-slate-800/30 border-t border-gray-200 dark:border-slate-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-xs text-gray-500 dark:text-slate-400">Đã có KQ: <span className="font-bold text-gray-700 dark:text-slate-200">{stats.awardedCount}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                <span className="text-xs text-gray-500 dark:text-slate-400">Đang thực hiện: <span className="font-bold text-gray-700 dark:text-slate-200">{stats.biddingCount + stats.evaluatingCount}</span></span>
                            </div>
                            <div className="w-px h-4 bg-gray-200 dark:bg-slate-600"></div>
                            <span className="text-xs text-gray-500 dark:text-slate-400">Tổng giá trị: <span className="font-bold text-gray-900 dark:text-slate-100">{formatCurrency(stats.totalValue)}</span></span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-slate-400">{filteredPackages.length} gói thầu</span>
                    </div>
                </div>

                {filteredPackages.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mx-auto mb-5 ring-1 ring-gray-200 dark:ring-slate-600">
                            <Briefcase className="w-10 h-10 text-gray-300 dark:text-slate-400" />
                        </div>
                        <p className="text-gray-600 dark:text-slate-400 font-bold text-lg">Không tìm thấy gói thầu</p>
                        <p className="text-gray-400 dark:text-slate-400 text-sm mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Helpers ──

function getSelectionMethodLabel(method: string): string {
    const map: Record<string, string> = {
        'OpenBidding': 'Đấu thầu rộng rãi',
        'LimitedBidding': 'Đấu thầu hạn chế',
        'Appointed': 'Chỉ định thầu',
        'CompetitiveShopping': 'Chào hàng cạnh tranh',
        'DirectProcurement': 'Mua sắm trực tiếp',
        'SelfExecution': 'Tự thực hiện',
        'CommunityParticipation': 'Cộng đồng tham gia',
        'PriceNegotiation': 'Đàm phán giá',
        'SpecialMethod': 'Trường hợp đặc biệt',
    };
    return map[method] || method || '—';
}

function getContractTypeLabel(type: string): string {
    const map: Record<string, string> = {
        'LumpSum': 'Trọn gói',
        'UnitPrice': 'Đơn giá CĐ',
        'AdjustableUnitPrice': 'Đơn giá ĐC',
        'TimeBased': 'Theo thời gian',
        'CostPlusFee': 'Chi phí cộng phí',
        'Percentage': 'Theo %',
        'Mixed': 'Hỗn hợp',
    };
    return map[type] || type || '—';
}

export default BiddingContractPage;
