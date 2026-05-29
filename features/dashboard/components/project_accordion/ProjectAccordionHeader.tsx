import React from 'react';
import { Layers, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../../utils/format';
import type { ProjectBriefingData } from '../../../../services/DashboardService';

export const SectionHeader: React.FC<{ expandAll: boolean; onToggleAll: () => void }> = ({ expandAll, onToggleAll }) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-bg-surface p-4 rounded-xl border border-border shadow-sm gap-3">
        <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
                <Layers className="w-5 h-5" />
            </div>
            <div>
                <h3 className="text-base font-black text-txt-primary uppercase tracking-tight">Tình hình các dự án & nhiệm vụ</h3>
                <p className="text-xs text-txt-muted mt-0.5">Tổng hợp kết quả, vướng mắc và kế hoạch phân nhóm theo dự án</p>
            </div>
        </div>
        <button
            id="btn-toggle-all-projects"
            onClick={onToggleAll}
            className="btn btn-outline text-xs px-3 py-1.5 font-bold flex items-center gap-1.5 border-border text-txt-secondary hover:bg-bg-hover-row"
            aria-label={expandAll ? 'Thu gọn tất cả dự án' : 'Mở rộng tất cả dự án'}
        >
            {expandAll ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
        </button>
    </div>
);

export const StatusBadge: React.FC<{ proj: ProjectBriefingData }> = ({ proj }) => {
    const isInternal = proj.projectId === 'internal_admin';
    const statusLabel = proj.statusLabel;
    let cls = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    if (!isInternal) {
        if (statusLabel === 'Thực hiện') cls = 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50';
        else if (statusLabel === 'Chuẩn bị ĐT') cls = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50';
        else cls = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50';
    }
    return (
        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${cls}`}>
            {statusLabel}
        </span>
    );
};

export const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="flex items-center gap-1 text-[11px] text-txt-muted">
        <span className="font-bold text-txt-secondary">Tiến độ:</span>
        <div className="w-12 md:w-16 h-1.5 bg-bg-muted rounded-full overflow-hidden inline-block align-middle">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <span className="font-bold text-emerald-600 dark:text-emerald-400">{progress}%</span>
    </div>
);

export const TaskCountBadges: React.FC<{ proj: ProjectBriefingData; hasIssues: boolean }> = ({ proj, hasIssues }) => (
    <div className="flex flex-wrap items-center gap-1">
        {proj.completedTasks.length > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" title="Hoàn thành">
                {proj.completedTasks.length} HT
            </span>
        )}
        {proj.incompleteTasks.length > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400" title="Chưa hoàn thành">
                {proj.incompleteTasks.length} Trễ
            </span>
        )}
        {proj.inProgressTasks.length > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" title="Đang thực hiện">
                {proj.inProgressTasks.length} Đang làm
            </span>
        )}
        {proj.nextMonthTasks.length > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400" title="Kế hoạch tháng tới">
                {proj.nextMonthTasks.length} KH tới
            </span>
        )}
        {hasIssues && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 animate-pulse flex items-center gap-0.5" title="Vướng mắc gói thầu">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                {proj.issues.length} vướng mắc
            </span>
        )}
    </div>
);
