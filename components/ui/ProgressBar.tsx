import React from 'react';

// ========================================
// PROGRESS BAR — Design System v2
// Replaces repeated progress bar patterns
// ========================================

export type ProgressBarSize = 'xs' | 'sm' | 'md' | 'lg';
export type ProgressBarColor = 'auto' | 'emerald' | 'amber' | 'blue' | 'primary' | 'red' | 'slate';

export interface ProgressBarProps {
    /** Value 0-100 */
    value: number;
    /** Color mode: 'auto' uses green/amber/grey based on value */
    color?: ProgressBarColor;
    size?: ProgressBarSize;
    /** Show percentage label */
    showLabel?: boolean;
    /** Custom label text (overrides percentage) */
    label?: string;
    className?: string;
}

const sizeStyles: Record<ProgressBarSize, string> = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
};

const colorStyles: Record<Exclude<ProgressBarColor, 'auto'>, string> = {
    emerald: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
    amber: 'bg-gradient-to-r from-primary-400 to-primary-500',
    blue: 'bg-gradient-to-r from-blue-400 to-blue-500',
    primary: 'bg-gradient-to-r from-primary-400 to-primary-500',
    red: 'bg-gradient-to-r from-red-400 to-red-500',
    slate: 'bg-slate-300 dark:bg-slate-50 dark:bg-slate-8000',
};

function getAutoColor(value: number): string {
    if (value >= 80) return colorStyles.emerald;
    if (value >= 40) return colorStyles.amber;
    return colorStyles.slate;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    color = 'auto',
    size = 'sm',
    showLabel = false,
    label,
    className = '',
}) => {
    const clampedValue = Math.min(Math.max(value, 0), 100);
    const fillColor = color === 'auto' ? getAutoColor(clampedValue) : colorStyles[color];

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className={`flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden ${sizeStyles[size]}`}>
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${fillColor}`}
                    style={{ width: `${clampedValue}%` }}
                />
            </div>
            {(showLabel || label) && (
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                    {label || `${clampedValue.toFixed(0)}%`}
                </span>
            )}
        </div>
    );
};

export default ProgressBar;
