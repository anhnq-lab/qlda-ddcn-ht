import React from 'react';
import { StatCard } from '../../../components/ui';
import { SkeletonStatCard } from '../../../components/ui/Skeleton';
import { Target, TrendingUp, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TaskStatus } from '../../../types';

interface TaskStatsRowProps {
    stats: {
        total: number;
        inProgress: number;
        done: number;
        overdue: number;
        review: number;
        completion: number;
    };
    isLoading: boolean;
    tasksError: any;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    filterOverdue: boolean;
    setFilterOverdue: (fn: (v: boolean) => boolean) => void;
}

export const TaskStatsRow: React.FC<TaskStatsRowProps> = ({
    stats,
    isLoading,
    tasksError,
    filterStatus,
    setFilterStatus,
    filterOverdue,
    setFilterOverdue
}) => {
    if (tasksError) {
        return (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Không tải được danh sách công việc: {(tasksError as Error).message}</span>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonStatCard key={i} className={i === 0 ? 'col-span-2 lg:col-span-1' : ''} />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total */}
            <StatCard
                className="col-span-2 lg:col-span-1"
                label="Tổng công việc"
                value={stats.total}
                icon={<Target className="w-5 h-5 flex-shrink-0" />}
                color="blue"
                progressPercentage={stats.completion}
                progressLabel="HOÀN THÀNH"
            />

            {/* In Progress */}
            <StatCard
                label="Đang thực hiện"
                value={stats.inProgress}
                icon={<TrendingUp className="w-5 h-5 flex-shrink-0" />}
                color="amber"
                onClick={() => setFilterStatus(filterStatus === TaskStatus.InProgress ? 'All' : TaskStatus.InProgress)}
            />

            {/* Review */}
            <StatCard
                label="Chờ duyệt"
                value={stats.review}
                icon={<AlertCircle className="w-5 h-5 flex-shrink-0" />}
                color="violet"
                onClick={() => setFilterStatus(filterStatus === TaskStatus.Review ? 'All' : TaskStatus.Review)}
            />

            {/* Done */}
            <StatCard
                label="Hoàn thành"
                value={stats.done}
                icon={<CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                color="emerald"
                onClick={() => setFilterStatus(filterStatus === TaskStatus.Done ? 'All' : TaskStatus.Done)}
            />

            {/* Overdue */}
            <StatCard
                label={
                    <div className="flex items-center gap-1.5">
                        Quá hạn
                        {stats.overdue > 0 && (
                            <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                        )}
                    </div>
                }
                value={stats.overdue}
                icon={<AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                color="rose"
                onClick={() => {
                    setFilterOverdue(v => {
                        const newV = !v;
                        if (!newV) setFilterStatus('All');
                        return newV;
                    });
                }}
            />
        </div>
    );
};
