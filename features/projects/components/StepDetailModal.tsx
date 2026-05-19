import React, { useState, useEffect, useMemo } from 'react';
import {
    X, Building2, Calendar, Timer, CheckCircle2, Clock,
    Circle, AlertCircle, Plus, Edit3, Trash2, Save,
    ChevronDown, User, Flag, FileText, Layers
} from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { ProgressBadge } from './ProgressSlider';
import { getStatusConfig, getPriorityColor, isOverdue, formatDate, formatDateShort, parseSlaFormula } from '../utils/taskHelpers';
import type { PhaseItem } from '../hooks/useWorkflowPhases';
import type { StepAggregate } from '../hooks/useStepAggregates';

interface StepDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: PhaseItem;
    stepAgg: StepAggregate | undefined;
    tasks: Task[];
    employeeNameMap: Record<string, string>;
    onAddTask: (stepName?: string, stepCode?: string) => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (e: React.MouseEvent, taskId: string, taskTitle: string) => void;
    onQuickStatusChange: (e: React.MouseEvent, task: Task) => void;
    // Edit step metadata
    onUpdateStepMeta?: (stepCode: string, updates: { assigneeRole?: string }) => void;
}

export const StepDetailModal: React.FC<StepDetailModalProps> = ({
    isOpen,
    onClose,
    item,
    stepAgg,
    tasks,
    employeeNameMap,
    onAddTask,
    onEditTask,
    onDeleteTask,
    onQuickStatusChange,
    onUpdateStepMeta,
}) => {
    const [editingRole, setEditingRole] = useState(false);
    const [roleValue, setRoleValue] = useState(item.assigneeRole || '');

    // Reset when item changes
    useEffect(() => {
        setRoleValue(item.assigneeRole || '');
        setEditingRole(false);
    }, [item.code, item.assigneeRole]);

    // Filter tasks for this step
    const linkedTasks = useMemo(() =>
        tasks.filter(t => t.TimelineStep === item.code)
            .sort((a, b) => {
                const dateA = a.StartDate ? new Date(a.StartDate).getTime() : (a.DueDate ? new Date(a.DueDate).getTime() : 0);
                const dateB = b.StartDate ? new Date(b.StartDate).getTime() : (b.DueDate ? new Date(b.DueDate).getTime() : 0);
                return dateA - dateB;
            }),
        [tasks, item.code]
    );

    const completedCount = linkedTasks.filter(t => t.Status === TaskStatus.Done).length;
    const statusCfg = getStatusConfig(stepAgg?.status);

    const handleSaveRole = () => {
        if (onUpdateStepMeta) {
            onUpdateStepMeta(item.code, { assigneeRole: roleValue });
        }
        setEditingRole(false);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Slide Panel */}
            <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-warning-50 dark:from-slate-800 dark:to-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Status Icon */}
                            <div className="shrink-0">
                                {stepAgg?.status === TaskStatus.Done ? (
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                ) : stepAgg?.status === TaskStatus.Review ? (
                                    <AlertCircle className="w-6 h-6 text-primary-500" />
                                ) : stepAgg?.status === TaskStatus.InProgress ? (
                                    <Clock className="w-6 h-6 text-blue-500" />
                                ) : (
                                    <Circle className="w-6 h-6 text-gray-300 dark:text-slate-600" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 truncate">
                                    Bước {item.id}. {item.title}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                    Kế hoạch thực hiện — Chi tiết bước công việc
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {linkedTasks.length > 0 ? (
                                <button
                                    onClick={() => onEditTask(linkedTasks.find(t => !(t as any).ParentID) || linkedTasks[0])}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-warning-50 dark:hover:bg-warning-900/30 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:text-warning-700 dark:hover:text-warning-400 border border-gray-200 dark:border-slate-600 hover:border-warning-200 dark:hover:border-warning-700 rounded-lg shadow-sm transition-colors"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Sửa nội dung kế hoạch
                                </button>
                            ) : (
                                <button
                                    onClick={() => onAddTask(item.title, item.code)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Tạo công việc
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">

                    {/* Info Cards */}
                    <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Đơn vị thực hiện */}
                        <div className="bg-warning-50 dark:bg-warning-900/10 rounded-xl p-3 border border-warning-200 dark:border-warning-800">
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-warning-600 dark:text-warning-400 uppercase tracking-wide mb-1">
                                <Building2 className="w-3 h-3" />
                                Đơn vị thực hiện
                            </div>
                            {editingRole ? (
                                <div className="flex items-center gap-1">
                                    <input
                                        type="text"
                                        value={roleValue}
                                        onChange={(e) => setRoleValue(e.target.value)}
                                        className="flex-1 text-sm font-semibold bg-white dark:bg-slate-800 border border-warning-300 dark:border-warning-700 rounded px-2 py-0.5 text-gray-900 dark:text-slate-100 focus:ring-1 focus:ring-warning-400"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRole()}
                                    />
                                    <button onClick={handleSaveRole} className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded">
                                        <Save className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 group/role">
                                    <span className="text-sm font-semibold text-warning-800 dark:text-warning-300">
                                        {item.assigneeRole || 'Chưa chỉ định'}
                                    </span>
                                    {onUpdateStepMeta && (
                                        <button
                                            onClick={() => setEditingRole(true)}
                                            className="opacity-0 group-hover/role:opacity-100 p-0.5 text-warning-500 hover:bg-warning-100 dark:hover:bg-warning-900/30 rounded transition-opacity"
                                        >
                                            <Edit3 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Ngày bắt đầu → kết thúc */}
                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                <Calendar className="w-3 h-3" />
                                Thời gian
                            </div>
                            <div className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                {stepAgg?.startDate
                                    ? formatDate(stepAgg.startDate, { day: '2-digit', month: '2-digit' })
                                    : '--/--'}
                                {' → '}
                                {stepAgg?.dueDate
                                    ? formatDate(stepAgg.dueDate, { day: '2-digit', month: '2-digit' })
                                    : '--/--'}
                            </div>
                        </div>

                        {/* Thời gian dự kiến */}
                        <div className="bg-primary-50 dark:bg-primary-900/10 rounded-xl p-3 border border-primary-200 dark:border-primary-800">
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide mb-1">
                                <Timer className="w-3 h-3" />
                                SLA Dự kiến
                            </div>
                            <div className="text-sm font-semibold text-primary-800 dark:text-primary-300">
                                {item.estimatedDays ? `${item.estimatedDays} ngày` : '---'}
                            </div>
                        </div>

                        {/* Trạng thái */}
                        <div className={`rounded-xl p-3 border ${statusCfg.bg} ${statusCfg.border}`}>
                            <div className={`flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide mb-1 ${statusCfg.color}`}>
                                <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                                Trạng thái
                            </div>
                            <div className={`text-sm font-semibold ${statusCfg.color}`}>
                                {statusCfg.label}
                            </div>
                        </div>
                    </div>

                    {/* Progress */}
                    {stepAgg && stepAgg.childCount > 0 && (
                        <div className="px-6 pb-3">
                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 rounded-xl p-3 border border-gray-200 dark:border-slate-700">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-gray-700 dark:text-slate-300">Tiến độ tổng thể</span>
                                        <span className="text-xs font-bold text-gray-900 dark:text-slate-100">{stepAgg.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                stepAgg.progress >= 100
                                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                                    : stepAgg.progress >= 50
                                                        ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                                                        : 'bg-gradient-to-r from-primary-400 to-primary-500'
                                            }`}
                                            style={{ width: `${Math.min(stepAgg.progress, 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-slate-400 shrink-0">
                                    {completedCount}/{linkedTasks.length} việc
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Task List */}
                    <div className="px-6 pb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-gray-400" />
                                Danh sách công việc ({linkedTasks.length})
                            </h3>
                            <button
                                onClick={() => onAddTask(item.title, item.code)}
                                className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Thêm công việc
                            </button>
                        </div>

                        {linkedTasks.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 dark:bg-slate-800 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                                <FileText className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    Chưa có công việc nào trong bước này
                                </p>
                                <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">
                                    Bấm &quot;Thêm công việc&quot; để bắt đầu
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {linkedTasks.map(task => {
                                    const overdueFlag = isOverdue(task);
                                    const taskStatusCfg = getStatusConfig(task.Status);

                                    return (
                                        <div
                                            key={task.TaskID}
                                            onClick={() => onEditTask(task)}
                                            className={`group/task bg-white dark:bg-slate-800 border rounded-xl p-3 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 ${
                                                overdueFlag
                                                    ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                                                    : task.Status === TaskStatus.Done
                                                        ? 'border-emerald-200 dark:border-emerald-800'
                                                        : 'border-gray-200 dark:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Status Dot */}
                                                <button
                                                    onClick={(e) => onQuickStatusChange(e, task)}
                                                    className={`mt-0.5 w-5 h-5 rounded-full shrink-0 transition-transform hover:scale-125 ring-2 ring-offset-1 dark:ring-offset-slate-800 ${
                                                        task.Status === TaskStatus.Done
                                                            ? 'bg-emerald-500 ring-emerald-200 dark:ring-emerald-700'
                                                            : task.Status === TaskStatus.Review
                                                                ? 'bg-purple-500 ring-purple-200 dark:ring-purple-700'
                                                                : task.Status === TaskStatus.InProgress
                                                                    ? 'bg-blue-500 ring-blue-200 dark:ring-blue-700'
                                                                    : 'bg-gray-200 dark:bg-slate-600 ring-gray-100 dark:ring-slate-500'
                                                    }`}
                                                    title="Click để chuyển trạng thái"
                                                />

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-sm font-medium ${
                                                            task.Status === TaskStatus.Done
                                                                ? 'text-gray-400 dark:text-slate-400 line-through'
                                                                : overdueFlag
                                                                    ? 'text-red-700 dark:text-red-400'
                                                                    : 'text-gray-800 dark:text-slate-200'
                                                        }`}>
                                                            {task.Title}
                                                        </span>
                                                        {task.IsCritical && (
                                                            <span className="px-1 py-0.5 bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-400 text-[8px] rounded font-bold">CP</span>
                                                        )}
                                                    </div>

                                                    {/* Task Meta Row */}
                                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                        {/* Status badge */}
                                                        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${taskStatusCfg.bg} ${taskStatusCfg.color} border ${taskStatusCfg.border}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${taskStatusCfg.dot}`} />
                                                            {taskStatusCfg.label}
                                                        </span>

                                                        {/* Assignee */}
                                                        {task.AssigneeID && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-400">
                                                                <User className="w-3 h-3" />
                                                                {employeeNameMap[task.AssigneeID] || task.AssigneeID}
                                                            </span>
                                                        )}

                                                        {/* Date */}
                                                        {task.DueDate && (
                                                            <span className={`inline-flex items-center gap-1 text-[10px] ${
                                                                overdueFlag ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-400 dark:text-slate-400'
                                                            }`}>
                                                                <Calendar className="w-3 h-3" />
                                                                {formatDateShort(task.StartDate)} → {formatDateShort(task.DueDate)}
                                                            </span>
                                                        )}

                                                        {/* Priority */}
                                                        {task.Priority && (
                                                            <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border ${getPriorityColor(task.Priority)}`}>
                                                                <Flag className="w-2.5 h-2.5" />
                                                                {task.Priority}
                                                            </span>
                                                        )}

                                                        {/* Progress */}
                                                        {(task.ProgressPercent || 0) > 0 && task.Status !== TaskStatus.Done && (
                                                            <ProgressBadge value={task.ProgressPercent || 0} size="sm" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Delete button */}
                                                <button
                                                    onClick={(e) => onDeleteTask(e, task.TaskID, task.Title)}
                                                    className="opacity-0 group-hover/task:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all shrink-0"
                                                    title="Xóa công việc"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-slate-400">
                        Mã bước: {item.code.substring(0, 8)}...
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onAddTask(item.title, item.code)}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm công việc
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 rounded-lg border border-gray-300 dark:border-slate-600 transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StepDetailModal;
