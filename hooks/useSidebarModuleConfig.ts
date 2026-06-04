import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseExt } from '../lib/supabase';

// ========================================
// SIDEBAR MODULE CONFIG — ẩn/hiện module trên sidebar (phạm vi toàn hệ thống)
// Bảng: sidebar_module_config (module_key, is_visible)
// ========================================

export const SIDEBAR_MODULE_QUERY_KEY = ['sidebar_module_config'] as const;

export interface SidebarModuleConfigRow {
  module_key: string;
  is_visible: boolean;
}

/**
 * Trả về Map module_key -> is_visible. Module không có trong cấu hình
 * được coi là HIỂN THỊ (mặc định bật) để tránh ẩn nhầm khi seed thiếu.
 */
export function useSidebarModuleConfig() {
  const query = useQuery({
    queryKey: SIDEBAR_MODULE_QUERY_KEY,
    queryFn: async (): Promise<Record<string, boolean>> => {
      const { data, error } = await supabaseExt
        .from('sidebar_module_config')
        .select('module_key, is_visible');

      if (error) throw error;

      const map: Record<string, boolean> = {};
      (data as SidebarModuleConfigRow[] | null)?.forEach((row) => {
        map[row.module_key] = row.is_visible;
      });
      return map;
    },
    // Cấu hình ít thay đổi → cache lâu, vẫn cập nhật khi admin lưu (invalidate).
    staleTime: 5 * 60 * 1000,
  });

  /** Module hiển thị nếu không có cấu hình hoặc is_visible === true */
  const isModuleVisible = (moduleKey: string): boolean => {
    const map = query.data;
    if (!map) return true; // chưa tải xong → không ẩn để tránh nháy
    return map[moduleKey] !== false;
  };

  return { ...query, isModuleVisible };
}

/** Lưu cấu hình ẩn/hiện (upsert nhiều dòng theo module_key). */
export function useSaveSidebarModuleConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rows: SidebarModuleConfigRow[]) => {
      const payload = rows.map((r) => ({
        module_key: r.module_key,
        is_visible: r.is_visible,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabaseExt
        .from('sidebar_module_config')
        .upsert(payload, { onConflict: 'module_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SIDEBAR_MODULE_QUERY_KEY });
    },
  });
}
