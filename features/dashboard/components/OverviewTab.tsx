import React, { useMemo, Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Activity, AlertCircle, CheckCircle2, AlertTriangle, Building2, Map as MapIcon, TrendingUp, ArrowRight, Brain, Search } from 'lucide-react';
import { formatShortCurrency } from '../../../utils/format';
import { DashboardService } from '../../../services/DashboardService';
import { ProjectStatus, PROJECT_PHASE_COLORS, PROJECT_CURRENT_STATUS_CONFIG } from '../../../types';
import { StatCard, ErrorBoundary, EmptyState, TableSkeleton } from '../../../components/ui';
import { useSlidePanel } from '../../../context/SlidePanelContext';

// Lazy load heavy components
const CapitalDisbursementChart = lazy(() => import('./CapitalDisbursementChart'));
const InteractiveMap = lazy(() => import('../../../components/common/InteractiveMap'));
const AISummaryWidget = lazy(() => import('../../../components/ai/AISummaryWidget').then(m => ({ default: m.AISummaryWidget })));
// New charts
const TaskCompletionChart = lazy(() => import('./TaskCompletionChart'));
const ProjectStatusByBoardChart = lazy(() => import('./ProjectStatusByBoardChart'));
const ProjectDetailedStatusWidget = lazy(() => import('./ProjectDetailedStatusWidget'));

// Panels
const ProjectSlideTable = lazy(() => import('./panels/ProjectSlideTable'));
const TaskSlideTable = lazy(() => import('./panels/TaskSlideTable'));
const CapitalSlideTable = lazy(() => import('./panels/CapitalSlideTable'));

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

