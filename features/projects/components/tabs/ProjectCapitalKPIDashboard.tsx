import React from 'react';
import { formatCurrency } from '../../../../utils/format';
import { Coins, Landmark, Calendar, TrendingUp, Receipt, DollarSign, ClipboardCheck, Scale } from 'lucide-react';
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
        advanceRecovered: number;
        advanceBalance: number;
        completionPayment: number;
        totalLuyKeNghiemThu: number;
    };
    allocationsCount: number;
}

const KPI_TIER_STYLES: Record<string, 'blue' | 'emerald' | 'amber' | 'violet' | 'rose' | 'cyan' | 'slate' | 'indigo'> = {
    'bg-slate-100': 'slate',
    'bg-blue-100': 'blue',
    'bg-primary-100': 'violet',
    'bg-amber-100': 'amber',
    'bg-emerald-100': 'emerald',
    'bg-rose-100': 'rose',
    'bg-cyan-100': 'cyan',
    'bg-indigo-100': 'indigo',
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

    // Phân tách số tiền và đơn vị (ví dụ: "5.685.000.000 VNĐ") để CSS riêng biệt
    const parts = value.split(' ');
    const numPart = parts[0];
    const unitPart = parts.slice(1).join(' ');

    const formattedValue = (
        <span className="flex items-baseline gap-0.5 tracking-tight font-black text-[11px] sm:text-[12px] md:text-sm lg:text-[10px] xl:text-[11px] 2xl:text-[13px]">
            <span className="text-txt-primary">{numPart}</span>
            {unitPart && (
                <span className="text-[8px] lg:text-[7px] xl:text-[8px] text-txt-secondary font-semibold uppercase">
                    {unitPart}
                </span>
            )}
        </span>
    );

    return (
        <StatCard
            label={<span className="text-[10px] lg:text-[8px] xl:text-[9px] 2xl:text-[10px] font-bold tracking-wider">{label}</span>}
            value={formattedValue}
            icon={icon}
            color={color}
            progressPercentage={progress}
            compact={true}
            footer={
                sub && !progress ? (
                    <div className="text-[9px] lg:text-[7px] xl:text-[8px] text-slate-500 mt-0.5 font-medium truncate" title={sub}>{sub}</div>
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

    // Công nợ = Lũy kế Nghiệm thu - Đã giải ngân
    const debtAmount = summary.totalLuyKeNghiemThu - summary.totalDisbursed;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <KPICard
                label="Tổng mức đầu tư"
                value={formatCurrency(summary.totalInvestment)}
                sub={`Đã bố trí: ${summary.totalInvestment > 0 ? Math.round((summary.totalAllocated / summary.totalInvestment) * 100) : 0}%`}
                icon={<Coins className="w-5 h-5" />}
                iconBg="bg-bg-muted text-txt-muted"
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
                label="Lũy kế Nghiệm thu"
                value={formatCurrency(summary.totalLuyKeNghiemThu)}
                sub="Lũy kế giá trị nghiệm thu"
                icon={<ClipboardCheck className="w-5 h-5" />}
                iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
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
                iconBg="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
            />
            <KPICard
                label="Thanh toán KLHT"
                value={formatCurrency(summary.completionPayment)}
                sub="Thanh toán khối lượng hoàn thành"
                icon={<DollarSign className="w-5 h-5" />}
                iconBg="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
            />
            <KPICard
                label="Công nợ"
                value={formatCurrency(debtAmount)}
                sub="Nghiệm thu - Giải ngân"
                icon={<Scale className="w-5 h-5" />}
                iconBg="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
            />
        </div>
    );
};
