/**
 * useDashboardConfig — Dashboard Strategy Pattern
 * 
 * Determines which dashboard tier + widgets to show based on:
 * 1. SystemRole (director/manager/staff)
 * 2. Department (QLDA/KHDT/KTTD/HCTH/TCKT/PTDV)
 */
import { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { usePermissionCheck } from '../../../hooks/usePermissionCheck';
import { resolveSystemRole, type SystemRole } from '../../../types/permission.types';
import type { DepartmentCode } from '../../../types/plan.types';

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
        tckt: null,  // TODO: add TCKT to DEPARTMENT_CODES
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

    return useMemo(() => {
        if (!currentUser) {
            return {
                tier: 'staff' as DashboardTier,
                systemRole: 'staff' as SystemRole,
                departmentGroup: 'unknown' as DepartmentGroup,
                departmentCode: null,
                departmentName: '',
                isGlobalScope: false,
            };
        }

        const department = currentUser.Department || '';
        const departmentGroup = resolveDepartmentGroup(department);
        const departmentCode = resolveDepartmentCode(department);
        const tier = resolveTier(systemRole);

        return {
            tier,
            systemRole,
            departmentGroup,
            departmentCode,
            departmentName: department,
            isGlobalScope,
        };
    }, [currentUser, systemRole, isGlobalScope]);
}
