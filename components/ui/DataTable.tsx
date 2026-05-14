import React, { useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

// ========================================
// DATATABLE — Chuẩn bảng CIC ERP v2.2
// Dựa trên visual design của EmployeeList
// ========================================

export interface Column<T> {
    key: keyof T | string;
    header: React.ReactNode;
    width?: string;
    minWidth?: string;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    className?: string;
    headerClassName?: string;
    render?: (value: any, row: T, index: number) => React.ReactNode;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
    key: string;
    direction: SortDirection;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (row: T) => string;

    // Loading & Empty States
    isLoading?: boolean;
    loadingRows?: number;
    emptyMessage?: string;
    emptyIcon?: React.ReactNode;
    emptyState?: React.ReactNode;

    // Sorting
    sortable?: boolean;
    defaultSort?: SortConfig;
    onSort?: (config: SortConfig) => void;

    // Pagination
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        pageSize: number;
        onPageChange: (page: number) => void;
        onPageSizeChange?: (size: number) => void;
        pageSizeOptions?: number[];
        label?: string; // e.g. "nhân sự", "dự án"...
    };

    // Selection
    selectable?: boolean;
    selectedKeys?: string[];
    onSelectionChange?: (keys: string[]) => void;

    // Row Actions
    onRowClick?: (row: T, index: number) => void;
    rowClassName?: (row: T, index: number) => string;

    // Styling
    compact?: boolean;
    stickyHeader?: boolean;
    maxHeight?: string; // e.g. 'calc(100vh-360px)'
    className?: string;
    wrapperClassName?: string;
    footerExtra?: React.ReactNode;
    showFooter?: boolean; // default true if pagination or showFooter prop
    footerLabel?: string; // "Hiển thị X / Y {footerLabel}"

    // Grouping
    groupBy?: (row: T) => string;
    renderGroupHeader?: (groupName: string, items: T[], isExpanded: boolean, toggle: () => void) => React.ReactNode;
    defaultExpandedGroups?: boolean;
}

