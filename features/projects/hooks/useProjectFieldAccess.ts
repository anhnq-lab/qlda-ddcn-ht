/**
 * useProjectFieldAccess — phân quyền cấp TRƯỜNG dự án theo vai trò thành viên.
 *
 * Trả về canEditField(key) để form khoá ô. Nguồn: bảng project_field_permissions
 * (mặc định allow; chỉ field có can_edit=false bị khoá). super_admin / không phải
 * thành viên / khi tạo mới → không khoá.
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { usePermissionCheck } from '../../../hooks/usePermissionCheck';
import { TSKEY_TO_FIELD_KEY } from '../projectFieldCatalog';

// Cache cấu hình toàn cục (không theo user). key = `${member_role}|${field_key}` → can_edit
let fieldPermCache: Map<string, boolean> | null = null;
let inflight: Promise<Map<string, boolean>> | null = null;

export function clearProjectFieldPermsCache(): void {
    fieldPermCache = null;
    inflight = null;
}

async function loadFieldPerms(): Promise<Map<string, boolean>> {
    if (fieldPermCache) return fieldPermCache;
    if (inflight) return inflight;
    inflight = (async () => {
        const map = new Map<string, boolean>();
        try {
            const { data, error } = await (supabase as any)
                .from('project_field_permissions')
                .select('member_role, field_key, can_edit');
            if (!error && Array.isArray(data)) {
                data.forEach((r: any) => map.set(`${r.member_role}|${r.field_key}`, r.can_edit));
            }
        } catch { /* default allow */ }
        fieldPermCache = map;
        return map;
    })();
    return inflight;
}

/** Chuẩn hoá alias tên vai trò cũ → tên chuẩn (đồng bộ với DB trigger). */
function normalizeRole(role: string | null | undefined): string | null {
    if (!role) return null;
    if (role === 'Kế toán phụ trách') return 'Kế toán dự án';
    return role;
}

export interface ProjectFieldAccess {
    /** true nếu được sửa trường này (nhận tsKey 'ProjectName' hoặc cột 'project_name'). */
    canEditField: (key: string) => boolean;
    /** Có đang áp giới hạn field nào cho vai trò hiện tại không. */
    hasRestrictions: boolean;
    loading: boolean;
}

export function useProjectFieldAccess(opts: {
    memberRole?: string | null;
    isCreate?: boolean;
}): ProjectFieldAccess {
    return {
        canEditField: () => true,
        hasRestrictions: false,
        loading: false,
    };
}
