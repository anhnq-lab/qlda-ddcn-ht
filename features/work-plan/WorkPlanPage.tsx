import React, { Suspense } from 'react';
import { ClipboardList, CalendarDays, ListChecks } from 'lucide-react';
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

const WorkPlanPage: React.FC = () => {
    const [active, setActive] = useTabSearchParam<TabKey>('monthly', ['tasks', 'annual', 'monthly'] as const);

    const switchTab = (key: TabKey) => {
        setActive(key);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
            {/* ══════════ TAB NAVIGATION ══════════ */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 w-fit shrink-0">
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

            {/* ── Tab content ── */}
            <div className="flex-1 min-h-0 flex flex-col">
                <Suspense fallback={<PageLoadingFallback />}>
                    {active === 'tasks'   && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 flex-1 overflow-auto custom-scrollbar">
                            <TaskList />
                        </div>
                    )}
                    {active === 'annual'  && <AnnualPlanPage />}
                    {active === 'monthly' && <MonthlyPlanPage />}
                </Suspense>
            </div>
        </div>
    );
};

export default WorkPlanPage;
