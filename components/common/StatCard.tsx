import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export type StatCardColor = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'slate' | 'gray' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan' | 'indigo' | 'orange' | 'purple';

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

// COLOR_MAP: icon container color classes per StatCard color prop
// NOTE: 'amber' → warning-* (amber/yellow). Do NOT alias to primary-* (teal).
const COLOR_MAP: Record<StatCardColor, string> = {
    primary: 'text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-400',
    success: 'text-success-600 bg-success-50 dark:bg-success-900/30 dark:text-success-400',
    warning: 'text-warning-700 bg-warning-50 dark:bg-warning-900/30 dark:text-warning-400',
    danger:  'text-danger-600 bg-danger-50 dark:bg-danger-900/30 dark:text-danger-400',
    info:    'text-info-600 bg-info-50 dark:bg-info-900/30 dark:text-info-400',
    blue:    'text-info-600 bg-info-50 dark:bg-info-900/30 dark:text-info-400',
    emerald: 'text-success-600 bg-success-50 dark:bg-success-900/30 dark:text-success-400',
    amber:   'text-warning-700 bg-warning-50 dark:bg-warning-900/30 dark:text-warning-400',
    rose:    'text-danger-600 bg-danger-50 dark:bg-danger-900/30 dark:text-danger-400',
    violet:  'text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-400',
    cyan:    'text-info-600 bg-info-50 dark:bg-info-900/30 dark:text-info-400',
    indigo:  'text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-400',
    orange:  'text-warning-600 bg-warning-50 dark:bg-warning-900/30 dark:text-warning-400',
    purple:  'text-warning-600 bg-warning-50 dark:bg-warning-900/30 dark:text-warning-400',
    slate:   'text-slate-600 bg-slate-50 dark:bg-slate- dark:text-slate-400',
    gray:    'text-gray-600 bg-gray-50 dark:bg-gray-500/10 dark:text-gray-400',
};

const BG_MAP: Record<StatCardColor, string> = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger:  'bg-danger-500',
    info:    'bg-info-500',
    blue:    'bg-info-500',
    emerald: 'bg-success-500',
    amber:   'bg-warning-500',
    rose:    'bg-danger-500',
    violet:  'bg-primary-500',
    cyan:    'bg-info-500',
    indigo:  'bg-primary-500',
    orange:  'bg-warning-500',
    purple:  'bg-warning-500',
    slate:   'bg-slate-500',
    gray:    'bg-gray-500',
};

// BORDER_TOP_MAP: Accent top border color per color prop
const BORDER_TOP_MAP: Record<StatCardColor, string> = {
    primary: 'dark:border-t-primary-500 border-t-transparent',
    success: 'dark:border-t-success-500 border-t-transparent',
    warning: 'dark:border-t-warning-500 border-t-transparent',
    danger:  'dark:border-t-danger-500 border-t-transparent',
    info:    'dark:border-t-info-500 border-t-transparent',
    blue:    'dark:border-t-info-500 border-t-transparent',
    emerald: 'dark:border-t-success-500 border-t-transparent',
    amber:   'dark:border-t-warning-500 border-t-transparent',
    rose:    'dark:border-t-danger-500 border-t-transparent',
    violet:  'dark:border-t-primary-500 border-t-transparent',
    cyan:    'dark:border-t-info-500 border-t-transparent',
    indigo:  'dark:border-t-primary-500 border-t-transparent',
    orange:  'dark:border-t-warning-500 border-t-transparent',
    purple:  'dark:border-t-warning-500 border-t-transparent',
    slate:   'dark:border-t-slate-500 border-t-transparent',
    gray:    'dark:border-t-gray-500 border-t-transparent',
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
    const borderTopCls = BORDER_TOP_MAP[color] || BORDER_TOP_MAP.blue;

    return (
        <div
            className={`
                relative overflow-hidden flex flex-col gap-2 p-4 rounded-xl
                bg-white dark:bg-slate-900 border border-border-DEFAULT dark:border-slate-700
                shadow-sm h-full transition-all duration-200 border-t-[3px] ${borderTopCls}
                ${onClick ? 'cursor-pointer hover:shadow-md hover:border-primary-200 dark:hover:border-slate-600' : ''}
                ${className}
            `}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
        >
            {/* Row 1: Label + Trend */}
            <div className="flex items-center justify-between">
                <div className="flex items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase leading-none min-h-[14px]">
                    {label}
                </div>
                {(trendPercentage !== undefined || trend) && (
                    <div className={`flex items-center gap-0.5 text-[10px] font-bold ${
                        (trendPercentage !== undefined && trendPercentage >= 0) || trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                        {((trendPercentage !== undefined && trendPercentage >= 0) || trend === 'up') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trendPercentage !== undefined && <span>{Math.abs(trendPercentage)}%</span>}
                        {trendLabel && <span className="text-slate-400 dark:text-slate-400 font-medium ml-0.5">{trendLabel}</span>}
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
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-400 truncate mt-1 lg:mt-0">
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
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{progressLabel}</span>
                        <span className={`text-[10px] font-bold ${COLOR_MAP[color]?.split(' ')[0]}`}>{progressPercentage}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${bgCls} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}></div>
                    </div>
                </div>
            ) : sublabel ? (
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-400 leading-none mt-1">
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
