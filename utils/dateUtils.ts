// ─── Date Utilities ────────────────────────────────────────────────────────
// Centralized date helpers used across monthly plan/report features.
// Previously duplicated in: MonthlyReportPage, PlanService, DashboardService, MonthlyBriefingTab

export const MONTH_NAMES = [
    '', // index 0 unused — 1-indexed
    'Tháng 1', 'Tháng 2', 'Tháng 3',
    'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9',
    'Tháng 10', 'Tháng 11', 'Tháng 12',
] as const;

export const MONTH_SHORT_NAMES = [
    '', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
    'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
] as const;

/**
 * Returns ISO date strings for the start and end of a given month/year.
 * e.g. getMonthDateRange(5, 2026) → { startDate: '2026-05-01', endDate: '2026-05-31' }
 */
export function getMonthDateRange(month: number, year: number): { startDate: string; endDate: string } {
    const mm = String(month).padStart(2, '0');
    const lastDay = new Date(year, month, 0).getDate();
    const dd = String(lastDay).padStart(2, '0');
    return {
        startDate: `${year}-${mm}-01`,
        endDate: `${year}-${mm}-${dd}`,
    };
}

/**
 * Returns the next month/year from a given month/year.
 */
export function getNextMonthYear(month: number, year: number): { month: number; year: number } {
    if (month === 12) return { month: 1, year: year + 1 };
    return { month: month + 1, year };
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) as dd/MM/yyyy.
 */
export function formatDateVN(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${d.getFullYear()}`;
    } catch {
        return '—';
    }
}

/**
 * Returns a short month period label like "Tháng 5/2026".
 */
export function getMonthPeriodLabel(month: number, year: number): string {
    return `Tháng ${month}/${year}`;
}
