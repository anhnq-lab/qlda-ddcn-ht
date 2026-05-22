import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronDown, CheckCircle2, Clock, AlertTriangle, Circle } from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { useEmployees } from '@/hooks/useEmployees';
import { useTheme } from '@/context/ThemeContext';

interface ProjectGanttChartProps {
    tasks: Task[];
    phases: any[];
    projectStartDate?: string;
}

const STATUS_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
    done: { bar: 'bg-emerald-500 dark:bg-emerald-400', bg: 'bg-emerald-50/80 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300' },
    in_progress: { bar: 'bg-blue-500 dark:bg-blue-400', bg: 'bg-blue-50/80 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300' },
    review: { bar: 'bg-amber-500 dark:bg-amber-400', bg: 'bg-amber-50/80 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300' },
    todo: { bar: 'bg-slate-300 dark:bg-slate-500', bg: 'bg-slate-100 dark:bg-slate-900/50', text: 'text-slate-600 dark:text-slate-300' },
    overdue: { bar: 'bg-red-500 dark:bg-red-400', bg: 'bg-red-50/80 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300' },
};

const StatusIcon: React.FC<{ status: string; className?: string }> = ({ status, className = 'w-3 h-3' }) => {
    switch (status) {
        case 'done': return <CheckCircle2 className={`${className} text-emerald-500`} />;
        case 'in_progress': return <Clock className={`${className} text-primary-500`} />;
        case 'review': return <Clock className={`${className} text-blue-500`} />;
        case 'overdue': return <AlertTriangle className={`${className} text-red-500`} />;
        default: return <Circle className={`${className} text-slate-400`} />;
    }
};

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({
    tasks,
    phases,
    projectStartDate
}) => {
    const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
    const hasInitializedExpandedSteps = useRef(false);

    const { theme } = useTheme();
    const { data: employees = [] } = useEmployees();
    const [hoveredTask, setHoveredTask] = useState<any | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent, task: any) => {
        const tooltipWidth = 288;
        const tooltipHeight = task.isStep ? 220 : 180;
        let x = e.clientX + 15;
        let y = e.clientY + 15;

        if (x + tooltipWidth > window.innerWidth) {
            x = e.clientX - tooltipWidth - 15;
        }
        if (y + tooltipHeight > window.innerHeight) {
            y = e.clientY - tooltipHeight - 15;
        }
        setMousePos({ x, y });
        setHoveredTask(task);
    };

    const handleMouseLeave = () => {
        setHoveredTask(null);
    };

    const processedTasks = useMemo(() => {
        if (!phases || !tasks) return [];
        const now = new Date();
        const fallbackStart = projectStartDate ? new Date(projectStartDate) : now;

        // Trích xuất tất cả các bước quy trình mẫu từ phases
        const steps: any[] = [];
        phases.forEach(phase => {
            const subProcs = phase.subProcesses || [{ id: '0', title: '', fullTitle: '', items: phase.items || [] }];
            subProcs.forEach((sp: any) => {
                if (sp.items) {
                    sp.items.forEach((item: any) => {
                        steps.push(item);
                    });
                }
            });
        });

        const result: any[] = [];
        steps.forEach(step => {
            // Lọc các công việc chính thuộc bước này (không hiển thị subtasks)
            const stepTasks = tasks.filter(
                t => t.StepCode === step.code || 
                     t.TimelineStep === step.code ||
                     t.StepCode === step.id ||
                     t.TimelineStep === step.id
            );

            let stepStart = fallbackStart;
            let stepEnd = new Date(fallbackStart.getTime() + (step.estimatedDays || 30) * 24 * 60 * 60 * 1000);

            if (stepTasks.length > 0) {
                const dates: number[] = [];
                stepTasks.forEach(t => {
                    if (t.StartDate) dates.push(new Date(t.StartDate).getTime());
                    if (t.DueDate) dates.push(new Date(t.DueDate).getTime());
                });
                if (dates.length > 0) {
                    stepStart = new Date(Math.min(...dates));
                    stepEnd = new Date(Math.max(...dates));
                }
            }

            const stepProgress = stepTasks.length > 0
                ? Math.round(stepTasks.reduce((sum, t) => sum + (t.ProgressPercent || 0), 0) / stepTasks.length)
                : 0;

            let stepStatus = 'todo';
            const isStepOverdue = stepProgress < 100 && stepEnd < now;
            if (isStepOverdue) {
                stepStatus = 'overdue';
            } else if (stepProgress === 100) {
                stepStatus = 'done';
            } else if (stepProgress > 0) {
                stepStatus = 'in_progress';
            }

            const mappedTasks = stepTasks.map(t => {
                const tStart = t.StartDate && !isNaN(Date.parse(t.StartDate)) ? new Date(t.StartDate) : stepStart;
                const tEnd = t.DueDate && !isNaN(Date.parse(t.DueDate)) ? new Date(t.DueDate) : new Date(tStart.getTime() + (t.DurationDays || 1) * 24 * 60 * 60 * 1000);
                const isOverdue = t.Status !== TaskStatus.Done && tEnd < now;

                return {
                    id: t.TaskID,
                    title: t.Title.replace(/^[\d\.\:\s]+/, '').trim(),
                    startDate: tStart,
                    endDate: tEnd,
                    progress: t.ProgressPercent || 0,
                    status: isOverdue ? 'overdue' : (t.Status || 'todo'),
                    isMasterTask: true,
                    level: 1,
                    parentId: `step_${step.code}`,
                    assigneeId: t.AssigneeID
                };
            });

            const stepGanttTask = {
                id: `step_${step.code}`,
                title: `${step.id ? `${step.id}. ` : ''}${step.title.replace(/^[\d\.\:\s]+/, '').trim()}`,
                startDate: stepStart,
                endDate: stepEnd,
                progress: stepProgress,
                status: stepStatus,
                isStep: true,
                level: 0,
                subTasks: mappedTasks,
                assigneeRole: step.assigneeRole
            };

            result.push(stepGanttTask);
        });

        return result;
    }, [phases, tasks, projectStartDate]);

    // Tự động mở rộng các Step lớn (Cấp 1) ở lần tải đầu tiên
    useEffect(() => {
        if (processedTasks.length > 0 && !hasInitializedExpandedSteps.current) {
            setExpandedTaskIds(prev => {
                const next = new Set(prev);
                processedTasks.forEach(task => {
                    if (task.isStep) {
                        next.add(task.id);
                    }
                });
                return next;
            });
            hasInitializedExpandedSteps.current = true;
        }
    }, [processedTasks]);

    const isAllCollapsed = expandedTaskIds.size === 0;
    const handleToggleAllExpand = () => {
        if (isAllCollapsed) {
            const allStepIds = processedTasks.filter(t => t.isStep).map(t => t.id);
            setExpandedTaskIds(new Set(allStepIds));
        } else {
            setExpandedTaskIds(new Set());
        }
    };

    const visibleTasks = useMemo(() => {
        const list: any[] = [];
        processedTasks.forEach(step => {
            list.push(step);
            if (expandedTaskIds.has(step.id) && step.subTasks && step.subTasks.length > 0) {
                step.subTasks.forEach((t: any) => {
                    list.push(t);
                });
            }
        });
        return list;
    }, [processedTasks, expandedTaskIds]);

    const { timelineStart, timelineEnd, totalDuration, timeline, yearGroups, totalWidth } = useMemo(() => {
        if (processedTasks.length === 0) {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
            return {
                timelineStart: start,
                timelineEnd: end,
                totalDuration: end.getTime() - start.getTime(),
                timeline: [] as any[],
                yearGroups: [] as any[],
                totalWidth: 0
            };
        }

        const allDates: number[] = [];
        processedTasks.forEach(step => {
            allDates.push(step.startDate.getTime());
            allDates.push(step.endDate.getTime());
            if (step.subTasks) {
                step.subTasks.forEach((t: any) => {
                    allDates.push(t.startDate.getTime());
                    allDates.push(t.endDate.getTime());
                });
            }
        });

        const minDate = new Date(Math.min(...allDates));
        const maxDate = new Date(Math.max(...allDates));

        // Pad range by 1 month before and 2 months after
        minDate.setMonth(minDate.getMonth() - 1);
        minDate.setDate(1);
        maxDate.setMonth(maxDate.getMonth() + 2);
        maxDate.setDate(28);

        const start = minDate;
        const end = maxDate;
        const totalDur = end.getTime() - start.getTime();

        const timelineList: { month: number; year: number; label: string }[] = [];
        const current = new Date(start.getFullYear(), start.getMonth(), 1);
        while (current <= end) {
            timelineList.push({
                month: current.getMonth() + 1,
                year: current.getFullYear(),
                label: `T${current.getMonth() + 1}`
            });
            current.setMonth(current.getMonth() + 1);
        }

        const ygList: { year: number; months: typeof timelineList }[] = [];
        timelineList.forEach(m => {
            const last = ygList[ygList.length - 1];
            if (last && last.year === m.year) {
                last.months.push(m);
            } else {
                ygList.push({ year: m.year, months: [m] });
            }
        });

        const COL_WIDTH = 48; // px per month column
        const tWidth = timelineList.length * COL_WIDTH;

        return {
            timelineStart: start,
            timelineEnd: end,
            totalDuration: totalDur,
            timeline: timelineList,
            yearGroups: ygList,
            totalWidth: tWidth
        };
    }, [processedTasks]);

    const toggleExpand = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedTaskIds(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    };

    if (processedTasks.length === 0) {
        return (
            <div className="py-12 text-center text-gray-400 italic bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                Chưa có dữ liệu tiến độ để hiển thị biểu đồ.
            </div>
        );
    }

    const COL_WIDTH = 48; // px per month column
    const todayPos = ((Date.now() - timelineStart.getTime()) / totalDuration) * 100;

    return (
        <div className="overflow-x-auto pb-4 rounded-xl border border-gray-200 dark:border-slate-700">
            <div style={{ minWidth: `${320 + totalWidth}px` }}>
                {/* Year Header */}
                <div className="flex bg-slate-50 dark:bg-slate-800" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="w-[320px] shrink-0" />
                    <div className="flex">
                        {yearGroups.map(yg => (
                            <div
                                key={yg.year}
                                style={{ width: `${yg.months.length * COL_WIDTH}px`, borderLeft: '1px solid var(--border-subtle)' }}
                                className="text-center py-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 border-l uppercase tracking-widest"
                            >
                                {yg.year}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Month Header */}
                <div className="flex bg-slate-50 dark:bg-slate-800 sticky top-0 z-10" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="w-[320px] shrink-0 px-4 py-2 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Hạng mục công việc / Bước quy trình</span>
                        <button 
                            onClick={handleToggleAllExpand}
                            className="text-[9px] font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 normal-case px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded transition-colors"
                        >
                            {isAllCollapsed ? "Mở tất cả" : "Thu gọn tất cả"}
                        </button>
                    </div>
                    <div className="flex">
                        {timeline.map((m, idx) => (
                            <div
                                key={idx}
                                style={{ width: `${COL_WIDTH}px`, borderLeft: '1px solid var(--border-subtle)' }}
                                title={`Tháng ${m.month} năm ${m.year}`}
                                className="text-center py-2 text-[9px] font-black text-gray-400 dark:text-slate-400 border-l cursor-help hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                {m.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Body - Hierarchical tasks */}
                <div className="bg-white dark:bg-slate-800 relative">
                    {/* Grid Lines Layer (Nét liền mạch, làm mờ tối đa) */}
                    <div className="absolute inset-0 flex pointer-events-none z-10 opacity-[0.06]">
                        <div className="w-[320px] shrink-0 border-r" style={{ borderRight: '1px solid var(--border-subtle)' }} />
                        <div className="flex-1 flex h-full">
                            {timeline.map((_, i) => (
                                <div
                                    key={i}
                                    style={{ width: `${COL_WIDTH}px`, borderLeft: '1px solid var(--border-subtle)' }}
                                    className="h-full"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Today Line */}
                    {todayPos > 0 && todayPos < 100 && (
                        <div
                            className="absolute top-0 bottom-0 w-[2px] bg-red-400 dark:bg-red-500 z-20 pointer-events-none"
                            style={{ left: `calc(320px + (100% - 320px) * ${todayPos} / 100)` }}
                        >
                            <div className="absolute -top-0.5 -left-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                        </div>
                    )}

                    {visibleTasks.map((task) => {
                        const startOffset = Math.max(0, (task.startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
                        const duration = Math.max(1, (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24));
                        const totalDays = totalDuration / (1000 * 60 * 60 * 24);
                        const leftPos = (startOffset / totalDays) * 100;
                        const width = (duration / totalDays) * 100;
                        const colors = STATUS_COLORS[task.status] || STATUS_COLORS.todo;

                        const isExpanded = expandedTaskIds.has(task.id);
                        const barHeightClass = task.isStep ? 'h-5 rounded-md' : 'h-3.5 rounded-sm';

                        const rowBgClass = task.isStep 
                            ? 'bg-[var(--bg-subtle)]/70 dark:bg-[var(--bg-subtle)]/40' 
                            : 'bg-transparent';

                        return (
                            <div 
                                key={task.isStep ? task.id : `${task.parentId}_${task.id}`} 
                                className={`flex group ${rowBgClass} hover:bg-[var(--bg-muted)] transition-colors py-1.5 items-center relative`}
                                style={{ borderBottom: '1px solid var(--border-subtle)' }}
                                onMouseEnter={(e) => handleMouseMove(e, task)}
                                onMouseMove={(e) => handleMouseMove(e, task)}
                                onMouseLeave={handleMouseLeave}
                            >
                                {/* Task Name Column */}
                                <div
                                    className="w-[320px] shrink-0 px-4 flex items-center gap-1.5 relative z-20"
                                    style={{ paddingLeft: `${(task.level || 0) * 12 + 16}px` }}
                                >
                                    {task.level === 1 && (
                                        <span className="w-3 shrink-0 border-l border-b h-2.5 -mt-1.5 mr-1 rounded-bl-sm" style={{ borderColor: 'var(--border-subtle)' }} />
                                    )}
                                    {task.isStep ? (
                                        <button
                                            onClick={(e) => toggleExpand(task.id, e)}
                                            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-500 shrink-0"
                                            title={isExpanded ? "Thu gọn công việc" : "Xem chi tiết công việc"}
                                        >
                                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                        </button>
                                    ) : (
                                        <span className="w-4 shrink-0" />
                                    )}
                                    <StatusIcon status={task.status} className={`${task.isStep ? 'w-3 h-3' : 'w-3 h-3'} shrink-0`} />
                                    <span
                                        className={`truncate leading-tight cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 ${
                                            task.isStep
                                                ? 'text-[11px] text-[var(--text-primary)] font-bold'
                                                : 'text-[10.5px] text-[var(--text-secondary)] font-semibold'
                                        }`}
                                        title={task.title}
                                        onClick={task.isStep ? (e) => toggleExpand(task.id, e) : undefined}
                                    >
                                        {task.title}
                                    </span>
                                </div>

                                {/* Gantt Bar Column */}
                                <div className="flex-1 relative h-6 flex items-center min-w-0">
                                    {/* Task Bar Container */}
                                    <div
                                        className={`absolute ${barHeightClass} ${colors.bg} border border-slate-200/50 dark:border-slate-700/50 flex items-center min-w-[16px] transition-all cursor-pointer hover:opacity-90 hover:shadow-sm z-20`}
                                        style={{
                                            left: `${Math.max(0, leftPos)}%`,
                                            width: `${Math.max(1.5, width)}%`
                                        }}
                                    >
                                        {/* Progress Fill */}
                                        <div
                                            className={`h-full rounded-l-sm ${colors.bar} transition-all duration-500 ${task.progress === 100 ? 'rounded-r-sm' : ''} opacity-100`}
                                            style={{ width: `${Math.min(100, task.progress)}%` }}
                                        />

                                        {/* Duration text */}
                                        {width > 6 && (
                                            <span className="absolute inset-0 flex items-center justify-center text-[8px] text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap overflow-hidden px-1">
                                                {task.progress}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Custom Premium Tooltip (Rendered via Portal to document.body, opaque background to prevent overlapping) */}
            {hoveredTask && createPortal(
                <div 
                    className="fixed pointer-events-none w-72 border rounded-lg p-3.5 text-[11px] space-y-2.5 transition-none"
                    style={{ 
                        left: `${mousePos.x}px`, 
                        top: `${mousePos.y}px`,
                        zIndex: 99999,
                        backgroundColor: theme === 'dark' ? '#1f2332' : theme === 'nature' ? '#FCF9F2' : '#ffffff',
                        borderColor: theme === 'dark' ? '#2e3348' : theme === 'nature' ? '#ece7de' : '#e2e8f0',
                        color: theme === 'dark' ? '#f8fafc' : theme === 'nature' ? '#1d1c1c' : '#0f172a',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
                        opacity: 1
                    }}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2 flex-1">
                            {hoveredTask.title}
                        </span>
                        <div className="shrink-0 flex items-center gap-1">
                            <StatusIcon status={hoveredTask.status} className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {hoveredTask.status}
                            </span>
                        </div>
                    </div>

                    {/* Info list */}
                    <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                        <div className="flex justify-between">
                            <span className="text-slate-400 dark:text-slate-500">Bắt đầu:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                                {hoveredTask.startDate ? new Date(hoveredTask.startDate).toLocaleDateString('vi-VN') : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 dark:text-slate-500">Kết thúc:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                                {hoveredTask.endDate ? new Date(hoveredTask.endDate).toLocaleDateString('vi-VN') : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 dark:text-slate-500">Thời gian thực hiện:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                                {hoveredTask.startDate && hoveredTask.endDate 
                                    ? `${Math.max(1, Math.ceil((new Date(hoveredTask.endDate).getTime() - new Date(hoveredTask.startDate).getTime()) / (1000 * 60 * 60 * 24)))} ngày` 
                                    : '-'}
                            </span>
                        </div>

                        {/* Đơn vị chủ trì / Người thực hiện */}
                        {hoveredTask.isStep ? (
                            <div className="flex justify-between">
                                <span className="text-slate-400 dark:text-slate-500">Đơn vị chủ trì:</span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                    {hoveredTask.assigneeRole || 'Chưa xác định'}
                                </span>
                            </div>
                        ) : (
                            <div className="flex justify-between">
                                <span className="text-slate-400 dark:text-slate-500">Người thực hiện:</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {(() => {
                                        if (!hoveredTask.assigneeId) return 'Chưa gán';
                                        const matched = employees.find(e => e.EmployeeID === hoveredTask.assigneeId);
                                        return matched ? matched.FullName : hoveredTask.assigneeId;
                                    })()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400 dark:text-slate-500 font-bold">TIẾN ĐỘ THỰC HIỆN</span>
                            <span className="font-black text-slate-700 dark:text-slate-200">{hoveredTask.progress}%</span>
                        </div>
                        <div className="h-1 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                    STATUS_COLORS[hoveredTask.status]?.bar || 'bg-slate-500'
                                }`}
                                style={{ width: `${hoveredTask.progress}%` }}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