function DataTable<T extends Record<string, any>>({
    data,
    columns,
    keyExtractor,
    isLoading = false,
    loadingRows = 5,
    emptyMessage = 'Không có dữ liệu',
    emptyIcon,
    emptyState,
    sortable = false,
    defaultSort,
    onSort,
    pagination,
    selectable = false,
    selectedKeys = [],
    onSelectionChange,
    onRowClick,
    rowClassName,
    compact: compactProp,
    stickyHeader = false,
    maxHeight,
    className = '',
    wrapperClassName = '',
    footerExtra,
    showFooter,
    footerLabel = 'bản ghi',
    groupBy,
    renderGroupHeader,
    defaultExpandedGroups = true,
}: DataTableProps<T>) {
    const { density } = useTheme();
    const compact = compactProp ?? (density === 'compact');

    const [sortConfig, setSortConfig] = useState<SortConfig>(
        defaultSort || { key: '', direction: null }
    );
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const handleSort = (key: string) => {
        if (!sortable) return;
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') direction = 'desc';
            else if (sortConfig.direction === 'desc') direction = null;
        }
        const newConfig = { key, direction };
        setSortConfig(newConfig);
        onSort?.(newConfig);
    };

    const sortedData = useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction || onSort) return data;
        return [...data].sort((a, b) => {
            const getValue = (obj: any, key: string) =>
                key.includes('.') ? key.split('.').reduce((o, k) => o?.[k], obj) : obj[key];
            const aVal = getValue(a, sortConfig.key);
            const bVal = getValue(b, sortConfig.key);
            if (aVal === bVal) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            const cmp = aVal < bVal ? -1 : 1;
            return sortConfig.direction === 'asc' ? cmp : -cmp;
        });
    }, [data, sortConfig, onSort]);

    const handleSelectAll = () => {
        if (!onSelectionChange) return;
        onSelectionChange(selectedKeys.length === data.length ? [] : data.map(keyExtractor));
    };

    const handleSelectRow = (key: string) => {
        if (!onSelectionChange) return;
        onSelectionChange(
            selectedKeys.includes(key)
                ? selectedKeys.filter(k => k !== key)
                : [...selectedKeys, key]
        );
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key)
            return <ChevronsUpDown size={12} className="text-slate-400 dark:text-slate-400 shrink-0" />;
        if (sortConfig.direction === 'asc')
            return <ChevronUp size={12} className="text-primary-500 shrink-0" />;
        if (sortConfig.direction === 'desc')
            return <ChevronDown size={12} className="text-primary-500 shrink-0" />;
        return <ChevronsUpDown size={12} className="text-slate-400 dark:text-slate-400 shrink-0" />;
    };

    const groupedData = useMemo(() => {
        if (!groupBy) return null;
        const map = new Map<string, T[]>();
        sortedData.forEach(item => {
            const groupName = groupBy(item) || 'Khác';
            if (!map.has(groupName)) map.set(groupName, []);
            map.get(groupName)!.push(item);
        });
        return map;
    }, [sortedData, groupBy]);

    const toggleGroup = (groupName: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupName)) next.delete(groupName);
            else next.add(groupName);
            return next;
        });
    };

    // Helper to render a single row
    const renderRow = (row: T, index: number) => {
        const key = keyExtractor(row);
        const isSelected = selectedKeys.includes(key);
        return (
            <tr
                key={key}
                onClick={() => onRowClick?.(row, index)}
                className={`
                    group transition-all
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${isSelected
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/50'
                    }
                    ${rowClassName?.(row, index) || ''}
                `}
            >
                {selectable && (
                    <td className={`${tdPad} w-10`} onClick={e => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(key)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500"
                        />
                    </td>
                )}
                {columns.map(col => {
                    const value = String(col.key).includes('.')
                        ? String(col.key).split('.').reduce((o: any, k) => o?.[k], row)
                        : row[col.key as keyof T];
                    return (
                        <td
                            key={String(col.key)}
                            className={`
                                ${tdPad}
                                text-sm text-slate-700 dark:text-slate-300
                                ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}
                                ${col.className || ''}
                            `}
                        >
                            {col.render ? col.render(value, row, index) : String(value ?? '—')}
                        </td>
                    );
                })}
            </tr>
        );
    };

    // Cell padding theo compact mode
    const tdPad = compact ? 'px-3 py-2' : 'px-4 py-4';
    const thPad = compact ? 'px-3 py-2.5' : 'px-4 py-3';

    // Footer visibility
    const shouldShowFooter = showFooter !== undefined
        ? showFooter
        : (pagination !== undefined || footerExtra !== undefined);

    const totalCols = columns.length + (selectable ? 1 : 0);

    return (
        <div className={`space-y-2 ${wrapperClassName}`}>
            {/* ── TABLE CARD ── */}
            <div
                className={`
                    bg-white dark:bg-slate-800
                    rounded-2xl border border-slate-100 dark:border-slate-700
                    shadow-sm overflow-hidden
                    ${className}
                `}
            >
                <div
                    className={`overflow-x-auto ${maxHeight ? `overflow-y-auto` : ''}`}
                    style={maxHeight ? { maxHeight } : undefined}
                >
                    <table className="w-full">
                        {/* ── HEADER ── */}
                        <thead className={stickyHeader ? 'sticky top-0 z-10 shadow-sm' : ''}>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest">
                                {selectable && (
                                    <th className={`${thPad} w-10 border-b border-slate-200 dark:border-slate-700 text-center`}>
                                        <input
                                            type="checkbox"
                                            checked={selectedKeys.length === data.length && data.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500"
                                        />
                                    </th>
                                )}
                                {columns.map((col, idx) => (
                                    <th
                                        key={String(col.key) + idx}
                                        onClick={() => sortable && col.sortable && handleSort(String(col.key))}
                                        style={{ width: col.width, minWidth: col.minWidth }}
                                        className={`
                                            ${thPad}
                                            border-b border-slate-200 dark:border-slate-700
                                            text-slate-500 dark:text-slate-400
                                            ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                                            ${sortable && col.sortable ? 'cursor-pointer select-none hover:text-primary-600 dark:hover:text-primary-400 transition-colors' : ''}
                                            ${col.headerClassName || ''}
                                        `}
                                    >
                                        <div className={`flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : ''}`}>
                                            {col.header}
                                            {sortable && col.sortable && getSortIcon(String(col.key))}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* ── BODY ── */}
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                            {isLoading ? (
                                // Skeleton rows
                                Array.from({ length: loadingRows }).map((_, i) => (
                                    <tr key={`skel-${i}`}>
                                        {selectable && (
                                            <td className={thPad}>
                                                <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                            </td>
                                        )}
                                        {columns.map((col, j) => (
                                            <td key={`skel-${i}-${j}`} className={tdPad}>
                                                <div
                                                    className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
                                                    style={{ width: j === 0 ? '60%' : j === 1 ? '80%' : '50%' }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : sortedData.length === 0 ? (
                                // Empty state
                                <tr>
                                    <td colSpan={totalCols} className="px-4 py-16 text-center">
                                        {emptyState || (
                                            <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-400">
                                                {emptyIcon || (
                                                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                                                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                    </svg>
                                                )}
                                                <span className="text-sm font-medium">{emptyMessage}</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ) : groupedData ? (
                                Array.from(groupedData.entries()).map(([groupName, groupItems]) => {
                                    const isExpanded = defaultExpandedGroups ? !collapsedGroups.has(groupName) : collapsedGroups.has(groupName);
                                    const toggle = () => toggleGroup(groupName);
                                    
                                    return (
                                        <React.Fragment key={groupName}>
                                            {renderGroupHeader ? (
                                                renderGroupHeader(groupName, groupItems, isExpanded, toggle)
                                            ) : (
                                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-700/50" onClick={toggle}>
                                                    <td colSpan={totalCols} className="px-4 py-2 cursor-pointer select-none">
                                                        <div className="flex items-center gap-2 font-medium text-sm text-slate-700 dark:text-slate-300">
                                                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                            {groupName} ({groupItems.length})
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            {isExpanded && groupItems.map((row, index) => renderRow(row, index))}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                sortedData.map((row, index) => renderRow(row, index))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── FOOTER (Pagination / Counter) ── */}
            {shouldShowFooter && !isLoading && (
                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    {/* Left: count info */}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {pagination ? (
                            <>
                                Hiển thị{' '}
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                    {((pagination.currentPage - 1) * pagination.pageSize) + 1}
                                </span>
                                {' '}–{' '}
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                    {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
                                </span>
                                {' '}trong{' '}
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                    {pagination.totalItems}
                                </span>
                                {' '}{pagination.label || footerLabel}
                            </>
                        ) : (
                            <>
                                Hiển thị{' '}
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                    {sortedData.length}
                                </span>
                                {' '}{footerLabel}
                            </>
                        )}
                    </p>

                    <div className="flex items-center gap-3">
                        {/* Extra slot */}
                        {footerExtra}

                        {/* Page size */}
                        {pagination?.onPageSizeChange && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-400 dark:text-slate-400">Hiển thị</span>
                                <select
                                    value={pagination.pageSize}
                                    onChange={e => pagination.onPageSizeChange!(Number(e.target.value))}
                                    className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
                                >
                                    {(pagination.pageSizeOptions || [10, 20, 50, 100]).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Page nav */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => pagination.onPageChange(1)}
                                    disabled={pagination.currentPage <= 1}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage <= 1}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={14} className="text-slate-500 dark:text-slate-400" />
                                </button>

                                {(() => {
                                    const total = pagination.totalPages;
                                    const cur = pagination.currentPage;
                                    const pages: number[] = [];
                                    if (total <= 5) {
                                        for (let i = 1; i <= total; i++) pages.push(i);
                                    } else if (cur <= 3) {
                                        pages.push(1, 2, 3, 4, 5);
                                    } else if (cur >= total - 2) {
                                        for (let i = total - 4; i <= total; i++) pages.push(i);
                                    } else {
                                        for (let i = cur - 2; i <= cur + 2; i++) pages.push(i);
                                    }
                                    return pages.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => pagination.onPageChange(p)}
                                            className={`
                                                w-7 h-7 rounded-lg text-xs font-medium transition-colors
                                                ${cur === p
                                                    ? 'bg-primary-500 text-white shadow-sm'
                                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                }
                                            `}
                                        >
                                            {p}
                                        </button>
                                    ));
                                })()}

                                <button
                                    onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage >= pagination.totalPages}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={14} className="text-slate-500 dark:text-slate-400" />
                                </button>
                                <button
                                    onClick={() => pagination.onPageChange(pagination.totalPages)}
                                    disabled={pagination.currentPage >= pagination.totalPages}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataTable;
