import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PermissionGate from '../../components/PermissionGate';
import { useAllTasks, useUpdateTask, useDeleteTask, useSaveTask } from '../../hooks/useWorkflowTasks';
import { useScopedProjects } from '../../hooks/useScopedProjects';
import { useEmployees } from '../../hooks/useEmployees';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { workflowTaskToTask } from '../../lib/dbMappers';
import { getTimelineStepLabel, getPhaseColor } from '../../utils/timelineStepUtils';
import { getStatusInfo, getPriorityInfo } from './TaskCreateEditModal';
import { ProjectTaskModal } from '../projects/components/ProjectTaskModal';
import ProjectDetail from '../projects/ProjectDetail';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { StatCard, EmptyState } from '../../components/ui';
import { SkeletonStatCard } from '../../components/ui/Skeleton';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskSlidePanel } from './components/TaskSlidePanel';
import { useAuth } from '../../context/AuthContext';
import { User, Sparkles, FolderOpen, X, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CheckCircle2, Trash2 } from 'lucide-react';
import { TaskStatsRow } from './components/TaskStatsRow';
import { TaskFilterBar } from './components/TaskFilterBar';
import { TaskTableView } from './components/TaskTableView';

// ═══════════════════════════════════════════════════
// Sort / Pagination Types
// ═══════════════════════════════════════════════════
type SortField = 'Title' | 'ProgressPercent' | 'DueDate' | 'Priority' | 'Status';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = {
    [TaskPriority.Urgent]: 0, [TaskPriority.High]: 1, [TaskPriority.Medium]: 2, [TaskPriority.Low]: 3,
};

const STATUS_ORDER: Record<string, number> = {
    [TaskStatus.InProgress]: 0, [TaskStatus.Todo]: 1, [TaskStatus.Incomplete]: 2, [TaskStatus.Done]: 3,
};

const PAGE_SIZES = [25, 50, 100] as const;

// ═══════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════

const getProgressGradient = (percent: number) => {
    if (percent >= 100) return 'from-emerald-400 to-emerald-600';
    if (percent >= 70) return 'from-blue-400 to-blue-600';
    if (percent >= 40) return 'from-primary-400 to-primary-500';
    if (percent > 0) return 'from-slate-300 to-slate-400';
    return 'from-slate-200 to-slate-200';
};

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════

