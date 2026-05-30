import React from 'react';

// ========================================
// BADGE COMPONENT — Design System v2.2
// Unified: simple variant + dark mode + size support
// Use StatusBadge for animated/icon badges
// ========================================

export type BadgeVariant =
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'primary'
    | 'neutral'
    | 'outline';

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: BadgeSize;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    default:  'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    neutral:  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    primary:  'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400',
    success:  'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400',
    warning:  'bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400',
    danger:   'bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400',
    info:     'bg-info-50 text-info-700 dark:bg-info-900/20 dark:text-info-400',
    outline:  'bg-transparent border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400',
};

const sizeStyles: Record<BadgeSize, string> = {
    xs: 'text-[9px] px-1.5 py-0.5',
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
};

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'sm',
    className = '',
}) => {
    return (
        <span
            className={`
                inline-flex items-center font-semibold rounded-full whitespace-nowrap
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${className}
            `.replace(/\s+/g, ' ').trim()}
        >
            {children}
        </span>
    );
};

export default Badge;
