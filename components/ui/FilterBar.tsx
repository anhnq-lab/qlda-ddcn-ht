import React, { useCallback } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { ViewToggle, ViewMode } from './ViewToggle';

// ========================================
// FILTER BAR - Design System v2.1
// Dùng cho tất cả list pages
// ========================================

export interface FilterOption {
    value: string;
    label: string;
    count?: number;
    icon?: React.ReactNode;
    color?: string;
}

export interface FilterBarFilter {
    id: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    allLabel?: string;
}

export interface FilterBarProps {
    /** Search query */
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;

    /** Filter dropdowns */
    filters?: FilterBarFilter[];

    /** View mode toggle */
    viewMode?: ViewMode;
    onViewModeChange?: (mode: ViewMode) => void;
    availableViews?: ViewMode[];

    /** Result count badge */
    resultCount?: number;
    totalCount?: number;

    /** Extra action buttons (góc phải) */
    actions?: React.ReactNode;

    /** Active filter count badge */
    activeFilterCount?: number;

    /** Callback clear all filters */
    onClearFilters?: () => void;

    /** Sort */
    sortValue?: string;
    sortOptions?: FilterOption[];
    onSortChange?: (value: string) => void;

    className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    searchValue = '',
    onSearchChange,
    searchPlaceholder = 'Tìm kiếm...',
    filters = [],
    viewMode,
    onViewModeChange,
    availableViews,
    resultCount,
    totalCount,
    actions,
    activeFilterCount = 0,
    onClearFilters,
    sortValue,
    sortOptions,
    onSortChange,
    className = '',
}) => {
    const handleSearchClear = useCallback(() => {
        onSearchChange?.('');
    }, [onSearchChange]);

    return (
        <div className={`
            flex flex-col sm:flex-row items-start sm:items-center gap-3
            px-4 py-3
            bg-bg-subtle dark:bg-slate-800/50
            border-b border-border-DEFAULT dark:border-slate-700/60
            ${className}
        `}>
            {/* Search input */}
            {onSearchChange && (
                <div className="relative flex-1 min-w-0 max-w-xs">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-placeholder dark:text-slate-500 pointer-events-none"
                    />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="
                            w-full pl-8 pr-8 py-2 text-sm
                            bg-bg-surface dark:bg-slate-700
                            border border-border-DEFAULT dark:border-slate-600
                            rounded-lg
                            text-txt-primary dark:text-slate-200
                            placeholder-txt-placeholder dark:placeholder-slate-500
                            focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400
                            transition-colors
                        "
                    />
                    {searchValue && (
                        <button
                            onClick={handleSearchClear}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-txt-muted dark:text-slate-400 hover:text-txt-primary dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>
            )}

            {/* Filter dropdowns */}
            {filters.map((filter) => (
                <div key={filter.id} className="relative">
                    <select
                        id={`filter-${filter.id}`}
                        value={filter.value}
                        onChange={(e) => filter.onChange(e.target.value)}
                        className="
                            appearance-none pl-3 pr-8 py-2 text-sm
                            bg-bg-surface dark:bg-slate-700
                            border border-border-DEFAULT dark:border-slate-600
                            rounded-lg
                            text-txt-secondary dark:text-slate-300
                            focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400
                            cursor-pointer transition-colors
                        "
                    >
                        <option value="all">{filter.allLabel || `Tất cả ${filter.label}`}</option>
                        {filter.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}{opt.count !== undefined ? ` (${opt.count})` : ''}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={13}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-txt-muted dark:text-slate-400 pointer-events-none"
                    />
                </div>
            ))}

            {/* Sort */}
            {sortOptions && onSortChange && (
                <div className="relative">
                    <select
                        value={sortValue}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="
                            appearance-none pl-3 pr-8 py-2 text-sm
                            bg-bg-surface dark:bg-slate-700
                            border border-border-DEFAULT dark:border-slate-600
                            rounded-lg
                            text-txt-secondary dark:text-slate-300
                            focus:outline-none focus:ring-2 focus:ring-primary-500/50
                            cursor-pointer transition-colors
                        "
                    >
                        {sortOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown
                        size={13}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-txt-muted dark:text-slate-400 pointer-events-none"
                    />
                </div>
            )}

            {/* Clear filters badge */}
            {activeFilterCount > 0 && onClearFilters && (
                <button
                    onClick={onClearFilters}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors"
                >
                    <SlidersHorizontal size={12} />
                    {activeFilterCount} bộ lọc
                    <X size={11} />
                </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Result count */}
            {resultCount !== undefined && (
                <span className="text-xs text-txt-muted dark:text-slate-400 whitespace-nowrap shrink-0">
                    {resultCount}
                    {totalCount !== undefined && totalCount !== resultCount && (
                        <span> / {totalCount}</span>
                    )}{' '}
                    kết quả
                </span>
            )}

            {/* View toggle */}
            {viewMode && onViewModeChange && (
                <ViewToggle
                    mode={viewMode}
                    onChange={onViewModeChange}
                    available={availableViews}
                />
            )}

            {/* Extra actions */}
            {actions && (
                <div className="flex items-center gap-2 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default FilterBar;
