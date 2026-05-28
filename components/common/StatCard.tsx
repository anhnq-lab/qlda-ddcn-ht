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
     */
    footer?: React.ReactNode;
    /**
     * Compact mode to reduce padding and font sizes for dense layouts.
     */
    compact?: boolean;
    /** Extra Tailwind classes applied to the card's root element. */
    className?: string;
    /**
     * Click handler. When provided the card becomes a focusable button-like element
     * with hover/focus styles and keyboard activation (Enter / Space).
     */
    onClick?: () => void;
    /** Sparkline data for drawing a mini chart next to the value. */
    sparklineData?: number[];
    /** Sparkline stroke color. If omitted, uses card color theme. */
    sparklineColor?: string;
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
    slate:   'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400',
    gray:    'text-gray-600 bg-gray-50 dark:bg-gray-500 dark:text-gray-400',
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
    primary: 'border-t-primary-500',
    success: 'border-t-success-500',
    warning: 'border-t-warning-500',
    danger:  'border-t-danger-500',
    info:    'border-t-info-500',
    blue:    'border-t-info-500',
    emerald: 'border-t-success-500',
    amber:   'border-t-warning-500',
    rose:    'border-t-danger-500',
    violet:  'border-t-primary-500',
    cyan:    'border-t-info-500',
    indigo:  'border-t-primary-500',
    orange:  'border-t-warning-500',
    purple:  'border-t-warning-500',
    slate:   'border-t-slate-500',
    gray:    'border-t-gray-500',
};

