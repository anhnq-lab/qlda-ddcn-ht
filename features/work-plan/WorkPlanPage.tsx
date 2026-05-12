import React, { Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, CalendarDays } from 'lucide-react';
import PageLoadingFallback from '../../components/ui/PageLoadingFallback';

// Lazy-load each sub-module inside the bundle
const AnnualPlanPage  = React.lazy(() => import('../annual-plan/AnnualPlanPage'));
const MonthlyPlanPage = React.lazy(() => import('../monthly-plan/MonthlyPlanPage'));

type TabKey = 'annual' | 'monthly';

interface TabDef {
    key: TabKey;
    label: string;
    icon: React.ElementType;
}

const TABS: TabDef[] = [
    { key: 'annual',  label: 'KH khung năm',         icon: ClipboardList },
    { key: 'monthly', label: 'KH tháng / BC tháng',  icon: CalendarDays },
];

const WorkPlanPage: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const active = (params.get('tab') as TabKey) || 'monthly';

    const switchTab = (key: TabKey) => {
        setParams({ tab: key }, { replace: true });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            {/* ── Tab bar ── */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4">
                <nav className="flex gap-0.5" aria-label="Work-plan tabs">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => switchTab(key)}
                            className={`
                                flex items-center gap-2 px-4 py-3 text-[13px] font-semibold
                                border-b-2 transition-colors whitespace-nowrap
                                ${active === key
                                    ? 'border-primary-600 text-primary-700 dark:border-primary-500 dark:text-primary-400'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-700'}
                            `}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* ── Tab content ── */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <Suspense fallback={<PageLoadingFallback />}>
                    {active === 'annual'  && <AnnualPlanPage />}
                    {active === 'monthly' && <MonthlyPlanPage />}
                </Suspense>
            </div>
        </div>
    );
};

export default WorkPlanPage;
