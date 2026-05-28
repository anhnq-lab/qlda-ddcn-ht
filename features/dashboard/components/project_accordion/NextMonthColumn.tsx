import React from 'react';
import { Calendar, Users, ChevronRight } from 'lucide-react';
import type { ProjectBriefingData } from '../../../../services/DashboardService';

interface Props {
    proj: ProjectBriefingData;
    currentUser: any;
    addingTaskProjectId: string | null;
    newTaskTitle: string;
    onNewTaskTitleChange: (v: string) => void;
    newTaskAssigneeId: string;
    onNewTaskAssigneeChange: (v: string) => void;
    isCreatingTask: boolean;
    onStartAddTask: (id: string) => void;
    onCancelAddTask: () => void;
    onCreateTask: (id: string) => void;
    employees: Array<{ employee_id: string; full_name: string; department?: string }>;
}

export const NextMonthColumn: React.FC<Props> = ({
    proj, currentUser, addingTaskProjectId, newTaskTitle, onNewTaskTitleChange,
    newTaskAssigneeId, onNewTaskAssigneeChange, isCreatingTask,
    onStartAddTask, onCancelAddTask, onCreateTask, employees,
}) => {
    const isAddingHere = addingTaskProjectId === proj.projectId;
    return (
        <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-border pb-1.5">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Kế hoạch tháng tới ({proj.nextMonthTasks.length})</h5>
                </div>
                {currentUser && !isAddingHere && (
                    <button
                        onClick={() => onStartAddTask(proj.projectId)}
                        className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-0.5"
                        aria-label={`Thêm công việc kế hoạch tháng tới cho ${proj.projectName}`}
                    >
                        + Thêm
                    </button>
                )}
            </div>
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {isAddingHere && (
                    <div className="p-2 bg-indigo-50/30 dark:bg-indigo-950/15 border border-indigo-100/50 dark:border-indigo-900/30 rounded-lg space-y-1.5 shadow-sm">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={e => onNewTaskTitleChange(e.target.value)}
                            placeholder="Tên công việc mới..."
                            className="w-full text-xs p-1.5 border border-border rounded bg-bg-surface text-txt-primary focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            autoFocus
                        />
                        <div className="relative">
                            <select
                                value={newTaskAssigneeId}
                                onChange={e => onNewTaskAssigneeChange(e.target.value)}
                                className="appearance-none w-full text-[11px] pl-2 pr-6 py-1.5 border border-border rounded bg-bg-surface text-txt-primary font-medium"
                                aria-label="Chọn cán bộ phụ trách"
                            >
                                <option value="">-- Chọn cán bộ phụ trách --</option>
                                {employees.map(emp => (
                                    <option key={emp.employee_id} value={emp.employee_id}>
                                        {emp.full_name} ({emp.department?.replace('Phòng ', '') || 'N/A'})
                                    </option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-txt-muted pointer-events-none rotate-90" aria-hidden="true" />
                        </div>
                        <div className="flex justify-end gap-1 text-[10px]">
                            <button
                                onClick={onCancelAddTask}
                                disabled={isCreatingTask}
                                className="px-2 py-1 border border-border rounded hover:bg-bg-subtle text-txt-secondary"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => onCreateTask(proj.projectId)}
                                disabled={isCreatingTask || !newTaskTitle.trim() || !newTaskAssigneeId}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-bold"
                            >
                                {isCreatingTask ? 'Đang tạo...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                )}

                {proj.nextMonthTasks.map(t => (
                    <div key={t.id} className="p-2.5 bg-bg-surface border border-border rounded-lg shadow-sm space-y-1 hover:shadow transition-shadow">
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-normal">{t.title}</p>
                        <div className="flex justify-between items-center gap-2">
                            <span className="text-[9px] font-medium text-txt-muted flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {t.assigneeName}
                            </span>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 rounded">
                                Lập kế hoạch
                            </span>
                        </div>
                    </div>
                ))}

                {proj.nextMonthTasks.length === 0 && !isAddingHere && (
                    <p className="text-[10px] italic text-txt-muted text-center py-3 bg-bg-surface rounded-lg border border-border border-dashed">
                        Chưa lập kế hoạch tháng tới
                    </p>
                )}
            </div>
        </div>
    );
};

export default NextMonthColumn;
