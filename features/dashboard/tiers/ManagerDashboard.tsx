/**
 * ManagerDashboard — Tầng 2: Trưởng/Phó phòng
 * Renders department-specific widgets based on departmentGroup.
 */
import React, { Suspense, lazy, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CheckCircle2, ClipboardList, AlertTriangle, Users, ArrowRight, FolderKanban } from 'lucide-react';
import { StatCard, EmptyState, Avatar } from '../../../components/ui';
import type { DashboardConfig } from '../hooks/useDashboardConfig';
import type { useDepartmentData } from '../hooks/useDepartmentData';
import { WelcomeHeader } from '../widgets/shared/WelcomeHeader';
import { MonthlyPlanProgress } from '../widgets/shared/MonthlyPlanProgress';
import { UpcomingDeadlines } from '../widgets/shared/UpcomingDeadlines';
import { InlineActivityFeed } from '../widgets/shared/InlineActivityFeed';
import { useAuth } from '../../../context/AuthContext';

// Lazy load department-specific widgets
const BiddingPipeline = lazy(() => import('../widgets/bidding_contract/BiddingPipeline'));
const ContractSummary = lazy(() => import('../widgets/bidding_contract/ContractSummary'));
const ReviewQueue = lazy(() => import('../widgets/quality_control/ReviewQueue'));
const HRSummary = lazy(() => import('../widgets/hr/HRSummary'));
const PaymentPipeline = lazy(() => import('../widgets/finance/PaymentPipeline'));
const ProjectProgress = lazy(() => import('../widgets/projects/ProjectProgress'));
const TeamWorkloadChart = lazy(() => import('../components/TeamWorkloadChart'));
const AISummaryWidget = lazy(() => import('../../../components/ai/AISummaryWidget'));

interface Props {
    config: DashboardConfig;
    data: ReturnType<typeof useDepartmentData>;
}

const WidgetSkeleton = () => (
    <div className="bg-bg-surface rounded-2xl animate-pulse h-[280px]" />
);

