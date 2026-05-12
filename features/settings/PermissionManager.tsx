/**
 * PermissionManager — QLDA ĐDCN TP.HCM
 *
 * Admin UI for managing user permissions.
 * Pattern follows cic-erp-contract/components/settings/PermissionManager.tsx
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shield, Search, Save, RotateCcw, Users, ChevronDown, ChevronRight, Check, X, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PermissionService } from '../../services/PermissionService';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import {
    PermissionAction,
    PermissionResource,
    SystemRole,
    ALL_RESOURCES,
    CORE_ACTIONS,
    RESOURCE_LABELS,
    ACTION_LABELS,
    ROLE_LABELS,
    ROLE_COLORS,
    resolveSystemRole,
    DEFAULT_ROLE_PERMISSIONS,
    type UserPermission,
} from '../../types/permission.types';

interface EmployeeInfo {
    employeeId: string;
    fullName: string;
    department: string;
    position: string;
    role: string;
    systemRole: SystemRole;
}

const ALL_ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete', 'approve', 'export'];

const PermissionManager: React.FC = () => {
    const { can } = usePermissionCheck();
    const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
    const [allPermissions, setAllPermissions] = useState<UserPermission[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeInfo | null>(null);
    const [editedPermissions, setEditedPermissions] = useState<Record<string, PermissionAction[]>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDept, setFilterDept] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [expandedDept, setExpandedDept] = useState<string | null>(null);
    const [showDiff, setShowDiff] = useState(false);

    // Fetch employees on mount
    useEffect(() => {
        const load = async () => {
            try {
                const empRes = await supabase.from('employees').select('*').eq('status', 1).order('department').order('full_name');

                if (empRes.data) {
                    setEmployees(empRes.data.map((e: any) => ({
                        employeeId: e.employee_id,
                        fullName: e.full_name,
                        department: e.department || '',
                        position: e.position || '',
                        role: e.role,
                        systemRole: resolveSystemRole(e.role, e.position || ''),
                    })));
                }

                // Also try to fetch all permissions (for lookup)
                try {
                    const permRes = await PermissionService.getAll();
                    console.log('[PermManager] Loaded', permRes.length, 'permission rows from DB');
                    setAllPermissions(permRes);
                } catch (permErr) {
                    console.warn('[PermManager] getAll() failed (RLS?), will fetch per-user:', permErr);
                }
            } catch (err) {
                console.error('Failed to load employees:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Group employees by department
    const departments = useMemo(() => {
        const deptMap = new Map<string, EmployeeInfo[]>();
        employees.forEach(e => {
            const dept = e.department || 'Chưa phân';
            if (!deptMap.has(dept)) deptMap.set(dept, []);
            deptMap.get(dept)!.push(e);
        });
        return Array.from(deptMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [employees]);

    // Filter
    const filteredDepts = useMemo(() => {
        return departments.filter(([dept, emps]) => {
            if (filterDept && dept !== filterDept) return false;
            if (searchQuery) {
                return emps.some(e =>
                    e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    e.position.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
            return true;
        });
    }, [departments, filterDept, searchQuery]);

    // Select employee → fetch their permissions directly from DB
    const selectEmployee = useCallback(async (emp: EmployeeInfo) => {
        setSelectedEmployee(emp);
        const empPerms: Record<string, PermissionAction[]> = {};

        // Try cached data first
        const cached = allPermissions.filter(p => p.userId === emp.employeeId);

        if (cached.length > 0) {
            console.log(`[PermManager] Using ${cached.length} cached permissions for ${emp.fullName}`);
            cached.forEach(p => { empPerms[p.resource] = [...p.actions]; });
        } else {
            // Fetch directly from DB for this employee
            try {
                const dbPerms = await PermissionService.getByUserId(emp.employeeId);
                console.log(`[PermManager] Fetched ${dbPerms.length} permissions for ${emp.fullName} from DB:`, dbPerms);

                if (dbPerms.length > 0) {
                    dbPerms.forEach(p => { empPerms[p.resource] = [...p.actions]; });
                    // Update cache
                    setAllPermissions(prev => [
                        ...prev.filter(p => p.userId !== emp.employeeId),
                        ...dbPerms
                    ]);
                } else {
                    // Fallback: auto-apply role defaults
                    console.log(`[PermManager] No DB data, using defaults for role: ${emp.systemRole}`);
                    const defaults = DEFAULT_ROLE_PERMISSIONS[emp.systemRole];
                    if (defaults) {
                        Object.entries(defaults).forEach(([resource, actions]) => {
                            empPerms[resource] = [...((actions as PermissionAction[]) || [])];
                        });
                    }
                }
            } catch (err) {
                console.error('[PermManager] Failed to fetch user permissions:', err);
                // Fallback to defaults
                const defaults = DEFAULT_ROLE_PERMISSIONS[emp.systemRole];
                if (defaults) {
                    Object.entries(defaults).forEach(([resource, actions]) => {
                        empPerms[resource] = [...((actions as PermissionAction[]) || [])];
                    });
                }
            }
        }

        console.log(`[PermManager] Final permissions for ${emp.fullName}:`, empPerms);
        setEditedPermissions(empPerms);
    }, [allPermissions]);

    // Compute diff vs role defaults for the selected employee
    const permissionDiff = useMemo(() => {
        if (!selectedEmployee) return null;
        const defaults = DEFAULT_ROLE_PERMISSIONS[selectedEmployee.systemRole] || {};
        const diff: Record<string, { extra: PermissionAction[]; removed: PermissionAction[] }> = {};
        for (const resource of ALL_RESOURCES) {
            const defaultActions: PermissionAction[] = (defaults as any)[resource] || [];
            const currentActions: PermissionAction[] = editedPermissions[resource] || [];
            const extra = currentActions.filter(a => !defaultActions.includes(a));
            const removed = defaultActions.filter(a => !currentActions.includes(a));
            if (extra.length > 0 || removed.length > 0) {
                diff[resource] = { extra, removed };
            }
        }
        return diff;
    }, [selectedEmployee, editedPermissions]);

    const hasDiff = permissionDiff && Object.keys(permissionDiff).length > 0;

    // Toggle action
    const toggleAction = useCallback((resource: PermissionResource, action: PermissionAction) => {
        setEditedPermissions(prev => {
            const current = prev[resource] || [];
            const newActions = current.includes(action)
                ? current.filter(a => a !== action)
                : [...current, action];
            return { ...prev, [resource]: newActions };
        });
    }, []);

    // Reset to defaults
    const resetToDefaults = useCallback(() => {
        if (!selectedEmployee) return;
        const defaults = DEFAULT_ROLE_PERMISSIONS[selectedEmployee.systemRole];
        const newPerms: Record<string, PermissionAction[]> = {};
        if (defaults) {
            Object.entries(defaults).forEach(([resource, actions]) => {
                newPerms[resource] = [...((actions as PermissionAction[]) || [])];
            });
        }
        setEditedPermissions(newPerms);
    }, [selectedEmployee]);

    // Save
    const handleSave = useCallback(async () => {
        if (!selectedEmployee) return;
        // Permission guard: only admin_roles:update can save
        if (!can('admin_roles', 'update')) {
            alert('Bạn không có quyền thay đổi phân quyền hệ thống.');
            return;
        }
        setSaving(true);
        try {
            for (const resource of ALL_RESOURCES) {
                const actions = editedPermissions[resource] || [];
                await PermissionService.upsert(selectedEmployee.employeeId, resource, actions);
            }
            // Refresh all permissions
            const refreshed = await PermissionService.getAll();
            setAllPermissions(refreshed);
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setSaving(false);
        }
    }, [selectedEmployee, editedPermissions, can]);

    // Bulk apply defaults for employees that DON'T have DB records yet
    const applyDefaultsForAll = useCallback(async () => {
        // Permission guard
        if (!can('admin_roles', 'update')) {
            alert('Bạn không có quyền thực hiện thao tác này.');
            return;
        }
        if (!window.confirm('Khởi tạo quyền mặc định cho nhân viên CHƯA CÓ quyền trong DB?\n(Nhân viên đã có quyền sẽ KHÔNG bị ghi đè)')) return;
        setSaving(true);
        try {
            const users = employees.map(e => ({ id: e.employeeId, role: e.systemRole }));
            const count = await PermissionService.initializeAllUsers(users);
            // Refresh
            const refreshed = await PermissionService.getAll();
            setAllPermissions(refreshed);
            // Re-select current employee to refresh view
            if (selectedEmployee) {
                const empPerms: Record<string, PermissionAction[]> = {};
                refreshed
                    .filter(p => p.userId === selectedEmployee.employeeId)
                    .forEach(p => { empPerms[p.resource] = [...p.actions]; });
                setEditedPermissions(empPerms);
            }
            alert(`Đã khởi tạo quyền cho ${count}/${employees.length} nhân viên!`);
        } catch (err) {
            console.error('Bulk apply failed:', err);
            alert('Có lỗi xảy ra khi khởi tạo quyền');
        } finally {
            setSaving(false);
        }
    }, [employees, selectedEmployee]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Phân quyền</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Quản lý quyền truy cập hệ thống</p>
                    </div>
                </div>
                <button
                    onClick={applyDefaultsForAll}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                >
                    <Users className="w-4 h-4" />
                    Áp dụng mặc định cho tất cả
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Employee List */}
                <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-bg-subtle dark:bg-gray-900">
                    {/* Search */}
                    <div className="p-3 space-y-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm nhân sự..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-bg-surface dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <select
                            value={filterDept}
                            onChange={e => setFilterDept(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-bg-surface dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="">Tất cả phòng ban</option>
                            {departments.map(([dept]) => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    {/* Employee tree */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredDepts.map(([dept, emps]) => {
                            const filteredEmps = searchQuery
                                ? emps.filter(e =>
                                    e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    e.position.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                : emps;
                            if (filteredEmps.length === 0) return null;

                            const isExpanded = expandedDept === dept || !!searchQuery;

                            return (
                                <div key={dept}>
                                    <button
                                        onClick={() => setExpandedDept(prev => prev === dept ? null : dept)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        <span className="truncate">{dept}</span>
                                        <span className="ml-auto text-gray-400">{filteredEmps.length}</span>
                                    </button>
                                    {isExpanded && filteredEmps.map(emp => (
                                        <button
                                            key={emp.employeeId}
                                            onClick={() => selectEmployee(emp)}
                                            className={`w-full flex items-center gap-2 px-4 pl-8 py-2 text-sm transition-colors ${
                                                selectedEmployee?.employeeId === emp.employeeId
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            <div className="flex-1 text-left">
                                                <div className="font-medium truncate">{emp.fullName}</div>
                                                <div className="text-xs text-gray-400 truncate">{emp.position}</div>
                                            </div>
                                            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${ROLE_COLORS[emp.systemRole] || 'bg-gray-100 text-gray-600'}`}>
                                                {ROLE_LABELS[emp.systemRole]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Permission Matrix */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {!selectedEmployee ? (
                        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600">
                            <div className="text-center">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Chọn nhân sự để xem/sửa quyền</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Employee info + actions */}
                            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-bg-surface dark:bg-gray-800">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-bold text-gray-900 dark:text-white">{selectedEmployee.fullName}</h2>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${ROLE_COLORS[selectedEmployee.systemRole]}`}>
                                            {ROLE_LABELS[selectedEmployee.systemRole]}
                                        </span>
                                        {hasDiff && (
                                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                                ⚠️ Có {Object.keys(permissionDiff!).length} thay đổi
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {selectedEmployee.department} · {selectedEmployee.position}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {/* Diff toggle */}
                                    <button
                                        onClick={() => setShowDiff(prev => !prev)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                            showDiff
                                                ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300'
                                                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-bg-subtle dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        {showDiff ? 'Xem tất cả' : 'Xem chênh lệch'}
                                    </button>
                                    <button
                                        onClick={resetToDefaults}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-bg-subtle dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Reset mặc định
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-50 transition-colors"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        {saving ? 'Đang lưu...' : 'Lưu'}
                                    </button>
                                </div>
                            </div>

                            {/* Permission matrix table */}
                            <div className="flex-1 overflow-auto">
                                {/* Diff legend */}
                                {showDiff && hasDiff && (
                                    <div className="flex items-center gap-4 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 text-xs">
                                        <span className="font-semibold text-amber-700 dark:text-amber-400">Chênh lệch so với mặc định:</span>
                                        <span className="flex items-center gap-1 text-green-700 dark:text-green-400"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block"/>Được thêm</span>
                                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block"/>Bị bỏ</span>
                                    </div>
                                )}
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-bg-subtle z-10 shadow-sm border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest w-56 border-b border-slate-200 dark:border-slate-700">Chức năng</th>
                                            {ALL_ACTIONS.map(action => (
                                                <th key={action} className="text-center px-2 py-2.5 text-[10px] font-black uppercase tracking-widest w-16 border-b border-slate-200 dark:border-slate-700">
                                                    {ACTION_LABELS[action]}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ALL_RESOURCES
                                            .filter(resource => !showDiff || (permissionDiff && permissionDiff[resource]))
                                            .map((resource, idx) => {
                                            const hasPermission = editedPermissions[resource] || [];
                                            const diff = permissionDiff?.[resource];
                                            const rowHighlight = diff
                                                ? 'bg-amber-50/60 dark:bg-amber-900/10'
                                                : idx % 2 === 0 ? 'bg-bg-surface dark:bg-gray-800' : 'bg-bg-subtle dark:bg-gray-900/50';
                                            return (
                                                <tr
                                                    key={resource}
                                                    className={`border-t border-gray-100 dark:border-gray-800 ${rowHighlight}`}
                                                >
                                                    <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">
                                                        <span>{RESOURCE_LABELS[resource]}</span>
                                                        {diff && (
                                                            <span className="ml-2 text-[10px] text-amber-600 dark:text-amber-400">
                                                                {diff.extra.length > 0 && <span className="text-green-600 dark:text-green-400">+{diff.extra.map(a => ACTION_LABELS[a]).join(',')}</span>}
                                                                {diff.extra.length > 0 && diff.removed.length > 0 && ' '}
                                                                {diff.removed.length > 0 && <span className="text-red-500 dark:text-red-400">-{diff.removed.map(a => ACTION_LABELS[a]).join(',')}</span>}
                                                            </span>
                                                        )}
                                                    </td>
                                                    {ALL_ACTIONS.map(action => {
                                                        const isChecked = hasPermission.includes(action);
                                                        const isExtra = diff?.extra.includes(action);
                                                        const isRemoved = diff?.removed.includes(action);
                                                        return (
                                                            <td key={action} className="text-center px-2 py-2.5">
                                                                <button
                                                                    onClick={() => toggleAction(resource, action)}
                                                                    title={isExtra ? 'Quyền được thêm (không có trong mặc định)' : isRemoved ? 'Quyền bị bỏ (có trong mặc định)' : undefined}
                                                                    className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${
                                                                        isChecked
                                                                            ? isExtra
                                                                                ? 'bg-green-500 border-green-500 text-white shadow-sm'
                                                                                : 'bg-blue-500 border-blue-500 text-white shadow-sm'
                                                                            : isRemoved
                                                                                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                                                                                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                                                                    }`}
                                                                >
                                                                    {isChecked && <Check className="w-3.5 h-3.5" />}
                                                                </button>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PermissionManager;
