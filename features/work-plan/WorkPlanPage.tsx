import React, { useState, Suspense, useEffect } from 'react';
import { ClipboardList, CalendarDays, ListChecks } from 'lucide-react';
import { FilterChip } from '../../components/ui';
import PageLoadingFallback from '../../components/ui/PageLoadingFallback';
import { useTabSearchParam } from '../../hooks/useTabSearchParam';
import { DepartmentCode, DEPARTMENT_CODES, DEPARTMENT_NAMES } from '../../types/plan.types';
import { useScopedProjects } from '../../hooks/useScopedProjects';
import { TaskStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useImpersonation } from '../../context/ImpersonationContext';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

// Lazy-load each sub-module inside the bundle
const AnnualPlanPage  = React.lazy(() => import('../annual-plan/AnnualPlanPage'));
const MonthlyPlanPage = React.lazy(() => import('../monthly-plan/MonthlyPlanPage'));
const MonthlyReportPage = React.lazy(() => import('../monthly-report/MonthlyReportPage'));
const TaskList        = React.lazy(() => import('../tasks/TaskList'));

type TabKey = 'tasks' | 'annual' | 'monthly-report';

interface TabDef {
    key: TabKey;
    label: string;
    icon: React.ElementType;
}

const TABS: TabDef[] = [
    { key: 'tasks',          label: 'Công việc',       icon: ListChecks   },
    { key: 'annual',         label: 'KH khung năm',     icon: ClipboardList },
    { key: 'monthly-report', label: 'Báo cáo tháng',    icon: CalendarDays },
];

