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

    const { data: metrics, isLoading: loadingMetrics } = useQuery({
        queryKey: ['dashboard', 'overview', currentYear],
        queryFn: () => DashboardService.getOverviewMetrics(currentYear),
        staleTime: STALE_5M,
    });

    const { data: capitalData } = useQuery({
        queryKey: ['dashboard', 'capitalVsDisbursement', currentYear],
        queryFn: () => DashboardService.getCapitalVsDisbursement(currentYear),
        staleTime: STALE_5M,
    });

    const { data: taskCompletion, isLoading: loadingTasks } = useQuery({
        queryKey: ['dashboard', 'taskCompletion'],
        queryFn: DashboardService.getTaskCompletion,
        staleTime: STALE_5M,
    });

    const { data: deptKPIs = [] } = useQuery({
        queryKey: ['dashboard', 'dept-kpi-summary'],
        queryFn: async () => {
            const m = new Date().getMonth() + 1;
            const { data: plans } = await supabase
                .from('monthly_plans')
                .select('id, department_code, department_name, monthly_plan_items(id, status)')
                .eq('plan_month', m).eq('plan_year', currentYear);
            return (plans || []).map((p: any) => {
                const items = p.monthly_plan_items || [];
                const total = items.length;
                const completed = items.filter((i: any) => i.status === 'completed').length;
                return { code: p.department_code, name: p.department_name || DEPARTMENT_NAMES[p.department_code as DepartmentCode] || p.department_code, total, completed, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
            });
        },
        staleTime: STALE_5M,
    });

    const { data: weekEvents = [] } = useQuery({
        queryKey: ['dashboard', 'week-events'],
        queryFn: async () => {
            const now = new Date();
            const end = new Date(now); end.setDate(end.getDate() + 7);
            // calendar_events may not be in generated types yet
            const client: any = supabase;
            const { data } = await client.from('calendar_events').select('id, title, start_time, location').gte('start_time', now.toISOString()).lte('start_time', end.toISOString()).order('start_time').limit(5);
            return data || [];
        },
        staleTime: STALE_5M,
    });

    const statusSummary = useMemo(() => ({
        prep: data.allProjects.filter((p: any) => p.Status === 1).length,
        exec: data.allProjects.filter((p: any) => p.Status === 2).length,
        comp: data.allProjects.filter((p: any) => p.Status === 3).length,
    }), [data.allProjects]);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <WelcomeHeader config={config} />

            {/* KPI HERO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                <StatCard label="Dự án đang quản lý" value={data.allProjects.length.toString()} icon={<Building2 className="w-5 h-5 flex-shrink-0" />} color="slate" loading={loadingMetrics} onClick={() => navigate('/projects')} footer={<div className="flex items-center gap-1.5 flex-wrap mt-0.5"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">CB: {statusSummary.prep}</span><span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400">TH: {statusSummary.exec}</span><span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">KT: {statusSummary.comp}</span></div>} />
                <StatCard label="Tổng vốn đầu tư" value={metrics ? formatShortCurrency(metrics.totalInvestment) : '—'} icon={<Wallet className="w-5 h-5 flex-shrink-0" />} color="amber" loading={loadingMetrics} />
                <StatCard label={`KH vốn ${currentYear}`} value={metrics ? formatShortCurrency(metrics.yearlyPlanned) : '—'} icon={<TrendingUp className="w-5 h-5 flex-shrink-0" />} color="slate" loading={loadingMetrics} progressLabel="Giải ngân/KH" progressPercentage={metrics?.yearlyDisbursementRate || 0} />
                <StatCard label={`Giải ngân ${currentYear}`} value={metrics ? formatShortCurrency(metrics.yearlyDisbursed) : '—'} icon={<Activity className="w-5 h-5 flex-shrink-0" />} color="emerald" loading={loadingMetrics} trendLabel="Tiến độ" trendPercentage={metrics?.yearlyDisbursementRate || 0} />
                <StatCard label="Cảnh báo rủi ro" value={(metrics?.riskCount || 0).toString()} icon={<AlertTriangle className="w-5 h-5 flex-shrink-0" />} color="rose" loading={loadingMetrics} />
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Suspense fallback={<div className="h-[280px] bg-bg-surface rounded-2xl animate-pulse" />}><ProjectStatusChart statusSummary={statusSummary} /></Suspense>
                <Suspense fallback={<div className="h-[280px] bg-bg-surface rounded-2xl animate-pulse" />}><TaskCompletionChart data={taskCompletion} loading={loadingTasks} /></Suspense>
                <Suspense fallback={<div className="h-[280px] bg-bg-surface rounded-2xl animate-pulse" />}><ErrorBoundary><AISummaryWidget /></ErrorBoundary></Suspense>
            </div>

            {capitalData && (<Suspense fallback={<div className="h-64 bg-bg-surface rounded-2xl animate-pulse" />}><CapitalDisbursementChart data={capitalData} /></Suspense>)}

            {/* DEPT KPI + CALENDAR */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="section-card">
                    <div className="section-card-header"><div className="flex items-center gap-2"><div className="section-icon"><Users className="w-3.5 h-3.5" /></div><span>KPI phòng ban tháng {new Date().getMonth() + 1}</span></div></div>
                    <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[280px] overflow-y-auto">
                        {deptKPIs.length === 0 ? (<EmptyState icon={<Users className="w-10 h-10" />} title="Chưa có dữ liệu" className="py-6" />) : deptKPIs.map((d: any) => (
                            <div key={d.code} className="p-3 flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-700 dark:text-slate-200 truncate">{d.name}</p>
                                    <div className="mt-1.5 flex items-center gap-2"><div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${d.rate >= 80 ? 'bg-emerald-500' : d.rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${d.rate}%` }} /></div><span className="text-[10px] font-bold text-gray-600 dark:text-slate-300 w-8 text-right tabular-nums">{d.rate}%</span></div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 shrink-0">{d.completed}/{d.total}</span>
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
                                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{e.title}</p>{e.location && <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {e.location}</p>}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <UpcomingDeadlines deadlines={data.upcomingDeadlines} label="Deadline toàn hệ thống" />
        </div>
    );
};

export default DirectorDashboard;
