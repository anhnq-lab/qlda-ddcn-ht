/**
 * taskHelpers.ts — Shared helpers for Plan Tab components
 * Eliminates duplication across ProjectPlanTab, WBSView, Kanban, etc.
 */
import { Task, TaskStatus } from '@/types';

// ── Priority Colors ──
export const getPriorityColor = (priority?: string): string => {
    switch (priority?.toLowerCase()) {
        case 'high':
        case 'urgent':
            return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700';
        case 'medium':
            return 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700';
        case 'low':
            return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700';
        default:
            return 'text-gray-600 dark:text-gray-400 bg-bg-subtle dark:bg-slate-700 border-gray-200 dark:border-slate-600';
    }
};

// ── Overdue Check ──
export const isOverdue = (task: Task): boolean => {
    if (task.Status === TaskStatus.Done) return false;
    if (!task.DueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.DueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
};

// ── Status Config (icon style + label) ──
export interface StatusConfig {
    label: string;
    color: string;
    bg: string;
    border: string;
    dot: string;
}

export const getStatusConfig = (status?: TaskStatus | string): StatusConfig => {
    switch (status) {
        case TaskStatus.Done:
            return {
                label: 'Hoàn thành',
                color: 'text-emerald-700 dark:text-emerald-400',
                bg: 'bg-emerald-50 dark:bg-emerald-900/30',
                border: 'border-emerald-200 dark:border-emerald-700',
                dot: 'bg-emerald-500',
            };
        case TaskStatus.Review:
            return {
                label: 'Đang duyệt',
                color: 'text-purple-700 dark:text-purple-400',
                bg: 'bg-purple-50 dark:bg-purple-900/30',
                border: 'border-purple-200 dark:border-purple-700',
                dot: 'bg-purple-500',
            };
        case TaskStatus.InProgress:
            return {
                label: 'Đang thực hiện',
                color: 'text-blue-700 dark:text-blue-400',
                bg: 'bg-blue-50 dark:bg-blue-900/30',
                border: 'border-blue-200 dark:border-blue-700',
                dot: 'bg-blue-500',
            };
        default:
            return {
                label: 'Chờ thực hiện',
                color: 'text-gray-500 dark:text-slate-400',
                bg: 'bg-gray-50 dark:bg-slate-700/50',
                border: 'border-gray-200 dark:border-slate-600',
                dot: 'bg-gray-300 dark:bg-slate-500',
            };
    }
};

// ── Relative Time Label ──
export const getRelativeTimeLabel = (dueDate: string): { text: string; color: string } | null => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - now.getTime()) / 86400000);

    if (diff < 0) return { text: `Quá hạn ${Math.abs(diff)} ngày`, color: 'text-red-500 dark:text-red-400' };
    if (diff === 0) return { text: 'Hôm nay!', color: 'text-orange-500 dark:text-orange-400' };
    if (diff <= 3) return { text: `Còn ${diff} ngày`, color: 'text-orange-500 dark:text-orange-400' };
    if (diff <= 7) return { text: `Còn ${diff} ngày`, color: 'text-blue-500 dark:text-blue-400' };
    return null;
};

// ── Format Date (vi-VN) ──
export const formatDate = (dateStr?: string | null, options?: Intl.DateTimeFormatOptions): string => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('vi-VN', options || { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateShort = (dateStr?: string | null): string => {
    if (!dateStr) return '--/--';
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

// ── Parse SLA formula (e.g., "30d" → 30) ──
export const parseSlaFormula = (sla?: string | null): number | undefined => {
    if (!sla) return undefined;
    const match = sla.match(/^(\d+)d?$/);
    return match ? parseInt(match[1], 10) : undefined;
};
