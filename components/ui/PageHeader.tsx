import React from 'react';
import { LucideIcon } from 'lucide-react';

// ========================================
// PAGE HEADER - Design System v2.1
// Dùng cho tất cả page-level headers
// ========================================

export interface PageHeaderAction {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    disabled?: boolean;
    loading?: boolean;
    /** Ẩn trên mobile */
    hideOnMobile?: boolean;
}

export interface BreadcrumbItem {
    label: string;
    href?: string;
    onClick?: () => void;
}

export interface PageHeaderProps {
    /** Tiêu đề chính */
    title: React.ReactNode;
    /** Mô tả / subtitle */
    description?: React.ReactNode;
    /** Icon bên cạnh tiêu đề */
    icon?: React.ReactNode;
    /** Màu sắc icon background */
    iconColor?: string;
    /** Breadcrumb navigation */
    breadcrumbs?: BreadcrumbItem[];
    /** Các nút hành động (góc phải) */
    actions?: React.ReactNode;
    /** Badge / status bên cạnh tiêu đề */
    badge?: React.ReactNode;
    /** Stats row ngay dưới title */
    stats?: React.ReactNode;
    /** Tabs navigation */
    tabs?: React.ReactNode;
    /** Custom class */
    className?: string;
    /** Nếu true: thêm border dưới + sticky */
    sticky?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    icon,
    iconColor = 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400',
    breadcrumbs,
    actions,
    badge,
    stats,
    tabs,
    className = '',
    sticky = false,
}) => {
    return (
        <div className={`
            bg-white dark:bg-slate-800
            border-b border-border-DEFAULT dark:border-slate-700/60
            ${sticky ? 'sticky top-0 z-20' : ''}
            ${className}
        `}>
            <div className={`px-6 pt-5 ${tabs || stats ? 'pb-0' : 'pb-5'}`}>
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center gap-1.5 text-xs text-txt-muted dark:text-slate-400 mb-3">
                        {breadcrumbs.map((crumb, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <span className="text-border-DEFAULT dark:text-slate-600">/</span>}
                                {crumb.href || crumb.onClick ? (
                                    <button
                                        onClick={crumb.onClick}
                                        className="hover:text-txt-secondary dark:hover:text-slate-300 transition-colors"
                                    >
                                        {crumb.label}
                                    </button>
                                ) : (
                                    <span className="text-txt-secondary dark:text-slate-300 font-medium">{crumb.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                )}

                {/* Title row */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {icon && (
                            <div className={`p-2.5 rounded-xl shrink-0 ${iconColor}`}>
                                {icon}
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold text-txt-primary dark:text-white truncate">
                                    {title}
                                </h1>
                                {badge && <div className="shrink-0">{badge}</div>}
                            </div>
                            {description && (
                                <p className="text-sm text-txt-muted dark:text-slate-400 mt-0.5 line-clamp-2">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    {actions && (
                        <div className="flex items-center gap-2 shrink-0">
                            {actions}
                        </div>
                    )}
                </div>

                {/* Stats row */}
                {stats && (
                    <div className="mt-4">
                        {stats}
                    </div>
                )}

                {/* Tabs */}
                {tabs && (
                    <div className="mt-4">
                        {tabs}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
