// ═══════════════════════════════════════════════════════════════
// StakeholderService — CRUD cho bảng stakeholder_types
// ═══════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase';

export interface StakeholderType {
    code: string;
    name: string;
    category: 'owner' | 'consultant' | 'authority' | 'contractor';
    description: string | null;
    default_sort_order: number;
    is_active: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
    owner: 'Chủ đầu tư',
    consultant: 'Tư vấn',
    authority: 'Cơ quan NN',
    contractor: 'Nhà thầu',
};

export const StakeholderService = {
    /** Lấy tất cả stakeholder types (active) */
    async getAll(): Promise<StakeholderType[]> {
        const { data, error } = await (supabase as any)
            .from('stakeholder_types')
            .select('*')
            .eq('is_active', true)
            .order('default_sort_order', { ascending: true });

        if (error) throw error;
        return (data || []) as StakeholderType[];
    },

    /** Lấy theo category */
    async getByCategory(category: string): Promise<StakeholderType[]> {
        const { data, error } = await (supabase as any)
            .from('stakeholder_types')
            .select('*')
            .eq('category', category)
            .eq('is_active', true)
            .order('default_sort_order', { ascending: true });

        if (error) throw error;
        return (data || []) as StakeholderType[];
    },

    /** Label cho category */
    getCategoryLabel(category: string): string {
        return CATEGORY_LABELS[category] || category;
    },

    /** RACI type labels */
    getRaciLabel(type: string): string {
        switch (type) {
            case 'R': return 'Thực hiện';
            case 'A': return 'Phê duyệt';
            case 'C': return 'Tham vấn';
            case 'I': return 'Thông báo';
            default: return type;
        }
    },

    /** RACI type colors */
    getRaciColor(type: string): { bg: string; text: string; border: string } {
        switch (type) {
            case 'R': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-700' };
            case 'A': return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700' };
            case 'C': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-700' };
            case 'I': return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
        }
    },
};
