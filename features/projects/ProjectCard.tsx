import React, { useState, useCallback } from 'react';
import { Project, ProjectStatus, ProjectGroup, MANAGEMENT_BOARDS, PROJECT_CURRENT_STATUS_CONFIG } from '../../types';
import { MapPin, Building, Layers, Building2, Calendar } from 'lucide-react';
import { formatShortCurrency as formatCurrency } from '../../utils/format';
import { getGroupGradient, requiresBIM } from '../../utils/projectCompliance';
import { ProgressBar } from '../../components/ui';

interface ProjectCardProps {
    project: Project;
    onClick: (project: Project) => void;
    layout?: 'grid' | 'list';
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS — extracted outside component to avoid re-creation
// ═══════════════════════════════════════════════════════════════

export const STATUS_CONFIG: Record<number, { label: string; hex: string }> = {
    [ProjectStatus.Preparation]: { label: 'Chuẩn bị DA', hex: '#3B82F6' },
    [ProjectStatus.Execution]: { label: 'Thực hiện DA', hex: '#F97316' },
    [ProjectStatus.Completion]: { label: 'Kết thúc XD', hex: '#10B981' },
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop";




// ═══════════════════════════════════════════════════════════════
// LAZY IMAGE with placeholder
// ═══════════════════════════════════════════════════════════════

const LazyImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = '' }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    const handleLoad = useCallback(() => setLoaded(true), []);
    const handleError = useCallback(() => { setError(true); setLoaded(true); }, []);

