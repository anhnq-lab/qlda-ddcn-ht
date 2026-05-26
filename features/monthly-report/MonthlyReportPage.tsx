import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { TaskSlidePanel } from '../tasks/components/TaskSlidePanel';
import { NotificationService } from '../../services/NotificationService';
import {
    FileText, CheckCircle2, AlertCircle, XCircle, Clock,
    ArrowRight, Download, Users, ChevronDown, ChevronRight,
    Lock, Unlock, FileCheck, RefreshCw, AlertTriangle
} from 'lucide-react';
import {
    DepartmentCode, DEPARTMENT_CODES, DEPARTMENT_NAMES
} from '../../types/plan.types';
import {
    TASK_CATEGORY_LABELS, TASK_CATEGORY_COLORS, TaskCategory, TaskStatus
} from '../../types/task.types';
import { StatusBadge, StatCard } from '../../components/ui';
import { MonthlyPlanItemService } from '../../services/PlanService';
import { getEmployees } from '../../services/EmployeeService';

interface MonthlyReportPageProps {
    month: number;
    year: number;
    leftElement?: React.ReactNode;
}

interface DeptSummary {
    department_code: DepartmentCode;
    total_tasks: number;
    done_tasks: number;
    in_progress_tasks: number;
    incomplete_tasks: number;
    on_time_done: number;
    completion_rate: number;
    on_time_rate: number;
    category_stats: Record<string, { total: number; done: number }>;
}

interface ReportTask {
    task_id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    task_type: string;
    category: TaskCategory;
    due_date: string;
    actual_end_date: string;
    progress: number;
    completion_result: string;
    incomplete_reason: string;
    incomplete_reason_type: 'objective' | 'subjective' | null;
    notes: string;
    project_id: string;
    project_name: string;
    assignee_id: string;
    assignee_name: string;
    department_code: DepartmentCode;
    report_month: number;
    report_year: number;
    is_on_time: boolean | null;
    monthly_plan_item_id: string | null;
    source_type: string | null;
}

interface DeptPlanState {
    id: string;
    department_code: DepartmentCode;
    report_status: 'open' | 'finalized' | 'approved';
    finalized_by?: string;
    finalized_at?: string;
    report_approved_by?: string;
    report_approved_at?: string;
}

const MONTH_NAMES = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: 'neutral' | 'success' | 'danger' | 'warning' | 'info' }> = {
    todo:        { label: 'Cần làm', icon: <Clock className="w-3 h-3" />, variant: 'neutral' },
    in_progress: { label: 'Đang làm', icon: <Clock className="w-3 h-3" />, variant: 'info' },
    done:        { label: 'Hoàn thành', icon: <CheckCircle2 className="w-3.5 h-3.5" />, variant: 'success' },
    incomplete:  { label: 'Chưa xong', icon: <XCircle className="w-3.5 h-3.5" />, variant: 'danger' },
};

