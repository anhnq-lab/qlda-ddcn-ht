import React, { useState, useEffect, useMemo } from 'react';
import {
    X, Edit2, Trash2, Link2, Briefcase, Users, User, ClipboardList,
    Calendar, CheckCircle2, XCircle, Clock, AlertCircle, ArrowRight,
    Plus, ExternalLink, Play, Eye, Target, CalendarDays, CheckSquare, MessageSquare, History, BarChart3, Building2, FolderOpen, ChevronRight, Circle
} from 'lucide-react';
import { MonthlyPlanItem, MONTHLY_STATUS_LABELS, MonthlyTaskStatus, DEPARTMENT_NAMES, DepartmentCode } from '../../types/plan.types';
import { useSlidePanel } from "../../context/SlidePanelContext";
import { supabaseExt as supabase } from '../../lib/supabase';
import { StatusBadge, BadgeVariant } from '../../components/ui';
import { Task } from '../../types';
import { ProjectTaskModal } from '../projects/components/ProjectTaskModal';
import { TaskService } from '../../services/TaskService';
import { workflowTaskToTask, taskToDbTask } from '../../lib/mappers/workflowTaskMappers';
import { useEmployees } from '../../hooks/useEmployees';

// ─── Status config ────────────────────────────────────────────
const STATUS_CONFIG: Record<MonthlyTaskStatus, { label: string; icon: React.ReactNode; variant: BadgeVariant; topBar: string; bg: string; color: string; ring: string }> = {
    planned:    { label: 'Chưa báo cáo', icon: <Clock className="w-3.5 h-3.5" />,        variant: 'neutral', topBar: 'bg-slate-500',    bg: 'bg-slate-50 dark:bg-slate-500/10',    color: 'text-slate-700 dark:text-slate-400',    ring: 'ring-slate-600/10 dark:ring-slate-500/20' },
    completed:  { label: 'Hoàn thành',   icon: <CheckCircle2 className="w-3.5 h-3.5" />, variant: 'success', topBar: 'bg-emerald-500',  bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-600/10 dark:ring-emerald-500/20' },
    incomplete: { label: 'Chưa HT',      icon: <XCircle className="w-3.5 h-3.5" />,      variant: 'danger',  topBar: 'bg-red-500',      bg: 'bg-rose-50 dark:bg-rose-500/10',       color: 'text-rose-700 dark:text-rose-400',       ring: 'ring-rose-600/10 dark:ring-rose-500/20' },
    partial:    { label: 'Một phần',     icon: <AlertCircle className="w-3.5 h-3.5" />,  variant: 'warning', topBar: 'bg-warning-500',  bg: 'bg-amber-50 dark:bg-amber-500/10',    color: 'text-amber-700 dark:text-amber-400',    ring: 'ring-amber-600/10 dark:ring-amber-500/20' },
    deferred:   { label: 'Chuyển tháng', icon: <ArrowRight className="w-3.5 h-3.5" />,   variant: 'info',    topBar: 'bg-blue-500',     bg: 'bg-sky-50 dark:bg-sky-500/10',        color: 'text-sky-700 dark:text-sky-400',        ring: 'ring-sky-600/10 dark:ring-sky-500/20' },
};



interface Props {
    item: MonthlyPlanItem;
    month: number;
    year: number;
    departmentCode?: DepartmentCode;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
}

const MonthlyPlanItemDetail: React.FC<Props> = (props) => {
    const { item, month, year, departmentCode, onEdit, onDelete, onClose } = props;
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG['planned'];
    const [annualItem, setAnnualItem] = useState<any>(null);
    const [project, setProject] = useState<any>(null);
    const { openPanel } = useSlidePanel();

    const [tasks, setTasks] = useState<any[]>([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const { data: employees = [] } = useEmployees();

    const getAssigneeName = (assigneeId: string) => {
        if (!assigneeId) return 'Chưa phân công';
        const emp = employees.find(e => e.EmployeeID === assigneeId);
        return emp ? emp.FullName : 'Không xác định';
    };

    const loadTasks = async () => {
        setTasksLoading(true);
        try {
            const conditions = [`monthly_plan_item_id.eq.${item.id}`, `metadata->>monthly_plan_item_id.eq.${item.id}`];
            if (item.source_subtask_id) {
                conditions.push(`id.eq.${item.source_subtask_id}`);
            }
            
            const { data, error } = await supabase
                .from('tasks')
                .select('id, title, status, priority, progress, assignee_id, due_date')
                .or(conditions.join(','));
            if (error) throw error;
            setTasks(data || []);
        } catch (err) {
            console.error('Error fetching execution tasks:', err);
        } finally {
            setTasksLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [item.id, item.source_subtask_id]);

    const averageProgress = useMemo(() => {
        if (tasks.length === 0) return 0;
        const total = tasks.reduce((sum, t) => sum + (t.progress || 0), 0);
        return Math.round(total / tasks.length);
    }, [tasks]);

    const handleEditTask = async (taskId: string) => {
        try {
            const dbTask = await TaskService.getTaskById(taskId);
            if (dbTask) {
                const uiTask = workflowTaskToTask(dbTask, item.project_id);
                setSelectedTask(uiTask);
                setIsTaskModalOpen(true);
            }
        } catch (err) {
            console.error('Error fetching task details:', err);
        }
    };

    const handleSaveTask = async (taskData: Partial<Task>) => {
        try {
            const dbTaskData = taskToDbTask(taskData, item.project_id);
            dbTaskData.monthly_plan_item_id = item.id;
            if (dbTaskData.metadata) {
                dbTaskData.metadata.monthly_plan_item_id = item.id;
            } else {
                dbTaskData.metadata = { monthly_plan_item_id: item.id };
            }
            await TaskService.saveTask(dbTaskData);
            setIsTaskModalOpen(false);
            setSelectedTask(null);
            loadTasks();
        } catch (err) {
            console.error('Error saving task:', err);
        }
    };

    useEffect(() => {
        if (!item.annual_plan_item_id) { setAnnualItem(null); return; }
        supabase
            .from('annual_plan_items')
            .select('id, task_name, group_name, frequency, responsible_text')
            .eq('id', item.annual_plan_item_id)
            .single()
            .then(({ data }: any) => setAnnualItem(data));
    }, [item.annual_plan_item_id]);

    useEffect(() => {
        if (!item.project_id) { setProject(null); return; }
        supabase
            .from('projects')
            .select('"ProjectID", "ProjectName", "ProjectCode"')
            .eq('"ProjectID"', item.project_id)
            .maybeSingle()
            .then(({ data }: any) => setProject(data));
    }, [item.project_id]);

    const handleDelete = () => {
        if (!confirm('Xóa nhiệm vụ này? Thao tác không thể hoàn tác.')) return;
        onDelete();
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-800 animate-in fade-in duration-300">
            {/* Header Toolbar */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm shrink-0">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary-500" />
                    Chi tiết Kế hoạch tháng
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onEdit}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                        title="Sửa"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Xóa"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative">
                
                {/* ══════════ HEADER CARD ══════════ */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className={`h-1 ${cfg.topBar}`} />
                    <div className="p-4">
                        <div className="flex flex-col lg:flex-row justify-between gap-5">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.color} ring-1 ${cfg.ring}`}>
                                        {cfg.icon} {MONTHLY_STATUS_LABELS[item.status]}
                                    </span>
                                    {item.group_name && (
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1.5 rounded-md">
                                            {item.group_name}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1.5 rounded-md">
                                        Tháng {month}/{year}
                                    </span>
                                </div>

                                <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight mb-2">
                                    {item.task_name}
                                </h1>

                                {(project || annualItem) && (
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-3">
                                        {project && (
                                            <span className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 px-2 py-1 rounded-md text-xs font-medium border border-violet-100 dark:border-violet-500/20">
                                                <FolderOpen className="w-3.5 h-3.5" />
                                                {project.ProjectName}
                                            </span>
                                        )}
                                        {annualItem && (
                                            <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md text-xs font-medium border border-blue-100 dark:border-blue-500/20">
                                                <Link2 className="w-3.5 h-3.5" />
                                                KH Khung năm {year}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════ CONTENT GRID ══════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ── LEFT 2/3 ── */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Description */}
                        {(item.deliverable || item.notes) && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                                <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4" /> Nội dung chi tiết
                                </h3>
                                
                                {item.deliverable && (
                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-slate-500 mb-1">Kết quả đầu ra</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{item.deliverable}</p>
                                    </div>
                                )}
                                
                                {item.notes && (
                                    <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                                        <p className="text-xs font-bold text-slate-500 mb-1">Ghi chú</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{item.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Linked Execution Tasks */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                                <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4" />
                                    Công việc thực tế ({tasks.length})
                                </h3>
                                {item.project_id && (
                                    <button
                                        onClick={() => setIsTaskModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-400 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Tạo công việc
                                    </button>
                                )}
                            </div>

                            {tasksLoading ? (
                                <div className="flex justify-center items-center py-6 text-slate-400 text-xs">
                                    Đang tải công việc...
                                </div>
                            ) : tasks.length === 0 ? (
                                <div className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                                    <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="text-xs text-slate-500">Chưa có công việc thực tế nào được liên kết.</p>
                                    {item.project_id ? (
                                        <button
                                            onClick={() => setIsTaskModalOpen(true)}
                                            className="text-xs text-primary-600 font-bold hover:underline cursor-pointer"
                                        >
                                            Tạo công việc đầu tiên
                                        </button>
                                    ) : (
                                        <p className="text-[10px] text-slate-400">Vui lòng liên kết nhiệm vụ này với một dự án để tạo công việc.</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Summary Progress Bar */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 space-y-2 border border-slate-100 dark:border-slate-700">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-medium text-slate-600 dark:text-slate-400">Tiến độ thực tế trung bình</span>
                                            <span className="font-bold text-primary-600 dark:text-primary-400">{averageProgress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-primary-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${averageProgress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Task Card List */}
                                    <div className="space-y-2">
                                        {tasks.map((task) => {
                                            const isDone = task.status === 'done' || task.status === 'completed';
                                            const isInProgress = task.status === 'in_progress';
                                            const isReview = task.status === 'review';
                                            
                                            let statusColor = 'text-slate-400 bg-slate-100 dark:bg-slate-800';
                                            let statusIcon = <Circle className="w-4 h-4 text-slate-400" />;
                                            if (isDone) {
                                                statusColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30';
                                                statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                                            } else if (isInProgress) {
                                                statusColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/30';
                                                statusIcon = <Clock className="w-4 h-4 text-amber-500" />;
                                            } else if (isReview) {
                                                statusColor = 'text-blue-600 bg-blue-50 dark:bg-blue-950/30';
                                                statusIcon = <Eye className="w-4 h-4 text-blue-500" />;
                                            }

                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={() => handleEditTask(task.id)}
                                                    className="group flex flex-col md:flex-row md:items-center justify-between p-3.5 bg-slate-50 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-850 rounded-xl border border-slate-100 hover:border-slate-200 dark:border-slate-700/80 dark:hover:border-slate-600/80 shadow-none hover:shadow-sm transition-all duration-200 cursor-pointer gap-3 md:gap-0"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 md:w-1/2">
                                                        <div className={`p-1.5 rounded-lg shrink-0 ${statusColor}`}>
                                                            {statusIcon}
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate transition-colors">
                                                            {task.title}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                                                        <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-700 px-2 py-1 rounded-md">
                                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>{getAssigneeName(task.assignee_id)}</span>
                                                        </div>
                                                        
                                                        {task.due_date && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                                <span>{new Date(task.due_date).toLocaleDateString('vi-VN')}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                                                <div
                                                                    className="bg-primary-500 h-full rounded-full"
                                                                    style={{ width: `${task.progress || 0}%` }}
                                                                />
                                                            </div>
                                                            <span className="font-bold text-slate-600 dark:text-slate-300 w-8 text-right">{task.progress || 0}%</span>
                                                        </div>

                                                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT 1/3 ── */}
                    <div className="space-y-6">

                        {/* Nguồn gốc & Liên kết */}
                        {(project || annualItem) && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Link2 className="w-4 h-4" /> Nguồn gốc & Liên kết
                                </h3>
                                <div className="space-y-4">
                                    {project && (
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-violet-500 tracking-wider mb-1">Thuộc dự án</p>
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <FolderOpen className="w-4 h-4 text-violet-400 shrink-0" />
                                                {project.ProjectName}
                                            </div>
                                        </div>
                                    )}
                                    {annualItem && (
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-blue-500 tracking-wider mb-1">Kế hoạch khung năm {year}</p>
                                            <div className="flex items-start gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <Target className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                                <span>{annualItem.task_name}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Timeline / Deadlines */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Thời gian
                            </h3>
                            <div className="space-y-4">
                                {item.deadline_note && (
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Thời hạn</p>
                                        <p className="text-sm font-medium text-slate-700">{item.deadline_note}</p>
                                    </div>
                                )}
                                {item.due_date && (
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Ngày cụ thể</p>
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            {new Date(item.due_date).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Đơn vị thực hiện */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Đơn vị thực hiện
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-900/50">
                                        <Building2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            {departmentCode ? `${departmentCode} - ${DEPARTMENT_NAMES[departmentCode] ?? ''}` : 'Chưa xác định'}
                                        </p>
                                        <p className="text-[10px] uppercase font-bold text-primary-500 tracking-wider">Đơn vị chủ trì</p>
                                    </div>
                                </div>

                                {((item.collaborating_dept_codes && item.collaborating_dept_codes.length > 0) || item.collaborating_text) && (
                                    <div className="flex items-start gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                                            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 space-y-1">
                                                {item.collaborating_dept_codes?.map(code => (
                                                    <div key={code} className="text-xs">
                                                        • {code} - {DEPARTMENT_NAMES[code as DepartmentCode] ?? ''}
                                                    </div>
                                                ))}
                                                {item.collaborating_text && (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                                                        {item.collaborating_text}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider mt-1">Đơn vị phối hợp</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Report Results */}
                        {(item.completion_result || item.incomplete_reason) && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> Báo cáo
                                </h3>
                                <div className="space-y-3">
                                    {item.completion_result && (
                                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                                            <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-1">Kết quả thực hiện</p>
                                            <p className="text-sm text-emerald-800">{item.completion_result}</p>
                                        </div>
                                    )}
                                    {item.incomplete_reason && (
                                        <div className="bg-red-50/50 border border-red-100 rounded-xl p-3">
                                            <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider mb-1">Lý do chậm trễ</p>
                                            <p className="text-sm text-red-800">{item.incomplete_reason}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isTaskModalOpen && (
                <ProjectTaskModal
                    isOpen={isTaskModalOpen}
                    onClose={() => {
                        setIsTaskModalOpen(false);
                        setSelectedTask(null);
                        loadTasks();
                    }}
                    onSubmit={handleSaveTask}
                    initialData={selectedTask || {
                        ProjectID: item.project_id,
                        MonthlyPlanItemID: item.id,
                        Title: item.task_name,
                        Description: item.deliverable,
                        DueDate: item.due_date
                    }}
                />
            )}
        </div>
    );
};

export default MonthlyPlanItemDetail;



