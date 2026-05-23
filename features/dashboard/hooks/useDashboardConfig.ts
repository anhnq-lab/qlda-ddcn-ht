/**
 * useDashboardConfig — Dashboard Strategy Pattern
 * 
 * Determines which dashboard tier + widgets to show based on:
 * 1. SystemRole (director/manager/staff)
 * 2. Department (QLDA/KHDT/KTTD/HCTH/TCKT/PTDV)
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { usePermissionCheck } from '../../../hooks/usePermissionCheck';
import { resolveSystemRole, type SystemRole } from '../../../types/permission.types';
import type { DepartmentCode } from '../../../types/plan.types';
import { supabase } from '../../../lib/supabase';

export type DashboardTier = 'director' | 'manager' | 'staff';

export type DepartmentGroup =
    | 'qlda'   // Phòng QLDA 1/2/3
    | 'khdt'   // Phòng Kế hoạch – Đấu thầu
    | 'kttd'   // Phòng Kỹ thuật – Thẩm định
    | 'hcth'   // Phòng Hành chính – Tổng hợp
    | 'tckt'   // Phòng Tài chính – Kế toán
    | 'ptdv'   // Phòng Phát triển dịch vụ
    | 'bgd'    // Ban Giám đốc
    | 'unknown';

export interface DashboardConfig {
    tier: DashboardTier;
    systemRole: SystemRole;
    departmentGroup: DepartmentGroup;
    departmentCode: DepartmentCode | null;
    departmentName: string;
    isGlobalScope: boolean;
    allowedWidgets: string[];
    isLoadingConfig: boolean;
}

/** Map department string from DB → department group */
function resolveDepartmentGroup(department: string): DepartmentGroup {
    const d = department.toLowerCase();

    if (d.includes('giám đốc')) return 'bgd';
    if (d.includes('quản lý dự án 1')) return 'qlda';
    if (d.includes('quản lý dự án 2')) return 'qlda';
    if (d.includes('quản lý dự án 3')) return 'qlda';
    if (d.includes('kế hoạch') || d.includes('đấu thầu')) return 'khdt';
    if (d.includes('kỹ thuật') || d.includes('thẩm định')) return 'kttd';
    if (d.includes('hành chính') || d.includes('tổng hợp')) return 'hcth';
    if (d.includes('tài chính') || d.includes('kế toán')) return 'tckt';
    if (d.includes('phát triển') || d.includes('dịch vụ')) return 'ptdv';

    return 'unknown';
}

/** Map department string → DepartmentCode for plan queries */
function resolveDepartmentCode(department: string): DepartmentCode | null {
    const group = resolveDepartmentGroup(department);
    const codeMap: Record<DepartmentGroup, DepartmentCode | null> = {
        bgd: null,
        qlda: null, // Will be refined below
        khdt: 'KHDT',
        kttd: 'KTTD',
        hcth: 'HCTH',
        tckt: 'TCKT',
        ptdv: 'PTDV',
        unknown: null,
    };

    if (group === 'qlda') {
        const d = department.toLowerCase();
        if (d.includes('1')) return 'QLDA1';
        if (d.includes('2')) return 'QLDA2';
        if (d.includes('3')) return 'QLDA3';
        return 'QLDA1'; // Fallback
    }

    return codeMap[group];
}

/** Determine tier from system role */
function resolveTier(role: SystemRole): DashboardTier {
    if (['super_admin', 'director', 'deputy_director'].includes(role)) {
        return 'director';
    }
    if (['chief_accountant', 'dept_head', 'deputy_head'].includes(role)) {
        return 'manager';
    }
    return 'staff';
}

export function useDashboardConfig(): DashboardConfig {
    const { currentUser } = useAuth();
    const { isGlobalScope, systemRole } = usePermissionCheck();

    const { data: allowedWidgets = [], isLoading: isLoadingConfig } = useQuery({
        queryKey: ['dashboard_widgets', systemRole],
        queryFn: async () => {
            const { data } = await supabase
                .from('dashboard_widget_config')
                .select('widget_id')
                .eq('role', systemRole)
                .eq('is_active', true);
            
            // Nếu không có dữ liệu (có thể do lỗi rls hoặc table chưa push), trả về mảng fallback theo group để ko crash UI
            if (!data || data.length === 0) {
                return [];
            }
            return data.map((d: any) => d.widget_id);
        },
        enabled: !!systemRole,
        staleTime: 5 * 60 * 1000,
    });

    return useMemo(() => {
        if (!currentUser) {
            return {
                tier: 'staff' as DashboardTier,
                systemRole: 'staff' as SystemRole,
                departmentGroup: 'unknown' as DepartmentGroup,
                departmentCode: null,
                departmentName: '',
                isGlobalScope: false,
                allowedWidgets: [],
                isLoadingConfig: false,
            };
        }

        const department = currentUser.Department || '';
        const departmentGroup = resolveDepartmentGroup(department);
        const departmentCode = resolveDepartmentCode(department);
        const tier = resolveTier(systemRole);

        // Fallback for UI if DB migration is not applied yet:
        // Cung cấp widget tạm theo departmentGroup nếu mảng rỗng để không gián đoạn UI
        let finalWidgets = allowedWidgets;
        if (finalWidgets.length === 0 && !isLoadingConfig) {
            if (departmentGroup === 'qlda') finalWidgets = ['project_progress'];
            else if (departmentGroup === 'khdt') finalWidgets = ['bidding_pipeline', 'contract_summary'];
            else if (departmentGroup === 'kttd') finalWidgets = ['review_queue'];
            else if (departmentGroup === 'hcth') finalWidgets = ['hr_summary'];
            else if (departmentGroup === 'tckt') finalWidgets = ['payment_pipeline'];
        }

        return {
            tier,
            systemRole,
            departmentGroup,
            departmentCode,
            departmentName: department,
            isGlobalScope,
            allowedWidgets: finalWidgets,
            isLoadingConfig,
        };
    }, [currentUser, systemRole, isGlobalScope, allowedWidgets, isLoadingConfig]);
}
