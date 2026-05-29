import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Briefcase, FileText, CreditCard,
    Search, ChevronRight, Clock, ChevronDown,
    CheckCircle2, Circle, AlertTriangle, XCircle,
    Building2, DollarSign, TrendingUp, BarChart3, Bell, Globe, Eye, Filter, Download, RefreshCw,
    Plus, ArrowUpDown, ArrowUp, ArrowDown, Package2
} from 'lucide-react';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
// exportBiddingReportBieu01A: lazy-loaded inside the click handler to keep exceljs out of the initial bundle
import { useAllBiddingPackages } from '../../hooks/useAllBiddingPackages';
import { useScopedProjects } from '../../hooks/useScopedProjects';
import { useAuth } from '../../context/AuthContext';
import { PackageStatus, BiddingPackage } from '../../types';
import { formatShortCurrency as formatCurrency } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatCard } from '../../components/ui';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { BiddingPackagePanel } from '../projects/components/BiddingPackagePanel';

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
    const navigate = useNavigate();
    const initialTab = (searchParams.get('tab') as TabKey) || 'packages';
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
    const [projectFilter, setProjectFilter] = useState<string>(searchParams.get('projectId') || 'all');
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const { openPanel, closePanel } = useSlidePanel();
    const [addPkgDropdownOpen, setAddPkgDropdownOpen] = useState(false);
    const addPkgRef = useRef<HTMLDivElement>(null);

    // Sync projectId từ URL (khi navigate từ ProjectPackagesTab)
    useEffect(() => {
        const urlProjectId = searchParams.get('projectId');
        if (urlProjectId && urlProjectId !== projectFilter) {
            setProjectFilter(urlProjectId);
        }
    }, [searchParams]);

    // Data for project filter dropdown
    // Dùng biddingPackages trực tiếp (không filter theo scopedProjectIds)
    // vì scopedProjectIds chỉ có 50 dự án đầu, RLS đã đảm bảo quyền truy cập
    const { biddingPackages } = useAllBiddingPackages();
    // Load ALL projects với pageSize lớn để lấy tên dự án cho mọi gói thầu
    const { scopedProjects: projects } = useScopedProjects({ pageSize: 9999 });

    const availableProjects = useMemo(() => {
        const projectIds = Array.from(new Set(biddingPackages.map(p => p.ProjectID)));
        return projectIds.map((id: string) => {
            const project = projects.find(p => p.ProjectID === id);
            return {
                id,
                name: project?.ProjectName || id,
                count: biddingPackages.filter(p => p.ProjectID === id).length,
            };
        }).sort((a, b) => b.count - a.count);
    }, [biddingPackages, projects]);

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

    // Close add-package dropdown on outside click
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (addPkgRef.current && !addPkgRef.current.contains(e.target as Node)) {
                setAddPkgDropdownOpen(false);
            }
        };
        if (addPkgDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [addPkgDropdownOpen]);

    const handleTabChange = (tab: TabKey) => {
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });
    };

    /** Mở BiddingPackagePanel để thêm gói thầu cho dự án đã chọn */
    const handleAddPackage = (projectId: string) => {
        setAddPkgDropdownOpen(false);
        openPanel({
            title: 'Thêm mới gói thầu',
            icon: <Package2 className="w-5 h-5 text-primary-500" />,
            component: (
                <BiddingPackagePanel
                    projectId={projectId}
                    onClose={() => closePanel()}
                />
            ),
            width: '50vw'
        });
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            {/* Tab Navigation + Project Filter + Add Button */}
            <div className="bg-bg-surface rounded-2xl shadow-sm border border-border p-1.5">
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
                                        : 'text-txt-muted hover:text-gray-700 dark:hover:text-slate-300 hover:bg-bg-subtle dark:hover:bg-slate-700'
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

                    {/* Nút Thêm gói thầu (chỉ hiện ở tab packages) */}
                    {activeTab === 'packages' && (
                        <div className="relative" ref={addPkgRef}>
                            <button
                                onClick={() => setAddPkgDropdownOpen(!addPkgDropdownOpen)}
                                className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all duration-200 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Thêm gói thầu</span>
                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${addPkgDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {addPkgDropdownOpen && (
                                <div className="absolute top-full right-0 mt-1.5 w-80 bg-bg-surface rounded-xl shadow-xl border border-border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-2.5 border-b border-border-subtle">
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-txt-placeholder">Chọn dự án để thêm gói thầu</p>
                                    </div>
                                    <div className="max-h-56 overflow-y-auto">
                                        {availableProjects.length === 0 ? (
                                            <p className="px-4 py-3 text-xs text-txt-placeholder italic">Không có dự án nào</p>
                                        ) : availableProjects.map(proj => (
                                            <button
                                                key={proj.id}
                                                onClick={() => handleAddPackage(proj.id)}
                                                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-txt-secondary hover:bg-bg-hover-row transition-colors cursor-pointer text-left"
                                            >
                                                <span className="truncate max-w-[220px]">{proj.name}</span>
                                                <span className="text-[10px] font-bold text-txt-placeholder bg-bg-muted px-1.5 py-0.5 rounded flex-shrink-0 ml-2">{proj.count} gói</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="border-t border-border-subtle px-3 py-2">
                                        <button
                                            onClick={() => { setAddPkgDropdownOpen(false); navigate('/projects'); }}
                                            className="w-full text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline text-left"
                                        >
                                            Vào danh sách dự án để chọn →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Global Project Filter */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer whitespace-nowrap ${
                                projectFilter !== 'all'
                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400 shadow-sm'
                                    : 'bg-bg-surface border-gray-200 dark:border-slate-600 text-txt-muted hover:border-gray-300 dark:hover:border-slate-500'
                            }`}
                        >
                            <Building2 className="w-3.5 h-3.5" />
                            <span className="max-w-[200px] truncate">{selectedProjectName}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isProjectDropdownOpen && (
                            <div className="absolute top-full right-0 mt-1.5 w-80 bg-bg-surface rounded-xl shadow-sm border border-border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-2.5 border-b border-border-subtle">
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-txt-placeholder">Lọc theo dự án</p>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    <button
                                        onClick={() => { setProjectFilter('all'); setIsProjectDropdownOpen(false); }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                                            projectFilter === 'all'
                                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-bold'
                                                : 'text-txt-secondary hover:bg-bg-subtle dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" />Tất cả dự án</span>
                                        <span className="text-[10px] font-bold text-txt-placeholder bg-bg-muted px-1.5 py-0.5 rounded">{biddingPackages.length}</span>
                                    </button>
                                    <div className="h-px bg-bg-muted" />
                                    {availableProjects.map(proj => (
                                        <button
                                            key={proj.id}
                                            onClick={() => { setProjectFilter(proj.id); setIsProjectDropdownOpen(false); }}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                                                projectFilter === proj.id
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-bold'
                                                    : 'text-txt-secondary hover:bg-bg-subtle dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <span className="truncate max-w-[220px] text-left">{proj.name}</span>
                                            <span className="text-[10px] font-bold text-txt-placeholder bg-bg-muted px-1.5 py-0.5 rounded flex-shrink-0 ml-2">{proj.count}</span>
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
    <div className="flex flex-col items-center justify-center py-20 bg-bg-surface rounded-2xl border border-border gap-3">
        <AlertTriangle className="w-8 h-8 text-warning-500" />
        <p className="text-sm font-semibold text-txt-muted">Không thể tải nội dung. Vui lòng tải lại trang.</p>
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
    'selection': 'Lựa chọn nhà thầu',
    'execution': 'Đang thực hiện',
    // 'completed': 'Kết thúc', // Removed to avoid duplicate key with PaymentStatus
    // PaymentStatus
    'draft': 'Nháp',
    'pending': 'Chờ duyệt',
    'approved': 'Đã duyệt',
    'completed': 'Hoàn thành / Kết thúc',
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
    // pageSize=9999 để load đủ tất cả dự án — tránh bị cắt số trang
    const { scopedProjects: projects } = useScopedProjects({ pageSize: 9999 });
    const [statusFilter, setStatusFilter] = useState<'all' | PackageStatus>('all');
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'pct' | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const handleSort = (col: 'name' | 'price' | 'pct') => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('asc'); }
    };

    const SortIcon: React.FC<{ col: 'name' | 'price' | 'pct' }> = ({ col }) => {
        if (sortBy !== col) return <ArrowUpDown className="w-2.5 h-2.5 opacity-30 inline ml-1" />;
        return sortDir === 'asc'
            ? <ArrowUp className="w-2.5 h-2.5 opacity-70 inline ml-1 text-primary-500" />
            : <ArrowDown className="w-2.5 h-2.5 opacity-70 inline ml-1 text-primary-500" />;
    };

    // === Helpers ===
    const getProjectName = (projectId: string): string => {
        const project = projects.find(p => p.ProjectID === projectId);
        return project?.ProjectName || '—';
    };

    // === Packages — dùng trực tiếp từ getAllBiddingPackages()
    // KHÔNG filter theo scopedProjectIds vì:
    // 1. scopedProjectIds chỉ có 50 dự án (page 1 của paginated query)
    // 2. Supabase RLS đã đảm bảo chỉ trả về packages user có quyền xem
    const scopedPackages = biddingPackages;


    // === Stats ===
    const stats = useMemo(() => {
        const filtered = projectFilter === 'all'
            ? scopedPackages
            : scopedPackages.filter(p => p.ProjectID === projectFilter);
        const totalValue = filtered.reduce((sum, p) => sum + (p.Price || 0), 0);
        const byStatus = (s: PackageStatus) => filtered.filter(p => p.Status === s);
        const selectionCount = byStatus(PackageStatus.Selection).length;
        const executionCount = byStatus(PackageStatus.Execution).length;
        const completedCount = byStatus(PackageStatus.Completed).length;
        const awardedValue = [...byStatus(PackageStatus.Execution), ...byStatus(PackageStatus.Completed)].reduce((sum, p) => sum + (p.Price || 0), 0);
        const uniqueProjects = new Set(filtered.map(p => p.ProjectID)).size;
        return {
            total: filtered.length, totalValue,
            selectionCount, executionCount, completedCount, awardedValue, uniqueProjects,
        };
    }, [scopedPackages, projectFilter]);

    // === Filtering + Sorting ===
    const filteredPackages = useMemo(() => {
        let result = scopedPackages.filter(p => {
            const matchesStatus = statusFilter === 'all' || p.Status === statusFilter;
            const matchesProject = projectFilter === 'all' || p.ProjectID === projectFilter;
            return matchesStatus && matchesProject;
        });
        if (sortBy) {
            result = [...result].sort((a, b) => {
                let av: number | string = 0, bv: number | string = 0;
                if (sortBy === 'name') { av = a.PackageName; bv = b.PackageName; }
                else if (sortBy === 'price') { av = a.Price || 0; bv = b.Price || 0; }
                else if (sortBy === 'pct') { av = a.CompletionPct ?? -1; bv = b.CompletionPct ?? -1; }
                if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
                return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
            });
        }
        return result;
    }, [scopedPackages, statusFilter, projectFilter, projects, sortBy, sortDir]);

    const getStatusColor = (status: PackageStatus) => {
        switch (status) {
            case PackageStatus.Selection: return { bg: 'bg-primary-50 dark:bg-primary-900/20', text: 'text-primary-700 dark:text-primary-400', ring: 'ring-primary-100 dark:ring-primary-900/30' };
            case PackageStatus.Execution: return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-100 dark:ring-emerald-900/30' };
            case PackageStatus.Completed: return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', ring: 'ring-blue-100 dark:ring-blue-900/30' };
            default: return { bg: 'bg-bg-muted', text: 'text-txt-muted', ring: 'ring-gray-200 dark:ring-slate-600' };
        }
    };

    const getStatusIcon = (status: PackageStatus) => {
        switch (status) {
            case PackageStatus.Selection: return <Clock className="w-2.5 h-2.5 animate-pulse" />;
            case PackageStatus.Execution: return <TrendingUp className="w-2.5 h-2.5" />;
            case PackageStatus.Completed: return <CheckCircle2 className="w-2.5 h-2.5" />;
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
                    value={<>{stats.total} <span className="text-sm font-semibold text-txt-muted">gói</span></>}
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
                    label="Lựa chọn nhà thầu"
                    value={<>{stats.selectionCount} <span className="text-sm font-semibold text-txt-muted">gói</span></>}
                    icon={<Clock className="w-5 h-5 flex-shrink-0" />}
                    color="blue"
                />
                <StatCard
                    label="Đang thực hiện"
                    value={<>{stats.executionCount} <span className="text-sm font-semibold text-txt-muted">gói</span></>}
                    sublabel={`${stats.completedCount} đã kết thúc`}
                    icon={<TrendingUp className="w-5 h-5 flex-shrink-0" />}
                    color="emerald"
                    progressPercentage={stats.total > 0 ? Math.round(((stats.executionCount + stats.completedCount) / stats.total) * 100) : 0}
                    progressLabel="ĐÃ CÓ KẾT QUẢ"
                />
            </div>

            {/* === Toolbar === */}
            <div className="bg-bg-surface rounded-2xl shadow-sm border border-border p-4">
                <div className="flex flex-col md:flex-row items-center gap-3">


                    {/* Status Filter */}
                    <div className="flex items-center bg-bg-muted rounded-xl p-1 gap-0.5 flex-wrap">
                        {[
                            { value: 'all' as const, label: 'Tất cả', count: stats.total },
                            { value: PackageStatus.Selection, label: 'Lựa chọn NT', count: stats.selectionCount },
                            { value: PackageStatus.Execution, label: 'Thực hiện', count: stats.executionCount },
                            { value: PackageStatus.Completed, label: 'Kết thúc', count: stats.completedCount },
                        ].filter(opt => opt.value === 'all' || opt.count > 0).map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${statusFilter === opt.value
                                    ? 'bg-bg-surface dark:bg-slate-600 text-txt-primary shadow-sm'
                                    : 'text-txt-muted hover:text-gray-700 dark:hover:text-slate-300'
                                }`}
                            >
                                {opt.label}
                                <span className={`ml-1 text-[10px] ${statusFilter === opt.value ? 'text-blue-600 dark:text-blue-400' : 'text-txt-placeholder'}`}>
                                    {opt.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-txt-placeholder font-medium hidden lg:inline">
                            Hiển thị {filteredPackages.length} / {scopedPackages.length}
                        </span>
                        <button
                            onClick={async () => {
                                const { exportBiddingReportBieu01A } = await import('../../utils/exportBiddingReport');
                                exportBiddingReportBieu01A(scopedPackages, projects);
                            }}
                            className="px-4 py-2.5 text-sm font-semibold text-txt-primary bg-bg-surface border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 hover:shadow-lg"
                            title="Xuất báo cáo đấu thầu Biểu 01A"
                        >
                            <Download className="w-4 h-4" />
                            Xuất BC đấu thầu
                        </button>
                    </div>
                </div>
            </div>

            {/* === Packages Table === */}
            <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)]">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border bg-bg-subtle">
                                <th className="px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-widest w-12">STT</th>
                                <th
                                    className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest min-w-[220px] cursor-pointer select-none hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                    onClick={() => handleSort('name')}
                                >
                                    Tên gói thầu<SortIcon col="name" />
                                </th>
                                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest min-w-[160px]">Dự án</th>
                                <th
                                    className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-right whitespace-nowrap cursor-pointer select-none hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                    onClick={() => handleSort('price')}
                                >
                                    Giá gói thầu<SortIcon col="price" />
                                </th>
                                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-center">Hình thức LCNT</th>
                                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-center">Loại HĐ</th>
                                <th
                                    className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-center cursor-pointer select-none hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap"
                                    onClick={() => handleSort('pct')}
                                >
                                    % TH<SortIcon col="pct" />
                                </th>
                                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-center">Trạng thái</th>
                                <th className="px-4 py-2.5 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {filteredPackages.map((pkg, rowIdx) => {
                                const projectName = getProjectName(pkg.ProjectID);
                                const sc = getStatusColor(pkg.Status);
                                const selectionMethodLabel = getSelectionMethodLabel(pkg.SelectionMethod);
                                const contractTypeLabel = getContractTypeLabel(pkg.ContractType);
                                const statusLabel = getVietnameseStatus(pkg.Status);

                                return (
                                    <tr
                                        key={pkg.PackageID}
                                        className="group cursor-pointer transition-all duration-200 hover:bg-bg-hover-row"
                                        onClick={() => navigate(`/projects/${encodeURIComponent(pkg.ProjectID)}`, {
                                            state: { activeTab: 'packages', openPackageId: pkg.PackageID }
                                        })}
                                    >
                                        {/* STT */}
                                        <td className="px-3 py-4 text-center text-xs text-txt-muted font-medium">{rowIdx + 1}</td>

                                        {/* Package Name */}
                                        <td className="px-4 py-4">
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-50 to-warning-100 dark:from-primary-900/30 dark:to-warning-900/30 flex items-center justify-center ring-1 ring-primary-200/50 dark:ring-primary-800/50 group-hover:ring-primary-300 dark:group-hover:ring-primary-600 transition-colors flex-shrink-0 mt-0.5">
                                                    <Briefcase className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-txt-primary text-[13px] leading-snug line-clamp-2">{pkg.PackageName}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-txt-placeholder font-mono">{pkg.PackageNumber}</span>
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
                                                    <Building2 className="w-3 h-3 text-txt-muted" />
                                                </div>
                                                <span className="text-txt-muted text-xs max-w-[180px] truncate leading-relaxed font-medium" title={projectName}>
                                                    {projectName}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Price */}
                                        <td className="px-4 py-4 text-right">
                                            <span className="font-bold text-txt-primary font-mono text-xs tracking-tight whitespace-nowrap">{formatCurrency(pkg.Price)}</span>
                                        </td>

                                        {/* Selection Method */}
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-xs text-txt-muted">{selectionMethodLabel}</span>
                                        </td>

                                        {/* Contract Type */}
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-xs text-txt-muted">{contractTypeLabel}</span>
                                        </td>

                                        {/* % Tiến độ thực hiện */}
                                        <td className="px-4 py-4 text-center">
                                            {(pkg.Status === PackageStatus.Execution || pkg.Status === PackageStatus.Completed) ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400">
                                                        {pkg.CompletionPct ?? 0}%
                                                    </span>
                                                    <div className="w-14 h-1.5 bg-bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all"
                                                            style={{ width: `${pkg.CompletionPct ?? 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-300 dark:text-slate-600">—</span>
                                            )}
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
                <div className="bg-gradient-to-r from-gray-50 to-primary-50/30 dark:from-slate-900 dark:to-slate-800/30 border-t border-border px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                <span className="text-xs text-txt-muted">Lựa chọn NT: <span className="font-bold text-txt-secondary">{stats.selectionCount}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-xs text-txt-muted">Đang thực hiện: <span className="font-bold text-txt-secondary">{stats.executionCount}</span></span>
                            </div>
                            <div className="w-px h-4 bg-gray-200 dark:bg-slate-600"></div>
                            <span className="text-xs text-txt-muted">Tổng giá trị: <span className="font-bold text-txt-primary">{formatCurrency(stats.totalValue)}</span></span>
                        </div>
                        <span className="text-xs text-txt-placeholder">{filteredPackages.length} gói thầu</span>
                    </div>
                </div>

                {filteredPackages.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mx-auto mb-5 ring-1 ring-gray-200 dark:ring-slate-600">
                            <Briefcase className="w-10 h-10 text-gray-300 dark:text-slate-400" />
                        </div>
                        <p className="text-txt-muted font-bold text-lg">Không tìm thấy gói thầu</p>
                        <p className="text-txt-placeholder text-sm mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
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
