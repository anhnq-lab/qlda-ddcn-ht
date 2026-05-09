import React from 'react';

// ========================================
// DETAIL LAYOUT - Design System v2.1
// Chuẩn layout cho tất cả detail pages
// ========================================

export interface TabItem {
    id: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    badge?: React.ReactNode;
    disabled?: boolean;
    hidden?: boolean;
}

export interface TabNavProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    className?: string;
    /** Variant: underline (default), pill, button */
    variant?: 'underline' | 'pill' | 'button';
    size?: 'sm' | 'md';
}

// ========================================
// TAB NAV
// ========================================
export const TabNav: React.FC<TabNavProps> = ({
    tabs,
    activeTab,
    onTabChange,
    className = '',
    variant = 'underline',
    size = 'md',
}) => {
    const visibleTabs = tabs.filter(t => !t.hidden);

    if (variant === 'underline') {
        return (
            <div className={`flex gap-1 overflow-x-auto scrollbar-hide ${className}`}>
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => !tab.disabled && onTabChange(tab.id)}
                        disabled={tab.disabled}
                        className={`
                            flex items-center gap-1.5 whitespace-nowrap
                            ${size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'}
                            font-medium border-b-2 transition-all duration-150
                            ${activeTab === tab.id
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-txt-muted dark:text-slate-400 hover:text-txt-secondary dark:hover:text-slate-300 hover:border-border-DEFAULT dark:hover:border-slate-600'
                            }
                            ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                        {tab.label}
                        {tab.badge && <span className="shrink-0">{tab.badge}</span>}
                    </button>
                ))}
            </div>
        );
    }

    if (variant === 'pill') {
        return (
            <div className={`flex items-center gap-1 flex-wrap ${className}`}>
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => !tab.disabled && onTabChange(tab.id)}
                        disabled={tab.disabled}
                        className={`
                            flex items-center gap-1.5 whitespace-nowrap rounded-full
                            ${size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'}
                            font-medium transition-all duration-150
                            ${activeTab === tab.id
                                ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300'
                                : 'text-txt-muted dark:text-slate-400 hover:bg-bg-muted dark:hover:bg-slate-700'
                            }
                            ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                        {tab.label}
                        {tab.badge && <span className="shrink-0">{tab.badge}</span>}
                    </button>
                ))}
            </div>
        );
    }

    // Button variant
    return (
        <div className={`inline-flex items-center gap-0.5 p-1 bg-bg-subtle dark:bg-slate-800 rounded-lg ${className}`}>
            {visibleTabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => !tab.disabled && onTabChange(tab.id)}
                    disabled={tab.disabled}
                    className={`
                        flex items-center gap-1.5 whitespace-nowrap rounded-md
                        ${size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
                        font-medium transition-all duration-150
                        ${activeTab === tab.id
                            ? 'bg-bg-surface dark:bg-slate-700 text-txt-primary dark:text-white shadow-sm'
                            : 'text-txt-muted dark:text-slate-400 hover:text-txt-secondary dark:hover:text-slate-300'
                        }
                        ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                    {tab.label}
                    {tab.badge && <span className="shrink-0">{tab.badge}</span>}
                </button>
            ))}
        </div>
    );
};

// ========================================
// DETAIL LAYOUT WRAPPER
// ========================================

export interface DetailLayoutProps {
    /** Header content */
    header: React.ReactNode;
    /** Tabs navigation */
    tabs?: React.ReactNode;
    /** Main content */
    children: React.ReactNode;
    /** Sidebar (optional — right panel) */
    sidebar?: React.ReactNode;
    /** Sidebar width */
    sidebarWidth?: string;
    /** Max content width */
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    className?: string;
}

const MAX_WIDTH_MAP: Record<string, string> = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
};

export const DetailLayout: React.FC<DetailLayoutProps> = ({
    header,
    tabs,
    children,
    sidebar,
    sidebarWidth = 'w-80',
    maxWidth = 'full',
    className = '',
}) => {
    return (
        <div className={`flex flex-col h-full bg-bg-app dark:bg-slate-950 ${className}`}>
            {/* Header */}
            <div className="shrink-0">
                {header}
            </div>

            {/* Tabs */}
            {tabs && (
                <div className="shrink-0 px-6 border-b border-border-DEFAULT dark:border-slate-700/60 bg-bg-surface dark:bg-slate-900">
                    {tabs}
                </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-auto">
                {sidebar ? (
                    <div className="flex h-full">
                        {/* Main content */}
                        <div className={`flex-1 overflow-auto p-6 ${MAX_WIDTH_MAP[maxWidth]} mx-auto`}>
                            {children}
                        </div>
                        {/* Sidebar */}
                        <div className={`${sidebarWidth} shrink-0 border-l border-border-DEFAULT dark:border-slate-700/60 overflow-auto bg-bg-surface dark:bg-slate-900`}>
                            {sidebar}
                        </div>
                    </div>
                ) : (
                    <div className={`p-6 ${MAX_WIDTH_MAP[maxWidth]} mx-auto`}>
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetailLayout;
