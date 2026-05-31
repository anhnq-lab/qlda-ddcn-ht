import React from 'react';
import { TaskStatus, TaskPriority } from '../../types';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

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
        default: // todo
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
