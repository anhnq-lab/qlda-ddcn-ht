import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Task, TaskStatus, TaskPriority, TaskAttachment } from '../../types';
import { useTask, useUpdateTask, useAllTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useEmployees } from '../../hooks/useEmployees';
import { getTimelineStepLabel, getPhaseColor } from '../../utils/timelineStepUtils';
import { getTaskTemplates, getFileTypeColor, TaskTemplate } from '../../utils/taskTemplates';
import { getTemplateConfig } from '../../utils/templateRegistry';
import { TemplateExportModal } from '../projects/components/TemplateExportModal';
import { supabase as _supabase } from '../../lib/supabase';
const supabase = _supabase as any;
import { TaskInfoPanel } from './components/TaskInfoPanel';
import { TaskSubtaskList } from './components/TaskSubtaskList';
import { TaskAttachments } from './components/TaskAttachments';
import { TaskProgressUpdateModal } from './components/TaskProgressUpdateModal';
import { TaskCollaboration } from './components/TaskCollaboration';
import {
    ArrowLeft, Calendar, FileText, CheckCircle2, Scale, Building2, User, Clock,
    ShieldCheck, DollarSign, Paperclip, Plus, Trash2, ChevronRight, ExternalLink,
    Play, Eye, BarChart3, Link2, AlertTriangle, Edit3, Target, Zap, Layers,
    Upload, Download, FileSpreadsheet, File, CalendarDays, MessageSquare
} from 'lucide-react';

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════
// Thứ tự luân chuyển chính (Todo → InProgress → Done)
const STATUS_ORDER = [TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.Done];