    return (
        <div className={`relative ${className}`}>
            {/* Placeholder gradient — shown until image loads */}
            {!loaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-bg-muted via-bg-subtle to-bg-muted animate-pulse" />
            )}
            <img
                src={error ? DEFAULT_IMAGE : src}
                alt={alt}
                loading="lazy"
                crossOrigin="anonymous"
                onLoad={handleLoad}
                onError={handleError}
                className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// CARD COMPONENT
// ═══════════════════════════════════════════════════════════════

export const ProjectCard: React.FC<ProjectCardProps> = React.memo(({ project, onClick, layout = 'grid' }) => {
    const currentStatus = project.CurrentStatusCode ? PROJECT_CURRENT_STATUS_CONFIG[project.CurrentStatusCode] : null;
    const status = currentStatus || STATUS_CONFIG[project.Status] || { label: 'N/A', hex: '#9CA3AF' };
    const board = project.ManagementBoard
        ? MANAGEMENT_BOARDS.find(b => b.value === project.ManagementBoard)
        : null;

    const totalInvestment = project.TotalInvestment || 0;
    const khv = project.ComputedStats?.KHVTotal || 0;
    const disbursed = project.ComputedStats?.TotalDisbursed || 0;
    const volume = 0; // TODO: [refactor] Integrate volume stats from RPC or DB

    const khvPercent = totalInvestment > 0 ? Math.min(100, (khv / totalInvestment) * 100) : 0;
    const disbursedPercent = khv > 0 ? Math.min(100, (disbursed / khv) * 100) : 0;
    const volumePercent = project.ComputedStats?.PhysicalProgress || 0;

    if (layout === 'list') {
        return (
            <div
                onClick={() => onClick(project)}
                className="group flex flex-col md:flex-row bg-bg-surface rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-all cursor-pointer"
            >
                <div className="w-full md:w-56 h-32 md:h-auto relative shrink-0">
                    <LazyImage
                        src={project.ImageUrl || DEFAULT_IMAGE}
                        alt={project.ProjectName}
                        className="w-full h-full"
                    />
                    <div className="absolute top-2 left-2 right-2 flex justify-between">
                        <span className={`${getGroupGradient(project.GroupCode)} text-[9px] font-bold px-2 py-0.5 rounded-full uppercase`}>
                            Nhóm {project.GroupCode}
                        </span>
                        <span className="text-white text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: status.hex }}>
                            {status.label}
                        </span>
                    </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-txt-primary leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-1">
                            {project.ProjectName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-txt-muted mb-3">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {project.LocationCode}
                            </span>
                            <span className="font-mono">#{(project.ProjectID || '').slice(-5)}</span>
                            {project.InvestorName && (
                                <span className="flex items-center gap-1 truncate max-w-[200px]">
                                    <Building2 className="w-3 h-3 shrink-0" /> {project.InvestorName}
                                </span>
                            )}
                            {board && (
                                <span className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: board.hex }}>
                                    {board.label}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 items-end">
                        <div>
                            <p className="text-[10px] text-txt-muted uppercase mb-1">Tổng mức ĐT</p>
                            <p className="text-xs font-bold text-txt-primary tabular-nums">{formatCurrency(totalInvestment)}</p>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-txt-muted">KH Vốn</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">{khvPercent.toFixed(1)}%</span>
                            </div>
                            <ProgressBar value={khvPercent} color="blue" size="sm" />
                            <p className="text-[10px] font-semibold text-txt-secondary mt-1 tabular-nums">{formatCurrency(khv)}</p>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-txt-muted">Giải ngân</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{disbursedPercent.toFixed(1)}%</span>
                            </div>
                            <ProgressBar value={disbursedPercent} color="emerald" size="sm" />
                            <p className="text-[10px] font-semibold text-txt-secondary mt-1 tabular-nums">{formatCurrency(disbursed)}</p>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-txt-muted">KL Hoàn thành</span>
                                <span className="font-bold text-warning-600 dark:text-warning-500">{volumePercent.toFixed(1)}%</span>
                            </div>
                            <ProgressBar value={volumePercent} color={"warning" as any} size="sm" />
                            <p className="text-[10px] font-semibold text-txt-secondary mt-1 tabular-nums">{formatCurrency(volume)}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Grid Layout - Clean & Compact with fixed height
    return (
        <div
            onClick={() => onClick(project)}
            className="bg-bg-surface rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all group flex flex-col cursor-pointer h-full"
        >
            {/* Image - Only badges */}
            <div className="relative h-28 w-full overflow-hidden shrink-0">
                <LazyImage
                    src={project.ImageUrl || DEFAULT_IMAGE}
                    alt={project.ProjectName}
                    className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                />

                {/* Badges */}
                <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                    <span className={`${getGroupGradient(project.GroupCode)} text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shadow`}>
                        Nhóm {project.GroupCode}
                    </span>
                    <span className="text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow" style={{ backgroundColor: status.hex }}>
                        {status.label}
                    </span>
                </div>



                {/* Board Badge */}
                {board && (
                    <div className="absolute bottom-2 left-2 max-w-[65%]">
                        <span 
                            className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 truncate" 
                            style={{ backgroundColor: board.hex }}
                            title={board.label}
                        >
                            <Building className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{board.label}</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3 flex-1 flex flex-col">
                {/* Title - fixed to 2 lines */}
                <h3 className="font-bold text-[13px] text-txt-primary leading-snug line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-1.5 min-h-[2.5rem]" title={project.ProjectName}>
                    {project.ProjectName}
                </h3>

                {/* Location + ID + Board */}
                <div className="flex items-center justify-between text-[10px] text-txt-muted mb-3">
                    <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-txt-muted shrink-0" />
                        <span className="truncate">{project.LocationCode}</span>
                    </span>
                    <span className="font-mono text-[9px] bg-bg-muted text-txt-muted px-1.5 py-0.5 rounded shrink-0">
                        #{(project.ProjectID || '').slice(-5)}
                    </span>
                </div>

                {/* Metrics Stack */}
                <div className="space-y-2 mb-1 flex-1">
                    {/* Tổng mức */}
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-txt-muted uppercase font-medium">Tổng mức</span>
                        <span className="font-bold text-txt-primary tabular-nums">{formatCurrency(totalInvestment)}</span>
                    </div>
                    
                    {/* Kế hoạch vốn */}
                    <div>
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-txt-muted font-medium">Kế hoạch vốn</span>
                            <div className="text-right">
                                <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">{formatCurrency(khv)}</span>
                                <span className="text-[9px] text-blue-500/70 ml-1 font-medium">({khvPercent.toFixed(1)}%)</span>
                            </div>
                        </div>
                        <ProgressBar value={khvPercent} color="blue" size="sm" />
                    </div>

                    {/* Giải ngân */}
                    <div>
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-txt-muted font-medium">Giải ngân</span>
                            <div className="text-right">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(disbursed)}</span>
                                <span className="text-[9px] text-emerald-500/70 ml-1 font-medium">({disbursedPercent.toFixed(1)}%)</span>
                            </div>
                        </div>
                        <ProgressBar value={disbursedPercent} color="emerald" size="sm" />
                    </div>
                    
                    {/* Khối lượng hoàn thành */}
                    <div className="pt-1 border-t border-border-subtle">
                        <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-txt-muted font-medium">KL Hoàn thành</span>
                            <div className="text-right">
                                <span className="font-bold text-warning-600 dark:text-warning-500 tabular-nums">{formatCurrency(volume)}</span>
                                <span className="text-[10px] text-warning-500/70 ml-1 font-medium">({volumePercent.toFixed(1)}%)</span>
                            </div>
                        </div>
                        <ProgressBar value={volumePercent} color={"warning" as any} size="sm" />
                    </div>
                </div>
            </div>
        </div>
    );
});

