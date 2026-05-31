import React, { useState } from 'react';
import {
    CalendarDays, Plus, Edit3, CheckCircle2, AlertTriangle, ArrowRight,
    BarChart3, Clock, X, Save
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useTaskWeeklyUpdates, useAddWeeklyUpdate } from '../../../hooks/useTaskWeeklyUpdates';
import { useUpdateTask } from '../../../hooks/useTasks';
import { getCurrentWeekNumber, formatWeekLabel, type WeeklyUpdateInput } from '../../../services/task/taskWeeklyUpdates';

interface TaskWeeklyUpdatesProps {
    taskId: string;
    currentProgress?: number;
}

export const TaskWeeklyUpdates: React.FC<TaskWeeklyUpdatesProps> = ({ taskId, currentProgress = 0 }) => {
    const { data: updates = [], isLoading, isError } = useTaskWeeklyUpdates(taskId);
    const addMutation = useAddWeeklyUpdate();
    const updateTaskMutation = useUpdateTask();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { week: currentWeek, year: currentYear } = getCurrentWeekNumber();
    const currentWeekUpdate = updates.find(u => u.week_number === currentWeek && u.year === currentYear);

    // ── Form state ──
    const [formData, setFormData] = useState<WeeklyUpdateInput>({
        week_number: currentWeek,
        year: currentYear,
        progress: currentProgress,
        work_done: '',
        obstacles: '',
        plan_next_week: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const openForm = (existingUpdate?: any) => {
        if (existingUpdate) {
            setFormData({
                week_number: existingUpdate.week_number,
                year: existingUpdate.year,
                progress: existingUpdate.progress || currentProgress,
                work_done: existingUpdate.work_done || '',
                obstacles: existingUpdate.obstacles || '',
                plan_next_week: existingUpdate.plan_next_week || '',
            });
            setEditingId(existingUpdate.id);
        } else {
            setFormData({
                week_number: currentWeek,
                year: currentYear,
                progress: currentProgress,
                work_done: '',
                obstacles: '',
                plan_next_week: '',
            });
            setEditingId(null);
        }
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await addMutation.mutateAsync({ taskId, input: formData });

            // Sync progress + obstacles về task chính
            const taskUpdates: any = {
                taskId,
                updates: {
                    progress: formData.progress || 0,
                },
            };
            if (formData.obstacles) {
                taskUpdates.updates.obstacles = formData.obstacles;
            }
            // Auto-set status based on progress
            if ((formData.progress || 0) > 0 && (formData.progress || 0) < 100) {
                taskUpdates.updates.status = 'in_progress';
            } else if ((formData.progress || 0) >= 100) {
                taskUpdates.updates.status = 'done';
            }
            await updateTaskMutation.mutateAsync(taskUpdates);

            setShowForm(false);
            setEditingId(null);
        } catch (err) {
            console.error('Weekly update save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-4 animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6 text-center">
                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-sm text-txt-muted">Chưa khởi tạo bảng dữ liệu báo cáo tuần.</p>
                <p className="text-xs text-slate-400 mt-1">Vui lòng chạy migration tạo bảng <code>task_weekly_updates</code>.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* ── HEADER ── */}
            <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between shrink-0">
                <h3 className="text-sm font-bold text-txt-primary flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-500" />
                    Cập nhật tiến độ hằng tuần
                    <span className="text-xs font-normal text-slate-400">({updates.length} báo cáo)</span>
                </h3>
                <button
                    onClick={() => openForm(currentWeekUpdate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all active:scale-[0.97]"
                >
                    {currentWeekUpdate ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {currentWeekUpdate ? 'Sửa tuần này' : 'Cập nhật tuần này'}
                </button>
            </div>

            {/* ── FORM (inline, hiện khi bấm nút) ── */}
            {showForm && (
                <div className="px-5 py-4 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" />
                                {editingId ? 'Chỉnh sửa báo cáo' : 'Báo cáo mới'} — {formatWeekLabel(formData.week_number, formData.year)}
                            </h4>
                            <button type="button" onClick={() => setShowForm(false)} className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-slate-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Progress */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-txt-muted uppercase tracking-wider flex items-center gap-1.5">
                                <BarChart3 className="w-3.5 h-3.5 text-blue-500" /> Tiến độ hiện tại
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range" min="0" max="100" step="5"
                                    value={formData.progress}
                                    onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                                    className="flex-1 accent-blue-600"
                                />
                                <span className={`text-sm font-black min-w-[3ch] text-right ${
                                    (formData.progress || 0) >= 100 ? 'text-emerald-600' : (formData.progress || 0) >= 50 ? 'text-blue-600' : 'text-slate-500'
                                }`}>{formData.progress}%</span>
                            </div>
                        </div>

                        {/* Work done */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-txt-muted uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Kết quả thực hiện trong tuần
                            </label>
                            <textarea
                                value={formData.work_done || ''}
                                onChange={e => setFormData({ ...formData, work_done: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-bg-surface text-txt-primary text-sm focus:ring-2 focus:ring-blue-500/30 outline-none resize-none"
                                placeholder="Mô tả kết quả đạt được trong tuần..."
                            />
                        </div>

                        {/* Obstacles */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-txt-muted uppercase tracking-wider flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Khó khăn / Vướng mắc
                            </label>
                            <textarea
                                value={formData.obstacles || ''}
                                onChange={e => setFormData({ ...formData, obstacles: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10 text-txt-primary text-sm focus:ring-2 focus:ring-amber-400/30 outline-none resize-none"
                                placeholder="Khó khăn, vướng mắc cần tháo gỡ..."
                            />
                        </div>

                        {/* Plan next week */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-txt-muted uppercase tracking-wider flex items-center gap-1.5">
                                <ArrowRight className="w-3.5 h-3.5 text-primary-500" /> Kế hoạch tuần tới
                            </label>
                            <textarea
                                value={formData.plan_next_week || ''}
                                onChange={e => setFormData({ ...formData, plan_next_week: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-bg-surface text-txt-primary text-sm focus:ring-2 focus:ring-blue-500/30 outline-none resize-none"
                                placeholder="Kế hoạch thực hiện tuần tới..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-1">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-medium text-txt-muted hover:bg-bg-muted rounded-lg transition-colors">
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-60"
                            >
                                {isSaving ? (
                                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</>
                                ) : (
                                    <><Save className="w-3.5 h-3.5" /> Lưu báo cáo</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── TIMELINE ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
                {updates.length === 0 ? (
                    <div className="text-center py-16">
                        <CalendarDays className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-sm text-slate-400">Chưa có báo cáo tuần nào.</p>
                        <p className="text-xs text-slate-300 mt-1">Bấm "Cập nhật tuần này" để bắt đầu.</p>
                    </div>
                ) : (
                    <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[15px] before:w-[2px] before:bg-slate-200 dark:before:bg-slate-700">
                        {updates.map((update) => {
                            const isCurrentWeek = update.week_number === currentWeek && update.year === currentYear;
                            const userName = update.user?.raw_user_meta_data?.full_name || update.user?.email || 'Người cập nhật';

                            return (
                                <div key={update.id} className="relative flex gap-4">
                                    {/* Timeline dot */}
                                    <div className={`w-8 h-8 rounded-full shrink-0 z-10 flex items-center justify-center text-xs font-black shadow-sm ${
                                        isCurrentWeek
                                            ? 'bg-blue-500 text-white ring-2 ring-blue-200 dark:ring-blue-800'
                                            : 'bg-bg-surface border-2 border-border text-slate-500'
                                    }`}>
                                        {update.week_number}
                                    </div>

                                    {/* Content card */}
                                    <div className={`flex-1 rounded-xl border p-4 space-y-3 transition-all ${
                                        isCurrentWeek
                                            ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                                            : 'bg-bg-surface border-border-subtle hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}>
                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-black ${isCurrentWeek ? 'text-blue-700 dark:text-blue-400' : 'text-txt-primary'}`}>
                                                    {formatWeekLabel(update.week_number, update.year)}
                                                </span>
                                                {isCurrentWeek && (
                                                    <span className="text-[9px] font-bold text-white bg-blue-500 px-1.5 py-0.5 rounded-md">TUẦN NÀY</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Progress badge */}
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                                    update.progress >= 100 ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' :
                                                    update.progress >= 50 ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' :
                                                    'bg-slate-50 text-slate-500 ring-1 ring-slate-200'
                                                }`}>
                                                    {update.progress}%
                                                </span>
                                                {isCurrentWeek && (
                                                    <button onClick={() => openForm(update)} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-500 transition-colors">
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    update.progress >= 100 ? 'bg-emerald-500' : update.progress >= 50 ? 'bg-blue-500' : 'bg-slate-400'
                                                }`}
                                                style={{ width: `${Math.min(update.progress, 100)}%` }}
                                            />
                                        </div>

                                        {/* Content sections */}
                                        {update.work_done && (
                                            <div className="text-sm text-txt-muted">
                                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Kết quả
                                                </span>
                                                <p className="whitespace-pre-wrap leading-relaxed">{update.work_done}</p>
                                            </div>
                                        )}

                                        {update.obstacles && (
                                            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                                    <AlertTriangle className="w-3 h-3" /> Khó khăn / Vướng mắc
                                                </span>
                                                <p className="text-sm text-amber-800 dark:text-amber-300 whitespace-pre-wrap">{update.obstacles}</p>
                                            </div>
                                        )}

                                        {update.plan_next_week && (
                                            <div className="text-sm text-txt-muted">
                                                <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                                    <ArrowRight className="w-3 h-3" /> Kế hoạch tuần tới
                                                </span>
                                                <p className="whitespace-pre-wrap leading-relaxed">{update.plan_next_week}</p>
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                                            <span className="font-medium">{userName}</span>
                                            <span>&bull;</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(update.created_at), { addSuffix: true, locale: vi })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
