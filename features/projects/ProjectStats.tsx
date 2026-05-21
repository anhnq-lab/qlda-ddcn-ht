import React from 'react';
import { Project, ProjectStatus } from '../../types';
import { Wallet, TrendingUp, FolderOpen, Activity, ArrowRight } from 'lucide-react';
import { formatShortCurrency as formatCurrency } from '../../utils/format';
import { StatCard } from '../../components/ui';

interface ProjectStatsProps {
    projects: Project[];
    onFilterPhase?: (phase: ProjectStatus) => void;
}

// Mini phase pill
const PhasePill: React.FC<{
    label: string;
    count: number;
    dotBg: string;
    className: string;
    onClick?: () => void;
}> = ({ label, count, dotBg, className, onClick }) => (
    <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-opacity ${className} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
        onClick={onClick}
        title={`${count} dự án ${label}`}
    >
        <span className={`w-1.5 h-1.5 rounded-full ${dotBg}`} />
        {label}: {count}
    </span>
);

export const ProjectStats: React.FC<ProjectStatsProps> = ({ projects, onFilterPhase }) => {
    const totalProjects = projects.length;

    // Phase breakdown
    const prepProjects = projects.filter(p => Number(p.Status) === ProjectStatus.Preparation);
    const execProjects = projects.filter(p => Number(p.Status) === ProjectStatus.Execution);
    const doneProjects = projects.filter(p => Number(p.Status) === ProjectStatus.Completion);

    // Capital
    const totalCapital = projects.reduce((sum, p) => sum + (p.TotalInvestment || 0), 0);
    const avgCapitalPerProject = totalProjects > 0 ? totalCapital / totalProjects : 0;

    // Disbursement
    const avgDisbursement = totalProjects > 0
        ? projects.reduce((sum, p) => sum + (p.PaymentProgress || 0), 0) / totalProjects
        : 0;
    const aboveAvgProjects = projects.filter(p => (p.PaymentProgress || 0) > avgDisbursement).length;
    const highDisbursementProjects = projects.filter(p => (p.PaymentProgress || 0) >= 50).length;

    // Physical progress (execution only)
    const execWithProgress = execProjects.filter(p => p.PhysicalProgress !== undefined && p.PhysicalProgress !== null);
    const avgPhysical = execWithProgress.length > 0
        ? execWithProgress.reduce((sum, p) => sum + (p.PhysicalProgress || 0), 0) / execWithProgress.length
        : 0;
    const behindSchedule = execProjects.filter(p => (p.PhysicalProgress || 0) < 30).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Card 1: Tổng dự án + Phase breakdown */}
            <StatCard
                label="Tổng số dự án"
                value={<>{totalProjects} <span className="text-sm font-medium text-txt-muted">dự án</span></>}
                icon={<FolderOpen className="w-5 h-5 flex-shrink-0" />}
                color="slate"
                onClick={() => onFilterPhase?.(undefined as any)}
                footer={
                    <div className="flex flex-wrap gap-1 mt-0.5">
                        <PhasePill 
                            label="CB" 
                            count={prepProjects.length}
                            dotBg="bg-blue-500 dark:bg-blue-400"
                            className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                            onClick={() => onFilterPhase?.(ProjectStatus.Preparation)} 
                        />
                        <PhasePill 
                            label="TH" 
                            count={execProjects.length}
                            dotBg="bg-amber-500 dark:bg-amber-400"
                            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            onClick={() => onFilterPhase?.(ProjectStatus.Execution)} 
                        />
                        <PhasePill 
                            label="KT" 
                            count={doneProjects.length}
                            dotBg="bg-emerald-500 dark:bg-emerald-400"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            onClick={() => onFilterPhase?.(ProjectStatus.Completion)} 
                        />
                    </div>
                }
            />

            {/* Card 2: Tổng vốn + vốn trung bình */}
            <StatCard
                label="Tổng vốn đầu tư"
                value={formatCurrency(totalCapital)}
                icon={<Wallet className="w-5 h-5 flex-shrink-0" />}
                color="emerald"
                footer={
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-txt-muted mt-1">
                        <ArrowRight className="w-3 h-3" />
                        <span>TB: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(avgCapitalPerProject)}</strong> / dự án</span>
                    </div>
                }
            />

            {/* Card 3: Giải ngân TB + context */}
            <StatCard
                label="Giải ngân TB"
                value={<>
                    {avgDisbursement.toFixed(1)}%
                    <span className={`ml-2 text-[10px] font-bold ${avgDisbursement >= 50 ? 'text-emerald-500' : avgDisbursement >= 30 ? 'text-primary-500' : 'text-rose-500'}`}>
                        {avgDisbursement >= 50 ? '▲ Tốt' : avgDisbursement >= 30 ? '◆ Trung bình' : '▼ Thấp'}
                    </span>
                </>}
                icon={<TrendingUp className="w-5 h-5 flex-shrink-0" />}
                color={avgDisbursement >= 50 ? 'emerald' : avgDisbursement >= 30 ? 'amber' : 'rose'}
                footer={
                    <p className="text-[10px] font-semibold text-txt-muted mt-1">
                        <strong className="text-txt-secondary">{highDisbursementProjects}</strong> dự án ≥ 50% kế hoạch
                        {aboveAvgProjects > 0 && ` · ${aboveAvgProjects} trên mức TB`}
                    </p>
                }
            />

            {/* Card 4: Tiến độ thực hiện */}
            <StatCard
                label="Đang thực hiện"
                value={<>{execProjects.length} <span className="text-sm font-medium text-txt-muted">dự án</span></>}
                icon={<Activity className="w-5 h-5 flex-shrink-0" />}
                color="slate"
                progressLabel="Tiến độ vật lý TB"
                progressPercentage={execProjects.length > 0 ? Math.round(avgPhysical) : 0}
                footer={
                    <>
                        {execProjects.length > 0 ? (
                            behindSchedule > 0 && (
                                <p className="text-[10px] font-semibold text-rose-500 mt-1">
                                    ⚠ {behindSchedule} dự án tiến độ dưới 30%
                                </p>
                            )
                        ) : (
                            <p className="text-[10px] text-txt-muted mt-1">Không có dự án đang thi công</p>
                        )}
                    </>
                }
            />
        </div>
    );
};
