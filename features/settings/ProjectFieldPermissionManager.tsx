/**
 * ProjectFieldPermissionManager — phân quyền cấp TRƯỜNG dự án theo vai trò thành viên.
 *
 * Ma trận: hàng = field (nhóm theo tab form dự án), cột = vai trò thành viên dự án.
 * Ô tích = ĐƯỢC sửa (mặc định tích). Bỏ tích = khoá. Lưu vào project_field_permissions.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SlidersHorizontal, Save, Check, ChevronDown, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { clearProjectFieldPermsCache } from '../projects/hooks/useProjectFieldAccess';
import {
    PROJECT_MEMBER_ROLES,
    PROJECT_FIELD_CATALOG,
    PROJECT_FIELD_TABS,
    PROJECT_FIELD_TAB_LABELS,
    type ProjectFieldTab,
} from '../projects/projectFieldCatalog';

const ROLE_SHORT: Record<string, string> = {
    'Giám đốc dự án': 'GĐ dự án',
    'Trưởng phòng phụ trách': 'TrP phụ trách',
    'Chuyên viên phụ trách': 'CV phụ trách',
    'Kế toán dự án': 'Kế toán',
    'Thành viên': 'Thành viên',
};

const ProjectFieldPermissionManager: React.FC = () => {
    const { addToast } = useToast();
    const { can } = usePermissionCheck();
    const canEdit = can('admin_roles', 'update');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    // key = `${role}|${field_key}` → can_edit (mặc định true)
    const [perms, setPerms] = useState<Map<string, boolean>>(new Map());
    const [dirty, setDirty] = useState(false);
    const [openTabs, setOpenTabs] = useState<Set<ProjectFieldTab>>(new Set(['general']));

    useEffect(() => {
        (async () => {
            try {
                const { data } = await (supabase as any)
                    .from('project_field_permissions')
                    .select('member_role, field_key, can_edit');
                const m = new Map<string, boolean>();
                (data || []).forEach((r: any) => m.set(`${r.member_role}|${r.field_key}`, r.can_edit));
                setPerms(m);
            } catch (e) {
                console.error('[ProjectFieldPerm] load failed', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const getVal = useCallback((role: string, key: string) => {
        const v = perms.get(`${role}|${key}`);
        return v === undefined ? true : v; // default allow
    }, [perms]);

    const toggle = useCallback((role: string, key: string) => {
        if (!canEdit) return;
        setPerms(prev => {
            const next = new Map(prev);
            const cur = next.get(`${role}|${key}`);
            next.set(`${role}|${key}`, cur === undefined ? false : !cur);
            return next;
        });
        setDirty(true);
    }, [canEdit]);

    // Bật/tắt toàn bộ field trong 1 tab cho 1 vai trò
    const toggleTabRole = useCallback((tab: ProjectFieldTab, role: string) => {
        if (!canEdit) return;
        const fields = PROJECT_FIELD_CATALOG.filter(f => f.tab === tab);
        const allOn = fields.every(f => getVal(role, f.key));
        setPerms(prev => {
            const next = new Map(prev);
            fields.forEach(f => next.set(`${role}|${f.key}`, !allOn));
            return next;
        });
        setDirty(true);
    }, [canEdit, getVal]);

    const handleSave = useCallback(async () => {
        if (!canEdit) { addToast({ title: 'Lỗi', message: 'Bạn không có quyền sửa phân quyền.', type: 'error' }); return; }
        setSaving(true);
        try {
            const rows = PROJECT_MEMBER_ROLES.flatMap(role =>
                PROJECT_FIELD_CATALOG.map(f => ({
                    member_role: role,
                    field_key: f.key,
                    can_edit: getVal(role, f.key),
                    updated_at: new Date().toISOString(),
                }))
            );
            const { error } = await (supabase as any)
                .from('project_field_permissions')
                .upsert(rows, { onConflict: 'member_role,field_key' });
            if (error) throw error;
            clearProjectFieldPermsCache();
            setDirty(false);
            addToast({ title: 'Đã lưu', message: 'Đã cập nhật quyền sửa trường theo vai trò thành viên.', type: 'success' });
        } catch (e: any) {
            addToast({ title: 'Lỗi', message: e.message || 'Lưu thất bại', type: 'error' });
        } finally {
            setSaving(false);
        }
    }, [canEdit, getVal, addToast]);

    const lockedCount = useMemo(() => {
        let n = 0;
        perms.forEach(v => { if (v === false) n++; });
        return n;
    }, [perms]);

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="space-y-5">
            <div className="flex items-start gap-3 px-4 py-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-0.5">Quyền sửa trường dự án theo vai trò thành viên</p>
                    <p className="text-xs text-blue-700/90 dark:text-blue-300/80">
                        Mỗi ô tích = vai trò đó <strong>được sửa</strong> trường tương ứng khi chỉnh sửa dự án (chỉ áp cho thành viên dự án).
                        <strong> Mặc định được sửa</strong> — bỏ tích để khoá. Áp dụng cả ở giao diện và cơ sở dữ liệu.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-xs text-txt-muted">Đang khoá <strong className="text-txt-primary">{lockedCount}</strong> ô.</p>
                {canEdit && dirty && (
                    <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Lưu thay đổi
                    </button>
                )}
            </div>

            {PROJECT_FIELD_TABS.map(tab => {
                const fields = PROJECT_FIELD_CATALOG.filter(f => f.tab === tab);
                const isOpen = openTabs.has(tab);
                return (
                    <div key={tab} className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
                        <button
                            onClick={() => setOpenTabs(prev => { const n = new Set(prev); n.has(tab) ? n.delete(tab) : n.add(tab); return n; })}
                            className="w-full flex items-center gap-2 px-5 py-3 bg-bg-subtle/50 hover:bg-bg-muted transition-colors"
                        >
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <SlidersHorizontal className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-bold text-txt-primary">{PROJECT_FIELD_TAB_LABELS[tab]}</span>
                            <span className="text-xs text-txt-muted ml-1">({fields.length} trường)</span>
                        </button>
                        {isOpen && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-bg-subtle text-[10px] font-black uppercase tracking-wider text-txt-muted border-y border-border">
                                        <tr>
                                            <th className="text-left px-5 py-2.5 min-w-[220px]">Trường dữ liệu</th>
                                            {PROJECT_MEMBER_ROLES.map(role => (
                                                <th key={role} className="px-2 py-2.5 text-center min-w-[90px]">
                                                    <button onClick={() => toggleTabRole(tab, role)} title="Bật/tắt cả nhóm" className="hover:text-primary-600">
                                                        {ROLE_SHORT[role]}
                                                    </button>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields.map((f, idx) => (
                                            <tr key={f.key} className={`border-b border-border-subtle ${idx % 2 === 0 ? 'bg-bg-surface' : 'bg-slate-50/40 dark:bg-slate-900/40'}`}>
                                                <td className="px-5 py-2 text-txt-secondary">{f.label}<span className="block text-[10px] text-txt-placeholder font-mono">{f.key}</span></td>
                                                {PROJECT_MEMBER_ROLES.map(role => {
                                                    const on = getVal(role, f.key);
                                                    return (
                                                        <td key={role} className="px-2 py-2 text-center">
                                                            <button onClick={() => toggle(role, f.key)} disabled={!canEdit}
                                                                className={`w-6 h-6 rounded-md border-2 inline-flex items-center justify-center transition-all ${on
                                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                    : 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'}`}
                                                                title={on ? 'Được sửa' : 'Bị khoá'}>
                                                                {on && <Check className="w-3.5 h-3.5" />}
                                                            </button>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ProjectFieldPermissionManager;
