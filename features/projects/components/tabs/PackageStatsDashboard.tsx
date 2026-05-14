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
    const awardedCount = packages.filter(p => p.Status === PackageStatus.Awarded).length;
    const evaluatingCount = packages.filter(p => p.Status === PackageStatus.Evaluating).length;
    const biddingCount = packages.filter(p => p.Status === PackageStatus.Bidding).length;
    const postedCount = packages.filter(p => p.Status === PackageStatus.Posted).length;
    const planningCount = packages.filter(p => p.Status === PackageStatus.Planning).length;
    const progressPct = totalCount > 0 ? Math.round((awardedCount / totalCount) * 100) : 0;

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
                    label="Đã có kết quả"
                    value={
                        <div className="flex items-baseline">
                            {awardedCount}
                            <span className="text-sm font-bold text-emerald-600/60 dark:text-emerald-400/60 ml-1">/{totalCount}</span>
                        </div>
                    }
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    color="emerald"
                />

                <StatCard
                    label="Đang thực hiện"
                    value={biddingCount + evaluatingCount}
                    icon={<Clock className="w-5 h-5" />}
                    color="violet"
                />
            </div>

            {/* Progress Bar */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Tiến độ hoàn thành Đấu thầu</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-slate-100 tabular-nums">{progressPct}%</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct(awardedCount)}%` }} title="Đã có kết quả" />
                    <div className="h-full bg-primary-500 transition-all" style={{ width: `${pct(evaluatingCount)}%` }} title="Đang xét thầu" />
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct(biddingCount)}%` }} title="Đang mời thầu" />
                    <div className="h-full bg-primary-500 transition-all" style={{ width: `${pct(postedCount)}%` }} title="Đã đăng tải" />
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-gray-600 dark:text-slate-400">Đã có kết quả ({awardedCount})</span></span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-500"></span><span className="text-gray-600 dark:text-slate-400">Đang xét thầu ({evaluatingCount})</span></span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span className="text-gray-600 dark:text-slate-400">Đang mời thầu ({biddingCount})</span></span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-400"></span><span className="text-gray-600 dark:text-slate-400">Đã đăng tải ({postedCount})</span></span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span><span className="text-gray-600 dark:text-slate-400">Trong kế hoạch ({planningCount})</span></span>
                </div>
            </div>
        </div>
    );
};
