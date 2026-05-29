import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority, Employee } from '../../types';
import { TASK_CATEGORIES, TASK_CATEGORY_LABELS, type TaskCategory } from '../../types/task.types';
import { useAuth } from '../../context/AuthContext';
import {
    X, CheckCircle2, Clock, AlertCircle, XCircle, AlertTriangle,
} from 'lucide-react';

// ── Helpers ──
export const getStatusInfo = (s: TaskStatus) => {
    switch (s) {
        case TaskStatus.Done:
            return { label: 'Hoàn thành', variant: 'success' as const, color: 'text-emerald-600', bg: 'bg-emerald-500', ring: 'ring-emerald-500/30', icon: <CheckCircle2 className="w-4 h-4" /> };
        case TaskStatus.InProgress:
            return { label: 'Đang thực hiện', variant: 'warning' as const, color: 'text-warning-700', bg: 'bg-warning-500', ring: 'ring-warning-500/30', icon: <Clock className="w-4 h-4" /> };
        case TaskStatus.Incomplete:
            return { label: 'Chưa hoàn thành', variant: 'danger' as const, color: 'text-rose-600', bg: 'bg-rose-500', ring: 'ring-rose-500/30', icon: <XCircle className="w-4 h-4" /> };
        case TaskStatus.Review: // Legacy
            return { label: 'Chờ duyệt (cũ)', variant: 'primary' as const, color: 'text-violet-600', bg: 'bg-violet-500', ring: 'ring-violet-500/30', icon: <AlertCircle className="w-4 h-4" /> };
        default: // todo → Công việc mới
            return { label: 'Công việc mới', variant: 'info' as const, color: 'text-blue-600', bg: 'bg-blue-500', ring: 'ring-blue-500/30', icon: <div className="w-4 h-4 rounded-full border-2 border-blue-500" /> };
    }
};

