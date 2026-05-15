import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export type StatCardColor = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'slate' | 'gray' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan' | 'indigo' | 'orange' | 'purple';

/**
 * Props for the StatCard component.
 *
 * StatCard renders a KPI tile with a label, numeric value, icon, optional trend
 * indicator, progress bar, and footer slot. It is the canonical "statistic card"
 * pattern used across all dashboard and report pages in CIC ERP QLDA.
 */
interface StatCardProps {
    /**
     * Primary title displayed in the upper-left of the card.
     * Rendered in small-caps uppercase. Accepts ReactNode for rich content.
     */
    label: string | React.ReactNode;
    /**
     * The main statistic value displayed prominently in the card body.
     * Accepts `string`, `number`, or a custom `ReactNode` (e.g. a formatted
     * currency string). Replaced by a skeleton shimmer while `loading` is true.
     */
    value: string | number | React.ReactNode;
    /**
     * Icon rendered inside a coloured pill on the right of the value row.
     * Should be a Lucide icon element sized at ~20px (e.g. `<FolderOpen size={20} />`).
     * The pill background colour is determined by the `color` prop.
     */
    icon: React.ReactNode;
    /**
     * Accent colour theme for the icon container and the top border stripe.
     * Maps to a predefined set of semantic and Tailwind colour aliases.
     * Defaults to `"blue"`.
     */
    color?: StatCardColor;
    /**
     * Short descriptive text displayed below the value block (legacy pattern).
     * Use `progressLabel` + `progressPercentage` for the dashboard pattern instead.
     */
    sublabel?: string;
    /**
     * Trend direction indicator shown in the upper-right corner.
     * `"up"` renders a green `TrendingUp` icon; `"down"` renders a red `TrendingDown` icon.
     * Use together with `trendPercentage` for a percentage badge.
     */
    trend?: 'up' | 'down';
    /**
     * Secondary label shown next to the trend icon (e.g. `"so với tháng trước"`).
     */
    trendLabel?: string;
    /**
     * Numeric percentage shown in the trend badge.
     * Positive values are rendered green; negative values red — regardless of `trend`.
     */
    trendPercentage?: number;
    /**
     * Optional target/benchmark value displayed as `"/ {targetValue}"` to the right
     * of the main `value` (e.g. value `42` with targetValue `100` → `"42 / 100"`).
     */
    targetValue?: string | number;
    /**
     * Label for the inline progress bar shown at the bottom of the card
     * (dashboard pattern). Requires `progressPercentage` to be set.
     */
    progressLabel?: string;
    /**
     * Percentage (0–100) for the inline progress bar.
     * Values outside the range are clamped automatically.
     */
    progressPercentage?: number;
    /**
     * When `true`, the `value` area is replaced with a skeleton shimmer animation
     * to indicate that data is still loading.
     */
    loading?: boolean;
    /**
     * Arbitrary ReactNode rendered at the very bottom of the card (e.g. a badge,
     * a mini chart, or a "View details" link).
     */
    footer?: React.ReactNode;
    /** Extra Tailwind classes applied to the card's root element. */
    className?: string;
    /**
     * Click handler. When provided the card becomes a focusable button-like element
     * with hover/focus styles and keyboard activation (Enter / Space).
     */
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
 * StatCard — Reusable KPI tile for CIC ERP QLDA dashboards.
 *
 * Renders a compact statistics card with four layout rows:
 * 1. **Label row** — primary title (upper-left) + optional trend badge (upper-right).
 * 2. **Value row** — large stat value (lower-left) + coloured icon pill (lower-right).
 *    Optional `targetValue` is appended as `"/ targetValue"`.
 * 3. **Detail row** — either an inline progress bar (`progressLabel` + `progressPercentage`)
 *    or a short `sublabel` text. Mutually exclusive.
 * 4. **Footer slot** — optional `footer` ReactNode pushed to the bottom.
 *
 * The top border stripe colour and icon container background are controlled by
 * the `color` prop via `BORDER_TOP_MAP` and `COLOR_MAP` respectively.
 *
 * @example
 * ```tsx
 * <StatCard
 *   label="Tổng dự án"
 *   value={42}
 *   icon={<FolderOpen size={20} />}
 *   color="primary"
 *   trend="up"
 *   trendPercentage={12}
 *   trendLabel="so với tháng trước"
 * />
 * ```
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
