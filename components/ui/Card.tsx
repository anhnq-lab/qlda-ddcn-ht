import React from 'react';

// ========================================
// CARD COMPONENT - Design System v2
// ========================================

export type CardVariant = 'default' | 'outlined' | 'elevated' | 'glass' | 'gradient';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps {
    variant?: CardVariant;
    padding?: CardPadding;
    hover?: boolean;
    clickable?: boolean;
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
}

// Dùng CSS variables (--bg-surface, --border-default) thay hardcoded colors
const variantStyles: Record<CardVariant, string> = {
    default: `
        bg-bg-surface border border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)]
    `,
    outlined: `
        bg-bg-surface border-2 border-border
    `,
    elevated: `
        bg-bg-surface border border-border-subtle shadow-[0_8px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]
    `,
    glass: `
        bg-bg-surface/70 backdrop-blur-xl border border-border-subtle shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)]
    `,
    gradient: `
        bg-gradient-to-br from-bg-surface to-bg-subtle border border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)]
    `,
};

const paddingStyles: Record<CardPadding, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    (
        {
            variant = 'default',
            padding = 'lg',
            hover = false,
            clickable = false,
            className = '',
            children,
            onClick,
            ...props
        },
        ref
    ) => {
        const baseStyles = `
            rounded-2xl
            transition-all duration-200 ease-out
        `;

        const hoverStyles = hover || clickable ? `
            hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] 
            hover:-translate-y-0.5 cursor-pointer
        ` : '';

        const focusStyles = clickable ? `
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        ` : '';

        const Component = clickable ? 'button' : 'div';

        return (
            <Component
                ref={ref as any}
                onClick={onClick}
                className={`
                    ${baseStyles}
                    ${variantStyles[variant]}
                    ${paddingStyles[padding]}
                    ${hoverStyles}
                    ${focusStyles}
                    ${className}
                `.replace(/\s+/g, ' ').trim()}
                {...props}
            >
                {children}
            </Component>
        );
    }
);

Card.displayName = 'Card';

// ========================================
// CARD HEADER
// ========================================

interface CardHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
    title,
    subtitle,
    icon,
    action,
    className = '',
}) => {
    return (
        <div className={`flex items-start justify-between gap-4 ${className}`}>
            <div className="flex items-start gap-3">
                {icon && (
                    <div className="p-2 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 shrink-0">
                        {icon}
                    </div>
                )}
                <div>
                    <h3 className="text-sm font-bold text-txt-primary uppercase tracking-wider">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-xs text-txt-muted mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
};

// ========================================
// CARD BODY
// ========================================

interface CardBodyProps {
    className?: string;
    children: React.ReactNode;
}

export const CardBody: React.FC<CardBodyProps> = ({ className = '', children }) => {
    return <div className={`mt-4 ${className}`}>{children}</div>;
};

// ========================================
// CARD FOOTER
// ========================================

interface CardFooterProps {
    className?: string;
    children: React.ReactNode;
    divider?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({
    className = '',
    children,
    divider = true
}) => {
    return (
        <div className={`
            mt-4 pt-4 
            ${divider ? 'border-t border-border-DEFAULT dark:border-slate-700/60' : ''} 
            ${className}
        `}>
            {children}
        </div>
    );
};

export default Card;
