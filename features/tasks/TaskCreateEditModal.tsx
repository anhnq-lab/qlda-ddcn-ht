import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, Employee } from '../../types';
import { useMonthlyPlanItemOptions } from '../../hooks/usePlanData';
import {
    X, CheckCircle2, Clock, AlertCircle, XCircle,
} from 'lucide-react';

// ── Helpers ──
export const getStatusInfo = (s: TaskStatus) => {
    switch (s) {
        case TaskStatus.Done:
            return { label: 'Hoàn thành', color: 'text-emerald-600', bg: 'bg-emerald-500', ring: 'ring-emerald-500/30', icon: <CheckCircle2 className="w-4 h-4" /> };
        case TaskStatus.InProgress:
            return { label: 'Đang thực hiện', color: 'text-orange-600', bg: 'bg-orange-500', ring: 'ring-orange-500/30', icon: <Clock className="w-4 h-4" /> };
        case TaskStatus.Incomplete:
            return { label: 'Chưa hoàn thành', color: 'text-rose-600', bg: 'bg-rose-500', ring: 'ring-rose-500/30', icon: <XCircle className="w-4 h-4" /> };
        case TaskStatus.Review: // Legacy
            return { label: 'Chờ duyệt (cũ)', color: 'text-violet-600', bg: 'bg-violet-500', ring: 'ring-violet-500/30', icon: <AlertCircle className="w-4 h-4" /> };
        default: // todo → Công việc mới
            return { label: 'Công việc mới', color: 'text-blue-600', bg: 'bg-blue-500', ring: 'ring-blue-500/30', icon: <div className="w-4 h-4 rounded-full border-2 border-blue-500" /> };
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

/** Danh sách trạng thái hiển thị trên UI (bỏ review legacy) */
export const VISIBLE_STATUSES: TaskStatus[] = [
    TaskStatus.Todo,
    TaskStatus.InProgress,
    TaskStatus.Done,
    TaskStatus.Incomplete,
];

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
                Status: TaskStatus.Todo,
                Priority: TaskPriority.Medium,
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

    const needsResultNote =
        formData.Status === TaskStatus.Done || formData.Status === TaskStatus.Incomplete;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto ring-1 ring-black/5 dark:ring-slate-700">

                {/* ── Modal Header ── */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            {isEditMode ? 'Cập nhật công việc' : 'Tạo công việc mới'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isEditMode ? 'Chỉnh sửa thông tin' : 'Điền đủ thông tin để thuận tiện đánh giá KPI tháng'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-5 space-y-4">

                    {/* Tên công việc */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            Tên công việc <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            value={formData.Title || ''}
                            onChange={e => setFormData({ ...formData, Title: e.target.value })}
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm dark:text-slate-200 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                            placeholder="Nhập tên công việc..."
                        />
                    </div>

                    {/* Mô tả / Nội dung */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            Nội dung / Kết quả yêu cầu <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={formData.Description || ''}
                            onChange={e => setFormData({ ...formData, Description: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all resize-none"
                            placeholder="Mô tả nội dung, kết quả cần đạt được, tiêu chí đánh giá..."
                        />
                    </div>

                    {/* Người thực hiện + Người giao */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                Người thực hiện <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.AssigneeID || ''}
                                onChange={e => setFormData({ ...formData, AssigneeID: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            >
                                <option value="">-- Chọn người thực hiện --</option>
                                {employees.map(emp => (
                                    <option key={emp.EmployeeID} value={emp.EmployeeID}>{emp.FullName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                Người phê duyệt
                            </label>
                            <select
                                value={formData.ApproverID || ''}
                                onChange={e => setFormData({ ...formData, ApproverID: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            >
                                <option value="">-- Chọn người duyệt --</option>
                                {employees.map(emp => (
                                    <option key={emp.EmployeeID} value={emp.EmployeeID}>{emp.FullName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Ngày bắt đầu + Hạn chót */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                Ngày bắt đầu <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                type="date"
                                value={formData.StartDate || ''}
                                onChange={e => setFormData({ ...formData, StartDate: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                Hạn chót <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                type="date"
                                value={formData.DueDate || ''}
                                onChange={e => setFormData({ ...formData, DueDate: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            />
                        </div>
                    </div>

                    {/* Trạng thái + Ưu tiên */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Trạng thái</label>
                            <select
                                value={formData.Status || TaskStatus.Todo}
                                onChange={e => setFormData({ ...formData, Status: e.target.value as TaskStatus })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            >
                                {VISIBLE_STATUSES.map(s => (
                                    <option key={s} value={s}>{getStatusInfo(s).label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Ưu tiên</label>
                            <select
                                value={formData.Priority || TaskPriority.Medium}
                                onChange={e => setFormData({ ...formData, Priority: e.target.value as TaskPriority })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            >
                                {Object.values(TaskPriority).map(p => (
                                    <option key={p} value={p}>{getPriorityInfo(p).label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Ghi chú kết quả — bắt buộc khi Hoàn thành / Chưa hoàn thành */}
                    {needsResultNote && (
                        <div className={`p-4 rounded-xl border ${formData.Status === TaskStatus.Done
                            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                            : 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'}`}>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                Ghi chú kết quả <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={2}
                                value={formData.Metadata?.resultNote || ''}
                                onChange={e => setFormData({
                                    ...formData,
                                    Metadata: { ...formData.Metadata, resultNote: e.target.value }
                                })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                placeholder={formData.Status === TaskStatus.Done
                                    ? 'Mô tả kết quả đã đạt được...'
                                    : 'Lý do chưa hoàn thành, vướng mắc...'}
                            />
                        </div>
                    )}

                    {/* Dự án + Kế hoạch tháng */}
                    <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-100 dark:border-slate-700">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider mt-3">Dự án liên kết</label>
                            <select
                                value={formData.ProjectID || ''}
                                onChange={e => setFormData({ ...formData, ProjectID: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            >
                                <option value="">-- Nội bộ (không thuộc dự án) --</option>
                                {projects.map(p => (
                                    <option key={p.ProjectID} value={p.ProjectID}>
                                        {p.ProjectName.length > 28 ? p.ProjectName.substring(0, 28) + '...' : p.ProjectName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider mt-3">Kế hoạch tháng</label>
                            <select
                                value={formData.MonthlyPlanItemID || ''}
                                onChange={e => setFormData({ ...formData, MonthlyPlanItemID: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            >
                                <option value="">-- Liên kết KH tháng (tùy chọn) --</option>
                                {planItemOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
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
