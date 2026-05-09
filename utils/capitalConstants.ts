// ═══════════════════════════════════════════════════════════
// Shared Constants — Capital & Disbursement Module
// Luật ĐTC 58/2024/QH15, NĐ 99/2021/NĐ-CP
// ═══════════════════════════════════════════════════════════

import React from 'react';
import { Edit3, Clock, CheckCircle2, RotateCcw } from 'lucide-react';

// ─── Approval Status Badges ──────────────────────────────
export const APPROVAL_BADGES: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    draft: { label: 'Dự thảo', color: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600', icon: Edit3 },
    submitted: { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800', icon: Clock },
    approved: { label: 'Đã duyệt', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle2 },
    adjusted: { label: 'Đã điều chỉnh', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800', icon: RotateCcw },
};

// ─── Source Labels (Luật ĐTC 58/2024, Điều 5) ──────────
export const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
    'NSĐP': { label: 'NS Địa phương', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    'NSTW': { label: 'NS Trung ương', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    'ODA':  { label: 'ODA/Vốn vay',   color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

export const SOURCE_COLORS: Record<string, string> = {
    'NSTW': '#1c456c',
    'NSĐP': '#fdba74',
    'ODA': '#4a90e2',
    'Khác': '#6b7280',
};

// ─── Disbursement Type Labels ───────────────────────────
export const DISBURSEMENT_TYPE_LABELS: Record<string, string> = {
    TamUng: 'Tạm ứng',
    ThanhToanKLHT: 'TT KLHT',
    ThuHoiTamUng: 'Thu hồi TƯ',
};

// ─── Normalize Source (Luật ĐTC 58/2024 Điều 5) ─────────
export function normalizeSource(raw: string): string {
    if (!raw) return 'NSĐP';
    const lower = raw.toLowerCase().replace(/[\s_-]+/g, '');
    if (lower.includes('diaphuong') || lower.includes('thanhpho') || lower.includes('tphcm') || lower.includes('nstp') || lower.includes('nsdp') || lower === 'nsđp') return 'NSĐP';
    if (lower.includes('truonguong') || lower.includes('trungương') || lower.includes('nstw')) return 'NSTW';
    if (lower.includes('oda') || lower.includes('vonvay')) return 'ODA';
    return raw;
}

// ─── Months shorthand ───────────────────────────────────
export const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

