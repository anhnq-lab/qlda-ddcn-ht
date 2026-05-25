import React from 'react';
import { Task, TaskStatus } from '@/types';
import { isTaskInStep } from '@/lib/progressCalculator';
import { CheckCircle2, Circle, Clock, ChevronRight, Calendar, AlertTriangle, ListPlus, Info } from 'lucide-react';

interface PhaseData {
    id: string;
    title: string;
    description: string;
    items: { id: string; title: string; code: string }[];
}

interface PhaseProgressCardProps {
    phase: PhaseData;
    tasks: Task[];
    isExpanded: boolean;
    onToggle: () => void;
    onBulkCreatePhase?: () => void;
    isBulkCreatingPhase?: boolean;
    phaseTotalSubTasks?: number;
}

export const PhaseProgressCard: React.FC<PhaseProgressCardProps> = ({
    phase,
    tasks,
    isExpanded,
    onToggle,
    onBulkCreatePhase,
    isBulkCreatingPhase,
    phaseTotalSubTasks = 0
}) => {
    // Calculate phase progress — dùng isTaskInStep (FK + stepCode fallback)
    const phaseTasks = tasks.filter(t =>
        phase.items.some(item => isTaskInStep(t, {
            id: item.code,
            code: (item as any).stepCode ?? item.code,
        }))
    );

    const totalItems = phase.items.length;
    const completedItems = phase.items.filter(item => {
        const stepDef = { id: item.code, code: (item as any).stepCode ?? item.code };
        const itemTasks = phaseTasks.filter(t => isTaskInStep(t, stepDef));
        return itemTasks.length > 0 && itemTasks.every(t => t.Status === TaskStatus.Done);
    }).length;

    const inProgressItems = phase.items.filter(item => {
        const stepDef = { id: item.code, code: (item as any).stepCode ?? item.code };
        const itemTasks = phaseTasks.filter(t => isTaskInStep(t, stepDef));
        return itemTasks.some(t => t.Status === TaskStatus.InProgress || t.Status === TaskStatus.Review);
    }).length;

    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Calculate phase date range
    const allStartDates = phaseTasks
        .filter(t => t.StartDate)
        .map(t => new Date(t.StartDate!).getTime())
        .filter(d => !isNaN(d));
    const allDueDates = phaseTasks
        .filter(t => t.DueDate)
        .map(t => new Date(t.DueDate).getTime())
        .filter(d => !isNaN(d));

    const phaseStartDate = allStartDates.length > 0 ? new Date(Math.min(...allStartDates)) : null;
    const phaseEndDate = allDueDates.length > 0 ? new Date(Math.max(...allDueDates)) : null;

    // Calculate days status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let daysInfo = { label: '', color: '', isOverdue: false };

    if (phaseEndDate && completedItems < totalItems) {
        const diffDays = Math.ceil((phaseEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            daysInfo = { label: `Quá hạn ${Math.abs(diffDays)}n`, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30', isOverdue: true };
        } else if (diffDays <= 7) {
            daysInfo = { label: `Còn ${diffDays}n`, color: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30', isOverdue: false };
        } else if (diffDays <= 30) {
            daysInfo = { label: `Còn ${diffDays}n`, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30', isOverdue: false };
        }
    }

    // Determine phase status
    let phaseStatus: 'todo' | 'in_progress' | 'done' = 'todo';
    if (completedItems === totalItems && totalItems > 0) {
        phaseStatus = 'done';
    } else if (inProgressItems > 0 || completedItems > 0) {
        phaseStatus = 'in_progress';
    }

    const statusConfig = {
        todo: {
            icon: Circle,
            color: 'text-gray-400 dark:text-slate-400',
            bgColor: 'bg-gray-100 dark:bg-slate-700',
            progressColor: 'from-gray-300 to-gray-400',
            borderColor: 'border-l-gray-300 dark:border-l-slate-600'
        },
        in_progress: {
            icon: Clock,
            color: 'text-primary-700 dark:text-warning-400',
            bgColor: 'bg-warning-100 dark:bg-warning-900/30',
            progressColor: 'from-primary-500 to-primary-600',
            borderColor: 'border-l-yellow-500'
        },
        done: {
            icon: CheckCircle2,
            color: 'text-primary-600 dark:text-primary-400',
            bgColor: 'bg-primary-100 dark:bg-primary-900/30',
            progressColor: 'from-primary-500 to-primary-600',
            borderColor: 'border-l-amber-500'
        }
    };

    const config = statusConfig[phaseStatus];
    const StatusIcon = config.icon;

    return (
        <div className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border-l-4 ${config.borderColor}`}>
            {/* Header - py-2 px-4 giúp thanh giai đoạn mỏng nhẹ */}
            <div
                className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Status Icon - Thu nhỏ p-1.5 */}
                    <div className={`p-1.5 rounded-lg ${config.bgColor} shrink-0`}>
                        <StatusIcon className={`w-4 h-4 ${config.color}`} />
                    </div>

                    {/* Title, Date & Mô tả ẩn hiện bằng Hover */}
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex items-center gap-2 group/title relative">
                            <h4 className="font-bold text-gray-800 dark:text-slate-200 text-xs sm:text-sm">
                                {phase.title}
                            </h4>
                            {/* Icon Info hiển thị mô tả giai đoạn khi hover */}
                            <div className="relative group cursor-help text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                                <Info className="w-3.5 h-3.5 hidden group-hover/title:block" />
                                <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block bg-slate-900 text-white text-[10px] rounded p-2.5 shadow-lg z-50 w-64 pointer-events-none normal-case font-normal leading-tight">
                                    {phase.description}
                                </div>
                            </div>
                        </div>

                        {/* Date Range Badge */}
                        {phaseStartDate && phaseEndDate && (
                            <span className="hidden md:flex items-center gap-1 text-[9px] text-gray-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 shrink-0">
                                <Calendar className="w-2.5 h-2.5" />
                                {phaseStartDate.toLocaleDateString('vi-VN')} → {phaseEndDate.toLocaleDateString('vi-VN')}
                            </span>
                        )}
                        {/* Days Remaining Badge */}
                        {daysInfo.label && (
                            <span className={`hidden md:flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${daysInfo.color}`}>
                                {daysInfo.isOverdue && <AlertTriangle className="w-2.5 h-2.5" />}
                                {daysInfo.label}
                            </span>
                        )}
                    </div>

                    {/* Progress Stats */}
                    <div className="hidden sm:flex items-center gap-4 shrink-0 mr-2">
                        {/* Bulk Create Phase Button */}
                        {onBulkCreatePhase && phaseTotalSubTasks > 0 && (() => {
                            const phaseTaskCount = phaseTasks.length;
                            const allCreated = phaseTaskCount >= phaseTotalSubTasks;
                            return (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onBulkCreatePhase(); }}
                                    disabled={isBulkCreatingPhase || allCreated}
                                    className={`px-2 py-1 text-[9px] font-semibold rounded-lg flex items-center gap-1 transition-all shrink-0 ${allCreated
                                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-700 cursor-default'
                                        : isBulkCreatingPhase
                                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-700 cursor-wait'
                                            : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                                        }`}
                                    title={allCreated ? 'Đã tạo tất cả công việc cho giai đoạn' : `Tạo ${phaseTotalSubTasks} công việc cho giai đoạn này`}
                                >
                                    {isBulkCreatingPhase ? (
                                        <>
                                            <div className="w-2.5 h-2.5 border border-primary-300 border-t-amber-600 rounded-full animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : allCreated ? (
                                        <>
                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                            Đã tạo {phaseTaskCount} việc
                                        </>
                                    ) : (
                                        <>
                                            <ListPlus className="w-2.5 h-2.5" />
                                            Tạo {phaseTotalSubTasks - phaseTaskCount}/{phaseTotalSubTasks} việc
                                        </>
                                    )}
                                </button>
                            );
                        })()}

                        {/* Mini Progress (Horizontal layout) */}
                        <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden shrink-0">
                                <div
                                    className={`h-full bg-gradient-to-r ${config.progressColor} transition-all duration-500`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className={`text-xs font-black ${config.color} tabular-nums shrink-0`}>
                                {progress}%
                            </span>
                        </div>

                        {/* Item Counter (Horizontal layout) */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shrink-0">
                            <span className="text-xs font-black text-gray-700 dark:text-slate-300 tabular-nums">
                                {completedItems}/{totalItems}
                            </span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide shrink-0">
                                hoàn thành
                            </span>
                        </div>
                    </div>
                </div>

                {/* Expand Icon */}
                <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                />
            </div>

            {/* Mobile Progress Bar */}
            <div className="sm:hidden px-4 pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${config.progressColor} transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className={`text-[10px] font-bold ${config.color} tabular-nums`}>
                        {completedItems}/{totalItems}
                    </span>
                </div>
                {/* Mobile Date Range */}
                {phaseStartDate && phaseEndDate && (
                    <div className="flex items-center gap-1 text-[9px] text-gray-400 dark:text-slate-400 mt-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {phaseStartDate.toLocaleDateString('vi-VN')} → {phaseEndDate.toLocaleDateString('vi-VN')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhaseProgressCard;
