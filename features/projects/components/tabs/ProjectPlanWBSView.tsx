import React from 'react';
import { 
    ChevronDown, ChevronRight, Plus, Clock, AlignLeft, 
    Upload, Paperclip, ExternalLink, Trash2, Play, 
    CheckCircle2, ListChecks, Users, Layers, Circle, 
    Calendar, Flag, User, AlertCircle, X, ListPlus, FileText,
    Building2, Timer, Eye
} from 'lucide-react';
import { ProgressBadge } from '../ProgressSlider';
import { LegalReferenceLink } from '@/components/common/LegalReferenceLink';
import { PhaseProgressCard } from '../PhaseProgressCard';
import { Task, TaskStatus } from '@/types';
import { getPriorityColor, isOverdue, getStatusConfig, formatDateShort } from '../../utils/taskHelpers';
import type { PhaseItem } from '../../hooks/useWorkflowPhases';

// Helpers imported from shared utils/taskHelpers.ts

// You might need to adjust Enum import if getGroupLabel is needed
// Since it's passed as prop, no need to import Enum here

interface ProjectPlanWBSViewProps {
    phases: any[];
    tasks: Task[];
    filteredTasks: Task[];
    projectID: string;
    groupCode: string;
    getGroupLabel: (code: string) => string;
    
    // States
    expandedPhases: Record<string, boolean>;
    stepAggregates: Map<string, any>;
    bulkCreatingAll: boolean;
    isDeletingAll: boolean;
    deleteConfirmStep: number;
    employeeNameMap: Record<string, string>;
    uploadingTaskId: string | null;
    attachmentCounts: Record<string, number>;
    deletingTaskId: string | null;
    
    // Handlers
    onTogglePhase: (id: string) => void;
    onSetExpandedPhases: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    onDeleteAllTasks: () => void;
    onOpenPlanModal: (trigger: any, title: string, desc: string) => void;
    onAddTask: (stepName?: string, stepCode?: string) => void;
    onEditTask: (task: Task) => void;
    onQuickStatusChange: (e: React.MouseEvent, task: Task) => void;
    onDeleteTask: (e: React.MouseEvent, taskId: string, taskTitle: string) => void;
    onSetPendingUploadTaskId: (id: string) => void;
    onStepClick?: (item: PhaseItem, stepAgg: any) => void;
    // New Props for expanding Tasks
    expandedMasterTasks: Record<string, boolean>;
    onToggleMasterTask: (e: React.MouseEvent, taskId: string) => void;
    
    // Refs & Utils
    fileInputRef: React.RefObject<HTMLInputElement>;
    navigate: (path: string, options?: any) => void;
    queryClient: any;
}

