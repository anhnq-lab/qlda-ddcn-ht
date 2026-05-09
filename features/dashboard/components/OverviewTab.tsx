import React, { useState, useMemo, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Activity, AlertCircle, CheckCircle2, AlertTriangle, Building2, Map as MapIcon, Filter, ChevronDown, TrendingUp, ArrowRight, Brain, X } from 'lucide-react';
import { formatShortCurrency } from '../../../utils/format';
import { DashboardService } from '../../../services/DashboardService';
import { ProjectStatus, MANAGEMENT_BOARDS, PROJECT_PHASE_COLORS } from '../../../types';
import { StatCard, ErrorBoundary, EmptyState, TableSkeleton } from '../../../components/ui';

// Lazy load heavy components
const CapitalDisbursementChart = lazy(() => import('./CapitalDisbursementChart'));
const InteractiveMap = lazy(() => import('../../../components/common/InteractiveMap'));
const AISummaryWidget = lazy(() => import('../../../components/ai/AISummaryWidget').then(m => ({ default: m.AISummaryWidget })));
const AIRiskDashboard = lazy(() => import('../../../components/ai/AIRiskDashboard').then(m => ({ default: m.AIRiskDashboard })));
const AIAnomalyDetector = lazy(() => import('../../../components/ai/AIAnomalyDetector').then(m => ({ default: m.AIAnomalyDetector })));
const AIContractorScoring = lazy(() => import('../../../components/ai/AIContractorScoring').then(m => ({ default: m.AIContractorScoring })));
const AIResourceOptimizer = lazy(() => import('../../../components/ai/AIResourceOptimizer').then(m => ({ default: m.AIResourceOptimizer })));


// ── Phase Badge ──────────────────────────────────────────
const PhaseBadge: React.FC<{ status: number }> = ({ status }) => {
    const phase = PROJECT_PHASE_COLORS[status as ProjectStatus];
    if (!phase) return <span className="text-[10px] text-gray-400">—</span>;
    return (
        <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ background: `${phase.hex}18`, color: phase.hex, border: `1px solid ${phase.hex}40` }}
        >
            {phase.label}
        </span>
    );
};

// ── Progress Bar Inline ──────────────────────────────────
const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color = '#4a90e2' }) => (
    <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color, minWidth: value > 0 ? '4px' : '0' }}
            />
        </div>
        <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300 w-8 text-right">{value}%</span>
    </div>
);

