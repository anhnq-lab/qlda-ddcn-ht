import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Shield, Check, X, Loader2, Users, Save, RefreshCw,
    AlertTriangle, ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PermissionService } from '../../services/PermissionService';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import {
    PermissionAction,
    PermissionResource,
    SystemRole,
    ALL_RESOURCES,
    ALL_ROLES,
    RESOURCE_LABELS,
    ACTION_LABELS,
    ROLE_LABELS,
    ROLE_COLORS,
    DEFAULT_ROLE_PERMISSIONS
} from '../../types/permission.types';

// Các Action hiện có (Tất cả)
const ALL_ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete', 'approve', 'export'];

const RoleDefaultsManager: React.FC = () => {
    const { can } = usePermissionCheck();
    
    // Auth guard
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const getSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session?.user) {
                // In our system, employee_id is usually mapped from user auth. We just need it for Audit log if we want.
                setUserId(data.session.user.id);
            }
        };
        getSession();
    }, []);

    const [selectedRole, setSelectedRole] = useState<SystemRole>('specialist');
    const [rolePerms, setRolePerms] = useState<Record<SystemRole, Record<PermissionResource, PermissionAction[]>>>(() => {
        // Initialize from hardcode defaults first
        const initial: any = {};
        ALL_ROLES.forEach(role => {
            initial[role] = {} as any;
            ALL_RESOURCES.forEach(resource => {
                initial[role][resource] = [...(DEFAULT_ROLE_PERMISSIONS[role]?.[resource] || [])];
            });
        });
        return initial;
    });
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [showApplyConfirm, setShowApplyConfirm] = useState(false);

    // ─── Load from DB on mount ───────────────────────────
    useEffect(() => {
        const loadFromDB = async () => {
            try {
                const { data, error } = await supabase
                    .from('role_permission_defaults')
                    .select('role, resource, actions');

                if (error) {
                    console.warn('[RoleDefaults] Table might not exist yet:', error.message);
                    return;
                }

                if (data && data.length > 0) {
                    setRolePerms(prev => {
                        const merged = { ...prev };
                        data.forEach(row => {
                            const role = row.role as SystemRole;
                            const resource = row.resource as PermissionResource;
                            if (merged[role]) {
                                merged[role] = { ...merged[role], [resource]: row.actions || [] };
                            }
                        });
                        return merged;
                    });
                }
            } catch (err) {
                console.warn('[RoleDefaults] DB fallback to hardcode', err);
            } finally {
                setLoading(false);
            }
        };
        loadFromDB();
    }, []);

    const currentPerms = rolePerms[selectedRole];

    // ─── Toggle a permission ────────────────────────────
    const handleToggle = useCallback((resource: PermissionResource, action: PermissionAction) => {
        setRolePerms(prev => {
            const current = prev[selectedRole][resource] || [];
            const newActions = current.includes(action)
                ? current.filter(a => a !== action)
                : [...current, action];
            return {
                ...prev,
                [selectedRole]: {
                    ...prev[selectedRole],
                    [resource]: newActions,
                }
            };
        });
        setHasChanges(true);
    }, [selectedRole]);

    // ─── Toggle all actions for a resource ──────────────
    const handleToggleRow = useCallback((resource: PermissionResource) => {
        setRolePerms(prev => {
            const current = prev[selectedRole][resource] || [];
            const allEnabled = ALL_ACTIONS.every(a => current.includes(a));
            return {
                ...prev,
                [selectedRole]: {
                    ...prev[selectedRole],
                    [resource]: allEnabled ? [] : [...ALL_ACTIONS],
                }
            };
        });
        setHasChanges(true);
    }, [selectedRole]);

    // ─── Toggle all resources for an action ─────────────
    const handleToggleColumn = useCallback((action: PermissionAction) => {
        setRolePerms(prev => {
            const allEnabled = ALL_RESOURCES.every(r => (prev[selectedRole][r] || []).includes(action));
            const updated = { ...prev[selectedRole] };
            ALL_RESOURCES.forEach(resource => {
                const current = updated[resource] || [];
                if (allEnabled) {
                    updated[resource] = current.filter(a => a !== action);
                } else if (!current.includes(action)) {
                    updated[resource] = [...current, action];
                }
            });
            return { ...prev, [selectedRole]: updated };
        });
        setHasChanges(true);
    }, [selectedRole]);

    // ─── Save to DB (persistent) ────────
    const handleSave = useCallback(async () => {
        if (!can('admin_roles', 'update')) {
            alert('Bạn không có quyền sửa ma trận phân quyền');
            return;
        }

        setSaving(true);
        try {
            // Prepare upsert rows for all roles
            const rows = ALL_ROLES.flatMap(role =>
                ALL_RESOURCES.map(resource => ({
                    role,
                    resource,
                    actions: rolePerms[role][resource] || [],
                    updated_at: new Date().toISOString(),
                }))
            );

            const { error } = await supabase
                .from('role_permission_defaults')
                .upsert(rows, { onConflict: 'role,resource' });

            if (error) throw error;

            setHasChanges(false);
            alert('Đã lưu ma trận quyền mặc định vào cơ sở dữ liệu!');
        } catch (err: any) {
            console.error('Error saving role defaults:', err);
            alert('Lỗi khi lưu: ' + err.message);
        } finally {
            setSaving(false);
        }
    }, [rolePerms, can]);

    // ─── Apply defaults to all users with this role ─────
    const handleApplyToAll = useCallback(async () => {
        if (!can('admin_roles', 'update')) return;

        setApplying(true);
        try {
            // Lấy tất cả nhân viên có SystemRole tương ứng
            // Lưu ý: Trong hệ thống hiện tại, "role" trong bảng employees là Legacy Role. 
            // Cần query tất cả nhân viên và lọc ra những người có SystemRole tương ứng (sử dụng resolveSystemRole)
            const { data: employees, error: empError } = await supabase
                .from('employees')
                .select('employee_id, full_name, role, position')
                .eq('status', 1);

            if (empError) throw empError;

            // Optional: Import resolveSystemRole from types if needed.
            // Since we know mapping, we can filter them here:
            // But we already have resolveSystemRole from permission.types
            const { resolveSystemRole } = await import('../../types/permission.types');
            const targetEmployees = employees?.filter(emp => resolveSystemRole(emp.role, emp.position || '') === selectedRole) || [];

            if (targetEmployees.length === 0) {
                alert(`Không có nhân viên nào đang giữ vai trò: ${ROLE_LABELS[selectedRole]}`);
                setApplying(false);
                setShowApplyConfirm(false);
                return;
            }

            // Upsert permissions for each employee
            let successCount = 0;
            for (const emp of targetEmployees) {
                try {
                    // For each resource, set to the default matrix we defined
                    for (const resource of ALL_RESOURCES) {
                        const actions = rolePerms[selectedRole][resource] || [];
                        await PermissionService.upsert(emp.employee_id, resource, actions);
                    }
                    successCount++;
                } catch (err) {
                    console.error(`Failed to init perms for ${emp.employee_id}:`, err);
                }
            }

            alert(`Đã áp dụng thành công quyền mặc định cho ${successCount}/${targetEmployees.length} nhân viên (${ROLE_LABELS[selectedRole]}).`);
        } catch (err: any) {
            console.error('Error applying defaults:', err);
            alert('Lỗi khi áp dụng: ' + err.message);
        }
        setApplying(false);
        setShowApplyConfirm(false);
    }, [selectedRole, rolePerms, can]);

    // ─── Count permissions per role ─────────────────────
    const permCount = useMemo(() => {
        const counts: Record<SystemRole, number> = {} as any;
        ALL_ROLES.forEach(role => {
            counts[role] = ALL_RESOURCES.reduce((sum, r) => sum + (rolePerms[role][r]?.length || 0), 0);
        });
        return counts;
    }, [rolePerms]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ─── Role Tabs ─── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {ALL_ROLES.map(role => {
                    const isActive = selectedRole === role;
                    // Lấy string style (bg-red-100 text-red-700...)
                    const colorClasses = ROLE_COLORS[role] || 'bg-slate-100 text-slate-700';
                    return (
                        <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${isActive
                                ? 'border-primary-500 bg-primary-50/50 shadow-sm dark:bg-primary-900/20 dark:border-primary-500'
                                : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 bg-white dark:bg-slate-900'
                                }`}
                        >
                            <Shield size={16} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'} />
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate">{ROLE_LABELS[role]}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">{permCount[role]} quyền</p>
                            </div>
                            {isActive && <ChevronRight size={14} className="text-primary-500 opacity-60" />}
                        </button>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                {/* ─── Selected Role Header ─── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            Ma trận quyền mặc định:
                        </h4>
                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${ROLE_COLORS[selectedRole]}`}>
                            {ROLE_LABELS[selectedRole]}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasChanges && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60 rounded-lg transition-colors shadow-sm"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {saving ? 'Đang lưu...' : 'Lưu vào DB'}
                            </button>
                        )}

                        <button
                            onClick={() => setShowApplyConfirm(true)}
                            disabled={applying || hasChanges}
                            title={hasChanges ? 'Hãy lưu thay đổi trước' : ''}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw size={14} />
                            Đồng bộ cho tất cả
                        </button>
                    </div>
                </div>

                {/* ─── Permission Matrix ─── */}
                <div className="overflow-auto relative">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                            <tr className="text-slate-500 dark:text-slate-400">
                                <th className="text-left px-6 py-3 w-56 border-b border-slate-200 dark:border-slate-700">
                                    Phân hệ
                                </th>
                                {ALL_ACTIONS.map(action => (
                                    <th key={action} className="text-center px-2 py-3 w-16 border-b border-slate-200 dark:border-slate-700">
                                        <button
                                            onClick={() => handleToggleColumn(action)}
                                            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                            title={`Toggle tất cả ${ACTION_LABELS[action]}`}
                                        >
                                            {ACTION_LABELS[action]}
                                        </button>
                                    </th>
                                ))}
                                <th className="text-center px-2 py-3 w-16 border-b border-slate-200 dark:border-slate-700">
                                    Tất cả
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {ALL_RESOURCES.map((resource, idx) => {
                                const actions = currentPerms[resource] || [];
                                const allEnabled = ALL_ACTIONS.every(a => actions.includes(a));
                                return (
                                    <tr
                                        key={resource}
                                        className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/80 dark:hover:bg-slate-700 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800'
                                            }`}
                                    >
                                        <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-300">
                                            {RESOURCE_LABELS[resource]}
                                        </td>
                                        {ALL_ACTIONS.map(action => {
                                            const hasAction = actions.includes(action);
                                            return (
                                                <td key={action} className="text-center px-2 py-2.5">
                                                    <button
                                                        onClick={() => handleToggle(resource, action)}
                                                        className={`w-7 h-7 mx-auto rounded-md border-2 flex items-center justify-center transition-all ${hasAction
                                                            ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                                                            : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-primary-300 dark:hover:border-primary-500 text-transparent hover:text-primary-300'
                                                            }`}
                                                    >
                                                        {hasAction ? <Check className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                        <td className="text-center px-2 py-2.5">
                                            <button
                                                onClick={() => handleToggleRow(resource)}
                                                className={`w-7 h-7 mx-auto rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${allEnabled
                                                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                                                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                    }`}
                                                title={allEnabled ? 'Bỏ tất cả' : 'Chọn tất cả'}
                                            >
                                                {allEnabled ? '✓' : '—'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── Apply Confirm Dialog ─── */}
            {showApplyConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-12 h-12 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-6 h-6 text-warning-600 dark:text-warning-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                    Đồng bộ quyền mặc định?
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Thao tác này sẽ áp dụng Ma trận quyền hiện tại cho <strong>TẤT CẢ</strong> nhân viên đang có vai trò{' '}
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">"{ROLE_LABELS[selectedRole]}"</span>.
                                </p>
                            </div>
                        </div>

                        <div className="bg-warning-50 dark:bg-warning-900/10 p-4 rounded-xl border border-warning-200 dark:border-warning-800 mb-6">
                            <p className="text-sm text-warning-800 dark:text-warning-300">
                                ⚠️ Cảnh báo: Mọi quyền đã tinh chỉnh riêng lẻ cho từng nhân viên thuộc nhóm này sẽ bị <strong>ghi đè hoàn toàn</strong>. Hành động này không thể hoàn tác.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowApplyConfirm(false)}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleApplyToAll}
                                disabled={applying}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-warning-600 hover:bg-warning-700 disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm shadow-warning-600/20"
                            >
                                {applying ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                {applying ? 'Đang xử lý...' : 'Xác nhận đồng bộ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleDefaultsManager;
