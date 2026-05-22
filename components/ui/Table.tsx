import React from 'react';

const TableContainer = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { maxHeight?: string }
>(({ className, maxHeight, ...props }, ref) => (
    <div
        className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden ${className || ""}`}
    >
        <div
            ref={ref}
            className={`overflow-x-auto ${maxHeight ? 'overflow-y-auto' : ''}`}
            style={maxHeight ? { maxHeight } : undefined}
            {...props}
        />
    </div>
))
TableContainer.displayName = "TableContainer"

const Table = React.forwardRef<
    HTMLTableElement,
    React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
    <table
        ref={ref}
        className={`w-full text-sm ${className || ""}`}
        {...props}
    />
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement> & { sticky?: boolean }
>(({ className, sticky, ...props }, ref) => (
    <thead
        ref={ref}
        className={`${sticky ? 'sticky top-0 z-10' : ''} ${className || ""}`}
        {...props}
    />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={`divide-y divide-gray-100 dark:divide-slate-700/70 ${className || ""}`}
        {...props}
    />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tfoot
        ref={ref}
        className={`bg-slate-50 dark:bg-slate-800 font-medium ${className || ""}`}
        {...props}
    />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
    HTMLTableRowElement,
    React.HTMLAttributes<HTMLTableRowElement> & { isHeader?: boolean; isSelected?: boolean }
>(({ className, isHeader, isSelected, ...props }, ref) => (
    <tr
        ref={ref}
        className={
            isHeader
                ? `bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest ${className || ""}`
                : `group transition-all ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800'} ${className || ""}`
        }
        {...props}
    />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement> & { compact?: boolean }
>(({ className, compact, ...props }, ref) => (
    <th
        ref={ref}
        className={`
      ${compact ? 'px-3 py-2.5' : 'px-4 py-3'} 
      border-b border-slate-200 dark:border-slate-700 
      text-slate-500 dark:text-slate-400 
      text-left align-middle 
      ${className || ""}
    `}
        {...props}
    />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement> & { compact?: boolean }
>(({ className, compact, ...props }, ref) => (
    <td
        ref={ref}
        className={`
      ${compact ? 'px-3 py-2' : 'px-4 py-3.5'} 
      text-sm text-slate-700 dark:text-slate-300 
      align-middle 
      ${className || ""}
    `}
        {...props}
    />
))
TableCell.displayName = "TableCell"


// --- Legacy Backward Compat for TablePagination ---

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
        <div className={`flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-t border-border-DEFAULT dark:border-slate-700/60 ${className}`}>
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
                            className="px-2 py-1 text-sm border border-border-DEFAULT dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-txt-primary dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
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

export {
    TableContainer,
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
}
