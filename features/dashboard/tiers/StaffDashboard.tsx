/**
 * StaffDashboard — Tầng 3: Chuyên viên / Nhân viên
 * Focus: task cá nhân, deadline, KH tháng, productivity.
 */
import React, { Suspense, lazy, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CheckCircle2, Clock, AlertTriangle, ArrowRight, FileText, ClipboardList, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { StatCard, EmptyState } from '../../../components/ui';
import { TaskStatus, TaskPriority } from '../../../types';
import type { DashboardConfig } from '../hooks/useDashboardConfig';
import type { useDepartmentData } from '../hooks/useDepartmentData';
import { WelcomeHeader } from '../widgets/shared/WelcomeHeader';
import { MonthlyPlanProgress } from '../widgets/shared/MonthlyPlanProgress';
import { UpcomingDeadlines } from '../widgets/shared/UpcomingDeadlines';
import { InlineActivityFeed } from '../widgets/shared/InlineActivityFeed';

interface Props {
    config: DashboardConfig;
    data: ReturnType<typeof useDepartmentData>;
}

const AISummaryWidget = lazy(() => import('../../../components/ai/AISummaryWidget'));

const WidgetSkeleton = () => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl animate-pulse h-[280px]" />
);

const priorityColors: Record<string, string> = {
    [TaskPriority.Urgent]: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    [TaskPriority.High]: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    [TaskPriority.Medium]: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    [TaskPriority.Low]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const statusLabels: Record<string, string> = {
    [TaskStatus.Todo]: 'Chờ xử lý',
    [TaskStatus.InProgress]: 'Đang làm',
    [TaskStatus.Review]: 'Chờ duyệt',
    [TaskStatus.Done]: 'Hoàn thành',
};

export const StaffDashboard: React.FC<Props> = ({ config, data }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const stats = data.myTaskStats;

    const personalContext = useMemo(() => {
        if (!currentUser) return undefined;
        return {
            fullName: currentUser.FullName || 'Cán bộ',
            role: currentUser.Position || 'Chuyên viên',
            department: currentUser.Department || config.departmentName,
            stats: {
                inProgress: data.myTaskStats.inProgress,
                todo: data.myTaskStats.todo,
                done: data.myTaskStats.done,
                overdue: data.myTaskStats.overdue,
                total: data.myTaskStats.total,
            },
            tasks: data.myTasks.slice(0, 10).map((t: any) => ({
                Title: t.Title,
                Status: t.Status,
                DueDate: t.DueDate,
                Priority: t.Priority,
            })),
            deadlines: data.upcomingDeadlines.slice(0, 5).map((d: any) => {
                const daysLeft = Math.ceil((new Date(d.DueDate).getTime() - new Date().getTime()) / 86400000);
                return {
                    Title: d.Title,
                    DueDate: d.DueDate,
                    daysLeft: isNaN(daysLeft) ? 0 : daysLeft,
                };
            }),
        };
    }, [currentUser, data.myTaskStats, data.myTasks, data.upcomingDeadlines, config.departmentName]);

    // Active tasks (not done)
    const activeTasks = data.myTasks
        .filter(t => t.Status !== TaskStatus.Done)
        .sort((a, b) => new Date(a.DueDate).getTime() - new Date(b.DueDate).getTime())
        .slice(0, 8);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <WelcomeHeader config={config} taskStats={data.myTaskStats} />

            {/* KPI Cards - Staff */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                    label="Dự án phụ trách"
                    value={data.myProjects.length.toString()}
                    icon={<Briefcase className="w-5 h-5 flex-shrink-0" />}
                    color="slate"
                    onClick={() => navigate('/projects')}
                />
                <StatCard
                    label="Đang thực hiện"
                    value={stats.inProgress.toString()}
                    icon={<ClipboardList className="w-5 h-5 flex-shrink-0" />}
                    color="blue"
                    onClick={() => navigate('/work-plan')}
                />
                <StatCard
                    label="Hoàn thành"
                    value={stats.done.toString()}
                    icon={<CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                    color="emerald"
                />
                <StatCard
                    label="Quá hạn"
                    value={stats.overdue.toString()}
                    icon={<AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                    color="rose"
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-bg-surface border border-border rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-wrap gap-3 items-center">
                <span className="text-xs font-black uppercase text-txt-secondary tracking-wider mr-2">Thao tác nhanh:</span>
                <button
                    onClick={() => navigate('/work-plan')}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-sm cursor-pointer"
                >
                    <Plus className="w-3.5 h-3.5" /> Tạo việc mới
                </button>
                <button
                    onClick={() => navigate('/reports')}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-txt-secondary bg-bg-muted hover:bg-bg-app border border-border transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-sm cursor-pointer"
                >
                    <FileText className="w-3.5 h-3.5" /> Báo cáo KH tháng
                </button>
                <button
                    onClick={() => navigate('/calendar')}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-txt-secondary bg-bg-muted hover:bg-bg-app border border-border transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-sm cursor-pointer"
                >
                    <CalendarIcon className="w-3.5 h-3.5" /> Xem lịch cơ quan
                </button>
            </div>

            {/* Main grid: AI Assistant + Tasks + KH tháng */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* AI Personal Assistant */}
                <Suspense fallback={<WidgetSkeleton />}><AISummaryWidget personalContext={personalContext} /></Suspense>

                {/* Active Tasks */}
                <div className="section-card">
                    <div className="section-card-header">
                        <div className="flex items-center gap-2">
                            <div className="section-icon"><ClipboardList className="w-3.5 h-3.5" /></div>
                            <span>Công việc đang xử lý</span>
                        </div>
                        <button onClick={() => navigate('/work-plan')} className="text-xs font-bold text-primary-600 dark:text-primary-500 flex items-center gap-1">
                            Xem tất cả <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[320px] overflow-y-auto">
                        {activeTasks.length === 0 ? (
                            <EmptyState icon={<CheckCircle2 className="w-10 h-10" />} title="Không có công việc đang xử lý" className="py-6" />
                        ) : activeTasks.map(task => {
                            const isOverdue = new Date(task.DueDate) < new Date();
                            return (
                                <div key={task.TaskID} onClick={() => navigate(`/tasks/${task.TaskID}`)} className="p-3 hover:bg-bg-app dark:hover:bg-slate-700 cursor-pointer transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{task.Title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${priorityColors[task.Priority] || ''}`}>
                                                    {statusLabels[task.Status] || task.Status}
                                                </span>
                                                {isOverdue && (
                                                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">Trễ hạn</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`text-[11px] font-bold shrink-0 ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 dark:text-slate-400'}`}>
                                            {new Date(task.DueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Monthly Plan */}
                <MonthlyPlanProgress stats={data.monthlyPlanStats} title="KH tháng cá nhân" />
            </div>

            {/* Projects & Activities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.myProjects.length > 0 ? (
                    <div className="section-card">
                        <div className="section-card-header">
                            <div className="flex items-center gap-2">
                                <div className="section-icon"><FileText className="w-3.5 h-3.5" /></div>
                                <span>Dự án phụ trách ({data.myProjects.length})</span>
                            </div>
                            <button onClick={() => navigate('/projects')} className="text-xs font-bold text-primary-600 dark:text-primary-500 flex items-center gap-1">
                                Xem tất cả <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[300px] overflow-y-auto">
                            {data.myProjects.slice(0, 5).map((p: any) => (
                                <div key={p.ProjectID} onClick={() => navigate(`/projects/${p.ProjectID}`)} className="p-3 hover:bg-bg-subtle/50 cursor-pointer transition-colors">
                                    <p className="text-xs font-bold text-gray-700 dark:text-slate-200 truncate">{p.ProjectName}</p>
                                    <p className="text-[11px] text-txt-muted mt-0.5">{p.ManagementUnit || '—'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="section-card flex flex-col justify-center items-center py-10">
                        <EmptyState icon={<FileText className="w-10 h-10" />} title="Chưa được phân công dự án" />
                    </div>
                )}

                <InlineActivityFeed />
            </div>

            {/* Deadlines */}
            <UpcomingDeadlines deadlines={data.upcomingDeadlines} label="Deadline của tôi" />
        </div>
    );
};

export default StaffDashboard;
