/**
 * ProjectProgress — Widget QLDA: Tiến độ dự án phòng
 * Hiển thị progress bars + issues cho Phòng QLDA
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, ArrowRight, AlertTriangle } from 'lucide-react';
import { formatShortCurrency } from '../../../../utils/format';
import { EmptyState } from '../../../../components/ui';
import type { useDepartmentData } from '../../hooks/useDepartmentData';


interface Props {
    data: ReturnType<typeof useDepartmentData>;
}

export const ProjectProgress: React.FC<Props> = ({ data }) => {
    const navigate = useNavigate();

    // Use overdue tasks as "issues" proxy
    const overdueTasks = data.deptTasks.filter((t: any) =>
        t.Status !== 'Done' && t.DueDate && new Date(t.DueDate) < new Date()
    );

    // Capital stats per project
    const stats = {
        totalProjects: data.deptProjects.length,
        totalInvestment: data.deptProjects.reduce((s: number, p: any) => s + Number(p.TotalInvestment || 0), 0),
        overdueCount: overdueTasks.length,
    };

    return (
        <div className="space-y-4">
            {/* Project Portfolio Overview */}
            <div className="section-card">
                <div className="section-card-header">
                    <div className="flex items-center gap-2">
                        <div className="section-icon"><FolderKanban className="w-3.5 h-3.5" /></div>
                        <span>Tiến độ dự án phòng</span>
                    </div>
                    <button onClick={() => navigate('/projects')} className="text-xs font-bold text-primary-600 dark:text-primary-500 flex items-center gap-1">
                        Xem tất cả <ArrowRight className="w-3 h-3" />
                    </button>
                </div>

                {/* Portfolio summary */}
                <div className="grid grid-cols-3 gap-2 px-4 pb-3">
                    <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-lg font-black text-blue-700 dark:text-blue-400 tabular-nums">{stats.totalProjects}</p>
                        <p className="text-[9px] font-bold text-blue-600/70 dark:text-blue-500/70">Dự án</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{formatShortCurrency(stats.totalInvestment)}</p>
                        <p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-500/70">Tổng vốn</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20">
                        <p className="text-lg font-black text-rose-700 dark:text-rose-400 tabular-nums">{stats.overdueCount}</p>
                        <p className="text-[9px] font-bold text-rose-600/70 dark:text-rose-500/70">Quá hạn</p>
                    </div>
                </div>

                {/* Project list with progress */}
                <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[300px] overflow-y-auto">
                    {data.deptProjects.length === 0 ? (
                        <EmptyState icon={<FolderKanban className="w-10 h-10" />} title="Chưa có dự án" className="py-6" />
                    ) : data.deptProjects.slice(0, 10).map((p: any) => (
                        <div key={p.ProjectID} onClick={() => navigate(`/projects/${p.ProjectID}`)} className="p-3 hover:bg-bg-app dark:hover:bg-slate-700 cursor-pointer transition-colors">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <p className="text-xs font-bold text-gray-700 dark:text-slate-200 truncate flex-1">{p.ProjectName}</p>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 shrink-0 tabular-nums">{formatShortCurrency(p.TotalInvestment || 0)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${(p.Progress || 0) >= 80 ? 'bg-emerald-500' : (p.Progress || 0) >= 50 ? 'bg-warning-500' : 'bg-primary-500'}`} style={{ width: `${p.Progress || 0}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 w-8 text-right tabular-nums">{p.Progress || 0}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Overdue Tasks Warning */}
            {overdueTasks.length > 0 && (
                <div className="section-card">
                    <div className="section-card-header">
                        <div className="flex items-center gap-2">
                            <div className="section-icon bg-rose-100 dark:bg-rose-900/30"><AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /></div>
                            <span>Công việc quá hạn</span>
                        </div>
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded">{overdueTasks.length}</span>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[200px] overflow-y-auto">
                        {overdueTasks.slice(0, 5).map((task: any) => (
                            <div key={task.TaskID} className="p-3 cursor-pointer hover:bg-bg-app dark:hover:bg-slate-700 transition-colors" onClick={() => navigate(`/tasks/${task.TaskID}`)}>
                                <p className="text-xs font-bold text-gray-700 dark:text-slate-200 truncate">{task.Title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                                        Quá hạn {Math.ceil((new Date().getTime() - new Date(task.DueDate).getTime()) / (1000 * 60 * 60 * 24))} ngày
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectProgress;
