import React, { useMemo } from 'react';
import { Task, TaskStatus } from '../../../types';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle2, Play, Eye, Target, CalendarDays, User, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';

interface KanbanBoardProps {
    tasks: Task[];
    onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
    onTaskClick: (taskId: string) => void;
    getAssignee: (id: string) => any;
    getProjectName: (id: string) => string;
}

const STATUS_COLUMNS = [
    { id: TaskStatus.Todo, title: 'Cần làm', bg: 'bg-slate-100 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700' },
    { id: TaskStatus.InProgress, title: 'Đang thực hiện', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800/50' },
    { id: TaskStatus.Review, title: 'Chờ duyệt', bg: 'bg-violet-50 dark:bg-violet-900/10', border: 'border-violet-200 dark:border-violet-800/50' },
    { id: TaskStatus.Done, title: 'Hoàn thành', bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800/50' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskStatusChange, onTaskClick, getAssignee, getProjectName }) => {
    const [activeId, setActiveId] = React.useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px drag to start
            },
        }),
        useSensor(KeyboardSensor)
    );

    const tasksByStatus = useMemo(() => {
        const grouped: Record<TaskStatus, Task[]> = {
            [TaskStatus.Todo]: [],
            [TaskStatus.InProgress]: [],
            [TaskStatus.Review]: [],
            [TaskStatus.Done]: []
        };
        tasks.forEach(t => {
            if (grouped[t.Status]) {
                grouped[t.Status].push(t);
            } else {
                grouped[TaskStatus.Todo].push(t); // fallback
            }
        });
        return grouped;
    }, [tasks]);

    const activeTask = useMemo(() => tasks.find(t => t.TaskID === activeId), [activeId, tasks]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over) return;

        const activeTaskId = active.id as string;
        // The over container could be a status column ID, or another task
        let overId = over.id as string;
        
        // Is it dropped directly on a column?
        if (Object.values(TaskStatus).includes(overId as TaskStatus)) {
            const task = tasks.find(t => t.TaskID === activeTaskId);
            if (task && task.Status !== overId) {
                onTaskStatusChange(activeTaskId, overId as TaskStatus);
            }
            return;
        }

        // It dropped on a task. Find which status that task has
        const overTask = tasks.find(t => t.TaskID === overId);
        if (overTask) {
            const task = tasks.find(t => t.TaskID === activeTaskId);
            if (task && task.Status !== overTask.Status) {
                onTaskStatusChange(activeTaskId, overTask.Status);
            }
        }
    };

    return (
        <div className="flex gap-6 h-[calc(100vh-12rem)] overflow-x-auto pb-4 pt-2">
            <DndContext 
                sensors={sensors} 
                collisionDetection={closestCorners} 
                onDragStart={handleDragStart} 
                onDragEnd={handleDragEnd}
            >
                {STATUS_COLUMNS.map(col => (
                    <Column 
                        key={col.id} 
                        id={col.id} 
                        title={col.title} 
                        bg={col.bg} 
                        border={col.border}
                        tasks={tasksByStatus[col.id]} 
                        onTaskClick={onTaskClick}
                        getAssignee={getAssignee}
                        getProjectName={getProjectName}
                    />
                ))}

                <DragOverlay>
                    {activeTask ? <TaskCard task={activeTask} isDragging={true} getAssignee={getAssignee} getProjectName={getProjectName} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

// ─── COLUMN COMPONENT ────────────────────────────────────────────────────────

import { useDroppable } from '@dnd-kit/core';

interface ColumnProps {
    id: TaskStatus;
    title: string;
    bg: string;
    border: string;
    tasks: Task[];
    onTaskClick: (id: string) => void;
    getAssignee: (id: string) => any;
    getProjectName: (id: string) => string;
}

const Column: React.FC<ColumnProps> = ({ id, title, bg, border, tasks, onTaskClick, getAssignee, getProjectName }) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className={`flex flex-col w-[320px] shrink-0 rounded-2xl border ${border} ${bg} overflow-hidden shadow-sm`}>
            {/* Column Header */}
            <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shrink-0">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    {title}
                    <span className="text-xs font-bold text-slate-500 bg-slate-200/50 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {tasks.length}
                    </span>
                </h3>
            </div>
            
            {/* Column Body */}
            <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[150px]">
                <SortableContext items={tasks.map(t => t.TaskID)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <SortableTaskCard key={task.TaskID} task={task} onClick={() => onTaskClick(task.TaskID)} getAssignee={getAssignee} getProjectName={getProjectName} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
};

// ─── TASK CARD COMPONENT ─────────────────────────────────────────────────────

interface TaskCardProps {
    task: Task;
    isDragging?: boolean;
    onClick?: () => void;
    getAssignee: (id: string) => any;
    getProjectName: (id: string) => string;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging, onClick, getAssignee, getProjectName }) => {
    const isOverdue = task.Status !== TaskStatus.Done && task.DueDate && new Date(task.DueDate) < new Date();
    const assignee = task.AssigneeID ? getAssignee(task.AssigneeID) : null;
    const projectName = task.ProjectName || (task.ProjectID ? getProjectName(task.ProjectID) : '');

    return (
        <div 
            onClick={onClick}
            className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-3 group cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all ${isDragging ? 'opacity-80 rotate-2 scale-[1.02] shadow-xl ring-2 ring-blue-500' : ''}`}
        >
            <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {task.Title?.replace(/^(?:Phòng|Ban)\s+[^-]+-\s*/i, '')}
                </h4>
            </div>

            <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="line-clamp-1 truncate mr-2" title={projectName}>
                        <FolderOpen className="w-3 h-3 inline-block mr-1 text-blue-500 dark:text-blue-400" />
                        {projectName || 'Dự án nội bộ'}
                    </span>
                    {task.ProgressPercent !== undefined && task.ProgressPercent > 0 && (
                        <span className="font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{task.ProgressPercent}%</span>
                    )}
                </div>
                <div className={`flex items-center gap-1 text-[11px] w-fit ${isOverdue ? 'text-red-500 font-bold bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded' : 'text-slate-500'}`}>
                    <CalendarDays className="w-3 h-3" />
                    {task.DueDate ? format(new Date(task.DueDate), 'dd/MM/yyyy') : '---'}
                </div>
            </div>

            {assignee && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                        <img 
                            src={assignee.AvatarUrl || `https://ui-avatars.com/api/?name=${assignee.FullName}&background=6366f1&color=fff&size=24`} 
                            alt={assignee.FullName}
                            className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-slate-800"
                        />
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[100px]">{assignee.FullName}</span>
                    </div>
                    {assignee.Department && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
                            {assignee.Department.replace('Phòng ', '')}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

const SortableTaskCard: React.FC<{ task: Task; onClick: () => void; getAssignee: (id: string) => any; getProjectName: (id: string) => string; }> = ({ task, onClick, getAssignee, getProjectName }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.TaskID });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // If it is dragging, we can optionally hide it in the list (or render a placeholder)
    if (isDragging) {
        return (
            <div ref={setNodeRef} style={style} className="bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl h-24 opacity-50" />
        );
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard task={task} onClick={onClick} getAssignee={getAssignee} getProjectName={getProjectName} />
        </div>
    );
};
