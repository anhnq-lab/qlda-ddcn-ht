import React from 'react';

// ========================================
// FORM SECTION - Design System v2.1
// Wrapper cho form fields với tiêu đề section
// ========================================

export interface FormSectionProps {
    /** Tiêu đề section */
    title: string;
    /** Mô tả / hướng dẫn */
    description?: string;
    /** Icon bên cạnh tiêu đề */
    icon?: React.ReactNode;
    /** Slot action góc phải */
    action?: React.ReactNode;
    /** Số cột grid (default: 2 cột) */
    columns?: 1 | 2 | 3 | 4;
    /** Padding nội dung */
    contentPadding?: boolean;
    /** Thêm divider bên dưới */
    divider?: boolean;
    /** Nếu true: collapsible section */
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    children: React.ReactNode;
    className?: string;
}

const GRID_COLS: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export const FormSection: React.FC<FormSectionProps> = ({
    title,
    description,
    icon,
    action,
    columns = 2,
    contentPadding = false,
    divider = true,
    collapsible = false,
    defaultCollapsed = false,
    children,
    className = '',
}) => {
    const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

    return (
        <div className={`${divider ? 'border-b border-border pb-6 mb-6 last:border-0 last:mb-0 last:pb-0' : ''} ${className}`}>
            {/* Section header */}
            <div
                className={`flex items-start justify-between mb-4 ${collapsible ? 'cursor-pointer select-none' : ''}`}
                onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
            >
                <div className="flex items-center gap-2">
                    {icon && (
                        <span className="text-primary-500 dark:text-primary-400 shrink-0">
                            {icon}
                        </span>
                    )}
                    <div>
                        <h3 className="text-sm font-bold text-txt-primary uppercase tracking-wider">
                            {title}
                        </h3>
                        {description && (
                            <p className="text-xs text-txt-muted mt-0.5 font-normal normal-case tracking-normal">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {action && <div className="shrink-0">{action}</div>}
                    {collapsible && (
                        <svg
                            className={`w-4 h-4 text-txt-muted transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Content */}
            {!collapsed && (
                <div className={`
                    grid ${GRID_COLS[columns]} gap-4
                    ${contentPadding ? 'p-4 bg-bg-subtle rounded-xl' : ''}
                `}>
                    {children}
                </div>
            )}
        </div>
    );
};

// ========================================
// FORM FIELD - Label + input wrapper
// ========================================

export interface FormFieldProps {
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    /** Chiếm toàn bộ chiều rộng (span) */
    fullWidth?: boolean;
    children: React.ReactNode;
    className?: string;
    htmlFor?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    required = false,
    error,
    hint,
    fullWidth = false,
    children,
    className = '',
    htmlFor,
}) => {
    return (
        <div className={`${fullWidth ? 'col-span-full' : ''} ${className}`}>
            <label
                htmlFor={htmlFor}
                className="block text-xs font-semibold text-txt-secondary mb-1.5 uppercase tracking-wide"
            >
                {label}
                {required && <span className="text-danger-500 ml-0.5">*</span>}
            </label>
            {children}
            {error && (
                <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{error}</p>
            )}
            {hint && !error && (
                <p className="mt-1 text-xs text-txt-placeholder">{hint}</p>
            )}
        </div>
    );
};

export default FormSection;
