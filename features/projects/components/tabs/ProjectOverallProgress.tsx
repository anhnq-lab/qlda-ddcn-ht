import React from 'react';
import { Task } from '@/types';
import { calcProgress } from '@/lib/progressCalculator';

interface ProjectOverallProgressProps {
    tasks: Task[];
}

export const ProjectOverallProgress: React.FC<ProjectOverallProgressProps> = ({ tasks }) => {
    const { total, done, inProgress, completionPercent: pct } = calcProgress(tasks);

    return (
        <div className="bg-bg-surface rounded-xl border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-txt-muted uppercase tracking-wide">Tiến độ tổng thể</span>
                <span className="text-sm font-black text-txt-primary">{pct}%</span>
            </div>
            <div className="h-3 bg-bg-muted rounded-full overflow-hidden">
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
                <span className="flex items-center gap-1 text-txt-placeholder">
                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600" />
                    Chưa bắt đầu: {total - done - inProgress}
                </span>
            </div>
        </div>
    );
};
