import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Building2, Search, UserPlus, ToggleRight, AlertCircle, ToggleLeft, Users
} from 'lucide-react';
import { supabase, adminUserOp } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { generatePassword } from './utils/adminUtils';

// Subcomponents
import { CreateContractorAccountModal } from './components/CreateContractorAccountModal';
import { ResetContractorPasswordModal } from './components/ResetContractorPasswordModal';
import { ProjectAssignmentModal } from './components/ProjectAssignmentModal';
import { ContractorAccordionList } from './components/ContractorAccordionList';

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

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForContractor, setCreateForContractor] = useState<string | null>(null);
    const [projectTarget, setProjectTarget] = useState<ContractorAccount | null>(null);
    const [resetTarget, setResetTarget] = useState<ContractorAccount | null>(null);

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
                    changed_by: currentUser.EmployeeID,
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
                    changed_by: currentUser.EmployeeID,
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
    const handleResetPassword = async (password: string) => {
        if (!resetTarget) return;
        try {
            if (resetTarget.auth_user_id) {
                await adminUserOp('updateUser', {
                    userId: resetTarget.auth_user_id,
                    attributes: { password },
                });
            }
            if (currentUser) {
                await supabase.from('audit_logs').insert({
                    action: 'RESET_CONTRACTOR_PASSWORD',
                    changed_by: currentUser.EmployeeID,
                    target_entity: 'ContractorAccount',
                    target_id: resetTarget.account_id,
                    details: `Reset password for contractor user ${resetTarget.username}`
                });
            }
            setResetTarget(null);
            await loadData();
        } catch (err: any) {
            setError(`Reset password thất bại: ${err.message}`);
            throw err;
        }
    };

    // ── Project management ──
    const toggleProject = async (projectId: string) => {
        if (!projectTarget) return;
        const current = projectTarget.allowed_project_ids || [];
        const updated = current.includes(projectId)
            ? current.filter(id => id !== projectId)
            : [...current, projectId];
        try {
            await supabase.from('contractor_accounts')
                .update({ allowed_project_ids: updated })
                .eq('account_id', projectTarget.account_id);
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
                <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/50">
                            <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-txt-muted">Đơn vị</p>
                            <p className="text-2xl font-bold text-txt-primary mt-0.5">{stats.orgs}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-600/50">
                            <Users className="w-6 h-6 text-txt-muted" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-txt-muted">Tài khoản</p>
                            <p className="text-2xl font-bold text-txt-primary mt-0.5">{stats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/50">
                            <ToggleRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-txt-muted">Đang hoạt động</p>
                            <p className="text-2xl font-bold text-txt-primary mt-0.5">{stats.active}</p>
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
                        className="w-full pl-12 pr-4 py-3 bg-bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-txt-primary" />
                </div>
                <div className="flex gap-2">
                    {grouped.length > 1 && (
                        <button onClick={expandedOrgs.size === grouped.length ? collapseAll : expandAll}
                            className="px-3 py-2.5 bg-bg-muted text-txt-muted rounded-xl text-xs font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors whitespace-nowrap">
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
            <ContractorAccordionList
                grouped={grouped}
                expandedOrgs={expandedOrgs}
                onToggleExpand={toggleExpand}
                onSetCreateForContractor={setCreateForContractor}
                onShowCreateModal={() => setShowCreateModal(true)}
                onSetProjectTarget={setProjectTarget}
                onToggleActive={handleToggleActive}
                onOpenResetModal={setResetTarget}
                onDeleteAccount={handleDeleteAccount}
            />

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
                <ResetContractorPasswordModal
                    resetTarget={resetTarget}
                    onClose={() => setResetTarget(null)}
                    onReset={handleResetPassword}
                />
            )}

            {/* Project Assignment Modal */}
            {projectTarget && (
                <ProjectAssignmentModal
                    projectTarget={projectTarget}
                    projects={projects}
                    onClose={() => setProjectTarget(null)}
                    onToggleProject={toggleProject}
                />
            )}
        </div>
    );
};

export default ContractorAccountManager;
