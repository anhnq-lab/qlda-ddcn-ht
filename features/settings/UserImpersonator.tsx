import React, { useState, useEffect, useMemo } from 'react';
import { Users, UserCheck, X, Search, Shield, ChevronDown, Check, Building2, Clock, RefreshCw, Lock, ShieldAlert, Award, Briefcase, User, ClipboardList, HelpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Employee, Role } from '../../types';
import { useImpersonation } from '../../context/ImpersonationContext';
import { Avatar } from '../../components/ui';
import { PermissionService } from '../../services/PermissionService';
import {
    ALL_RESOURCES,
    RESOURCE_LABELS,
    ACTION_LABELS,
    ROLE_LABELS,
    ROLE_COLORS,
    DEFAULT_ROLE_PERMISSIONS,
    DEFAULT_DEPARTMENT_RULES,
    departmentMatches,
    resolveSystemRole,
    type DepartmentRule,
    type PermissionResource,
    type PermissionAction,
    type SystemRole,
} from '../../types/permission.types';

type UserTab = 'employees' | 'contractors';

interface ContractorAccountItem {
    id: string;
    contractor_id: string;
    username: string;
    display_name: string;
    email: string | null;
    contractor_name: string;
    allowed_project_ids: string[];
}

// Chỉ hiển thị module thuộc phạm vi giai đoạn 1 (khớp PHASE1_RESOURCES).
const MODULE_GROUPS = [
    {
        title: '💼 Dự án & Công việc',
        resources: ['dashboard', 'projects', 'tasks', 'calendar'] as PermissionResource[],
    },
    {
        title: '👤 Nhân sự',
        resources: ['employees'] as PermissionResource[],
    },
    {
        title: '📂 Văn bản · Quy chế · Báo cáo',
        resources: ['legal_docs', 'regulations', 'workflows', 'reports'] as PermissionResource[],
    },
    {
        title: '⚙️ Quản trị hệ thống',
        resources: ['admin_accounts', 'admin_roles', 'admin_audit'] as PermissionResource[],
    }
];

const ACTION_COLOR_CLASSES: Record<PermissionAction, string> = {
    view: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    create: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
    update: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
    delete: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    export: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
};

