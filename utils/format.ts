/**
 * Format a number as Vietnamese currency with exact value.
 * Shows full number with thousand separators, e.g. "105.876.566"
 */
export const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return '0 VNĐ';
    // Format exactly as 1.000.000 VNĐ (or with decimals if needed, but standard is no decimal for VND)
    // If the user requires precisely ",00" we can use minimumFractionDigits: 2, but standard VND usually skips it.
    // Given the task says "1.000.000,00 VNĐ", let's make it 2 decimal places if there are decimals, or 0 if integer.
    // Actually, "Tuyệt đối không dùng dấu phẩy cho hàng nghìn", vi-VN uses `.` for thousands and `,` for decimals.
    return new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 2
    }).format(amount) + ' VNĐ';
};

/** Format currency with abbreviated units (Tỷ, Tr) — used in dashboards & cards */
export const formatShortCurrency = (amount: number): string => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    
    if (absAmount >= 1_000_000_000) {
        const val = absAmount / 1_000_000_000;
        const formatted = val.toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
        return `${isNegative ? '-' : ''}${formatted} tỷ`;
    }
    if (absAmount >= 1_000_000) {
        const val = absAmount / 1_000_000;
        return `${isNegative ? '-' : ''}${val.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} tr`;
    }
    return `${isNegative ? '-' : ''}${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(absAmount)} VNĐ`;
};

/** Alias: full VND format */
export const formatFullCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount) + ' VNĐ';
};

/** Format a date string to Vietnamese locale (dd/MM/yyyy) */
export const formatDate = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return '';
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        if (isNaN(date.getTime())) return typeof dateString === 'string' ? dateString : '';
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    } catch {
        return typeof dateString === 'string' ? dateString : '';
    }
};

/** Format a date + time to Vietnamese locale */
export const formatDateTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return '';
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        if (isNaN(date.getTime())) return typeof dateString === 'string' ? dateString : '';
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    } catch {
        return typeof dateString === 'string' ? dateString : '';
    }
};

/** Format a number with thousand separators */
export const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return '—';
    return new Intl.NumberFormat('vi-VN').format(value);
};

/** Format a percentage value */
export const formatPercent = (value: number | undefined | null, decimals = 1): string => {
    if (value === undefined || value === null || isNaN(value)) return '—';
    return `${value.toLocaleString('vi-VN', { maximumFractionDigits: decimals, minimumFractionDigits: 0 })}%`;
};


/** Format file size in human-readable format */
export const formatFileSize = (bytes: number | undefined | null): string => {
    if (bytes === undefined || bytes === null || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`;
};

/** Format planning period string (could be string description, ISO date, or Excel serial date) */
export const formatPeriod = (period: string | undefined | null): string => {
    if (!period) return '—';
    const trimmed = period.trim();
    // Check if it's an Excel serial date
    if (/^\d{5}$/.test(trimmed)) {
        const num = Number(trimmed);
        const date = new Date((num - (num > 60 ? 2 : 1)) * 86400 * 1000 + Date.UTC(1900, 0, 1));
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    }
    // Check if it's a standard ISO date or date string (e.g., 2026-05-20)
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
            return new Intl.DateTimeFormat('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).format(date);
        }
    }
    // Return original string if it is a general description (e.g. "Quý I", "Hàng tháng")
    return period;
};
