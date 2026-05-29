import React from 'react';

// ========================================
// SECTION HEADER — Design System v2
// Replaces repeated pattern:
//   text-xs font-bold text-slate-500 uppercase tracking-wider
// ========================================

export type SectionHeaderSize = 'xs' | 'sm' | 'md' | 'lg';

export interface SectionHeaderProps {
    title: React.ReactNode;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    size?: SectionHeaderSize;
    className?: string;
    /** Add bottom margin (default: true) */
    mb?: boolean;
}

const sizeStyles: Record<SectionHeaderSize, string> = {
    xs: 'text-[10px] tracking-[0.15em]',
    sm: 'text-xs tracking-wider',
    md: 'text-sm tracking-wide',
    lg: 'text-base tracking-normal',
};

const iconSizes: Record<SectionHeaderSize, string> = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    icon,
    action,
    size = 'sm',
    className = '',
    mb = true,
}) => {
    return (
        <div
            className={`
                flex items-center justify-between gap-3
                ${mb ? 'mb-3' : ''}
                ${className}
            `.replace(/\s+/g, ' ').trim()}
        >
            <h4
                className={`
                    font-bold text-txt-muted
                    uppercase flex items-center gap-2
                    ${sizeStyles[size]}
                `.replace(/\s+/g, ' ').trim()}
            >
                {icon && (
                    <span className={`${iconSizes[size]} shrink-0`}>
                        {icon}
                    </span>
                )}
                {title}
            </h4>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
};

export default SectionHeader;
