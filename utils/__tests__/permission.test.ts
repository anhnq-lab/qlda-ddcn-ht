/**
 * Unit Tests — types/permission.types.ts
 * Tests resolveSystemRole() and exported ROLE_HIERARCHY constants
 */
import { describe, it, expect } from 'vitest';
import {
    resolveSystemRole,
    ALL_ROLES,
    GLOBAL_VIEW_ROLES,
    ROLE_LABELS,
    type SystemRole,
} from '../../types/permission.types';

// ═══════════════════════════════════════════════════════════════════
// resolveSystemRole
// ═══════════════════════════════════════════════════════════════════
describe('resolveSystemRole', () => {
    // ─── Explicit legacy role: Admin / Director / DeputyDirector ──
    describe('Admin legacy role', () => {
        it('returns "super_admin" when legacyRole is "Admin"', () => {
            expect(resolveSystemRole('Admin', 'Nhân viên')).toBe('super_admin');
        });

        it('returns "super_admin" when position contains "quản trị"', () => {
            expect(resolveSystemRole('Staff', 'Quản trị hệ thống')).toBe('super_admin');
        });
    });

    describe('Director legacy role', () => {
        it('returns "director" when legacyRole is "Director"', () => {
            expect(resolveSystemRole('Director', 'Giám đốc Ban')).toBe('director');
        });

        it('returns "director" when position is "Giám đốc" (no phó)', () => {
            expect(resolveSystemRole('Staff', 'Giám đốc')).toBe('director');
        });
    });

    describe('DeputyDirector legacy role', () => {
        it('returns "deputy_director" when legacyRole is "DeputyDirector"', () => {
            expect(resolveSystemRole('DeputyDirector', 'Phó Giám đốc')).toBe('deputy_director');
        });

        it('returns "deputy_director" when position contains "phó giám đốc"', () => {
            expect(resolveSystemRole('Staff', 'Phó Giám đốc Ban')).toBe('deputy_director');
        });
    });

    // ─── Position-based mapping ────────────────────────────────────
    describe('position-based mapping', () => {
        it('returns "chief_accountant" for position "Kế toán trưởng"', () => {
            expect(resolveSystemRole('Staff', 'Kế toán trưởng')).toBe('chief_accountant');
        });

        it('returns "dept_head" for position "Trưởng phòng"', () => {
            expect(resolveSystemRole('Manager', 'Trưởng phòng Kỹ thuật')).toBe('dept_head');
        });

        it('returns "dept_head" for position "Trưởng ban"', () => {
            expect(resolveSystemRole('Manager', 'Trưởng ban điều hành dự án')).toBe('dept_head');
        });

        it('returns "deputy_head" for position "Phó phòng"', () => {
            expect(resolveSystemRole('Manager', 'Phó phòng Kế hoạch')).toBe('deputy_head');
        });

        it('returns "specialist" for position "Chuyên viên"', () => {
            expect(resolveSystemRole('Staff', 'Chuyên viên tư vấn')).toBe('specialist');
        });

        it('returns "specialist" for position "Kỹ sư"', () => {
            expect(resolveSystemRole('Staff', 'Kỹ sư xây dựng')).toBe('specialist');
        });

        it('returns "staff" for position "Nhân viên"', () => {
            expect(resolveSystemRole('Staff', 'Nhân viên hành chính')).toBe('staff');
        });

        it('returns "contractor" for position containing "nhà thầu"', () => {
            expect(resolveSystemRole('Staff', 'Đại diện nhà thầu')).toBe('contractor');
        });

        it('returns "contractor" when legacyRole is "contractor" (case-insensitive)', () => {
            expect(resolveSystemRole('contractor', 'Công nhân')).toBe('contractor');
        });
    });

    // ─── Legacy Manager role with department context ───────────────
    describe('Manager legacy role fallback', () => {
        it('returns "dept_head" for Manager without special dept', () => {
            expect(resolveSystemRole('Manager', 'Quản lý')).toBe('dept_head');
        });

        it('returns "deputy_director" for Manager in "ban giám đốc"', () => {
            expect(resolveSystemRole('Manager', 'Quản lý', 'Ban Giám đốc')).toBe('deputy_director');
        });
    });

    // ─── Staff legacy role ─────────────────────────────────────────
    describe('Staff legacy role', () => {
        it('returns "staff" when legacyRole is "Staff" and position unrecognized', () => {
            // Position doesn't match any known pattern → falls to Staff check
            expect(resolveSystemRole('Staff', 'Tập sự')).toBe('staff');
        });
    });

    // ─── Unknown/default ───────────────────────────────────────────
    describe('unknown/default inputs', () => {
        it('returns "specialist" for completely unrecognized inputs', () => {
            // Neither legacy role nor position matches → falls through to return 'specialist'
            expect(resolveSystemRole('unknown_role', 'Chức danh lạ')).toBe('specialist');
        });

        it('handles empty strings gracefully and returns a valid SystemRole', () => {
            const result = resolveSystemRole('', '');
            const validRoles: SystemRole[] = [
                'super_admin', 'director', 'deputy_director', 'chief_accountant',
                'dept_head', 'deputy_head', 'specialist', 'staff', 'contractor',
            ];
            expect(validRoles).toContain(result);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════
// ROLE_HIERARCHY / exported constants
// ═══════════════════════════════════════════════════════════════════
describe('ALL_ROLES', () => {
    it('contains all 9 SystemRole values', () => {
        expect(ALL_ROLES).toHaveLength(9);
    });

    it('starts with super_admin', () => {
        expect(ALL_ROLES[0]).toBe('super_admin');
    });

    it('includes director, specialist, staff, and contractor', () => {
        expect(ALL_ROLES).toContain('director');
        expect(ALL_ROLES).toContain('specialist');
        expect(ALL_ROLES).toContain('staff');
        expect(ALL_ROLES).toContain('contractor');
    });
});

describe('GLOBAL_VIEW_ROLES', () => {
    it('includes super_admin and director', () => {
        expect(GLOBAL_VIEW_ROLES).toContain('super_admin');
        expect(GLOBAL_VIEW_ROLES).toContain('director');
    });

    it('does NOT include specialist or staff (project-scoped roles)', () => {
        expect(GLOBAL_VIEW_ROLES).not.toContain('specialist');
        expect(GLOBAL_VIEW_ROLES).not.toContain('staff');
    });
});

describe('ROLE_LABELS', () => {
    it('provides a label for every role in ALL_ROLES', () => {
        for (const role of ALL_ROLES) {
            expect(ROLE_LABELS[role]).toBeTruthy();
        }
    });
});
