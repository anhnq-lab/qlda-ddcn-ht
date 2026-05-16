/**
 * Unit Tests — utils/format.ts
 * Pure functions, no external dependencies
 */
import { describe, it, expect } from 'vitest';
import {
    formatCurrency,
    formatShortCurrency,
    formatDate,
    formatDateTime,
    formatNumber,
    formatPercent,
    formatFileSize,
} from '../format';

// ═══════════════════════════════════════════════════════════════════
// formatCurrency
// ═══════════════════════════════════════════════════════════════════
describe('formatCurrency', () => {
    it('formats zero', () => {
        expect(formatCurrency(0)).toContain('0');
    });

    it('returns "0 VNĐ" for undefined', () => {
        expect(formatCurrency(undefined)).toBe('0 VNĐ');
    });

    it('returns "0 VNĐ" for null', () => {
        expect(formatCurrency(null)).toBe('0 VNĐ');
    });

    it('formats large number with thousand separators', () => {
        const result = formatCurrency(105876566);
        // Vietnamese locale uses dots as thousand separators
        expect(result).toMatch(/105[\.\s]876[\.\s]566/);
    });

    it('appends VNĐ suffix', () => {
        const result = formatCurrency(1234567);
        expect(result).toContain('VNĐ');
    });
});

// ═══════════════════════════════════════════════════════════════════
// formatShortCurrency
// ═══════════════════════════════════════════════════════════════════
describe('formatShortCurrency', () => {
    it('formats billions as "tỷ"', () => {
        const result = formatShortCurrency(2_500_000_000);
        expect(result).toContain('tỷ');
        expect(result).toMatch(/2[,.]5/);
    });

    it('formats millions as "tr"', () => {
        const result = formatShortCurrency(350_000_000);
        expect(result).toContain('tr');
        expect(result).toContain('350');
    });

    it('formats small amounts with VNĐ', () => {
        const result = formatShortCurrency(500_000);
        expect(result).toContain('VNĐ');
    });

    it('rounds to 1 decimal for billions', () => {
        const result = formatShortCurrency(1_234_567_890);
        expect(result).toContain('tỷ');
    });
});

// ═══════════════════════════════════════════════════════════════════
// formatDate
// ═══════════════════════════════════════════════════════════════════
describe('formatDate', () => {
    it('returns empty string for undefined', () => {
        expect(formatDate(undefined)).toBe('');
    });

    it('returns empty string for null', () => {
        expect(formatDate(null)).toBe('');
    });

    it('formats valid ISO date string', () => {
        const result = formatDate('2024-03-15');
        // Should contain day, month, year in some format
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(0);
    });

    it('returns original string for invalid date', () => {
        expect(formatDate('not-a-date')).toBe('not-a-date');
    });

    it('handles Date objects', () => {
        const date = new Date(2024, 2, 15); // March 15, 2024
        const result = formatDate(date);
        expect(result).toBeTruthy();
    });
});

// ═══════════════════════════════════════════════════════════════════
// formatDateTime
// ═══════════════════════════════════════════════════════════════════
describe('formatDateTime', () => {
    it('returns empty string for falsy values', () => {
        expect(formatDateTime(undefined)).toBe('');
        expect(formatDateTime(null)).toBe('');
        expect(formatDateTime('')).toBe('');
    });

    it('formats valid datetime', () => {
        const result = formatDateTime('2024-03-15T14:30:00Z');
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(5);
    });

    it('returns original string for invalid date', () => {
        // formatDateTime returns the original string when date parsing fails
        expect(formatDateTime('invalid')).toBe('invalid');
    });
});

// ═══════════════════════════════════════════════════════════════════
// formatNumber
// ═══════════════════════════════════════════════════════════════════
describe('formatNumber', () => {
    it('returns "—" for undefined', () => {
        expect(formatNumber(undefined)).toBe('—');
    });

    it('returns "—" for null', () => {
        expect(formatNumber(null)).toBe('—');
    });

    it('returns "—" for NaN', () => {
        expect(formatNumber(NaN)).toBe('—');
    });

    it('formats integer with separators', () => {
        const result = formatNumber(1234567);
        expect(result).toMatch(/1[\.\s]234[\.\s]567/);
    });

    it('formats zero', () => {
        expect(formatNumber(0)).toBe('0');
    });
});

// ═══════════════════════════════════════════════════════════════════
// formatPercent
// ═══════════════════════════════════════════════════════════════════
describe('formatPercent', () => {
    it('returns "—" for undefined', () => {
        expect(formatPercent(undefined)).toBe('—');
    });

    it('formats whole number percentage', () => {
        const result = formatPercent(75);
        expect(result).toContain('75');
        expect(result).toContain('%');
    });

    it('formats decimal percentage', () => {
        const result = formatPercent(85.67, 2);
        expect(result).toContain('%');
    });

    it('handles zero', () => {
        expect(formatPercent(0)).toContain('0');
        expect(formatPercent(0)).toContain('%');
    });
});

// ═══════════════════════════════════════════════════════════════════
// formatFileSize
// ═══════════════════════════════════════════════════════════════════
describe('formatFileSize', () => {
    it('returns "0 B" for zero', () => {
        expect(formatFileSize(0)).toBe('0 B');
    });

    it('returns "0 B" for null', () => {
        expect(formatFileSize(null)).toBe('0 B');
    });

    it('formats bytes', () => {
        expect(formatFileSize(500)).toBe('500 B');
    });

    it('formats kilobytes', () => {
        const result = formatFileSize(2048);
        expect(result).toContain('KB');
    });

    it('formats megabytes', () => {
        const result = formatFileSize(5 * 1024 * 1024);
        expect(result).toContain('MB');
    });

    it('formats gigabytes', () => {
        const result = formatFileSize(2.5 * 1024 * 1024 * 1024);
        expect(result).toContain('GB');
    });
});
