import React from 'react';
import { Search, X } from 'lucide-react';

// ========================================
// TOOLBAR — Design System v2
// Search + Filters + Actions container
// ========================================

export interface ToolbarProps {
    /** Search value */
    searchValue?: string;
    /** Search change handler */
    onSearchChange?: (value: string) => void;
    /** Search placeholder */
    searchPlaceholder?: string;
    /** Slot for filter controls (tabs, selects, etc.) */
    filters?: React.ReactNode;
    /** Slot for action buttons (create, export, etc.) */
    actions?: React.ReactNode;
    /** Result count text, e.g. "12 / 50 dự án" */
    resultText?: string;
    className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Tìm kiếm...',
    filters,
    actions,
    resultText,
    className = '',
}) => {
    return (
        <div
            className={`
                bg-bg-surface
                rounded-2xl shadow-card
                border border-border
                p-4
                ${className}
            `.replace(/\s+/g, ' ').trim()}
        >
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                {/* Search Input */}
                {onSearchChange && (
                    <div className="relative flex-1 min-w-[200px] max-w-[400px] w-full lg:w-auto">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-placeholder w-4 h-4" />
                        <input
                            type="text"
                            value={searchValue || ''}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            className={`
                                w-full pl-10 pr-8 py-2.5
                                bg-bg-subtle
                                border border-border
                                rounded-xl text-sm font-medium
                                text-txt-primary
                                placeholder:text-txt-placeholder
                                focus:outline-none focus:ring-2 focus:ring-focus/30 focus:border-primary-400
                                transition-all
                            `.replace(/\s+/g, ' ').trim()}
                            aria-label={searchPlaceholder}
                        />
                        {searchValue && (
                            <button
                                type="button"
                                onClick={() => onSearchChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-secondary transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Filters slot */}
                {filters && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {filters}
                    </div>
                )}

                {/* Spacer + result text + actions */}
                <div className="ml-auto flex items-center gap-3 shrink-0">
                    {resultText && (
                        <span className="text-xs text-txt-muted font-medium whitespace-nowrap hidden sm:inline">
                            {resultText}
                        </span>
                    )}
                    {actions}
                </div>
            </div>
        </div>
    );
};

export default Toolbar;
