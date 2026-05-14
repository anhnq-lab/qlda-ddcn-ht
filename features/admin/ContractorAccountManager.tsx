import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Building2, Search, UserPlus, Key, ToggleRight, ToggleLeft,
    AlertCircle, Eye, EyeOff, Copy, Check, Mail, Phone,
    FolderOpen, X, Plus, Trash2, Loader2, RotateCcw,
    ChevronDown, ChevronRight, Users
} from 'lucide-react';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

// ============================================================
// Types
// ============================================================

interface ContractorAccount {
    account_id: string;
    contractor_id: string;
    username: string;
    display_name: string;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    last_login: string | null;
    allowed_project_ids: string[] | null;
    auth_user_id: string | null;
    created_at: string | null;
    // Joined
    contractor_name?: string;
}

interface ContractorInfo {
    contractor_id: string;
    full_name: string;
    representative: string | null;
}

interface ProjectInfo {
    project_id: string;
    project_name: string;
}

interface ContractorGroup {
    contractor_id: string;
    contractor_name: string;
    representative: string | null;
    accounts: ContractorAccount[];
    activeCount: number;
}

// ============================================================
// CONTRACTOR ACCOUNT MANAGER
// ============================================================

const ContractorAccountManager: React.FC = () => {
    const { currentUser } = useAuth();
    const [accounts, setAccounts] = useState<ContractorAccount[]>([]);
    const [contractors, setContractors] = useState<ContractorInfo[]>([]);
    const [projects, setProjects] = useState<ProjectInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());

    // Create modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForContractor, setCreateForContractor] = useState<string | null>(null);

    // Project modal
    const [projectTarget, setProjectTarget] = useState<ContractorAccount | null>(null);

    // Reset password modal
    const [resetTarget, setResetTarget] = useState<ContractorAccount | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    // ── Load data ──
    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [accRes, ctrRes, projRes] = await Promise.all([
                supabase.from('contractor_accounts').select('*').order('created_at', { ascending: false }),
                supabase.from('contractors').select('contractor_id, full_name, representative').order('full_name'),
                supabase.from('projects').select('project_id, project_name').order('project_name'),
            ]);

            const accs: ContractorAccount[] = (accRes.data || []).map((a: any) => ({ ...a }));

            // Map contractor names
            const ctrMap = new Map((ctrRes.data || []).map((c: any) => [c.contractor_id, c.full_name]));
            accs.forEach(a => { a.contractor_name = ctrMap.get(a.contractor_id) || a.contractor_id; });

            setAccounts(accs);
            setContractors(ctrRes.data || []);
            setProjects(projRes.data || []);
        } catch (err: any) {
            setError(err.message || 'Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Filter + Group by contractor ──
    const grouped = useMemo(() => {
        const filteredAccounts = accounts.filter(a => {
            if (!search) return true;
            const s = search.toLowerCase();
            return (
                a.display_name.toLowerCase().includes(s) ||
                a.username.toLowerCase().includes(s) ||
                a.contractor_name?.toLowerCase().includes(s) ||
                a.email?.toLowerCase().includes(s)
            );
        });

        const groupMap = new Map<string, ContractorGroup>();
        for (const acc of filteredAccounts) {
            if (!groupMap.has(acc.contractor_id)) {
                const ctr = contractors.find(c => c.contractor_id === acc.contractor_id);
                groupMap.set(acc.contractor_id, {
                    contractor_id: acc.contractor_id,
                    contractor_name: ctr?.full_name || acc.contractor_name || acc.contractor_id,
                    representative: ctr?.representative || null,
                    accounts: [],
                    activeCount: 0,
                });
            }
            const group = groupMap.get(acc.contractor_id)!;
            group.accounts.push(acc);
            if (acc.is_active) group.activeCount++;
        }

        return Array.from(groupMap.values()).sort((a, b) => a.contractor_name.localeCompare(b.contractor_name));
    }, [accounts, contractors, search]);

    const toggleExpand = (id: string) => {
        setExpandedOrgs(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const expandAll = () => setExpandedOrgs(new Set(grouped.map(g => g.contractor_id)));
    const collapseAll = () => setExpandedOrgs(new Set());

    // ── Toggle active ──
    const handleToggleActive = async (account: ContractorAccount) => {
        try {
            await supabase.from('contractor_accounts')
                .update({ is_active: !account.is_active })
                .eq('account_id', account.account_id);
            if (currentUser) {
                await supabase.from('audit_logs').insert({
                    action: !account.is_active ? 'ENABLE_CONTRACTOR_ACCOUNT' : 'DISABLE_CONTRACTOR_ACCOUNT',
                    changed_by: currentUser.employee_id,
                    target_entity: 'ContractorAccount',
                    target_id: account.account_id,
                    details: `Toggled active status for contractor account ${account.username} to ${!account.is_active}`
                });
            }
            await loadData();
        } catch (err: any) { setError(err.message); }
    };

    // ── Delete account ──
    const handleDeleteAccount = async (account: ContractorAccount) => {
        if (!window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản của ${account.display_name}? Hành động này không thể hoàn tác.`)) return;
        try {
            const { error } = await supabase.from('contractor_accounts').delete().eq('account_id', account.account_id);
            if (error) throw error;
            if (currentUser) {
                await supabase.from('audit_logs').insert({
                    action: 'DELETE_CONTRACTOR_ACCOUNT',
                    changed_by: currentUser.employee_id,
                    target_entity: 'ContractorAccount',
                    target_id: account.account_id,
                    details: `Deleted contractor account ${account.username}`
                });
            }
            await loadData();
        } catch (err: any) {
            setError('Lỗi khi xóa tài khoản: ' + err.message);
        }
    };

    // ── Reset password ──
    const handleResetPassword = async () => {
        if (!resetTarget || !newPassword) return;
        try {
            if (resetTarget.auth_user_id) {
                const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(
                    resetTarget.auth_user_id,
                    { password: newPassword }
                );
                if (authErr) throw authErr;
            }
            if (currentUser) {
                await supabase.from('audit_logs').insert({
                    action: 'RESET_CONTRACTOR_PASSWORD',
                    changed_by: currentUser.employee_id,
                    target_entity: 'ContractorAccount',
                    target_id: resetTarget.account_id,
                    details: `Reset password for contractor user ${resetTarget.username}`
                });
            }
            setResetTarget(null);
            setNewPassword('');
            await loadData();
        } catch (err: any) {
            setError(`Reset password thất bại: ${err.message}`);
        }
    };

    const openResetModal = (account: ContractorAccount) => {
        setNewPassword(generatePassword());
        setShowNewPassword(true);
        setCopiedPassword(false);
        setResetTarget(account);
    };

    const copyPassword = () => {
        navigator.clipboard.writeText(newPassword);
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
    };

    // ── Project management ──
    const toggleProject = async (account: ContractorAccount, projectId: string) => {
        const current = account.allowed_project_ids || [];
        const updated = current.includes(projectId)
            ? current.filter(id => id !== projectId)
            : [...current, projectId];
        try {
            await supabase.from('contractor_accounts')
                .update({ allowed_project_ids: updated })
                .eq('account_id', account.account_id);
            await loadData();
            setProjectTarget(prev => prev ? { ...prev, allowed_project_ids: updated } : null);
        } catch (err: any) { setError(err.message); }
    };

    // ── Stats ──
    const stats = useMemo(() => ({
        total: accounts.length,
        active: accounts.filter(a => a.is_active).length,
        orgs: new Set(accounts.map(a => a.contractor_id)).size,
    }), [accounts]);

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-[4px] border-l-primary-500 rounded-2xl p-5 shadow-sm hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                    <Building2 className="absolute -right-3 -top-3 w-20 h-20 text-primary-50 dark:text-slate-700" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-slate-700 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{stats.orgs}</p>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mt-0.5">Đơn vị</p>
                        </div>
                    </div>
                </div>
                <div className="relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-[4px] border-l-slate-500 rounded-2xl p-5 shadow-sm hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                    <UserPlus className="absolute -right-3 -top-3 w-20 h-20 text-slate-100 dark:text-slate-700/50" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{stats.total}</p>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mt-0.5">Tài khoản</p>
                        </div>
                    </div>
                </div>
                <div className="relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-[4px] border-l-emerald-500 rounded-2xl p-5 shadow-sm hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                    <ToggleRight className="absolute -right-3 -top-3 w-20 h-20 text-emerald-50 dark:text-slate-700" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-slate-700 flex items-center justify-center">
                            <ToggleRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{stats.active}</p>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mt-0.5">Đang hoạt động</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-slate-800 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    <button onClick={() => setError('')} className="ml-auto text-xs underline">Đóng</button>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Tìm theo tên, username, đơn vị..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-gray-900 dark:text-slate-100" />
                </div>
                <div className="flex gap-2">
                    {grouped.length > 1 && (
                        <button onClick={expandedOrgs.size === grouped.length ? collapseAll : expandAll}
                            className="px-3 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors whitespace-nowrap">
                            {expandedOrgs.size === grouped.length ? 'Thu gọn' : 'Mở rộng'} tất cả
                        </button>
                    )}
                    <button onClick={() => { setCreateForContractor(null); setShowCreateModal(true); }}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium shadow-sm shadow-primary-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all whitespace-nowrap">
                        <UserPlus className="w-5 h-5" />Tạo tài khoản
                    </button>
                </div>
            </div>

            {/* Grouped Accordion */}
            {loading ? (
                <div className="p-4 text-center text-gray-400">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3" />
                    Đang tải...
                </div>
            ) : grouped.length === 0 ? (
                <div className="p-12 text-center text-gray-400 dark:text-slate-400">
                    <Building2 className="w-14 h-14 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">{search ? 'Không tìm thấy kết quả' : 'Chưa có tài khoản nhà thầu nào'}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {grouped.map(group => {
                        const isExpanded = expandedOrgs.has(group.contractor_id);
                        return (
                            <div key={group.contractor_id}
                                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                                {/* Org Header */}
                                <div
                                    className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors select-none"
                                    onClick={() => toggleExpand(group.contractor_id)}
                                >
                                    {isExpanded
                                        ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                        : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                    }
                                    <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center shrink-0">
                                        <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{group.contractor_name}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5">
                                            {group.representative || group.contractor_id} · {group.accounts.length} tài khoản · {group.activeCount} hoạt động
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                        <span className="px-2.5 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg text-[10px] font-bold">
                                            <Users className="w-3 h-3 inline mr-1" />{group.accounts.length}
                                        </span>
                                        <button
                                            onClick={() => { setCreateForContractor(group.contractor_id); setShowCreateModal(true); }}
                                            className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="Thêm nhân sự"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded — Staff List */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 dark:border-slate-700">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50/80 dark:bg-slate-700">
                                                    <th className="text-left px-5 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400 w-8">#</th>
                                                    <th className="text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400">Nhân sự</th>
                                                    <th className="text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400">Username</th>
                                                    <th className="text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400">Liên hệ</th>
                                                    <th className="text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400">Dự án</th>
                                                    <th className="text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400">Trạng thái</th>
                                                    <th className="text-right px-5 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400">Hành động</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/40">
                                                {group.accounts.map((acc, idx) => {
                                                    const projectCount = acc.allowed_project_ids?.length || 0;
                                                    return (
                                                        <tr key={acc.account_id} className="hover:bg-blue-50/30 dark:hover:bg-slate-700 transition-colors">
                                                            <td className="px-5 py-2.5 text-gray-300 dark:text-slate-600 text-xs">{idx + 1}</td>
                                                            <td className="px-4 py-2.5">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                                                        {acc.display_name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span className="font-medium text-gray-800 dark:text-slate-200 text-xs">{acc.display_name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded font-mono text-[11px] text-gray-600 dark:text-slate-400">
                                                                    {acc.username}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-[11px] text-gray-500 dark:text-slate-400">
                                                                {acc.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{acc.email}</span>}
                                                                {acc.phone && <span className="flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{acc.phone}</span>}
                                                                {!acc.email && !acc.phone && '—'}
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <button onClick={() => setProjectTarget(acc)}
                                                                    className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/15 text-blue-600 dark:text-blue-400 rounded-md text-[11px] font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                                                    <FolderOpen className="w-3 h-3" />{projectCount} DA
                                                                </button>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <button onClick={() => handleToggleActive(acc)}
                                                                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-colors ${acc.is_active
                                                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100'
                                                                        : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100'
                                                                        }`}>
                                                                    {acc.is_active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                                                                    {acc.is_active ? 'ON' : 'OFF'}
                                                                </button>
                                                            </td>
                                                            <td className="px-5 py-2.5 text-right">
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    <button onClick={() => openResetModal(acc)}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/15 rounded-md hover:bg-primary-100 transition-colors">
                                                                        <Key className="w-3 h-3" />Reset MK
                                                                    </button>
                                                                    <button onClick={() => handleDeleteAccount(acc)}
                                                                        className="inline-flex items-center justify-center w-6 h-6 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                                        title="Xóa tài khoản">
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <CreateContractorAccountModal
                    contractors={contractors}
                    projects={projects}
                    existingAccounts={accounts}
                    preselectedContractor={createForContractor}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => { setShowCreateModal(false); loadData(); }}
                />
            )}

            {/* Password Management Modal */}
            {resetTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setResetTarget(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-4 shadow-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">Quản lý mật khẩu</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
                            <strong>{resetTarget.display_name}</strong> · {resetTarget.username}
                        </p>

                        {/* New Password Section */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Đổi mật khẩu mới</label>
                            <div className="relative">
                                <input type={showNewPassword ? 'text' : 'password'} value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-24 bg-white dark:bg-slate-800 border border-primary-300 dark:border-primary-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-gray-900 dark:text-slate-100"
                                    placeholder="Nhập mật khẩu mới..." />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="p-1.5 text-gray-400 hover:text-gray-600">
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button type="button" onClick={() => { navigator.clipboard.writeText(newPassword); setCopiedPassword(true); setTimeout(() => setCopiedPassword(false), 2000); }}
                                        className="p-1.5 text-gray-400 hover:text-primary-600" title="Copy">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <button onClick={() => { setNewPassword(generatePassword()); setCopiedPassword(false); }}
                                className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">↻ Sinh mật khẩu ngẫu nhiên</button>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setResetTarget(null)} className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Đóng</button>
                            <button onClick={handleResetPassword} disabled={!newPassword}
                                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-sm shadow-primary-500/25">Đổi mật khẩu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Project Assignment Modal */}
            {projectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setProjectTarget(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-4 shadow-sm max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Gán dự án</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400">{projectTarget.display_name} — {projectTarget.contractor_name}</p>
                            </div>
                            <button onClick={() => setProjectTarget(null)} className="p-1.5 text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1.5">
                            {projects.map(proj => {
                                const isAssigned = (projectTarget.allowed_project_ids || []).includes(proj.project_id);
                                return (
                                    <button key={proj.project_id} onClick={() => toggleProject(projectTarget, proj.project_id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all ${isAssigned
                                            ? 'bg-primary-50 dark:bg-primary-900/15 border border-primary-200 dark:border-primary-800/40'
                                            : 'bg-gray-50 dark:bg-slate-700 border border-transparent hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isAssigned
                                            ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 dark:border-slate-600'}`}>
                                            {isAssigned && <Check className="w-3.5 h-3.5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium truncate ${isAssigned ? 'text-primary-800 dark:text-primary-300' : 'text-gray-700 dark:text-slate-300'}`}>{proj.project_name}</p>
                                            <p className="text-[10px] text-gray-400 truncate">{proj.project_id}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-400 text-center">
                            Đã gán {(projectTarget.allowed_project_ids || []).length} / {projects.length} dự án
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================
// CREATE CONTRACTOR ACCOUNT MODAL
// ============================================================

interface CreateModalProps {
    contractors: ContractorInfo[];
    projects: ProjectInfo[];
    existingAccounts: ContractorAccount[];
    preselectedContractor: string | null;
    onClose: () => void;
    onCreated: () => void;
}

const CreateContractorAccountModal: React.FC<CreateModalProps> = ({
    contractors, projects, existingAccounts, preselectedContractor, onClose, onCreated
}) => {
    const [selectedContractor, setSelectedContractor] = useState(preselectedContractor || '');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState(generatePassword());
    const [showPassword, setShowPassword] = useState(true);
    const [copied, setCopied] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const selectedCtr = contractors.find(c => c.contractor_id === selectedContractor);

    // Auto-generate username from display name
    useEffect(() => {
        if (!displayName) return;
        const parts = displayName.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            const lastName = parts[parts.length - 1];
            const initials = parts.slice(0, -1).map(p => p.charAt(0)).join('');
            setUsername(`${removeVietnamese(lastName)}.${removeVietnamese(initials)}`.toUpperCase());
        } else if (parts.length === 1) {
            setUsername(removeVietnamese(parts[0]).toUpperCase());
        }
    }, [displayName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContractor || !displayName || !username || !password) return;
        if (password.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự'); return; }

        setSubmitting(true);
        setError('');
        try {
            // Create Supabase auth user
            const authEmail = email || `${username}@cic.vn`;
            let authUserId: string | null = null;

            try {
                const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
                    email: authEmail,
                    password,
                    email_confirm: true,
                    user_metadata: { full_name: displayName, contractor_id: selectedContractor },
                });
                authUserId = authData?.user?.id || null;

                if (authErr) {
                    console.warn('[ContractorAcct] Admin Auth user creation failed, throwing error', authErr);
                    throw authErr;
                }
            } catch (e: any) {
                // If auth fails, stop the process instead of inserting an unlinked account
                console.error('[ContractorAcct] Auth user creation failed', e);
                setError(`Không thể tạo tài khoản xác thực: ${e.message}`);
                setSubmitting(false);
                return;
            }

            // Create contractor_accounts record
            // Always store the email used for Auth so resolveEmail() can find it
            const { error: insertErr } = await supabase.from('contractor_accounts').insert({
                contractor_id: selectedContractor,
                username,
                display_name: displayName,
                email: authEmail,
                phone: phone || null,
                auth_user_id: authUserId,
                is_active: true,
                allowed_project_ids: selectedProjects.length > 0 ? selectedProjects : null,
            } as any);

            if (insertErr) {
                if (insertErr.code === '23505') throw new Error('Username đã tồn tại');
                throw insertErr;
            }

            onCreated();
        } catch (err: any) {
            setError(err.message || 'Tạo tài khoản thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    const copyPwd = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleProject = (pid: string) => {
        setSelectedProjects(prev =>
            prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-4 shadow-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                        <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Tạo tài khoản nhà thầu</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Gán tài khoản đăng nhập cho nhân sự nhà thầu</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-slate-800 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2 border border-red-100 dark:border-red-900/50">
                        <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Contractor select */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Đơn vị nhà thầu <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedContractor}
                            onChange={e => setSelectedContractor(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-slate-100"
                            required
                        >
                            <option value="">-- Chọn nhà thầu --</option>
                            {contractors.map(c => (
                                <option key={c.contractor_id} value={c.contractor_id}>{c.full_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Display name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Họ tên nhân sự <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-slate-100"
                            placeholder="Nguyễn Văn A"
                            required
                        />
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Email
                            </label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100"
                                placeholder="abc@email.com" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> Điện thoại
                            </label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100"
                                placeholder="0901234567" />
                        </div>
                    </div>

                    {/* Username & Password */}
                    <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                            <Key className="w-3 h-3" /> Thông tin đăng nhập
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-mono text-gray-900 dark:text-slate-100"
                                    placeholder="nguyenvana" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">
                                    Mật khẩu <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full px-3.5 py-2.5 pr-20 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-mono text-gray-900 dark:text-slate-100"
                                        required
                                    />
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1 text-gray-400 hover:text-gray-600">
                                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                        <button type="button" onClick={copyPwd} className="p-1 text-gray-400 hover:text-primary-600">
                                            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                        <button type="button" onClick={() => { setPassword(generatePassword()); setCopied(false); }} className="p-1 text-gray-400 hover:text-primary-600">
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Project assignment */}
                    <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                            <FolderOpen className="w-3 h-3" /> Gán dự án ({selectedProjects.length})
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-1.5 bg-gray-50 dark:bg-slate-700 rounded-xl p-2">
                            {projects.map(proj => {
                                const isSelected = selectedProjects.includes(proj.project_id);
                                return (
                                    <button
                                        key={proj.project_id}
                                        type="button"
                                        onClick={() => toggleProject(proj.project_id)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-all ${isSelected
                                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 font-medium'
                                            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isSelected
                                            ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 dark:border-slate-600'
                                            }`}>
                                            {isSelected && <Check className="w-2.5 h-2.5" />}
                                        </div>
                                        <span className="truncate">{proj.project_name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={submitting || !selectedContractor || !displayName || !username || !password}
                            className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 shadow-sm shadow-primary-500/25">
                            {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============================================================
// HELPERS
// ============================================================

function generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

function removeVietnamese(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9.]/g, '');
}

export default ContractorAccountManager;
