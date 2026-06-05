/**
 * Permission Types — QLDA ĐDCN TP.HCM
 * 
 * Based on authorization_specification.md v1.0
 * Pattern follows cic-erp-contract/types.ts
 */

// ═══════════════════════════════════════════
// Core types
// ═══════════════════════════════════════════

export type PermissionAction = 'view' | 'create' | 'update' | 'delete' | 'export';

export type PermissionResource =
    | 'dashboard'
    | 'projects'
    | 'tasks'
    | 'employees'
    | 'contractors'
    | 'bidding'
    | 'contracts'
    | 'payments'
    | 'capital'
    | 'documents'
    | 'cde'
    | 'bim'
    | 'legal_docs'
    | 'reports'
    | 'regulations'
    | 'workflows'
    | 'admin_accounts'
    | 'admin_roles'
    | 'admin_audit'
    | 'calendar'
    | 'site_clearance';

export type SystemRole =
    | 'super_admin'
    | 'director'
    | 'deputy_director'
    | 'chief_accountant'
    | 'dept_head'
    | 'deputy_head'
    | 'specialist'
    | 'staff'
    | 'contractor';

export interface UserPermission {
    id?: string;
    userId: string;         // employee_id
    resource: PermissionResource;
    actions: PermissionAction[];
    createdAt?: string;
    updatedAt?: string;
}

// ═══════════════════════════════════════════
// Labels & Display
// ═══════════════════════════════════════════

export const RESOURCE_LABELS: Record<PermissionResource, string> = {
    dashboard: 'Tổng quan',
    projects: 'Dự án',
    tasks: 'Công việc',
    employees: 'Nhân sự',
    contractors: 'Nhà thầu',
    bidding: 'Đấu thầu',
    contracts: 'Hợp đồng',
    payments: 'Thanh toán',
    capital: 'KH Vốn & Giải ngân',
    documents: 'Hồ sơ tài liệu',
    cde: 'CDE',
    bim: 'Mô hình BIM',
    legal_docs: 'VB Pháp luật',
    reports: 'Báo cáo',
    regulations: 'Quy chế',
    workflows: 'Quy trình',
    admin_accounts: 'Tài khoản',
    admin_roles: 'Phân quyền',
    admin_audit: 'Nhật ký HT',
    calendar: 'Lịch cơ quan',
    site_clearance: 'Giải phóng mặt bằng',
};

export const ACTION_LABELS: Record<PermissionAction, string> = {
    view: 'Xem',
    create: 'Thêm',
    update: 'Sửa',
    delete: 'Xóa',
    export: 'Xuất',
};

export const ROLE_LABELS: Record<SystemRole, string> = {
    super_admin: 'Quản trị HT',
    director: 'Lãnh đạo Ban',
    deputy_director: 'Lãnh đạo Ban',
    chief_accountant: 'KT Trưởng',
    dept_head: 'Lãnh đạo phòng',
    deputy_head: 'Lãnh đạo phòng',
    specialist: 'Chuyên viên',
    staff: 'Hành chính',
    contractor: 'Nhà thầu',
};