export const ProjectPlanWBSView: React.FC<ProjectPlanWBSViewProps> = ({
    phases,
    tasks,
    filteredTasks,
    projectID,
    groupCode,
    getGroupLabel,
    expandedPhases,
    stepAggregates,
    bulkCreatingAll,
    isDeletingAll,
    deleteConfirmStep,
    employeeNameMap,
    uploadingTaskId,
    attachmentCounts,
    deletingTaskId,
    onTogglePhase,
    onSetExpandedPhases,
    onDeleteAllTasks,
    onOpenPlanModal,
    onAddTask,
    onEditTask,
    onQuickStatusChange,
    onDeleteTask,
    onSetPendingUploadTaskId,
    onStepClick,
    expandedMasterTasks,
    onToggleMasterTask,
    fileInputRef,
    navigate,
    queryClient
}) => {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-50 to-yellow-50 dark:from-transparent dark:to-transparent dark:bg-slate-800 border border-primary-200 dark:border-slate-700 p-4 rounded-xl flex justify-between items-center shadow-sm">
                <div>
                    <h3 className="text-primary-900 dark:text-slate-100 font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary-600 dark:text-slate-300" />
                        Kế hoạch thực hiện dự án
                    </h3>
                    <p className="text-xs text-primary-700/80 dark:text-slate-400 mt-1">
                        <LegalReferenceLink text="Căn cứ theo Điều 4, Nghị định 175/NĐ-CP về trình tự đầu tư xây dựng." />
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => navigate('/quy-trinh')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shadow-sm text-cyan-600 bg-cyan-50 hover:bg-cyan-100 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700 dark:hover:bg-cyan-900/50"
                        title="Xem chi tiết các quy trình mẫu"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Xem quy trình gốc</span>
                    </button>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-sm text-gray-600 bg-bg-surface hover:bg-bg-subtle border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700 dark:hover:bg-slate-700"
                        title="Tải lại dữ liệu từ máy chủ (Xóa Cache)"
                    >
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    {/* Tạo tất cả công việc Button */}
                    <button
                        onClick={() => onOpenPlanModal(
                            { type: 'all' },
                            'Tạo kế hoạch tổng thể',
                            'Hệ thống sẽ tự động phân bổ công việc cho tất cả giai đoạn theo tỷ lệ thời gian'
                        )}
                        disabled={bulkCreatingAll}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-sm ${bulkCreatingAll
                            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 cursor-wait'
                            : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-700 hover:shadow'
                            }`}
                    >
                        {bulkCreatingAll ? (
                            <>
                                <div className="w-3 h-3 border-2 border-primary-300 border-t-amber-600 rounded-full animate-spin" />
                                Đang tạo...
                            </>
                        ) : (
                            <>
                                <ListPlus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Tạo KH tổng thể</span>
                                <span className="sm:hidden">Tạo KH</span>
                            </>
                        )}
                    </button>
                    {/* Xóa tất cả công việc Button */}
                    {tasks.length > 0 && (
                        <button
                            onClick={onDeleteAllTasks}
                            disabled={isDeletingAll}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-sm ${isDeletingAll
                                    ? 'text-gray-400 bg-bg-subtle border-gray-200 cursor-wait'
                                    : deleteConfirmStep === 1
                                        ? 'text-white bg-red-600 border-red-700 animate-pulse hover:bg-red-700'
                                        : 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200 dark:border-red-800 dark:bg-red-900/30 hover:border-red-300'
                                }`}
                            title={deleteConfirmStep === 1 ? 'Bấm lần nữa để xác nhận xóa!' : 'Xóa toàn bộ công việc của dự án này'}
                        >
                            {isDeletingAll ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                </>
                            ) : deleteConfirmStep === 1 ? (
                                <>
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Xác nhận
                                </>
                            ) : (
                                <>
                                    <X className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Xóa tất cả</span>
                                </>
                            )}
                        </button>
                    )}
                    <button
                        onClick={() => navigate(`/tasks`, { state: { filterProject: projectID } })}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-bg-surface hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors shadow-sm"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Tất cả
                    </button>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${groupCode === 'A' || groupCode === 'QN'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
                        : groupCode === 'B'
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                        }`}>
                        {getGroupLabel(groupCode)}
                    </span>
                </div>
            </div>

            {/* Phase Cards with Expandable Items */}
            <div className="space-y-3">
                {phases.map((phase) => (
                    <div key={phase.id}>
                        {/* Phase Header Card */}
                        <PhaseProgressCard
                            phase={phase}
                            tasks={filteredTasks}
                            isExpanded={expandedPhases[phase.id]}
                            onToggle={() => onTogglePhase(phase.id)}
                        />

                        {/* Expanded Items */}
                        {expandedPhases[phase.id] && tasks.length === 0 && (
                            <div className="mt-2 ml-4 p-5 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-indigo-100/50 dark:border-slate-700/50 text-center shadow-sm">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-slate-700 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <h4 className="text-indigo-900 dark:text-slate-200 font-semibold mb-1">
                                    Kế hoạch chưa được khởi tạo
                                </h4>
                                <p className="text-xs text-indigo-600/70 dark:text-slate-400 max-w-sm mx-auto">
                                    Bấm vào "Tạo kế hoạch tổng thể" ở tiêu đề để tự động phân bổ tài nguyên, quy trình và các đầu việc cần thiết.
                                </p>
                            </div>
                        )}
                        {expandedPhases[phase.id] && tasks.length > 0 && (
                            <div className="mt-2 ml-4 border-l-2 border-gray-200 dark:border-slate-700 pl-4 space-y-3">
                                {(phase.subProcesses || [{ id: '0', title: '', fullTitle: '', items: phase.items }]).map((sp) => (
                                    <div key={sp.id}>
                                        {/* Sub-process Header */}
                                        {sp.fullTitle && (
                                            <button
                                                onClick={() => onSetExpandedPhases(prev => ({ ...prev, [`sp_${sp.id}`]: !prev[`sp_${sp.id}`] }))}
                                                className="w-full flex items-center gap-2 px-3 py-2 mb-1 rounded-lg bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 transition-colors group/sp"
                                            >
                                                {expandedPhases[`sp_${sp.id}`] === false
                                                    ? <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
                                                    : <ChevronDown className="w-4 h-4 text-amber-500 shrink-0" />
                                                }
                                                <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300 text-left">
                                                    {sp.fullTitle}
                                                </span>
                                                <span className="text-[10px] text-amber-500 dark:text-amber-400 ml-auto shrink-0">
                                                    {sp.items.length} bước
                                                </span>
                                            </button>
                                        )}

                                        {/* Steps inside sub-process */}
                                        {expandedPhases[`sp_${sp.id}`] !== false && (
                                        <div className={`space-y-2 ${sp.fullTitle ? 'ml-3 border-l border-amber-200/40 dark:border-amber-700/30 pl-3' : ''}`}>
                                        {sp.items.map((item) => {
                                            const linkedTasks = filteredTasks
                                                .filter(t => t.TimelineStep === item.code)
                                                .sort((a, b) => {
                                                    const dateA = a.StartDate ? new Date(a.StartDate).getTime() : (a.DueDate ? new Date(a.DueDate).getTime() : 0);
                                                    const dateB = b.StartDate ? new Date(b.StartDate).getTime() : (b.DueDate ? new Date(b.DueDate).getTime() : 0);
                                                    return dateA - dateB;
                                                });
                                            const agg = stepAggregates.get(item.code);
                                            const parentStatus = agg?.status || TaskStatus.Todo;
                                            const isParentDone = parentStatus === TaskStatus.Done;
                                            const isParentActive = parentStatus === TaskStatus.InProgress || parentStatus === TaskStatus.Review;
                                            const completedCount = linkedTasks.filter(t => t.Status === TaskStatus.Done).length;

                                            const stepBorderColor = isParentDone
                                                ? 'border-l-emerald-500'
                                                : isParentActive
                                                    ? 'border-l-blue-500'
                                                    : 'border-l-gray-200 dark:border-l-slate-700';

                                            return (
                                                <div key={item.id} className={`bg-bg-surface border border-gray-200 dark:border-slate-700 rounded-lg p-3 hover:border-gray-200 dark:hover:border-slate-600 transition-colors group border-l-4 ${stepBorderColor}`}>
                                                    {/* Step Header Row */}
                                                    <div className="flex items-center gap-3">
                                                        {/* Status Icon */}
                                                        <div className="shrink-0">
                                                            {isParentDone ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                            ) : parentStatus === TaskStatus.Review ? (
                                                                <AlertCircle className="w-5 h-5 text-primary-500" />
                                                            ) : parentStatus === TaskStatus.InProgress ? (
                                                                <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
                                                            ) : (
                                                                <Circle className="w-5 h-5 text-gray-300 dark:text-slate-600" />
                                                            )}
                                                        </div>

                                                        {/* Title */}
                                                        <div className="flex-1 min-w-0 pr-4">
                                                            <div className="flex items-center gap-2">
                                                                <h5 className={`text-sm font-medium ${isParentDone ? 'text-gray-900 dark:text-slate-100' : 'text-gray-700 dark:text-slate-300'}`}>
                                                                    {item.id}. {item.title}
                                                                </h5>
                                                                {/* Progress Badge inline if needed */}
                                                                {agg && agg.progress > 0 && (
                                                                    <ProgressBadge value={agg.progress} size="sm" />
                                                                )}
                                                            </div>
                                                            {/* Assignee & Meta under title */}
                                                            {item.assigneeRole && (
                                                                <div className="mt-1.5 flex items-center gap-2">
                                                                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
                                                                        <Building2 className="w-3 h-3 text-amber-500" />
                                                                        {item.assigneeRole}
                                                                    </span>
                                                                    {item.estimatedDays && (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700">
                                                                            <Timer className="w-3 h-3" />
                                                                            {item.estimatedDays} ngày
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Tabular Meta Container (Right Aligned) */}
                                                        <div className="hidden lg:flex items-center gap-6 shrink-0 text-xs font-medium text-gray-500 dark:text-slate-400 mr-2">
                                                            {/* Count Badge */}
                                                            <div className="w-24 flex justify-center">
                                                                <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded font-medium ${linkedTasks.length === 0
                                                                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                                                                    : completedCount === linkedTasks.length
                                                                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                                                                        : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                                                                    }`}>
                                                                    {completedCount}/{linkedTasks.length} việc
                                                                </span>
                                                            </div>

                                                            {/* Dates */}
                                                            <div className="w-28 text-center truncate" title={agg?.startDate ? formatDateShort(agg.startDate) : 'Chưa xác định'}>
                                                                {agg?.startDate ? formatDateShort(agg.startDate) : <span className="text-gray-400 dark:text-slate-400">--/--</span>}
                                                            </div>
                                                            <div className="w-28 text-center truncate" title={agg?.dueDate ? formatDateShort(agg.dueDate) : 'Chưa xác định'}>
                                                                {agg?.dueDate ? formatDateShort(agg.dueDate) : <span className="text-gray-400 dark:text-slate-400">--/--</span>}
                                                            </div>

                                                            {/* Status */}
                                                            <div className="w-32 flex justify-start">
                                                                {(() => {
                                                                    const statusCfg = getStatusConfig(parentStatus);
                                                                    return linkedTasks.length > 0 ? (
                                                                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                                                            {statusCfg.label}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700">
                                                                            <Circle className="w-2.5 h-2.5" />
                                                                            Chưa tạo việc
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>

                                                        {/* Mobile Meta Backup */}
                                                        <div className="lg:hidden flex flex-col gap-1 shrink-0 text-right mr-2">
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium inline-block w-fit ml-auto ${linkedTasks.length === 0 ? 'bg-gray-100 text-gray-500' : completedCount === linkedTasks.length ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                {completedCount}/{linkedTasks.length} việc
                                                            </span>
                                                            {(agg?.startDate || agg?.dueDate) && (
                                                                <span className="text-[10px] text-gray-500">{formatDateShort(agg.startDate)} - {formatDateShort(agg.dueDate)}</span>
                                                            )}
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            {onStepClick && (
                                                                <button
                                                                    onClick={() => onStepClick(item, agg)}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs font-medium text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded border border-gray-200 dark:border-slate-600 flex items-center gap-1"
                                                                    title="Xem chi tiết kế hoạch"
                                                                >
                                                                    <Eye className="w-3 h-3" />
                                                                    <span className="hidden sm:inline">Chi tiết</span>
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => onAddTask(item.title, item.code)}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded border border-blue-200 dark:border-blue-800 flex items-center gap-1"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                                <span className="hidden sm:inline">Thêm</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Task Table (Compact) */}
                                                    {linkedTasks.length > 0 && (
                                                        <div className="mt-3 border border-gray-200 dark:border-slate-700 rounded-lg overflow-x-auto">
                                                            <table className="w-full text-xs box-border">
                                                                <thead>
                                                                    <tr className="bg-bg-subtle text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                                                                        <th className="px-2 py-2 text-left w-8"></th>
                                                                        <th className="px-2 py-2 text-left min-w-[200px]">Công việc</th>
                                                                        <th className="px-2 py-2 text-center w-24">Tiến độ</th>
                                                                        <th className="px-2 py-2 text-left w-32 hidden sm:table-cell">Phụ trách</th>
                                                                        <th className="px-2 py-2 text-left w-28 hidden sm:table-cell">Hạn / Bắt đầu</th>
                                                                        <th className="px-2 py-2 text-center w-20">Ưu tiên</th>
                                                                        <th className="px-2 py-2 text-center w-16">TL</th>
                                                                        <th className="px-2 py-2 text-center w-8"></th>
                                                                        <th className="px-2 py-2 text-center w-8"></th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                                                                    {linkedTasks.map(t => (
                                                                        <React.Fragment key={t.TaskID}>
                                                                        <tr
                                                                            onClick={() => onEditTask(t)}
                                                                            className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50 ${isOverdue(t) ? 'bg-red-50/50 dark:bg-red-900/20' : ''}`}
                                                                        >
                                                                            {/* Status Dot */}
                                                                            <td className="px-2 py-2 text-center">
                                                                                <button
                                                                                    onClick={(e) => onQuickStatusChange(e, t)}
                                                                                    className={`w-4 h-4 rounded-full transition-transform hover:scale-125 focus:outline-none ring-2 ring-offset-1 dark:ring-offset-slate-800 ${t.Status === 'Done' ? 'bg-emerald-500 ring-emerald-200 dark:ring-emerald-700' :
                                                                                        t.Status === 'Review' ? 'bg-primary-500 ring-primary-200 dark:ring-primary-700' :
                                                                                            t.Status === 'InProgress' ? 'bg-primary-500 ring-primary-200 dark:ring-primary-700' :
                                                                                                'bg-gray-200 dark:bg-slate-600 ring-gray-100 dark:ring-slate-500 hover:bg-gray-300 dark:hover:bg-slate-500'
                                                                                        }`}
                                                                                    title="Click để chuyển trạng thái"
                                                                                />
                                                                            </td>

                                                                            {/* Title */}
                                                                            <td className={`px-2 py-2 font-medium ${t.Status === 'Done' ? 'text-gray-400 dark:text-slate-400' :
                                                                                isOverdue(t) ? 'text-red-700 dark:text-red-400' :
                                                                                    t.Status === 'Review' ? 'text-primary-700 dark:text-primary-400' :
                                                                                        t.Status === 'InProgress' ? 'text-orange-700 dark:text-orange-400' :
                                                                                            'text-gray-700 dark:text-slate-300'
                                                                                }`}>
                                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                                    {t.SubTasks && t.SubTasks.length > 0 && (
                                                                                        <button
                                                                                            onClick={(e) => onToggleMasterTask(e, t.TaskID)}
                                                                                            className="p-0.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition-colors"
                                                                                            title={expandedMasterTasks[t.TaskID] ? "Thu gọn công việc con" : "Hiện công việc con"}
                                                                                        >
                                                                                            {expandedMasterTasks[t.TaskID] ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg> : <ChevronDown className="w-3 h-3" />}
                                                                                        </button>
                                                                                    )}
                                                                                    <span>{t.Title}</span>
                                                                                    {t.IsCritical && (
                                                                                        <span className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[8px] rounded font-bold shrink-0">
                                                                                            CP
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </td>

                                                                            {/* Progress */}
                                                                            <td className="px-2 py-2 text-center">
                                                                                <ProgressBadge
                                                                                    value={t.ProgressPercent || (t.Status === TaskStatus.Done ? 100 : 0)}
                                                                                    size="sm"
                                                                                />
                                                                            </td>

                                                                            {/* Assignee */}
                                                                            <td className="px-2 py-2 text-gray-500 dark:text-slate-400 max-w-[150px]">
                                                                                {t.AssigneeID ? (
                                                                                    <div className="flex items-center gap-1 truncate" title={employeeNameMap[t.AssigneeID] || t.AssigneeID}>
                                                                                        <User className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                                                                        <span className="truncate text-xs font-medium text-gray-700 dark:text-slate-300">{employeeNameMap[t.AssigneeID] || t.AssigneeID}</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="text-[10px] text-gray-400 italic">Chưa chỉ định</span>
                                                                                )}
                                                                            </td>

                                                                            {/* Due Date + Smart Relative Time */}
                                                                            <td className={`px-2 py-2 ${isOverdue(t) ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-slate-400'}`}>
                                                                                {t.Status === TaskStatus.Done && t.ActualEndDate ? (
                                                                                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium" title={`Hoàn thành: ${new Date(t.ActualEndDate).toLocaleDateString('vi-VN')}`}>
                                                                                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                                                                                        {new Date(t.ActualEndDate).toLocaleDateString('vi-VN')}
                                                                                    </span>
                                                                                ) : t.DueDate ? (
                                                                                    <span className="flex flex-col gap-0.5 text-[11px]" title={`${t.StartDate ? new Date(t.StartDate).toLocaleDateString('vi-VN') : ''} - ${new Date(t.DueDate).toLocaleDateString('vi-VN')}`}>
                                                                                        <span className="flex items-center gap-1">
                                                                                            <Calendar className="w-3 h-3 shrink-0 text-gray-400"/>
                                                                                            <span className="whitespace-nowrap">
                                                                                                {t.StartDate ? new Date(t.StartDate).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' }) : '--/--'} → <strong className="text-gray-700 dark:text-slate-200">{new Date(t.DueDate).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' })}</strong>
                                                                                            </span>
                                                                                        </span>
                                                                                        {(() => {
                                                                                            const now = new Date(); now.setHours(0,0,0,0);
                                                                                            const due = new Date(t.DueDate); due.setHours(0,0,0,0);
                                                                                            const diff = Math.round((due.getTime() - now.getTime()) / 86400000);
                                                                                            if (diff < 0) return <span className="text-[9px] text-red-500 dark:text-red-400 font-bold">Quá hạn {Math.abs(diff)} ngày</span>;
                                                                                            if (diff === 0) return <span className="text-[9px] text-orange-500 dark:text-orange-400 font-bold">Hôm nay!</span>;
                                                                                            if (diff <= 3) return <span className="text-[9px] text-orange-500 dark:text-orange-400">Còn {diff} ngày</span>;
                                                                                            if (diff <= 7) return <span className="text-[9px] text-blue-500 dark:text-blue-400">Còn {diff} ngày</span>;
                                                                                            return null;
                                                                                        })()}
                                                                                    </span>
                                                                                ) : <span className="text-gray-300 dark:text-slate-600">---</span>}
                                                                            </td>

                                                                            {/* Priority */}
                                                                            <td className="px-2 py-2 text-center">
                                                                                {t.Priority ? (
                                                                                    <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border ${getPriorityColor(t.Priority)}`}>
                                                                                        <Flag className="w-2.5 h-2.5 shrink-0" />
                                                                                        {t.Priority}
                                                                                    </span>
                                                                                ) : <span className="text-gray-300 dark:text-slate-600 text-xs">---</span>}
                                                                            </td>
                                                                            
                                                                            {/* Upload Attachment */}
                                                                            <td className="px-2 py-2 text-center">
                                                                                <div className="flex items-center justify-center gap-1">
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            onSetPendingUploadTaskId(t.TaskID);
                                                                                            fileInputRef.current?.click();
                                                                                        }}
                                                                                        disabled={uploadingTaskId === t.TaskID}
                                                                                        className={`p-1 rounded transition-colors ${uploadingTaskId === t.TaskID
                                                                                            ? 'bg-primary-50 text-primary-500 dark:bg-primary-900/30 dark:text-primary-400'
                                                                                            : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-blue-400'
                                                                                            }`}
                                                                                        title="Tải tài liệu hoàn thành"
                                                                                    >
                                                                                        {uploadingTaskId === t.TaskID
                                                                                            ? <div className="w-3.5 h-3.5 border-2 border-primary-300 border-t-amber-600 rounded-full animate-spin" />
                                                                                            : <Upload className="w-3.5 h-3.5" />
                                                                                        }
                                                                                    </button>
                                                                                    {(attachmentCounts[t.TaskID] || 0) > 0 && (
                                                                                        <span className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-700 font-bold">
                                                                                            <Paperclip className="w-2.5 h-2.5" />
                                                                                            {attachmentCounts[t.TaskID]}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                            
                                                                            {/* Navigate to Task Detail */}
                                                                            <td className="px-2 py-2 text-center">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        navigate(`/tasks/${t.TaskID}`);
                                                                                    }}
                                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-50 dark:hover:bg-slate-700 rounded text-blue-500 dark:text-blue-400"
                                                                                    title="Xem chi tiết công việc"
                                                                                >
                                                                                    <ExternalLink className="w-3 h-3" />
                                                                                </button>
                                                                            </td>
                                                                            
                                                                            {/* Delete Task */}
                                                                            <td className="px-2 py-2 text-center">
                                                                                <button
                                                                                    onClick={(e) => onDeleteTask(e, t.TaskID, t.Title)}
                                                                                    disabled={deletingTaskId === t.TaskID}
                                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-gray-300 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50"
                                                                                    title="Xóa công việc này"
                                                                                >
                                                                                    {deletingTaskId === t.TaskID
                                                                                        ? <div className="w-3 h-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                                                                                        : <Trash2 className="w-3 h-3" />
                                                                                    }
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                        
                                                                        {/* Subtask Row */}
                                                                        {t.SubTasks && t.SubTasks.length > 0 && expandedMasterTasks[t.TaskID] && (
                                                                            <tr className="bg-[#FAF8F5] dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-700/50">
                                                                                <td></td>
                                                                                <td colSpan={8} className="p-3">
                                                                                    <div className="pl-4 sm:pl-8 border-l-2 border-primary-200 dark:border-slate-600">
                                                                                        <h6 className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 mb-2 tracking-wider flex items-center gap-1">
                                                                                            <ListChecks className="w-3 h-3" /> Công việc con ({t.SubTasks.length})
                                                                                        </h6>
                                                                                        <div className="space-y-1.5">
                                                                                            {t.SubTasks.map(sub => (
                                                                                                <div key={sub.SubTaskID} className="flex items-center gap-2 text-xs py-1.5 px-2 hover:bg-white dark:hover:bg-slate-700/50 rounded-lg border border-transparent hover:border-gray-100 dark:hover:border-slate-600 transition-colors">
                                                                                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${sub.Status === 'Done' ? 'bg-emerald-500' : sub.Status === 'InProgress' ? 'bg-orange-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
                                                                                                    <span className={`flex-1 font-medium ${sub.Status === 'Done' ? 'text-gray-400 dark:text-slate-400 line-through' : 'text-gray-700 dark:text-slate-300'}`}>
                                                                                                        {sub.Title}
                                                                                                    </span>
                                                                                                    <div className="flex items-center gap-3 shrink-0 text-[10px]">
                                                                                                        {sub.AssigneeID ? (
                                                                                                            <span className="flex items-center gap-1 text-gray-500 dark:text-slate-400 max-w-[130px] truncate" title={employeeNameMap[sub.AssigneeID] || sub.AssigneeID}>
                                                                                                                <User className="w-3 h-3 shrink-0 text-gray-400" />
                                                                                                                {employeeNameMap[sub.AssigneeID] || sub.AssigneeID}
                                                                                                            </span>
                                                                                                        ) : (
                                                                                                            <span className="text-[10px] text-gray-400 italic">Chưa chỉ định</span>
                                                                                                        )}
                                                                                                        {sub.DueDate && (
                                                                                                            <span className="flex items-center gap-1 text-gray-500 dark:text-slate-400 font-medium">
                                                                                                                <Calendar className="w-3 h-3 shrink-0" />
                                                                                                                {new Date(sub.DueDate).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' })}
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                        </React.Fragment>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                    {/* Empty state */}
                                                    {linkedTasks.length === 0 && (
                                                        <p className="text-xs text-gray-400 dark:text-slate-400 mt-2 italic">
                                                            Chưa có công việc. Bấm 'Tạo KH tổng thể' hoặc 'Thêm' để tạo công việc mới.
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
