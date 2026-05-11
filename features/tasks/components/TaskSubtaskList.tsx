import React, { useState } from 'react';
import { Plus, CheckCircle2, User, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { Task } from '../../../types';

interface TaskSubtaskListProps {
    task: Task;
    updateTaskMutation: any;
    employees: any[];
}

export const TaskSubtaskList: React.FC<TaskSubtaskListProps> = ({ task, updateTaskMutation, employees }) => {
    const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
    const [editingSubTask, setEditingSubTask] = useState<any>(null);

    return (
        <div className="bg-bg-surface rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Công việc con</h3>
                <button
                    onClick={() => { setIsSubTaskModalOpen(true); setEditingSubTask(null); }}
                    className="p-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="space-y-2">
                {(task.SubTasks || []).length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl">
                        <p className="text-xs text-slate-300 dark:text-slate-600 italic">Chưa có công việc con</p>
                    </div>
                )}

                {(task.SubTasks || []).map((sub, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50/80 dark:bg-slate-700 rounded-xl group/sub border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:bg-bg-surface dark:hover:bg-slate-700 transition-all">
                        <div
                            onClick={() => {
                                const updatedSubTasks = [...(task.SubTasks || [])];
                                updatedSubTasks[idx].Status = updatedSubTasks[idx].Status === 'done' ? 'todo' : 'done';
                                updateTaskMutation.mutate({ ...task, SubTasks: updatedSubTasks });
                            }}
                            className={`mt-0.5 w-5 h-5 rounded-lg border-2 cursor-pointer flex items-center justify-center transition-all ${sub.Status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200' : 'border-slate-300 bg-bg-surface hover:border-blue-400'
                                }`}
                        >
                            {sub.Status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setEditingSubTask(sub); setIsSubTaskModalOpen(true); }}>
                            <p className={`text-xs font-semibold line-clamp-2 ${sub.Status === 'done' ? 'text-slate-400 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{sub.Title}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] text-slate-400 bg-bg-surface px-2 py-0.5 rounded-md ring-1 ring-slate-100 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {sub.AssigneeID ? employees.find(e => e.EmployeeID === sub.AssigneeID)?.FullName : "Chưa gán"}
                                </span>
                                {sub.DueDate && (
                                    <span className="text-[10px] text-slate-400 bg-bg-surface px-2 py-0.5 rounded-md ring-1 ring-slate-100 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {sub.DueDate}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (confirm("Xóa công việc con này?")) {
                                    const updatedSubTasks = (task.SubTasks || []).filter((_, i) => i !== idx);
                                    updateTaskMutation.mutate({ ...task, SubTasks: updatedSubTasks });
                                }
                            }}
                            className="opacity-0 group-hover/sub:opacity-100 transition-opacity text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            {/* ══════════ SUBTASK MODAL ══════════ */}
            {isSubTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-bg-surface rounded-2xl shadow-sm w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-black/5 dark:ring-slate-700">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{editingSubTask ? 'Cập nhật công việc con' : 'Thêm công việc con'}</h3>
                            <button onClick={() => { setIsSubTaskModalOpen(false); setEditingSubTask(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">✕</button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            const title = fd.get('title') as string;
                            const assigneeId = fd.get('assignee') as string;
                            const dueDate = fd.get('dueDate') as string;

                            let subs = [...(task.SubTasks || [])];
                            if (editingSubTask) {
                                subs = subs.map(s => s.SubTaskID === editingSubTask.SubTaskID ? { ...s, Title: title, AssigneeID: assigneeId, DueDate: dueDate } : s);
                            } else {
                                subs.push({ SubTaskID: `SUB-${Date.now()}`, Title: title, AssigneeID: assigneeId, DueDate: dueDate, Status: 'todo' as const });
                            }
                            updateTaskMutation.mutate({ ...task, SubTasks: subs });
                            setIsSubTaskModalOpen(false);
                            setEditingSubTask(null);
                        }} className="p-4 space-y-4">

                            {/* ── Parent task deadline banner ── */}
                            {task.DueDate && (
                                <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                                    new Date(task.DueDate) < new Date()
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
                                        : 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50'
                                }`}>
                                    <div className={`p-2 rounded-lg ${
                                        new Date(task.DueDate) < new Date()
                                            ? 'bg-red-100 dark:bg-red-900/40'
                                            : 'bg-primary-100 dark:bg-primary-900/40'
                                    }`}>
                                        <AlertTriangle className={`w-4 h-4 ${
                                            new Date(task.DueDate) < new Date()
                                                ? 'text-red-500'
                                                : 'text-primary-500'
                                        }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Hạn công việc cha
                                        </p>
                                        <p className={`text-sm font-black ${
                                            new Date(task.DueDate) < new Date()
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-primary-700 dark:text-primary-400'
                                        }`}>
                                            {new Date(task.DueDate).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            {new Date(task.DueDate) < new Date() && (
                                                <span className="ml-2 text-[10px] font-bold text-red-500 animate-pulse">ĐÃ QUÁ HẠN</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        {(() => {
                                            const diffMs = new Date(task.DueDate).getTime() - new Date().getTime();
                                            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                                            if (diffDays < 0) return <span className="text-xs font-bold text-red-500">Quá {Math.abs(diffDays)} ngày</span>;
                                            if (diffDays === 0) return <span className="text-xs font-bold text-red-500">Hôm nay</span>;
                                            return <span className={`text-xs font-bold ${diffDays <= 7 ? 'text-primary-600' : 'text-emerald-600'}`}>Còn {diffDays} ngày</span>;
                                        })()}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nội dung</label>
                                <input defaultValue={editingSubTask?.Title || ''} name="title" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-slate-400" placeholder="Nhập tên công việc..." />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Người thực hiện</label>
                                <select defaultValue={editingSubTask?.AssigneeID || ''} name="assignee" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
                                    <option value="">-- Chọn --</option>
                                    {employees.filter(e => e.Status === 1).map(e => (
                                        <option key={e.EmployeeID} value={e.EmployeeID}>{e.FullName} - {e.Department}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Hạn hoàn thành</label>
                                <input
                                    defaultValue={editingSubTask?.DueDate || ''}
                                    type="date"
                                    name="dueDate"
                                    max={task.DueDate || undefined}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                />
                                {task.DueDate && (
                                    <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Không được vượt quá hạn công việc cha ({new Date(task.DueDate).toLocaleDateString('vi-VN')})
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                <button type="button" onClick={() => { setIsSubTaskModalOpen(false); setEditingSubTask(null); }} className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">Hủy</button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm shadow-primary-500/25 hover:shadow-blue-500/40 active:scale-[0.98] transition-all" >
                                    {editingSubTask ? 'Lưu' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
