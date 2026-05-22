import React, { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck, Plus, RotateCcw, ToggleLeft, ToggleRight,
    Copy, Check, Search, AlertCircle, Eye, EyeOff,
    Users, UserPlus, Key, Mail, Phone, User as UserIcon, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { UserAccountService, UserAccount } from '../../services/UserAccountService';
import { Avatar } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { resolveSystemRole, ROLE_LABELS, ROLE_COLORS, ALL_ROLES } from '../../types/permission.types';

// ============================================================
// Helpers
// ============================================================

/**
 * Ghi audit log cho các hành động quản trị tài khoản.
 * Fire-and-forget: không block UI khi ghi log.
 */
async function logAuditEvent(
    action: string,
    targetId: string,
    details: string,
    changedBy?: string
): Promise<void> {
    try {
        await (supabase as any).from('audit_logs').insert({
            action,
            changed_by: changedBy,
            target_entity: 'UserAccount',
            target_id: targetId,
            details,
        });
    } catch (err) {
        console.warn('[AuditLog] Failed to write audit log:', err);
    }
}

// ============================================================
// ADMIN USER ACCOUNT MANAGER
// ============================================================

const UserAccountManager: React.FC = () => {
    const { currentUser } = useAuth();
    const { can } = usePermissionCheck();
    const [accounts, setAccounts] = useState<UserAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    // Create modal
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Reset password modal
    const [resetTarget, setResetTarget] = useState<UserAccount | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    // View details modal
    const [viewingAccount, setViewingAccount] = useState<UserAccount | null>(null);

    // Use RBAC permission check instead of legacy Role string comparison
    const isAdmin = can('admin_accounts', 'view');

    const loadAccounts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await UserAccountService.getAll();
            setAccounts(data);
        } catch (err: any) {
            setError(err.message || 'Không thể tải danh sách tài khoản');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    // Filter and Sort
    const filtered = accounts.filter(a => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            a.username.toLowerCase().includes(s) ||
            a.full_name?.toLowerCase().includes(s) ||
            a.email?.toLowerCase().includes(s) ||
            a.phone?.toLowerCase().includes(s) ||
            a.department?.toLowerCase().includes(s)
        );
    }).sort((a, b) => {
        const sysRoleA = resolveSystemRole(a.role || 'Staff', a.position || '');
        const sysRoleB = resolveSystemRole(b.role || 'Staff', b.position || '');
        
        const priorityA = ALL_ROLES.indexOf(sysRoleA);
        const priorityB = ALL_ROLES.indexOf(sysRoleB);
        
        const pA = priorityA === -1 ? 99 : priorityA;
        const pB = priorityB === -1 ? 99 : priorityB;

        if (pA === pB) {
            return (a.full_name || '').localeCompare(b.full_name || '', 'vi');
        }
        return pA - pB;
    });

    // Toggle active
    const handleToggleActive = async (account: UserAccount) => {
        try {
            await UserAccountService.toggleActive(account.account_id, !account.is_active);
            logAuditEvent(
                !account.is_active ? 'ENABLE_ACCOUNT' : 'DISABLE_ACCOUNT',
                account.account_id,
                `Toggled active status for user ${account.username} to ${!account.is_active}`,
                currentUser?.EmployeeID
            );
            await loadAccounts();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // Delete account
    const handleDelete = async (account: UserAccount) => {
        if (!window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản của ${account.full_name || account.username}? Hành động này không thể hoàn tác.`)) return;
        try {
            await UserAccountService.delete(account.account_id);
            logAuditEvent(
                'DELETE_ACCOUNT',
                account.account_id,
                `Deleted user account ${account.username}`,
                currentUser?.EmployeeID
            );
            setAccounts(prev => prev.filter(a => a.account_id !== account.account_id));
        } catch (err: any) {
            setError(err.message || 'Lỗi khi xóa tài khoản');
        }
    };

    // Reset password
    const handleResetPassword = async () => {
        if (!resetTarget || !newPassword) return;
        try {
            await UserAccountService.resetPassword(resetTarget.account_id, newPassword);
            logAuditEvent(
                'RESET_PASSWORD',
                resetTarget.account_id,
                `Reset password for user ${resetTarget.username}`,
                currentUser?.EmployeeID
            );
            setResetTarget(null);
            setNewPassword('');
            await loadAccounts();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const openResetModal = (account: UserAccount) => {
        const pwd = UserAccountService.generatePassword();
        setNewPassword(pwd);
        setShowNewPassword(true);
        setCopiedPassword(false);
        setResetTarget(account);
    };

    const copyPassword = () => {
        navigator.clipboard.writeText(newPassword);
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
    };

    // Format date
    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-slate-400">
                <ShieldCheck className="w-16 h-16 mb-4 text-gray-300 dark:text-slate-600" />
                <h2 className="text-xl font-semibold mb-2">Không có quyền truy cập</h2>
                <p>Chỉ Admin mới có thể quản lý tài khoản người dùng.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">


            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-600/50">
                            <Users className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Tổng tài khoản</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{accounts.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/50">
                            <ToggleRight className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Đang hoạt động</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{accounts.filter(a => a.is_active).length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-800/50">
                            <ToggleLeft className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Đã tắt</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{accounts.filter(a => !a.is_active).length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-slate-800 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto text-xs underline">Đóng</button>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên, username, email, SĐT..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-gray-900 dark:text-slate-100"
                    />
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium shadow-sm shadow-primary-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all whitespace-nowrap"
                >
                    <UserPlus className="w-5 h-5" />
                    Tạo tài khoản
                </button>
            </div>

            {/* Table */}
            <div className="bg-bg-surface rounded-2xl border border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] overflow-hidden flex-1 flex flex-col min-h-0">
                {loading ? (
                    <div className="p-4 text-center text-gray-400">
                        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3" />
                        Đang tải...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 dark:text-slate-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        {search ? 'Không tìm thấy kết quả' : 'Chưa có tài khoản nào'}
                    </div>
                ) : (
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-sm relative">
                            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md z-10 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)] dark:shadow-[inset_0_-1px_0_0_rgba(51,65,85,1)]">
                                <tr>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">#</th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Nhân viên</th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Username</th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</div>
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> SĐT</div>
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Vai trò</th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Đăng nhập lần cuối</th>
                                    <th className="text-right px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                {filtered.map((account, idx) => (
                                    <tr 
                                        key={account.account_id} 
                                        onClick={() => setViewingAccount(account)}
                                        className="group transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer"
                                    >
                                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={account.full_name || account.username}
                                                    imageUrl={account.avatar_url}
                                                    size="sm"
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-slate-100">{account.full_name || '—'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400">{account.department || ''}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-md font-mono text-xs text-gray-700 dark:text-slate-300">
                                                {account.username}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-slate-400 text-xs">{account.email || '—'}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-slate-400 text-xs">{account.phone || '—'}</td>
                                        <td className="px-4 py-3">
                                            {(() => {
                                                const sysRole = resolveSystemRole(account.role || 'Staff', account.position || '');
                                                return (
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[sysRole] || 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                                                        {ROLE_LABELS[sysRole] || account.role || 'Staff'}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleToggleActive(account)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${account.is_active
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200'
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200'
                                                    }`}
                                                title={account.is_active ? 'Nhấn để tắt' : 'Nhấn để bật'}
                                            >
                                                {account.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                                                {account.is_active ? 'Hoạt động' : 'Đã tắt'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">
                                            {formatDate(account.last_login)}
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => openResetModal(account)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                                                >
                                                    <Key className="w-3.5 h-3.5" />
                                                    Reset MK
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(account)}
                                                    className="inline-flex items-center justify-center w-7 h-7 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Xóa tài khoản"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Ghi chú */}
            <div className="bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
                <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium mb-1">Hướng dẫn đăng nhập</p>
                        <p>Người dùng có thể đăng nhập bằng <strong>Username</strong>, <strong>Email</strong>, hoặc <strong>Số điện thoại</strong> kèm mật khẩu.</p>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateAccountModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        loadAccounts();
                    }}
                    createdBy={currentUser?.EmployeeID}
                />
            )}

            {/* Reset Password Modal */}
            {resetTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setResetTarget(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">Reset mật khẩu</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                            Đặt mật khẩu mới cho <strong>{resetTarget.full_name}</strong> ({resetTarget.username})
                        </p>

                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-24 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-gray-900 dark:text-slate-100"
                                    placeholder="Mật khẩu mới"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={copyPassword}
                                        className="p-1.5 text-gray-400 hover:text-primary-600"
                                        title="Copy mật khẩu"
                                    >
                                        {copiedPassword ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setNewPassword(UserAccountService.generatePassword());
                                    setCopiedPassword(false);
                                }}
                                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                            >
                                ↻ Sinh mật khẩu ngẫu nhiên
                            </button>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setResetTarget(null)}
                                className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleResetPassword}
                                disabled={!newPassword}
                                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-sm shadow-primary-500/25"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {viewingAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setViewingAccount(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-4">
                                <Avatar
                                    name={viewingAccount.full_name || viewingAccount.username}
                                    imageUrl={viewingAccount.avatar_url}
                                    size="lg"
                                    className="border-4 border-white dark:border-slate-800 shadow-sm"
                                />
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {viewingAccount.full_name || viewingAccount.username}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
                                        {viewingAccount.department || 'Chưa phân phòng'} • {viewingAccount.position || 'Nhân viên'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Username</span>
                                    <p className="font-mono text-sm font-medium text-gray-900 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block">
                                        {viewingAccount.username}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Phân quyền</span>
                                    <p className="text-sm font-medium text-gray-900 dark:text-slate-200">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${viewingAccount.role === 'Admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                            viewingAccount.role === 'Manager' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                                            }`}>
                                            {viewingAccount.role || 'Staff'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <ShieldCheck className="w-4 h-4 text-primary-500" />
                                    Bảo mật & Đăng nhập
                                </h3>
                                
                                <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                                    <div className="text-gray-500 dark:text-slate-400">Email:</div>
                                    <div className="font-medium text-gray-900 dark:text-slate-200">{viewingAccount.email || '—'}</div>
                                    
                                    <div className="text-gray-500 dark:text-slate-400">SĐT:</div>
                                    <div className="font-medium text-gray-900 dark:text-slate-200">{viewingAccount.phone || '—'}</div>
                                    
                                    <div className="text-gray-500 dark:text-slate-400">Đăng nhập cuối:</div>
                                    <div className="font-medium text-gray-900 dark:text-slate-200">{formatDate(viewingAccount.last_login)}</div>
                                    
                                    <div className="text-gray-500 dark:text-slate-400">Trạng thái:</div>
                                    <div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${viewingAccount.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                            {viewingAccount.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                                        </span>
                                    </div>
                                    
                                    <div className="text-gray-500 dark:text-slate-400 mt-2">Mật khẩu:</div>
                                    <div className="mt-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-lg tracking-widest text-slate-400">••••••••</span>
                                            <span className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                Đã mã hóa 1 chiều (Bảo mật)
                                            </span>
                                        </div>
                                        <p className="text-slate-500 mt-1 italic text-[11px]">
                                            * Hệ thống chỉ lưu mã băm (hash) của mật khẩu. Không ai có thể xem được mật khẩu gốc kể cả Admin. 
                                            Để cấp mật khẩu mới, vui lòng nhấn nút <strong className="text-primary-600 cursor-pointer" onClick={() => { setViewingAccount(null); openResetModal(viewingAccount); }}>Reset MK</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end">
                            <button
                                onClick={() => setViewingAccount(null)}
                                className="px-5 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================
// CREATE ACCOUNT MODAL
// ============================================================

interface CreateModalProps {
    onClose: () => void;
    onCreated: () => void;
    createdBy?: string;
}

const CreateAccountModal: React.FC<CreateModalProps> = ({ onClose, onCreated, createdBy }) => {
    const [employees, setEmployees] = useState<{ employee_id: string; full_name: string; email: string; phone: string; department: string }[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState(UserAccountService.generatePassword());
    const [showPassword, setShowPassword] = useState(true);
    const [copied, setCopied] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        UserAccountService.getEmployeesWithoutAccount().then(data => {
            setEmployees(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    // Auto-generate username from employee name
    useEffect(() => {
        if (!selectedEmployee) return;
        const emp = employees.find(e => e.employee_id === selectedEmployee);
        if (emp) {
            // Generate username from name: remove Vietnamese chars, join with dot
            const parts = emp.full_name.split(' ').filter(Boolean);
            if (parts.length >= 2) {
                const lastName = parts[parts.length - 1];
                const initials = parts.slice(0, -1).map(p => p.charAt(0)).join('');
                setUsername(`${removeVietnamese(lastName)}.${removeVietnamese(initials)}`.toUpperCase());
            } else {
                setUsername(removeVietnamese(emp.full_name).toUpperCase());
            }
        }
    }, [selectedEmployee, employees]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee || !username || !password) return;

        if (!selectedEmp?.email) {
            setError('Nhân viên này chưa có email trên hệ thống. Vui lòng cập nhật email trước.');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            await UserAccountService.create({
                employee_id: selectedEmployee,
                username,
                password,
                email: selectedEmp.email,
            }, createdBy);
            onCreated();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const copyPwd = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const selectedEmp = employees.find(e => e.employee_id === selectedEmployee);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                        <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Tạo tài khoản mới</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Gán tài khoản đăng nhập cho nhân viên</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Employee select */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Chọn nhân viên <span className="text-red-500">*</span>
                        </label>
                        {loading ? (
                            <div className="py-3 text-sm text-gray-400">Đang tải...</div>
                        ) : employees.length === 0 ? (
                            <div className="py-3 text-sm text-gray-400">Tất cả nhân viên đều đã có tài khoản</div>
                        ) : (
                            <select
                                value={selectedEmployee}
                                onChange={e => setSelectedEmployee(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-slate-100"
                                required
                            >
                                <option value="">-- Chọn nhân viên --</option>
                                {employees.map(emp => (
                                    <option key={emp.employee_id} value={emp.employee_id}>
                                        {emp.full_name} — {emp.department || 'Chưa phân phòng'}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Selected employee info */}
                    {selectedEmp && (
                        <div className="bg-primary-50 dark:bg-slate-800 border border-primary-100 dark:border-slate-700 rounded-xl p-3 text-sm">
                            <div className="flex items-center gap-2 text-primary-700 dark:text-primary-400">
                                <UserIcon className="w-4 h-4" />
                                <strong>{selectedEmp.full_name}</strong>
                            </div>
                            <div className="mt-1 space-y-0.5 text-primary-600/70 dark:text-primary-400/70 text-xs">
                                {selectedEmp.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedEmp.email}</p>}
                                {selectedEmp.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedEmp.phone}</p>}
                            </div>
                        </div>
                    )}

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Username <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-gray-900 dark:text-slate-100"
                                placeholder="VD: NGUYEN.VA"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Mật khẩu <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-11 pr-28 py-3 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-gray-900 dark:text-slate-100"
                                required
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1.5 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button type="button" onClick={copyPwd} className="p-1.5 text-gray-400 hover:text-primary-600" title="Copy">
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setPassword(UserAccountService.generatePassword()); setCopied(false); }}
                                    className="p-1.5 text-gray-400 hover:text-primary-600"
                                    title="Sinh mới"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Gửi mật khẩu này cho nhân viên. Người dùng có thể đổi sau.</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !selectedEmployee || !username || !password}
                            className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 shadow-sm shadow-primary-500/25"
                        >
                            {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============================================================
// HELPER
// ============================================================

function removeVietnamese(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9.]/g, '');
}

export default UserAccountManager;