const MonthlyReportPage: React.FC<MonthlyReportPageProps> = ({ month, year, leftElement }) => {
    const { currentUser } = useAuth();
    const { openPanel } = useSlidePanel();

    const [summaries, setSummaries] = useState<DeptSummary[]>([]);
    const [tasks, setTasks] = useState<ReportTask[]>([]);
    const [plans, setPlans] = useState<Record<string, DeptPlanState>>({});
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [seeding, setSeeding] = useState<boolean>(false);
    const [exporting, setExporting] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [expandedDepts, setExpandedDepts] = useState<Set<DepartmentCode>>(new Set());

    // User roles check
    const userRole = (currentUser?.Role as string) || 'User';
    const userDept = currentUser?.Department || '';
    const isDirector = userRole === 'Director' || userRole === 'DeputyDirector' || userRole === 'Admin';
    const isDeptHead = userRole === 'DepartmentHead';

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const { exportMonthlyReport } = await import('../monthly-plan/exportMonthlyReport');
            await exportMonthlyReport(month, year);
        } catch (e) {
            console.error('Lỗi khi xuất excel báo cáo:', e);
            alert('Không thể xuất báo cáo Excel.');
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [month, year]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch summary stats via RPC
            const { data: summaryData, error: summaryErr } = await (supabase as any).rpc(
                'get_monthly_report_summary',
                { p_month: month, p_year: year }
            );
            if (summaryErr) throw summaryErr;
            setSummaries((summaryData || []) as DeptSummary[]);

            // 2. Fetch all tasks for this month
            const { data: tasksData, error: tasksErr } = await (supabase as any)
                .from('monthly_report_view')
                .select('*')
                .eq('report_month', month)
                .eq('report_year', year);
            if (tasksErr) throw tasksErr;
            setTasks((tasksData || []) as ReportTask[]);

            // 3. Fetch monthly plans approval states
            const { data: plansData, error: plansErr } = await (supabase as any)
                .from('monthly_plans')
                .select('id, department_code, report_status, finalized_by, finalized_at, report_approved_by, report_approved_at')
                .eq('plan_month', month)
                .eq('plan_year', year);
            if (plansErr) throw plansErr;

            const plansMap: Record<string, DeptPlanState> = {};
            (plansData || []).forEach((p: any) => {
                plansMap[p.department_code] = p as DeptPlanState;
            });
            setPlans(plansMap);

            // 4. Fetch employees in department if needed
            const empList = await getEmployees();
            setEmployees(empList);
        } catch (e) {
            console.error('Lỗi khi tải báo cáo tháng:', e);
        } finally {
            setLoading(false);
        }
    };

    const toggleDeptExpand = (deptCode: DepartmentCode) => {
        setExpandedDepts(prev => {
            const next = new Set(prev);
            if (next.has(deptCode)) {
                next.delete(deptCode);
            } else {
                next.add(deptCode);
            }
            return next;
        });
    };

    const openTaskDetail = (taskId: string, title: string) => {
        openPanel({
            title: title,
            icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
            component: <TaskSlidePanel taskId={taskId} onClose={() => {}} />,
            width: '50vw',
        });
    };

    // Aggregate statistics
    const stats = useMemo(() => {
        let total = 0;
        let done = 0;
        let inProgress = 0;
        let incomplete = 0;
        summaries.forEach(s => {
            total += Number(s.total_tasks);
            done += Number(s.done_tasks);
            inProgress += Number(s.in_progress_tasks);
            incomplete += Number(s.incomplete_tasks);
        });
        return { total, done, inProgress, incomplete };
    }, [summaries]);

    // Seed tasks from Annual / Project plans
    const handleSeedTasks = async (deptCode: DepartmentCode) => {
        setSeeding(true);
        try {
            // Seed from annual plan first
            await MonthlyPlanItemService.seedTasksFromAnnualPlan(month, year, deptCode, currentUser?.EmployeeID);

            // Get employee IDs in this department to filter project steps
            const deptEmpIds = employees
                .filter(e => e.Department === deptCode)
                .map(e => e.EmployeeID);

            // Seed from project steps
            await MonthlyPlanItemService.seedTasksFromProjectSteps(month, year, deptCode, deptEmpIds, currentUser?.EmployeeID);

            // Reload data
            await loadData();
        } catch (e) {
            console.error('Lỗi khi sinh công việc:', e);
        } finally {
            setSeeding(false);
        }
    };

    // Lock/Finalize department report (Trưởng phòng)
    const handleFinalizeReport = async (deptCode: DepartmentCode) => {
        setActionLoading(`${deptCode}_finalize`);
        try {
            // Create monthly plan header if not exists
            const deptName = DEPARTMENT_NAMES[deptCode] || deptCode;
            const { data: plan, error: planErr } = await (supabase as any)
                .from('monthly_plans')
                .upsert({
                    plan_month: month,
                    plan_year: year,
                    department_code: deptCode,
                    department_name: deptName,
                }, { onConflict: 'plan_month,plan_year,department_code' })
                .select('id')
                .single();
            if (planErr) throw planErr;

            const { error } = await (supabase as any)
                .from('monthly_plans')
                .update({
                    report_status: 'finalized',
                    finalized_by: currentUser?.EmployeeID,
                    finalized_at: new Date().toISOString()
                })
                .eq('id', plan.id);
            if (error) throw error;

            // Trigger notifications to leadership
            try {
                const { data: leaders } = await (supabase as any)
                    .from('employees')
                    .select('employee_id')
                    .or('role.eq.director,role.eq.deputy_director,position.ilike.%Giám đốc%');

                if (leaders && leaders.length > 0) {
                    for (const leader of leaders) {
                        await NotificationService.notifyApprovalNeeded(
                            'monthly_report',
                            plan.id,
                            `Báo cáo tháng ${month}/${year} phòng ${deptCode} chờ duyệt`,
                            leader.employee_id
                        );
                    }
                }
            } catch (notifErr) {
                console.error('Failed to trigger monthly report submission notifications:', notifErr);
            }

            await loadData();
        } catch (e) {
            console.error('Lỗi khi khóa báo cáo:', e);
        } finally {
            setActionLoading(null);
        }
    };

    // Approve department report (Lãnh đạo Ban)
    const handleApproveReport = async (deptCode: DepartmentCode) => {
        const plan = plans[deptCode];
        if (!plan) return;
        setActionLoading(`${deptCode}_approve`);
        try {
            const { error } = await (supabase as any)
                .from('monthly_plans')
                .update({
                    report_status: 'approved',
                    report_approved_by: currentUser?.EmployeeID,
                    report_approved_at: new Date().toISOString()
                })
                .eq('id', plan.id);
            if (error) throw error;

            // Trigger notifications to department heads
            try {
                const { data: managers } = await (supabase as any)
                    .from('employees')
                    .select('employee_id')
                    .eq('department', deptCode)
                    .or('role.eq.department_head,role.eq.manager,position.ilike.%Trưởng phòng%');

                if (managers && managers.length > 0) {
                    for (const mgr of managers) {
                        await NotificationService.createNotification(
                            mgr.employee_id,
                            `Báo cáo tháng ${month}/${year} đã được phê duyệt`,
                            `Phê duyệt bởi Lãnh đạo`,
                            'success',
                            `/work-plan?tab=monthly-report`
                        );
                    }
                }
            } catch (notifErr) {
                console.error('Failed to trigger monthly report approval notifications:', notifErr);
            }

            await loadData();
        } catch (e) {
            console.error('Lỗi khi phê duyệt báo cáo:', e);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent space-y-4">
            {/* Header / Actions */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 shrink-0">
                {leftElement ? (
                    <div className="flex items-center gap-2">
                        {leftElement}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary-500" />
                            Báo cáo kết quả công việc {MONTH_NAMES[month]}/{year}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Tổng hợp tiến độ và kết quả từ module Công việc
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {/* Synchronize/Seed button for TP/Admin */}
                    {isDeptHead && (
                        <button
                            onClick={() => handleSeedTasks(userDept as DepartmentCode)}
                            disabled={seeding || loading || exporting}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-350 text-xs font-bold transition-all bg-white dark:bg-slate-800 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
                            Đồng bộ công việc tuần
                        </button>
                    )}

                    {/* Nút Xuất Excel báo cáo giao ban */}
                    <button
                        onClick={handleExportExcel}
                        disabled={loading || exporting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                    >
                        <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-pulse' : ''}`} />
                        Xuất Excel
                    </button>
                </div>
            </div>

            {/* KPI statistics cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                <StatCard
                    label="Tổng số công việc"
                    value={stats.total}
                    icon={<FileText className="w-4 h-4" />}
                    color="primary"
                    loading={loading}
                />
                <StatCard
                    label="Đã hoàn thành"
                    value={stats.done}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    color="emerald"
                    loading={loading}
                />
                <StatCard
                    label="Đang thực hiện"
                    value={stats.inProgress}
                    icon={<Clock className="w-4 h-4" />}
                    color="blue"
                    loading={loading}
                />
                <StatCard
                    label="Chưa hoàn thành"
                    value={stats.incomplete}
                    icon={<XCircle className="w-4 h-4" />}
                    color="danger"
                    loading={loading}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
                {loading && summaries.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-500 text-sm">
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                        Đang tải báo cáo...
                    </div>
                ) : summaries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400 dark:text-slate-500">
                        <AlertTriangle className="w-8 h-8 opacity-40 text-warning-500" />
                        <p className="text-xs">Chưa có công việc nào được lập cho tháng này.</p>
                        {isDeptHead && (
                            <button
                                onClick={() => handleSeedTasks(userDept as DepartmentCode)}
                                className="mt-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 transition-colors"
                            >
                                Đồng bộ công việc từ KH khung & dự án
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Summary table */}
                        <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="w-8"></th>
                                        <th className="px-4 py-3 text-left">Phòng ban / Đơn vị</th>
                                        <th className="px-4 py-3 text-center w-24">Tổng CV</th>
                                        <th className="px-4 py-3 text-center w-24 text-emerald-600 dark:text-emerald-450">Hoàn thành</th>
                                        <th className="px-4 py-3 text-center w-24 text-blue-600 dark:text-blue-450">Đang làm</th>
                                        <th className="px-4 py-3 text-center w-24 text-red-650 dark:text-red-400">Chưa xong</th>
                                        <th className="px-4 py-3 text-center w-28">Tỷ lệ HT</th>
                                        <th className="px-4 py-3 text-center w-28">Đúng hạn</th>
                                        <th className="px-4 py-3 text-center w-36">Trạng thái</th>
                                        <th className="px-4 py-3 text-center w-40">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                                    {summaries.map(s => {
                                        const isExpanded = expandedDepts.has(s.department_code);
                                        const planState = plans[s.department_code] || { report_status: 'open' };
                                        const isOwnDept = userDept === s.department_code;

                                        // Status design variant
                                        let statusLabel = 'Đang mở';
                                        let statusVariant: 'neutral' | 'warning' | 'success' = 'neutral';
                                        if (planState.report_status === 'finalized') {
                                            statusLabel = 'Đã khóa';
                                            statusVariant = 'warning';
                                        } else if (planState.report_status === 'approved') {
                                            statusLabel = 'Đã duyệt';
                                            statusVariant = 'success';
                                        }

                                        return (
                                            <React.Fragment key={s.department_code}>
                                                <tr className="hover:bg-slate-50/55 dark:hover:bg-slate-800/40 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-350">
                                                    <td className="text-center py-3 pl-2">
                                                        <button
                                                            onClick={() => toggleDeptExpand(s.department_code)}
                                                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors text-slate-400"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="w-4 h-4" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 dark:text-white">
                                                                {DEPARTMENT_NAMES[s.department_code] || s.department_code}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-normal">
                                                                Mã: {s.department_code}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-slate-550 dark:text-slate-400 font-mono">
                                                        {s.total_tasks}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-450 font-mono bg-emerald-500/5 dark:bg-emerald-500/10">
                                                        {s.done_tasks}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-450 font-mono">
                                                        {s.in_progress_tasks}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-red-600 dark:text-red-450 font-mono bg-red-500/5 dark:bg-red-500/10">
                                                        {s.incomplete_tasks}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <StatusBadge
                                                            variant={s.completion_rate >= 90 ? 'success' : s.completion_rate >= 70 ? 'warning' : 'danger'}
                                                            label={`${s.completion_rate}%`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <StatusBadge
                                                            variant={s.on_time_rate >= 90 ? 'success' : s.on_time_rate >= 70 ? 'warning' : 'danger'}
                                                            label={`${s.on_time_rate}%`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <StatusBadge
                                                            variant={statusVariant}
                                                            label={statusLabel}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {/* TP khóa báo cáo của phòng mình */}
                                                            {isDeptHead && isOwnDept && planState.report_status === 'open' && (
                                                                <button
                                                                    onClick={() => handleFinalizeReport(s.department_code)}
                                                                    disabled={actionLoading === `${s.department_code}_finalize`}
                                                                    className="flex items-center gap-1 px-2.5 py-1 bg-warning-550 text-white rounded text-[11px] font-bold hover:bg-warning-600 transition-colors shadow-sm disabled:opacity-50"
                                                                >
                                                                    <Lock className="w-3 h-3" />
                                                                    Khóa BC
                                                                </button>
                                                            )}
                                                            {/* Lãnh đạo phê duyệt báo cáo đã khóa */}
                                                            {isDirector && planState.report_status === 'finalized' && (
                                                                <button
                                                                    onClick={() => handleApproveReport(s.department_code)}
                                                                    disabled={actionLoading === `${s.department_code}_approve`}
                                                                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                                                                >
                                                                    <FileCheck className="w-3 h-3" />
                                                                    Duyệt BC
                                                                </button>
                                                            )}
                                                            {/* Unlocking or editing for directors */}
                                                            {isDirector && planState.report_status === 'approved' && (
                                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                                                                    <FileCheck className="w-3 h-3 text-emerald-500" />
                                                                    Đã phê duyệt
                                                                </span>
                                                            )}
                                                            {planState.report_status === 'open' && !isOwnDept && (
                                                                <span className="text-[11px] text-slate-400 italic">Đang lập...</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded Tasks list for department */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={10} className="bg-slate-50/30 dark:bg-slate-900/60 p-4">
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                                                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wide">
                                                                        Chi tiết công việc — {DEPARTMENT_NAMES[s.department_code]}
                                                                    </h4>
                                                                    <span className="text-[10px] text-slate-400">
                                                                        {tasks.filter(t => t.department_code === s.department_code).length} công việc
                                                                    </span>
                                                                </div>

                                                                <DeptTasksList
                                                                    deptTasks={tasks.filter(t => t.department_code === s.department_code)}
                                                                    onTaskClick={(id, title) => openTaskDetail(id, title)}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper Component: Sub-table for tasks in expanded department, grouped by 13 categories
interface DeptTasksListProps {
    deptTasks: ReportTask[];
    onTaskClick: (taskId: string, title: string) => void;
}

const DeptTasksList: React.FC<DeptTasksListProps> = ({ deptTasks, onTaskClick }) => {
    // Group tasks by category
    const grouped = useMemo(() => {
        const map: Record<TaskCategory, ReportTask[]> = {} as any;
        deptTasks.forEach(task => {
            const cat = task.category || 'khac';
            if (!map[cat]) map[cat] = [];
            map[cat].push(task);
        });
        return map;
    }, [deptTasks]);

    const activeCategories = useMemo(() => {
        return Object.keys(grouped).filter(cat => (grouped[cat as TaskCategory] || []).length > 0) as TaskCategory[];
    }, [grouped]);

    if (deptTasks.length === 0) {
        return (
            <div className="text-center py-6 text-slate-450 dark:text-slate-500 text-xs italic">
                Không có công việc nào trong kỳ báo cáo này
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {activeCategories.map(cat => {
                const catTasks = grouped[cat] || [];
                const color = TASK_CATEGORY_COLORS[cat] || TASK_CATEGORY_COLORS.khac;
                const label = TASK_CATEGORY_LABELS[cat] || TASK_CATEGORY_LABELS.khac;

                return (
                    <div key={cat} className="space-y-2 border border-slate-100 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${color.bg} ${color.text} ${color.border}`}>
                                {label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                                {catTasks.length} CV
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="text-[10px] text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="pb-1 text-left w-12">STT</th>
                                        <th className="pb-1 text-left">Nội dung công việc</th>
                                        <th className="pb-1 text-left w-36">Người đảm nhận</th>
                                        <th className="pb-1 text-center w-24">Hạn hoàn thành</th>
                                        <th className="pb-1 text-center w-24">Trạng thái</th>
                                        <th className="pb-1 text-left">Kết quả / Lý do chưa HT</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-650 dark:text-slate-350">
                                    {catTasks.map((t, idx) => {
                                        const statusCfg = STATUS_CONFIG[t.status] || { label: t.status, icon: null, variant: 'neutral' };
                                        return (
                                            <tr
                                                key={t.task_id}
                                                onClick={() => onTaskClick(t.task_id, t.title)}
                                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                                            >
                                                <td className="py-2.5 pr-2 font-mono text-slate-400 tabular-nums">
                                                    {idx + 1}
                                                </td>
                                                <td className="py-2.5 pr-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                            {t.title}
                                                        </span>
                                                        {t.description && (
                                                            <span className="text-[11px] text-slate-450 dark:text-slate-450 line-clamp-1">
                                                                {t.description}
                                                            </span>
                                                        )}
                                                        {t.project_name && (
                                                            <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold mt-0.5">
                                                                {t.project_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 pr-2 font-bold text-slate-700 dark:text-slate-300">
                                                    {t.assignee_name || 'Chưa phân công'}
                                                </td>
                                                <td className="py-2.5 pr-2 text-center text-slate-500 font-mono">
                                                    {t.due_date ? new Date(t.due_date).toLocaleDateString('vi-VN') : '—'}
                                                </td>
                                                <td className="py-2.5 text-center pr-2">
                                                    <div className="flex justify-center">
                                                        <StatusBadge
                                                            variant={statusCfg.variant as any}
                                                            label={statusCfg.label}
                                                            icon={statusCfg.icon}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-2.5">
                                                    {t.status === 'done' && (
                                                        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                                                            <span className="text-emerald-600 dark:text-emerald-500 font-bold mr-1">KQ:</span>
                                                            {t.completion_result || 'Đã hoàn thành'}
                                                            {t.is_on_time === false && (
                                                                <span className="ml-1.5 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded text-[9px] font-bold border border-amber-200/50">
                                                                    Trễ hạn
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {t.status === 'incomplete' && (
                                                        <div className="text-[11px] text-red-650 dark:text-red-400 font-medium">
                                                            <span className="font-bold mr-1">Lý do:</span>
                                                            {t.incomplete_reason || 'Chưa hoàn thành'}
                                                            {t.incomplete_reason_type && (
                                                                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                                                    t.incomplete_reason_type === 'objective'
                                                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200/50'
                                                                        : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200/50'
                                                                }`}>
                                                                    {t.incomplete_reason_type === 'objective' ? 'Khách quan' : 'Chủ quan'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MonthlyReportPage;
