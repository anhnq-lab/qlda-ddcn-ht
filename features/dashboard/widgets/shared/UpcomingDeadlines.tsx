import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckSquare } from 'lucide-react';
import { EmptyState, Avatar } from '../../../../components/ui';

interface DeadlineTask {
    TaskID: string;
    Title: string;
    DueDate: string;
    Priority: string;
    _projectName: string;
    AssigneeName?: string;
    AssigneeAvatar?: string;
}

interface UpcomingDeadlinesProps {
    deadlines: DeadlineTask[];
    label?: string;
}

const getUrgency = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) return 'urgent';
    if (diff <= 3) return 'warning';
    return 'normal';
};

const urgencyBadgeColors: Record<'urgent' | 'warning' | 'normal', string> = {
    urgent: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    normal: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
};

const urgencyBulletColors: Record<'urgent' | 'warning' | 'normal', string> = {
    urgent: 'bg-rose-500 ring-rose-200 dark:ring-rose-800/30',
    warning: 'bg-amber-500 ring-amber-200 dark:ring-amber-800/30',
    normal: 'bg-emerald-500 ring-emerald-200 dark:ring-emerald-800/30',
};

const daysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hôm nay';
    if (diff === 1) return 'Ngày mai';
    if (diff < 0) return `Trễ ${Math.abs(diff)} ngày`;
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
                    <span className="text-[12px] font-black uppercase text-txt-secondary tracking-wider">{label}</span>
                </div>
                <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded">7 ngày</span>
            </div>

            <div className="relative pl-6 pr-2 py-2">
                {deadlines.length === 0 ? (
                    <EmptyState icon={<CheckSquare className="w-10 h-10" />} title="Không có deadline trong 7 ngày tới" className="py-6" />
                ) : (
                    <>
                        {/* Vertical Timeline Line */}
                        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-100 dark:bg-slate-800"></div>

                        <div className="space-y-4">
                            {deadlines.map(task => {
                                const urgency = getUrgency(task.DueDate);
                                const bulletColor = urgencyBulletColors[urgency];
                                const badgeColor = urgencyBadgeColors[urgency];

                                return (
                                    <div
                                        key={task.TaskID}
                                        onClick={() => navigate(`/tasks/${task.TaskID}`)}
                                        className="relative flex items-start gap-4 p-3 hover:bg-bg-app dark:hover:bg-slate-800/50 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 group"
                                    >
                                        {/* Timeline Dot */}
                                        <div className={`absolute -left-[19px] top-6 w-2.5 h-2.5 rounded-full ring-4 ${bulletColor} transition-transform group-hover:scale-125 z-10`}></div>

                                        {/* Assignee Avatar */}
                                        {task.AssigneeName && (
                                            <div className="mt-1 shrink-0">
                                                <Avatar
                                                    name={task.AssigneeName}
                                                    imageUrl={task.AssigneeAvatar}
                                                    size="sm"
                                                />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-800 dark:text-slate-100 text-xs sm:text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                                {task.Title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-[11px] text-gray-400 dark:text-slate-500 font-medium truncate max-w-[200px]">
                                                    {task._projectName}
                                                </span>
                                                {task.AssigneeName && (
                                                    <span className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                                                        • {task.AssigneeName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border shrink-0 ${badgeColor}`}>
                                            {daysUntil(task.DueDate)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default UpcomingDeadlines;
