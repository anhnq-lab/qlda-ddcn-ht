/**
 * DepartmentRuleManager — Lớp 2 phân quyền
 *
 * Quản trị viên cấu hình "giới hạn theo phòng ban": với một (resource, action),
 * chỉ nhân sự thuộc các phòng được chọn mới được thực hiện (vai trò lãnh đạo bypass).
 * Ghi vào bảng `department_permission_rules`; engine `can()` (client) và
 * `has_permission()` (RLS DB) đọc bảng này.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Building2, Plus, Trash2, Save, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { clearDeptRulesCache } from '../../context/PermissionContext';
import { permissionCache } from '../../utils/permissionCache';
import {
    ALL_RESOURCES,
    RESOURCE_LABELS,
    ACTION_LABELS,
    type PermissionResource,
    type PermissionAction,
} from '../../types/permission.types';

const EDITABLE_ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete', 'export'];

interface DeptRule {
    resource: PermissionResource;
    action: PermissionAction;
    allowed_departments: string[];
    note?: string | null;
}

const DepartmentRuleManager: React.FC = () => {
    const { addToast } = useToast();
    const { can, refresh } = usePermissionCheck();
    const [rules, setRules] = useState<DeptRule[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form thêm rule mới
    const [newResource, setNewResource] = useState<PermissionResource>('projects');
    const [newAction, setNewAction] = useState<PermissionAction>('create');
    const [newDepts, setNewDepts] = useState<string[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [ruleRes, empRes] = await Promise.all([
                (supabase as any).from('department_permission_rules').select('resource, action, allowed_departments, note'),
                supabase.from('employees').select('department').eq('status', 1),
            ]);
            if (ruleRes.data) setRules(ruleRes.data as DeptRule[]);
            if (empRes.data) {
                const set = new Set<string>();
                (empRes.data as any[]).forEach(e => { if (e.department) set.add(e.department); });
                setDepartments(Array.from(set).sort((a, b) => a.localeCompare(b)));
            }
        } catch (err) {
            console.error('[DeptRuleManager] load failed:', err);
            addToast({ title: 'Lỗi', message: 'Không tải được cấu hình giới hạn phòng ban', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { load(); }, [load]);

    const invalidateAndRefresh = useCallback(async () => {
        clearDeptRulesCache();
        permissionCache.invalidateAll();
        await refresh();
    }, [refresh]);

    const toggleDept = (list: string[], dept: string): string[] =>
        list.includes(dept) ? list.filter(d => d !== dept) : [...list, dept];

    // Cập nhật phòng cho một rule đã có
    const updateRuleDepts = useCallback(async (rule: DeptRule, depts: string[]) => {
        if (!can('admin_roles', 'update')) {
            addToast({ title: 'Lỗi', message: 'Bạn không có quyền sửa phân quyền.', type: 'error' });
            return;
        }
        setSaving(true);
        try {
            const { error } = await (supabase as any)
                .from('department_permission_rules')
                .update({ allowed_departments: depts, updated_at: new Date().toISOString() })
                .eq('resource', rule.resource).eq('action', rule.action);
            if (error) throw error;
            setRules(prev => prev.map(r => r.resource === rule.resource && r.action === rule.action ? { ...r, allowed_departments: depts } : r));
            await invalidateAndRefresh();
            addToast({ title: 'Đã lưu', message: `Cập nhật giới hạn ${RESOURCE_LABELS[rule.resource]} · ${ACTION_LABELS[rule.action]}`, type: 'success' });
        } catch (err: any) {
            addToast({ title: 'Lỗi', message: err.message || 'Lưu thất bại', type: 'error' });
        } finally {
            setSaving(false);
        }
    }, [can, addToast, invalidateAndRefresh]);

    const addRule = useCallback(async () => {
        if (!can('admin_roles', 'update')) {
            addToast({ title: 'Lỗi', message: 'Bạn không có quyền sửa phân quyền.', type: 'error' });
            return;
        }
        if (rules.some(r => r.resource === newResource && r.action === newAction)) {
            addToast({ title: 'Trùng', message: 'Đã có rule cho cặp phân hệ/hành động này. Sửa trực tiếp ở bảng.', type: 'warning' });
            return;
        }
        if (newDepts.length === 0) {
            addToast({ title: 'Thiếu phòng', message: 'Chọn ít nhất 1 phòng được phép.', type: 'warning' });
            return;
        }
        setSaving(true);
        try {
            const { error } = await (supabase as any).from('department_permission_rules').insert({
                resource: newResource, action: newAction, allowed_departments: newDepts,
            });
            if (error) throw error;
            setRules(prev => [...prev, { resource: newResource, action: newAction, allowed_departments: newDepts }]);
            setNewDepts([]);
            await invalidateAndRefresh();
            addToast({ title: 'Đã thêm', message: 'Đã thêm giới hạn phòng ban', type: 'success' });
        } catch (err: any) {
            addToast({ title: 'Lỗi', message: err.message || 'Thêm thất bại', type: 'error' });
        } finally {
            setSaving(false);
        }
    }, [can, addToast, rules, newResource, newAction, newDepts, invalidateAndRefresh]);

    const deleteRule = useCallback(async (rule: DeptRule) => {
        if (!can('admin_roles', 'update')) return;
        if (!window.confirm(`Xóa giới hạn cho ${RESOURCE_LABELS[rule.resource]} · ${ACTION_LABELS[rule.action]}? (Sau khi xóa, hành động này không còn bị giới hạn theo phòng)`)) return;
        setSaving(true);
        try {
            const { error } = await (supabase as any)
                .from('department_permission_rules')
                .delete().eq('resource', rule.resource).eq('action', rule.action);
            if (error) throw error;
            setRules(prev => prev.filter(r => !(r.resource === rule.resource && r.action === rule.action)));
            await invalidateAndRefresh();
            addToast({ title: 'Đã xóa', message: 'Đã gỡ giới hạn phòng ban', type: 'success' });
        } catch (err: any) {
            addToast({ title: 'Lỗi', message: err.message || 'Xóa thất bại', type: 'error' });
        } finally {
            setSaving(false);
        }
    }, [can, addToast, invalidateAndRefresh]);

    const canEdit = can('admin_roles', 'update');

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Giải thích */}
            <div className="flex items-start gap-3 px-4 py-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-0.5">Giới hạn quyền theo phòng ban (Lớp 2)</p>
                    <p className="text-xs text-blue-700/90 dark:text-blue-300/80">
                        Với mỗi <strong>phân hệ · hành động</strong> có rule: chỉ nhân sự thuộc các phòng được chọn mới được thực hiện
                        (Giám đốc, Phó GĐ, Kế toán trưởng được <strong>miễn</strong> giới hạn này). Nếu một hành động không có rule ở đây
                        thì áp dụng theo <strong>Ma trận quyền</strong> như bình thường.
                    </p>
                </div>
            </div>

            {/* Bảng rule hiện có */}
            <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border-subtle flex items-center gap-2 bg-bg-subtle/50">
                    <Building2 className="w-4 h-4 text-primary-500" />
                    <h4 className="text-sm font-bold text-txt-primary">Các giới hạn đang áp dụng ({rules.length})</h4>
                </div>
                {rules.length === 0 ? (
                    <div className="p-8 text-center text-txt-muted text-sm">Chưa có giới hạn nào. Mọi quyền theo Ma trận vai trò.</div>
                ) : (
                    <div className="divide-y divide-border-subtle">
                        {rules.map(rule => (
                            <div key={`${rule.resource}.${rule.action}`} className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                            {RESOURCE_LABELS[rule.resource] || rule.resource}
                                        </span>
                                        <span className="text-txt-muted text-xs">·</span>
                                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                            {ACTION_LABELS[rule.action] || rule.action}
                                        </span>
                                    </div>
                                    {canEdit && (
                                        <button onClick={() => deleteRule(rule)} disabled={saving}
                                            className="p-1.5 text-txt-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-[11px] text-txt-muted mb-2">Chỉ các phòng sau được phép:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {departments.map(dept => {
                                        const active = rule.allowed_departments.includes(dept);
                                        return (
                                            <button key={dept} disabled={!canEdit || saving}
                                                onClick={() => updateRuleDepts(rule, toggleDept(rule.allowed_departments, dept))}
                                                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${active
                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                                    : 'bg-bg-subtle border-border text-txt-muted hover:border-emerald-400'}`}>
                                                {active && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}{dept}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Thêm rule mới */}
            {canEdit && (
                <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm p-5 space-y-4">
                    <h4 className="text-sm font-bold text-txt-primary flex items-center gap-2"><Plus className="w-4 h-4 text-primary-500" />Thêm giới hạn mới</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="text-xs font-semibold text-txt-secondary">Phân hệ
                            <select value={newResource} onChange={e => setNewResource(e.target.value as PermissionResource)}
                                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-bg-subtle text-sm text-txt-primary">
                                {ALL_RESOURCES.map(r => <option key={r} value={r}>{RESOURCE_LABELS[r] || r}</option>)}
                            </select>
                        </label>
                        <label className="text-xs font-semibold text-txt-secondary">Hành động
                            <select value={newAction} onChange={e => setNewAction(e.target.value as PermissionAction)}
                                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-bg-subtle text-sm text-txt-primary">
                                {EDITABLE_ACTIONS.map(a => <option key={a} value={a}>{ACTION_LABELS[a]}</option>)}
                            </select>
                        </label>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-txt-secondary mb-1.5">Phòng được phép</p>
                        <div className="flex flex-wrap gap-1.5">
                            {departments.map(dept => {
                                const active = newDepts.includes(dept);
                                return (
                                    <button key={dept} onClick={() => setNewDepts(prev => toggleDept(prev, dept))}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${active
                                            ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-bg-subtle border-border text-txt-muted hover:border-emerald-400'}`}>
                                        {active && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}{dept}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <button onClick={addRule} disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Thêm giới hạn
                    </button>
                </div>
            )}
        </div>
    );
};

export default DepartmentRuleManager;
