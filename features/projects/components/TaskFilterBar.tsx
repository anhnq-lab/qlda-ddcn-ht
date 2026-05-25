import React from 'react';
import {
    Filter, User, Clock, AlertTriangle, CheckCircle2,
    Calendar, Route, Plus, Search, X, LayoutGrid, List, BarChart3, Users, SlidersHorizontal
} from 'lucide-react';
import { TaskStatus } from '@/types';

export type TaskViewMode = 'wbs' | 'gantt' | 'kanban' | 'resource' | 'raci';
export type TaskFilter = 'all' | 'my-tasks' | 'overdue' | 'this-week' | 'critical' | 'in-progress' | 'completed';

interface TaskFilterBarProps {
    currentFilter: TaskFilter;
    currentView: TaskViewMode;
    onFilterChange: (filter: TaskFilter) => void;
    onViewChange: (view: TaskViewMode) => void;
    onAdjustPlan: () => void;
    onSearch?: (query: string) => void;
    searchQuery?: string;
    taskCounts?: {
        all: number;
        myTasks: number;
        overdue: number;
        thisWeek: number;
        critical: number;
        inProgress: number;
        completed: number;
    };
    currentUserId?: string;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
    currentFilter,
    currentView,
    onFilterChange,
    onViewChange,
    onAdjustPlan,
    onSearch,
    searchQuery = '',
    taskCounts,
    currentUserId
}) => {
    const filters: { id: TaskFilter; label: string; icon: React.ElementType; color: string }[] = [
        { id: 'all', label: 'Tất cả', icon: Filter, color: 'gray' },
        { id: 'my-tasks', label: 'Của tôi', icon: User, color: 'blue' },
        { id: 'this-week', label: 'Tuần này', icon: Calendar, color: 'indigo' },
        { id: 'in-progress', label: 'Đang làm', icon: Clock, color: 'orange' },
        { id: 'overdue', label: 'Quá hạn', icon: AlertTriangle, color: 'red' },
        { id: 'critical', label: 'Critical Path', icon: Route, color: 'purple' },
        { id: 'completed', label: 'Hoàn thành', icon: CheckCircle2, color: 'emerald' },
    ];

    const views: { id: TaskViewMode; label: string; icon: React.ElementType }[] = [
        { id: 'wbs', label: 'WBS', icon: List },
        { id: 'gantt', label: 'Gantt', icon: BarChart3 },
        { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
        { id: 'resource', label: 'Nguồn lực', icon: User },
        { id: 'raci', label: 'Ma trận RACI', icon: Users },
    ];

    const getFilterCount = (filter: TaskFilter): number | undefined => {
        if (!taskCounts) return undefined;
        switch (filter) {
            case 'all': return taskCounts.all;
            case 'my-tasks': return taskCounts.myTasks;
            case 'overdue': return taskCounts.overdue;
            case 'this-week': return taskCounts.thisWeek;
            case 'critical': return taskCounts.critical;
            case 'in-progress': return taskCounts.inProgress;
            case 'completed': return taskCounts.completed;
            default: return undefined;
        }
    };

    const getFilterStyle = (filter: { id: TaskFilter; color: string }, isActive: boolean) => {
        if (!isActive) return 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700';

        switch (filter.color) {
            case 'blue': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800';
            case 'red': return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700 ring-1 ring-red-200 dark:ring-red-800';
            case 'orange': return 'bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 border-warning-300 dark:border-warning-700 ring-1 ring-warning-200 dark:ring-warning-800';
            case 'emerald': return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-800';
            case 'purple': return 'bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 border-warning-300 dark:border-warning-700 ring-1 ring-warning-200 dark:ring-warning-800';
            case 'indigo': return 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-primary-300 dark:border-primary-700 ring-1 ring-primary-200 dark:ring-primary-800';
            default: return 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 border-gray-300 dark:border-slate-600 ring-1 ring-gray-200 dark:ring-slate-500';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-2.5 flex flex-wrap items-center justify-between gap-3">
            {/* Left Row: Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                {filters.map(filter => {
                    const isActive = currentFilter === filter.id;
                    const count = getFilterCount(filter.id);
                    const Icon = filter.icon;

                    return (
                        <button
                            key={filter.id}
                            onClick={() => onFilterChange(filter.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${getFilterStyle(filter, isActive)}`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {filter.label}
                            {count !== undefined && count > 0 && (
                                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${isActive
                                    ? 'bg-white/50 dark:bg-white/10'
                                    : filter.color === 'red' && count > 0
                                        ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                                        : 'bg-gray-100 dark:bg-slate-600'
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Right Row: View Toggle + Adjust Button */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-1 sm:flex-initial">
                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                    {views.map(view => {
                        const isActive = currentView === view.id;
                        const Icon = view.icon;

                        return (
                            <button
                                key={view.id}
                                onClick={() => onViewChange(view.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${isActive
                                    ? 'bg-white dark:bg-slate-600 text-primary-700 dark:text-primary-400 shadow-sm'
                                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                                    }`}
                                title={view.label}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{view.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Adjust Plan Button */}
                <button
                    onClick={onAdjustPlan}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all border shadow-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-900/50 shrink-0 cursor-pointer ml-auto sm:ml-0"
                >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Điều chỉnh kế hoạch
                </button>
            </div>
        </div>
    );
};

export default TaskFilterBar;