export const OverviewTab: React.FC<{ selectedYear: number | null; selectedBoard: string }> = ({ selectedYear, selectedBoard }) => {
    const navigate = useNavigate();
    const { openPanel } = useSlidePanel();
    const [activeStatusFilter, setActiveStatusFilter] = useState<number | null>(null);
    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const [showMines, setShowMines] = useState(false);
    const [showProjects, setShowProjects] = useState(true);

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

    const { data: materialMines } = useQuery({
        queryKey: ['dashboard', 'materialMines'],
        queryFn: DashboardService.getMaterialMines,
        staleTime: STALE_5M,
    });

    const { data: capitalVsDisbursement } = useQuery({
        queryKey: ['dashboard', 'capitalVsDisbursement', selectedYear],
        queryFn: () => DashboardService.getCapitalVsDisbursement(selectedYear || undefined),
        staleTime: STALE_5M,
    });

    const { data: taskCompletion, isLoading: loadingTasks } = useQuery({
        queryKey: ['dashboard', 'taskCompletion'],
        queryFn: DashboardService.getTaskCompletion,
        staleTime: STALE_5M,
    });

    const { data: risks, isLoading: loadingRisks } = useQuery({
        queryKey: ['dashboard', 'risks'],
        queryFn: DashboardService.getRisks,
        staleTime: STALE_5M,
    });


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
        let mapped = filteredRows.map(r => ({
            ProjectID: r.projectId,
            ProjectName: r.projectName,
            Status: r.status,
            CurrentStatus: r.currentStatusCode,
            TotalInvestment: r.totalInvestment,
            LocationCode: r.locationCode,
            Coordinates: r.coordinates,
            InvestorName: r.investorName,
            MainContractorName: r.mainContractorName,
            Progress: r.progress,
            ExpectedEndDate: r.expectedEndDate
        }));
        
        if (activeStatusFilter !== null) {
            mapped = mapped.filter(p => p.CurrentStatus === activeStatusFilter);
        }
        
        if (mapSearchQuery.trim() !== '') {
            const query = mapSearchQuery.toLowerCase();
            mapped = mapped.filter(p => p.ProjectName.toLowerCase().includes(query));
        }
        
        return mapped;
    }, [filteredRows, activeStatusFilter, mapSearchQuery]);

    const filteredMines = useMemo(() => {
        if (!materialMines) return [];
        let mapped = [...materialMines];
        if (mapSearchQuery.trim() !== '') {
            const query = mapSearchQuery.toLowerCase();
            mapped = mapped.filter(m => m.name?.toLowerCase().includes(query) || m.mine_type?.toLowerCase().includes(query));
        }
        return mapped;
    }, [materialMines, mapSearchQuery]);

    const statusSummary = useMemo(() => {
        const prep = filteredRows.filter(r => r.status === ProjectStatus.Preparation).length;
        const exec = filteredRows.filter(r => r.status === ProjectStatus.Execution).length;
        const comp = filteredRows.filter(r => r.status === ProjectStatus.Completion).length;
        return { prep, exec, comp };
    }, [filteredRows]);

    // Handlers for Drill-down
    const handleProjectStatusClick = (statusName: string, statusKey: ProjectStatus) => {
        openPanel({
            title: `Dự án: ${statusName}`,
            component: <Suspense fallback={<TableSkeleton columns={4} rows={5} />}><ProjectSlideTable projects={filteredRows} filterStatus={statusKey} /></Suspense>
        });
    };

    const handleProjectBoardStatusClick = (boardName: string, statusName: string, statusKey: ProjectStatus) => {
        openPanel({
            title: `Dự án ${statusName} - ${boardName}`,
            component: <Suspense fallback={<TableSkeleton columns={4} rows={5} />}><ProjectSlideTable projects={filteredRows} filterStatus={statusKey} filterBoardValue={boardName} /></Suspense>
        });
    };

    const handleTaskClick = (statusName: string) => {
        openPanel({
            title: 'Chi tiết Công việc',
            component: <Suspense fallback={<TableSkeleton columns={4} rows={5} />}><TaskSlideTable statusName={statusName} /></Suspense>
        });
    };

    const handleCapitalClick = (boardName: string) => {
        openPanel({
            title: 'Chi tiết Kế hoạch vốn',
            component: <Suspense fallback={<TableSkeleton columns={4} rows={5} />}><CapitalSlideTable boardName={boardName} year={selectedYear || new Date().getFullYear()} /></Suspense>
        });
    };

    const handleDetailedStatusClick = (statusId: number, statusLabel: string) => {
        openPanel({
            title: `Dự án: ${statusLabel}`,
            component: <Suspense fallback={<TableSkeleton columns={4} rows={5} />}><ProjectSlideTable projects={filteredRows} filterCurrentStatusCode={statusId} /></Suspense>
        });
    };

    return (
        <div className="space-y-6 animate-fade-in fade-in-up">


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
                2. BIỂU ĐỒ TỔNG QUAN DỰ ÁN VÀ CÔNG VIỆC
            ═══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[300px]">
                <Suspense fallback={<div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-[280px] animate-pulse" />}>
                    <ErrorBoundary>
                        <AISummaryWidget className="h-full overflow-y-auto" />
                    </ErrorBoundary>
                </Suspense>
                
                <Suspense fallback={<div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-[280px] animate-pulse" />}>
                    <ProjectStatusByBoardChart projects={filteredRows} onSegmentClick={handleProjectBoardStatusClick} />
                </Suspense>

                <Suspense fallback={<div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-[280px] animate-pulse" />}>
                    <ProjectDetailedStatusWidget projects={filteredRows} onSegmentClick={handleDetailedStatusClick} />
                </Suspense>
            </div>

            {/* ═══════════════════════════════════════════════════
                3. GIẢI NGÂN THEO BAN VÀ CÔNG VIỆC
            ═══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[400px]">
                <div className="lg:col-span-2">
                    {capitalVsDisbursement && (
                        <Suspense fallback={
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                            </div>
                        }>
                            <CapitalDisbursementChart data={capitalVsDisbursement} onSegmentClick={handleCapitalClick} />
                        </Suspense>
                    )}
                </div>
                <div className="lg:col-span-1">
                    <Suspense fallback={<div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full animate-pulse" />}>
                        <TaskCompletionChart data={taskCompletion} loading={loadingTasks} onSegmentClick={handleTaskClick} />
                    </Suspense>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                4. MAP + ALERTS
            ═══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-[300px] xl:h-[500px]">
                {/* Map (2/3) */}
                <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden h-full flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 shrink-0">
                        <h3 className="section-header !mb-0">
                            <div className="section-icon"><MapIcon className="w-5 h-5" /></div>
                            Bản đồ vị trí dự án
                        </h3>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {/* Toggle Projects Button */}
                            <button
                                onClick={() => setShowProjects(!showProjects)}
                                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                    showProjects 
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-700/50 dark:text-indigo-400' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                                }`}
                                title="Hiển thị Dự án trên bản đồ"
                            >
                                <span className={`w-2 h-2 rounded-full ${showProjects ? 'bg-indigo-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                {showProjects ? 'Đang hiện Dự án' : 'Hiện Dự án'}
                            </button>

                            {/* Toggle Mines Button */}
                            <button
                                onClick={() => setShowMines(!showMines)}
                                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                    showMines 
                                        ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700/50 dark:text-amber-400' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                                }`}
                                title="Hiển thị Mỏ vật liệu (Đất, Đá, Cát) trên bản đồ"
                            >
                                <span className={`w-2 h-2 rounded-full ${showMines ? 'bg-amber-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                {showMines ? 'Đang hiện Mỏ vật liệu' : 'Hiện Mỏ vật liệu'}
                            </button>
                            <div className="relative flex-1 sm:w-64">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Tìm dự án, mỏ vật liệu..."
                                    value={mapSearchQuery}
                                    onChange={(e) => setMapSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-slate-200 transition-shadow"
                                />
                            </div>
                        </div>
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
                                <InteractiveMap projects={filteredProjects} materialMines={filteredMines} showMines={showMines} showProjects={showProjects} />
                            </Suspense>
                        )}
                        {/* Legend */}
                        <div className="absolute top-4 right-4 bg-white dark:bg-slate-800 backdrop-blur-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm z-[1000] max-h-[80%] overflow-y-auto w-56">
                            <h4 className="text-[9px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 whitespace-nowrap" title="Bấm vào một trạng thái để lọc dự án trên bản đồ">Chú thích trạng thái (Bấm để lọc)</h4>
                            <div className="space-y-1.5">
                                {Object.entries(PROJECT_CURRENT_STATUS_CONFIG).map(([key, config]) => {
                                    const statusNum = Number(key);
                                    const isActive = activeStatusFilter === null || activeStatusFilter === statusNum;
                                    return (
                                        <div 
                                            key={key} 
                                            className={`flex items-center gap-2 cursor-pointer transition-all duration-200 ${isActive ? 'opacity-100 hover:scale-105' : 'opacity-40 hover:opacity-70'}`}
                                            onClick={() => setActiveStatusFilter(activeStatusFilter === statusNum ? null : statusNum)}
                                            title={activeStatusFilter === statusNum ? "Bấm để bỏ lọc" : "Bấm để lọc dự án theo trạng thái này"}
                                        >
                                            <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-700 shadow-sm transition-transform duration-200" style={{ backgroundColor: config.hex, transform: isActive ? 'scale(1.2)' : 'scale(1)' }} />
                                            <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300 truncate" title={config.label}>{config.label}</span>
                                        </div>
                                    );
                                })}
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
