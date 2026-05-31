import React, { useCallback } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { ViewToggle, ViewMode } from './ViewToggle';
import { FilterChip } from './FilterChip';

// ========================================
// FILTER BAR - Design System v2.1
// Dùng cho tất cả list pages
// ========================================

/**
 * A single option in a filter dropdown.
 */
export interface FilterOption {
    /** The raw value passed to the filter's `onChange` callback. */
    value: string;
    /** Human-readable display label. */
    label: string;
    /** Optional record count displayed next to the label, e.g. `(12)`. */
    count?: number;
    /** Optional icon rendered before the label. */
    icon?: React.ReactNode;
    /** Optional accent color (CSS color string or Tailwind class). */
    color?: string;
}

/**
 * Configuration for a single filter dropdown rendered by FilterBar.
 */
export interface FilterBarFilter {
    /** Unique identifier used as React key and the element's `id`. */
    id: string;
    /** Human-readable filter name shown in the "All {label}" default option. */
    label: string;
    /** Currently-selected value (controlled). */
    value: string;
    /** Array of selectable options. */
    options: FilterOption[];
    /** Called when the user picks an option. */
    onChange: (value: string) => void;
    /** Placeholder text (unused in the current `<select>` implementation). */
    placeholder?: string;
    /** Override the default "Tất cả {label}" option text. */
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

/**
 * FilterBar — Design System v2.1
 *
 * Composable toolbar used on all list pages. Renders a combination of:
 * - Full-text search input with clear button
 * - Filter dropdown selects (each driven by a `FilterBarFilter` config)
 * - Optional sort dropdown
 * - Active-filter count badge with clear-all action
 * - Result/total count display
 * - View-mode toggle (list / grid / kanban)
 * - Arbitrary action buttons slot (right-aligned)
 *
 * @example
 * ```tsx
 * <FilterBar
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   filters={[{ id: 'status', label: 'Trạng thái', value: statusFilter, options: STATUS_OPTIONS, onChange: setStatusFilter }]}
 *   resultCount={filtered.length}
 *   totalCount={all.length}
 *   actions={<Button onClick={openCreate}>Thêm mới</Button>}
 * />
 * ```
 */
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
            bg-bg-subtle
            border-b border-border
            ${className}
        `}>
            {/* Search input */}
            {onSearchChange && (
                <div className="relative flex-1 min-w-0 max-w-xs">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-placeholder pointer-events-none"
                    />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="
                            w-full pl-8 pr-8 py-2 text-sm
                            bg-bg-surface
                            border border-border
                            rounded-lg
                            text-txt-primary
                            placeholder-txt-placeholder
                            focus:outline-none focus:ring-2 focus:ring-focus/50 focus:border-primary-400
                            transition-colors
                        "
                    />
                    {searchValue && (
                        <button
                            onClick={handleSearchClear}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-txt-muted hover:text-txt-primary transition-colors"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>
            )}

            {/* Filter dropdowns — pill kiểu ChipSelect (đồng bộ với module Quản lý dự án) */}
            {filters.map((filter) => (
                <FilterChip
                    key={filter.id}
                    label={filter.label}
                    value={filter.value}
                    onChange={filter.onChange}
                    options={[
                        { value: 'all', label: filter.allLabel || `Tất cả ${filter.label}` },
                        ...filter.options.map((opt) => ({
                            value: opt.value,
                            label: opt.label,
                            count: opt.count,
                            // chỉ nhận màu dạng CSS (hex/rgb), bỏ qua nếu là class Tailwind
                            color: typeof opt.color === 'string' && /^(#|rgb|hsl)/.test(opt.color) ? opt.color : undefined,
                        })),
                    ]}
                />
            ))}

            {/* Sort */}
            {sortOptions && onSortChange && (
                <div className="relative">
                    <select
                        value={sortValue}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="
                            appearance-none pl-3 pr-8 py-2 text-sm
                            bg-bg-surface
                            border border-border
                            rounded-lg
                            text-txt-secondary
                            focus:outline-none focus:ring-2 focus:ring-focus/50
                            cursor-pointer transition-colors
                        "
                    >
                        {sortOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown
                        size={13}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none"
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
                <span className="text-xs text-txt-muted whitespace-nowrap shrink-0">
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
                    value={viewMode}
                    onChange={onViewModeChange}
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
