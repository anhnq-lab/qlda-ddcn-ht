import React from 'react';
import { Task, TaskStatus } from '@/types';

interface ProjectOverallProgressProps {
    tasks: Task[];
}

export const ProjectOverallProgress: React.FC<ProjectOverallProgressProps> = ({ tasks }) => {
    const total = tasks.length;
    const done = tasks.filter(t => t.Status === TaskStatus.Done).length;
    const inProgress = tasks.filter(t => t.Status === TaskStatus.InProgress || t.Status === TaskStatus.Review).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wide">Tiến độ tổng thể</span>
                <span className="text-sm font-black text-gray-800 dark:text-white">{pct}%</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ background: 'linear-gradient(90deg, #fdba74, #fb923c, #4a90e2)', width: `${pct}%` }}
                />
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10px] font-medium">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Hoàn thành: {done}
                </span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Đang thực hiện: {inProgress}
                </span>
                <span className="flex items-center gap-1 text-gray-400 dark:text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600" />
                    Chưa bắt đầu: {total - done - inProgress}
                </span>
            </div>
        </div>
    );
};
