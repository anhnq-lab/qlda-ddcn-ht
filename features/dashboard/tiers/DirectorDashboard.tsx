/**
 * DirectorDashboard — Tầng 1: Ban Giám đốc
 */
import React, { Suspense, lazy, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Wallet, TrendingUp, Activity, AlertTriangle, ArrowRight, CheckSquare, Users, Calendar as CalendarIcon, ClipboardCheck } from 'lucide-react';
import { StatCard, ErrorBoundary, EmptyState } from '../../../components/ui';
import { DashboardService } from '../../../services/DashboardService';
import { formatShortCurrency } from '../../../utils/format';
import { supabase } from '../../../lib/supabase';
import type { DashboardConfig } from '../hooks/useDashboardConfig';
import type { useDepartmentData } from '../hooks/useDepartmentData';
import { WelcomeHeader } from '../widgets/shared/WelcomeHeader';
import { UpcomingDeadlines } from '../widgets/shared/UpcomingDeadlines';
import { DEPARTMENT_NAMES, type DepartmentCode } from '../../../types/plan.types';
import { useEvents } from '../../../hooks/useCalendar';
import { InlineActivityFeed } from '../widgets/shared/InlineActivityFeed';

const CapitalDisbursementChart = lazy(() => import('../components/CapitalDisbursementChart'));
const ProjectStatusChart = lazy(() => import('../components/ProjectStatusChart'));
const TaskCompletionChart = lazy(() => import('../components/TaskCompletionChart'));
const AISummaryWidget = lazy(() => import('../../../components/ai/AISummaryWidget').then(m => ({ default: m.AISummaryWidget })));

const STALE_5M = 5 * 60 * 1000;

interface Props {
    config: DashboardConfig;
    data: ReturnType<typeof useDepartmentData>;
}

