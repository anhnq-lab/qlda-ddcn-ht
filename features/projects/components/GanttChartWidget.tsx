import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TaskService } from '@/services/TaskService';
import { BarChart3, ChevronRight, CheckCircle2, Clock, AlertTriangle, Circle } from 'lucide-react';

interface GanttTask {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    progress: number;
    status: string;
    phase?: string;
    stepCode?: string;
    priority?: string;
}

interface GanttChartWidgetProps {
    projectId: string;
    maxTasks?: number;
    onViewAll?: () => void;
}

const STATUS_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
    Done: { bar: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
    InProgress: { bar: 'bg-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', text: 'text-primary-600 dark:text-primary-400' },
    Review: { bar: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
    Todo: { bar: 'bg-slate-300 dark:bg-slate-600', bg: 'bg-[#F5EFE6] dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400' },
    overdue: { bar: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
};

const StatusIcon: React.FC<{ status: string; className?: string }> = ({ status, className = 'w-3 h-3' }) => {
    switch (status) {
        case 'Done': return <CheckCircle2 className={`${className} text-emerald-500`} />;
        case 'InProgress': return <Clock className={`${className} text-primary-500`} />;
        case 'Review': return <Clock className={`${className} text-blue-500`} />;
        case 'overdue': return <AlertTriangle className={`${className} text-red-500`} />;
        default: return <Circle className={`${className} text-slate-400`} />;
    }
};

export const GanttChartWidget: React.FC<GanttChartWidgetProps> = ({
    projectId,
    maxTasks = 999,
    onViewAll
}) => {
    const { data: tasks = [], isLoading } = useQuery<GanttTask[]>({
        queryKey: ['gantt-tasks', projectId],
        queryFn: async () => {
            const rawTasks = await TaskService.getProjectTasks(projectId);

            if (!rawTasks || rawTasks.length === 0) return [];

            const now = new Date();
            return rawTasks
                .filter(t => t.start_date || t.due_date) // Only tasks with dates
                .sort((a, b) => {
                    const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
                    const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
                    return dateA - dateB;
                })
                .map(t => {
                    const startDate = t.start_date ? new Date(t.start_date) : new Date();
                    const endDate = t.due_date ? new Date(t.due_date) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                    const isOverdue = t.status !== 'done' && endDate < now;

                    return {
                        id: t.id,
                        title: t.title,
                        startDate,
                        endDate,
                        progress: t.progress ?? (t.status === 'done' ? 100 : 0),
                        status: isOverdue ? 'overdue' : t.status || 'todo',
                        phase: t.phase || undefined,
                        stepCode: t.step_code || undefined,
                        priority: t.priority,
                    };
                });
        },
        enabled: !!projectId,
        staleTime: 5 * 60 * 1000,
    });


    // Calculate timeline bounds
    const { timelineStart, timelineEnd, totalDays, months } = useMemo(() => {
        if (tasks.length === 0) {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 6, 0);
            return { timelineStart: start, timelineEnd: end, totalDays: 180, months: [] as { label: string; width: number }[] };
        }

        const allStarts = tasks.map(t => t.startDate.getTime());
        const allEnds = tasks.map(t => t.endDate.getTime());
        const minDate = new Date(Math.min(...allStarts));
        const maxDate = new Date(Math.max(...allEnds));

        // Pad by 15 days on each side
        const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
        const total = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        // Generate month labels
        const monthList: { label: string; width: number }[] = [];
        let cursor = new Date(start);
        while (cursor <= end) {
            const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
            const effectiveEnd = monthEnd > end ? end : monthEnd;
            const days = Math.ceil((effectiveEnd.getTime() - cursor.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const width = (days / total) * 100;
            monthList.push({
                label: `T${cursor.getMonth() + 1}/${cursor.getFullYear() % 100}`,
                width,
            });
            cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        }

        return { timelineStart: start, timelineEnd: end, totalDays: total, months: monthList };
    }, [tasks]);

    // Today marker position
    const todayPosition = useMemo(() => {
        const now = new Date();
        if (now < timelineStart || now > timelineEnd) return -1;
        const days = Math.ceil((now.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
        return (days / totalDays) * 100;
    }, [timelineStart, timelineEnd, totalDays]);

    const visibleTasks = tasks.slice(0, maxTasks);
    const hasMore = tasks.length > maxTasks;

    // Stats
    const stats = useMemo(() => {
        const done = tasks.filter(t => t.status === 'Done').length;
        const inProgress = tasks.filter(t => t.status === 'InProgress' || t.status === 'Review').length;
        const overdue = tasks.filter(t => t.status === 'overdue').length;
        const avgProgress = tasks.length > 0 ? Math.round(tasks.reduce((a, t) => a + t.progress, 0) / tasks.length) : 0;
        return { total: tasks.length, done, inProgress, overdue, avgProgress };
    }, [tasks]);

    if (isLoading) {
        return (
            <div className="section-card">
                <div className="section-card-header">
                    <div className="flex items-center gap-2">
                        <div className="section-icon"><BarChart3 className="w-3.5 h-3.5" /></div>
                        <span>Tiến độ thực hiện</span>
                    </div>
                </div>
                <div className="p-4 animate-pulse">
                    <div className="space-y-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-24 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                                <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="section-card">
                <div className="section-card-header">
                    <div className="flex items-center gap-2">
                        <div className="section-icon"><BarChart3 className="w-3.5 h-3.5" /></div>
                        <span>Tiến độ thực hiện</span>
                    </div>
                    {onViewAll && (
                        <button onClick={onViewAll} className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline font-bold">
                            Xem kế hoạch <ChevronRight className="w-3 h-3" />
                        </button>
                    )}
                </div>
                <div className="p-4 text-center">
                    <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Chưa có kế hoạch công việc</p>
                    {onViewAll && (
                        <button onClick={onViewAll} className="mt-2 text-xs text-blue-600 hover:underline font-medium">
                            Tạo kế hoạch →
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="section-card">
            {/* Header */}
            <div className="section-card-header">
                <div className="flex items-center gap-2">
                    <div className="section-icon"><BarChart3 className="w-3.5 h-3.5" /></div>
                    <span>Tiến độ thực hiện</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        ({stats.avgProgress}%)
                    </span>
                </div>
                {onViewAll && (
                    <button onClick={onViewAll} className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline font-bold">
                        Xem kế hoạch <ChevronRight className="w-3 h-3" />
                    </button>
                )}
            </div>

            <div className="p-2.5">
                {/* Mini Stats */}
                <div className="flex items-center gap-3 mb-2.5 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Xong: {stats.done}/{stats.total}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                        Đang làm: {stats.inProgress}
                    </span>
                    {stats.overdue > 0 && (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Quá hạn: {stats.overdue}
                        </span>
                    )}
                </div>

                {/* Gantt Chart */}
                <div className="relative overflow-x-auto">
                    {/* Month headers */}
                    <div className="flex border-b border-slate-200 dark:border-slate-700 mb-1">
                        {months.map((m, i) => (
                            <div
                                key={i}
                                className="text-[9px] font-bold text-slate-400 dark:text-slate-500 text-center py-0.5 border-r border-slate-100 dark:border-slate-700/50 last:border-r-0 shrink-0"
                                style={{ width: `${m.width}%`, minWidth: '30px' }}
                            >
                                {m.label}
                            </div>
                        ))}
                    </div>

                    {/* Task bars */}
                    <div className="relative">
                        {/* Today marker */}
                        {todayPosition >= 0 && todayPosition <= 100 && (
                            <div
                                className="absolute top-0 bottom-0 w-px bg-red-400 dark:bg-red-500 z-10 pointer-events-none"
                                style={{ left: `${todayPosition}%` }}
                            >
                                <div className="absolute -top-0.5 -left-1.5 w-3 h-1 bg-red-400 dark:bg-red-500 rounded-sm" />
                            </div>
                        )}

                        {visibleTasks.map((task) => {
                            const startOffset = Math.max(0, (task.startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
                            const duration = Math.max(1, (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24));
                            const left = (startOffset / totalDays) * 100;
                            const width = Math.max(2, (duration / totalDays) * 100);
                            const colors = STATUS_COLORS[task.status] || STATUS_COLORS.Todo;

                            return (
                                <div key={task.id} className="flex items-center gap-1.5 py-[3px] group hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors">
                                    {/* Task name */}
                                    <div className="w-28 shrink-0 flex items-center gap-1 pr-1">
                                        <StatusIcon status={task.status} className="w-2.5 h-2.5 shrink-0" />
                                        <span className="text-[10px] text-slate-700 dark:text-slate-300 truncate font-medium leading-tight" title={task.title}>
                                            {task.title}
                                        </span>
                                    </div>

                                    {/* Bar area */}
                                    <div className="flex-1 relative h-5 min-w-0">
                                        {/* Background bar (full task span) */}
                                        <div
                                            className={`absolute top-1 h-3 rounded-sm ${colors.bg} border border-slate-200/50 dark:border-slate-700/50`}
                                            style={{ left: `${left}%`, width: `${width}%` }}
                                        >
                                            {/* Progress fill */}
                                            <div
                                                className={`h-full rounded-sm ${colors.bar} transition-all duration-500 opacity-80`}
                                                style={{ width: `${Math.min(100, task.progress)}%` }}
                                            />
                                        </div>

                                        {/* Progress label on hover */}
                                        <div
                                            className="absolute top-0 h-5 flex items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                            style={{ left: `${left + width + 0.5}%` }}
                                        >
                                            <span className={`text-[9px] font-bold ${colors.text} whitespace-nowrap`}>
                                                {task.progress}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* View more */}
                {hasMore && onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="w-full mt-2 py-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                        Xem tất cả {tasks.length} công việc →
                    </button>
                )}

                {/* Overall progress bar */}
                <div className="mt-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-2.5 py-1.5">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Tiến độ tổng thể</span>
                        <span className={`font-black tabular-nums ${stats.avgProgress >= 50 ? 'text-emerald-600' : stats.avgProgress > 20 ? 'text-primary-600' : 'text-red-600'}`}>
                            {stats.avgProgress}%
                        </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                                background: stats.avgProgress >= 50 ? 'linear-gradient(90deg, #10B981, #059669)' :
                                    stats.avgProgress > 20 ? 'linear-gradient(90deg, #fb923c, #4a90e2)' :
                                        'linear-gradient(90deg, #EF4444, #DC2626)',
                                width: `${Math.min(100, Math.max(0, stats.avgProgress))}%`
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GanttChartWidget;

