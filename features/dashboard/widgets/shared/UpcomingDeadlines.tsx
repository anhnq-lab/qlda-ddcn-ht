/**
 * UpcomingDeadlines — Shared deadline widget 
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckSquare } from 'lucide-react';
import { TaskPriority } from '../../../../types';
import { EmptyState } from '../../../../components/ui';

interface DeadlineTask {
    TaskID: string;
    Title: string;
    DueDate: string;
    Priority: string;
    _projectName: string;
}

interface UpcomingDeadlinesProps {
    deadlines: DeadlineTask[];
    label?: string;
}

const priorityColors: Record<string, string> = {
    [TaskPriority.Urgent]: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
    [TaskPriority.High]: 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800',
    [TaskPriority.Medium]: 'bg-warning-100 text-warning-700 border-warning-200 dark:bg-warning-900/30 dark:text-warning-400 dark:border-warning-800',
    [TaskPriority.Low]: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
};

const daysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hôm nay';
    if (diff === 1) return 'Ngày mai';
    return `${diff} ngày`;
};

export const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({
    deadlines,
    label = 'Deadline sắp tới',
}) => {
    const navigate = useNavigate();

    return (
        <div className="section-card">
            <div className="section-card-header">
                <div className="flex items-center gap-2">
                    <div className="section-icon"><Clock className="w-3.5 h-3.5" /></div>
                    <span>{label}</span>
                </div>
                <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">7 ngày</span>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-slate-700">
                {deadlines.length === 0 ? (
                    <EmptyState icon={<CheckSquare className="w-10 h-10" />} title="Không có deadline trong 7 ngày tới" className="py-6" />
                ) : (
                    deadlines.map(task => (
                        <div
                            key={task.TaskID}
                            onClick={() => navigate(`/tasks/${task.TaskID}`)}
                            className="p-4 hover:bg-bg-app dark:bg-slate-900 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 dark:text-slate-100 text-sm truncate">{task.Title}</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-400 mt-1 truncate">{task._projectName}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded border shrink-0 ${priorityColors[task.Priority] || ''}`}>
                                    {daysUntil(task.DueDate)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UpcomingDeadlines;
