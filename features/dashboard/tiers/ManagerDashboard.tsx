/**
 * ManagerDashboard — Tầng 2: Trưởng/Phó phòng
 * Renders department-specific widgets based on departmentGroup.
 */
import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CheckCircle2, ClipboardList, AlertTriangle, Users, ArrowRight, FolderKanban } from 'lucide-react';
import { StatCard, EmptyState } from '../../../components/ui';
import type { DashboardConfig } from '../hooks/useDashboardConfig';
import type { useDepartmentData } from '../hooks/useDepartmentData';
import { WelcomeHeader } from '../widgets/shared/WelcomeHeader';
import { MonthlyPlanProgress } from '../widgets/shared/MonthlyPlanProgress';
import { UpcomingDeadlines } from '../widgets/shared/UpcomingDeadlines';

// Lazy load department-specific widgets
const BiddingPipeline = lazy(() => import('../widgets/khdt/BiddingPipeline'));
const ContractSummary = lazy(() => import('../widgets/khdt/ContractSummary'));
const ReviewQueue = lazy(() => import('../widgets/kttd/ReviewQueue'));
const HRSummary = lazy(() => import('../widgets/hcth/HRSummary'));
const PaymentPipeline = lazy(() => import('../widgets/tckt/PaymentPipeline'));
const ProjectProgress = lazy(() => import('../widgets/qlda/ProjectProgress'));

interface Props {
    config: DashboardConfig;
    data: ReturnType<typeof useDepartmentData>;
}

const WidgetSkeleton = () => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl animate-pulse h-[280px]" />
);

export const ManagerDashboard: React.FC<Props> = ({ config, data }) => {
    const navigate = useNavigate();
    const stats = data.deptTaskStats;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <WelcomeHeader config={config} />

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

            {/* ── DEPARTMENT-SPECIFIC WIDGETS ── */}
            <Suspense fallback={<WidgetSkeleton />}>
                {config.departmentGroup === 'qlda' && (
                    <ProjectProgress data={data} />
                )}
                {config.departmentGroup === 'khdt' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <BiddingPipeline />
                        <ContractSummary />
                    </div>
                )}
                {config.departmentGroup === 'kttd' && (
                    <ReviewQueue />
                )}
                {config.departmentGroup === 'hcth' && (
                    <HRSummary />
                )}
                {config.departmentGroup === 'tckt' && (
                    <PaymentPipeline />
                )}
            </Suspense>

            {/* ── SHARED: Team + KH tháng ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Team members + workload */}
                <div className="section-card">
                    <div className="section-card-header">
                        <div className="flex items-center gap-2">
                            <div className="section-icon"><Users className="w-3.5 h-3.5" /></div>
                            <span>Thành viên phòng ({data.deptEmployees.length})</span>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[280px] overflow-y-auto">
                        {data.deptEmployees.length === 0 ? (
                            <EmptyState icon={<Users className="w-10 h-10" />} title="Không có dữ liệu" className="py-6" />
                        ) : data.deptEmployees.map((emp: any) => {
                            const empTasks = data.deptTasks.filter((t: any) => t.AssigneeID === emp.employee_id);
                            const empOverdue = empTasks.filter((t: any) => t.Status !== 'Done' && new Date(t.DueDate) < new Date()).length;
                            return (
                                <div key={emp.employee_id} className="p-3 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                        {emp.avatar_url ? (
                                            <img src={emp.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{(emp.full_name || '?')[0]}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-700 dark:text-slate-200 truncate">{emp.full_name}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-slate-400">{emp.position}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">{empTasks.length} việc</span>
                                        {empOverdue > 0 && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">{empOverdue} trễ</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Monthly Plan */}
                <MonthlyPlanProgress stats={data.monthlyPlanStats} title={`KH tháng — ${config.departmentName}`} />
            </div>

            {/* Deadlines */}
            <UpcomingDeadlines deadlines={data.upcomingDeadlines} label="Deadline phòng ban" />
        </div>
    );
};

export default ManagerDashboard;
