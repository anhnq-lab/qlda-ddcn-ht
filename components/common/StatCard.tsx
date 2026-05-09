import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export type StatCardColor = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan' | 'indigo' | 'orange' | 'purple' | 'slate' | 'gray';

interface StatCardProps {
    /** Tiêu đề chính của thẻ */
    label: string | React.ReactNode;
    /** Giá trị thống kê */
    value: string | number | React.ReactNode;
    /** Biểu tượng bên cạnh Value */
    icon: React.ReactNode;
    /** Màu Accent của thẻ */
    color?: StatCardColor;
    /** Mô tả nhỏ hiển thị dưới cùng của block Value (cách báo cáo cũ) */
    sublabel?: string;
    /** Xu hướng LÊN hoặc XUỐNG */
    trend?: 'up' | 'down';
    /** Tiêu đề của xu hướng. VD: "Tiến độ" */
    trendLabel?: string;
    /** % xu hướng (âm hoặc dương) */
    trendPercentage?: number;
    /** Giá trị mục tiêu (Target) sẽ hiển thị '/ targetValue' kế Value */
    targetValue?: string | number;
    /** Nhãn của thanh tiến trình nhỏ */
    progressLabel?: string;
    /** Phần trăm thanh tiến trình */
    progressPercentage?: number;
    /** Trạng thái Load skeleton */
    loading?: boolean;
    /** Slot tuỳ chỉnh dưới cùng (Ví dụ chèn thêm badge) */
    footer?: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

const COLOR_MAP: Record<StatCardColor, string> = {
    blue:    'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
    amber:   'text-primary-600 bg-primary-50 dark:bg-primary-500/10 dark:text-primary-400',
    rose:    'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400',
    violet:  'text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400',
    cyan:    'text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10 dark:text-cyan-400',
    indigo:  'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400',
    orange:  'text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400',
    purple:  'text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400',
    slate:   'text-slate-600 bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400',
    gray:    'text-gray-600 bg-gray-50 dark:bg-gray-500/10 dark:text-gray-400',
};

const BG_MAP: Record<StatCardColor, string> = {
    blue:    'bg-blue-500',
    emerald: 'bg-emerald-500',
    amber:   'bg-primary-500',
    rose:    'bg-rose-500',
    violet:  'bg-violet-500',
    cyan:    'bg-cyan-500',
    indigo:  'bg-indigo-500',
    orange:  'bg-orange-500',
    purple:  'bg-purple-500',
    slate:   'bg-slate-500',
    gray:    'bg-gray-500',
};

/**
 * Reusable Stat Card — Standard pattern for CIC ERP QLDA
 */
export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon,
    color = 'blue',
    sublabel,
    trend,
    trendLabel,
    trendPercentage,
    targetValue,
    progressLabel,
    progressPercentage,
    loading,
    footer,
    className = '',
    onClick,
}) => {
    const iconCls = COLOR_MAP[color] || COLOR_MAP.blue;
    const bgCls = BG_MAP[color] || BG_MAP.blue;

    return (
        <div
            className={`
                relative overflow-hidden flex flex-col gap-2 p-4 rounded-xl
                bg-[#FCF9F2] dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                shadow-sm h-full transition-all duration-200
                ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600' : ''}
                ${className}
            `}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
        >
            {/* Row 1: Label + Trend */}
            <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase leading-none min-h-[14px]">
                    {label}
                </div>
                {(trendPercentage !== undefined || trend) && (
                    <div className={`flex items-center gap-0.5 text-[10px] font-bold ${
                        (trendPercentage !== undefined && trendPercentage >= 0) || trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                        {((trendPercentage !== undefined && trendPercentage >= 0) || trend === 'up') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trendPercentage !== undefined && <span>{Math.abs(trendPercentage)}%</span>}
                        {trendLabel && <span className="text-slate-400 dark:text-slate-500 font-medium ml-0.5">{trendLabel}</span>}
                    </div>
                )}
            </div>

            {/* Row 2: Value + Icon inline */}
            <div className="flex items-center justify-between gap-2 mt-1">
                <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5 min-w-0">
                    <div className="text-xl lg:text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none">
                        {loading ? <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /> : value}
                    </div>
                    {targetValue && !loading && (
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate mt-1 lg:mt-0">
                            / {targetValue}
                        </span>
                    )}
                </div>
                <div className={`shrink-0 p-2 rounded-xl ${iconCls}`}>
                    {icon}
                </div>
            </div>

            {/* Row 3: Sublabel (Legacy pattern) or Progress bar (Dashboard pattern) */}
            {progressPercentage !== undefined && progressLabel ? (
                <div className="mt-1">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{progressLabel}</span>
                        <span className={`text-[10px] font-bold ${COLOR_MAP[color]?.split(' ')[0]}`}>{progressPercentage}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${bgCls} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}></div>
                    </div>
                </div>
            ) : sublabel ? (
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-none mt-1">
                    {sublabel}
                </div>
            ) : (
                <div className="h-px" /> /* Spacer if no extra bottom text */
            )}

            {/* Row 4: Footer element */}
            {footer && (
                <div className="mt-auto pt-1">
                    {footer}
                </div>
            )}
        </div>
    );
};
