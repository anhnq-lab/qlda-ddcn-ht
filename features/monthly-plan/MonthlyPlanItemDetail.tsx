import React, { useState, useEffect } from 'react';
import {
    X, Edit2, Trash2, Link2, Briefcase, Users, ClipboardList,
    Calendar, CheckCircle2, XCircle, Clock, AlertCircle, ArrowRight,
    Plus, ExternalLink, ChevronRight, RefreshCw,
} from 'lucide-react';
import { MonthlyPlanItemService } from '../../services/PlanService';
import { MonthlyPlanItem, MONTHLY_STATUS_LABELS, MonthlyTaskStatus } from '../../types/plan.types';
import { useTasksByMonthlyPlanItem } from '../../hooks/usePlanData';
import { supabase as _supabase } from '../../lib/supabase';
const supabase = _supabase as any;

// ─── Status config ────────────────────────────────────────────
const STATUS_CONFIG: Record<MonthlyTaskStatus, { icon: React.ReactNode; color: string; bg: string; dot: string }> = {
    planned:    { icon: <Clock className="w-3.5 h-3.5" />,        color: 'text-slate-600',  bg: 'bg-slate-100',  dot: 'bg-slate-400' },
    completed:  { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    incomplete: { icon: <XCircle className="w-3.5 h-3.5" />,      color: 'text-red-600',    bg: 'bg-red-50',     dot: 'bg-red-500' },
    partial:    { icon: <AlertCircle className="w-3.5 h-3.5" />,  color: 'text-amber-600',  bg: 'bg-amber-50',   dot: 'bg-amber-500' },
    deferred:   { icon: <ArrowRight className="w-3.5 h-3.5" />,   color: 'text-blue-600',   bg: 'bg-blue-50',    dot: 'bg-blue-500' },
};

const TASK_STATUS_COLOR: Record<string, string> = {
    todo: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-50 text-blue-600',
    review: 'bg-amber-50 text-amber-600',
    done: 'bg-emerald-50 text-emerald-700',
};
const TASK_STATUS_LABEL: Record<string, string> = {
    todo: 'Chưa làm',
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

const MonthlyPlanItemDetail: React.FC<Props> = ({ item, month, year, onEdit, onDelete, onClose, onAddTask }) => {
    const cfg = STATUS_CONFIG[item.status];
    const { tasks, loading: tasksLoading } = useTasksByMonthlyPlanItem(item.id);
    const [annualItem, setAnnualItem] = useState<any>(null);
    const [project, setProject] = useState<any>(null);

    // Load annual plan item nếu có liên kết
    useEffect(() => {
        if (!item.annual_plan_item_id) { setAnnualItem(null); return; }
        supabase
            .from('annual_plan_items')
            .select('id, task_name, group_name, frequency, responsible_text')
            .eq('id', item.annual_plan_item_id)
            .single()
            .then(({ data }: any) => setAnnualItem(data));
    }, [item.annual_plan_item_id]);

    // Load project nếu có liên kết
    useEffect(() => {
        if (!item.project_id) { setProject(null); return; }
        supabase
            .from('projects')
            .select('"ProjectID", "ProjectName", "ProjectCode"')
            .eq('"ProjectID"', item.project_id)
            .maybeSingle()
            .then(({ data }: any) => setProject(data));
    }, [item.project_id]);

    const tasksDone = tasks.filter(t => t.status === 'done').length;
    const tasksProgress = tasks.length > 0 ? Math.round((tasksDone / tasks.length) * 100) : 0;

    const handleDelete = () => {
        if (!confirm('Xóa nhiệm vụ này? Thao tác không thể hoàn tác.')) return;
        onDelete();
    };

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div className="flex-1 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

            {/* Panel */}
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                                    {cfg.icon}
                                    {MONTHLY_STATUS_LABELS[item.status]}
                                </span>
                                {item.group_name && (
                                    <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">
                                        {item.group_name}
                                    </span>
                                )}
                                <span className="text-xs text-slate-400">Tháng {month}/{year}</span>
                            </div>
                            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                                {item.task_name}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 mt-0.5"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Action bar */}
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            Sửa
                        </button>
                        <button
                            onClick={() => onAddTask(item.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Thêm công việc
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors ml-auto"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Xóa
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">

                    {/* ── Liên kết ── */}
                    {(annualItem || project) && (
                        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-700/60">
                            <p className="section-title"><Link2 className="w-3.5 h-3.5" />Liên kết</p>
                            <div className="space-y-2 mt-2">
                                {annualItem && (
                                    <div className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <span className="text-blue-400 text-xs mt-0.5 shrink-0">🗂</span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">KH Khung năm {year}</p>
                                            <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{annualItem.task_name}</p>
                                        </div>
                                    </div>
                                )}
                                {project && (
                                    <div className="flex items-start gap-2 p-2.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                                        <span className="text-violet-400 text-xs mt-0.5 shrink-0">📁</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-violet-700 dark:text-violet-300">Dự án</p>
                                            <p className="text-xs text-violet-600 dark:text-violet-400 truncate">{project.ProjectName}</p>
                                            {project.ProjectCode && (
                                                <p className="text-xs text-violet-400">{project.ProjectCode}</p>
                                            )}
                                        </div>
                                        <ExternalLink className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Thông tin ── */}
                    <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-700/60">
                        <p className="section-title"><ClipboardList className="w-3.5 h-3.5" />Thông tin nhiệm vụ</p>
                        <div className="mt-3 space-y-2.5">
                            {item.deliverable && (
                                <DetailRow label="Kết quả đầu ra" value={item.deliverable} />
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                {item.deadline_note && (
                                    <DetailRow label="Thời hạn" value={item.deadline_note} icon={<Calendar className="w-3 h-3 text-slate-400" />} />
                                )}
                                {item.due_date && (
                                    <DetailRow label="Ngày cụ thể" value={new Date(item.due_date).toLocaleDateString('vi-VN')} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Phân công ── */}
                    {(item.staff_name || item.dept_head_name || item.ban_head_name) && (
                        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-700/60">
                            <p className="section-title"><Users className="w-3.5 h-3.5" />Phân công thực hiện</p>
                            <div className="mt-3 grid grid-cols-1 gap-2">
                                {item.staff_name && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                                                {item.staff_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-800 dark:text-slate-200">{item.staff_name}</p>
                                            <p className="text-xs text-slate-400">Cán bộ phụ trách</p>
                                        </div>
                                    </div>
                                )}
                                {item.dept_head_name && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-medium text-amber-600 dark:text-amber-300">
                                                {item.dept_head_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-800 dark:text-slate-200">{item.dept_head_name}</p>
                                            <p className="text-xs text-slate-400">Lãnh đạo Phòng</p>
                                        </div>
                                    </div>
                                )}
                                {item.ban_head_name && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-medium text-rose-600 dark:text-rose-300">
                                                {item.ban_head_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-800 dark:text-slate-200">{item.ban_head_name}</p>
                                            <p className="text-xs text-slate-400">Lãnh đạo Ban</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Kết quả BC ── */}
                    {item.status !== 'planned' && (item.completion_result || item.incomplete_reason) && (
                        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-700/60">
                            <p className="section-title"><Briefcase className="w-3.5 h-3.5" />Kết quả báo cáo</p>
                            <div className="mt-3 space-y-2">
                                {item.completion_result && (
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                        <p className="text-xs text-slate-400 mb-1">Kết quả thực hiện</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{item.completion_result}</p>
                                    </div>
                                )}
                                {item.incomplete_reason && (
                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                                        <p className="text-xs text-red-400 mb-1">Lý do chưa hoàn thành</p>
                                        <p className="text-sm text-red-700 dark:text-red-300">{item.incomplete_reason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Công việc con ── */}
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="section-title">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Công việc
                                {tasks.length > 0 && (
                                    <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full font-normal">
                                        {tasksDone}/{tasks.length}
                                    </span>
                                )}
                            </p>
                            <button
                                onClick={() => onAddTask(item.id)}
                                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Thêm
                            </button>
                        </div>

                        {/* Progress bar */}
                        {tasks.length > 0 && (
                            <div className="mb-3 flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all"
                                        style={{ width: `${tasksProgress}%` }}
                                    />
                                </div>
                                <span className="text-xs text-slate-500">{tasksProgress}%</span>
                            </div>
                        )}

                        {tasksLoading ? (
                            <p className="text-xs text-slate-400 text-center py-3">Đang tải...</p>
                        ) : tasks.length === 0 ? (
                            <div className="text-center py-6 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl">
                                <p className="text-sm text-slate-400 mb-2">Chưa có công việc nào</p>
                                <button
                                    onClick={() => onAddTask(item.id)}
                                    className="text-xs text-indigo-500 hover:text-indigo-600 font-medium"
                                >
                                    + Tạo công việc đầu tiên
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {tasks.map((task: any) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                            task.status === 'done' ? 'bg-emerald-500'
                                            : task.status === 'in_progress' ? 'bg-blue-500'
                                            : task.status === 'review' ? 'bg-amber-500'
                                            : 'bg-slate-300'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm truncate ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {task.title}
                                            </p>
                                            {task.due_date && (
                                                <p className="text-xs text-slate-400">{new Date(task.due_date).toLocaleDateString('vi-VN')}</p>
                                            )}
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TASK_STATUS_COLOR[task.status] ?? 'bg-slate-100 text-slate-500'}`}>
                                            {TASK_STATUS_LABEL[task.status] ?? task.status}
                                        </span>
                                        {task.progress > 0 && task.progress < 100 && (
                                            <span className="text-xs text-slate-400 shrink-0">{task.progress}%</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    {item.notes && (
                        <div className="px-6 pb-4">
                            <p className="section-title">Ghi chú</p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">{item.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .section-title {
                    display: flex; align-items: center; gap: 0.375rem;
                    font-size: 0.75rem; font-weight: 600;
                    text-transform: uppercase; letter-spacing: 0.05em;
                    color: #64748b;
                }
                .dark .section-title { color: #94a3b8; }
            `}</style>
        </div>
    );
};

// ─── DetailRow helper ─────────────────────────────────────────
const DetailRow: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
    <div>
        <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">{icon}{label}</p>
        <p className="text-sm text-slate-700 dark:text-slate-300">{value}</p>
    </div>
);

export default MonthlyPlanItemDetail;
