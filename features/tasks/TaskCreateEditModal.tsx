import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, Employee } from '../../types';
import { getTimelineStepOptions } from '../../utils/timelineStepUtils';
import { useMonthlyPlanItemOptions } from '../../hooks/usePlanData';
import {
    X, BarChart3, Layers, CheckCircle2, Clock, AlertCircle,
} from 'lucide-react';

// ── Helpers ──
export const getStatusInfo = (s: TaskStatus) => {
    switch (s) {
        case TaskStatus.Done: return { label: 'Hoàn thành', color: 'text-emerald-600', bg: 'bg-emerald-500', ring: 'ring-emerald-500/30', icon: <CheckCircle2 className="w-4 h-4" /> };
        case TaskStatus.Review: return { label: 'Chờ duyệt', color: 'text-violet-600', bg: 'bg-violet-500', ring: 'ring-violet-500/30', icon: <AlertCircle className="w-4 h-4" /> };
        case TaskStatus.InProgress: return { label: 'Đang thực hiện', color: 'text-blue-600', bg: 'bg-blue-500', ring: 'ring-blue-500/30', icon: <Clock className="w-4 h-4" /> };
        default: return { label: 'Cần làm', color: 'text-slate-500', bg: 'bg-slate-300', ring: 'ring-slate-300/30', icon: <div className="w-4 h-4 rounded-full border-2 border-slate-300" /> };
    }
};

export const getPriorityInfo = (p: TaskPriority) => {
    switch (p) {
        case TaskPriority.Urgent: return { label: 'KHẨN CẤP', color: 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20', dot: 'bg-red-500' };
        case TaskPriority.High: return { label: 'CAO', color: 'bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20', dot: 'bg-orange-500' };
        case TaskPriority.Medium: return { label: 'TRUNG BÌNH', color: 'bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20', dot: 'bg-sky-500' };
        case TaskPriority.Low: return { label: 'THẤP', color: 'bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20', dot: 'bg-slate-400' };
        default: return { label: p, color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' };
    }
};

interface Project {
    ProjectID: string;
    ProjectName: string;
}

interface TaskCreateEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: Partial<Task>) => void;
    initialData?: Partial<Task>;
    isEditMode: boolean;
    projects: Project[];
    employees: Employee[];
    presetMonthlyPlanItemId?: string;
}

export const TaskCreateEditModal: React.FC<TaskCreateEditModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData = {} as Partial<Task>,
    isEditMode,
    projects,
    employees,
    presetMonthlyPlanItemId,
}) => {
    const [formData, setFormData] = useState<Partial<Task>>(initialData);
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const { options: planItemOptions } = useMonthlyPlanItemOptions(currentMonth, currentYear);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                ...initialData,
                ...(presetMonthlyPlanItemId && !initialData.MonthlyPlanItemID
                    ? { MonthlyPlanItemID: presetMonthlyPlanItemId }
                    : {}),
            });
        }
    }, [isOpen, initialData, presetMonthlyPlanItemId]);

    if (!isOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-bg-surface rounded-2xl shadow-sm w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto ring-1 ring-black/5 dark:ring-slate-700">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{isEditMode ? 'Cập nhật công việc' : 'Tạo công việc mới'}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{isEditMode ? 'Chỉnh sửa thông tin' : 'Điền thông tin để tạo công việc'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-4 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Tên công việc *</label>
                        <input
                            required
                            value={formData.Title || ''}
                            onChange={e => setFormData({ ...formData, Title: e.target.value })}
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm dark:text-slate-200 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                            placeholder="Nhập tên đầu việc..."
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Mô tả</label>
                        <textarea
                            rows={3}
                            value={formData.Description || ''}
                            onChange={e => setFormData({ ...formData, Description: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all resize-none"
                            placeholder="Mô tả nội dung công việc..."
                        />
                    </div>

                    {/* Project + Assignee + Monthly Plan */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Dự án liên kết</label>
                            <select
                                value={formData.ProjectID || ''}
                                onChange={e => setFormData({ ...formData, ProjectID: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            >
                                <option value="">-- Thuộc dự án (Tùy chọn) --</option>
                                {projects.map(p => (
                                    <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName.substring(0, 28)}...</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Kế hoạch tháng</label>
                            <select
                                value={formData.MonthlyPlanItemID || ''}
                                onChange={e => setFormData({ ...formData, MonthlyPlanItemID: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            >
                                <option value="">-- Thuộc KH Tháng (Tùy chọn) --</option>
                                {planItemOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Phụ trách</label>
                            <select
                                value={formData.AssigneeID || ''}
                                onChange={e => setFormData({ ...formData, AssigneeID: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            >
                                <option value="">-- Chọn người phụ trách --</option>
                                {employees.map(emp => (
                                    <option key={emp.EmployeeID} value={emp.EmployeeID}>{emp.FullName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col justify-end">
                             {/* Placeholder for future if needed, to maintain grid layout or span */}
                        </div>
                    </div>

                    {/* TimelineStep */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                            <Layers className="w-3 h-3" /> Bước thực hiện
                        </label>
                        <select
                            value={formData.TimelineStep || ''}
                            onChange={e => setFormData({ ...formData, TimelineStep: e.target.value || undefined })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                        >
                            <option value="">-- Không chọn --</option>
                            {(() => {
                                const options = getTimelineStepOptions();
                                const groups = Array.from(new Set(options.map(o => o.group)));
                                return groups.map(group => (
                                    <optgroup key={group} label={group}>
                                        {options.filter(o => o.group === group).map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </optgroup>
                                ));
                            })()}
                        </select>
                    </div>

                    {/* Date + Status + Priority */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Hạn chót</label>
                            <input
                                type="date"
                                value={formData.DueDate || ''}
                                onChange={e => setFormData({ ...formData, DueDate: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Trạng thái</label>
                            <select
                                value={formData.Status}
                                onChange={e => setFormData({ ...formData, Status: e.target.value as TaskStatus })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            >
                                {Object.values(TaskStatus).map(s => (
                                    <option key={s} value={s}>{getStatusInfo(s).label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Ưu tiên</label>
                            <select
                                value={formData.Priority}
                                onChange={e => setFormData({ ...formData, Priority: e.target.value as TaskPriority })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            >
                                {Object.values(TaskPriority).map(s => (
                                    <option key={s} value={s}>{getPriorityInfo(s).label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Progress */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <BarChart3 className="w-3 h-3" /> Tiến độ
                            </label>
                            <span className="text-sm font-black text-blue-600 dark:text-blue-400">{formData.ProgressPercent || 0}%</span>
                        </div>
                        <div className="relative">
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={formData.ProgressPercent || 0}
                                onChange={e => setFormData({ ...formData, ProgressPercent: parseInt(e.target.value) })}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-[9px] text-slate-300 dark:text-slate-400 mt-1 px-0.5">
                                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all active:scale-[0.98]"
                        >
                            {isEditMode ? 'Lưu thay đổi' : 'Tạo công việc'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
