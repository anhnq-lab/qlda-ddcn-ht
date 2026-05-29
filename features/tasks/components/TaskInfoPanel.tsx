import React from 'react';
import { Calendar, User, DollarSign, CalendarDays, AlertTriangle } from 'lucide-react';
import { Task } from '../../../types';
import { Avatar } from '../../../components/ui';

interface TaskInfoPanelProps {
    task: Task;
    assignee: any;
    approver: any;
    isOverdue: boolean;
    monthlyPlanItem: any;
}

export const TaskInfoPanel: React.FC<TaskInfoPanelProps> = ({ task, assignee, approver, isOverdue, monthlyPlanItem }) => {
    return (
        <div className="space-y-6">
            {/* Assignee Card */}
            <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm p-4">
                <h3 className="text-xs font-black text-txt-placeholder uppercase tracking-widest mb-5">Phân công</h3>

                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border-subtle">
                    <div className="relative">
                        <Avatar
                            name={assignee?.FullName || 'User'}
                            imageUrl={assignee?.AvatarUrl}
                            size="lg"
                            className="ring-2 ring-white shadow-md object-cover"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-txt-primary">{assignee?.FullName || "Chưa phân công"}</p>
                        <p className="text-xs text-txt-placeholder">{assignee?.Position || assignee?.Department || "N/A"}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-txt-placeholder mb-1.5 flex items-center gap-1 tracking-wider">
                            <Calendar className="w-3 h-3" /> Hạn chót
                        </label>
                        <p className={`text-sm font-semibold px-3 py-2 rounded-xl inline-flex items-center gap-2 ${isOverdue ? 'text-red-600 bg-red-50 ring-1 ring-red-200' : 'text-slate-700 bg-bg-subtle'}`}>
                            {task.DueDate ? new Date(task.DueDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Chưa có'}
                            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />}
                        </p>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-txt-placeholder mb-1.5 flex items-center gap-1 tracking-wider">
                            <User className="w-3 h-3" /> Người phê duyệt
                        </label>
                        <p className="text-sm font-medium text-txt-secondary">
                            {approver?.FullName || "Lãnh đạo Ban"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Monthly Plan Item Link */}
            {monthlyPlanItem && (
                <div className="bg-bg-surface rounded-2xl border border-primary-100 dark:border-primary-900/40 shadow-sm overflow-hidden">
                    <div className="h-0.5 bg-gradient-to-r from-primary-400 to-violet-500" />
                    <div className="p-4">
                        <h3 className="text-xs font-black text-primary-500 dark:text-primary-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <CalendarDays className="w-3.5 h-3.5" />
                            Kế hoạch tháng liên kết
                        </h3>
                        <div className="space-y-2">
                            {/* Plan period */}
                            {monthlyPlanItem.monthly_plan && (
                                <div className="flex items-center gap-2 text-xs">
                                    <Calendar className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                                    <span className="font-semibold text-primary-700 dark:text-primary-300">
                                        Tháng {monthlyPlanItem.monthly_plan.plan_month}/{monthlyPlanItem.monthly_plan.plan_year}
                                    </span>
                                    <span className="text-slate-400">— {monthlyPlanItem.monthly_plan.department_code}</span>
                                </div>
                            )}
                            {/* Task name */}
                            <p className="text-sm font-semibold text-txt-primary leading-snug">
                                {monthlyPlanItem.task_name}
                            </p>
                            {/* Status + deadline note */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {(() => {
                                    const statusMap: Record<string, { label: string; cls: string }> = {
                                        planned:    { label: 'Kế hoạch', cls: 'bg-slate-100 text-slate-500' },
                                        completed:  { label: 'Hoàn thành', cls: 'bg-emerald-50 text-emerald-600' },
                                        incomplete: { label: 'Chưa xong', cls: 'bg-red-50 text-red-500' },
                                        partial:    { label: 'Hoàn thành 1 phần', cls: 'bg-warning-50 text-warning-600' },
                                        deferred:   { label: 'Chuyển sang tháng sau', cls: 'bg-blue-50 text-blue-500' },
                                    };
                                    const s = statusMap[monthlyPlanItem.status] ?? { label: monthlyPlanItem.status, cls: 'bg-slate-100 text-slate-500' };
                                    return (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>
                                            {s.label}
                                        </span>
                                    );
                                })()}
                                {monthlyPlanItem.deadline_note && (
                                    <span className="text-xs text-txt-muted">{monthlyPlanItem.deadline_note}</span>
                                )}
                            </div>
                            {/* Result note */}
                            {monthlyPlanItem.result_note && (
                                <p className="text-xs text-txt-muted italic border-t border-border-subtle pt-2 mt-1">
                                    {monthlyPlanItem.result_note}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
