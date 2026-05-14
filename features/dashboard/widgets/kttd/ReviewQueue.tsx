/**
 * ReviewQueue — Widget KTTD: Hàng đợi thẩm định kỹ thuật
 * Hiển thị tasks cần thẩm định cho Phòng Kỹ thuật - Thẩm định
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileSearch, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { EmptyState } from '../../../../components/ui';

const STALE_5M = 5 * 60 * 1000;

export const ReviewQueue: React.FC = () => {
    const navigate = useNavigate();

    // Use tasks with "review" status as review queue proxy
    const { data: reviewTasks = [], isLoading } = useQuery({
        queryKey: ['dashboard-review-queue'],
        queryFn: async () => {
            const { data } = await supabase
                .from('tasks')
                .select('task_id, title, project_id, due_date, status, priority, created_at')
                .eq('status', 'review')
                .order('created_at', { ascending: false })
                .limit(8);
            return data || [];
        },
        staleTime: STALE_5M,
    });

    // Task stats for review context
    const { data: taskStats } = useQuery({
        queryKey: ['dashboard-review-task-stats'],
        queryFn: async () => {
            const { data } = await supabase
                .from('tasks')
                .select('status');
            const all = data || [];
            return {
                review: all.filter((t: any) => t.status === 'review').length,
                todo: all.filter((t: any) => t.status === 'todo').length,
                done: all.filter((t: any) => t.status === 'done').length,
            };
        },
        staleTime: STALE_5M,
    });

    return (
        <div className="section-card">
            <div className="section-card-header">
                <div className="flex items-center gap-2">
                    <div className="section-icon"><FileSearch className="w-3.5 h-3.5" /></div>
                    <span>Hàng đợi thẩm định</span>
                </div>
            </div>

            {/* Stats badges */}
            {taskStats && (
                <div className="grid grid-cols-3 gap-2 px-4 pb-3">
                    <div className="text-center p-2 rounded-lg bg-warning-50 dark:bg-warning-900/20">
                        <p className="text-lg font-black text-warning-700 dark:text-warning-400 tabular-nums">{taskStats.review}</p>
                        <p className="text-[9px] font-bold text-warning-600/70 dark:text-warning-500/70">Chờ thẩm định</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-lg font-black text-blue-700 dark:text-blue-400 tabular-nums">{taskStats.todo}</p>
                        <p className="text-[9px] font-bold text-blue-600/70 dark:text-blue-500/70">Cần làm</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                        <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{taskStats.done}</p>
                        <p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-500/70">Hoàn thành</p>
                    </div>
                </div>
            )}

            {/* Task-based review items */}
            <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[280px] overflow-y-auto">
                {isLoading ? (
                    <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" /></div>
                ) : reviewTasks.length === 0 ? (
                    <EmptyState icon={<CheckCircle2 className="w-10 h-10" />} title="Không có hồ sơ chờ thẩm định" className="py-6" />
                ) : reviewTasks.map((task: any) => {
                    const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                    return (
                        <div key={task.task_id} onClick={() => navigate(`/tasks/${task.task_id}`)} className="p-3 hover:bg-bg-app dark:hover:bg-slate-700 cursor-pointer transition-colors">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{task.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400">
                                            Chờ xử lý
                                        </span>
                                        {isOverdue && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 flex items-center gap-0.5">
                                                <AlertTriangle className="w-2.5 h-2.5" /> Trễ hạn
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {task.due_date && (
                                    <span className={`text-[10px] font-bold shrink-0 flex items-center gap-1 ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 dark:text-slate-400'}`}>
                                        <Clock className="w-3 h-3" />
                                        {new Date(task.due_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ReviewQueue;