const CURRENT_DATE = new Date();
const CURRENT_YEAR = CURRENT_DATE.getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const WorkPlanPage: React.FC = () => {
    const [active, setActive] = useTabSearchParam<TabKey>('monthly-report', ['tasks', 'annual', 'monthly-report'] as const);
    const [subTab, setSubTab] = useTabSearchParam<'plan' | 'report'>('plan', ['plan', 'report'] as const, 'sub');
    type FilterDeptCode = DepartmentCode | 'All';
    const FILTER_DEPT_CODES = [...DEPARTMENT_CODES, 'All'] as const;
    const [dept, setDept] = useTabSearchParam<FilterDeptCode>('HCTH', FILTER_DEPT_CODES, 'dept');
    
    const { currentUser } = useAuth();
    const { impersonatedUser, isImpersonating } = useImpersonation();
    const { isGlobalScope } = usePermissionCheck();
    const effectiveUser = isImpersonating && impersonatedUser ? impersonatedUser : currentUser;

    // Tự động ép buộc lọc theo phòng ban của nhân viên nếu không có quyền xem toàn cục
    useEffect(() => {
        if (!isGlobalScope && effectiveUser?.Department) {
            const userDeptName = effectiveUser.Department;
            const userDeptCode = Object.keys(DEPARTMENT_NAMES).find(
                key => DEPARTMENT_NAMES[key as DepartmentCode] === userDeptName
            ) as FilterDeptCode;
            
            if (userDeptCode && dept !== userDeptCode) {
                setDept(userDeptCode);
            }
        }
    }, [isGlobalScope, effectiveUser, dept, setDept]);

    // Tự động chuyển 'All' về 'HCTH' khi ở tab monthly-report (vì kế hoạch tháng cần phòng ban cụ thể)
    useEffect(() => {
        if (active === 'monthly-report' && dept === 'All') {
            setDept('HCTH');
        }
    }, [active, dept, setDept]);
    
    // Bộ lọc tháng và năm dùng chung cấp trang
    const [month, setMonth] = useState<string>(String(CURRENT_DATE.getMonth() + 1));
    const [year, setYear] = useState<number>(CURRENT_YEAR);

    // Bộ lọc dự án, loại công việc, trạng thái dùng chung cho tab Công việc
    const [filterProject, setFilterProject] = useState<string>('All');
    const [filterTaskType, setFilterTaskType] = useState<string>('All');
    const [filterStatus, setFilterStatus] = useState<string>('All');

    // Lấy danh sách dự án cho bộ lọc
    const { scopedProjects: projects = [] } = useScopedProjects({ pageSize: 9999 });

    const switchTab = (key: TabKey) => {
        setActive(key);
    };

    return (
        <div className="space-y-2 animate-in fade-in duration-500 h-full flex flex-col">
            {/* ══════════ TAB NAVIGATION & FILTERS ══════════ */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-transparent pb-1">
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-bg-surface p-1.5 rounded-2xl shadow-sm border border-border-subtle overflow-x-auto no-scrollbar w-full md:w-fit shrink-0 flex-nowrap">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            id={`work-plan-tab-${key}`}
                            onClick={() => switchTab(key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                                active === key
                                    ? 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-md shadow-primary-200/50 dark:shadow-primary-900/30'
                                    : 'text-txt-muted hover:bg-bg-subtle dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Bộ lọc Tháng & Năm & Phòng ban dùng chung */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar md:flex-wrap md:justify-end max-w-full pb-1 py-0.5 shrink-0 flex-nowrap w-full md:w-auto">
                    {/* Bộ lọc dự án dùng chung cho tất cả các tab */}
                    <FilterChip
                        label="Dự án"
                        value={filterProject}
                        onChange={setFilterProject}
                        allValue="All"
                        options={[
                            { value: 'All', label: 'Tất cả dự án' },
                            ...projects.map(p => ({ value: p.ProjectID, label: p.ProjectName })),
                        ]}
                    />

                    <FilterChip
                        label="Loại công việc"
                        value={filterTaskType}
                        onChange={setFilterTaskType}
                        allValue="All"
                        options={[
                            { value: 'All', label: 'Tất cả loại' },
                            { value: 'project', label: '📁 Dự án' },
                            { value: 'management', label: '📋 Điều hành' },
                            { value: 'internal', label: '🏢 Nội bộ' },
                        ]}
                    />

                    <FilterChip
                        label="Trạng thái"
                        value={filterStatus}
                        onChange={setFilterStatus}
                        allValue="All"
                        options={[
                            { value: 'All', label: 'Tất cả trạng thái' },
                            { value: TaskStatus.Todo, label: 'Mới' },
                            { value: TaskStatus.InProgress, label: 'Đang làm' },
                            { value: TaskStatus.Done, label: 'Xong' },
                            { value: TaskStatus.Incomplete, label: 'Chưa xong' },
                        ]}
                    />

                    {/* Bộ lọc phòng ban dùng chung */}
                    {isGlobalScope && !(active === 'monthly-report' && subTab === 'report') && (
                        <FilterChip
                            label="Phòng ban"
                            value={dept}
                            onChange={v => setDept(v as FilterDeptCode)}
                            allValue="All"
                            options={[
                                ...(active !== 'monthly-report' ? [{ value: 'All', label: 'Tất cả phòng ban' }] : []),
                                ...DEPARTMENT_CODES.map(code => ({ value: code, label: code })),
                            ]}
                        />
                    )}

                    {/* Bộ lọc Tháng */}
                    <FilterChip
                        label="Tháng"
                        value={month}
                        onChange={setMonth}
                        allValue="All"
                        options={[
                            { value: 'All', label: 'Tất cả tháng' },
                            ...Array.from({ length: 12 }, (_, i) => i + 1).map(m => ({ value: String(m), label: `Tháng ${m}` })),
                        ]}
                    />

                    {/* Bộ lọc Năm */}
                    <FilterChip
                        label="Năm"
                        value={String(year)}
                        onChange={v => setYear(Number(v))}
                        options={YEARS.map(y => ({ value: String(y), label: String(y) }))}
                    />
                </div>
            </div>

            {/* ── Tab content ── */}
            <div className="flex-1 min-h-0 flex flex-col">
                <Suspense fallback={<PageLoadingFallback />}>
                    {active === 'tasks'   && (
                        <TaskList 
                            month={month} 
                            year={String(year)} 
                            department={dept} 
                            filterProject={filterProject}
                            setFilterProject={setFilterProject}
                            filterTaskType={filterTaskType}
                            setFilterTaskType={setFilterTaskType}
                            filterStatus={filterStatus}
                            setFilterStatus={setFilterStatus}
                        />
                    )}
                    {active === 'annual'  && (
                        <AnnualPlanPage 
                            year={year} 
                            hideDeptSelector={true} 
                            departmentCode={dept as DepartmentCode} 
                            filterProject={filterProject}
                            filterTaskType={filterTaskType}
                            filterStatus={filterStatus}
                        />
                    )}
                    {active === 'monthly-report' && (() => {
                        const subTabsSelector = (
                            <div className="flex bg-slate-150 dark:bg-slate-900 rounded-lg p-0.5 shadow-sm border border-slate-200/50 dark:border-slate-800 shrink-0">
                                <button
                                    onClick={() => setSubTab('plan')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        subTab === 'plan'
                                            ? 'bg-bg-surface text-txt-primary shadow-sm'
                                            : 'text-txt-muted hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    Kế hoạch tháng
                                </button>
                                <button
                                    onClick={() => setSubTab('report')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        subTab === 'report'
                                            ? 'bg-bg-surface text-txt-primary shadow-sm'
                                            : 'text-txt-muted hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    Báo cáo tháng
                                </button>
                            </div>
                        );

                        return (
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex-1 min-h-0 flex flex-col">
                                    {subTab === 'plan' ? (
                                        <MonthlyPlanPage 
                                            month={month === 'All' ? CURRENT_DATE.getMonth() + 1 : parseInt(month)} 
                                            year={year} 
                                            hideModeSelector={true}
                                            leftElement={subTabsSelector}
                                            department={dept as DepartmentCode}
                                            filterProject={filterProject}
                                            filterTaskType={filterTaskType}
                                            filterStatus={filterStatus}
                                        />
                                    ) : (
                                        <MonthlyReportPage 
                                            month={month === 'All' ? CURRENT_DATE.getMonth() + 1 : parseInt(month)} 
                                            year={year} 
                                            leftElement={subTabsSelector}
                                            filterProject={filterProject}
                                            filterTaskType={filterTaskType}
                                            filterStatus={filterStatus}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </Suspense>
            </div>
        </div>
    );
};

export default WorkPlanPage;
