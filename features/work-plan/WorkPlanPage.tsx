import React, { useState, Suspense } from 'react';
import { ClipboardList, CalendarDays, ListChecks, Calendar } from 'lucide-react';
import PageLoadingFallback from '../../components/ui/PageLoadingFallback';
import { useTabSearchParam } from '../../hooks/useTabSearchParam';

// Lazy-load each sub-module inside the bundle
const AnnualPlanPage  = React.lazy(() => import('../annual-plan/AnnualPlanPage'));
const MonthlyPlanPage = React.lazy(() => import('../monthly-plan/MonthlyPlanPage'));
const TaskList        = React.lazy(() => import('../tasks/TaskList'));

type TabKey = 'tasks' | 'annual' | 'monthly';

interface TabDef {
    key: TabKey;
    label: string;
    icon: React.ElementType;
}

const TABS: TabDef[] = [
    { key: 'tasks',   label: 'Công việc',           icon: ListChecks   },
    { key: 'annual',  label: 'KH khung năm',         icon: ClipboardList },
    { key: 'monthly', label: 'KH tháng / BC tháng',  icon: CalendarDays },
];

const CURRENT_DATE = new Date();
const CURRENT_YEAR = CURRENT_DATE.getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const WorkPlanPage: React.FC = () => {
    const [active, setActive] = useTabSearchParam<TabKey>('monthly', ['tasks', 'annual', 'monthly'] as const);
    
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

                {/* Bộ lọc Tháng & Năm dùng chung */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0 h-[46px]">
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

            {/* ── Tab content ── */}
            <div className="flex-1 min-h-0 flex flex-col">
                <Suspense fallback={<PageLoadingFallback />}>
                    {active === 'tasks'   && <TaskList month={month} year={String(year)} />}
                    {active === 'annual'  && <AnnualPlanPage year={year} />}
                    {active === 'monthly' && (
                        <MonthlyPlanPage 
                            month={month === 'All' ? CURRENT_DATE.getMonth() + 1 : parseInt(month)} 
                            year={year} 
                        />
                    )}
                </Suspense>
            </div>
        </div>
    );
};

export default WorkPlanPage;
