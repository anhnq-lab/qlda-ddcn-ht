import React from 'react';
import { TrendingUp, Building2, CheckCircle2, FileText } from 'lucide-react';
import { StatCard } from '../../../components/common/StatCard';
import { formatCurrency } from '../../../utils/format';
import type { MonthlyBriefingStats } from '../../../services/DashboardService';

interface BriefingKPICardsProps {
    stats: MonthlyBriefingStats;
    disbursementRate: number;
}

/**
 * 4 KPI stat cards for the Monthly Briefing tab:
 * - Giải ngân trong tháng
 * - Dự án khởi công mới
 * - Dự án hoàn thành
 * - Hồ sơ pháp lý phê duyệt
 */
export const BriefingKPICards: React.FC<BriefingKPICardsProps> = React.memo(({
    stats,
    disbursementRate,
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                compact={true}
                label="Giải ngân trong tháng"
                value={formatCurrency(stats.disbursedThisMonth)}
                icon={<TrendingUp className="w-5 h-5" />}
                color="emerald"
                progressLabel="Tiến độ tháng"
                progressPercentage={disbursementRate}
                footer={
                    <p className="text-[9px] font-bold text-txt-secondary mt-0.5">
                        Kế hoạch: {formatCurrency(stats.disbursedTarget)}
                    </p>
                }
            />

            <StatCard
                compact={true}
                label="Dự án khởi công mới"
                value={stats.newProjectsStarted}
                icon={<Building2 className="w-5 h-5" />}
                color="blue"
            />

            <StatCard
                compact={true}
                label="Dự án hoàn thành"
                value={stats.projectsCompleted}
                icon={<CheckCircle2 className="w-5 h-5" />}
                color="primary"
            />

            <StatCard
                compact={true}
                label="Hồ sơ pháp lý phê duyệt"
                value={stats.docsApproved}
                icon={<FileText className="w-5 h-5" />}
                color="warning"
            />
        </div>
    );
});

BriefingKPICards.displayName = 'BriefingKPICards';
