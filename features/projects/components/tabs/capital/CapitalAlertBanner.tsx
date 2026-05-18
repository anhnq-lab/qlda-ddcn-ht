import React from 'react';
import { AlertTriangle, RotateCcw, Calendar } from 'lucide-react';

export interface CapitalAlert {
    level: 'high' | 'medium';
    message: string;
    icon: React.ReactNode;
}

interface CapitalAlertBannerProps {
    alerts: CapitalAlert[];
}

/**
 * Hiển thị cảnh báo rủi ro giải ngân (tỷ lệ thấp, tạm ứng tồn đọng, v.v.)
 * Đặt ở đầu ProjectCapitalTab để người dùng thấy ngay.
 */
export const CapitalAlertBanner: React.FC<CapitalAlertBannerProps> = ({ alerts }) => {
    if (alerts.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 dark:border-slate-700 bg-warning-50/50 dark:bg-warning-900/20">
                <h3 className="text-sm font-bold text-warning-800 dark:text-warning-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Cảnh báo giải ngân
                </h3>
            </div>
            <div className="p-4 space-y-2">
                {alerts.map((a, i) => (
                    <div
                        key={i}
                        className={`p-3 rounded-lg border flex items-start gap-3 ${
                            a.level === 'high'
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                                : 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-300'
                        }`}
                    >
                        <div className="mt-0.5">{a.icon}</div>
                        <p className="text-sm font-medium">{a.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Hook tính toán cảnh báo giải ngân từ summary và capitalPlans
 */
export function useCapitalAlerts(
    summary: {
        totalInvestment: number;
        disbursementRate: number;
        advanceBalance: number;
        yearlyTarget: number;
        yearlyDisbursed: number;
    },
    capitalPlans: Array<{
        PlanType: string;
        Amount: number;
        PlanID: string;
        PeriodStart?: number;
        PeriodEnd?: number;
    }>,
    totalMidTermAllocated: number,
    getAnnualAllocatedInPeriod: (start: number, end: number, excludeId?: string) => number,
    formatCurrency: (n: number) => string,
): CapitalAlert[] {
    const result: CapitalAlert[] = [];
    const currentMonth = new Date().getMonth() + 1;

    if (totalMidTermAllocated > summary.totalInvestment && summary.totalInvestment > 0) {
        result.push({
            level: 'high',
            message: `Tổng KH trung hạn (${formatCurrency(totalMidTermAllocated)}) vượt Tổng mức đầu tư (${formatCurrency(summary.totalInvestment)}).`,
            icon: <AlertTriangle className="w-4 h-4" />,
        });
    }

    capitalPlans.filter(p => p.PlanType === 'mid_term').forEach(midPlan => {
        const annualTotal = getAnnualAllocatedInPeriod(midPlan.PeriodStart || 0, midPlan.PeriodEnd || 0);
        if (annualTotal > midPlan.Amount) {
            result.push({
                level: 'high',
                message: `KH hằng năm giai đoạn ${midPlan.PeriodStart}–${midPlan.PeriodEnd} (${formatCurrency(annualTotal)}) vượt KH trung hạn (${formatCurrency(midPlan.Amount)}).`,
                icon: <AlertTriangle className="w-4 h-4" />,
            });
        }
    });

    if (summary.disbursementRate < 50 && currentMonth >= 6) {
        result.push({
            level: 'high',
            message: `Tỷ lệ giải ngân mới đạt ${summary.disbursementRate}% — cần đẩy nhanh tiến độ hồ sơ thanh toán.`,
            icon: <AlertTriangle className="w-4 h-4" />,
        });
    }

    if (summary.advanceBalance > 0) {
        result.push({
            level: 'medium',
            message: `Số dư tạm ứng chưa thu hồi: ${formatCurrency(summary.advanceBalance)}. Cần hoàn tất nghiệm thu để thu hồi.`,
            icon: <RotateCcw className="w-4 h-4" />,
        });
    }

    if (summary.yearlyTarget > 0 && summary.yearlyDisbursed < summary.yearlyTarget * 0.3 && currentMonth >= 6) {
        result.push({
            level: 'medium',
            message: `Giải ngân năm nay mới đạt ${Math.round((summary.yearlyDisbursed / summary.yearlyTarget) * 100)}% kế hoạch.`,
            icon: <Calendar className="w-4 h-4" />,
        });
    }

    return result;
}