const AnimatedValue: React.FC<{ value: string | number }> = ({ value }) => {
    const [displayVal, setDisplayVal] = React.useState<string | number>(typeof value === 'number' ? 0 : '0');

    React.useEffect(() => {
        const strVal = String(value);
        // Match numbers, allowing for dots/commas
        const match = strVal.match(/^([\d.,]+)(.*)$/);
        
        if (!match) {
            setDisplayVal(value);
            return;
        }

        const numStr = match[1].replace(/,/g, '');
        const numVal = parseFloat(numStr);
        const suffix = match[2];

        if (isNaN(numVal) || numVal <= 0) {
            setDisplayVal(value);
            return;
        }

        const duration = 800; // ms
        const steps = 30;
        const stepTime = duration / steps;
        const increment = numVal / steps;
        let currentStep = 0;
        let start = 0;

        const timer = setInterval(() => {
            currentStep++;
            if (currentStep >= steps) {
                setDisplayVal(value);
                clearInterval(timer);
            } else {
                start += increment;
                const decimalPlaces = (numStr.split('.')[1] || '').length;
                let formattedNum = start.toFixed(decimalPlaces);
                if (strVal.includes(',')) {
                    const parts = formattedNum.split('.');
                    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    formattedNum = parts.join('.');
                }
                setDisplayVal(formattedNum + suffix);
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [value]);

    return <>{displayVal}</>;
};

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    if (!data || data.length < 2) return null;
    const width = 60;
    const height = 18;
    const padding = 1.5;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;
    
    const points = data.map((val, index) => {
        const x = padding + (index / (data.length - 1)) * (width - padding * 2);
        const y = padding + (1 - (val - min) / range) * (height - padding * 2);
        return `${x},${y}`;
    }).join(' ');
    
    return (
        <svg width={width} height={height} className="overflow-visible shrink-0">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
};

/**
 * StatCard — Reusable KPI tile for CIC ERP QLDA dashboards.
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
    compact = false,
    sparklineData,
    sparklineColor,
}) => {
    const iconCls = COLOR_MAP[color] || COLOR_MAP.blue;
    const bgCls = BG_MAP[color] || BG_MAP.blue;
    const borderTopCls = BORDER_TOP_MAP[color] || BORDER_TOP_MAP.blue;

    const wrapperPaddingAndGap = compact 
        ? 'p-3 pt-2.5 pb-3 rounded-xl gap-1 border-t-2' 
        : 'p-5 rounded-2xl gap-2 border-t-[3px]';

    const labelSize = compact 
        ? 'text-[11px] min-h-[12px]' 
        : 'text-[12px] min-h-[14px]';

    const valueSize = compact 
        ? 'text-lg font-extrabold' 
        : 'text-2xl font-black';

    const sparkColor = sparklineColor || (
        color === 'success' || color === 'emerald' ? '#10b981' :
        color === 'warning' || color === 'amber' || color === 'orange' ? '#f59e0b' :
        color === 'danger' || color === 'rose' ? '#ef4444' :
        color === 'primary' || color === 'indigo' || color === 'blue' ? '#3b82f6' :
        '#64748b'
    );

    const iconWrapperCls = compact 
        ? 'p-1.5 rounded-lg [&_svg]:w-3.5 [&_svg]:h-3.5' 
        : 'p-2 rounded-xl [&_svg]:w-5 [&_svg]:h-5';

    return (
        <div
            className={`
                relative overflow-hidden flex flex-col bg-bg-surface border border-border
                shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] 
                h-full transition-all duration-200 ${wrapperPaddingAndGap} ${borderTopCls}
                hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] 
                hover:-translate-y-0.5
                ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''}
                ${className}
            `}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
        >
            {/* Row 1: Label + Trend */}
            <div className="flex items-center justify-between">
                <div className={`flex items-center font-black text-txt-secondary tracking-wider uppercase leading-none ${labelSize}`}>
                    {label}
                </div>
                {(trendPercentage !== undefined || trend) && (
                    <div className={`flex items-center gap-0.5 text-[11px] font-bold ${
                        (trendPercentage !== undefined && trendPercentage >= 0) || trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                        {((trendPercentage !== undefined && trendPercentage >= 0) || trend === 'up') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trendPercentage !== undefined && <span>{Math.abs(trendPercentage)}%</span>}
                        {trendLabel && <span className="text-txt-muted font-medium ml-0.5">{trendLabel}</span>}
                    </div>
                )}
            </div>

            {/* Row 2: Value + Icon inline */}
            <div className="flex items-center justify-between gap-2 mt-0.5">
                <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5 min-w-0">
                    <div className={`text-txt-primary tracking-tight leading-none ${valueSize}`}>
                        {loading ? (
                            <div className={`${compact ? 'h-5 w-16' : 'h-7 w-20'} bg-slate-200 dark:bg-slate-800 rounded animate-pulse`} />
                        ) : (
                            typeof value === 'string' || typeof value === 'number' ? <AnimatedValue value={value} /> : value
                        )}
                    </div>
                    {targetValue && !loading && (
                        <span className={`${compact ? 'text-[11px]' : 'text-xs'} font-medium text-txt-muted truncate mt-1 lg:mt-0`}>
                            / {targetValue}
                        </span>
                    )}
                    {compact && progressPercentage !== undefined && !loading && (
                        <span className="text-[11px] font-bold text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/30 px-1 rounded-md">
                            {progressPercentage}%
                        </span>
                    )}
                </div>
                {sparklineData && sparklineData.length > 1 && !loading && (
                    <div className="ml-auto mr-1 hidden sm:block">
                        <Sparkline data={sparklineData} color={sparkColor} />
                    </div>
                )}
                <div className={`shrink-0 ${iconWrapperCls} ${iconCls}`}>
                    {icon}
                </div>
            </div>

            {/* Row 3: Sublabel (Legacy pattern) or Progress bar (Dashboard pattern) */}
            {progressPercentage !== undefined && progressLabel && !compact ? (
                <div className="mt-1">
                    <div className="flex justify-between items-center mb-0.5">
                        <span className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-bold text-txt-muted uppercase tracking-wider`}>{progressLabel}</span>
                        <span className={`${compact ? 'text-[11px]' : 'text-[12px]'} font-bold ${COLOR_MAP[color]?.split(' ')[0]}`}>{progressPercentage}%</span>
                    </div>
                    <div className={`${compact ? 'h-1' : 'h-1.5'} w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden`}>
                        <div className={`h-full ${bgCls} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}></div>
                    </div>
                </div>
            ) : sublabel ? (
                <div className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-medium text-txt-muted leading-none mt-1`}>
                    {sublabel}
                </div>
            ) : (
                null
            )}

            {/* Row 4: Footer element */}
            {footer && (
                <div className="mt-auto pt-1">
                    {footer}
                </div>
            )}

            {/* Bottom Progress Bar for Compact mode */}
            {compact && progressPercentage !== undefined && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-200/50 dark:bg-slate-800 overflow-hidden">
                    <div className={`h-full ${bgCls} transition-all duration-1000 ease-out`} style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}></div>
                </div>
            )}
        </div>
    );
};
