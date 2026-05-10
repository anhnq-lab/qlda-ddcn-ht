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
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 animate-pulse" />
            )}
            <img
                src={error ? DEFAULT_IMAGE : src}
                alt={alt}
                loading="lazy"
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

    if (layout === 'list') {
        return (
            <div
                onClick={() => onClick(project)}
                className="group flex flex-col md:flex-row bg-bg-surface rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all cursor-pointer"
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
                        <h3 className="font-bold text-gray-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                            {project.ProjectName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-slate-400 mb-3">
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
                                    Ban {board.value}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-end">
                        <div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-gray-500 dark:text-slate-400">Tiến độ</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">{project.Progress || 0}%</span>
                            </div>
                            <ProgressBar value={project.Progress || 0} color="blue" size="sm" />
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-gray-500 dark:text-slate-400">Giải ngân</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{project.PaymentProgress || 0}%</span>
                            </div>
                            <ProgressBar value={project.PaymentProgress || 0} color="emerald" size="sm" />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 dark:text-slate-400 uppercase">Ngân sách</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-slate-100 tabular-nums">{formatCurrency(project.TotalInvestment)}</p>
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
            className="bg-bg-surface rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all group flex flex-col cursor-pointer h-full"
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

                {/* BIM Badge */}
                {project.RequiresBIM && (
                    <div className="absolute bottom-2 right-2">
                        <span className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded shadow ${project.BIMStatus === 'Active' ? 'bg-green-500 text-white' : 'bg-primary-400 text-primary-900'
                            }`} title="Bắt buộc BIM (NĐ 175)">
                            <Layers className="w-2.5 h-2.5" />
                            BIM
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-2.5 flex-1 flex flex-col">
                {/* Title - fixed to 2 lines */}
                <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1 min-h-[2.25rem]" title={project.ProjectName}>
                    {project.ProjectName}
                </h3>

                {/* Location + ID + Board */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mb-2">
                    <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-gray-400 dark:text-slate-400 shrink-0" />
                        <span className="truncate">{project.LocationCode}</span>
                    </span>
                    <span className="font-mono text-[10px] bg-bg-subtle dark:bg-slate-700 px-1.5 py-0.5 rounded shrink-0">
                        #{(project.ProjectID || '').slice(-5)}
                    </span>
                    {board && (
                        <span className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: board.hex }}>
                            Ban {board.value}
                        </span>
                    )}
                </div>

                {/* Progress */}
                <div className="space-y-1.5 mb-2">
                    <div>
                        <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-gray-500 dark:text-slate-400">Tiến độ</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">{project.Progress || 0}%</span>
                        </div>
                        <ProgressBar value={project.Progress || 0} color="blue" size="sm" />
                    </div>
                    <div>
                        <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-gray-500 dark:text-slate-400">Giải ngân</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{project.PaymentProgress || 0}%</span>
                        </div>
                        <ProgressBar value={project.PaymentProgress || 0} color="emerald" size="sm" />
                    </div>
                </div>

                {/* Total Investment Footer */}
                <div className="mt-auto pt-2 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 uppercase font-semibold tracking-wide">Tổng mức ĐT</span>
                        <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent dark:text-slate-100 dark:bg-none tabular-nums">{formatCurrency(project.TotalInvestment)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
});
