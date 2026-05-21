/**
 * PermissionManager — QLDA ĐDCN TP.HCM
 *
 * Admin UI for managing user permissions.
 * Pattern follows cic-erp-contract/components/settings/PermissionManager.tsx
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { Shield, Search, Save, RotateCcw, Users, ChevronDown, ChevronRight, Check, X, AlertCircle, TrendingUp, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PermissionService } from '../../services/PermissionService';
import EmployeeService from '../../services/EmployeeService';
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
    const { addToast } = useToast();
    const { can } = usePermissionCheck();
    const { currentUser } = useAuth();
    const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
    const [allPermissions, setAllPermissions] = useState<UserPermission[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeInfo | null>(null);
    const [editedPermissions, setEditedPermissions] = useState<Record<string, PermissionAction[]>>({});
    const [currentRoleDefaults, setCurrentRoleDefaults] = useState<Record<string, PermissionAction[]>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDept, setFilterDept] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [expandedDept, setExpandedDept] = useState<string | null>(null);
    const [showDiff, setShowDiff] = useState(false);
    
    // Copy mode state
    const [isCopyMode, setIsCopyMode] = useState(false);
    const [copySourceEmployee, setCopySourceEmployee] = useState<EmployeeInfo | null>(null);

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
                        systemRole: e.system_role ? (e.system_role as SystemRole) : resolveSystemRole(e.role, e.position || ''),
                    })));
                }

                // Also try to fetch all permissions (for lookup)
                try {
                    const permRes = await PermissionService.getAll();

                    setAllPermissions(permRes);
                } catch (permErr) {
                    console.warn('[PermManager] getAll() failed (RLS?), will fetch per-user:', permErr);
                }
            } catch (err) {
                console.error('Failed to load employees:', err);
                addToast({ title: 'Lỗi', message: 'Lỗi khi tải danh sách nhân sự', type: 'error' });
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
        if (isCopyMode && copySourceEmployee) {
            // Apply copied permissions to the selected employee
            if (window.confirm(`Ghi đè quyền của ${emp.fullName} bằng quyền của ${copySourceEmployee.fullName}?`)) {
                setSelectedEmployee(emp);
                // Keep editedPermissions from source
                setIsCopyMode(false);
                setCopySourceEmployee(null);
                addToast({ title: 'Thành công', message: `Đã dán quyền của ${copySourceEmployee.fullName}. Nhấn Lưu để áp dụng.`, type: 'success' });
            } else {
                setIsCopyMode(false);
                setCopySourceEmployee(null);
            }
            return;
        }

        setSelectedEmployee(emp);
        const empPerms: Record<string, PermissionAction[]> = {};

        // Fetch role defaults for this employee
        const roleDefaults = await PermissionService.getDefaultPermissions(emp.systemRole);
        setCurrentRoleDefaults(roleDefaults as Record<string, PermissionAction[]>);

        // Try cached data first
        const cached = allPermissions.filter(p => p.userId === emp.employeeId);

        if (cached.length > 0) {

            cached.forEach(p => { empPerms[p.resource] = [...p.actions]; });
        } else {
            // Fetch directly from DB for this employee
            try {
                const dbPerms = await PermissionService.getByUserId(emp.employeeId);


                if (dbPerms.length > 0) {
                    dbPerms.forEach(p => { empPerms[p.resource] = [...p.actions]; });
                    // Update cache
                    setAllPermissions(prev => [
                        ...prev.filter(p => p.userId !== emp.employeeId),
                        ...dbPerms
                    ]);
                } else {
                    // Fallback: auto-apply role defaults

                    Object.entries(roleDefaults).forEach(([resource, actions]) => {
                        empPerms[resource] = [...((actions as PermissionAction[]) || [])];
                    });
                }
            } catch (err) {
                console.error('[PermManager] Failed to fetch user permissions:', err);
                // Fallback to defaults
                Object.entries(roleDefaults).forEach(([resource, actions]) => {
                    empPerms[resource] = [...((actions as PermissionAction[]) || [])];
                });
            }
        }


        setEditedPermissions(empPerms);
    }, [allPermissions, isCopyMode, copySourceEmployee]);

    // Auto-select first employee
    useEffect(() => {
        if (!loading && employees.length > 0 && !selectedEmployee) {
            setExpandedDept(employees[0].department || 'Chưa phân');
            selectEmployee(employees[0]);
        }
    }, [loading, employees, selectedEmployee, selectEmployee]);

    // Compute diff vs role defaults for the selected employee
    const permissionDiff = useMemo(() => {
        if (!selectedEmployee) return null;
        const diff: Record<string, { extra: PermissionAction[]; removed: PermissionAction[] }> = {};
        for (const resource of ALL_RESOURCES) {
            const defaultActions: PermissionAction[] = currentRoleDefaults[resource] || [];
            const currentActions: PermissionAction[] = editedPermissions[resource] || [];
            const extra = currentActions.filter(a => !defaultActions.includes(a));
            const removed = defaultActions.filter(a => !currentActions.includes(a));
            if (extra.length > 0 || removed.length > 0) {
                diff[resource] = { extra, removed };
            }
        }
        return diff;
    }, [selectedEmployee, editedPermissions, currentRoleDefaults]);

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
        if (window.confirm(`Reset phân quyền của ${selectedEmployee.fullName} về mặc định theo chức danh?`)) {
            const empPerms: Record<string, PermissionAction[]> = {};
            Object.entries(currentRoleDefaults).forEach(([resource, actions]) => {
                empPerms[resource] = [...((actions as PermissionAction[]) || [])];
            });
            setEditedPermissions(empPerms);
            addToast({ title: 'Thành công', message: `Đã reset phân quyền về mặc định. Nhấn Lưu để áp dụng.`, type: 'success' });
        }
    }, [selectedEmployee, currentRoleDefaults]);

    // Save
    const handleSave = useCallback(async () => {
        if (!selectedEmployee) return;
        // Permission guard: only admin_roles:update can save
        if (!can('admin_roles', 'update')) {
            addToast({ title: 'Lỗi', message: 'Bạn không có quyền thay đổi phân quyền hệ thống.', type: 'error' });
            return;
        }
        setSaving(true);
        try {
            for (const resource of ALL_RESOURCES) {
                const actions = editedPermissions[resource] || [];
                await PermissionService.upsert(selectedEmployee.employeeId, resource, actions, currentUser?.EmployeeID);
            }
            // Refresh all permissions
            const refreshed = await PermissionService.getAll();
            setAllPermissions(refreshed);
            addToast({ title: 'Thành công', message: `Đã lưu quyền cho ${selectedEmployee.fullName}`, type: 'success' });
        } catch (err) {
            console.error('Save failed:', err);
            addToast({ title: 'Lỗi', message: 'Có lỗi xảy ra khi lưu quyền', type: 'error' });
        } finally {
            setSaving(false);
        }
    }, [selectedEmployee, editedPermissions, can, currentUser]);

    // Bulk apply defaults for employees that DON'T have DB records yet
    const applyDefaultsForAll = useCallback(async () => {
        // Permission guard
        if (!can('admin_roles', 'update')) {
            addToast({ title: 'Lỗi', message: 'Bạn không có quyền thực hiện thao tác này.', type: 'error' });
            return;
        }
        const confirmMsg = filterDept 
            ? `Khởi tạo quyền mặc định cho nhân viên thuộc phòng "${filterDept}" CHƯA CÓ quyền trong DB?\n(Nhân viên đã có quyền sẽ KHÔNG bị ghi đè)`
            : 'Khởi tạo quyền mặc định cho TẤT CẢ nhân viên CHƯA CÓ quyền trong DB?\n(Nhân viên đã có quyền sẽ KHÔNG bị ghi đè)';
        
        if (!window.confirm(confirmMsg)) return;
        
        setSaving(true);
        try {
            const targetEmployees = filterDept ? employees.filter(e => e.department === filterDept) : employees;
            const users = targetEmployees.map(e => ({ id: e.employeeId, role: e.systemRole }));
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
            addToast({ title: 'Thành công', message: `Đã khởi tạo quyền cho ${count}/${targetEmployees.length} nhân viên!`, type: 'success' });
        } catch (err) {
            console.error('Bulk apply failed:', err);
            addToast({ title: 'Lỗi', message: 'Có lỗi xảy ra khi khởi tạo quyền', type: 'error' });
        } finally {
            setSaving(false);
        }
    }, [employees, selectedEmployee, filterDept, can]);

    const handleStartCopy = () => {
        if (!selectedEmployee) return;
        setCopySourceEmployee(selectedEmployee);
        setIsCopyMode(true);
        addToast({ title: 'Thông báo', message: 'Chọn nhân viên khác ở danh sách bên trái để dán quyền.', type: 'info' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm nhân sự..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-shadow shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterDept}
                        onChange={e => setFilterDept(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    >
                        <option value="">Tất cả phòng ban</option>
                        {departments.map(([dept]) => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    <button
                        onClick={applyDefaultsForAll}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 shadow-sm border border-slate-200 dark:border-slate-600"
                    >
                        <Users className="w-4 h-4" />
                        {filterDept ? 'Áp dụng cho phòng này' : 'Áp dụng mặc định tất cả'}
                    </button>
                </div>
            </div>

            {isCopyMode && copySourceEmployee && (
                <div className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 text-blue-800 dark:text-blue-300">
                        <Copy className="w-5 h-5" />
                        <div>
                            <span className="font-semibold">Chế độ sao chép quyền:</span> Đang copy quyền của <strong>{copySourceEmployee.fullName}</strong>.
                            Hãy chọn một nhân sự bên trái để dán.
                        </div>
                    </div>
                    <button 
                        onClick={() => { setIsCopyMode(false); setCopySourceEmployee(null); }}
                        className="px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-lg transition-colors"
                    >
                        Hủy bỏ
                    </button>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex-1 flex min-h-0">
                {/* Left: Employee List */}
                <div className="w-80 border-r border-slate-100 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-slate-800">
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
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hover:bg-slate-100 dark:hover:bg-slate-700"
                                    >
                                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        <span className="truncate">{dept}</span>
                                        <span className="ml-auto text-slate-400">{filteredEmps.length}</span>
                                    </button>
                                    {isExpanded && filteredEmps.map(emp => (
                                        <button
                                            key={emp.employeeId}
                                            onClick={() => selectEmployee(emp)}
                                            className={`w-full flex items-center gap-2 px-4 pl-8 py-2 text-sm transition-colors ${
                                                selectedEmployee?.employeeId === emp.employeeId
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <div className="flex-1 text-left">
                                                <div className="font-medium truncate">{emp.fullName}</div>
                                                <div className="text-xs text-slate-400 truncate">{emp.position}</div>
                                            </div>
                                            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${ROLE_COLORS[emp.systemRole] || 'bg-slate-100 text-slate-600'}`}>
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
                <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
                    {!selectedEmployee ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
                            <div className="text-center">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Chọn nhân sự ở danh sách bên trái để xem/sửa quyền</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Employee info + actions */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-bold text-slate-900 dark:text-white">{selectedEmployee.fullName}</h2>
                                        <select
                                            value={selectedEmployee.systemRole}
                                            onChange={async (e) => {
                                                const newRole = e.target.value as SystemRole;
                                                try {
                                                    await EmployeeService.updateSystemRole(selectedEmployee.employeeId, newRole);
                                                    
                                                    // Update local state
                                                    setSelectedEmployee(prev => prev ? { ...prev, systemRole: newRole } : null);
                                                    setEmployees(prev => prev.map(emp => 
                                                        emp.employeeId === selectedEmployee.employeeId 
                                                            ? { ...emp, systemRole: newRole }
                                                            : emp
                                                    ));
                                                    
                                                    addToast({ title: 'Thành công', message: 'Đã cập nhật vai trò hệ thống', type: 'success' });
                                                    
                                                    // Trigger a reload of permissions based on the new role defaults if needed
                                                    // Actually it automatically recalculates diffs because selectedEmployee.systemRole changed
                                                } catch (err) {
                                                    console.error('Update system role failed:', err);
                                                    addToast({ title: 'Lỗi', message: 'Không thể cập nhật vai trò hệ thống', type: 'error' });
                                                }
                                            }}
                                            className={`px-2 py-0.5 text-xs font-medium rounded border-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none ${ROLE_COLORS[selectedEmployee.systemRole]}`}
                                        >
                                            {Object.entries(ROLE_LABELS).map(([roleVal, label]) => (
                                                <option key={roleVal} value={roleVal} className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                        {hasDiff && (
                                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-300">
                                                ⚠️ Có {Object.keys(permissionDiff!).length} thay đổi
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {selectedEmployee.department} · {selectedEmployee.position}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {/* Diff toggle */}
                                    <button
                                        onClick={() => setShowDiff(prev => !prev)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                            showDiff
                                                ? 'bg-warning-50 dark:bg-warning-900/30 border-warning-300 dark:border-warning-600 text-warning-700 dark:text-warning-300'
                                                : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        {showDiff ? 'Xem tất cả' : 'Xem chênh lệch'}
                                    </button>
                                    <button
                                        onClick={handleStartCopy}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                            isCopyMode
                                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                                            : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        Sao chép
                                    </button>
                                    <button
                                        onClick={resetToDefaults}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Reset mặc định
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-50 transition-colors shadow-sm"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        {saving ? 'Đang lưu...' : 'Lưu'}
                                    </button>
                                </div>
                            </div>

                            {/* Permission matrix table */}
                            <div className="flex-1 overflow-auto relative">
                                {/* Diff legend */}
                                {showDiff && hasDiff && (
                                    <div className="flex items-center gap-4 px-4 py-2 bg-warning-50 dark:bg-warning-900/20 border-b border-warning-200 dark:border-warning-800 text-xs">
                                        <span className="font-semibold text-warning-700 dark:text-warning-400">Chênh lệch so với mặc định:</span>
                                        <span className="flex items-center gap-1 text-green-700 dark:text-green-400"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block"/>Được thêm</span>
                                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block"/>Bị bỏ</span>
                                    </div>
                                )}
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                                        <tr className="text-slate-500 dark:text-slate-400">
                                            <th className="text-left px-6 py-3 w-56 border-b border-slate-200 dark:border-slate-700">Chức năng</th>
                                            {ALL_ACTIONS.map(action => (
                                                <th key={action} className="text-center px-2 py-3 w-16 border-b border-slate-200 dark:border-slate-700">
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
                                                ? 'bg-warning-50/60 dark:bg-warning-900/10'
                                                : idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-900/30';
                                            return (
                                                <tr
                                                    key={resource}
                                                    className={`border-b border-slate-100 dark:border-slate-700/50 ${rowHighlight} hover:bg-slate-50/80 dark:hover:bg-slate-700 transition-colors`}
                                                >
                                                    <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">
                                                        <span>{RESOURCE_LABELS[resource]}</span>
                                                        {diff && (
                                                            <span className="ml-2 text-[10px] text-warning-600 dark:text-warning-400">
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
                                                                                : 'border-slate-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-500'
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
