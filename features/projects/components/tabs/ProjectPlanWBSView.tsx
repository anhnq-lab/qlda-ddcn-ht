import React from 'react';
import { 
    ChevronDown, ChevronRight, Plus, Clock, AlignLeft, 
    Upload, Paperclip, ExternalLink, Trash2, Play, 
    CheckCircle2, ListChecks, Users, Layers, Circle, 
    Calendar, Flag, User, AlertCircle, X, ListPlus, FileText,
    Building2, Timer, Eye, Info
} from 'lucide-react';
import { ProgressBadge } from '../ProgressSlider';
import { LegalReferenceLink } from '@/components/common/LegalReferenceLink';
import { PhaseProgressCard } from '../PhaseProgressCard';
import { Task, TaskStatus } from '@/types';
import { isTaskInStep } from '@/lib/progressCalculator';
import { getPriorityColor, isOverdue, getStatusConfig, formatDateShort } from '../../utils/taskHelpers';
import type { PhaseItem } from '../../hooks/useWorkflowPhases';
import { RaciBadges } from '@/features/workflows/components/RaciBadges';

const buildRaciSummary = (raciList: any[] | undefined) => {
    const summary: any = { R: [], A: [], C: [], I: [] };
    if (!raciList) return summary;
    raciList.forEach(r => {
        if (r.raci_type && summary[r.raci_type]) {
            summary[r.raci_type].push(r.stakeholder_code);
        }
    });
    return summary;
};