const UserImpersonator: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [contractorAccounts, setContractorAccounts] = useState<ContractorAccountItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<UserTab>('employees');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
    const [permissionSearch, setPermissionSearch] = useState('');
    const [deptRules, setDeptRules] = useState<DepartmentRule[]>(DEFAULT_DEPARTMENT_RULES);
    const { impersonatedUser, isImpersonating, startImpersonation, stopImpersonation,
        minutesRemaining, expiryWarning, extendSession } = useImpersonation();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch employees
                const { data: empData, error: empErr } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('status', 1)
                    .order('department')
                    .order('full_name');

                if (empErr) console.error('[UserImpersonator] Employee error:', empErr);

                if (empData) {
                    setEmployees(empData.map((e: any) => ({
                        EmployeeID: e.employee_id,
                        FullName: e.full_name,
                        Department: e.department || '',
                        Position: e.position || '',
                        Email: e.email || '',
                        Phone: e.phone || '',
                        AvatarUrl: e.avatar_url || '',
                        Status: e.status,
                        JoinDate: e.join_date || '',
                        Username: e.username || '',
                        Role: e.role as Role,
                        SystemRole: e.system_role || undefined,
                    })));
                }

                // Fetch contractor accounts with contractor names
                const { data: ctrData, error: ctrErr } = await (supabase as any)
                    .from('contractor_accounts')
                    .select('id, contractor_id, username, display_name, email, allowed_project_ids, contractors(full_name)')
                    .eq('is_active', true)
                    .order('display_name');

                if (ctrErr) console.error('[UserImpersonator] Contractor error:', ctrErr);

                if (ctrData) {
                    setContractorAccounts(ctrData.map((c: any) => ({
                        id: c.id,
                        contractor_id: c.contractor_id,
                        username: c.username,
                        display_name: c.display_name,
                        email: c.email,
                        contractor_name: c.contractors?.full_name || c.contractor_id,
                        allowed_project_ids: c.allowed_project_ids || [],
                    })));
                }
            } catch (err) {
                console.error('[UserImpersonator] Unexpected error:', err);
            }
            setLoading(false);
        };
        fetchData();

        // Nạp rule Lớp 2 (giới hạn theo phòng) để preview phản ánh đúng
        (async () => {
            try {
                const { data, error } = await (supabase as any)
                    .from('department_permission_rules')
                    .select('resource, action, allowed_departments');
                if (!error && Array.isArray(data)) {
                    setDeptRules(data.map((r: any) => ({
                        resource: r.resource, action: r.action, allowedDepartments: r.allowed_departments || [],
                    })));
                }
            } catch { /* dùng hằng số */ }
        })();
    }, []);

    // Helper: Lấy SystemRole thực tế của nhân viên
    const getEffectiveSystemRole = (emp: Employee): SystemRole => {
        return emp.SystemRole as SystemRole
            || resolveSystemRole(emp.Role, emp.Position, emp.Department);
    };

    // Tạo danh sách chọn nhanh (Quick Simulations) động từ dữ liệu tải về
    const quickSimulations = useMemo(() => {
        if (loading) return [];
        const simList: Array<{
            type: string;
            label: string;
            badgeColor: string;
            icon: typeof Award;
            data: Employee | ContractorAccountItem;
            isContractor: boolean;
        }> = [];

        // ═══ Nhóm 1: Vai trò lãnh đạo (theo system role) ═══
        const leaderRoles = [
            {
                type: 'director',
                systemRole: 'director',
                label: 'Giám đốc',
                badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                icon: Award,
            },
            {
                type: 'deputy_director',
                systemRole: 'deputy_director',
                label: 'Phó Giám đốc',
                badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                icon: Award,
            },
            {
                type: 'dept_head',
                systemRole: 'dept_head',
                label: 'Trưởng phòng',
                badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                icon: Briefcase,
            },
            {
                type: 'deputy_head',
                systemRole: 'deputy_head',
                label: 'Phó phòng',
                badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
                icon: Briefcase,
            },
        ];

        for (const cfg of leaderRoles) {
            const emp = employees.find(e => getEffectiveSystemRole(e) === cfg.systemRole);
            if (emp) {
                simList.push({
                    type: cfg.type,
                    label: cfg.label,
                    badgeColor: cfg.badgeColor,
                    icon: cfg.icon,
                    data: emp,
                    isContractor: false,
                });
            }
        }

        // ═══ Nhóm 2: Chuyên viên đại diện từng phòng nghiệp vụ chính ═══
        const deptSpecialists = [
            {
                type: 'cv_qlda',
                deptKeyword: 'Quản lý dự án',
                label: 'CV Phòng QLDA',
                badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
                icon: User,
            },
            {
                type: 'cv_kttd',
                deptKeyword: 'Kỹ thuật',
                label: 'CV Phòng KT-TĐ',
                badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
                icon: User,
            },
            {
                type: 'cv_khdt',
                deptKeyword: 'Kế hoạch',
                label: 'CV Phòng KH-ĐT',
                badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
                icon: User,
            },
        ];

        for (const cfg of deptSpecialists) {
            const emp = employees.find(e => {
                const role = getEffectiveSystemRole(e);
                return (role === 'specialist' || role === 'staff') &&
                    e.Department?.includes(cfg.deptKeyword);
            });
            if (emp) {
                simList.push({
                    type: cfg.type,
                    label: cfg.label,
                    badgeColor: cfg.badgeColor,
                    icon: cfg.icon,
                    data: emp,
                    isContractor: false,
                });
            }
        }

        // ═══ Nhóm 3: Nhà thầu ═══
        const contractor = contractorAccounts[0];
        if (contractor) {
            simList.push({
                type: 'contractor',
                label: 'Nhà thầu',
                badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
                icon: Building2,
                data: contractor,
                isContractor: true,
            });
        }

        return simList;
    }, [employees, contractorAccounts, loading]);



    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            // Chặn giả lập tài khoản Quản trị HT (super_admin) — tránh leo thang đặc quyền
            const effRole = getEffectiveSystemRole(emp);
            if (effRole === 'super_admin') return false;

            // Lọc theo chip vai trò
            if (selectedRoleFilter !== 'all') {
                if (selectedRoleFilter === 'director' && effRole !== 'director' && effRole !== 'deputy_director') return false;
                if (selectedRoleFilter === 'dept_head' && effRole !== 'dept_head' && effRole !== 'deputy_head') return false;
                if (selectedRoleFilter === 'specialist' && effRole !== 'specialist') return false;
                if (selectedRoleFilter === 'staff' && effRole !== 'staff') return false;
            }

            // Lọc theo ô tìm kiếm
            return (
                emp.FullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.Position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.Department?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
    }, [employees, searchTerm, selectedRoleFilter]);

    // Nhóm nhân viên đã lọc theo Phòng ban
    const groupedEmployees = useMemo(() => {
        const groups: Record<string, Employee[]> = {};
        filteredEmployees.forEach(emp => {
            const dept = emp.Department || 'Khác';
            if (!groups[dept]) {
                groups[dept] = [];
            }
            groups[dept].push(emp);
        });
        return groups;
    }, [filteredEmployees]);

    const filteredContractors = useMemo(() => {
        return contractorAccounts.filter(c =>
            c.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.contractor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [contractorAccounts, searchTerm]);

    const handleSelectEmployee = (emp: Employee) => {
        startImpersonation(emp);
        setIsDropdownOpen(false);
        setSearchTerm('');
    };

    const handleSelectContractor = (ctr: ContractorAccountItem) => {
        // Map contractor to Employee shape for impersonation
        const fakeEmployee: Employee = {
            EmployeeID: ctr.id,
            FullName: ctr.display_name,
            Role: 'contractor' as any,
            Department: ctr.contractor_name,
            Position: 'Nhà thầu',
            Email: ctr.email || '',
            Phone: '',
            AvatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(ctr.display_name)}&background=4a90e2&color=fff`,
            JoinDate: '',
            Status: 'Active' as any,
            Username: ctr.username,
            Password: '',
            AllowedProjectIDs: ctr.allowed_project_ids,
        };
        startImpersonation(fakeEmployee);
        setIsDropdownOpen(false);
        setSearchTerm('');
    };

    const handleQuickSimulate = (sim: typeof quickSimulations[0]) => {
        if (sim.isContractor) {
            handleSelectContractor(sim.data as any);
        } else {
            handleSelectEmployee(sim.data as Employee);
        }
    };

    const handleStopImpersonation = () => {
        stopImpersonation();
    };

    // ── Preview quyền HIỆU LỰC THẬT của người bị giả lập ──
    const [previewRole, setPreviewRole] = useState<SystemRole | null>(null);
    const [previewPerms, setPreviewPerms] = useState<Partial<Record<PermissionResource, PermissionAction[]>> | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    useEffect(() => {
        let active = true;
        if (!impersonatedUser) {
            setPreviewRole(null);
            setPreviewPerms(null);
            return;
        }
        const isContractor = (impersonatedUser.Role as string) === 'contractor';
        const role: SystemRole = isContractor
            ? 'contractor'
            : (impersonatedUser.SystemRole as SystemRole)
                || resolveSystemRole(impersonatedUser.Role, impersonatedUser.Position, impersonatedUser.Department);
        setPreviewRole(role);
        setPreviewLoading(true);

        (async () => {
            try {
                // super_admin / contractor: dùng template (super_admin = toàn quyền)
                if (role === 'super_admin' || role === 'contractor') {
                    if (active) setPreviewPerms(DEFAULT_ROLE_PERMISSIONS[role] || {});
                    return;
                }
                // 1) Ghi đè cá nhân
                const overrides = await PermissionService.getByUserId(impersonatedUser.EmployeeID);
                if (overrides.length > 0) {
                    const m: Partial<Record<PermissionResource, PermissionAction[]>> = {};
                    overrides.forEach(p => { m[p.resource] = p.actions; });
                    if (active) setPreviewPerms(m);
                    return;
                }
                // 2) Template theo role (DB → fallback hằng số)
                const defaults = await PermissionService.getDefaultPermissions(role);
                if (active) setPreviewPerms(defaults);
            } catch (e) {
                console.warn('[Impersonator] Không nạp được quyền hiệu lực, dùng hằng số:', e);
                if (active) setPreviewPerms(DEFAULT_ROLE_PERMISSIONS[role] || {});
            } finally {
                if (active) setPreviewLoading(false);
            }
        })();

        return () => { active = false; };
    }, [impersonatedUser]);

    const systemRole = previewRole;
    // Áp Lớp 2 (giới hạn theo phòng) vào preview theo phòng của người bị giả lập.
    const permissions = useMemo(() => {
        if (!previewPerms) return previewPerms;
        const LEADERSHIP: SystemRole[] = ['super_admin', 'director', 'deputy_director', 'chief_accountant'];
        if (!previewRole || LEADERSHIP.includes(previewRole)) return previewPerms; // lãnh đạo bypass
        const dept = impersonatedUser?.Department;
        const narrowed: Partial<Record<PermissionResource, PermissionAction[]>> = {};
        (Object.keys(previewPerms) as PermissionResource[]).forEach(res => {
            const acts = (previewPerms as any)[res] || [];
            narrowed[res] = acts.filter((a: PermissionAction) => {
                const rules = deptRules.filter(r => r.resource === res && r.action === a);
                if (rules.length === 0) return true;
                return rules.some(r => departmentMatches(dept, r.allowedDepartments));
            });
        });
        return narrowed;
    }, [previewPerms, previewRole, impersonatedUser, deptRules]);

    // Lọc các resource trong preview theo ô tìm kiếm permissionSearch
    const filteredModuleGroups = useMemo(() => {
        if (!permissions) return [];
        return MODULE_GROUPS.map(group => {
            const matchedResources = group.resources.filter(resource => {
                const label = RESOURCE_LABELS[resource] || '';
                return (
                    resource.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                    label.toLowerCase().includes(permissionSearch.toLowerCase())
                );
            });
            return {
                ...group,
                resources: matchedResources
            };
        }).filter(group => group.resources.length > 0);
    }, [permissions, permissionSearch]);

    const totalCount = employees.length + contractorAccounts.length;

    const handleRoleFilterChange = (filter: string) => {
        setSelectedRoleFilter(filter);
        if (filter === 'contractor') {
            setActiveTab('contractors');
        } else {
            setActiveTab('employees');
        }
    };

    return (
        <div className="space-y-8">
            {/* Quick Simulations Grid */}
            {!loading && quickSimulations.length > 0 && (
                <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm">
                    <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Award size={15} className="text-primary-500" />
                        Giả lập nhanh vai trò thường gặp
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {quickSimulations.map(sim => {
                            const SimIcon = sim.icon;
                            const isCurrent = impersonatedUser?.EmployeeID === (sim.isContractor ? sim.data.id : (sim.data as Employee).EmployeeID);
                            return (
                                <div
                                    key={sim.type}
                                    className={`relative border rounded-xl p-4 flex flex-col justify-between transition-all duration-200 ${
                                        isCurrent
                                            ? 'bg-primary-50/50 dark:bg-primary-950/20 border-primary-500 shadow-md ring-1 ring-primary-500'
                                            : 'bg-bg-subtle hover:bg-bg-surface hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md border-border'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg bg-bg-surface border border-border text-txt-secondary`}>
                                                <SimIcon size={16} />
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sim.badgeColor}`}>
                                                {sim.label}
                                            </span>
                                        </div>
                                        {isCurrent && (
                                            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-0.5">
                                                <Check size={12} /> Đang đóng
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="mb-4">
                                        <h5 className="font-bold text-sm text-txt-primary truncate">
                                            {sim.isContractor ? sim.data.display_name : (sim.data as Employee).FullName}
                                        </h5>
                                        <p className="text-xs text-txt-muted truncate mt-0.5">
                                            {sim.isContractor ? sim.data.contractor_name : (sim.data as Employee).Position}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleQuickSimulate(sim)}
                                        disabled={isCurrent}
                                        className={`w-full py-1.5 text-xs font-bold rounded-lg transition-all ${
                                            isCurrent
                                                ? 'bg-bg-muted text-txt-placeholder border border-border cursor-not-allowed'
                                                : 'bg-primary-500 text-white hover:bg-primary-600 active:scale-95 shadow-sm hover:shadow'
                                        }`}
                                    >
                                        {isCurrent ? 'Đang giả lập' : 'Giả lập ngay'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Active Impersonation Card */}
            {isImpersonating && impersonatedUser && (
                <div className="bg-gradient-to-r from-primary-50/50 to-warning-50/50 dark:from-primary-950/20 dark:to-warning-950/20 border border-primary-500/50 rounded-2xl p-6 shadow-md backdrop-blur-md">
                    <div className="flex items-center justify-between flex-wrap gap-4 border-b border-primary-200/50 dark:border-primary-800/50 pb-5">
                        <div className="flex items-center gap-4">
                            <Avatar
                                name={impersonatedUser.FullName}
                                imageUrl={impersonatedUser.AvatarUrl}
                                size="custom"
                                className="w-16 h-16 text-2xl font-bold flex-shrink-0 ring-4 ring-primary-500/20 shadow-inner"
                            />
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-500 text-white text-xs font-bold shadow-sm">
                                        <UserCheck size={12} />
                                        ĐANG GIẢ LÀM
                                    </span>
                                    {(impersonatedUser.Role as string) === 'contractor' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500 text-white text-xs font-bold shadow-sm">
                                            <Building2 size={12} />
                                            NHÀ THẦU
                                        </span>
                                    ) : (
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${ROLE_COLORS[systemRole || 'specialist'] || 'bg-bg-muted text-txt-secondary'}`}>
                                            {ROLE_LABELS[systemRole || 'specialist']}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-extrabold text-xl text-txt-primary">{impersonatedUser.FullName}</h3>
                                <p className="text-sm text-txt-muted mt-0.5">
                                    {impersonatedUser.Position || impersonatedUser.Role}
                                    {impersonatedUser.Department && ` • ${impersonatedUser.Department}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Countdown progress wheel / timer */}
                            {minutesRemaining !== null && (
                                <span className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-sm ${
                                    expiryWarning
                                        ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 animate-pulse border border-red-300'
                                        : 'bg-warning-100 dark:bg-warning-950/20 text-warning-700 dark:text-warning-300 border border-warning-200'
                                }`}>
                                    <Clock size={14} />
                                    Còn lại: {minutesRemaining} phút
                                </span>
                            )}
                            {/* Extend button */}
                            {expiryWarning && (
                                <button
                                    onClick={extendSession}
                                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-warning-500 hover:bg-warning-600 text-white rounded-xl transition-all shadow-sm hover:shadow hover:scale-105 active:scale-95"
                                >
                                    <RefreshCw size={12} />
                                    +30 phút
                                </button>
                            )}
                            <button
                                onClick={handleStopImpersonation}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                <X size={18} />
                                Dừng giả làm
                            </button>
                        </div>
                    </div>

                    {/* Permissions Preview Grouped */}
                    {permissions && (
                        <div className="mt-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                <div>
                                    <h4 className="text-sm font-bold text-txt-primary flex items-center gap-2">
                                        <Shield size={16} className="text-primary-500" />
                                        Quyền hiệu lực thực tế ({ROLE_LABELS[systemRole!]})
                                        {previewLoading && <span className="text-xs text-txt-muted font-normal animate-pulse">(đang tải...)</span>}
                                    </h4>
                                    <p className="text-xs text-txt-muted mt-1 flex items-center gap-1.5">
                                        <ShieldAlert size={12} className="text-amber-500" />
                                        Đã áp giới hạn theo phòng (Lớp 2). Riêng <strong>Sửa dự án</strong> còn tùy theo việc có là thành viên dự án hay không (Lớp 3 — tùy từng dự án). RLS cơ sở dữ liệu vẫn chạy dưới tài khoản Admin (chế độ xem trước).
                                    </p>
                                </div>
                                <div className="relative max-w-xs w-full">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm phân hệ, tài nguyên..."
                                        value={permissionSearch}
                                        onChange={e => setPermissionSearch(e.target.value)}
                                        className="w-full pl-9 pr-8 py-1.5 bg-bg-surface dark:bg-slate-900 border border-border rounded-lg text-xs text-txt-primary"
                                    />
                                    {permissionSearch && (
                                        <button
                                            onClick={() => setPermissionSearch('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-bg-muted rounded-full"
                                        >
                                            <X size={12} className="text-txt-muted" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {filteredModuleGroups.length === 0 ? (
                                    <div className="text-center py-6 text-txt-muted bg-bg-subtle/50 rounded-xl border border-dashed border-border text-sm">
                                        Không tìm thấy quyền nào khớp với từ khóa tìm kiếm
                                    </div>
                                ) : (
                                    filteredModuleGroups.map(group => (
                                        <div key={group.title} className="bg-bg-surface/60 border border-border-subtle rounded-xl p-4 shadow-sm">
                                            <h5 className="text-xs font-bold text-txt-secondary border-b border-border-subtle pb-2 mb-3">
                                                {group.title}
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                                {group.resources.map(resource => {
                                                    const actions = (permissions as any)[resource] || [];
                                                    const hasAny = actions.length > 0;
                                                    return (
                                                        <div
                                                            key={resource}
                                                            className={`flex items-start justify-between p-3 rounded-lg border text-xs transition-colors ${
                                                                hasAny
                                                                    ? 'bg-bg-subtle/50 border-border hover:bg-bg-subtle'
                                                                    : 'bg-bg-muted/30 border-border/50 opacity-40'
                                                            }`}
                                                        >
                                                            <div className="flex-1 min-w-0 pr-2">
                                                                <span className="font-semibold text-txt-primary block truncate">
                                                                    {RESOURCE_LABELS[resource] || resource}
                                                                </span>
                                                                <span className="text-[10px] text-txt-muted block font-mono mt-0.5">
                                                                    {resource}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1 justify-end max-w-[65%]">
                                                                {hasAny ? (
                                                                    actions.map((a: string) => (
                                                                        <span
                                                                            key={a}
                                                                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                                                                ACTION_COLOR_CLASSES[a as PermissionAction] || 'bg-bg-muted border-border'
                                                                            }`}
                                                                        >
                                                                            {ACTION_LABELS[a as PermissionAction] || a}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold text-txt-placeholder bg-bg-muted border border-border/50">
                                                                        <Lock size={9} />
                                                                        Bị chặn
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Selector Section */}
            <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider flex items-center gap-2">
                    <Users size={15} className="text-primary-500" />
                    Bộ chọn tìm kiếm nâng cao
                </h4>

                {/* Filter Chips row */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-txt-secondary mr-1">Bộ lọc nhanh:</span>
                    {[
                        { value: 'all', label: 'Tất cả' },
                        { value: 'director', label: 'Lãnh đạo Ban' },
                        { value: 'dept_head', label: 'Lãnh đạo phòng' },
                        { value: 'specialist', label: 'Chuyên viên' },
                        { value: 'staff', label: 'Hành chính' },
                        { value: 'contractor', label: 'Nhà thầu' },
                    ].map(chip => (
                        <button
                            key={chip.value}
                            onClick={() => handleRoleFilterChange(chip.value)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                                selectedRoleFilter === chip.value
                                    ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                                    : 'bg-bg-subtle border-border text-txt-muted hover:border-blue-400 hover:text-txt-primary'
                            }`}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>

                {/* Main Selector */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-txt-secondary mb-2">
                        Chọn người dùng bất kỳ trong hệ thống
                    </label>

                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={loading}
                        className="w-full flex items-center justify-between px-4 py-3.5 bg-bg-surface border border-border rounded-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
                    >
                        <span className={loading ? 'text-slate-400' : 'text-txt-secondary font-medium'}>
                            {loading ? 'Đang tải danh sách...' : `${totalCount} người dùng có sẵn (${employees.length} Nhân sự + ${contractorAccounts.length} Nhà thầu)`}
                        </span>
                        <ChevronDown size={20} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Content */}
                    {isDropdownOpen && !loading && (
                        <div className="absolute z-50 w-full mt-2 left-0 right-0 bg-bg-surface border border-border rounded-xl shadow-lg dark:shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                            {/* Tab Switcher */}
                            <div className="flex border-b border-border-subtle bg-bg-subtle/50">
                                <button
                                    onClick={() => setActiveTab('employees')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold transition-all ${
                                        activeTab === 'employees'
                                            ? 'text-primary-700 dark:text-primary-400 bg-bg-surface border-b-2 border-primary-500'
                                            : 'text-txt-muted hover:bg-bg-hover-row'
                                    }`}
                                >
                                    <Users size={14} />
                                    Nhân viên ({employees.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('contractors')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold transition-all ${
                                        activeTab === 'contractors'
                                            ? 'text-primary-700 dark:text-primary-400 bg-bg-surface border-b-2 border-primary-500'
                                            : 'text-txt-muted hover:bg-bg-hover-row'
                                    }`}
                                >
                                    <Building2 size={14} />
                                    Nhà thầu ({contractorAccounts.length})
                                </button>
                            </div>

                            {/* Search */}
                            <div className="p-3 border-b border-border-subtle bg-bg-surface">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder={activeTab === 'employees' ? 'Tìm theo tên, chức vụ, phòng ban...' : 'Tìm theo tên, đơn vị, username...'}
                                        className="w-full pl-9 pr-9 py-2 bg-bg-subtle dark:bg-slate-900 border border-border rounded-lg text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                        autoFocus
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-bg-muted rounded-full"
                                        >
                                            <X size={14} className="text-txt-muted" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* List */}
                            <div className="max-h-[350px] overflow-y-auto bg-bg-surface divide-y divide-border-subtle">
                                {activeTab === 'employees' ? (
                                    // Employee list grouped by department
                                    Object.keys(groupedEmployees).length === 0 ? (
                                        <div className="p-6 text-center text-slate-400">Không tìm thấy nhân viên</div>
                                    ) : (
                                        Object.entries(groupedEmployees).map(([deptName, emps]) => (
                                            <div key={deptName} className="border-t border-border-subtle first:border-t-0">
                                                <div className="bg-bg-subtle/50 px-4 py-2 text-[10px] font-bold text-txt-muted uppercase tracking-wider flex items-center gap-1.5 sticky top-0 z-10 backdrop-blur-sm">
                                                    <Briefcase size={10} />
                                                    {deptName}
                                                </div>
                                                <div className="divide-y divide-border-subtle/30">
                                                    {emps.map(emp => (
                                                        <button
                                                            key={emp.EmployeeID}
                                                            onClick={() => handleSelectEmployee(emp)}
                                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors text-left"
                                                        >
                                                            <Avatar
                                                                name={emp.FullName}
                                                                imageUrl={emp.AvatarUrl}
                                                                size="md"
                                                                className="flex-shrink-0"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-sm text-txt-primary truncate">{emp.FullName}</p>
                                                                <p className="text-xs text-txt-muted truncate mt-0.5">
                                                                    {emp.Position || emp.Role}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ROLE_COLORS[getEffectiveSystemRole(emp)] || 'bg-bg-muted'}`}>
                                                                    {ROLE_LABELS[getEffectiveSystemRole(emp)]}
                                                                </span>
                                                                {impersonatedUser?.EmployeeID === emp.EmployeeID && (
                                                                    <Check size={18} className="text-green-500 flex-shrink-0" />
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )
                                ) : (
                                    // Contractor list
                                    filteredContractors.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400">Không tìm thấy nhà thầu</div>
                                    ) : (
                                        filteredContractors.map(ctr => (
                                            <button
                                                key={ctr.id}
                                                onClick={() => handleSelectContractor(ctr)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-950/10 transition-colors text-left"
                                            >
                                                <Avatar
                                                    name={ctr.display_name}
                                                    size="md"
                                                    className="flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-txt-primary truncate">{ctr.display_name}</p>
                                                    <p className="text-xs text-txt-muted truncate mt-0.5">
                                                        {ctr.contractor_name} • @{ctr.username}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-[10px] font-bold border border-purple-200/50 shrink-0">
                                                        Nhà thầu
                                                    </span>
                                                    {impersonatedUser?.EmployeeID === ctr.id && (
                                                        <Check size={18} className="text-green-500 flex-shrink-0" />
                                                    )}
                                                </div>
                                            </button>
                                        ))
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Close dropdown when clicking outside */}
            {isDropdownOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                />
            )}

            {/* Instructions */}
            <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900/50 rounded-xl p-5 text-sm">
                <p className="font-bold text-blue-700 dark:text-blue-400 mb-2.5 flex items-center gap-1.5">
                    <HelpCircle size={16} />
                    Hướng dẫn giả lập & kiểm thử phân quyền:
                </p>
                <ol className="text-blue-600 dark:text-blue-300 space-y-2 text-xs list-decimal list-inside">
                    <li>Sử dụng các **Thẻ chọn nhanh** để đổi ngay vai trò tiêu biểu (Giám đốc, Trưởng phòng, Chuyên viên, Nhà thầu).</li>
                    <li>Hoặc sử dụng **Bộ chọn nâng cao** để lọc và tìm kiếm nhân viên theo Tên, Chức danh, Phòng ban.</li>
                    <li>Hệ thống tự động đồng bộ giao diện hiển thị, cấu trúc Menu Sidebar và nút bấm theo quyền của người được giả lập.</li>
                    <li>Kiểm tra phần **Quyền hiệu lực thực tế** hiển thị bên dưới thông tin người đang giả lập để xem chi tiết những gì họ được cấp/chặn.</li>
                    <li>Sử dụng **Thanh điều hướng nổi ở đáy màn hình** để biết mình vẫn đang giả lập và nhấn **"Dừng giả làm"** để khôi phục quyền Admin gốc của bạn bất kỳ lúc nào.</li>
                </ol>
            </div>
        </div>
    );
};

export default UserImpersonator;
