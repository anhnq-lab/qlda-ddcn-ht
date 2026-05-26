import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PermissionGate from '../../components/PermissionGate';
import { useAllTasks, useUpdateTask, useDeleteTask, useSaveTask } from '../../hooks/useWorkflowTasks';
import { useScopedProjects } from '../../hooks/useScopedProjects';
import { useEmployees } from '../../hooks/useEmployees';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { workflowTaskToTask } from '../../lib/dbMappers';
import { getTimelineStepLabel, getPhaseColor } from '../../utils/timelineStepUtils';
import { getStatusInfo, getPriorityInfo } from './TaskCreateEditModal';
import { DEPARTMENT_NAMES, DepartmentCode } from '../../types/plan.types';
import { ProjectTaskModal } from '../../components/common/ProjectTaskModal';
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

const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

const isUpdatedThisWeek = (updatedAtStr?: string) => {
    if (!updatedAtStr) return false;
    const updateDate = new Date(updatedAtStr);
    const startOfWeek = getStartOfWeek(new Date());
    return updateDate >= startOfWeek;
};

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════

interface TaskListProps {
    month?: string;
    year?: string;
    department?: string;
}

const TaskList: React.FC<TaskListProps> = ({ month: externalMonth, year: externalYear, department: externalDepartment }) => {
    const navigate = useNavigate();
    const { openPanel, closePanel } = useSlidePanel();
    const { currentUser } = useAuth();
    
    const [searchParams] = useSearchParams();
    const urlTaskId = searchParams.get('taskId');
    
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterProject, setFilterProject] = useState<string>('All');
    
    const [localMonth, setLocalMonth] = useState<string>('All');
    const [localYear, setLocalYear] = useState<string>('All');
    const filterMonth = externalMonth !== undefined ? externalMonth : localMonth;
    const filterYear = externalYear !== undefined ? externalYear : localYear;
    const setFilterMonth = externalMonth !== undefined ? () => {} : setLocalMonth;
    const setFilterYear = externalYear !== undefined ? () => {} : setLocalYear;

    const [localDepartment, setLocalDepartment] = useState<string>('All');
    const filterDepartment = externalDepartment !== undefined 
        ? (DEPARTMENT_NAMES[externalDepartment as DepartmentCode] || externalDepartment)
        : localDepartment;
    const setFilterDepartment = externalDepartment !== undefined ? () => {} : setLocalDepartment;
    const [filterOverdue, setFilterOverdue] = useState(false);
    const [filterNotUpdatedThisWeek, setFilterNotUpdatedThisWeek] = useState(false);
    const [filterPersonal, setFilterPersonal] = useState(false);
    const [filterPendingProposal, setFilterPendingProposal] = useState(false);
    const [filterTaskType, setFilterTaskType] = useState<string>('All');
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

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
    const { scopedProjects: projects, scopedProjectIds, isGlobalScope } = useScopedProjects({ pageSize: 9999 });
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
        
        const matchStatus = filterStatus === 'All' || task.Status === filterStatus;
        const matchProject = filterProject === 'All' || task.ProjectID === filterProject;
        
        // Personal filter: assigned to current user
        const matchPersonal = !filterPersonal || task.AssigneeID === currentUser?.EmployeeID;

        // Month filter (checks both StartDate and DueDate)
        const matchMonth = filterMonth === 'All' || (
            (task.DueDate && new Date(task.DueDate).getMonth() + 1 === parseInt(filterMonth)) ||
            (task.StartDate && new Date(task.StartDate).getMonth() + 1 === parseInt(filterMonth))
        );

        // Year filter (checks both StartDate and DueDate)
        const matchYear = filterYear === 'All' || (
            (task.DueDate && new Date(task.DueDate).getFullYear() === parseInt(filterYear)) ||
            (task.StartDate && new Date(task.StartDate).getFullYear() === parseInt(filterYear))
        );

        // Department filter
        const matchDepartment = filterDepartment === 'All' || (() => {
            if (task.DepartmentCode) {
                const taskDeptName = DEPARTMENT_NAMES[task.DepartmentCode as DepartmentCode];
                if (taskDeptName === filterDepartment || task.DepartmentCode === filterDepartment) {
                    return true;
                }
            }
            const assignee = employees.find(e => e.EmployeeID === task.AssigneeID);
            return assignee?.Department === filterDepartment;
        })();

        // Overdue: chưa xong + có hạn + đã quá hạn
        const matchOverdue = !filterOverdue || (
            task.Status !== TaskStatus.Done &&
            !!task.DueDate &&
            new Date(task.DueDate) < new Date()
        );

        // Not updated this week: chưa xong + chưa cập nhật trong tuần
        const matchNotUpdatedThisWeek = !filterNotUpdatedThisWeek || (
            task.Status !== TaskStatus.Done &&
            (!task.UpdatedAt || !isUpdatedThisWeek(task.UpdatedAt))
        );
        
        // Pending proposal filter (Điều 9.3)
        const matchPendingProposal = !filterPendingProposal || (
            task.IsSelfProposed === true &&
            task.ProposalStatus === 'pending'
        );

        // Task type filter
        const matchTaskType = filterTaskType === 'All' || task.TaskType === filterTaskType;

        return matchStatus && matchProject && matchMonth && matchYear && matchDepartment && matchOverdue && matchNotUpdatedThisWeek && matchPersonal && matchTaskType && matchPendingProposal;
    }), [tasks, filterStatus, filterProject, filterMonth, filterYear, filterDepartment, filterOverdue, filterNotUpdatedThisWeek, filterPersonal, filterTaskType, currentUser, scopedProjectIds, isGlobalScope, employees]);

    // Tự động mở slide panel khi có taskId trên URL
    useEffect(() => {
        if (urlTaskId && tasks.length > 0) {
            const task = tasks.find(t => t.TaskID === urlTaskId);
            if (task) {
                openTaskPanel(task);
            }
        }
    }, [urlTaskId, tasks]);

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
    const getProjectName = (id: string, groupTasks?: Task[]): string => {
        // First try to find from tasks metadata directly (safest since tasks are loaded)
        if (groupTasks && groupTasks.length > 0) {
            const taskWithProjName = groupTasks.find(t => t.ProjectName && t.ProjectName.trim() !== '');
            if (taskWithProjName) return taskWithProjName.ProjectName || id;
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
        openPanel({
            title: 'Tạo công việc mới',
            component: (
                <ProjectTaskModal
                    isOpen={true}
                    asSlidePanel={true}
                    onClose={closePanel}
                    onSubmit={handleSave}
                    initialData={{
                        Status: TaskStatus.Todo,
                        Priority: TaskPriority.Medium,
                        ProjectID: projects[0]?.ProjectID || '',
                        AssigneeID: employees[0]?.EmployeeID || '',
                        ProgressPercent: 0,
                    }}
                    allTasks={tasks}
                />
            ),
            width: '50vw',
        });
    };

    const openTaskPanel = (task: Task) => {
        openPanel({
            title: task.Title,
            icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
            url: `/tasks/${task.TaskID}`,
            component: <TaskSlidePanel taskId={task.TaskID} onClose={() => {/* context handles close */}} />,
            width: '50vw',
        });
    };

    const openEditModal = (task: Task) => {
        openPanel({
            title: task.Title,
            url: `/tasks/${task.TaskID}/edit`,
            component: (
                <ProjectTaskModal
                    isOpen={true}
                    asSlidePanel={true}
                    onClose={closePanel}
                    onSubmit={handleSave}
                    initialData={task}
                    allTasks={tasks}
                />
            ),
            width: '50vw',
        });
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
        // Resolve department code
        let deptCode: string | undefined = taskData.DepartmentCode;
        if (!deptCode && filterDepartment && filterDepartment !== 'All') {
            const foundCode = Object.keys(DEPARTMENT_NAMES).find(
                key => DEPARTMENT_NAMES[key as DepartmentCode] === filterDepartment || key === filterDepartment
            );
            if (foundCode) deptCode = foundCode;
        }
        if (!deptCode) {
            deptCode = currentUser?.Department;
        }

        // Re-map UI Task structure to DbTask payload for the service
        const workflowPayload: any = {
            id: taskData.TaskID?.startsWith('NEW_') ? undefined : taskData.TaskID,
            task_type: taskData.ProjectID ? 'project' : 'internal',
            title: taskData.Title,
            progress: taskData.ProgressPercent,
            assignee_id: taskData.AssigneeID,
            department_code: deptCode || null,
            due_date: taskData.DueDate,
            project_id: taskData.ProjectID,
            actual_start_date: taskData.ActualStartDate,
            actual_end_date: taskData.ActualEndDate,
            estimated_cost: taskData.EstimatedCost,
            actual_cost: taskData.ActualCost,
            monthly_plan_item_id: taskData.MonthlyPlanItemID || null,
            metadata: {
                 sub_tasks: taskData.SubTasks,
                 attachments: taskData.Attachments,
                 dependencies: taskData.Dependencies,
                 estimatedDays: taskData.DurationDays,
                 monthly_plan_item_id: taskData.MonthlyPlanItemID || undefined,
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
        closePanel();
    };

    const hasActiveFilters = filterStatus !== 'All' || 
        filterProject !== 'All' || 
        (externalMonth === undefined && filterMonth !== 'All') || 
        (externalYear === undefined && filterYear !== 'All') ||
        filterDepartment !== 'All' || 
        filterTaskType !== 'All' || 
        filterOverdue || 
        filterNotUpdatedThisWeek ||
        filterPersonal ||
        filterPendingProposal;

    // ═══════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════
    return (
        <div className="flex flex-col h-full bg-transparent px-0 pt-1 pb-4 space-y-2 animate-in fade-in duration-500">

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
                filterNotUpdatedThisWeek={filterNotUpdatedThisWeek}
                setFilterNotUpdatedThisWeek={setFilterNotUpdatedThisWeek}
                filterPersonal={filterPersonal}
                setFilterPersonal={setFilterPersonal}
                filterPendingProposal={filterPendingProposal}
                setFilterPendingProposal={setFilterPendingProposal}
                filterTaskType={filterTaskType}
                setFilterTaskType={setFilterTaskType}
                hasActiveFilters={hasActiveFilters}
                projects={projects}
                departments={departments}
                viewMode={viewMode}
                setViewMode={setViewMode}
                openCreateModal={openCreateModal}
                hideMonthFilter={externalMonth !== undefined}
                hideDepartmentFilter={externalDepartment !== undefined}
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
                <div className="overflow-hidden">
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
                    <div className="flex items-center justify-between py-3 border-t border-slate-200 dark:border-slate-750 mt-4">
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

        </div>
    );
};

export default TaskList;