const getStatusConfig = (s: TaskStatus) => {
    switch (s) {
        case TaskStatus.Done:       return { label: 'Hoàn thành',     bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', ring: 'ring-emerald-500/20', icon: <CheckCircle2 className="w-4 h-4" /> };
        case TaskStatus.InProgress: return { label: 'Đang thực hiện', bg: 'bg-blue-500',    text: 'text-blue-600',    light: 'bg-blue-50',    ring: 'ring-blue-500/20',    icon: <Play className="w-4 h-4" /> };
        case TaskStatus.Incomplete: return { label: 'Chưa hoàn thành', bg: 'bg-rose-500',    text: 'text-rose-600',    light: 'bg-rose-50',    ring: 'ring-rose-500/20',    icon: <Eye className="w-4 h-4" /> };
        default:                    return { label: 'Công việc mới',   bg: 'bg-slate-300',   text: 'text-slate-500',   light: 'bg-slate-50',   ring: 'ring-slate-300/20',   icon: <Target className="w-4 h-4" /> };
    }
};

const getPriorityConfig = (p?: TaskPriority) => {
    switch (p) {
        case TaskPriority.Urgent: return { label: 'Khẩn cấp', color: 'text-danger-600 bg-danger-50 ring-1 ring-danger-500/20' };
        case TaskPriority.High:   return { label: 'Cao',      color: 'text-warning-700 bg-warning-50 ring-1 ring-warning-500/20' };
        case TaskPriority.Medium: return { label: 'Trung bình', color: 'text-sky-600 bg-sky-50 ring-1 ring-sky-500/20' };
        case TaskPriority.Low:    return { label: 'Thấp',    color: 'text-slate-500 bg-slate-50 ring-1 ring-slate-300/20' };
        default: return { label: 'N/A', color: 'text-slate-400 bg-slate-50 dark:bg-slate-800' };
    }
};

const getProgressGradient = (p: number) => {
    if (p >= 100) return 'from-emerald-400 to-emerald-600';
    if (p >= 70) return 'from-blue-400 to-blue-600';
    if (p >= 40) return 'from-primary-400 to-primary-500';
    return 'from-slate-300 to-slate-400';
};

const getNextStatus = (c: TaskStatus): TaskStatus | null => { const i = STATUS_ORDER.indexOf(c); return i < STATUS_ORDER.length - 1 ? STATUS_ORDER[i + 1] : null; };
const getPrevStatus = (c: TaskStatus): TaskStatus | null => { const i = STATUS_ORDER.indexOf(c); return i > 0 ? STATUS_ORDER[i - 1] : null; };

const getIncompleteConfig = () => ({ label: 'Chưa hoàn thành', bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50', ring: 'ring-rose-500/20' });

// ═══════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════
interface TaskDetailProps {
    taskId?: string;
    isPanel?: boolean;
    onClose?: () => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId: propTaskId, isPanel, onClose }) => {
    const { id: paramId } = useParams<{ id: string }>();
    const id = propTaskId || paramId;
    const navigate = useNavigate();

    const { data: task, isLoading } = useTask(id);
    const { data: allTasks = [] } = useAllTasks();
    const { projects = [] } = useProjects();
    const { data: employees = [] } = useEmployees();
    const updateTaskMutation = useUpdateTask();

    const [activeExportTemplate, setActiveExportTemplate] = useState<TaskTemplate | null>(null);

    // KH tháng liên kết
    const [monthlyPlanItem, setMonthlyPlanItem] = useState<any>(null);
    const [progressModalTarget, setProgressModalTarget] = useState<TaskStatus | 'progress' | null>(null);

    useEffect(() => {
        if (!task?.MonthlyPlanItemID) { setMonthlyPlanItem(null); return; }
        supabase
            .from('monthly_plan_items')
            .select('id, task_name, status, deadline_note, result_note, monthly_plan:monthly_plans(plan_month, plan_year, department_code)')
            .eq('id', task.MonthlyPlanItemID)
            .maybeSingle()
            .then(({ data }: any) => setMonthlyPlanItem(data));
    }, [task?.MonthlyPlanItemID]);

    const project = projects.find(p => p.ProjectID === task?.ProjectID);
    const assignee = employees.find(e => e.EmployeeID === task?.AssigneeID);
    const approver = employees.find(e => e.EmployeeID === task?.ApproverID);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-14 h-14 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Không tìm thấy công việc!</p>
                    {!isPanel && (
                        <button onClick={() => navigate('/tasks')} className="text-sm text-blue-600 dark:text-blue-400 mt-2 hover:underline">← Quay lại</button>
                    )}
                </div>
            </div>
        );
    }

    const statusCfg = getStatusConfig(task.Status);
    const priorityCfg = getPriorityConfig(task.Priority);
    const nextStatus = getNextStatus(task.Status);
    const prevStatus = getPrevStatus(task.Status);
    const progress = task.ProgressPercent || (task.Status === TaskStatus.Done ? 100 : 0);
    const stepLabel = getTimelineStepLabel(task.TimelineStep);
    const phaseColor = getPhaseColor(task.TimelineStep);
    const isOverdue = task.Status !== TaskStatus.Done && task.DueDate && new Date(task.DueDate) < new Date();

    const handleStatusChange = (s: TaskStatus) => {
        setProgressModalTarget(s);
    };

    const handleProgressUpdateSubmit = async (newProgress: number, note: string, newStatus?: TaskStatus) => {
        if (!task) return;
        
        const finalStatus = newStatus || task.Status;
        updateTaskMutation.mutate({
            ...task,
            Status: finalStatus,
            ProgressPercent: finalStatus === 'done' ? 100 : 0
        });

        // Tự động ghi nhận báo cáo vào Monthly Plan nếu có liên kết
        if (task.MonthlyPlanItemID && note) {
            await supabase
                .from('monthly_plan_items')
                .update({ 
                    completion_result: note,
                    status: finalStatus === 'done' ? 'completed' : 'incomplete'
                })
                .eq('id', task.MonthlyPlanItemID);
        }

        setProgressModalTarget(null);
    };

    const getDependencyTask = (taskId: string) => allTasks.find(t => t.TaskID === taskId);



    const templates = getTaskTemplates(task.TimelineStep, task.Title);

    return (
        <div className={isPanel ? "animate-in fade-in duration-300" : "bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 min-h-screen animate-in fade-in duration-300"}>
            <div className={isPanel ? "p-4 md:p-6 space-y-6" : "max-w-6xl mx-auto px-6 py-6 space-y-6"}>

                {/* ══════════ BREADCRUMB ══════════ */}
                {!isPanel && (
                    <nav className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-400 flex-wrap">
                        <button onClick={() => navigate('/tasks')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-1">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Công việc
                        </button>
                    {project && (
                        <>
                            <ChevronRight className="w-3 h-3" />
                            <button
                                onClick={() => navigate(`/projects/${project.ProjectID}`, { state: { activeTab: 'plan' } })}
                                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                            >
                                {project.ProjectName}
                            </button>
                        </>
                    )}
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-200 font-bold truncate max-w-[300px]">{task.Title}</span>
                </nav>
                )}

                {/* ══════════ HEADER CARD ══════════ */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    {/* Top accent */}
                    <div className={`h-1 ${statusCfg.bg}`} />

                    <div className="p-4">
                        <div className="flex flex-col lg:flex-row justify-between gap-5">
                            {/* Left */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${statusCfg.light} ${statusCfg.text} ring-1 ${statusCfg.ring}`}>
                                        {statusCfg.icon} {statusCfg.label}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${priorityCfg.color}`}>
                                        {priorityCfg.label}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">{task.TaskID}</span>
                                    {task.IsCritical && (
                                        <span className="text-[10px] font-black text-red-600 bg-red-50 ring-1 ring-red-200 px-2 py-1 rounded-md flex items-center gap-1">
                                            <Zap className="w-3 h-3" /> ĐƯỜNG GĂNG
                                        </span>
                                    )}
                                    {isOverdue && (
                                        <span className="text-[10px] font-bold text-red-600 bg-red-50 ring-1 ring-red-200 px-2 py-1 rounded-md animate-pulse flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> QUÁ HẠN
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mb-2">{task.Title}</h1>

                                <p className="text-sm text-slate-400 dark:text-slate-400 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Thuộc dự án:
                                    <button
                                        onClick={() => navigate(`/projects/${project?.ProjectID}`, { state: { activeTab: 'plan' } })}
                                        className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                                    >
                                        {project?.ProjectName}
                                        <ExternalLink className="w-3 h-3" />
                                    </button>
                                </p>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex gap-2 shrink-0 items-start flex-wrap">
                                {prevStatus && (
                                    <button
                                        onClick={() => handleStatusChange(prevStatus)}
                                        className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-[0.98]"
                                    >
                                        ← {getStatusConfig(prevStatus).label}
                                    </button>
                                )}

                                {/* Nút Hoàn thành / Tiếp theo */}
                                {nextStatus && (
                                    <button
                                        onClick={() => handleStatusChange(nextStatus)}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm active:scale-[0.98] flex items-center gap-2 ${
                                            nextStatus === TaskStatus.Done
                                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-600/25'
                                                : 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-600/25'
                                        }`}
                                    >
                                        {getStatusConfig(nextStatus).icon}
                                        {getStatusConfig(nextStatus).label} →
                                    </button>
                                )}

                                {/* Nút Chưa hoàn thành — hiển thị khi đang thực hiện */}
                                {task.Status === TaskStatus.InProgress && (
                                    <button
                                        onClick={() => handleStatusChange(TaskStatus.Incomplete)}
                                        className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 shadow-sm shadow-rose-600/25 transition-all active:scale-[0.98] flex items-center gap-2"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Chưa hoàn thành
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ── Progress Bar ── */}
                        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <BarChart3 className="w-3.5 h-3.5" /> Tiến độ thực hiện
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-black ${progress >= 100 ? 'text-emerald-600' : progress >= 70 ? 'text-blue-600' : 'text-slate-600'}`}>{progress}%</span>
                                    <button 
                                        onClick={() => setProgressModalTarget('progress')}
                                        className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-2 py-1 rounded transition-colors"
                                    >
                                        Cập nhật
                                    </button>
                                </div>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(progress)} transition-all duration-700`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════ CONTENT GRID ══════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── LEFT 2/3 ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Description */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Nội dung thực hiện
                            </h3>
                            <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 leading-relaxed">
                                <p className="whitespace-pre-wrap">{task.Description || "Chưa có mô tả chi tiết."}</p>
                            </div>
                        </div>

                        {/* Regulatory */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="h-1" style={{ background: 'linear-gradient(90deg, #fb923c, #4a90e2)' }} />
                            <div className="p-4">
                                <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Scale className="w-4 h-4" /> Thông tin pháp lý & Quy trình
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 mb-2 block tracking-wider">Căn cứ pháp lý</label>
                                        <div className="flex items-start gap-2.5 bg-blue-50/60 dark:bg-blue-900/20 p-4 rounded-xl text-blue-800 dark:text-blue-300 text-sm font-medium ring-1 ring-blue-100 dark:ring-blue-800/40">
                                            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                                            {task.LegalBasis || "Chưa cập nhật"}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 mb-2 block tracking-wider">Sản phẩm / Kết quả</label>
                                        <div className="flex items-start gap-2.5 bg-emerald-50/60 dark:bg-emerald-900/20 p-4 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm font-medium ring-1 ring-emerald-100 dark:ring-emerald-800/40">
                                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                                            {task.OutputDocument || "Chưa xác định"}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 border-t border-slate-100 dark:border-slate-800">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 mb-2 block tracking-wider">Bước thực hiện</label>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold ${phaseColor.bg} ${phaseColor.text} ring-1 ${phaseColor.border}`}>
                                            <Layers className="w-3.5 h-3.5" />
                                            {stepLabel}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 mb-2 block tracking-wider">Thời gian quy định</label>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-slate-400 dark:text-slate-400" /> {task.DurationDays ? `${task.DurationDays} ngày` : "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 mb-2 block tracking-wider">Phụ thuộc</label>
                                        <div className="space-y-1.5">
                                            {task.Dependencies && task.Dependencies.length > 0 ? (
                                                task.Dependencies.map((dep, idx) => {
                                                    const depTask = getDependencyTask(dep.TaskID);
                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => {
                                                                if (isPanel) {
                                                                    // Update the URL or handle dependency navigation
                                                                    // For now, if we are in panel mode, maybe we don't navigate away, or maybe we open another panel?
                                                                    // Let's just navigate which changes route and unmounts the panel (if route mismatch)
                                                                    // Or better, let's open it in another panel if we have `isPanel`. 
                                                                    navigate(`/tasks/${dep.TaskID}`);
                                                                    if (onClose) onClose();
                                                                } else {
                                                                    navigate(`/tasks/${dep.TaskID}`);
                                                                }
                                                            }}
                                                            className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate- hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-lg transition-all group/dep w-full text-left ring-1 ring-slate-100 dark:ring-slate-800 hover:ring-blue-200 dark:hover:ring-blue-700"
                                                        >
                                                            <Link2 className="w-3 h-3 shrink-0 text-slate-400 group-hover/dep:text-blue-500 transition-colors" />
                                                            <span className="truncate font-medium">{depTask ? depTask.Title : dep.TaskID}</span>
                                                            <span className="text-[10px] text-slate-400 shrink-0 ml-auto">({dep.Type})</span>
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">Không có</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── RIGHT 1/3 ── */}
                    <div className="space-y-6">

                        <TaskInfoPanel 
                            task={task} 
                            assignee={assignee} 
                            approver={approver} 
                            isOverdue={isOverdue} 
                            monthlyPlanItem={monthlyPlanItem} 
                        />

                        <TaskSubtaskList 
                            task={task} 
                            updateTaskMutation={updateTaskMutation} 
                            employees={employees} 
                        />

                        <TaskAttachments 
                            task={task} 
                            updateTaskMutation={updateTaskMutation} 
                            templates={templates} 
                            setActiveExportTemplate={setActiveExportTemplate} 
                        />
                    </div>
                </div>
            </div>



            {/* ══════════ TEMPLATE EXPORT MODAL ══════════ */}
            {activeExportTemplate?.templatePath && (
                <TemplateExportModal
                    isOpen={!!activeExportTemplate}
                    onClose={() => setActiveExportTemplate(null)}
                    templatePath={activeExportTemplate.templatePath}
                    templateLabel={activeExportTemplate.name}
                    project={project || null}
                    stepTitle={task.TimelineStep ? getTimelineStepLabel(task.TimelineStep) : undefined}
                    stepCode={task.TimelineStep}
                />
            )}

            {/* ══════════ TASK PROGRESS MODAL ══════════ */}
            {progressModalTarget && task && (
                <TaskProgressUpdateModal
                    task={task}
                    targetStatus={progressModalTarget === 'progress' ? null : progressModalTarget as TaskStatus}
                    onClose={() => setProgressModalTarget(null)}
                    onSubmit={handleProgressUpdateSubmit}
                    isSaving={updateTaskMutation.isPending}
                />
            )}
        </div>
    );
}

export default TaskDetail;


