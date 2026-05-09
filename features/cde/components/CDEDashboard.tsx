import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, FileText, Clock, CheckCircle2, XCircle, Users, FolderOpen, ArrowUp, ArrowDown } from 'lucide-react';
import type { CDEDocument, CDEStats } from '../types';
import { CDE_STATUS_CONFIG, CDE_DISCIPLINES, CDE_DOC_TYPES } from '../constants';
import { StatCard } from '../../../components/ui';

interface CDEDashboardProps {
    stats: CDEStats | undefined;
    docs: CDEDocument[];
    projectName: string;
}

const CDEDashboard: React.FC<CDEDashboardProps> = ({ stats, docs, projectName }) => {
    // Analytics computed from docs
    const analytics = useMemo(() => {
        const byStatus: Record<string, number> = {};
        const byDiscipline: Record<string, number> = {};
        const byDocType: Record<string, number> = {};
        const byMonth: Record<string, number> = {};
        let totalSubmitted = 0;
        let totalApproved = 0;
        let totalRejected = 0;

        docs.forEach(doc => {
            // By status
            const st = doc.cde_status || 'S0';
            byStatus[st] = (byStatus[st] || 0) + 1;

            // By discipline
            if (doc.discipline) byDiscipline[doc.discipline] = (byDiscipline[doc.discipline] || 0) + 1;

            // By doc type
            if (doc.doc_type) byDocType[doc.doc_type] = (byDocType[doc.doc_type] || 0) + 1;

            // By month
            if (doc.upload_date) {
                const month = doc.upload_date.substring(0, 7);
                byMonth[month] = (byMonth[month] || 0) + 1;
            }

            // Counts
            totalSubmitted++;
            if (['A1', 'A2', 'A3'].includes(st)) totalApproved++;
            if (st === 'S0' && doc.notes?.includes('Từ chối')) totalRejected++;
        });

        const approvalRate = totalSubmitted > 0 ? Math.round((totalApproved / totalSubmitted) * 100) : 0;

        return { byStatus, byDiscipline, byDocType, byMonth, totalSubmitted, totalApproved, totalRejected, approvalRate };
    }, [docs]);

    const topDisciplines = useMemo(() =>
        Object.entries(analytics.byDiscipline)
            .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
            .slice(0, 6)
            .map(([key, count]: [string, number]) => ({
                label: CDE_DISCIPLINES.find(d => d.value === key)?.label || key,
                count,
                pct: docs.length > 0 ? Math.round((count / docs.length) * 100) : 0,
            })),
        [analytics.byDiscipline, docs.length]
    );

    const topDocTypes = useMemo(() =>
        Object.entries(analytics.byDocType)
            .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
            .slice(0, 6)
            .map(([key, count]: [string, number]) => ({
                label: CDE_DOC_TYPES.find(d => d.value === key)?.label || key,
                count,
                pct: docs.length > 0 ? Math.round((count / docs.length) * 100) : 0,
            })),
        [analytics.byDocType, docs.length]
    );

    const kpis = [
        { label: 'Tổng hồ sơ', value: stats?.total || 0, icon: FileText, color: 'slate' as const, change: 12, up: true },
        { label: 'Đang xử lý', value: stats?.wip || 0, icon: Clock, color: 'amber' as const, change: null, up: false },
        { label: 'Tỷ lệ duyệt', value: `${analytics.approvalRate}%`, icon: CheckCircle2, color: 'emerald' as const, change: 5, up: true },
        { label: 'Bị từ chối', value: analytics.totalRejected, icon: XCircle, color: 'rose' as const, change: null, up: false },
    ];

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-3 duration-500">
            {/* Title */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Thống kê CDE</h2>
                    <p className="text-xs text-gray-400">{projectName}</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
                {kpis.map((kpi, idx) => (
                    <StatCard
                        key={idx}
                        label={kpi.label}
                        value={kpi.value.toString()}
                        icon={<kpi.icon className="w-5 h-5 flex-shrink-0" />}
                        color={kpi.color}
                        trendPercentage={kpi.change !== null ? (kpi.up ? kpi.change : -kpi.change) : undefined}
                    />
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Status Distribution */}
                <div className="bg-bg-surface rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-5">
                    <h3 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Phân bố trạng thái</h3>
                    <div className="space-y-3">
                        {Object.entries(analytics.byStatus).map(([status, count]) => {
                            const cfg = CDE_STATUS_CONFIG[status as keyof typeof CDE_STATUS_CONFIG];
                            if (!cfg) return null;
                            const pct = docs.length > 0 ? Math.round((Number(count) / docs.length) * 100) : 0;
                            return (
                                <div key={status} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-semibold text-gray-600 dark:text-slate-300 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                                            {cfg.label}
                                        </span>
                                        <span className="text-xs font-bold text-gray-800 dark:text-slate-100">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(analytics.byStatus).length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-4">Chưa có dữ liệu</p>
                        )}
                    </div>
                </div>

                {/* Discipline Distribution */}
                <div className="bg-bg-surface rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-5">
                    <h3 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Theo lĩnh vực</h3>
                    <div className="space-y-3">
                        {topDisciplines.map((item, idx) => {
                            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];
                            return (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{item.label}</span>
                                        <span className="text-xs font-bold text-gray-800 dark:text-slate-100">{item.count}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%`, backgroundColor: colors[idx % colors.length] }} />
                                    </div>
                                </div>
                            );
                        })}
                        {topDisciplines.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-4">Chưa có dữ liệu</p>
                        )}
                    </div>
                </div>

                {/* Document Types */}
                <div className="bg-bg-surface rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-5">
                    <h3 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Theo loại hồ sơ</h3>
                    <div className="space-y-2.5">
                        {topDocTypes.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="w-7 h-7 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-[9px] font-black text-gray-500">{idx + 1}</div>
                                <span className="text-xs font-medium text-gray-600 dark:text-slate-300 flex-1">{item.label}</span>
                                <span className="text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">{item.count}</span>
                            </div>
                        ))}
                        {topDocTypes.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-4">Chưa có dữ liệu</p>
                        )}
                    </div>
                </div>

                {/* Monthly Trend */}
                <div className="bg-bg-surface rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-5">
                    <h3 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" /> Xu hướng theo tháng
                    </h3>
                    <div className="space-y-2.5">
                        {Object.entries(analytics.byMonth).sort().slice(-6).map(([month, count]) => {
                            const maxCount = Math.max(...Object.values(analytics.byMonth).map(Number));
                            const pct = maxCount > 0 ? Math.round((Number(count) / maxCount) * 100) : 0;
                            return (
                                <div key={month} className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono font-bold text-gray-400 w-16">{month}</span>
                                    <div className="flex-1 h-5 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-lg flex items-center justify-end pr-2 transition-all duration-500"
                                            style={{ width: `${Math.max(pct, 10)}%` }}>
                                            <span className="text-[9px] font-bold text-white">{count}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(analytics.byMonth).length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-4">Chưa có dữ liệu</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CDEDashboard;