const RaciHoverBadge: React.FC<{ raciList: any[] | undefined }> = ({ raciList }) => {
    const [showAll, setShowAll] = React.useState(false);
    const summary = React.useMemo(() => buildRaciSummary(raciList), [raciList]);
    const rCodes = summary.R || [];

    return (
        <div 
            className="relative"
            onMouseEnter={() => setShowAll(true)}
            onMouseLeave={() => setShowAll(false)}
        >
            {/* Chỉ hiển thị R */}
            {rCodes.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 cursor-help transition-all hover:bg-blue-100 dark:hover:bg-blue-900/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    R: {rCodes.join(', ')}
                </span>
            ) : (
                <span className="text-[10px] text-gray-400 dark:text-slate-500 italic cursor-help">—</span>
            )}

            {/* Khi hover hiện cả 4 cột RACI */}
            {showAll && raciList && raciList.length > 0 && (
                <div className="absolute left-0 bottom-full mb-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-xl p-3 z-[110] w-64 space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-150">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-700 pb-1.5 mb-1.5">
                        Phân công trách nhiệm (RACI)
                    </div>
                    {(['R', 'A', 'C', 'I'] as const).map(type => {
                        const codes = summary[type] || [];
                        const colors = type === 'R' ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20' 
                                     : type === 'A' ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' 
                                     : type === 'C' ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20' 
                                     : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800';
                        return (
                            <div key={type} className="text-[10.5px] flex items-center justify-between py-0.5">
                                <span className={`px-1.5 py-0.5 rounded font-bold text-[9.5px] ${colors}`}>{type}</span>
                                <span className="text-gray-700 dark:text-slate-300 font-semibold text-right truncate max-w-[180px]">
                                    {codes.length > 0 ? codes.join(', ') : '—'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

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
    onDeletePlan?: () => Promise<void>;
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
    onDeletePlan,
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
    const [expandedSteps, setExpandedSteps] = React.useState<Record<string, boolean>>({});
    const [isDeletingPlan, setIsDeletingPlan] = React.useState(false);
    const [deletePlanConfirm, setDeletePlanConfirm] = React.useState(false);

    React.useEffect(() => {
        if (!deletePlanConfirm) return;
        const t = setTimeout(() => setDeletePlanConfirm(false), 3000);
        return () => clearTimeout(t);
    }, [deletePlanConfirm]);

    const handleDeletePlanClick = async () => {
        if (!onDeletePlan) return;
        if (!deletePlanConfirm) { setDeletePlanConfirm(true); return; }
        setDeletePlanConfirm(false);
        setIsDeletingPlan(true);
        try { await onDeletePlan(); } finally { setIsDeletingPlan(false); }
    };

    const toggleStep = (stepCode: string) => {
        setExpandedSteps(prev => ({
            ...prev,
            [stepCode]: prev[stepCode] === false ? true : false
        }));
    };

    return (
        <div className="space-y-4 relative">
            {/* Header - py-2 px-3 giúp gọn gàng trên 1 hàng */}
            <div className="bg-gradient-to-r from-primary-50 to-warning-50 dark:from-transparent dark:to-transparent dark:bg-slate-800 border border-primary-200 dark:border-slate-700 py-2 px-3 rounded-xl flex justify-between items-center shadow-sm text-xs">
                <div className="flex items-center gap-2">
                    <h3 className="text-primary-900 dark:text-slate-100 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                        <FileText className="w-4 h-4 text-primary-600 dark:text-slate-300 shrink-0" />
                        Kế hoạch thực hiện dự án
                    </h3>
                    {/* Chú thích pháp lý ẩn dưới icon Info để sạch giao diện */}
                    <div className="relative group cursor-help text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 shrink-0">
                        <Info className="w-3.5 h-3.5" />
                        <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block bg-slate-900 text-white text-[10px] rounded p-2 shadow-lg z-50 w-64 pointer-events-none normal-case font-normal leading-tight">
                            <LegalReferenceLink text="Căn cứ theo Điều 4, Nghị định 175/NĐ-CP về trình tự đầu tư xây dựng." />
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                        onClick={() => navigate('/quy-trinh')}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all shadow-sm text-cyan-600 bg-cyan-50 hover:bg-cyan-100 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700 dark:hover:bg-cyan-900/50"
                        title="Xem chi tiết các quy trình mẫu"
                    >
                        <ExternalLink className="w-3 h-3" />
                        <span>Quy trình gốc</span>
                    </button>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
                        className="flex items-center justify-center w-7 h-7 text-xs font-bold rounded-lg border transition-all shadow-sm text-gray-600 bg-white dark:bg-slate-800 hover:bg-slate-50 border-gray-200 dark:text-gray-300 dark:border-slate-700 dark:hover:bg-slate-700"
                        title="Tải lại dữ liệu (Xóa Cache)"
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
                    {/* Xóa toàn bộ KH dự án Button — xóa tất cả bước trong project_plan_items */}
                    {onDeletePlan && phases.length > 0 && (
                        <button
                            onClick={handleDeletePlanClick}
                            disabled={isDeletingPlan}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-sm ${
                                isDeletingPlan
                                    ? 'text-gray-400 bg-slate-50 dark:bg-slate-800 border-gray-200 cursor-wait'
                                    : deletePlanConfirm
                                        ? 'text-white bg-red-600 border-red-700 animate-pulse hover:bg-red-700'
                                        : 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200 dark:border-orange-800 dark:bg-orange-900/30 hover:border-orange-300'
                            }`}
                            title={deletePlanConfirm ? 'Bấm lần nữa để xác nhận xóa toàn bộ kế hoạch dự án!' : 'Xóa toàn bộ kế hoạch dự án (các bước quy trình)'}
                        >
                            {isDeletingPlan ? (
                                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : deletePlanConfirm ? (
                                <>
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Xác nhận
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Xóa KH dự án</span>
                                </>
                            )}
                        </button>
                    )}
                    {/* Xóa tất cả công việc Button */}
                    {tasks.length > 0 && (
                        <button
                            onClick={onDeleteAllTasks}
                            disabled={isDeletingAll}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-sm ${isDeletingAll
                                    ? 'text-gray-400 bg-slate-50 dark:bg-slate-800 border-gray-200 cursor-wait'
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
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors shadow-sm"
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

            {/* Global Task Header - sticky for better UX */}
            {tasks.length > 0 && (
                <div className="hidden lg:flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 py-1.5 shadow-sm sticky top-0 z-10 w-full backdrop-blur-sm bg-white/90 dark:bg-slate-800" style={{ paddingLeft: '76px', paddingRight: '80px' }}>
                    <div className="flex-1 min-w-0 px-2 text-left">Công việc</div>
                    <div className="w-20 shrink-0 px-2 text-center">Công việc con</div>
                    <div className="w-36 shrink-0 px-2 text-left">Vai trò phụ trách</div>
                    <div className="w-44 shrink-0 px-2 text-left">Thời hạn thực hiện</div>
                    <div className="w-32 shrink-0 px-2 text-left">Trạng thái</div>
                </div>
            )}

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
                        {expandedPhases[phase.id] && phase.items.length === 0 && (
                            <div className="mt-2 ml-4 p-5 bg-gradient-to-br from-primary-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-primary-100/50 dark:border-slate-700/50 text-center shadow-sm">
                                <div className="w-12 h-12 bg-primary-100 dark:bg-slate-700 text-primary-500 dark:text-primary-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <h4 className="text-primary-900 dark:text-slate-200 font-semibold mb-1">
                                    Kế hoạch chưa được khởi tạo
                                </h4>
                                <p className="text-xs text-primary-600/70 dark:text-slate-400 max-w-sm mx-auto">
                                    Bấm vào "Tạo kế hoạch tổng thể" ở tiêu đề để tự động phân bổ tài nguyên, quy trình và các đầu việc cần thiết.
                                </p>
                            </div>
                        )}
                        {expandedPhases[phase.id] && phase.items.length > 0 && (
                            <div className="mt-2 ml-4 border-l-2 border-gray-200 dark:border-slate-700 pl-4 space-y-3">
                                {(phase.subProcesses || [{ id: '0', title: '', fullTitle: '', items: phase.items }]).map((sp: any) => (
                                    <div key={sp.id}>
                                        {/* Sub-process Header */}
                                        {sp.fullTitle && (
                                            <button
                                                onClick={() => onSetExpandedPhases(prev => ({ ...prev, [`sp_${sp.id}`]: !prev[`sp_${sp.id}`] }))}
                                                className="w-full flex items-center gap-2 px-3 py-2 mb-1 rounded-lg bg-warning-50/80 dark:bg-warning-900/20 border border-warning-200/60 dark:border-warning-700/40 hover:bg-warning-100/80 dark:hover:bg-warning-900/30 transition-colors group/sp"
                                            >
                                                {expandedPhases[`sp_${sp.id}`] === false
                                                    ? <ChevronRight className="w-4 h-4 text-warning-500 shrink-0" />
                                                    : <ChevronDown className="w-4 h-4 text-warning-500 shrink-0" />
                                                }
                                                <Layers className="w-4 h-4 text-warning-600 dark:text-warning-400 shrink-0" />
                                                <span className="text-sm font-semibold text-warning-800 dark:text-warning-300 text-left">
                                                    {sp.fullTitle}
                                                </span>
                                                <span className="text-[10px] text-warning-500 dark:text-warning-400 ml-auto shrink-0">
                                                    {sp.items.length} bước
                                                </span>
                                            </button>
                                        )}

                                        {/* Steps inside sub-process */}
                                        {expandedPhases[`sp_${sp.id}`] !== false && (
                                        <div className={`space-y-2 ${sp.fullTitle ? 'ml-3 border-l border-warning-200/40 dark:border-warning-700/30 pl-3' : ''}`}>
                                        {sp.items.map((item: any) => {
                                            // Use isTaskInStep for FK-first matching:
                                            //   1st: task.ProjectPlanItemID === item.code (project_plan_item FK)
                                            //   2nd: task.MonthlyPlanItemID === item.code (legacy)
                                            //   3rd: compareStepCode(task.StepCode, item.stepCode)
                                            const stepDef = { id: item.code, code: item.stepCode ?? item.code };
                                            const linkedTasks = filteredTasks
                                                .filter(t => isTaskInStep(t, stepDef))
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
                                            const taskWithRole = linkedTasks.find(t => t.Metadata?.assignee_role || (t as any)?.metadata?.assignee_role);
                                            const displayRole = item.assigneeRole || taskWithRole?.Metadata?.assignee_role || (taskWithRole as any)?.metadata?.assignee_role;

                                            const stepBorderColor = isParentDone
                                                ? 'border-l-emerald-500'
                                                : isParentActive
                                                    ? 'border-l-blue-500'
                                                    : 'border-l-gray-200 dark:border-l-slate-700';

                                            return (
                                                <div key={item.id} className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 hover:border-gray-200 dark:hover:border-slate-600 transition-colors group border-l-4 ${stepBorderColor}`}>
                                                    {/* Step Header Row */}
                                                    <div className="flex items-center gap-3">
                                                        {/* Chevron Toggle */}
                                                        <button
                                                            onClick={() => toggleStep(item.code)}
                                                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors shrink-0"
                                                            title={expandedSteps[item.code] === false ? "Mở rộng danh sách công việc" : "Thu gọn danh sách công việc"}
                                                        >
                                                            {expandedSteps[item.code] === false ? (
                                                                <ChevronRight className="w-4 h-4" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4" />
                                                            )}
                                                        </button>

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

                                                        {/* Clickable Area: Title & Meta Columns -> click to view step detail */}
                                                        <div 
                                                            className="flex-1 flex items-center justify-between min-w-0 cursor-pointer"
                                                            onClick={() => onStepClick && onStepClick(item, agg)}
                                                            title="Bấm để xem chi tiết bước quy trình"
                                                        >
                                                            {/* Title */}
                                                            <div className="flex-1 min-w-0 pr-4">
                                                                <div className="flex items-center gap-2">
                                                                    <h5 className={`text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 text-left ${isParentDone ? 'text-gray-900 dark:text-slate-100' : 'text-gray-700 dark:text-slate-300'}`}>
                                                                        {item.title}
                                                                    </h5>
                                                                    {/* Progress Badge inline if needed */}
                                                                    {agg && agg.progress > 0 && (
                                                                        <ProgressBadge value={agg.progress} size="sm" />
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Tabular Meta Container (Right Aligned) */}
                                                            <div className="hidden lg:flex items-center shrink-0 text-xs font-medium text-gray-500 dark:text-slate-400 mr-2">
                                                                {/* Count Badge */}
                                                                <div className="w-20 shrink-0 px-2 flex justify-center">
                                                                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded font-medium ${linkedTasks.length === 0
                                                                        ? 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                                                                        : completedCount === linkedTasks.length
                                                                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                                                                            : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                                                                        }`}>
                                                                        {completedCount}/{linkedTasks.length} việc
                                                                    </span>
                                                                </div>

                                                                {/* Assignee / Phụ trách (Department) / RACI */}
                                                                <div className="w-36 shrink-0 px-2 text-left flex items-center">
                                                                    {item.raci && item.raci.length > 0 ? (
                                                                        <RaciHoverBadge raciList={item.raci} />
                                                                    ) : displayRole ? (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 border border-warning-200 dark:border-warning-700">
                                                                            <Building2 className="w-3 h-3 text-warning-500" />
                                                                            {displayRole}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] text-gray-400 italic">Chưa xác định</span>
                                                                    )}
                                                                </div>

                                                                {/* Dates (Start -> Due) */}
                                                                <div className="w-44 shrink-0 px-2 text-left text-[10px] leading-tight whitespace-nowrap text-gray-500 dark:text-slate-400" title={item.startDate && item.dueDate ? `${formatDateShort(item.startDate)} - ${formatDateShort(item.dueDate)}` : 'Chưa xác định'}>
                                                                    {item.startDate || item.dueDate ? (
                                                                        <span className="flex items-center gap-1">
                                                                            <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                                                                            <span>
                                                                                {item.startDate ? formatDateShort(item.startDate) : '--/--'} &rarr; <strong className="text-gray-700 dark:text-slate-200">{item.dueDate ? formatDateShort(item.dueDate) : '--/--'}</strong>
                                                                                {item.estimatedDays && (
                                                                                    <span className="text-[9px] font-bold text-primary-500 dark:text-primary-400 ml-1">
                                                                                        ({item.estimatedDays}n)
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-400 dark:text-slate-500">--/--</span>
                                                                    )}
                                                                </div>

                                                                {/* Status */}
                                                                <div className="w-32 shrink-0 px-2 flex justify-start">
                                                                    {(() => {
                                                                        const statusCfg = getStatusConfig(parentStatus);
                                                                        return (
                                                                            <span className={`inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded font-bold ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                                                                                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                                                                {statusCfg.label}
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
                                                                {displayRole && (
                                                                    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 border border-warning-200 dark:border-warning-700 inline-block w-fit ml-auto">
                                                                        {displayRole}
                                                                    </span>
                                                                )}
                                                                {(item.startDate || item.dueDate || agg?.startDate || agg?.dueDate) && (
                                                                    <span className="text-[10px] text-gray-500">
                                                                        {item.startDate ? formatDateShort(item.startDate) : (agg?.startDate ? formatDateShort(agg.startDate) : '--/--')} - {item.dueDate ? formatDateShort(item.dueDate) : (agg?.dueDate ? formatDateShort(agg.dueDate) : '--/--')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex items-center gap-1.5 shrink-0 z-20">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onAddTask(item.title, item.code);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded border border-blue-200 dark:border-blue-800 flex items-center gap-1"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                                <span className="hidden sm:inline">Thêm</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Task Table (Compact) */}
                                                    {expandedSteps[item.code] !== false && linkedTasks.length > 0 && (
                                                        <div className="mt-3 border border-gray-200 dark:border-slate-700 rounded-lg overflow-x-auto">
                                                            <table className="w-full text-xs box-border">
                                                                <thead className="h-0">
                                                                    <tr className="h-0">
                                                                        <th className="w-8 p-0 border-0 h-0"></th>
                                                                        <th className="min-w-[200px] p-0 border-0 h-0"></th>
                                                                        <th className="w-24 p-0 border-0 h-0"></th>
                                                                        <th className="w-32 hidden sm:table-cell p-0 border-0 h-0"></th>
                                                                        <th className="w-28 hidden sm:table-cell p-0 border-0 h-0"></th>
                                                                        <th className="w-20 p-0 border-0 h-0"></th>
                                                                        <th className="w-16 p-0 border-0 h-0"></th>
                                                                        <th className="w-8 p-0 border-0 h-0"></th>
                                                                        <th className="w-8 p-0 border-0 h-0"></th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                                                                    {linkedTasks.map(t => (
                                                                        <React.Fragment key={t.TaskID}>
                                                                        <tr
                                                                            onClick={() => onEditTask(t)}
                                                                            className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-slate-50 ${isOverdue(t) && !(t.Status === TaskStatus.Done || (t.Status as any) === 'Done' || (t.Status as any) === 'done') ? 'bg-red-50/50 dark:bg-red-900/20' : ''}`}
                                                                        >
                                                                            {/* Status Dot */}
                                                                            <td className="px-2 py-2 text-center">
                                                                                <button
                                                                                    onClick={(e) => onQuickStatusChange(e, t)}
                                                                                    className={`w-4 h-4 rounded-full transition-transform hover:scale-125 focus:outline-none ring-2 ring-offset-1 dark:ring-offset-slate-800 ${t.Status === TaskStatus.Done || (t.Status as any) === 'Done' || (t.Status as any) === 'done' ? 'bg-emerald-500 ring-emerald-200 dark:ring-emerald-700' :
                                                                                        t.Status === TaskStatus.Review || (t.Status as any) === 'Review' || (t.Status as any) === 'review' ? 'bg-primary-500 ring-primary-200 dark:ring-primary-700' :
                                                                                            t.Status === TaskStatus.InProgress || (t.Status as any) === 'InProgress' || (t.Status as any) === 'in_progress' ? 'bg-primary-500 ring-primary-200 dark:ring-primary-700' :
                                                                                                'bg-gray-200 dark:bg-slate-600 ring-gray-100 dark:ring-slate-500 hover:bg-gray-300 dark:hover:bg-slate-500'
                                                                                        }`}
                                                                                    title="Click để chuyển trạng thái"
                                                                                />
                                                                            </td>

                                                                            {/* Title */}
                                                                            <td className={`px-2 py-2 font-medium ${t.Status === TaskStatus.Done || (t.Status as any) === 'Done' || (t.Status as any) === 'done' ? 'text-gray-400 dark:text-slate-400' :
                                                                                isOverdue(t) ? 'text-red-700 dark:text-red-400' :
                                                                                    (t.Status as any) === 'Review' || (t.Status as any) === 'review' ? 'text-primary-700 dark:text-primary-400' :
                                                                                        (t.Status as any) === 'InProgress' || (t.Status as any) === 'in_progress' ? 'text-warning-700 dark:text-warning-400' :
                                                                                            'text-gray-700 dark:text-slate-300'
                                                                                }`}>
                                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                                    {t.SubTasks && t.SubTasks.length > 0 && (
                                                                                        <button
                                                                                            onClick={(e) => onToggleMasterTask(e, t.TaskID)}
                                                                                            className="p-0.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition-colors"
                                                                                            title={expandedMasterTasks[t.TaskID] ? "Thu gọn công việc thuộc bước" : "Hiện công việc thuộc bước"}
                                                                                        >
                                                                                            {expandedMasterTasks[t.TaskID] ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg> : <ChevronDown className="w-3 h-3" />}
                                                                                        </button>
                                                                                    )}
                                                                                    <span>{t.Title.replace(/^[\d\.\:\s]+/, '').trim()}</span>
                                                                                    {t.IsCritical && (
                                                                                        <span className="px-1 py-0.5 bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-400 text-[8px] rounded font-bold shrink-0">
                                                                                            CP
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </td>

                                                                            {/* Progress */}
                                                                            <td className="px-2 py-2 text-center">
                                                                                <ProgressBadge
                                                                                    value={t.ProgressPercent || (t.Status === TaskStatus.Done || (t.Status as any) === 'Done' || (t.Status as any) === 'done' ? 100 : 0)}
                                                                                    size="sm"
                                                                                />
                                                                            </td>

                                                                            {/* Assignee */}
                                                                            <td className="px-2 py-2 text-gray-500 dark:text-slate-400 max-w-[200px]">
                                                                                {t.AssigneeID && employeeNameMap[t.AssigneeID] ? (
                                                                                    <div className="flex items-center gap-1 truncate" title={employeeNameMap[t.AssigneeID]}>
                                                                                        <User className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                                                                        <span className="truncate text-[11px] font-medium text-gray-700 dark:text-slate-300 whitespace-nowrap">{employeeNameMap[t.AssigneeID]}</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="text-[10px] text-gray-400 italic">Chưa chỉ định</span>
                                                                                )}
                                                                            </td>

                                                                            {/* Due Date + Smart Relative Time */}
                                                                            <td className={`px-2 py-2 ${isOverdue(t) && !(t.Status === TaskStatus.Done || (t.Status as any) === 'Done' || (t.Status as any) === 'done') ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-slate-400'}`}>
                                                                                {t.Status === TaskStatus.Done || (t.Status as any) === 'Done' || (t.Status as any) === 'done' ? (
                                                                                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium" title={t.ActualEndDate ? `Hoàn thành: ${new Date(t.ActualEndDate).toLocaleDateString('vi-VN')}` : 'Đã hoàn thành'}>
                                                                                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                                                                                        {t.ActualEndDate ? new Date(t.ActualEndDate).toLocaleDateString('vi-VN') : (t.DueDate ? new Date(t.DueDate).toLocaleDateString('vi-VN') : 'Hoàn thành')}
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
                                                                                            if (diff === 0) return <span className="text-[9px] text-warning-500 dark:text-warning-400 font-bold">Hôm nay!</span>;
                                                                                            if (diff <= 3) return <span className="text-[9px] text-warning-500 dark:text-warning-400">Còn {diff} ngày</span>;
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
                                                                            <tr className="bg-[#FAF8F5] dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700/50">
                                                                                <td></td>
                                                                                <td colSpan={8} className="p-3">
                                                                                    <div className="pl-4 sm:pl-8 border-l-2 border-primary-200 dark:border-slate-600">
                                                                                        <h6 className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 mb-2 tracking-wider flex items-center gap-1">
                                                                                            <ListChecks className="w-3 h-3" /> Công việc thuộc các bước ({t.SubTasks.length})
                                                                                        </h6>
                                                                                        <div className="space-y-1.5">
                                                                                            {t.SubTasks.map(sub => (
                                                                                                <div key={sub.SubTaskID} className="flex items-center gap-2 text-xs py-1.5 px-2 hover:bg-white dark:hover:bg-slate-50 rounded-lg border border-transparent hover:border-gray-100 dark:hover:border-slate-600 transition-colors">
                                                                                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${(sub.Status as any) === 'Done' || (sub.Status as any) === 'done' ? 'bg-emerald-500' : (sub.Status as any) === 'InProgress' || (sub.Status as any) === 'in_progress' ? 'bg-warning-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
                                                                                                    <span className={`flex-1 font-medium ${(sub.Status as any) === 'Done' || (sub.Status as any) === 'done' ? 'text-gray-400 dark:text-slate-400 line-through' : 'text-gray-700 dark:text-slate-300'}`}>
                                                                                                        {sub.Title.replace(/^[\d\.\:\s]+/, '').trim()}
                                                                                                    </span>
                                                                                                    <div className="flex items-center gap-3 shrink-0 text-[10px]">
                                                                                                        {sub.AssigneeID && employeeNameMap[sub.AssigneeID] ? (
                                                                                                            <span className="flex items-center gap-1 text-gray-500 dark:text-slate-400 w-32 truncate text-[9px] font-medium whitespace-nowrap" title={employeeNameMap[sub.AssigneeID]}>
                                                                                                                <User className="w-3 h-3 shrink-0 text-gray-400" />
                                                                                                                {employeeNameMap[sub.AssigneeID]}
                                                                                                            </span>
                                                                                                        ) : (
                                                                                                            <span className="text-[9px] text-gray-400 italic">Chưa chỉ định</span>
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

                {/* Empty state: no master plan created yet */}
                {phases.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 px-6 bg-gradient-to-br from-primary-50/50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl border-2 border-dashed border-primary-200 dark:border-slate-600">
                        <div className="w-16 h-16 bg-primary-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                            <ListPlus className="w-8 h-8 text-primary-500 dark:text-primary-400" />
                        </div>
                        <h3 className="text-base font-bold text-gray-800 dark:text-slate-200 mb-1">
                            Chưa có kế hoạch tổng thể
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 text-center max-w-sm mb-6">
                            Bấm vào <strong>"Tạo KH tổng thể"</strong> ở trên để tự động phân bổ các giai đoạn, quy trình và công việc theo Nghị định 175/NĐ-CP.
                        </p>
                        <button
                            onClick={() => onOpenPlanModal(
                                { type: 'all' },
                                'Tạo kế hoạch tổng thể',
                                'Hệ thống sẽ tự động phân bổ công việc cho tất cả giai đoạn theo tỷ lệ thời gian'
                            )}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-md hover:shadow-lg"
                        >
                            <ListPlus className="w-4 h-4" />
                            Tạo kế hoạch tổng thể ngay
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
