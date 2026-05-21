import React, { useState } from 'react';
import { X, CheckCircle2, MessageSquare, Play, XCircle, Target } from 'lucide-react';
import { Task, TaskStatus } from '../../../types';

const getStatusConfig = (s: TaskStatus) => {
    switch (s) {
        case TaskStatus.Done:       return { label: 'Hoàn thành',      bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', ring: 'ring-2 ring-emerald-200', icon: <CheckCircle2 className="w-4 h-4" /> };
        case TaskStatus.InProgress: return { label: 'Đang thực hiện',  bg: 'bg-blue-500',    text: 'text-blue-600',    light: 'bg-blue-50',    ring: 'ring-2 ring-blue-200',    icon: <Play className="w-4 h-4" /> };
        case TaskStatus.Incomplete: return { label: 'Chưa hoàn thành', bg: 'bg-rose-500',    text: 'text-rose-600',    light: 'bg-rose-50',    ring: 'ring-2 ring-rose-200',    icon: <XCircle className="w-4 h-4" /> };
        default:                    return { label: 'Công việc mới',   bg: 'bg-slate-300',   text: 'text-slate-500',   light: 'bg-slate-50',   ring: 'ring-2 ring-slate-200',   icon: <Target className="w-4 h-4" /> };
    }
};

interface TaskProgressUpdateModalProps {
    task: Task;
    targetStatus: TaskStatus | null;
    onClose: () => void;
    onSubmit: (progress: number, note: string, newStatus?: TaskStatus) => void;
    isSaving?: boolean;
}

export function TaskProgressUpdateModal({ task, targetStatus, onClose, onSubmit, isSaving }: TaskProgressUpdateModalProps) {
    // Nếu targetStatus là Done thì mặc định progress = 100, ngược lại lấy theo hiện tại hoặc 0
    const [progress, setProgress] = useState<number>(
        targetStatus === TaskStatus.Done ? 100 : (task.ProgressPercent || 0)
    );
    const [note, setNote] = useState<string>('');

    const targetStatusCfg = targetStatus ? getStatusConfig(targetStatus) : null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(progress, note, targetStatus || undefined);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            {targetStatus ? 'Chuyển trạng thái công việc' : 'Cập nhật tiến độ'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">{task.Title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {targetStatus && targetStatusCfg && (
                        <div className={`p-4 rounded-xl border ${targetStatusCfg.ring} ${targetStatusCfg.light} flex items-center gap-3`}>
                            {targetStatusCfg.icon}
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Chuyển sang trạng thái</p>
                                <p className={`font-bold ${targetStatusCfg.text}`}>{targetStatusCfg.label}</p>
                            </div>
                        </div>
                    )}

                    {/* Removed progress slider as requested by user */}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-emerald-500" />
                            Kết quả / Ghi chú
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            placeholder="Nhập nội dung cập nhật, kết quả đạt được, hoặc vướng mắc..."
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 dark:text-slate-100"
                            required={targetStatus === TaskStatus.Review || targetStatus === TaskStatus.Done || targetStatus === TaskStatus.Incomplete}
                        />
                        {(targetStatus === TaskStatus.Review || targetStatus === TaskStatus.Done || targetStatus === TaskStatus.Incomplete) && (
                            <p className="text-xs text-warning-600 dark:text-warning-400 font-medium">
                                * Bắt buộc nhập ghi chú kết quả/giải trình khi chuyển sang {targetStatusCfg?.label.toLowerCase()}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/25 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Lưu cập nhật
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