export const getPriorityInfo = (p: TaskPriority) => {
    switch (p) {
        case TaskPriority.Urgent: return { label: 'KHẨN CẤP', color: 'bg-danger-500/10 text-danger-600 ring-1 ring-danger-500/20', dot: 'bg-danger-500' };
        case TaskPriority.High:   return { label: 'CAO',      color: 'bg-warning-500/10 text-warning-700 ring-1 ring-warning-500/20', dot: 'bg-warning-500' };
        case TaskPriority.Medium: return { label: 'TRUNG BÌNH', color: 'bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20', dot: 'bg-sky-500' };
        case TaskPriority.Low:    return { label: 'THẤP',    color: 'bg-slate-50 text-slate-500 ring-1 ring-slate-500/20', dot: 'bg-slate-400' };
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
}

export const TaskCreateEditModal: React.FC<TaskCreateEditModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData = {} as Partial<Task>,
    isEditMode,
    projects,
    employees,
}) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState<Partial<Task>>(initialData);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                Status: TaskStatus.Todo,
                Priority: TaskPriority.Medium,
                ...initialData,
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const isMultiMonth = useMemo(() => {
        if (!formData.StartDate || !formData.DueDate) return false;
        const start = new Date(formData.StartDate);
        const end = new Date(formData.DueDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
        const yearDiff = end.getFullYear() - start.getFullYear();
        const monthDiff = end.getMonth() - start.getMonth();
        return (yearDiff * 12 + monthDiff) > 0;
    }, [formData.StartDate, formData.DueDate]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        const finalData = { ...formData };
        
        if (!isEditMode) {
            const userRole = (currentUser?.Role as string) || 'User';
            const isDirector = userRole === 'Director' || userRole === 'DeputyDirector' || userRole === 'Admin';
            const isDeptHead = userRole === 'DepartmentHead';
            
            if (!isDirector && !isDeptHead) {
                finalData.IsSelfProposed = true;
                finalData.ProposalStatus = 'pending';
            }
        }
        
        onSubmit(finalData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto ring-1 ring-black/5 dark:ring-slate-700">

                {/* ── Modal Header ── */}
                <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-txt-primary">
                            {isEditMode ? 'Cập nhật công việc' : 'Tạo công việc mới'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isEditMode ? 'Chỉnh sửa thông tin' : 'Điền đủ thông tin để thuận tiện đánh giá KPI tháng'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-bg-muted rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-5 space-y-4">

                    {/* Tên công việc */}
                    <div>
                        <label className="block text-xs font-semibold text-txt-muted mb-1.5 uppercase tracking-wider">
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
                        <label className="block text-xs font-semibold text-txt-muted mb-1.5 uppercase tracking-wider">
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
                            <label className="block text-xs font-semibold text-txt-muted mb-1.5 uppercase tracking-wider">
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
                            <label className="block text-xs font-semibold text-txt-muted mb-1.5 uppercase tracking-wider">
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
                            <label className="block text-xs font-semibold text-txt-muted mb-1.5 uppercase tracking-wider">
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
                            <label className="block text-xs font-semibold text-txt-muted mb-1.5 uppercase tracking-wider">
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

                    {/* Multi-month Warning */}
                    {isMultiMonth && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-250 dark:border-amber-900 rounded-xl flex items-start gap-2 text-amber-800 dark:text-amber-300 text-xs leading-relaxed animate-in fade-in duration-200">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                            <div>
                                <span className="font-bold">Cảnh báo:</span> Theo Quy chế KHCV (Điều 8.5), công việc không nên kéo dài nhiều tháng. Vui lòng chia nhỏ thành các công việc theo từng tháng tương ứng.
                            </div>
                        </div>
                    )}

                    {/* Trạng thái + Ưu tiên */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-txt-muted mb-1.5 uppercase tracking-wider">Trạng thái</label>
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
                            <label className="block text-xs font-semibold text-txt-muted mb-1.5 uppercase tracking-wider">Ưu tiên</label>
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

                    {/* Phân loại công việc & Cấp thực hiện (Điều 17) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-txt-muted mb-1.5 uppercase tracking-wider">
                                Phân loại <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.Category || ''}
                                onChange={e => setFormData({ ...formData, Category: (e.target.value || undefined) as TaskCategory | undefined })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            >
                                <option value="">-- Chọn phân loại --</option>
                                {TASK_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{TASK_CATEGORY_LABELS[cat]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-txt-muted mb-1.5 uppercase tracking-wider">
                                Cấp thực hiện
                            </label>
                            <select
                                value={formData.ResponsibilityLevel || 'individual'}
                                onChange={e => setFormData({ ...formData, ResponsibilityLevel: e.target.value as any })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            >
                                <option value="individual">Cá nhân</option>
                                <option value="team">Tập thể phòng</option>
                            </select>
                        </div>
                    </div>

                    {/* Kết quả thực hiện — hiện khi done hoặc in_progress */}
                    {(formData.Status === TaskStatus.Done || formData.Status === TaskStatus.InProgress) && (
                        <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-txt-muted">
                                Kết quả thực hiện {formData.Status === TaskStatus.Done && <span className="text-red-500">*</span>}
                            </label>
                            <textarea
                                required={formData.Status === TaskStatus.Done}
                                rows={2}
                                value={formData.CompletionResult || ''}
                                onChange={e => setFormData({ ...formData, CompletionResult: e.target.value })}
                                className="w-full px-3 py-2 bg-bg-surface border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                placeholder="Mô tả kết quả đã đạt được: VD Đã phê duyệt tại QĐ số..."
                            />
                        </div>
                    )}

                    {/* Lý do chưa hoàn thành — hiện khi incomplete */}
                    {formData.Status === TaskStatus.Incomplete && (
                        <div className="p-4 rounded-xl border bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800">
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-txt-muted">
                                Lý do chưa hoàn thành <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={2}
                                value={formData.IncompleteReason || ''}
                                onChange={e => setFormData({ ...formData, IncompleteReason: e.target.value })}
                                className="w-full px-3 py-2 bg-bg-surface border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                placeholder="Lý do chưa hoàn thành, vướng mắc cần giải quyết..."
                            />
                        </div>
                    )}

                    {/* Ghi chú */}
                    <div>
                        <label className="block text-xs font-semibold text-txt-muted mb-1.5 uppercase tracking-wider">
                            Ghi chú
                        </label>
                        <textarea
                            rows={2}
                            value={formData.Notes || ''}
                            onChange={e => setFormData({ ...formData, Notes: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all resize-none"
                            placeholder="Ghi chú bổ sung (tùy chọn)..."
                        />
                    </div>

                    {/* Dự án */}
                    <div className="pt-1 border-t border-border-subtle">
                        <div>
                            <label className="block text-xs font-semibold text-txt-muted mb-1.5 uppercase tracking-wider mt-3">Dự án liên kết</label>
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
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-txt-muted hover:bg-bg-muted rounded-xl transition-colors"
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
