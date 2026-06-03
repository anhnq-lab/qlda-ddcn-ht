/**
 * UserImpersonator — QLDA ĐDCN TP.HCM
 *
 * Admin UI to select an employee OR contractor and impersonate them.
 * Shows active impersonation banner + permission preview.
 *
 * Pattern follows cic-erp-contract/components/settings/UserImpersonator.tsx
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Users, UserCheck, X, Search, Shield, ChevronDown, Check, Building2, Clock, RefreshCw } from 'lucide-react';
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
    DEFAULT_ROLE_PERMISSIONS,
    resolveSystemRole,
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

const UserImpersonator: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [contractorAccounts, setContractorAccounts] = useState<ContractorAccountItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<UserTab>('employees');
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
    }, []);

    const filteredEmployees = useMemo(() => employees.filter(emp => {
        // Chặn giả lập tài khoản Quản trị HT (super_admin) — tránh leo thang đặc quyền (C-6.4)
        const effRole: SystemRole = (emp.SystemRole as SystemRole)
            || resolveSystemRole(emp.Role, emp.Position, emp.Department);
        if (effRole === 'super_admin') return false;
        return (
            emp.FullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.Position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.Department?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }), [employees, searchTerm]);

    const filteredContractors = useMemo(() => contractorAccounts.filter(c =>
        c.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contractor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.username.toLowerCase().includes(searchTerm.toLowerCase())
    ), [contractorAccounts, searchTerm]);

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

    const handleStopImpersonation = () => {
        stopImpersonation();
    };

    // ── Preview quyền HIỆU LỰC THẬT của người bị giả lập (C-6.1) ──
    // Ưu tiên system_role; nạp ghi đè cá nhân (user_permissions) → role_permission_defaults.
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
    const permissions = previewPerms;

    const totalCount = employees.length + contractorAccounts.length;

    return (
        <div className="space-y-6">
            {/* Active Impersonation Banner */}
            {isImpersonating && impersonatedUser && (
                <div className="bg-gradient-to-r from-primary-50 to-warning-50 dark:from-primary-900/30 dark:to-warning-900/30 border border-primary-400 rounded-lg p-5">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <Avatar
                                name={impersonatedUser.FullName}
                                imageUrl={impersonatedUser.AvatarUrl}
                                size="custom"
                                className="w-14 h-14 text-xl font-bold flex-shrink-0"
                            />
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-500 text-white text-xs font-bold">
                                        <UserCheck size={12} />
                                        ĐANG GIẢ LÀM
                                    </span>
                                    {(impersonatedUser.Role as string) === 'contractor' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-600 text-white text-xs font-bold">
                                            <Building2 size={12} />
                                            NHÀ THẦU
                                        </span>
                                    )}
                                </div>
                                <p className="font-bold text-lg text-txt-primary">{impersonatedUser.FullName}</p>
                                <p className="text-sm text-txt-muted">
                                    {impersonatedUser.Position || impersonatedUser.Role}
                                    {impersonatedUser.Department && ` • ${impersonatedUser.Department}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Countdown timer */}
                            {minutesRemaining !== null && (
                                <span className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                    expiryWarning
                                        ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 animate-pulse'
                                        : 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300'
                                }`}>
                                    <Clock size={13} />
                                    {expiryWarning ? '⚠️ ' : ''}{minutesRemaining} phút
                                </span>
                            )}
                            {/* Extend button */}
                            {expiryWarning && (
                                <button
                                    onClick={extendSession}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-warning-500 hover:bg-warning-600 text-white rounded-lg transition-colors shadow-sm"
                                >
                                    <RefreshCw size={12} />
                                    +30 phút
                                </button>
                            )}
                            <button
                                onClick={handleStopImpersonation}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-all shadow-md hover:shadow-lg"
                            >
                                <X size={18} />
                                Dừng giả làm
                            </button>
                        </div>
                    </div>

                    {/* Permissions Preview */}
                    {permissions && (
                        <div className="mt-5 pt-4 border-t border-primary-200 dark:border-primary-700">
                            <p className="text-xs font-bold text-primary-700 dark:text-primary-400 mb-1 flex items-center gap-1">
                                <Shield size={14} />
                                QUYỀN HIỆU LỰC CỦA NGƯỜI NÀY ({ROLE_LABELS[systemRole!]}){previewLoading ? ' — đang tải…' : ''}:
                            </p>
                            <p className="text-[11px] text-txt-muted mb-3 italic">
                                ⚠️ Chế độ <strong>xem trước</strong>: giao diện thích ứng theo quyền của người này, nhưng truy vấn dữ liệu vẫn chạy dưới phiên đăng nhập Admin (RLS chưa đổi).
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                                {ALL_RESOURCES.map(resource => {
                                    const actions = (permissions as any)[resource] || [];
                                    return (
                                        <div key={resource} className={`rounded-lg p-2 text-xs ${actions.length > 0 ? 'bg-bg-surface' : 'bg-bg-muted opacity-50'}`}>
                                            <span className="font-semibold text-txt-secondary block">
                                                {RESOURCE_LABELS[resource]}
                                            </span>
                                            <span className="text-txt-muted">
                                                {actions.length > 0 ? actions.map((a: string) => ACTION_LABELS[a as PermissionAction] || a).join(', ') : '—'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* User Selection Dropdown */}
            <div className="relative">
                <label className="block text-sm font-semibold text-txt-secondary mb-2">
                    Chọn nhân viên để giả làm
                </label>

                <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    disabled={loading}
                    className="w-full flex items-center justify-between px-4 py-3 bg-bg-surface border border-border rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer"
                >
                    <span className={loading ? 'text-slate-400' : 'text-txt-secondary'}>
                        {loading ? 'Đang tải danh sách...' : `${totalCount} người dùng có sẵn (${employees.length} NV + ${contractorAccounts.length} NT)`}
                    </span>
                    <ChevronDown size={20} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Content */}
                {isDropdownOpen && !loading && (
                    <div className="absolute z-50 w-full mt-2 left-0 right-0 bg-bg-surface border border-border rounded-lg shadow-sm dark:shadow-black/40 overflow-hidden">
                        {/* Tab Switcher */}
                        <div className="flex border-b border-border-subtle">
                            <button
                                onClick={() => setActiveTab('employees')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors ${
                                    activeTab === 'employees'
                                        ? 'text-primary-700 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10 border-b-2 border-primary-500'
                                        : 'text-txt-muted hover:bg-bg-hover-row'
                                }`}
                            >
                                <Users size={14} />
                                Nhân viên ({employees.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('contractors')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors ${
                                    activeTab === 'contractors'
                                        ? 'text-primary-700 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10 border-b-2 border-primary-500'
                                        : 'text-txt-muted hover:bg-bg-hover-row'
                                }`}
                            >
                                <Building2 size={14} />
                                Nhà thầu ({contractorAccounts.length})
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-3 border-b border-border-subtle">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder={activeTab === 'employees' ? 'Tìm theo tên, chức vụ, phòng ban...' : 'Tìm theo tên, đơn vị, username...'}
                                    className="w-full pl-9 pr-3 py-2 bg-bg-subtle dark:bg-slate-900 border border-border rounded-lg text-sm text-txt-primary"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-[500px] overflow-y-auto">
                            {activeTab === 'employees' ? (
                                // Employee list
                                filteredEmployees.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400">Không tìm thấy nhân viên</div>
                                ) : (
                                    filteredEmployees.map(emp => (
                                        <button
                                            key={emp.EmployeeID}
                                            onClick={() => handleSelectEmployee(emp)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-left border-b border-slate-50 dark:border-slate-800 last:border-b-0"
                                        >
                                            <Avatar
                                                name={emp.FullName}
                                                imageUrl={emp.AvatarUrl}
                                                size="md"
                                                className="flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-txt-primary truncate">{emp.FullName}</p>
                                                <p className="text-xs text-txt-muted truncate">
                                                    {emp.Position || emp.Role}
                                                    {emp.Department && ` • ${emp.Department}`}
                                                </p>
                                            </div>
                                            {impersonatedUser?.EmployeeID === emp.EmployeeID && (
                                                <Check size={18} className="text-green-500 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))
                                )
                            ) : (
                                // Contractor list
                                filteredContractors.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400">Không tìm thấy nhà thầu</div>
                                ) : (
                                    filteredContractors.map(ctr => (
                                        <button
                                            key={ctr.id}
                                            onClick={() => handleSelectContractor(ctr)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left border-b border-slate-50 dark:border-slate-800 last:border-b-0"
                                        >
                                            <Avatar
                                                name={ctr.display_name}
                                                size="md"
                                                className="flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-txt-primary truncate">{ctr.display_name}</p>
                                                <p className="text-xs text-txt-muted truncate">
                                                    {ctr.contractor_name} • @{ctr.username}
                                                </p>
                                            </div>
                                            <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-[10px] font-bold shrink-0">
                                                Nhà thầu
                                            </span>
                                            {impersonatedUser?.EmployeeID === ctr.id && (
                                                <Check size={18} className="text-green-500 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Close dropdown when clicking outside */}
            {isDropdownOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                />
            )}

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm">
                <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">💡 Hướng dẫn:</p>
                <ol className="text-blue-600 dark:text-blue-300 space-y-1 text-xs list-decimal list-inside">
                    <li>Click vào dropdown để mở danh sách</li>
                    <li>Chuyển tab <strong>Nhân viên</strong> hoặc <strong>Nhà thầu</strong> để chọn loại tài khoản</li>
                    <li>Tìm kiếm theo tên, chức vụ, phòng ban hoặc đơn vị nhà thầu</li>
                    <li>Click chọn → Hệ thống sẽ thông báo xác nhận</li>
                    <li>Điều hướng qua các trang để xem quyền của họ</li>
                    <li>Click "Dừng giả làm" để quay về Admin</li>
                </ol>
            </div>
        </div>
    );
};

export default UserImpersonator;