const TaskList: React.FC = () => {
    const navigate = useNavigate();
    const { openPanel } = useSlidePanel();
    const { currentUser } = useAuth();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterProject, setFilterProject] = useState<string>('All');
    const [filterMonth, setFilterMonth] = useState<string>('All');
    const [filterDepartment, setFilterDepartment] = useState<string>('All');
    const [filterOverdue, setFilterOverdue] = useState(false);
    const [filterPersonal, setFilterPersonal] = useState(false);
    const [filterTaskType, setFilterTaskType] = useState<string>('All');
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
    const [isEditMode, setIsEditMode] = useState(false);

    // ── Sort ──
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    // ── Pagination ──
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState<number>(50);

    // ── Batch selection ──
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Data
    const { data: tasks = [], isLoading, error: tasksError } = useAllTasks();
    const { scopedProjects: projects, scopedProjectIds, isGlobalScope } = useScopedProjects();
    const { data: employees = [] } = useEmployees();

    // Mutations
    const saveTaskMutation = useSaveTask();
    const updateTaskMutation = useUpdateTask();
    const deleteTaskMutation = useDeleteTask();
    
    // Derived
    const departments = useMemo(() => {
        const depts = new Set(employees.map(e => e.Department).filter(Boolean));
        return Array.from(depts).sort();
    }, [employees]);

    // ── Filter ──
    const filteredTasks = useMemo(() => tasks.filter(task => {
        // First: scope filter — only show tasks for scoped projects, but ALWAYS show internal/unassigned tasks
        const isInternal = task.TaskType === 'internal' || !task.ProjectID;
        if (!isInternal && !isGlobalScope && !scopedProjectIds.has(task.ProjectID)) return false;
        
        const matchSearch = task.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.Description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'All' || task.Status === filterStatus;
        const matchProject = filterProject === 'All' || task.ProjectID === filterProject;
        
        // Personal filter: assigned to current user
        const matchPersonal = !filterPersonal || task.AssigneeID === currentUser?.EmployeeID;

        // Month filter (checks both StartDate and DueDate)
        const matchMonth = filterMonth === 'All' || (
            (task.DueDate && new Date(task.DueDate).getMonth() + 1 === parseInt(filterMonth)) ||
            (task.StartDate && new Date(task.StartDate).getMonth() + 1 === parseInt(filterMonth))
        );

        // Department filter
        const matchDepartment = filterDepartment === 'All' || (() => {
            const assignee = employees.find(e => e.EmployeeID === task.AssigneeID);
            return assignee?.Department === filterDepartment;
        })();

        // Overdue: chưa xong + có hạn + đã quá hạn
        const matchOverdue = !filterOverdue || (
            task.Status !== TaskStatus.Done &&
            !!task.DueDate &&
            new Date(task.DueDate) < new Date()
        );
        // Task type filter
        const matchTaskType = filterTaskType === 'All' || task.TaskType === filterTaskType;

        return matchSearch && matchStatus && matchProject && matchMonth && matchDepartment && matchOverdue && matchPersonal && matchTaskType;
    }), [tasks, searchTerm, filterStatus, filterProject, filterMonth, filterDepartment, filterOverdue, filterPersonal, filterTaskType, currentUser, scopedProjectIds, isGlobalScope, employees]);

    // ── Sort ──
    const sortedTasks = useMemo(() => {
        if (!sortField) return filteredTasks;
        const sorted = [...filteredTasks].sort((a, b) => {
            let cmp = 0;
            switch (sortField) {
                case 'Title': cmp = a.Title.localeCompare(b.Title, 'vi'); break;
                case 'ProgressPercent': cmp = (a.ProgressPercent || 0) - (b.ProgressPercent || 0); break;
                case 'DueDate': cmp = (a.DueDate || '9999').localeCompare(b.DueDate || '9999'); break;
                case 'Priority': cmp = (PRIORITY_ORDER[a.Priority] ?? 9) - (PRIORITY_ORDER[b.Priority] ?? 9); break;
                case 'Status': cmp = (STATUS_ORDER[a.Status] ?? 9) - (STATUS_ORDER[b.Status] ?? 9); break;
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return sorted;
    }, [filteredTasks, sortField, sortDir]);

    // ── Pagination ──
    const totalPages = Math.ceil(sortedTasks.length / pageSize);
    const paginatedTasks = useMemo(() =>
        sortedTasks.slice(page * pageSize, (page + 1) * pageSize)
    , [sortedTasks, page, pageSize]);

    // Reset page when filters change
    const filteredLen = filteredTasks.length;
    useMemo(() => { setPage(0); }, [filteredLen, sortField, sortDir]);

    // ── Group by project (paginated) ──
    const tasksByProject = useMemo(() =>
        paginatedTasks.reduce((acc, task) => {
            const pid = task.ProjectID;
            if (!acc[pid]) acc[pid] = [];
            acc[pid].push(task);
            return acc;
        }, {} as Record<string, Task[]>)
        , [paginatedTasks]);

    // ── Stats ──
    const stats = useMemo(() => {
        const now = new Date();
        return {
            total: filteredTasks.length,
            inProgress: filteredTasks.filter(t => t.Status === TaskStatus.InProgress).length,
            done: filteredTasks.filter(t => t.Status === TaskStatus.Done).length,
            incomplete: filteredTasks.filter(t => t.Status === TaskStatus.Incomplete).length,
            overdue: filteredTasks.filter(t =>
                t.Status !== TaskStatus.Done &&
                t.Status !== TaskStatus.Incomplete &&
                t.DueDate && new Date(t.DueDate) < now
            ).length,
            completion: filteredTasks.length > 0
                ? Math.round((filteredTasks.filter(t => t.Status === TaskStatus.Done).length / filteredTasks.length) * 100)
                : 0,
        };
    }, [filteredTasks]);

    // ── Helpers ──
    const getProjectName = (id: string, groupTasks?: Task[]) => {
        // First try to find from tasks metadata directly (safest since tasks are loaded)
        if (groupTasks && groupTasks.length > 0) {
            const taskWithProjName = groupTasks.find(t => t.ProjectName && t.ProjectName.trim() !== '');
            if (taskWithProjName) return taskWithProjName.ProjectName;
        }
        
        // Fallback to loaded scoped projects
        return projects.find(p => p.ProjectID === id)?.ProjectName || id;
    };
    const getAssignee = (id: string) => employees.find(e => e.EmployeeID === id);

    // ── Sort handler ──
    const handleSort = useCallback((field: SortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    }, [sortField]);

    const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
        if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-0 group-hover/th:opacity-40 transition-opacity" />;
        return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />;
    };

    // ── Batch selection ──
    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        if (selectedIds.size === paginatedTasks.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(paginatedTasks.map(t => t.TaskID)));
    }, [selectedIds.size, paginatedTasks]);

    const handleBatchDelete = async () => {
        if (!window.confirm(`Xóa ${selectedIds.size} công việc đã chọn?`)) return;
        await Promise.all(Array.from(selectedIds).map((id: string) => deleteTaskMutation.mutateAsync(id)));
        setSelectedIds(new Set());
    };

    const handleBatchStatus = async (status: TaskStatus) => {
        const tasksToUpdate = tasks.filter(t => selectedIds.has(t.TaskID));
        await Promise.all(tasksToUpdate.map(t =>
            updateTaskMutation.mutateAsync({ 
                taskId: t.TaskID, 
                updates: { status: status as any } // Enum matches the DbTaskStatus
            })
        ));
        setSelectedIds(new Set());
    };

    // ── CRUD handlers ──
    const handleDelete = async (id: string) => {
        if (window.confirm("Xóa công việc này?")) {
            await deleteTaskMutation.mutateAsync(id);
        }
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setCurrentTask({
            Status: TaskStatus.Todo,
            Priority: TaskPriority.Medium,
            ProjectID: projects[0]?.ProjectID || '',
            AssigneeID: employees[0]?.EmployeeID || '',
            ProgressPercent: 0,
        });
        setIsModalOpen(true);
    };

    const openTaskPanel = (task: Task) => {
        openPanel({
            title: task.Title,
            icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
            url: `/tasks/${task.TaskID}`,
            component: <TaskSlidePanel taskId={task.TaskID} onClose={() => {/* context handles close */}} />,
        });
    };

    const openEditModal = (task: Task) => {
        setIsEditMode(true);
        setCurrentTask(task);
        setIsModalOpen(true);
    };

    const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
        let dbStatus = 'todo';
        switch (newStatus) {
            case TaskStatus.InProgress: dbStatus = 'in_progress'; break;
            case TaskStatus.Done: dbStatus = 'done'; break;
            case TaskStatus.Review: dbStatus = 'review'; break;
            case TaskStatus.Incomplete: dbStatus = 'incomplete'; break;
        }
        
        const updates: any = { status: dbStatus };
        if (newStatus === TaskStatus.Done) {
            updates.progress = 100;
        }

        await updateTaskMutation.mutateAsync({ taskId, updates });
    };

    const handleSave = async (taskData: Partial<Task>) => {
        // Re-map UI Task structure to DbTask payload for the service
        const workflowPayload: any = {
            id: taskData.TaskID?.startsWith('NEW_') ? undefined : taskData.TaskID,
            task_type: taskData.ProjectID ? 'project' : 'internal',
            title: taskData.Title,
            progress: taskData.ProgressPercent,
            assignee_id: taskData.AssigneeID,
            due_date: taskData.DueDate,
            project_id: taskData.ProjectID,
            actual_start_date: taskData.ActualStartDate,
            actual_end_date: taskData.ActualEndDate,
            estimated_cost: taskData.EstimatedCost,
            actual_cost: taskData.ActualCost,
            metadata: {
                 sub_tasks: taskData.SubTasks,
                 attachments: taskData.Attachments,
                 dependencies: taskData.Dependencies,
                 estimatedDays: taskData.DurationDays,
            }
        };

        if (taskData.Status) {
            switch (taskData.Status) {
                case TaskStatus.InProgress: workflowPayload.status = 'in_progress'; break;
                case TaskStatus.Done: workflowPayload.status = 'done'; break;
                case TaskStatus.Review: workflowPayload.status = 'review'; break;
                case TaskStatus.Incomplete: workflowPayload.status = 'incomplete'; break;
                default: workflowPayload.status = 'todo'; break;
            }
        }

        await saveTaskMutation.mutateAsync(workflowPayload);
        setIsModalOpen(false);
    };

    const hasActiveFilters = filterStatus !== 'All' || filterProject !== 'All' || filterMonth !== 'All' || filterDepartment !== 'All' || filterTaskType !== 'All' || searchTerm !== '' || filterOverdue || filterPersonal;

    // ═══════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════
    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ══════════ STATS DASHBOARD ══════════ */}
            <TaskStatsRow 
                stats={stats}
                isLoading={isLoading}
                tasksError={tasksError}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterOverdue={filterOverdue}
                setFilterOverdue={setFilterOverdue}
            />

            {/* ══════════ TOOLBAR ══════════ */}
            <TaskFilterBar 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterProject={filterProject}
                setFilterProject={setFilterProject}
                filterMonth={filterMonth}
                setFilterMonth={setFilterMonth}
                filterDepartment={filterDepartment}
                setFilterDepartment={setFilterDepartment}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterOverdue={filterOverdue}
                setFilterOverdue={setFilterOverdue}
                filterPersonal={filterPersonal}
                setFilterPersonal={setFilterPersonal}
                filterTaskType={filterTaskType}
                setFilterTaskType={setFilterTaskType}
                hasActiveFilters={hasActiveFilters}
                projects={projects}
                departments={departments}
                viewMode={viewMode}
                setViewMode={setViewMode}
                openCreateModal={openCreateModal}
            />

            {/* ══════════ BATCH BAR ══════════ */}
            {selectedIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl animate-in fade-in duration-200">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {selectedIds.size} công việc được chọn
                    </span>
                    <div className="flex items-center gap-2">
                        <select
                            onChange={(e) => { if (e.target.value) handleBatchStatus(e.target.value as TaskStatus); e.target.value = ''; }}
                            className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 cursor-pointer"
                            defaultValue=""
                        >
                            <option value="" disabled>Đổi trạng thái...</option>
                            <option value={TaskStatus.Todo}>Cần làm</option>
                            <option value={TaskStatus.InProgress}>Đang thực hiện</option>
                            <option value={TaskStatus.Review}>Chờ duyệt</option>
                            <option value={TaskStatus.Done}>Hoàn thành</option>
                        </select>
                        <button
                            onClick={handleBatchDelete}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg font-medium transition-colors"
                        >
                            <Trash2 className="w-3 h-3" /> Xóa
                        </button>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 px-2"
                        >
                            Bỏ chọn
                        </button>
                    </div>
                </div>
            )}

            {/* ══════════ TASK LIST ══════════ */}
            {isLoading ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="h-10 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700" />
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                            <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-600 shrink-0" />
                            <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-600 shrink-0" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse flex-1 max-w-xs" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse w-32 hidden md:block" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse w-16 mx-auto" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse w-24 hidden lg:block" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse w-20 hidden sm:block" />
                            <div className="h-5 bg-slate-200 dark:bg-slate-600 rounded-full animate-pulse w-16" />
                        </div>
                    ))}
                </div>
            ) : viewMode === 'list' ? (<>
                <div className="space-y-0">
                    <TaskTableView
                        paginatedTasks={paginatedTasks}
                        tasksByProject={tasksByProject}
                        selectedIds={selectedIds}
                        toggleSelectAll={toggleSelectAll}
                        toggleSelect={toggleSelect}
                        handleSort={handleSort}
                        SortIcon={SortIcon}
                        getProjectName={getProjectName}
                        getAssignee={getAssignee}
                        openTaskPanel={openTaskPanel}
                        openEditModal={openEditModal}
                        handleDelete={handleDelete}
                        openCreateModal={openCreateModal}
                        openPanel={openPanel}
                    />
                </div>

                {/* ══════════ PAGINATION ══════════ */}
                {sortedTasks.length > pageSize && (
                    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                Hiển thị {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sortedTasks.length)} / {sortedTasks.length}
                            </span>
                            <select
                                value={pageSize}
                                onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
                                className="text-xs px-2 py-1 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer"
                            >
                                {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / trang</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(0)} disabled={page === 0}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 disabled:opacity-30 transition-colors">
                                <ChevronsLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 disabled:opacity-30 transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg min-w-[60px] text-center">
                                {page + 1} / {totalPages}
                            </span>
                            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 disabled:opacity-30 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 disabled:opacity-30 transition-colors">
                                <ChevronsRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </>) : (
                /* ══════════ BOARD VIEW (Kanban-like columns) ══════════ */
                <KanbanBoard 
                    tasks={filteredTasks} 
                    onTaskStatusChange={handleTaskStatusChange}
                    onTaskClick={(taskId) => {
                        const task = tasks.find(t => t.TaskID === taskId);
                        if (task) openTaskPanel(task);
                    }}
                    getAssignee={getAssignee}
                    getProjectName={getProjectName}
                />
            )}

            {/* ══════════ MODAL ══════════ */}
            <ProjectTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSave}
                initialData={currentTask}
                allTasks={tasks}
            />
        </div>
    );
};

export default TaskList;