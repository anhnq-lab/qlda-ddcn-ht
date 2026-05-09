import React from 'react';
import { Task, TaskStatus } from '@/types';

interface ProjectHealthScoreProps {
    tasks: Task[];
}

export const ProjectHealthScore: React.FC<ProjectHealthScoreProps> = ({ tasks }) => {
    const total = tasks.length;
    if (total === 0) return null;

    const done = tasks.filter((t) => t.Status === TaskStatus.Done).length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check Overdue
    const overdue = tasks.filter((t) => {
        if (t.Status === TaskStatus.Done || !t.DueDate) return false;
        const d = new Date(t.DueDate);
        d.setHours(0, 0, 0, 0);
        return d < today;
    }).length;
    
    // Check Assignment
    const assigned = tasks.filter((t) => t.AssigneeID || (t.Assignees && t.Assignees.length > 0)).length;

    // Score calculation (0-100)
    const completionScore = (done / total) * 30;
    const onTimeScore = ((total - overdue) / total) * 30;
    const assignedScore = (assigned / total) * 20;
    const hasProgress = tasks.filter((t) => (t.ProgressPercent || 0) > 0 || t.Status === TaskStatus.Done).length;
    const progressScore = (hasProgress / total) * 20;
    
    const score = Math.round(completionScore + onTimeScore + assignedScore + progressScore);

    const getScoreInfo = (s: number) => {
        if (s >= 80) return { emoji: '🟢', label: 'Tốt', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500' };
        if (s >= 60) return { emoji: '🟡', label: 'Trung bình', color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-500' };
        if (s >= 40) return { emoji: '🟠', label: 'Cần cải thiện', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500' };
        return { emoji: '🔴', label: 'Rủi ro cao', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500' };
    };
    
    const info = getScoreInfo(score);

    return (
        <div className="bg-bg-surface rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
            <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Sức khỏe dự án
            </h4>
            <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{info.emoji}</span>
                <div>
                    <span className={`text-2xl font-black ${info.color}`}>{score}</span>
                    <span className="text-sm text-gray-400 dark:text-slate-400">/100</span>
                    <p className={`text-xs font-semibold ${info.color}`}>{info.label}</p>
                </div>
            </div>
            {/* Score bar */}
            <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                <div
                    className={`h-full ${info.bg} rounded-full transition-all duration-500`}
                    style={{ width: `${score}%` }}
                />
            </div>
            {/* Breakdown */}
            <div className="space-y-1.5 text-[10px] text-gray-500 dark:text-slate-400">
                <div className="flex justify-between">
                    <span>Hoàn thành ({done}/{total})</span>
                    <span className="font-bold">{Math.round(completionScore)}/30</span>
                </div>
                <div className="flex justify-between">
                    <span>Đúng hạn ({total - overdue}/{total})</span>
                    <span className="font-bold">{Math.round(onTimeScore)}/30</span>
                </div>
                <div className="flex justify-between">
                    <span>Có tiến độ</span>
                    <span className="font-bold">{Math.round(progressScore)}/20</span>
                </div>
                <div className="flex justify-between">
                    <span>Đã phân công</span>
                    <span className="font-bold">{Math.round(assignedScore)}/20</span>
                </div>
            </div>
        </div>
    );
};
