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
import { useSlidePanel } from '../../context/SlidePanelContext';
import { StatCard, EmptyState } from '../../components/ui';
import { SkeletonStatCard } from '../../components/ui/Skeleton';
import {
    Search, Plus, Calendar, User, CheckCircle2, Clock, AlertCircle,
    Trash2, Edit, Briefcase, Layers, ExternalLink, BarChart3, ChevronDown, ChevronUp,
    ListTodo, LayoutGrid, Filter, TrendingUp, Target, AlertTriangle,
    ArrowUpRight, Sparkles, FolderOpen, X, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight
} from 'lucide-react';

// ═══════════════════════════════════════════════════
// Sort / Pagination Types
// ═══════════════════════════════════════════════════
type SortField = 'Title' | 'ProgressPercent' | 'DueDate' | 'Priority' | 'Status';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = {
    [TaskPriority.Urgent]: 0, [TaskPriority.High]: 1, [TaskPriority.Medium]: 2, [TaskPriority.Low]: 3,
};

const STATUS_ORDER: Record<string, number> = {
    [TaskStatus.InProgress]: 0, [TaskStatus.Review]: 1, [TaskStatus.Todo]: 2, [TaskStatus.Done]: 3,
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
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterProject, setFilterProject] = useState<string>('All');
    const [filterOverdue, setFilterOverdue] = useState(false);
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
    const { scopedProjects: projects, scopedProjectIds } = useScopedProjects();
    const { data: employees = [] } = useEmployees();

    // Mutations
    const saveTaskMutation = useSaveTask();
    const updateTaskMutation = useUpdateTask();
    const deleteTaskMutation = useDeleteTask();

    // ── Filter ──
    const filteredTasks = useMemo(() => tasks.filter(task => {
        // First: scope filter — only show tasks for scoped projects
        if (!scopedProjectIds.has(task.ProjectID)) return false;
        const matchSearch = task.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.Description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'All' || task.Status === filterStatus;
        const matchProject = filterProject === 'All' || task.ProjectID === filterProject;
        // Overdue: chưa xong + có hạn + đã quá hạn
        const matchOverdue = !filterOverdue || (
            task.Status !== TaskStatus.Done &&
            !!task.DueDate &&
            new Date(task.DueDate) < new Date()
        );
        return matchSearch && matchStatus && matchProject && matchOverdue;
    }), [tasks, searchTerm, filterStatus, filterProject, filterOverdue, scopedProjectIds]);

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
            overdue: filteredTasks.filter(t => t.Status !== TaskStatus.Done && t.DueDate && new Date(t.DueDate) < now).length,
            review: filteredTasks.filter(t => t.Status === TaskStatus.Review).length,
            completion: filteredTasks.length > 0
                ? Math.round((filteredTasks.filter(t => t.Status === TaskStatus.Done).length / filteredTasks.length) * 100)
                : 0,
        };
    }, [filteredTasks]);

    // ── Helpers ──
    const getProjectName = (id: string) => projects.find(p => p.ProjectID === id)?.ProjectName || id;
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

    const openEditModal = (task: Task) => {
        openPanel({
            title: task.Title,
            icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
            url: `/tasks/${task.TaskID}`,
            component: (
                <ProjectTaskModal
                    isOpen={true}
                    onClose={() => {/* panel close handled by SlidePanelContext */}}
                    onSubmit={handleSave}
                    initialData={{ ...task }}
                    allTasks={tasks}
                    asSlidePanel={true}
                />
            ),
        });
    };

    const handleSave = async (taskData: Partial<Task>) => {
        // Re-map UI Task structure to DbTask payload for the service
        const workflowPayload: any = {
            id: taskData.TaskID?.startsWith('NEW_') ? undefined : taskData.TaskID,
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
            workflowPayload.status = taskData.Status; // Enum value matches exactly with DbTaskStatus
        }

        await saveTaskMutation.mutateAsync(workflowPayload);
        setIsModalOpen(false);
    };

    const hasActiveFilters = filterStatus !== 'All' || filterProject !== 'All' || searchTerm !== '' || filterOverdue;

    // ═══════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════
    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ══════════ STATS DASHBOARD ══════════ */}
            {tasksError ? (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Không tải được danh sách công việc: {(tasksError as Error).message}</span>
                </div>
            ) : isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonStatCard key={i} className={i === 0 ? 'col-span-2 lg:col-span-1' : ''} />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Total */}
                    <div className="col-span-2 lg:col-span-1">
                        <StatCard
                            label="Tổng công việc"
                            value={stats.total}
                            icon={<Target className="w-5 h-5 flex-shrink-0" />}
                            color="blue"
                            progressPercentage={stats.completion}
                            progressLabel="HOÀN THÀNH"
                        />
                    </div>

                    {/* In Progress */}
                    <StatCard
                        label="Đang thực hiện"
                        value={stats.inProgress}
                        icon={<TrendingUp className="w-5 h-5 flex-shrink-0" />}
                        color="amber"
                        onClick={() => setFilterStatus(filterStatus === TaskStatus.InProgress ? 'All' : TaskStatus.InProgress)}
                    />

                    {/* Review */}
                    <StatCard
                        label="Chờ duyệt"
                        value={stats.review}
                        icon={<AlertCircle className="w-5 h-5 flex-shrink-0" />}
                        color="violet"
                        onClick={() => setFilterStatus(filterStatus === TaskStatus.Review ? 'All' : TaskStatus.Review)}
                    />

                    {/* Done */}
                    <StatCard
                        label="Hoàn thành"
                        value={stats.done}
                        icon={<CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                        color="emerald"
                        onClick={() => setFilterStatus(filterStatus === TaskStatus.Done ? 'All' : TaskStatus.Done)}
                    />

                    {/* Overdue */}
                    <StatCard
                        label={
                            <div className="flex items-center gap-1.5">
                                Quá hạn
                                {stats.overdue > 0 && (
                                    <span className="flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                    </span>
                                )}
                            </div>
                        }
                        value={stats.overdue}
                        icon={<AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                        color="rose"
                        onClick={() => {
                            // Toggle filter quá hạn; reset status filter
                            setFilterOverdue(v => !v);
                            if (!filterOverdue) setFilterStatus('All');
                        }}
                    />
                </div>
            )}

            {/* ══════════ TOOLBAR ══════════ */}
            <div className="toolbar">
                <div className="p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Left: Search + Filters */}
                    <div className="flex items-center gap-3 flex-wrap flex-1 w-full lg:w-auto">
                        <div className="relative flex-1 min-w-[240px] max-w-[360px]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm công việc..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="filter-input"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                            <select
                                value={filterProject}
                                onChange={(e) => setFilterProject(e.target.value)}
                                className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer transition-all max-w-[220px]"
                            >
                                <option value="All">Tất cả dự án</option>
                                {projects.map(p => (
                                    <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName.substring(0, 28)}...</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer transition-all"
                            >
                                <option value="All">Tất cả trạng thái</option>
                                <option value={TaskStatus.Todo}>Cần làm</option>
                                <option value={TaskStatus.InProgress}>Đang thực hiện</option>
                                <option value={TaskStatus.Review}>Chờ duyệt</option>
                                <option value={TaskStatus.Done}>Hoàn thành</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                        </div>

                        {hasActiveFilters && (
                            <button
                                onClick={() => { setSearchTerm(''); setFilterStatus('All'); setFilterProject('All'); setFilterOverdue(false); }}
                                className="text-xs text-slate-500 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                        {filterOverdue && (
                            <span className="inline-flex items-center gap-1 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                Quá hạn
                                <button onClick={() => setFilterOverdue(false)} className="ml-1 hover:text-rose-800">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                    </div>

                    {/* Right: View toggle + Create */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#FCF9F2] dark:bg-slate-600 shadow-lg text-slate-700 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <ListTodo className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('board')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-[#FCF9F2] dark:bg-slate-600 shadow-lg text-slate-700 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>

                        <PermissionGate resource="tasks" action="create">
                            <button
                                onClick={openCreateModal}
                                className="btn btn-primary"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Tạo công việc</span>
                            </button>
                        </PermissionGate>
                    </div>
                </div>
            </div>

            {/* ══════════ BATCH BAR ══════════ */}
            {selectedIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl animate-in fade-in duration-200">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {selectedIds.size} công việc được chọn
                    </span>
                    <div className="flex items-center gap-2">
                        <select
                            onChange={(e) => { if (e.target.value) handleBatchStatus(e.target.value as TaskStatus); e.target.value = ''; }}
                            className="text-xs px-3 py-1.5 bg-[#FCF9F2] dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 cursor-pointer"
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
                <div className="bg-[#FCF9F2] dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="h-10 bg-[#F5EFE6] dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700" />
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
                    {Object.keys(tasksByProject).length > 0 ? (
                        <div className="bg-[#FCF9F2] dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#F5EFE6] dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest">
                                        <th className="px-3 py-3 w-10 border-b border-slate-200 dark:border-slate-800 text-center">
                                            <input
                                                type="checkbox"
                                                checked={paginatedTasks.length > 0 && selectedIds.size === paginatedTasks.length}
                                                onChange={toggleSelectAll}
                                                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left w-12 border-b border-slate-200 dark:border-slate-800"></th>
                                        <th onClick={() => handleSort('Title')} className="group/th px-4 py-3 text-left w-[35%] min-w-[250px] cursor-pointer select-none hover:text-blue-600 transition-colors border-b border-slate-200 dark:border-slate-800">
                                            <span className="flex items-center gap-1">Công việc <SortIcon field="Title" /></span>
                                        </th>
                                        <th className="px-4 py-3 text-left hidden md:table-cell w-[20%] min-w-[150px] border-b border-slate-200 dark:border-slate-800">Bước thực hiện</th>
                                        <th onClick={() => handleSort('ProgressPercent')} className="group/th px-4 py-3 text-center w-24 cursor-pointer select-none hover:text-blue-600 transition-colors border-b border-slate-200 dark:border-slate-800">
                                            <span className="flex items-center justify-center gap-1">Tiến độ <SortIcon field="ProgressPercent" /></span>
                                        </th>
                                        <th className="px-4 py-3 text-left hidden lg:table-cell w-[15%] min-w-[140px] border-b border-slate-200 dark:border-slate-800">Phụ trách</th>
                                        <th onClick={() => handleSort('DueDate')} className="group/th px-4 py-3 text-left hidden sm:table-cell w-28 cursor-pointer select-none hover:text-blue-600 transition-colors border-b border-slate-200 dark:border-slate-800">
                                            <span className="flex items-center gap-1">Hạn chót <SortIcon field="DueDate" /></span>
                                        </th>
                                        <th onClick={() => handleSort('Priority')} className="group/th px-4 py-3 text-center w-24 cursor-pointer select-none hover:text-blue-600 transition-colors border-b border-slate-200 dark:border-slate-800">
                                            <span className="flex items-center justify-center gap-1">Ưu tiên <SortIcon field="Priority" /></span>
                                        </th>
                                        <th className="px-4 py-3 w-20 border-b border-slate-200 dark:border-slate-800"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {Object.entries(tasksByProject).map(([projectId, projectTasks]: [string, Task[]]) => (
                                        <React.Fragment key={projectId}>
                                            {/* ── Project Group Separator ── */}
                                            <tr className="bg-slate-50/80 dark:bg-slate-700 border-t-2 border-slate-200 dark:border-slate-600">
                                                <td colSpan={10} className="px-4 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 rounded-lg shadow-lg" >
                                                            <Briefcase className="w-3.5 h-3.5 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{getProjectName(projectId)}</h3>
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500">{projectTasks.length} công việc</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/projects/${projectId}`, { state: { activeTab: 'plan' } }); }}
                                                            className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            Xem kế hoạch
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* ── Tasks for this project ── */}
                                            {projectTasks.map(task => {
                                                const assignee = getAssignee(task.AssigneeID);
                                                const priorityInfo = getPriorityInfo(task.Priority);
                                                const statusInfo = getStatusInfo(task.Status);
                                                const progress = task.ProgressPercent || (task.Status === TaskStatus.Done ? 100 : 0);
                                                const stepLabel = getTimelineStepLabel(task.TimelineStep);
                                                const phaseColor = getPhaseColor(task.TimelineStep);
                                                const isOverdue = task.Status !== TaskStatus.Done && task.DueDate && new Date(task.DueDate) < new Date();

                                                return (
                                                    <tr
                                                        key={task.TaskID}
                                                        onClick={() => openEditModal(task)}
                                                        className={`group cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-slate-700 ${isOverdue ? 'bg-red-50/40 dark:bg-red-900/10' : ''} ${selectedIds.has(task.TaskID) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                                    >
                                                        {/* Checkbox */}
                                                        <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.has(task.TaskID)}
                                                                onChange={() => toggleSelect(task.TaskID)}
                                                                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                                                            />
                                                        </td>
                                                        {/* Status */}
                                                        <td className="px-4 py-3.5">
                                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${statusInfo.bg}/10 ${statusInfo.color}`}>
                                                                {statusInfo.icon}
                                                            </div>
                                                        </td>

                                                        {/* Title + Description */}
                                                        <td className="px-4 py-3.5 pr-8">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <h4 className={`text-sm font-semibold group-hover:text-blue-600 transition-colors line-clamp-1 ${task.Status === TaskStatus.Done ? 'text-slate-400' : isOverdue ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'
                                                                    }`}>
                                                                    {task.Title}
                                                                </h4>
                                                                {task.IsCritical && (
                                                                    <span className="shrink-0 text-[8px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded-md uppercase">Găng</span>
                                                                )}
                                                            </div>
                                                            {task.Description && (
                                                                <p className="text-xs text-slate-400 line-clamp-1 pr-4">{task.Description}</p>
                                                            )}
                                                        </td>

                                                        {/* TimelineStep */}
                                                        <td className="px-4 py-3.5 hidden md:table-cell">
                                                            {task.TimelineStep ? (
                                                                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg ${phaseColor.bg} ${phaseColor.text} ring-1 ${phaseColor.border}`}>
                                                                    <Layers className="w-3 shrink-0 h-3" />
                                                                    <span className="line-clamp-1">{stepLabel}</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-300">—</span>
                                                            )}
                                                        </td>

                                                        {/* Progress */}
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(progress)} transition-all duration-500`}
                                                                        style={{ width: `${progress}%` }}
                                                                    />
                                                                </div>
                                                                <span className={`text-[10px] font-bold tabular-nums w-7 text-right ${progress >= 100 ? 'text-emerald-600' : progress >= 70 ? 'text-blue-600' : 'text-slate-400'
                                                                    }`}>{progress}%</span>
                                                            </div>
                                                        </td>

                                                        {/* Assignee */}
                                                        <td className="px-4 py-3.5 hidden lg:table-cell">
                                                            {assignee ? (
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="relative">
                                                                        <img
                                                                            src={assignee.AvatarUrl || `https://ui-avatars.com/api/?name=${assignee.FullName}&background=6366f1&color=fff&size=32`}
                                                                            alt=""
                                                                            className="w-7 h-7 rounded-full ring-2 ring-white shadow-lg object-cover"
                                                                        />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{assignee.FullName}</p>
                                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{assignee.Position || assignee.Department}</p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-300 italic">Chưa gán</span>
                                                            )}
                                                        </td>

                                                        {/* Due */}
                                                        <td className="px-4 py-3.5 hidden sm:table-cell">
                                                            {task.DueDate ? (
                                                                <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                                                                    <Calendar className="w-3 h-3 shrink-0" />
                                                                    {new Date(task.DueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                    {isOverdue && <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-300">—</span>
                                                            )}
                                                        </td>

                                                        {/* Priority */}
                                                        <td className="px-4 py-3.5 text-center">
                                                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md ${priorityInfo.color}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`} />
                                                                {priorityInfo.label}
                                                            </span>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-all">
                                                                <PermissionGate resource="tasks" action="update">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                                                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                                                        title="Chỉnh sửa"
                                                                    >
                                                                        <Edit className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </PermissionGate>
                                                                <PermissionGate resource="tasks" action="delete">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleDelete(task.TaskID); }}
                                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                                                        title="Xóa"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </PermissionGate>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState
                            icon={<Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-500" />}
                            title="Không tìm thấy công việc nào."
                            description="Thử thay đổi bộ lọc hoặc tạo công việc mới."
                            actionLabel="Tạo công việc"
                            onAction={openCreateModal}
                            className="bg-[#FCF9F2] dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
                        />
                    )}
                </div>

                {/* ══════════ PAGINATION ══════════ */}
                {sortedTasks.length > pageSize && (
                    <div className="flex items-center justify-between px-4 py-3 bg-[#FCF9F2] dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                Hiển thị {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sortedTasks.length)} / {sortedTasks.length}
                            </span>
                            <select
                                value={pageSize}
                                onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
                                className="text-xs px-2 py-1 bg-[#F5EFE6] dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer"
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.Review, TaskStatus.Done].map(status => {
                        const statusInfo = getStatusInfo(status);
                        const statusTasks = filteredTasks.filter(t => t.Status === status);
                        return (
                            <div key={status} className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <div className={`w-2 h-2 rounded-full ${statusInfo.bg}`} />
                                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{statusInfo.label}</h4>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full font-bold">{statusTasks.length}</span>
                                </div>
                                <div className="space-y-2 min-h-[200px]">
                                    {statusTasks.map(task => {
                                        const assignee = getAssignee(task.AssigneeID);
                                        const priorityInfo = getPriorityInfo(task.Priority);
                                        const progress = task.ProgressPercent || (task.Status === TaskStatus.Done ? 100 : 0);
                                        const isOverdue = task.Status !== TaskStatus.Done && task.DueDate && new Date(task.DueDate) < new Date();

                                        return (
                                            <div
                                                key={task.TaskID}
                                                onClick={() => openEditModal(task)}
                                                className={`bg-[#FCF9F2] dark:bg-slate-800 rounded-xl border p-4 cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all group ${isOverdue ? 'border-red-200 bg-red-50/30 dark:bg-red-900/10 dark:border-red-900/30' : 'border-slate-100 dark:border-slate-700'}`}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h4 className={`text-sm font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors ${task.Status === TaskStatus.Done ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'
                                                        }`}>{task.Title}</h4>
                                                    <span className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${priorityInfo.dot}`} />
                                                </div>

                                                {/* Progress */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(progress)} transition-all`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">{progress}%</span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    {assignee ? (
                                                        <img
                                                            src={assignee.AvatarUrl || `https://ui-avatars.com/api/?name=${assignee.FullName}&background=6366f1&color=fff&size=24`}
                                                            alt=""
                                                            className="w-6 h-6 rounded-full ring-2 ring-white shadow-lg"
                                                        />
                                                    ) : <div className="w-6" />}
                                                    {task.DueDate && (
                                                        <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(task.DueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {statusTasks.length === 0 && (
                                        <div className="text-center py-8 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl text-xs text-slate-300 dark:text-slate-500">
                                            Không có công việc
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
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