/**
 * Table.tsx — Deprecated alias
 *
 * Đã hợp nhất vào DataTable.tsx (Design System v2.1)
 * File này giữ lại để backward compatibility.
 * Vui lòng dùng DataTable thay thế:
 *   import DataTable from './DataTable'
 */
import DataTable from './DataTable';
export type { Column, SortConfig, SortDirection } from './DataTable';

// Re-export DataTable as Table for backward compat
export { DataTable as Table };

// TablePagination — forward compatible wrapper
// DataTable tích hợp sẵn pagination, dùng prop `pagination` thay vì component riêng
interface LegacyTablePaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
    className?: string;
}

export const TablePagination: React.FC<LegacyTablePaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
    className = '',
}) => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className={`flex items-center justify-between px-4 py-3 bg-bg-surface dark:bg-slate-800 border-t border-border-DEFAULT dark:border-slate-700/60 ${className}`}>
            <div className="text-sm text-txt-muted dark:text-slate-400">
                Hiển thị <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> trong <span className="font-medium">{totalItems}</span> kết quả
            </div>

            <div className="flex items-center gap-4">
                {onPageSizeChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-txt-muted dark:text-slate-400">Hiển thị</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="px-2 py-1 text-sm border border-border-DEFAULT dark:border-slate-600 rounded-lg bg-bg-surface dark:bg-slate-700 text-txt-primary dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg hover:bg-bg-muted dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Trang trước"
                    >
                        <svg className="w-4 h-4 text-txt-muted dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <span className="px-3 py-1 text-sm font-medium text-txt-secondary dark:text-slate-300">
                        {currentPage} / {totalPages}
                    </span>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg hover:bg-bg-muted dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Trang sau"
                    >
                        <svg className="w-4 h-4 text-txt-muted dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

import React from 'react';

export default DataTable;
