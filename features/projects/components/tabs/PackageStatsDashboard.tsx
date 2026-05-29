import React from 'react';
import { BiddingPackage, PackageStatus } from '../../../../types';
import { formatCurrency } from '../../../../utils/format';
import { Briefcase, CheckCircle2, FileText, Clock } from 'lucide-react';
import { StatCard } from '../../../../components/ui';

// ========================================
// PACKAGE STATS DASHBOARD - Stats cards + Progress bar
// Extracted from ProjectPackagesTab for maintainability
// ========================================

interface PackageStatsDashboardProps {
    packages: BiddingPackage[];
}

export const PackageStatsDashboard: React.FC<PackageStatsDashboardProps> = ({ packages }) => {
    const totalCount = packages.length;
    const totalValue = packages.reduce((sum, p) => sum + (p.Price || 0), 0);
    const selectionCount = packages.filter(p => p.Status === PackageStatus.Selection).length;
    const executionCount = packages.filter(p => p.Status === PackageStatus.Execution).length;
    const completedCount = packages.filter(p => p.Status === PackageStatus.Completed).length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const pct = (count: number) => totalCount > 0 ? (count / totalCount) * 100 : 0;

    return (
        <div className="rounded-xl p-3">
            {/* Main Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <StatCard
                    label="Tổng số gói thầu"
                    value={totalCount}
                    icon={<Briefcase className="w-5 h-5" />}
                    color="blue"
                />

                <StatCard
                    label="Tổng giá trị (DT)"
                    value={formatCurrency(totalValue)}
                    icon={<FileText className="w-5 h-5" />}
                    color="amber"
                />

                <StatCard
                    label="Kết thúc"
                    value={
                        <div className="flex items-baseline">
                            {completedCount}
                            <span className="text-sm font-bold text-slate-600/60 dark:text-slate-400/60 ml-1">/{totalCount}</span>
                        </div>
                    }
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    color="slate"
                />

                <StatCard
                    label="Đang thực hiện"
                    value={executionCount}
                    icon={<Clock className="w-5 h-5" />}
                    color="emerald"
                />
            </div>

            {/* Progress Bar */}
            <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-txt-secondary">Tiến độ hoàn thành</span>
                    <span className="text-sm font-bold text-txt-primary tabular-nums">{progressPct}%</span>
                </div>
                <div className="h-3 bg-bg-muted rounded-full overflow-hidden flex">
                    <div className="h-full bg-slate-400 transition-all" style={{ width: `${pct(completedCount)}%` }} title="Kết thúc" />
                    <div className="h-full bg-green-500 transition-all" style={{ width: `${pct(executionCount)}%` }} title="Đang thực hiện" />
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct(selectionCount)}%` }} title="Lựa chọn nhà thầu" />
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span><span className="text-txt-muted">Kết thúc ({completedCount})</span></span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span><span className="text-txt-muted">Đang thực hiện ({executionCount})</span></span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span className="text-txt-muted">Lựa chọn nhà thầu ({selectionCount})</span></span>
                </div>
            </div>
        </div>
    );
};
