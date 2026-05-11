import React from 'react';
import { Calendar, User, DollarSign, CalendarDays, AlertTriangle } from 'lucide-react';
import { Task } from '../../../types';

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
            <div className="bg-bg-surface rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-5">Phân công</h3>

                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100 dark:border-slate-700">
                    <div className="relative">
                        <img
                            src={assignee?.AvatarUrl || `https://ui-avatars.com/api/?name=${assignee?.FullName || 'U'}&background=6366f1&color=fff&size=48`}
                            className="w-12 h-12 rounded-xl ring-2 ring-white shadow-md object-cover"
                            alt=""
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{assignee?.FullName || "Chưa phân công"}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-400">{assignee?.Position || assignee?.Department || "N/A"}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 mb-1.5 flex items-center gap-1 tracking-wider">
                            <Calendar className="w-3 h-3" /> Hạn chót
                        </label>
                        <p className={`text-sm font-semibold px-3 py-2 rounded-xl inline-flex items-center gap-2 ${isOverdue ? 'text-red-600 bg-red-50 ring-1 ring-red-200' : 'text-slate-700 bg-bg-subtle'}`}>
                            {task.DueDate ? new Date(task.DueDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Chưa có'}
                            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />}
                        </p>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 mb-1.5 flex items-center gap-1 tracking-wider">
                            <User className="w-3 h-3" /> Người phê duyệt
                        </label>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {approver?.FullName || "Lãnh đạo Ban"}
                        </p>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 mb-1.5 flex items-center gap-1 tracking-wider">
                            <DollarSign className="w-3 h-3" /> Chi phí dự kiến
                        </label>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {task.EstimatedCost ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(task.EstimatedCost) : "Chưa lập dự toán"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Monthly Plan Item Link */}
            {monthlyPlanItem && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-sm overflow-hidden">
                    <div className="h-0.5 bg-gradient-to-r from-indigo-400 to-violet-500" />
                    <div className="p-4">
                        <h3 className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <CalendarDays className="w-3.5 h-3.5" />
                            Kế hoạch tháng liên kết
                        </h3>
                        <div className="space-y-2">
                            {/* Plan period */}
                            {monthlyPlanItem.monthly_plan && (
                                <div className="flex items-center gap-2 text-xs">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                                        Tháng {monthlyPlanItem.monthly_plan.plan_month}/{monthlyPlanItem.monthly_plan.plan_year}
                                    </span>
                                    <span className="text-slate-400">— {monthlyPlanItem.monthly_plan.department_code}</span>
                                </div>
                            )}
                            {/* Task name */}
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                                {monthlyPlanItem.task_name}
                            </p>
                            {/* Status + deadline note */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {(() => {
                                    const statusMap: Record<string, { label: string; cls: string }> = {
                                        planned:    { label: 'Kế hoạch', cls: 'bg-slate-100 text-slate-500' },
                                        completed:  { label: 'Hoàn thành', cls: 'bg-emerald-50 text-emerald-600' },
                                        incomplete: { label: 'Chưa xong', cls: 'bg-red-50 text-red-500' },
                                        partial:    { label: 'Hoàn thành 1 phần', cls: 'bg-amber-50 text-amber-600' },
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
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{monthlyPlanItem.deadline_note}</span>
                                )}
                            </div>
                            {/* Result note */}
                            {monthlyPlanItem.result_note && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 italic border-t border-slate-100 dark:border-slate-700 pt-2 mt-1">
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