export const ManagerDashboard: React.FC<Props> = ({ config, data }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const stats = data.deptTaskStats;
    const [teamTab, setTeamTab] = useState<'list' | 'chart'>('list');

    const personalContext = useMemo(() => {
        if (!currentUser) return undefined;
        return {
            fullName: currentUser.FullName || 'Cán bộ',
            role: currentUser.Position || 'Trưởng phòng',
            department: currentUser.Department || config.departmentName,
            stats: {
                inProgress: data.deptTaskStats.inProgress,
                todo: data.deptTaskStats.todo,
                done: data.deptTaskStats.done,
                overdue: data.deptTaskStats.overdue,
                total: data.deptTaskStats.total,
            },
            tasks: data.deptTasks.slice(0, 10).map((t: any) => ({
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
    }, [currentUser, data.deptTaskStats, data.deptTasks, data.upcomingDeadlines, config.departmentName]);

    const workloadData = useMemo(() => {
        return data.deptEmployees.map((emp: any) => {
            const empTasks = data.deptTasks.filter((t: any) => t.AssigneeID === emp.employee_id);
            const inProgress = empTasks.filter((t: any) => t.Status === 'InProgress' || t.Status === 'in_progress').length;
            const done = empTasks.filter((t: any) => t.Status === 'Done' || t.Status === 'done').length;
            const overdue = empTasks.filter((t: any) => {
                if (t.Status === 'Done' || t.Status === 'done') return false;
                if (!t.DueDate) return false;
                return new Date(t.DueDate) < new Date();
            }).length;
            const total = empTasks.length;
            const todo = Math.max(0, total - inProgress - done);

            const nameParts = emp.full_name.trim().split(/\s+/);
            const shortName = nameParts.length > 1
                ? nameParts[nameParts.length - 2] + ' ' + nameParts[nameParts.length - 1]
                : emp.full_name;

            return {
                name: shortName,
                todo,
                inProgress,
                done,
                overdue,
            };
        });
    }, [data.deptEmployees, data.deptTasks]);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <WelcomeHeader config={config} taskStats={data.deptTaskStats} />

            {/* KPI Cards - Manager */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                    label={config.departmentGroup === 'qlda' ? 'Dự án phòng' : 'Tổng công việc'}
                    value={config.departmentGroup === 'qlda' ? data.deptProjects.length.toString() : stats.total.toString()}
                    icon={<Briefcase className="w-5 h-5 flex-shrink-0" />}
                    color="slate"
                    onClick={() => config.departmentGroup === 'qlda' ? navigate('/projects') : navigate('/work-plan')}
                />
                <StatCard
                    label="Đang thực hiện"
                    value={stats.inProgress.toString()}
                    icon={<ClipboardList className="w-5 h-5 flex-shrink-0" />}
                    color="blue"
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

            {/* ── DYNAMIC WIDGETS ── */}
            <Suspense fallback={<WidgetSkeleton />}>
                {config.allowedWidgets.includes('project_progress') && (
                    <ProjectProgress data={data} />
                )}
                
                {(config.allowedWidgets.includes('bidding_pipeline') || config.allowedWidgets.includes('contract_summary')) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {config.allowedWidgets.includes('bidding_pipeline') && <BiddingPipeline />}
                        {config.allowedWidgets.includes('contract_summary') && <ContractSummary />}
                    </div>
                )}
                
                {config.allowedWidgets.includes('review_queue') && (
                    <ReviewQueue />
                )}
                
                {config.allowedWidgets.includes('hr_summary') && (
                    <HRSummary />
                )}
                
                {config.allowedWidgets.includes('payment_pipeline') && (
                    <PaymentPipeline />
                )}
            </Suspense>

            {/* ── SHARED: AI Assistant + KH tháng + Team Workload ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* AI Personal Assistant */}
                <Suspense fallback={<WidgetSkeleton />}><AISummaryWidget personalContext={personalContext} /></Suspense>

                {/* Monthly Plan */}
                <MonthlyPlanProgress stats={data.monthlyPlanStats} title={`KH tháng — ${config.departmentName}`} />

                {/* Team members + workload */}
                <div className="section-card">
                    <div className="section-card-header flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="section-icon"><Users className="w-3.5 h-3.5" /></div>
                            <span>Thành viên phòng ({data.deptEmployees.length})</span>
                        </div>
                        <div className="flex bg-bg-subtle border border-border rounded-lg p-0.5 text-xs select-none">
                            <button
                                onClick={() => setTeamTab('list')}
                                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                    teamTab === 'list' 
                                        ? 'bg-bg-surface text-txt-primary shadow-sm' 
                                        : 'text-txt-muted hover:text-txt-primary'
                                }`}
                            >
                                Danh sách
                            </button>
                            <button
                                onClick={() => setTeamTab('chart')}
                                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                    teamTab === 'chart' 
                                        ? 'bg-bg-surface text-txt-primary shadow-sm' 
                                        : 'text-txt-muted hover:text-txt-primary'
                                }`}
                            >
                                Phân bổ
                            </button>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[280px] min-h-[200px] overflow-y-auto p-2">
                        {teamTab === 'list' ? (
                            data.deptEmployees.length === 0 ? (
                                <EmptyState icon={<Users className="w-10 h-10" />} title="Không có dữ liệu" className="py-6" />
                            ) : data.deptEmployees.map((emp: any) => {
                                const empTasks = data.deptTasks.filter((t: any) => t.AssigneeID === emp.employee_id);
                                const empOverdue = empTasks.filter((t: any) => t.Status !== 'Done' && t.Status !== 'done' && new Date(t.DueDate) < new Date()).length;
                                return (
                                    <div key={emp.employee_id} className="p-2.5 flex items-center gap-3 hover:bg-bg-subtle/50 rounded-xl transition-all">
                                        <Avatar
                                            name={emp.full_name}
                                            imageUrl={emp.avatar_url}
                                            size="sm"
                                            className="shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-txt-secondary truncate">{emp.full_name}</p>
                                            <p className="text-[11px] text-txt-muted truncate">{emp.position}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[11px] font-bold text-txt-muted">{empTasks.length} việc</span>
                                            {empOverdue > 0 && (
                                                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">{empOverdue} trễ</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <Suspense fallback={<div className="h-[240px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>}>
                                {workloadData.length === 0 ? (
                                    <EmptyState icon={<Users className="w-10 h-10" />} title="Không có dữ liệu" className="py-6" />
                                ) : (
                                    <div className="py-2 pr-2">
                                        <TeamWorkloadChart data={workloadData} />
                                    </div>
                                )}
                            </Suspense>
                        )}
                    </div>
                </div>
            </div>

            {/* ── SECOND ROW: Deadlines & Live Activity Feed ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <UpcomingDeadlines deadlines={data.upcomingDeadlines} label="Deadline phòng ban" />
                </div>
                <InlineActivityFeed />
            </div>
        </div>
    );
};

export default ManagerDashboard;
