import React from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface BudgetVarianceProps {
    totalInvestment: number;
    disbursedAmount: number;
    plannedDisbursement?: number;
    previousMonthDisbursed?: number;
}

const formatShort = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`;
    if (n >= 1e6) return `${(n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} tr`;
    return n.toLocaleString('vi-VN');
};

export const BudgetVarianceCard: React.FC<BudgetVarianceProps> = ({
    totalInvestment,
    disbursedAmount,
    plannedDisbursement,
    previousMonthDisbursed
}) => {
    const remaining = totalInvestment - disbursedAmount;
    const pct = totalInvestment > 0 ? (disbursedAmount / totalInvestment) * 100 : 0;
    const plannedPct = plannedDisbursement && totalInvestment > 0
        ? (plannedDisbursement / totalInvestment) * 100 : null;

    const momChange = previousMonthDisbursed !== undefined
        ? disbursedAmount - previousMonthDisbursed : null;

    return (
        <div className="section-card">
            <div className="section-card-header">
                <div className="flex items-center gap-2">
                    <div className="section-icon"><DollarSign className="w-3.5 h-3.5" /></div>
                    <span>Tiến độ giải ngân</span>
                </div>
            </div>
            <div className="p-3 space-y-2">
                {/* Progress bar + percentage */}
                <div>
                    <div className="flex items-baseline justify-between mb-1">
                        <span className="text-lg font-black tabular-nums text-primary-700 dark:text-primary-400">{pct.toFixed(1)}%</span>
                        {momChange !== null && momChange !== 0 && (
                            <span className={`flex items-center gap-0.5 text-[10px] font-bold ${momChange > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {momChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {momChange > 0 ? '+' : ''}{formatShort(momChange)}
                            </span>
                        )}
                    </div>
                    <div className="relative h-2 bg-gray-100 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                            className="absolute h-full rounded-full transition-all duration-700"
                            style={{ background: 'linear-gradient(90deg, #fdba74, #4a90e2)', width: `${Math.min(pct, 100)}%` }}
                        />
                        {plannedPct !== null && (
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-emerald-500"
                                style={{ left: `${Math.min(plannedPct, 100)}%` }}
                                title={`KH: ${plannedPct.toFixed(1)}%`}
                            />
                        )}
                    </div>
                </div>

                {/* Key figures — compact row */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg py-1.5 px-1">
                        <p className="text-[8px] text-gray-400 dark:text-slate-500 uppercase font-bold tracking-wide">Tổng ĐT</p>
                        <p className="text-[11px] font-black text-gray-700 dark:text-slate-200 tabular-nums">{formatShort(totalInvestment)}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg py-1.5 px-1">
                        <p className="text-[8px] text-blue-500 dark:text-blue-400 uppercase font-bold tracking-wide">Đã GN</p>
                        <p className="text-[11px] font-black text-blue-700 dark:text-blue-300 tabular-nums">{formatShort(disbursedAmount)}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg py-1.5 px-1">
                        <p className="text-[8px] text-gray-400 dark:text-slate-500 uppercase font-bold tracking-wide">Còn lại</p>
                        <p className="text-[11px] font-black text-gray-700 dark:text-slate-200 tabular-nums">{formatShort(remaining)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetVarianceCard;