export const DirectorDashboard: React.FC<Props> = ({ config, data }) => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    const currentMonth = new Date().getMonth() + 1;

    const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
        queryKey: ['dashboard', 'director', currentYear, currentMonth],
        queryFn: () => DashboardService.getDirectorDashboardData(currentYear, currentMonth),
        staleTime: STALE_5M,
    });

    const metrics = dashboardData?.overview_metrics;
    const capitalData = dashboardData?.capital_by_board;
    const taskCompletion = dashboardData?.task_completion;
    const deptKPIs = dashboardData?.dept_kpis || [];

    const loadingMetrics = loadingDashboard;
    const loadingTasks = loadingDashboard;

    const calendarFilter = useMemo(() => {
        const now = new Date();
        const end = new Date(now);
        end.setDate(end.getDate() + 7);
        return {
            startDate: now.toISOString(),
            endDate: end.toISOString()
        };
    }, []);

    const { data: weekEventsData } = useEvents(calendarFilter);
    const weekEvents = useMemo(() => (weekEventsData || []).slice(0, 5), [weekEventsData]);

    const statusSummary = useMemo(() => ({
        prep: data.scopedProjects.filter((p: any) => p.Status === 1).length,
        exec: data.scopedProjects.filter((p: any) => p.Status === 2).length,
        comp: data.scopedProjects.filter((p: any) => p.Status === 3).length,
    }), [data.scopedProjects]);

    const totalInvestmentSum = useMemo(() => {
        return data.scopedProjects.reduce((sum: number, p: any) => sum + (p.TotalInvestment ?? p.totalInvestment ?? 0), 0);
    }, [data.scopedProjects]);

    const totalAllTimeDisbursed = useMemo(() => {
        return data.scopedProjects.reduce((sum: number, p: any) => {
            const inv = p.TotalInvestment ?? p.totalInvestment ?? 0;
            const progress = p.PaymentProgress ?? p.paymentProgress ?? 0;
            return sum + inv * (progress / 100);
        }, 0);
    }, [data.scopedProjects]);

    const overallDisbursementRate = useMemo(() => {
        return totalInvestmentSum > 0 ? Math.round((totalAllTimeDisbursed / totalInvestmentSum) * 100) : 0;
    }, [totalInvestmentSum, totalAllTimeDisbursed]);

    const yearlyPlannedPercentage = useMemo(() => {
        if (!metrics || totalInvestmentSum === 0) return 0;
        return Math.round((metrics.yearlyPlanned / totalInvestmentSum) * 100);
    }, [metrics, totalInvestmentSum]);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <WelcomeHeader config={config} taskStats={data.myTaskStats} />

            {/* KPI HERO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                <StatCard 
                    label="Dự án đang quản lý" 
                    value={data.scopedProjects.length.toString()} 
                    icon={<Building2 className="w-5 h-5 flex-shrink-0" />} 
                    color="slate" 
                    loading={loadingMetrics} 
                    onClick={() => navigate('/projects')} 
                    trend="up"
                    trendPercentage={4}
                    trendLabel="tháng này"
                    sparklineData={[48, 50, 52, 51, 55, data.scopedProjects.length]}
                    footer={<div className="flex items-center gap-1.5 flex-wrap mt-0.5"><span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">CB: {statusSummary.prep}</span><span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-400">TH: {statusSummary.exec}</span><span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">KT: {statusSummary.comp}</span></div>} 
                />
                <StatCard
                    label="Lũy kế giải ngân"
                    value={formatShortCurrency(totalAllTimeDisbursed)}
                    targetValue={formatShortCurrency(totalInvestmentSum)}
                    icon={<Wallet className="w-5 h-5 flex-shrink-0" />}
                    color="warning"
                    progressLabel="Tỷ lệ giải ngân lũy kế"
                    progressPercentage={overallDisbursementRate}
                    loading={loadingMetrics}
                    trend="up"
                    trendPercentage={12}
                    trendLabel="quý này"
                    sparklineData={[120e9, 150e9, 180e9, 220e9, totalAllTimeDisbursed]}
                />
                <StatCard
                    label={`KH vốn ${currentYear}`}
                    value={metrics ? formatShortCurrency(metrics.yearlyPlanned) : '—'}
                    icon={<TrendingUp className="w-5 h-5 flex-shrink-0" />}
                    color="slate"
                    progressLabel="Tỷ trọng trên tổng vốn đầu tư"
                    progressPercentage={yearlyPlannedPercentage}
                    loading={loadingMetrics}
                    trend="up"
                    trendPercentage={8}
                    trendLabel="vs 2025"
                    sparklineData={[620e9, 680e9, 720e9, metrics?.yearlyPlanned || 0]}
                />
                <StatCard
                    label={`Giải ngân ${currentYear}`}
                    value={metrics ? formatShortCurrency(metrics.yearlyDisbursed) : '—'}
                    targetValue={metrics ? formatShortCurrency(metrics.yearlyPlanned) : undefined}
                    icon={<Activity className="w-5 h-5 flex-shrink-0" />}
                    color="emerald"
                    progressLabel="Tiến độ giải ngân năm"
                    progressPercentage={metrics ? metrics.yearlyDisbursementRate : 0}
                    loading={loadingMetrics}
                    trend="up"
                    trendPercentage={15}
                    trendLabel="cùng kỳ"
                    sparklineData={[0, 5e9, 12e9, 28e9, 45e9, metrics?.yearlyDisbursed || 0]}
                />
                <StatCard 
                    label="Cảnh báo rủi ro" 
                    value={(metrics?.riskCount || 0).toString()} 
                    icon={<AlertTriangle className="w-5 h-5 flex-shrink-0" />} 
                    color="rose" 
                    loading={loadingMetrics} 
                    trend={metrics?.riskCount && metrics.riskCount > 5 ? "up" : "down"}
                    trendPercentage={metrics?.riskCount && metrics.riskCount > 5 ? 20 : 10}
                    trendLabel="tuần này"
                    sparklineData={[8, 6, 7, 5, 4, metrics?.riskCount || 0]}
                />
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Suspense fallback={<div className="h-[280px] bg-bg-surface rounded-2xl animate-pulse" />}>
                    <ProjectStatusChart 
                        statusSummary={statusSummary} 
                        onSegmentClick={(_, statusKey) => navigate(`/projects?status=${statusKey}`)} 
                    />
                </Suspense>
                <Suspense fallback={<div className="h-[280px] bg-bg-surface rounded-2xl animate-pulse" />}><TaskCompletionChart data={taskCompletion} loading={loadingTasks} /></Suspense>
                <Suspense fallback={<div className="h-[280px] bg-bg-surface rounded-2xl animate-pulse" />}><ErrorBoundary><AISummaryWidget /></ErrorBoundary></Suspense>
            </div>

            {capitalData && (<Suspense fallback={<div className="h-64 bg-bg-surface rounded-2xl animate-pulse" />}><CapitalDisbursementChart data={capitalData} /></Suspense>)}

            {/* DEPT KPI + CALENDAR + ACTIVITY FEED */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="section-card">
                    <div className="section-card-header"><div className="flex items-center gap-2"><div className="section-icon"><Users className="w-3.5 h-3.5" /></div><span>KPI phòng ban tháng {new Date().getMonth() + 1}</span></div></div>
                    <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[280px] overflow-y-auto">
                        {deptKPIs.length === 0 ? (<EmptyState icon={<Users className="w-10 h-10" />} title="Chưa có dữ liệu" className="py-6" />) : deptKPIs.map((d: any) => (
                            <div key={d.code} className="p-3 flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-txt-secondary truncate">{d.name}</p>
                                    <div className="mt-1.5 flex items-center gap-2"><div className="flex-1 h-1.5 bg-bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${d.rate >= 80 ? 'bg-emerald-500' : d.rate >= 50 ? 'bg-warning-500' : 'bg-rose-500'}`} style={{ width: `${d.rate}%` }} /></div><span className="text-[10px] font-bold text-txt-muted w-8 text-right tabular-nums">{d.rate}%</span></div>
                                </div>
                                <span className="text-[10px] font-bold text-txt-placeholder shrink-0">{d.completed}/{d.total}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section-card">
                    <div className="section-card-header"><div className="flex items-center gap-2"><div className="section-icon"><CalendarIcon className="w-3.5 h-3.5" /></div><span>Lịch cơ quan tuần này</span></div><button onClick={() => navigate('/calendar')} className="text-xs font-bold text-primary-600 dark:text-primary-500 flex items-center gap-1">Xem tất cả <ArrowRight className="w-3 h-3" /></button></div>
                    <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[280px] overflow-y-auto">
                        {weekEvents.length === 0 ? (<EmptyState icon={<CalendarIcon className="w-10 h-10" />} title="Không có lịch trong tuần" className="py-6" />) : weekEvents.map((e: any) => (
                            <div key={e.id} className="p-3 flex items-start gap-3">
                                <div className="w-10 text-center shrink-0"><p className="text-xs font-bold text-primary-600 dark:text-primary-400">{new Date(e.start_time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</p><p className="text-[10px] text-gray-400">{new Date(e.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p></div>
                                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-txt-primary truncate">{e.title}</p>{e.location && <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {e.location}</p>}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <InlineActivityFeed />
            </div>

            <UpcomingDeadlines deadlines={data.upcomingDeadlines} label="Deadline toàn hệ thống" />
        </div>
    );
};

export default DirectorDashboard;
