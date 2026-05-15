import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Search, Building2, UserPlus, Key, Eye, Upload, CheckCircle2, Settings, Trash2, ChevronDown, ChevronRight, Users, Mail, Phone, Lock, Loader2, X } from 'lucide-react';
import { supabase, adminUserOp, supabaseExt } from '@/lib/supabase';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';

interface Contractor { contractor_id: string; full_name: string; representative: string | null; contact_info: string; }
interface ContractorAccount { id: string; contractor_id: string; username: string; display_name: string; email: string | null; phone: string | null; is_active: boolean; }
interface Permission { id: string; project_id: string; user_id: string; user_name: string; user_role: string; can_upload: boolean; can_approve: boolean; can_delete: boolean; can_manage: boolean; }

const ROLES = [
    { value: 'viewer', label: 'Xem', icon: Eye, color: 'bg-gray-100 text-gray-600' },
    { value: 'contributor', label: 'Nộp hồ sơ', icon: Upload, color: 'bg-blue-100 text-blue-600' },
    { value: 'reviewer', label: 'Kiểm tra', icon: Search, color: 'bg-purple-100 text-purple-600' },
    { value: 'approver', label: 'Phê duyệt', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
    { value: 'admin', label: 'Quản trị', icon: Settings, color: 'bg-red-100 text-red-600' },
];

const CDEPermissionManager: React.FC<{ projectId: string }> = ({ projectId }) => {
    const { currentUser } = useAuth();
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [accounts, setAccounts] = useState<ContractorAccount[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [search, setSearch] = useState('');
    const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
    const [showAddOrg, setShowAddOrg] = useState(false);
    const [showAddStaff, setShowAddStaff] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Add org form
    const [orgSearch, setOrgSearch] = useState('');
    const [filteredOrgs, setFilteredOrgs] = useState<Contractor[]>([]);
    const [allContractors, setAllContractors] = useState<Contractor[]>([]);

    // Add staff form
    const [staffForm, setStaffForm] = useState({ display_name: '', email: '', phone: '', username: '', password: '', role: 'contributor' });

    const loadData = useCallback(async () => {
        setLoading(true);
        const [permRes, accRes] = await Promise.all([
            supabaseExt.from('cde_permissions').select('*').eq('project_id', projectId),
            supabaseExt.from('contractor_accounts').select('*').contains('allowed_project_ids', [projectId]),
        ]);
        const perms = permRes.data || [];
        const accs = accRes.data || [];
        setPermissions(perms);
        setAccounts(accs);

        // Get unique contractor IDs from permissions & accounts
        const orgIds = [...new Set([...perms.map((p: any) => p.user_id.split('/')[0]), ...accs.map((a: any) => a.contractor_id)])].filter(Boolean);
        if (orgIds.length > 0) {
            const { data } = await supabase.from('contractors').select('*').in('contractor_id', orgIds);
            setContractors((data || []) as Contractor[]);
        } else {
            setContractors([]);
        }
        setLoading(false);
    }, [projectId]);

    useEffect(() => { loadData(); }, [loadData]);

    // Search all contractors for add dialog
    useEffect(() => {
        if (!showAddOrg) return;
        (async () => {
            const { data } = await supabase.from('contractors').select('contractor_id, full_name, representative, contact_info').order('full_name').limit(200);
            setAllContractors((data || []) as Contractor[]);
        })();
    }, [showAddOrg]);

    useEffect(() => {
        if (!orgSearch.trim()) { setFilteredOrgs(allContractors.slice(0, 10)); return; }
        const q = orgSearch.toLowerCase();
        setFilteredOrgs(allContractors.filter(c => c.full_name.toLowerCase().includes(q) || c.contractor_id.toLowerCase().includes(q)).slice(0, 10));
    }, [orgSearch, allContractors]);

    // Add org to project
    const addOrgToProject = async (org: Contractor) => {
        const exists = contractors.find(c => c.contractor_id === org.contractor_id);
        if (exists) { alert('Đơn vị đã có trong dự án'); return; }
        // Add a default permission entry
        await supabaseExt.from('cde_permissions').insert({
            project_id: projectId, user_id: org.contractor_id, user_name: org.full_name,
            user_role: 'contributor', container_access: ['WIP'], can_upload: true,
            can_approve: false, can_delete: false, can_manage: false, granted_by: 'admin',
        });

        if (currentUser) {
            await (supabase as any).from('audit_logs').insert({
                action: 'ADD_CDE_ORG',
                changed_by: currentUser.EmployeeID,
                target_entity: 'CDEPermission',
                target_id: org.contractor_id,
                details: { project_id: projectId }
            });
        }

        setShowAddOrg(false);
        setOrgSearch('');
        await loadData();
    };

    // Remove org
    const removeOrg = async (orgId: string) => {
        if (!confirm(`Xóa đơn vị khỏi dự án? Tất cả tài khoản sẽ mất quyền truy cập.`)) return;
        await supabaseExt.from('cde_permissions').delete().eq('project_id', projectId).like('user_id', `${orgId}%`);
        await supabaseExt.from('contractor_accounts').update({ allowed_project_ids: [] }).eq('contractor_id', orgId);

        if (currentUser) {
            await (supabase as any).from('audit_logs').insert({
                action: 'REMOVE_CDE_ORG',
                changed_by: currentUser.EmployeeID,
                target_entity: 'CDEPermission',
                target_id: orgId,
                details: { project_id: projectId }
            });
        }

        await loadData();
    };

    // Update role
    const updateRole = async (permId: string, role: string) => {
        const caps = {
            viewer: { can_upload: false, can_approve: false, can_delete: false, can_manage: false, container_access: ['WIP', 'SHARED', 'PUBLISHED'] },
            contributor: { can_upload: true, can_approve: false, can_delete: false, can_manage: false, container_access: ['WIP'] },
            reviewer: { can_upload: true, can_approve: false, can_delete: false, can_manage: false, container_access: ['WIP', 'SHARED'] },
            approver: { can_upload: true, can_approve: true, can_delete: false, can_manage: false, container_access: ['WIP', 'SHARED', 'PUBLISHED'] },
            admin: { can_upload: true, can_approve: true, can_delete: true, can_manage: true, container_access: ['WIP', 'SHARED', 'PUBLISHED', 'ARCHIVED'] },
        }[role] || {};
        await supabaseExt.from('cde_permissions').update({ user_role: role, ...caps }).eq('id', permId);

        if (currentUser) {
            await (supabase as any).from('audit_logs').insert({
                action: 'UPDATE_CDE_ROLE',
                changed_by: currentUser.EmployeeID,
                target_entity: 'CDEPermission',
                target_id: permId,
                details: { role, project_id: projectId }
            });
        }

        await loadData();
    };

    // Create staff account
    const createStaffAccount = async (contractorId: string) => {
        if (!staffForm.display_name || !staffForm.username || !staffForm.password) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc'); return;
        }
        if (staffForm.password.length < 6) { alert('Mật khẩu tối thiểu 6 ký tự'); return; }
        setSaving(true);
        try {
            // Create Supabase auth user via the admin-user-ops Edge Function
            const email = staffForm.email || `${staffForm.username}@cde.local`;

            let authUserId: string | null = null;
            try {
                const authData = await adminUserOp<{ user: { id: string } | null }>('createUser', {
                    email, password: staffForm.password, email_confirm: true,
                    user_metadata: { full_name: staffForm.display_name, contractor_id: contractorId },
                });

                authUserId = authData?.user?.id || null;
            } catch (e: any) {
                console.error('[CDE] Auth user creation failed', e);
                alert(`Không thể tạo tài khoản xác thực: ${e.message}`);
                setSaving(false);
                return;
            }

            // Create contractor_account — store email used for auth
            await supabaseExt.from('contractor_accounts').insert({
                contractor_id: contractorId, username: staffForm.username,
                display_name: staffForm.display_name, email: email,
                phone: staffForm.phone || null, auth_user_id: authUserId,
                is_active: true, allowed_project_ids: [projectId],
                current_password: staffForm.password,
            } as any);

            // Add CDE permission for this person
            const org = contractors.find(c => c.contractor_id === contractorId);
            await supabaseExt.from('cde_permissions').insert({
                project_id: projectId, user_id: `${contractorId}/${staffForm.username}`,
                user_name: staffForm.display_name, user_role: staffForm.role,
                container_access: ['WIP'], can_upload: true,
                can_approve: false, can_delete: false, can_manage: false,
                granted_by: 'admin',
            });

            if (currentUser) {
                await (supabase as any).from('audit_logs').insert({
                    action: 'CREATE_CDE_STAFF_ACCOUNT',
                    changed_by: currentUser.EmployeeID,
                    target_entity: 'ContractorAccount',
                    target_id: staffForm.username,
                    details: { contractor_id: contractorId, project_id: projectId, role: staffForm.role }
                });
            }

            setStaffForm({ display_name: '', email: '', phone: '', username: '', password: '', role: 'contributor' });
            setShowAddStaff(null);
            alert(`✅ Tạo tài khoản "${staffForm.display_name}" thành công!`);
            await loadData();
        } catch (err: any) {
            alert(`❌ Lỗi: ${err.message}`);
        }
        setSaving(false);
    };

    const orgAccounts = (orgId: string) => accounts.filter(a => a.contractor_id === orgId);
    const orgPermissions = (orgId: string) => permissions.filter(p => p.user_id.startsWith(orgId));

    // Get unique orgs from permissions
    const projectOrgs = (Array.from(new Set(permissions.map(p => p.user_id.split('/')[0]))) as string[]).map(id => {
        const org = contractors.find(c => c.contractor_id === id);
        return { id, name: org?.full_name || id, representative: org?.representative };
    });

    const filtered = search ? projectOrgs.filter(o => o.name.toLowerCase().includes(search.toLowerCase())) : projectOrgs;

    if (loading) return <div className="flex items-center justify-center p-12 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải...</div>;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Phân quyền tham gia dự án</h2>
                        <p className="text-[10px] text-gray-400">Thêm đơn vị, tạo tài khoản đăng nhập cho nhân sự</p>
                    </div>
                </div>
                <button onClick={() => setShowAddOrg(true)} className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-xl transition-all bg-gradient-to-br from-primary-600 to-primary-600">
                    <Building2 className="w-4 h-4" /> Thêm đơn vị
                </button>
            </div>

            {/* Search */}
            {projectOrgs.length > 0 && (
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm đơn vị..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm" />
                </div>
            )}

            {/* Org List */}
            {filtered.length === 0 ? (
                <EmptyState
                    icon={<Building2 className="w-12 h-12 text-gray-400 dark:text-slate-400" />}
                    title="Chưa có đơn vị nào tham gia"
                    description={'Bấm "Thêm đơn vị" để mời nhà thầu, tư vấn tham gia dự án'}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
                />
            ) : (
                <div className="space-y-3">
                    {filtered.map(org => {
                        const accs = orgAccounts(org.id);
                        const perms = orgPermissions(org.id);
                        const isExpanded = expandedOrg === org.id;
                        const orgPerm = perms.find(p => p.user_id === org.id);
                        return (
                            <div key={org.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                                {/* Org Header */}
                                <div className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" onClick={() => setExpandedOrg(isExpanded ? null : org.id)}>
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                        <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                                            <Building2 className="w-4.5 h-4.5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-slate-100">{org.name}</p>
                                            <p className="text-[10px] text-gray-400">{org.representative || org.id} · {accs.length} tài khoản</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {orgPerm && (
                                            <select value={orgPerm.user_role} onClick={e => e.stopPropagation()} onChange={e => updateRole(orgPerm.id, e.target.value)}
                                                className="px-2.5 py-1.5 bg-gray-100 dark:bg-slate-700 border-0 rounded-lg text-[10px] font-bold">
                                                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                            </select>
                                        )}
                                        <button onClick={e => { e.stopPropagation(); setShowAddStaff(org.id); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Thêm nhân sự">
                                            <UserPlus className="w-4 h-4" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); removeOrg(org.id); }} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Xóa">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded: Staff List */}
                                {isExpanded && (
                                    <div className="px-5 pb-4 border-t border-gray-100 dark:border-slate-700">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-3 mb-2 flex items-center gap-1.5">
                                            <Users className="w-3 h-3" /> Nhân sự ({accs.length})
                                        </p>
                                        {accs.length === 0 ? (
                                            <p className="text-xs text-gray-300 py-3 text-center">Chưa có tài khoản. Bấm <UserPlus className="w-3 h-3 inline" /> để thêm.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {accs.map(acc => {
                                                    const accPerm = perms.find(p => p.user_id === `${org.id}/${acc.username}`);
                                                    const role = ROLES.find(r => r.value === (accPerm?.user_role || 'contributor'));
                                                    return (
                                                        <div key={acc.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
                                                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-[10px] font-black text-blue-700 dark:text-blue-300">
                                                                {acc.display_name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-gray-700 dark:text-slate-200">{acc.display_name}</p>
                                                                <p className="text-[10px] text-gray-400 flex items-center gap-2">
                                                                    <span className="flex items-center gap-0.5"><Key className="w-2.5 h-2.5" />{acc.username}</span>
                                                                    {acc.email && <span className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5" />{acc.email}</span>}
                                                                </p>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${role?.color || ''}`}>{role?.label || 'Contributor'}</span>
                                                            <span className={`w-2 h-2 rounded-full ${acc.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} title={acc.is_active ? 'Hoạt động' : 'Vô hiệu'} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal: Add Org */}
            {showAddOrg && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddOrg(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="text-sm font-black text-gray-800 dark:text-slate-100">Thêm đơn vị vào dự án</h3>
                            <button onClick={() => setShowAddOrg(false)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={orgSearch} onChange={e => setOrgSearch(e.target.value)} placeholder="Tìm tên đơn vị, mã nhà thầu..."
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm" autoFocus />
                            </div>
                            <div className="max-h-[350px] overflow-y-auto space-y-1.5">
                                {filteredOrgs.map(org => (
                                    <button key={org.contractor_id} onClick={() => addOrgToProject(org)}
                                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-3 group">
                                        <Building2 className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-700 dark:text-slate-200 truncate">{org.full_name}</p>
                                            <p className="text-[10px] text-gray-400">{org.contractor_id} {org.representative ? `· ${org.representative}` : ''}</p>
                                        </div>
                                        <Plus className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                                    </button>
                                ))}
                                {filteredOrgs.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Không tìm thấy đơn vị phù hợp</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add Staff */}
            {showAddStaff && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddStaff(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-gray-800 dark:text-slate-100">Tạo tài khoản nhân sự</h3>
                                <p className="text-[10px] text-gray-400 mt-0.5">{contractors.find(c => c.contractor_id === showAddStaff)?.full_name}</p>
                            </div>
                            <button onClick={() => setShowAddStaff(null)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-3.5">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Họ tên <span className="text-red-500">*</span></label>
                                <input value={staffForm.display_name} onChange={e => setStaffForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Nguyễn Văn A"
                                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
                                    <input value={staffForm.email} onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))} placeholder="abc@email.com"
                                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block flex items-center gap-1"><Phone className="w-3 h-3" /> Điện thoại</label>
                                    <input value={staffForm.phone} onChange={e => setStaffForm(f => ({ ...f, phone: e.target.value }))} placeholder="0901234567"
                                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm" />
                                </div>
                            </div>
                            <div className="border-t border-gray-100 dark:border-slate-700 pt-3.5">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Lock className="w-3 h-3" /> Thông tin đăng nhập</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">Tên đăng nhập <span className="text-red-500">*</span></label>
                                        <input value={staffForm.username} onChange={e => setStaffForm(f => ({ ...f, username: e.target.value }))} placeholder="nguyenvana"
                                            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">Mật khẩu <span className="text-red-500">*</span></label>
                                        <input type="password" value={staffForm.password} onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••"
                                            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-mono" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Vai trò trên CDE</label>
                                <div className="flex gap-2 flex-wrap">
                                    {ROLES.map(r => (
                                        <button key={r.value} onClick={() => setStaffForm(f => ({ ...f, role: r.value }))}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${staffForm.role === r.value ? `${r.color} border-current shadow-sm` : 'bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 text-gray-400 border-transparent'}`}>
                                            <r.icon className="w-3 h-3" />{r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3 bg-gray-50/80 dark:bg-slate-800">
                            <button onClick={() => setShowAddStaff(null)} className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 rounded-xl text-xs font-bold">Hủy</button>
                            <button onClick={() => createStaffAccount(showAddStaff)} disabled={saving}
                                className="px-5 py-2.5 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50 bg-gradient-to-br from-primary-600 to-primary-600">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                Tạo tài khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CDEPermissionManager;