export const ROLE_COLORS: Record<SystemRole, string> = {
    super_admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    director: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    deputy_director: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    chief_accountant: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    dept_head: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    deputy_head: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    specialist: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    staff: 'bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400',
    contractor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export const ALL_ROLES: SystemRole[] = [
    'super_admin', 'director', 'deputy_director', 'chief_accountant',
    'dept_head', 'deputy_head', 'specialist', 'staff', 'contractor'
];

export const CORE_ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete'];

export const ALL_RESOURCES: PermissionResource[] = [
    'dashboard', 'projects', 'tasks', 'employees', 'contractors',
    'bidding', 'contracts', 'payments', 'capital',
    'documents', 'cde', 'bim',
    'legal_docs', 'reports', 'regulations', 'workflows',
    'admin_accounts', 'admin_roles', 'admin_audit', 'calendar', 'site_clearance'
];

/**
 * Module thuộc PHẠM VI GIAI ĐOẠN 1 (đang vận hành) — dùng cho UI phân quyền.
 * Các module hoãn (contractors, bidding, contracts, payments, capital, documents,
 * cde, bim, site_clearance) tạm ẩn khỏi ma trận, sẽ mở lại khi đưa vào vận hành.
 * Theo docs/phan_quyen_theo_module.md (Mục 3 & Mục 7).
 */
export const PHASE1_RESOURCES: PermissionResource[] = [
    'dashboard', 'calendar', 'projects', 'tasks', 'employees',
    'legal_docs', 'regulations', 'reports', 'workflows',
    'admin_accounts', 'admin_roles', 'admin_audit',
];

// ═══════════════════════════════════════════
// Role groups — data scope
// ═══════════════════════════════════════════

/**
 * Roles that can see data across ALL projects.
 *
 * NOTE: `deputy_director` is intentionally NOT global. Per the org chart,
 * a Phó GĐ only oversees specific QLDA boards (see leadership_assignments).
 * Their scope is resolved dynamically in PermissionContext (managedBoards).
 * Fallback: a deputy with no assignments yet keeps global view (non-breaking)
 * until an admin configures their boards.
 */
export const GLOBAL_VIEW_ROLES: SystemRole[] = [
    'super_admin', 'director', 'chief_accountant'
];

/**
 * Departments that see all projects (global scope).
 * Tên canonical theo cơ cấu Ban QLDA Hà Tĩnh; kèm tên cũ/biến thể làm alias.
 * Phải đồng bộ với `OrgChartPage` và dữ liệu `employees.department`.
 */
export const GLOBAL_VIEW_DEPARTMENTS = [
    // Canonical (Hà Tĩnh)
    'Ban Giám đốc',
    'Phòng Hành chính – Tổng hợp',
    'Phòng Kế hoạch – Đấu thầu',
    'Phòng Kỹ thuật – Thẩm định',
    'Phòng Phát triển dịch vụ',
    // Legacy / alias (giữ để không vỡ dữ liệu cũ)
    'Văn phòng',
    'Phòng Kế hoạch – Đầu tư',
    'Phòng Tài chính – Kế toán',
    'Phòng Chính sách – Pháp chế',
    'Phòng Kỹ thuật – Chất lượng',
    'Trung tâm Dịch vụ tư vấn',
];

/**
 * Project-scoped departments — members only see their own projects.
 * Includes both canonical DB names ('Phòng Quản lý dự án') and legacy
 * naming variants ('Ban Điều hành dự án') that may exist in employees.department.
 * Must stay in sync with the `departments` table (is_global_scope = FALSE rows).
 */
export const PROJECT_SCOPED_DEPARTMENTS = [
    // Cơ cấu Hà Tĩnh hiện tại chỉ còn 3 Phòng QLDA (Decision #7 — đã dọn QLDA 4/5).
    'Phòng Quản lý dự án 1',
    'Phòng Quản lý dự án 2',
    'Phòng Quản lý dự án 3',
    // Legacy / alias names (employees.department may still carry these)
    'Ban Điều hành dự án 1',
    'Ban Điều hành dự án 2',
    'Ban Điều hành dự án 3',
    'Ban ĐHDA 1',
    'Ban ĐHDA 2',
    'Ban ĐHDA 3',
];

// ═══════════════════════════════════════════
// Lớp 2 — Giới hạn quyền theo phòng ban (department_permission_rules)
// ═══════════════════════════════════════════

export interface DepartmentRule {
    resource: PermissionResource;
    action: PermissionAction;
    /** Danh sách phòng được phép (so khớp linh hoạt qua departmentMatches). */
    allowedDepartments: string[];
}

/**
 * Khi tồn tại rule cho (resource, action): chỉ user thuộc allowedDepartments mới
 * được thực hiện action đó — TRỪ các vai trò toàn cục (GLOBAL_VIEW_ROLES) bypass.
 * Đây là fallback hằng số; nguồn chuẩn là bảng `department_permission_rules` (DB).
 * Phải đồng bộ với seed migration.
 */
export const DEFAULT_DEPARTMENT_RULES: DepartmentRule[] = [
    { resource: 'projects', action: 'create', allowedDepartments: ['Phòng Kế hoạch – Đấu thầu'] },
    { resource: 'employees', action: 'create', allowedDepartments: ['Phòng Hành chính – Tổng hợp'] },
    { resource: 'employees', action: 'update', allowedDepartments: ['Phòng Hành chính – Tổng hợp'] },
    { resource: 'employees', action: 'delete', allowedDepartments: ['Phòng Hành chính – Tổng hợp'] },
    { resource: 'calendar', action: 'create', allowedDepartments: ['Phòng Hành chính – Tổng hợp'] },
    { resource: 'calendar', action: 'update', allowedDepartments: ['Phòng Hành chính – Tổng hợp'] },
    { resource: 'regulations', action: 'create', allowedDepartments: ['Phòng Hành chính – Tổng hợp'] },
    { resource: 'regulations', action: 'update', allowedDepartments: ['Phòng Hành chính – Tổng hợp'] },
];

/** So khớp tên phòng linh hoạt: chuẩn hóa gạch ngang/khoảng trắng, so 2 chiều substring. */
export function departmentMatches(userDept: string | undefined | null, allowed: string[]): boolean {
    if (!userDept) return false;
    const norm = (s: string) => s.toLowerCase().replace(/[–—-]/g, '-').replace(/\s+/g, ' ').trim();
    const u = norm(userDept);
    return allowed.some(a => {
        const x = norm(a);
        return u === x || u.includes(x) || x.includes(u);
    });
}

// ═══════════════════════════════════════════
// Legacy role → new system role mapping
// ═══════════════════════════════════════════

export const LEGACY_ROLE_MAP: Record<string, SystemRole> = {
    'Admin': 'super_admin',
    'Director': 'director',
    'DeputyDirector': 'deputy_director',
    'Manager': 'dept_head',  // Will be refined per position
    'Staff': 'staff',        // Hành chính — quyền hạn chế hơn specialist
};

/**
 * Map legacy employee role + position to new SystemRole.
 * More specific than LEGACY_ROLE_MAP — uses position title.
 */
export function resolveSystemRole(legacyRole: string, position: string, department: string = ''): SystemRole {
    // Explicit legacy role mapping first
    if (legacyRole === 'Admin' || position.toLowerCase().includes('quản trị')) return 'super_admin';
    if (legacyRole === 'Director' || position.toLowerCase().includes('giám đốc') && !position.toLowerCase().includes('phó') && !position.toLowerCase().includes('trung tâm')) return 'director';
    if (legacyRole === 'DeputyDirector' || position.toLowerCase().includes('phó giám đốc') || position.toLowerCase().includes('phó gđ')) return 'deputy_director';

    // Position-based mapping 
    const posLower = position.toLowerCase();
    const deptLower = department.toLowerCase();

    if (posLower.includes('kế toán trưởng')) return 'chief_accountant';
    if (posLower.includes('giám đốc trung tâm')) return 'dept_head';
    if (posLower.includes('chánh văn phòng')) return 'dept_head';
    if (posLower.includes('trưởng phòng') || posLower.includes('trưởng ban')) return 'dept_head';
    if (posLower.includes('phó phòng') || posLower.includes('phó văn phòng') || posLower.includes('phó ban')) return 'deputy_head';
    if (posLower.includes('chuyên viên') || posLower.includes('kỹ sư') || posLower.includes('thành viên')) return 'specialist';
    if (posLower.includes('nhân viên')) return 'staff';
    if (posLower.includes('nhà thầu') || legacyRole.toLowerCase() === 'contractor') return 'contractor';

    // Default for CV, KS, KTV, TVGS etc.
    if (legacyRole === 'Manager') {
        if (deptLower.includes('ban giám đốc')) return 'deputy_director'; // Map to Lãnh đạo Ban
        return 'dept_head';
    }
    if (legacyRole === 'Staff') return 'staff';

    return 'specialist';
}

// ═══════════════════════════════════════════
// Default permissions per role
// Based on authorization_specification.md §4
// ═══════════════════════════════════════════

export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, Partial<Record<PermissionResource, PermissionAction[]>>> = {
    // ── Super Admin: full access ──
    super_admin: {
        dashboard: ['view', 'export'],
        projects: ['view', 'create', 'update', 'delete'],
        tasks: ['view', 'create', 'update', 'delete'],
        employees: ['view', 'create', 'update', 'delete'],
        contractors: ['view', 'create', 'update'],
        bidding: ['view', 'create', 'update', 'delete', 'export'],
        contracts: ['view', 'create', 'update', 'delete'],
        payments: ['view', 'create', 'update', 'delete'],
        capital: ['view', 'create', 'update', 'delete', 'export'],
        documents: ['view', 'create', 'update', 'delete'],
        cde: ['view', 'create', 'update', 'delete'],
        bim: ['view', 'create', 'update', 'delete'],
        legal_docs: ['view'],
        reports: ['view', 'export'],
        regulations: ['view'],
        workflows: ['view', 'create', 'update', 'delete'],
        admin_accounts: ['view', 'create', 'update', 'delete'],
        admin_roles: ['view', 'create', 'update', 'delete'],
        admin_audit: ['view'],
        calendar: ['view', 'create', 'update', 'delete'],
        site_clearance: ['view', 'create', 'update', 'delete', 'export'],
    },

    // ── Giám đốc Ban ──
    director: {
        dashboard: ['view', 'export'],
        projects: ['view'],
        tasks: ['view'],
        employees: ['view'],
        contractors: ['view'],
        bidding: ['view'],
        contracts: ['view'],
        payments: ['view'],
        capital: ['view', 'export'],
        documents: ['view'],
        cde: ['view'],
        bim: ['view'],
        legal_docs: ['view'],
        reports: ['view', 'export'],
        regulations: ['view'],
        workflows: ['view'],
        calendar: ['view', 'create', 'update', 'delete'],
        site_clearance: ['view', 'export'],
    },

    // ── Phó Giám đốc ──
    deputy_director: {
        dashboard: ['view', 'export'],
        projects: ['view'],
        tasks: ['view'],
        employees: ['view'],
        contractors: ['view'],
        bidding: ['view'],
        contracts: ['view'],
        payments: ['view'],
        capital: ['view', 'export'],
        documents: ['view'],
        cde: ['view'],
        bim: ['view'],
        legal_docs: ['view'],
        reports: ['view', 'export'],
        regulations: ['view'],
        workflows: ['view'],
        calendar: ['view', 'create', 'update', 'delete'],
        site_clearance: ['view', 'export'],
    },

    // ── Kế toán trưởng ──
    chief_accountant: {
        dashboard: ['view', 'export'],
        projects: ['view'],
        tasks: ['view'],
        employees: ['view'],
        contractors: ['view'],
        bidding: ['view'],
        contracts: ['view'],
        payments: ['view'],
        capital: ['view'],
        documents: ['view'],
        cde: ['view'],
        bim: ['view'],
        legal_docs: ['view'],
        reports: ['view', 'export'],
        regulations: ['view'],
        workflows: ['view'],
        calendar: ['view'],
        site_clearance: ['view'],
    },

    // ── Trưởng phòng / Trưởng ban ──
    // GĐ1: projects chỉ Xem (Decision #1). employees/calendar/regulations cấp ở role,
    // bị Lớp 2 (department_permission_rules) siết về Phòng HC-TH.
    dept_head: {
        dashboard: ['view'],
        projects: ['view'],
        tasks: ['view', 'create', 'update', 'delete'],
        employees: ['view', 'create', 'update', 'delete'], // Lớp 2 → chỉ HC-TH
        contractors: ['view', 'create', 'update'],
        bidding: ['view', 'create', 'update', 'export'],
        contracts: ['view', 'create', 'update'],
        payments: ['view', 'create', 'update'],
        capital: ['view', 'create', 'update', 'export'],
        documents: ['view', 'create', 'update', 'delete'],
        cde: ['view', 'create', 'update'],
        bim: ['view', 'create', 'update'],
        legal_docs: ['view'],
        reports: ['view', 'export'],
        regulations: ['view', 'create', 'update'], // Lớp 2 → chỉ HC-TH
        workflows: ['view', 'create', 'update'],
        calendar: ['view', 'create', 'update'], // Lớp 2 → chỉ HC-TH (Decision #4)
        site_clearance: ['view', 'create', 'update'],
    },

    // ── Phó phòng ──
    deputy_head: {
        dashboard: ['view'],
        projects: ['view'],
        tasks: ['view', 'create', 'update'],
        employees: ['view'],
        contractors: ['view', 'create', 'update'],
        bidding: ['view', 'create', 'update'],
        contracts: ['view', 'create', 'update'],
        payments: ['view', 'create', 'update'],
        capital: ['view', 'create', 'update', 'export'],
        documents: ['view', 'create', 'update'],
        cde: ['view', 'create', 'update'],
        bim: ['view', 'create', 'update'],
        legal_docs: ['view'],
        reports: ['view', 'export'],
        regulations: ['view', 'create', 'update'], // Lớp 2 → chỉ HC-TH
        workflows: ['view'],
        calendar: ['view', 'create', 'update'], // Lớp 2 → chỉ HC-TH (Decision #4)
        site_clearance: ['view', 'create', 'update'],
    },

    // ── Chuyên viên / Kỹ sư ──
    // projects.create bị Lớp 2 siết về Phòng KH-ĐT; projects.update bị Lớp 3 siết
    // theo thành viên dự án (created_by / project_members). regulations Lớp 2 → HC-TH.
    specialist: {
        dashboard: ['view'],
        projects: ['view', 'create', 'update'],  // create→KH-ĐT (Lớp 2); update→thành viên (Lớp 3)
        tasks: ['view', 'create', 'update'],
        employees: ['view'],
        contractors: ['view', 'create', 'update'],
        bidding: ['view', 'create', 'update'],
        contracts: ['view', 'create', 'update'],
        payments: ['view', 'create'],
        capital: ['view', 'create', 'update'],
        documents: ['view', 'create', 'update'],
        cde: ['view', 'create', 'update'],
        bim: ['view', 'create', 'update'],
        legal_docs: ['view'],
        reports: ['view'],
        regulations: ['view', 'create', 'update'], // Lớp 2 → chỉ HC-TH
        workflows: ['view'],
        calendar: ['view'],
        site_clearance: ['view', 'create', 'update'],
    },
    // ── Nhân viên Hành chính ──
    // projects.update bị Lớp 3 siết theo thành viên dự án. regulations Lớp 2 → HC-TH.
    staff: {
        dashboard: ['view'],
        projects: ['view'],
        tasks: ['view', 'create', 'update'],
        employees: ['view'],
        contractors: ['view'],
        bidding: ['view'],
        contracts: ['view'],
        payments: ['view'],
        capital: ['view'],
        documents: ['view', 'create'],  // Nhập liệu, tải tài liệu
        cde: ['view'],
        bim: ['view'],
        legal_docs: ['view'],
        reports: ['view'],
        regulations: ['view', 'create', 'update'], // Lớp 2 → chỉ HC-TH
        workflows: ['view'],
        calendar: ['view'],
        site_clearance: ['view'],
    },

    // ── Nhà thầu ──
    contractor: {
        projects: ['view'],       // project-scoped
        contracts: ['view'],      // project-scoped: xem HĐ liên quan
        payments: ['view'],       // project-scoped: xem thanh toán liên quan
        cde: ['view', 'create'],  // project-scoped: xem + upload tài liệu
    },
};

