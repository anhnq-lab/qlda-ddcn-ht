import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { TaskService } from '@/services/TaskService';
import { supabase } from '@/lib/supabase';
import { 
    BarChart3, ChevronRight, ChevronDown, CheckCircle2, 
    Clock, AlertTriangle, Circle, Maximize2, Minimize2 
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Task, TaskStatus } from '@/types';
import { useProjectSteps } from '@/features/projects/hooks/useProjectSteps';
import { workflowTaskToTask } from '@/lib/mappers/workflowTaskMappers';
import { isTaskInStep } from '@/lib/progressCalculator';
import { useEmployees } from '@/hooks/useEmployees';

interface GanttChartWidgetProps {
    projectId: string;
    maxTasks?: number;
    onViewAll?: () => void;
}

const STATUS_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
    done: { bar: 'bg-emerald-500 dark:bg-emerald-400', bg: 'bg-emerald-50/80 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300' },
    in_progress: { bar: 'bg-blue-500 dark:bg-blue-400', bg: 'bg-blue-50/80 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300' },
    review: { bar: 'bg-amber-500 dark:bg-amber-400', bg: 'bg-amber-50/80 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300' },
    todo: { bar: 'bg-slate-300 dark:bg-slate-500', bg: 'bg-slate-100 dark:bg-slate-900', text: 'text-txt-muted' },
    overdue: { bar: 'bg-red-500 dark:bg-red-400', bg: 'bg-red-50/80 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300' },
};

const getNormalizedStatus = (status: string) => {
    const s = (status || 'todo').toLowerCase().trim();
    if (s === 'inprogress' || s === 'in_progress' || s === 'in-progress' || s === 'đang thực hiện') return 'in_progress';
    if (s === 'completed' || s === 'done' || s === 'đã hoàn thành') return 'done';
    if (s === 'review' || s === 'chờ duyệt') return 'review';
    if (s === 'overdue' || s === 'trễ hạn') return 'overdue';
    return 'todo';
};

const StatusIcon: React.FC<{ status: string; className?: string }> = ({ status, className = 'w-3 h-3' }) => {
    const norm = getNormalizedStatus(status);
    switch (norm) {
        case 'done': return <CheckCircle2 className={`${className} text-emerald-500`} />;
        case 'in_progress': return <Clock className={`${className} text-primary-500`} />;
        case 'review': return <Clock className={`${className} text-blue-500`} />;
        case 'overdue': return <AlertTriangle className={`${className} text-red-500`} />;
        default: return <Circle className={`${className} text-slate-400`} />;
    }
};

