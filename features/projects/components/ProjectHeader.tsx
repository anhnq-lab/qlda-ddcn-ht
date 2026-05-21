import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, MapPin, Trash2, Pencil, Building2, Hash, Calendar } from 'lucide-react';
import { Project, ProjectStatus, ProjectGroup, PROJECT_CURRENT_STATUS_CONFIG } from '@/types';
import { formatShortCurrency } from '@/utils/format';

interface ProjectHeaderProps {
    project: Project;
    onSync: () => void;
    isSyncing: boolean;
    syncResult: any;
    onDelete?: () => void;
    onEdit?: () => void;
    compact?: boolean;
    /** Hide back button — used when rendering inside a slide panel */
    hideBackButton?: boolean;
}

const getGroupBadge = (group: ProjectGroup) => {
    switch (group) {
        case ProjectGroup.QN: return { label: 'Quan trọng QG', bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' };
        case ProjectGroup.A: return { label: 'Nhóm A', bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' };
        case ProjectGroup.B: return { label: 'Nhóm B', bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' };
        case ProjectGroup.C: return { label: 'Nhóm C', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800' };
        default: return { label: group, bg: 'bg-slate-50 dark:bg-slate-800 text-gray-700 border-gray-200' };
    }
};

const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
        case ProjectStatus.Preparation: return { label: 'CHUẨN BỊ DỰ ÁN', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800' };
        case ProjectStatus.Execution: return { label: 'ĐANG TRIỂN KHAI', bg: 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400 border border-warning-100 dark:border-warning-800' };
        case ProjectStatus.Completion: return { label: 'ĐÃ KẾT THÚC', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' };
        default: return { label: 'N/A', bg: 'bg-slate-50 dark:bg-slate-800 text-gray-700' };
    }
};

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, onSync, isSyncing, syncResult, onDelete, onEdit, compact, hideBackButton }) => {
    const navigate = useNavigate();
    const groupBadge = getGroupBadge(project.GroupCode);
    
    // Map current_status_code or fallback to general status
    const currentStatus = project.CurrentStatusCode ? PROJECT_CURRENT_STATUS_CONFIG[project.CurrentStatusCode] : null;
    const statusConfig = currentStatus ? { label: currentStatus.label, bg: `${currentStatus.bgClass} ${currentStatus.textClass} border ${currentStatus.borderClass}` } : getStatusConfig(project.Status);

    // Progress bar mini
    const progress = project.Progress || 0;

    // ── Compact mode: single-line header for BIM tab ──
    if (compact) {
        return (
            <div className="bg-bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 flex items-center gap-3">
                {!hideBackButton && (
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 hover:bg-bg-muted rounded-lg transition-all shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4 text-txt-muted" />
                    </button>
                )}
                    <h2 className="text-sm font-bold text-txt-primary truncate">
                        {project.ProjectName}
                    </h2>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase shrink-0 ${statusConfig.bg}`}>
                        {statusConfig.label}
                    </span>
                    <div className="hidden sm:flex items-center gap-2 text-[11px] text-txt-muted shrink-0">
                        <Hash className="w-3 h-3" />
                        <span className="font-mono">{project.ProjectNumber || project.ProjectID}</span>
                    </div>
                    <span className={`hidden md:inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${groupBadge.bg}`}>
                        {groupBadge.label}
                    </span>
                    <span className="hidden md:inline-flex text-[11px] font-bold text-txt-secondary bg-bg-muted px-1.5 py-0.5 rounded border border-border shrink-0">
                        {formatShortCurrency(project.TotalInvestment)}
                    </span>
                    {/* Mini progress bar */}
                    {progress > 0 && (
                        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                            <div className="w-16 h-1.5 bg-bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${progress >= 90 ? 'bg-emerald-500' : progress >= 50 ? 'bg-blue-500' : 'bg-primary-500'}`}
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-txt-muted">{progress}%</span>
                        </div>
                    )}
                    <div className="flex-1" />
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 gradient-btn text-white rounded-lg text-[11px] font-bold shadow-sm transition-all shrink-0"
                            title="Chỉnh sửa thông tin dự án"
                        >
                            <Pencil className="w-3 h-3" />
                            Chỉnh sửa
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg transition-all text-txt-muted hover:text-red-600 dark:hover:text-red-400 shrink-0"
                            title="Xoá dự án"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
            {/* Top section - Header */}
            <div className="px-6 py-6 border-b border-border-subtle">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        {!hideBackButton && (
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 bg-bg-surface hover:bg-bg-muted rounded-xl transition-all border border-border shadow-sm"
                            >
                                <ArrowLeft className="w-5 h-5 text-txt-secondary" />
                            </button>
                        )}
                        <div className="flex-1 min-w-0">
                            {/* Title + Status Badge */}
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h2 className="text-2xl font-black text-txt-primary tracking-tight leading-tight">
                                    {project.ProjectName}
                                </h2>
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${statusConfig.bg}`}>
                                    {statusConfig.label}
                                </span>
                            </div>

                            {/* Metadata Row */}
                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                                {/* Project ID */}
                                <div className="flex items-center gap-2 group cursor-help">
                                    <Hash className="w-3.5 h-3.5 text-txt-muted" />
                                    <span className="text-txt-muted font-mono text-[11px] group-hover:text-blue-500 transition-colors">
                                        {project.ProjectNumber || project.ProjectID}
                                    </span>
                                </div>
                                {/* Location */}
                                {project.LocationCode && (
                                    <div className="flex items-center gap-2 text-txt-secondary">
                                        <MapPin className="w-3.5 h-3.5 text-txt-muted" />
                                        <span className="text-xs">{project.LocationCode}</span>
                                    </div>
                                )}
                                {/* Investor */}
                                {project.InvestorName && (
                                    <div className="flex items-center gap-2 text-txt-secondary">
                                        <Building2 className="w-3.5 h-3.5 text-txt-muted" />
                                        <span className="text-xs truncate max-w-[200px]">{project.InvestorName}</span>
                                    </div>
                                )}
                                {/* Group Badge */}
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${groupBadge.bg}`}>
                                    {groupBadge.label}
                                </span>
                                {/* Budget */}
                                <span className="text-xs font-bold text-txt-secondary bg-bg-muted px-2 py-0.5 rounded-md border border-border">
                                    {formatShortCurrency(project.TotalInvestment)}
                                </span>
                            </div>

                            {/* Progress bar */}
                            {progress > 0 && (
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="flex-1 h-1.5 bg-bg-muted rounded-full overflow-hidden max-w-xs">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${progress >= 90 ? 'bg-emerald-500' : progress >= 50 ? 'bg-blue-500' : 'bg-primary-500'}`}
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-bold ${progress >= 90 ? 'text-emerald-600 dark:text-emerald-400' : progress >= 50 ? 'text-blue-600 dark:text-blue-400' : 'text-primary-600 dark:text-primary-400'}`}>
                                        {progress}% tiến độ
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-auto">
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="flex items-center gap-2 px-4 py-2 gradient-btn text-white rounded-xl text-xs font-bold shadow-sm shadow-primary-900/20 dark:shadow-primary-900/30 transition-all hover:-translate-y-0.5"
                                title="Chỉnh sửa thông tin dự án"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Chỉnh sửa
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="ml-auto p-2 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20 text-txt-muted hover:text-red-600 dark:hover:text-red-400"
                                title="Xoá dự án"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