export const OverviewTab: React.FC = () => {
    const navigate = useNavigate();

    // ── Filter State ──
    const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
    const [selectedBoard, setSelectedBoard] = useState<string>('all');

    const STALE_5M = 5 * 60 * 1000;

    // ── Data Fetching ──
    const { data: metrics, isLoading: loadingMetrics } = useQuery({
        queryKey: ['dashboard', 'overview', selectedYear],
        queryFn: () => DashboardService.getOverviewMetrics(selectedYear || new Date().getFullYear()),
        staleTime: STALE_5M,
    });

    const { data: projectRows, isLoading: loadingProjects } = useQuery({
        queryKey: ['dashboard', 'projectSummary'],
        queryFn: DashboardService.getProjectSummary,
        staleTime: STALE_5M,
    });

    const { data: capitalVsDisbursement } = useQuery({
        queryKey: ['dashboard', 'capitalVsDisbursement', selectedYear],
        queryFn: () => DashboardService.getCapitalVsDisbursement(selectedYear || undefined),
        staleTime: STALE_5M,
    });

    const { data: risks, isLoading: loadingRisks } = useQuery({
        queryKey: ['dashboard', 'risks'],
        queryFn: DashboardService.getRisks,
        staleTime: STALE_5M,
    });

    // ── Derived ──
    const availableYears = useMemo(() => {
        const current = new Date().getFullYear();
        const years: number[] = [];
        for (let y = current + 1; y >= 2020; y--) years.push(y);
        return years;
    }, []);

    const filteredRows = useMemo(() => {
        if (!projectRows) return [];
        let list = [...projectRows];
        // Filter by year — project active during selected year
        if (selectedYear) {
            const yearStart = `${selectedYear}-01-01`;
            const yearEnd = `${selectedYear}-12-31`;
            list = list.filter(p => {
                const started = !p.startDate || p.startDate <= yearEnd;
                const notEnded = !p.expectedEndDate || p.expectedEndDate >= yearStart;
                return started && notEnded;
            });
        }
        // Filter by board
        if (selectedBoard !== 'all') {
            list = list.filter(p => p.managementBoard.toString() === selectedBoard);
        }
        return list;
    }, [projectRows, selectedBoard, selectedYear]);

    const top10KeyProjects = useMemo(() => {
        return [...filteredRows]
            .sort((a, b) => b.totalInvestment - a.totalInvestment)
            .slice(0, 10);
    }, [filteredRows]);

    const filteredProjects = useMemo(() => {
        return filteredRows.map(r => ({
            ProjectID: r.projectId,
            ProjectName: r.projectName,
            Status: r.status,
            TotalInvestment: r.totalInvestment,
            LocationCode: r.locationCode
        }));
    }, [filteredRows]);

    const statusSummary = useMemo(() => {
        const prep = filteredRows.filter(r => r.status === ProjectStatus.Preparation).length;
        const exec = filteredRows.filter(r => r.status === ProjectStatus.Execution).length;
        const comp = filteredRows.filter(r => r.status === ProjectStatus.Completion).length;
        return { prep, exec, comp };
    }, [filteredRows]);

    return (
        <div className="space-y-6 animate-fade-in fade-in-up">
            {/* Toolbar Filters */}
            <div className="flex flex-wrap gap-2 justify-end items-center">
                <div className="relative">
                    <select
                        value={selectedYear ?? 'all'}
                        onChange={e => setSelectedYear(e.target.value === 'all' ? null : parseInt(e.target.value))}
                        className="pl-3 pr-8 py-2 filter-primary min-w-[120px]"
                    >
                        <option value="all">Tất cả năm</option>
                        {availableYears.map(y => (
                            <option key={y} value={y}>Năm {y}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
                </div>

                <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
                    <select
                        value={selectedBoard}
                        onChange={e => setSelectedBoard(e.target.value)}
                        className="pl-9 pr-8 py-2 filter-primary min-w-[140px]"
                    >
                        <option value="all">Tất cả ban</option>
                        {MANAGEMENT_BOARDS.map(b => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
                </div>
            </div>

            {/* Active filter */}
            {(selectedYear !== new Date().getFullYear() || selectedBoard !== 'all') && selectedYear !== null && (
                <div className="flex items-center gap-2 -mt-2">
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full border border-primary-200 dark:border-primary-800 flex items-center gap-1.5">
                        <Filter className="w-3 h-3" />
                        {selectedYear && selectedYear !== new Date().getFullYear() && `Năm ${selectedYear}`}
                        {selectedBoard !== 'all' && ` • Ban QLDA ${selectedBoard}`}
                    </span>
                    <button
                        onClick={() => { setSelectedYear(new Date().getFullYear()); setSelectedBoard('all'); }}
                        className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <X className="w-3 h-3" /> Xóa bộ lọc
                    </button>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════
                1. STAT CARDS — 4 cards
            ═══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    label="Dự án đang quản lý"
                    value={filteredRows.length.toString()}
                    icon={<Building2 className="w-5 h-5 flex-shrink-0" />}
                    color="slate"
                    loading={loadingProjects}
                    onClick={() => navigate('/projects')}
                    footer={
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Chuẩn bị: {statusSummary.prep}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                Thực hiện: {statusSummary.exec}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Kết thúc: {statusSummary.comp}
                            </span>
                        </div>
                    }
                />
                <StatCard
                    label="Tổng vốn đầu tư"
                    value={metrics ? formatShortCurrency(metrics.totalInvestment) : '—'}
                    icon={<Wallet className="w-5 h-5 flex-shrink-0" />}
                    color="amber"
                    progressLabel="Tỷ trọng vốn năm nay"
                    progressPercentage={metrics && metrics.totalInvestment > 0 ? Math.round((metrics.yearlyPlanned / metrics.totalInvestment) * 100) : 0}
                    loading={loadingMetrics}
                />
                <StatCard
                    label={selectedYear ? `Kế hoạch vốn ${selectedYear}` : 'Tổng kế hoạch vốn'}
                    value={metrics ? formatShortCurrency(metrics.yearlyPlanned) : '—'}
                    targetValue={metrics && metrics.totalInvestment ? formatShortCurrency(metrics.totalInvestment) : undefined}
                    icon={<TrendingUp className="w-5 h-5 flex-shrink-0" />}
                    color="slate"
                    progressLabel="Giải ngân trên KH"
                    progressPercentage={metrics ? metrics.yearlyDisbursementRate : 0}
                    loading={loadingMetrics}
                />
                <StatCard
                    label={selectedYear ? `Lũy kế giải ngân ${selectedYear}` : 'Lũy kế giải ngân'}
                    value={metrics ? formatShortCurrency(metrics.yearlyDisbursed) : '—'}
                    targetValue={metrics ? formatShortCurrency(metrics.yearlyPlanned) : undefined}
                    icon={<Activity className="w-5 h-5 flex-shrink-0" />}
                    color="emerald"
                    progressLabel="Hoàn thành kế hoạch"
                    progressPercentage={metrics ? metrics.yearlyDisbursementRate : 0}
                    trendLabel="Tiến độ"
                    trendPercentage={metrics ? metrics.yearlyDisbursementRate : 0}
                    loading={loadingMetrics}
                />
            </div>

            {/* ═══════════════════════════════════════════════════
                2. BẢNG TỔNG HỢP DỰ ÁN
            ═══════════════════════════════════════════════════ */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="section-header text-sm flex items-center gap-2">
                        <div className="section-icon"><Building2 className="w-5 h-5" /></div>
                        <span>Top 10 dự án trọng điểm</span>
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-black px-2 py-0.5 rounded-full border border-amber-200/40 uppercase tracking-wider">
                            Theo tổng mức ĐT
                        </span>
                    </h3>
                    <button
                        onClick={() => navigate('/projects')}
                        className="flex items-center gap-1 text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
                    >
                        Xem chi tiết <ArrowRight className="w-3 h-3" />
                    </button>
                </div>

                {loadingProjects ? (
                    <div className="p-4">
                        <TableSkeleton columns={6} rows={3} />
                    </div>
                ) : top10KeyProjects.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                    <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest">Tên dự án</th>
                                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest">Ban QLDA</th>
                                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest">Giai đoạn</th>
                                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest w-36">Tiến độ</th>
                                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-right">Vốn ĐT</th>
                                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-right">Giải ngân</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {top10KeyProjects.map((row) => {
                                    const boardDef = MANAGEMENT_BOARDS.find(b => b.value === row.managementBoard);
                                    return (
                                        <tr
                                            key={row.projectId}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                                            onClick={() => navigate(`/projects/${row.projectId}`)}
                                        >
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1 mb-0.5">
                                                    {row.projectName}
                                                </p>
                                                {row.startDate && row.expectedEndDate && (
                                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                                        {new Date(row.startDate).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })} → {new Date(row.expectedEndDate).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span
                                                    className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                                                    style={{
                                                        background: `${boardDef?.hex || '#888'}15`,
                                                        color: boardDef?.hex || '#888',
                                                    }}
                                                >
                                                    {row.boardLabel}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5"><PhaseBadge status={row.status} /></td>
                                            <td className="px-4 py-3.5">
                                                <ProgressBar value={row.progress} color={boardDef?.hex} />
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <span className="text-[13px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                                                    {formatShortCurrency(row.totalInvestment)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <span className={`text-[13px] font-semibold tabular-nums ${row.paymentProgress >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                                    {row.paymentProgress}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState icon={<Building2 className="w-12 h-12" />} title="Không có dự án nào" className="py-12" />
                )}
            </div>

            {/* ═══════════════════════════════════════════════════
                3. GIẢI NGÂN THEO BAN (full width)
            ═══════════════════════════════════════════════════ */}
            {capitalVsDisbursement && (
                <Suspense fallback={
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-64 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                }>
                    <CapitalDisbursementChart data={capitalVsDisbursement} />
                </Suspense>
            )}

            {/* ═══════════════════════════════════════════════════
                AI HUB — 4 tính năng AI + Tóm tắt
            ═══════════════════════════════════════════════════ */}
            <div className="space-y-4">
                <h3 className="section-header text-sm">
                    <div className="section-icon"><Brain className="w-5 h-5" /></div>
                    Trợ lý AI
                </h3>
                <Suspense fallback={<div className="h-32 bg-gray-50 dark:bg-slate-800 rounded-xl animate-pulse" />}>
                    <ErrorBoundary>
                        <AISummaryWidget />
                    </ErrorBoundary>
                </Suspense>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Suspense fallback={<div className="h-48 bg-gray-50 dark:bg-slate-800 rounded-xl animate-pulse" />}><ErrorBoundary><AIRiskDashboard /></ErrorBoundary></Suspense>
                    <Suspense fallback={<div className="h-48 bg-gray-50 dark:bg-slate-800 rounded-xl animate-pulse" />}><ErrorBoundary><AIAnomalyDetector /></ErrorBoundary></Suspense>
                    <Suspense fallback={<div className="h-48 bg-gray-50 dark:bg-slate-800 rounded-xl animate-pulse" />}><ErrorBoundary><AIContractorScoring /></ErrorBoundary></Suspense>
                    <Suspense fallback={<div className="h-48 bg-gray-50 dark:bg-slate-800 rounded-xl animate-pulse" />}><ErrorBoundary><AIResourceOptimizer /></ErrorBoundary></Suspense>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                4. MAP + ALERTS
            ═══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-[300px] xl:h-[500px]">
                {/* Map (2/3) */}
                <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="section-header">
                            <div className="section-icon"><MapIcon className="w-5 h-5" /></div>
                            Bản đồ vị trí dự án
                        </h3>
                    </div>
                    <div className="flex-1 w-full bg-gray-100 dark:bg-slate-300 rounded-2xl relative border border-gray-200 dark:border-slate-400 overflow-hidden z-0">
                        {loadingProjects ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                            </div>
                        ) : (
                            <Suspense fallback={
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                                </div>
                            }>
                                <InteractiveMap projects={filteredProjects} />
                            </Suspense>
                        )}
                        {/* Legend */}
                        <div className="absolute top-4 right-4 bg-white dark:bg-slate-800 backdrop-blur-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm z-[1000]">
                            <h4 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Chú thích</h4>
                            <div className="space-y-2">
                                {Object.entries(PROJECT_PHASE_COLORS).map(([key, phase]) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-700 shadow-sm" style={{ backgroundColor: phase.hex }} />
                                        <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300">{phase.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alerts (1/3) */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 relative overflow-hidden h-full flex flex-col">
                    <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none"><AlertTriangle className="w-32 h-32 text-red-500" /></div>
                    <h3 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10 shrink-0" style={{ paddingLeft: '0.75rem', borderLeft: '3px solid #EF4444' }}>
                        <AlertTriangle className="w-4 h-4" /> Cảnh báo quan trọng
                    </h3>
                    <div className="space-y-3 relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {loadingRisks ? (
                            <div className="space-y-2">
                                <div className="h-16 bg-red-50/50 dark:bg-red-900/10 rounded-xl animate-pulse" />
                                <div className="h-16 bg-red-50/50 dark:bg-red-900/10 rounded-xl animate-pulse" />
                            </div>
                        ) : risks && risks.length > 0 ? (
                            risks.map((r: any) => (
                                <div key={r.id} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-xl flex items-start gap-3 transition-transform hover:scale-[1.02]">
                                    <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg text-red-500 shadow-sm shrink-0">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-red-800 dark:text-red-300 leading-snug">{r.msg}</p>
                                        <p className="text-[10px] text-red-500 dark:text-red-400/70 mt-1 font-medium">{r.date}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyState icon={<CheckCircle2 className="w-12 h-12 text-emerald-500" />} title="Không có cảnh báo nào" className="py-12" />
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/reports')}
                        className="w-full mt-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0 shadow-sm hover:shadow"
                    >
                        Xem chi tiết báo cáo rủi ro
                    </button>
                </div>
            </div>
        </div>
    );
};
