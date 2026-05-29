/**
 * MonthlyPlanProgress — Widget KH tháng cá nhân/phòng
 */
import React from 'react';
import { Target, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface MonthlyPlanProgressProps {
    stats: {
        total: number;
        completed: number;
        incomplete: number;
        planned: number;
        rate: number;
    };
    title?: string;
}

export const MonthlyPlanProgress: React.FC<MonthlyPlanProgressProps> = ({
    stats,
    title = 'Kế hoạch tháng',
}) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    return (
        <div className="section-card">
            <div className="section-card-header">
                <div className="flex items-center gap-2">
                    <div className="section-icon"><Target className="w-3.5 h-3.5" /></div>
                    <span>{title}</span>
                </div>
                <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">
                    T{currentMonth}/{currentYear}
                </span>
            </div>

            {stats.total === 0 ? (
                <div className="p-6 text-center">
                    <Target className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-txt-placeholder font-medium">Chưa có kế hoạch tháng</p>
                </div>
            ) : (
                <div className="p-4 space-y-4">
                    {/* Progress circle */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-gray-100 dark:text-slate-700"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="currentColor" strokeWidth="3"
                                />
                                <path
                                    className="text-emerald-500"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="currentColor" strokeWidth="3"
                                    strokeDasharray={`${stats.rate}, 100`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-txt-primary">
                                {stats.rate}%
                            </span>
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                                </span>
                                <span className="font-bold text-txt-primary">{stats.completed}/{stats.total}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 text-warning-600 dark:text-warning-400">
                                    <Clock className="w-3.5 h-3.5" /> Chưa báo cáo
                                </span>
                                <span className="font-bold text-txt-primary">{stats.planned}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Chưa hoàn thành
                                </span>
                                <span className="font-bold text-txt-primary">{stats.incomplete}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthlyPlanProgress;
