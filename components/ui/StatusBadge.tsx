import React from 'react';

// ========================================
// STATUS BADGE — Design System v2
// Replaces repeated inline badge patterns:
//   bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 ...
// ========================================

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
export type BadgeSize = 'xs' | 'sm' | 'md';

export interface StatusBadgeProps {
    label: string;
    variant?: BadgeVariant;
    size?: BadgeSize;
    /** Show animated pulse dot */
    animated?: boolean;
    /** Custom icon (Lucide) */
    icon?: React.ReactNode;
    className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; ring: string; dot: string }> = {
    success: {
        bg: 'bg-success-50 dark:bg-success-900/20',
        text: 'text-success-700 dark:text-success-400',
        ring: 'ring-success-100 dark:ring-success-900/30',
        dot: 'bg-success-500',
    },
    warning: {
        bg: 'bg-warning-50 dark:bg-warning-900/20',
        text: 'text-warning-700 dark:text-warning-400',
        ring: 'ring-warning-100 dark:ring-warning-900/30',
        dot: 'bg-warning-500',
    },
    danger: {
        bg: 'bg-danger-50 dark:bg-danger-900/20',
        text: 'text-danger-700 dark:text-danger-400',
        ring: 'ring-danger-100 dark:ring-danger-900/30',
        dot: 'bg-danger-500',
    },
    info: {
        bg: 'bg-info-50 dark:bg-info-900/20',
        text: 'text-info-700 dark:text-info-400',
        ring: 'ring-info-100 dark:ring-info-900/30',
        dot: 'bg-info-500',
    },
    neutral: {
        bg: 'bg-bg-muted',
        text: 'text-txt-muted',
        ring: 'ring-slate-200 dark:ring-slate-600',
        dot: 'bg-slate-400',
    },
    primary: {
        bg: 'bg-primary-50 dark:bg-primary-900/20',
        text: 'text-primary-700 dark:text-primary-400',
        ring: 'ring-primary-100 dark:ring-primary-900/30',
        dot: 'bg-primary-500',
    },
    // NOTE: 'warning' = amber/yellow (#f59e0b). 'primary' = teal (#00668c).
};

const sizeStyles: Record<BadgeSize, string> = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3 py-1.5 gap-1.5',
};

const dotSizes: Record<BadgeSize, string> = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    label,
    variant = 'neutral',
    size = 'sm',
    animated = false,
    icon,
    className = '',
}) => {
    const styles = variantStyles[variant];

    return (
        <span
            className={`
                inline-flex items-center font-bold uppercase rounded-full
                ring-1 whitespace-nowrap
                ${styles.bg} ${styles.text} ${styles.ring}
                ${sizeStyles[size]}
                ${className}
            `.replace(/\s+/g, ' ').trim()}
        >
            {animated && (
                <span className={`${dotSizes[size]} rounded-full ${styles.dot} animate-pulse`} />
            )}
            {icon && !animated && (
                <span className="shrink-0 w-3 h-3">{icon}</span>
            )}
            {label}
        </span>
    );
};

export default StatusBadge;
