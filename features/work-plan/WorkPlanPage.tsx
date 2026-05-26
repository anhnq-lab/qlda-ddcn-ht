import React, { useState, Suspense, useEffect } from 'react';
import { ClipboardList, CalendarDays, ListChecks, Calendar, Users } from 'lucide-react';
import PageLoadingFallback from '../../components/ui/PageLoadingFallback';
import { useTabSearchParam } from '../../hooks/useTabSearchParam';
import { DepartmentCode, DEPARTMENT_CODES } from '../../types/plan.types';

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
    
    // Tự động chuyển 'All' về 'HCTH' khi ở tab monthly-report (vì kế hoạch tháng cần phòng ban cụ thể)
    useEffect(() => {
        if (active === 'monthly-report' && dept === 'All') {
            setDept('HCTH');
        }
    }, [active, dept, setDept]);
    
    // Bộ lọc tháng và năm dùng chung cấp trang
    const [month, setMonth] = useState<string>(String(CURRENT_DATE.getMonth() + 1));
    const [year, setYear] = useState<number>(CURRENT_YEAR);

    const switchTab = (key: TabKey) => {
        setActive(key);
    };

    return (
        <div className="space-y-2 animate-in fade-in duration-500 h-full flex flex-col">
            {/* ══════════ TAB NAVIGATION & FILTERS ══════════ */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-transparent pb-1">
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 w-fit">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            id={`work-plan-tab-${key}`}
                            onClick={() => switchTab(key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                                active === key
                                    ? 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-md shadow-primary-200/50 dark:shadow-primary-900/30'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Bộ lọc Tháng & Năm & Phòng ban dùng chung */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {/* Bộ lọc phòng ban dùng chung */}
                    {!(active === 'monthly-report' && subTab === 'report') && (
                        <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-[46px]">
                            <div className="flex items-center px-2 py-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-xs font-bold text-slate-650 dark:text-slate-300">
                                <Users className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                <select
                                    value={dept}
                                    onChange={e => setDept(e.target.value as FilterDeptCode)}
                                    className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-5 font-bold border-0 p-0 text-xs focus:ring-0"
                                >
                                    {active !== 'monthly-report' && (
                                        <option value="All">Tất cả phòng ban</option>
                                    )}
                                    {DEPARTMENT_CODES.map(code => (
                                        <option key={code} value={code}>{code}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Bộ lọc Tháng & Năm */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-[46px]">
                        {/* Chọn Tháng */}
                        <div className="flex items-center px-2 py-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-xs font-bold text-slate-650 dark:text-slate-300">
                            <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            <select
                                value={month}
                                onChange={e => setMonth(e.target.value)}
                                className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-4 font-bold border-0 p-0 text-xs focus:ring-0"
                            >
                                <option value="All">Tất cả</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={String(m)}>Tháng {m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Chọn Năm */}
                        <div className="flex items-center px-2 py-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-xs font-bold text-slate-650 dark:text-slate-300">
                            <select
                                value={year}
                                onChange={e => setYear(Number(e.target.value))}
                                className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-4 font-bold border-0 p-0 text-xs focus:ring-0"
                            >
                                {YEARS.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tab content ── */}
            <div className="flex-1 min-h-0 flex flex-col">
                <Suspense fallback={<PageLoadingFallback />}>
                    {active === 'tasks'   && <TaskList month={month} year={String(year)} department={dept} />}
                    {active === 'annual'  && <AnnualPlanPage year={year} hideDeptSelector={true} departmentCode={dept as DepartmentCode} />}
                    {active === 'monthly-report' && (() => {
                        const subTabsSelector = (
                            <div className="flex bg-slate-150 dark:bg-slate-900 rounded-lg p-0.5 shadow-sm border border-slate-200/50 dark:border-slate-800 shrink-0">
                                <button
                                    onClick={() => setSubTab('plan')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        subTab === 'plan'
                                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    Kế hoạch tháng
                                </button>
                                <button
                                    onClick={() => setSubTab('report')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        subTab === 'report'
                                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
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
                                        />
                                    ) : (
                                        <MonthlyReportPage 
                                            month={month === 'All' ? CURRENT_DATE.getMonth() + 1 : parseInt(month)} 
                                            year={year} 
                                            leftElement={subTabsSelector}
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