export const GanttChartWidget: React.FC<GanttChartWidgetProps> = ({
    projectId,
    maxTasks = 5,
    onViewAll
}) => {
    const { theme } = useTheme();
    const { data: employees = [] } = useEmployees();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
    const hasInitializedExpandedSteps = useRef(false);
    const widgetRef = useRef<HTMLDivElement>(null);

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

    // Lấy thông tin dự án mọi lúc để lấy group_code, design_steps
    const { data: project } = useQuery({
        queryKey: ['project-info-gantt', projectId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('project_id', projectId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!projectId,
    });

    // Dùng useProjectSteps để lấy phases từ MPI (không phải workflow template)
    const { phases, isLoading: isLoadingPhases } = useProjectSteps(projectId);

    const { data: rawTasks = [], isLoading: isLoadingTasks } = useQuery({
        queryKey: ['gantt-tasks', projectId],
        queryFn: async () => {
            const data = await TaskService.getProjectTasks(projectId);
            return data || [];
        },
        enabled: !!projectId,
        staleTime: 5 * 60 * 1000,
    });

    // Map rawTasks → Task[] dùng canonical mapper
    const mappedTasks = useMemo<Task[]>(() => {
        if (!rawTasks) return [];
        return rawTasks.map((wt: any) =>
            wt.TaskID ? wt as Task : workflowTaskToTask(wt, projectId)
        );
    }, [rawTasks, projectId]);

    // Dựng cây các bước lớn và công việc con
    const processedTasks = useMemo(() => {
        if (!phases || !mappedTasks) return [];
        const now = new Date();
        const fallbackStart = project?.created_at ? new Date(project.created_at) : now;

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
            // Dùng isTaskInStep — ưu tiên FK (MonthlyPlanItemID) rồi fallback semantic stepCode
            const stepTasks = mappedTasks.filter(t =>
                isTaskInStep(t, { id: step.code, code: step.stepCode ?? step.code })
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

            const mappedSubTasks = stepTasks.map(t => {
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
                subTasks: mappedSubTasks,
                assigneeRole: step.assigneeRole
            };

            result.push(stepGanttTask);
        });

        return result;
    }, [phases, mappedTasks, project]);

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

    // Lắng nghe phím Escape để thoát fullscreen
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // Khóa cuộn trang khi mở fullscreen
    useEffect(() => {
        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isFullscreen]);

    // Tính toán biên mốc thời gian
    const { timelineStart, timelineEnd, totalDays, months } = useMemo(() => {
        if (processedTasks.length === 0) {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 6, 0);
            return { timelineStart: start, timelineEnd: end, totalDays: 180, months: [] as { label: string; width: number }[] };
        }

        const allDates: number[] = [];
        processedTasks.forEach(step => {
            allDates.push(step.startDate.getTime());
            allDates.push(step.endDate.getTime());
            if (step.subTasks) {
                step.subTasks.forEach((sub: any) => {
                    allDates.push(sub.startDate.getTime());
                    allDates.push(sub.endDate.getTime());
                });
            }
        });

        const minDate = new Date(Math.min(...allDates));
        const maxDate = new Date(Math.max(...allDates));

        // Thêm khoảng đệm 15 ngày ở hai đầu
        const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
        const total = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        // Tạo nhãn tháng
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
    }, [processedTasks]);

    // Vị trí mốc ngày hôm nay
    const todayPosition = useMemo(() => {
        const now = new Date();
        if (now < timelineStart || now > timelineEnd) return -1;
        const days = Math.ceil((now.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
        return (days / totalDays) * 100;
    }, [timelineStart, timelineEnd, totalDays]);

    // Xử lý dàn phẳng danh sách các tasks sẽ hiển thị (kèm mở rộng/thu gọn)
    const visibleTasks = useMemo(() => {
        const list: any[] = [];
        // Nếu ở chế độ fullscreen, luôn hiển thị toàn bộ các task cha
        const baseTasks = isFullscreen ? processedTasks : processedTasks.slice(0, maxTasks);

        baseTasks.forEach(step => {
            list.push(step);
            if (expandedTaskIds.has(step.id) && step.subTasks && step.subTasks.length > 0) {
                step.subTasks.forEach((t: any) => {
                    list.push(t);
                });
            }
        });

        return list;
    }, [processedTasks, expandedTaskIds, isFullscreen, maxTasks]);

    const hasMore = processedTasks.length > maxTasks;

    // Thống kê tiến độ chung
    const stats = useMemo(() => {
        const total = mappedTasks.length;
        const done = mappedTasks.filter(t => t.Status === TaskStatus.Done).length;
        const inProgress = mappedTasks.filter(t => t.Status === TaskStatus.InProgress || t.Status === TaskStatus.Review).length;
        const overdue = mappedTasks.filter(t => {
            if (t.Status === TaskStatus.Done) return false;
            if (!t.DueDate) return false;
            return new Date(t.DueDate) < new Date();
        }).length;
        const avgProgress = total > 0 ? Math.round(mappedTasks.reduce((a, t) => a + (t.ProgressPercent || 0), 0) / total) : 0;
        return { total, done, inProgress, overdue, avgProgress };
    }, [mappedTasks]);

    const toggleFullscreen = () => {
        setIsFullscreen(prev => !prev);
    };

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

    const isAllCollapsed = expandedTaskIds.size === 0;
    const handleToggleAllExpand = () => {
        if (isAllCollapsed) {
            const allStepIds = processedTasks.filter(t => t.isStep).map(t => t.id);
            setExpandedTaskIds(new Set(allStepIds));
        } else {
            setExpandedTaskIds(new Set());
        }
    };

    const isLoading = isLoadingTasks || isLoadingPhases;

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

    if (processedTasks.length === 0) {
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
                    <p className="text-xs text-txt-muted">Chưa có kế hoạch công việc</p>
                    {onViewAll && (
                        <button onClick={onViewAll} className="mt-2 text-xs text-blue-600 hover:underline font-medium">
                            Tạo kế hoạch →
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Tăng nhẹ chiều rộng cột tên ở widget để dễ đọc chữ phân cấp hơn
    const taskNameWidthClass = isFullscreen ? 'w-80' : 'w-48';

    return (
        <div 
            ref={widgetRef}
            className={
                isFullscreen 
                    ? "fixed inset-0 z-50 w-screen h-screen bg-bg-app overflow-y-auto p-6 md:p-8 flex flex-col transition-all duration-300 animate-in fade-in zoom-in-95"
                    : "section-card"
            }
        >
            {/* Header */}
            <div className="section-card-header flex items-center justify-between border-b border-border py-3 px-4 bg-bg-subtle">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="section-icon"><BarChart3 className="w-3.5 h-3.5" /></div>
                    <span className={`truncate text-txt-primary ${isFullscreen ? "text-base font-black" : "text-sm font-bold"}`}>
                        Tiến độ thực hiện {isFullscreen && project?.project_name ? `— ${project.project_name}` : ''}
                    </span>
                    <span className="text-[10px] font-bold text-txt-placeholder bg-bg-muted px-1.5 py-0.5 rounded-full shrink-0">
                        ({stats.avgProgress}%)
                    </span>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                    <button 
                        onClick={toggleFullscreen} 
                        className="flex items-center gap-1.5 text-[10px] text-txt-muted hover:text-txt-primary font-bold bg-bg-muted hover:bg-bg-subtle px-2 py-1 rounded-md transition-colors"
                        title={isFullscreen ? "Thu nhỏ (Esc)" : "Phóng to toàn màn hình"}
                    >
                        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        <span>{isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}</span>
                    </button>
                    
                    {onViewAll && !isFullscreen && (
                        <button onClick={onViewAll} className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline font-bold">
                            Xem kế hoạch <ChevronRight className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            <div className={`p-2.5 flex-1 flex flex-col ${isFullscreen ? 'overflow-y-auto' : ''}`}>
                {/* Mini Stats */}
                <div className="flex items-center justify-between mb-2.5 shrink-0">
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                        <span className="flex items-center gap-1 text-txt-muted">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Xong: {stats.done}/{stats.total}
                        </span>
                        <span className="flex items-center gap-1 text-txt-muted">
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
                    {/* Nút Thu gọn/Mở rộng tất cả */}
                    <button 
                        onClick={handleToggleAllExpand}
                        className="text-[9px] font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 px-1.5 py-0.5 bg-bg-muted rounded transition-colors"
                    >
                        {isAllCollapsed ? "Mở tất cả" : "Thu gọn tất cả"}
                    </button>
                </div>

                {/* Gantt Chart Area */}
                <div className="relative overflow-x-auto flex-1 min-h-0 border border-border-subtle rounded-xl p-2 bg-bg-surface">
                    <div className="min-w-[600px]">
                        {/* Month headers */}
                        <div className="flex mb-1 pb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <div className={`${taskNameWidthClass} shrink-0`} />
                            <div className="flex-1 flex">
                                {months.map((m, i) => (
                                    <div
                                        key={i}
                                        className="text-[9px] font-bold text-txt-placeholder text-center py-0.5 shrink-0"
                                        style={{ width: `${m.width}%`, borderRight: '1px solid var(--border-subtle)' }}
                                    >
                                        {m.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Task bars container */}
                        <div className="relative">
                            {/* Grid Lines Layer (Nét mờ mịn dưới nền, làm mờ tối đa) */}
                            <div className="absolute inset-0 flex pointer-events-none z-0 opacity-[0.06]">
                                <div className={`${taskNameWidthClass} shrink-0`} style={{ borderRight: '1px solid var(--border-subtle)' }} />
                                <div className="flex-1 flex h-full">
                                    {months.map((m, i) => (
                                        <div
                                            key={i}
                                            style={{ width: `${m.width}%`, borderRight: '1px solid var(--border-subtle)' }}
                                            className="h-full"
                                        />
                                    ))}
                                </div>
                            </div>
                            {/* Today marker */}
                            {todayPosition >= 0 && todayPosition <= 100 && (
                                <div
                                    className="absolute top-0 bottom-0 w-px bg-red-400 dark:bg-red-500 z-10 pointer-events-none"
                                    style={{ left: `calc(${taskNameWidthClass} + (100% - ${taskNameWidthClass}) * ${todayPosition} / 100)` }}
                                >
                                    <div className="absolute -top-0.5 -left-1.5 w-3 h-1 bg-red-400 dark:bg-red-500 rounded-sm" />
                                </div>
                            )}

                            {visibleTasks.map((task) => {
                                const startOffset = Math.max(0, (task.startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
                                const duration = Math.max(1, (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24));
                                const left = (startOffset / totalDays) * 100;
                                const width = Math.max(4, (duration / totalDays) * 100);
                                const normStatus = getNormalizedStatus(task.status);
                                const colors = STATUS_COLORS[normStatus] || STATUS_COLORS.todo;

                                const isExpanded = expandedTaskIds.has(task.id);
                                const hasSubtasks = task.subTasks && task.subTasks.length > 0;
                                
                                const isStep = task.isStep;
                                const barHeightClass = isStep ? 'h-5 rounded-md top-1.5' : 'h-3.5 rounded-sm top-1';
                                const rowBgClass = isStep 
                                    ? 'bg-[var(--bg-subtle)]/70 dark:bg-[var(--bg-subtle)]/40' 
                                    : 'bg-transparent';

                                return (
                                    <div 
                                        key={task.id} 
                                        className={`flex group ${rowBgClass} hover:bg-[var(--bg-muted)] transition-colors py-[6px] items-center`}
                                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                                        onMouseEnter={(e) => handleMouseMove(e, task)}
                                        onMouseMove={(e) => handleMouseMove(e, task)}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        
                                        {/* Task name column */}
                                        {task.level === 1 ? (
                                            /* Cột tên của công việc con */
                                            <div 
                                                className={`${taskNameWidthClass} shrink-0 flex items-center gap-0.5 pr-1 relative`}
                                                style={{ paddingLeft: '24px' }}
                                            >
                                                <span className="w-2.5 shrink-0 border-l border-b h-2.5 -mt-1.5 mr-1 rounded-bl-sm" style={{ borderColor: 'var(--border-subtle)' }} />
                                                <StatusIcon status={task.status} className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                                <span className="text-[10px] text-txt-muted truncate font-semibold leading-tight" title={task.title}>
                                                    {task.title}
                                                </span>
                                            </div>
                                        ) : (
                                            /* Cột tên của Bước cha */
                                            <div className={`${taskNameWidthClass} shrink-0 flex items-center gap-0.5 pr-1 pl-2`}>
                                                {hasSubtasks ? (
                                                    <button 
                                                        onClick={(e) => toggleExpand(task.id, e)}
                                                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-500 shrink-0 mr-0.5"
                                                        title={isExpanded ? "Thu gọn công việc con" : "Xem chi tiết công việc con"}
                                                    >
                                                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                                    </button>
                                                ) : (
                                                    <span className="w-5 shrink-0" />
                                                )}
                                                <StatusIcon status={task.status} className="w-3 h-3 shrink-0" />
                                                <span 
                                                    className="text-[11px] text-[var(--text-primary)] font-bold truncate leading-tight cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" 
                                                    title={task.title}
                                                    onClick={hasSubtasks ? (e) => toggleExpand(task.id, e) : undefined}
                                                >
                                                    {task.title}
                                                </span>
                                            </div>
                                        )}

                                        {/* Bar timeline area */}
                                        <div className="flex-1 relative h-7 min-w-0 flex items-center">
                                            {/* Background bar (full task span) */}
                                            <div
                                                className={`absolute ${colors.bg} border border-slate-200/50 dark:border-slate-700/50 flex items-center min-w-[16px] transition-all cursor-pointer hover:opacity-90 hover:shadow-sm ${barHeightClass}`}
                                                style={{ left: `${left}%`, width: `${width}%` }}
                                            >
                                                {/* Progress fill */}
                                                <div
                                                    className={`h-full rounded-l-sm ${colors.bar} transition-all duration-500 ${task.progress === 100 ? 'rounded-r-sm' : ''} opacity-100`}
                                                    style={{ width: `${Math.min(100, task.progress)}%` }}
                                                />

                                                {/* Progress text */}
                                                {width > 6 && (
                                                    <span className="absolute inset-0 flex items-center justify-center text-[8px] text-txt-secondary font-bold whitespace-nowrap overflow-hidden px-1">
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
                </div>

                {/* View more (Ẩn khi ở chế độ fullscreen để tránh thừa thãi) */}
                {hasMore && onViewAll && !isFullscreen && (
                    <button
                        onClick={onViewAll}
                        className="w-full mt-2 py-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors shrink-0"
                    >
                        Xem tất cả {processedTasks.length} bước quy trình →
                    </button>
                )}

                {/* Overall progress bar */}
                <div className="mt-3 bg-bg-muted rounded-lg px-2.5 py-1.5 shrink-0">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-txt-muted font-bold uppercase tracking-wide">Tiến độ tổng thể dự án</span>
                        <span className={`font-black tabular-nums ${stats.avgProgress >= 50 ? 'text-emerald-600' : stats.avgProgress > 20 ? 'text-primary-600' : 'text-red-600'}`}>
                            {stats.avgProgress}%
                        </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                                background: stats.avgProgress >= 50 ? 'linear-gradient(90deg, #10B981, #059669)' :
                                    stats.avgProgress > 20 ? 'linear-gradient(90deg, #fb923c, #00668c)' :
                                        'linear-gradient(90deg, #EF4444, #DC2626)',
                                width: `${Math.min(100, Math.max(0, stats.avgProgress))}%`
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Custom Premium Tooltip (Rendered via Portal, opaque background) */}
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
                    <div className="flex items-start justify-between gap-2 border-b border-border pb-1.5">
                        <span className="font-bold text-txt-primary line-clamp-2 flex-1">
                            {hoveredTask.title}
                        </span>
                        <div className="shrink-0 flex items-center gap-1">
                            <StatusIcon status={hoveredTask.status} className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-txt-muted">
                                {hoveredTask.status}
                            </span>
                        </div>
                    </div>

                    {/* Info list */}
                    <div className="space-y-1 text-[11px] text-txt-muted">
                        <div className="flex justify-between">
                            <span className="text-txt-placeholder">Bắt đầu:</span>
                            <span className="font-medium text-txt-secondary">
                                {hoveredTask.startDate ? new Date(hoveredTask.startDate).toLocaleDateString('vi-VN') : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-txt-placeholder">Kết thúc:</span>
                            <span className="font-medium text-txt-secondary">
                                {hoveredTask.endDate ? new Date(hoveredTask.endDate).toLocaleDateString('vi-VN') : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-txt-placeholder">Thời gian thực hiện:</span>
                            <span className="font-medium text-txt-secondary">
                                {hoveredTask.startDate && hoveredTask.endDate 
                                    ? `${Math.max(1, Math.ceil((new Date(hoveredTask.endDate).getTime() - new Date(hoveredTask.startDate).getTime()) / (1000 * 60 * 60 * 24)))} ngày` 
                                    : '-'}
                            </span>
                        </div>

                        {/* Đơn vị chủ trì / Người thực hiện */}
                        {hoveredTask.isStep ? (
                            <div className="flex justify-between">
                                <span className="text-txt-placeholder">Đơn vị chủ trì:</span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                    {hoveredTask.assigneeRole || 'Chưa xác định'}
                                </span>
                            </div>
                        ) : (
                            <div className="flex justify-between">
                                <span className="text-txt-placeholder">Người thực hiện:</span>
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
                    <div className="space-y-1 pt-1 border-t border-border">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-txt-placeholder font-bold">TIẾN ĐỘ THỰC HIỆN</span>
                            <span className="font-black text-txt-secondary">{hoveredTask.progress}%</span>
                        </div>
                        <div className="h-1 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                    STATUS_COLORS[getNormalizedStatus(hoveredTask.status)]?.bar || 'bg-slate-500'
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

export default GanttChartWidget;
