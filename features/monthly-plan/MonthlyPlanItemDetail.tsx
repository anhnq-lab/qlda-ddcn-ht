import React, { useState, useEffect } from 'react';
import {
    X, Edit2, Trash2, Link2, Briefcase, Users, ClipboardList,
    Calendar, CheckCircle2, XCircle, Clock, AlertCircle, ArrowRight,
    Plus, ExternalLink, Play, Eye, Target, CalendarDays, CheckSquare, MessageSquare, History, BarChart3, Building2, FolderOpen, ChevronRight
} from 'lucide-react';
import { MonthlyPlanItem, MONTHLY_STATUS_LABELS, MonthlyTaskStatus } from '../../types/plan.types';
import { useTasksByMonthlyPlanItem } from '../../hooks/usePlanData';
import { supabase as _supabase } from '../../lib/supabase';
const supabase = _supabase as any;
import { useSlidePanel } from "../../context/SlidePanelContext";
import { TaskSlidePanel } from '../tasks/components/TaskSlidePanel';

// ─── Status config ────────────────────────────────────────────
const STATUS_CONFIG: Record<MonthlyTaskStatus, { label: string; icon: React.ReactNode; color: string; bg: string; ring: string }> = {
    planned:    { label: 'Chưa báo cáo', icon: <Clock className="w-3.5 h-3.5" />,        color: 'text-slate-600',  bg: 'bg-slate-100',  ring: 'ring-slate-300/20' },
    completed:  { label: 'Hoàn thành',   icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-500/20' },
    incomplete: { label: 'Chưa HT',      icon: <XCircle className="w-3.5 h-3.5" />,      color: 'text-red-600',    bg: 'bg-red-50',     ring: 'ring-red-500/20' },
    partial:    { label: 'Một phần',     icon: <AlertCircle className="w-3.5 h-3.5" />,  color: 'text-amber-600',  bg: 'bg-amber-50',   ring: 'ring-amber-500/20' },
    deferred:   { label: 'Chuyển tháng', icon: <ArrowRight className="w-3.5 h-3.5" />,   color: 'text-blue-600',   bg: 'bg-blue-50',    ring: 'ring-blue-500/20' },
};

const TASK_STATUS_COLOR: Record<string, string> = {
    todo: 'bg-slate-100 text-slate-600 ring-1 ring-slate-300/20',
    in_progress: 'bg-blue-50 text-blue-600 ring-1 ring-blue-500/20',
    review: 'bg-amber-50 text-amber-600 ring-1 ring-amber-500/20',
    done: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20',
};
const TASK_STATUS_LABEL: Record<string, string> = {
    todo: 'Công việc mới',
    in_progress: 'Đang làm',
    review: 'Chờ duyệt',
    done: 'Hoàn thành',
};

interface Props {
    item: MonthlyPlanItem;
    month: number;
    year: number;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
    onAddTask: (monthlyPlanItemId: string) => void;
}

const MonthlyPlanItemDetail: React.FC<Props> = (props) => {
    const { item, month, year, onEdit, onDelete, onClose, onAddTask } = props;
    const cfg = STATUS_CONFIG[item.status];
    const { tasks, loading: tasksLoading } = useTasksByMonthlyPlanItem(item.id);
    const [annualItem, setAnnualItem] = useState<any>(null);
    const [project, setProject] = useState<any>(null);
    const { openPanel } = useSlidePanel();

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

    const tasksDone = tasks.filter(t => t.Status === 'done').length;
    const tasksProgress = tasks.length > 0 ? Math.round((tasksDone / tasks.length) * 100) : 0;

    const handleDelete = () => {
        if (!confirm('Xóa nhiệm vụ này? Thao tác không thể hoàn tác.')) return;
        onDelete();
    };

    const handleOpenTask = (taskId: string) => {
        // Open task panel and provide a way to go back to this monthly plan item
        openPanel(
            <TaskSlidePanel
                taskId={taskId}
                onClose={() => openPanel(<MonthlyPlanItemDetail {...props} />)}
            />
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 animate-in fade-in duration-300">
            {/* Header Toolbar */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm shrink-0">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-indigo-500" />
                    Chi tiết Kế hoạch tháng
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onEdit}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
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
                    <div className={`h-1 ${cfg.bg.replace('bg-', 'bg-').replace('50', '500')}`} />
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
                                            <span className="flex items-center gap-1.5 bg-violet-50 text-violet-700 px-2 py-1 rounded-md text-xs font-medium">
                                                <FolderOpen className="w-3.5 h-3.5" />
                                                {project.ProjectName}
                                            </span>
                                        )}
                                        {annualItem && (
                                            <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                                                <Link2 className="w-3.5 h-3.5" />
                                                KH Khung năm {year}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar for subtasks */}
                        {tasks.length > 0 && (
                            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <BarChart3 className="w-3.5 h-3.5" /> Tiến độ công việc con
                                    </span>
                                    <span className={`text-sm font-black ${tasksProgress >= 100 ? 'text-emerald-600' : tasksProgress >= 70 ? 'text-blue-600' : 'text-slate-600'}`}>
                                        {tasksProgress}%
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${
                                            tasksProgress >= 100 ? 'bg-emerald-500' : tasksProgress >= 70 ? 'bg-blue-500' : 'bg-indigo-400'
                                        }`}
                                        style={{ width: `${tasksProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
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
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100">
                                        <p className="text-xs font-bold text-slate-500 mb-1">Ghi chú</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{item.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Task List */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4" /> Danh sách công việc
                                </h3>
                                <button
                                    onClick={() => onAddTask(item.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Thêm
                                </button>
                            </div>

                            {tasksLoading ? (
                                <p className="text-xs text-slate-400 text-center py-4">Đang tải...</p>
                            ) : tasks.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50/50">
                                    <p className="text-sm text-slate-500 font-medium mb-1">Chưa có công việc con nào</p>
                                    <p className="text-xs text-slate-400 mb-3">Thêm các công việc để theo dõi chi tiết quá trình thực hiện nhiệm vụ này.</p>
                                    <button
                                        onClick={() => onAddTask(item.id)}
                                        className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
                                    >
                                        Thêm công việc đầu tiên
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {tasks.map((task: any) => (
                                        <button
                                            key={task.TaskID}
                                            onClick={() => handleOpenTask(task.TaskID)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate transition-colors ${task.Status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400'}`}>
                                                    {task.Title}
                                                </p>
                                                {task.DueDate && (
                                                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(task.DueDate).toLocaleDateString('vi-VN')}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0 ${TASK_STATUS_COLOR[task.Status] ?? 'bg-slate-100 text-slate-500'}`}>
                                                {TASK_STATUS_LABEL[task.Status] ?? task.Status}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT 1/3 ── */}
                    <div className="space-y-6">
                        
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

                        {/* People */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Phân công
                            </h3>
                            <div className="space-y-4">
                                {item.staff_name && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                                            <span className="text-xs font-bold text-indigo-600">{item.staff_name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{item.staff_name}</p>
                                            <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Phụ trách</p>
                                        </div>
                                    </div>
                                )}
                                {item.dept_head_name && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                                            <span className="text-xs font-bold text-amber-600">{item.dept_head_name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{item.dept_head_name}</p>
                                            <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Lãnh đạo phòng</p>
                                        </div>
                                    </div>
                                )}
                                {item.ban_head_name && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                                            <span className="text-xs font-bold text-rose-600">{item.ban_head_name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{item.ban_head_name}</p>
                                            <p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Lãnh đạo Ban</p>
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
        </div>
    );
};

export default MonthlyPlanItemDetail;
