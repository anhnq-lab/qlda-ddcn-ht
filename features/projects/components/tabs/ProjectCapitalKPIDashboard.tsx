import React from 'react';
import { formatCurrency } from '../../../../utils/format';
import { Coins, Landmark, Calendar, TrendingUp, Receipt, DollarSign } from 'lucide-react';
import { StatCard } from '../../../../components/ui';

interface ProjectCapitalKPIDashboardProps {
    summary: {
        totalInvestment: number;
        totalAllocated: number;
        yearlyTarget: number;
        yearlyDisbursed: number;
        totalDisbursed: number;
        disbursementRate: number;
        totalAdvance: number;
        advanceBalance: number;
        completionPayment: number;
    };
    allocationsCount: number;
}

const KPI_TIER_STYLES: Record<string, 'blue' | 'emerald' | 'amber' | 'violet' | 'rose'> = {
    'bg-slate-100': 'blue',
    'bg-blue-100': 'emerald',
    'bg-primary-100': 'amber',
    'bg-emerald-100': 'violet',
    'bg-rose-100': 'rose',
    'bg-cyan-100': 'blue',
};

const KPICard: React.FC<{
    label: string;
    value: string;
    sub?: string;
    icon: React.ReactNode;
    iconBg?: string;
    progress?: number;
}> = ({ label, value, sub, icon, iconBg = 'bg-gray-100', progress }) => {
    const bgClass = Object.keys(KPI_TIER_STYLES).find(k => iconBg?.includes(k)) || '';
    const color = KPI_TIER_STYLES[bgClass] || 'blue';

    return (
        <StatCard
            label={label}
            value={<span className="text-base lg:text-lg font-bold">{value}</span>}
            icon={icon}
            color={color}
            progressPercentage={progress}
            footer={
                sub && !progress ? (
                    <div className="text-[10px] lg:text-[11px] text-slate-500 mt-0.5 font-medium truncate" title={sub}>{sub}</div>
                ) : undefined
            }
        />
    );
};

export const ProjectCapitalKPIDashboard: React.FC<ProjectCapitalKPIDashboardProps> = ({ summary, allocationsCount }) => {
    // Tỷ lệ giải ngân toàn dự án = đã GN / TMĐT
    const overallRate = summary.totalInvestment > 0
        ? Math.round((summary.totalDisbursed / summary.totalInvestment) * 100)
        : summary.disbursementRate;

    // Tỷ lệ năm nay = GN năm nay / KH năm nay
    const yearRate = summary.yearlyTarget > 0
        ? Math.round((summary.yearlyDisbursed / summary.yearlyTarget) * 100)
        : 0;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard
                label="Tổng mức đầu tư"
                value={formatCurrency(summary.totalInvestment)}
                sub={`Đã bố trí: ${summary.totalInvestment > 0 ? Math.round((summary.totalAllocated / summary.totalInvestment) * 100) : 0}%`}
                icon={<Coins className="w-5 h-5" />}
                iconBg="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            />
            <KPICard
                label="KH vốn lũy kế"
                value={formatCurrency(summary.totalAllocated)}
                sub={`${allocationsCount} đợt bố trí`}
                icon={<Landmark className="w-5 h-5" />}
                iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            />
            <KPICard
                label="KH vốn năm nay"
                value={formatCurrency(summary.yearlyTarget)}
                sub={`GN đạt: ${yearRate}% · ${formatCurrency(summary.yearlyDisbursed)}`}
                icon={<Calendar className="w-5 h-5" />}
                iconBg="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
            />
            <KPICard
                label="Đã giải ngân"
                value={formatCurrency(summary.totalDisbursed)}
                sub={`Tỷ lệ / TMĐT: ${overallRate}%`}
                icon={<TrendingUp className="w-5 h-5" />}
                iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                progress={overallRate}
            />
            <KPICard
                label="Tạm ứng"
                value={formatCurrency(summary.totalAdvance)}
                sub={`Chưa thu hồi: ${formatCurrency(summary.advanceBalance)}`}
                icon={<Receipt className="w-5 h-5" />}
                iconBg="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
            />
            <KPICard
                label="Thanh toán KLHT"
                value={formatCurrency(summary.completionPayment)}
                sub="Thanh toán khối lượng hoàn thành"
                icon={<DollarSign className="w-5 h-5" />}
                iconBg="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
            />
        </div>
    );
};
