import React, { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck, ToggleLeft, ToggleRight, Search, AlertCircle,
    Users, UserPlus
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { usePermissionCheck } from '../../../../hooks/usePermissionCheck';
import { UserAccountService, UserAccount } from '../../../../services/UserAccountService';
import { supabase } from '../../../../lib/supabase';

// Subcomponents
import { UserAccountTable } from './components/UserAccountTable';
import { CreateAccountModal } from './components/CreateAccountModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { ViewDetailsModal } from './components/ViewDetailsModal';

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

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [resetTarget, setResetTarget] = useState<UserAccount | null>(null);
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
        // Simple priority sorting based on role
        const roleOrder: Record<string, number> = { Admin: 1, Director: 2, Manager: 3, Staff: 4 };
        const orderA = roleOrder[a.role || ''] || 99;
        const orderB = roleOrder[b.role || ''] || 99;

        if (orderA === orderB) {
            return (a.full_name || '').localeCompare(b.full_name || '', 'vi');
        }
        return orderA - orderB;
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
    const handleResetPassword = async (password: string) => {
        if (!resetTarget) return;
        try {
            await UserAccountService.resetPassword(resetTarget.account_id, password);
            logAuditEvent(
                'RESET_PASSWORD',
                resetTarget.account_id,
                `Reset password for user ${resetTarget.username}`,
                currentUser?.EmployeeID
            );
            setResetTarget(null);
            await loadAccounts();
        } catch (err: any) {
            setError(err.message || 'Lỗi khi đặt lại mật khẩu');
            throw err;
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-txt-muted">
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
                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-600/50">
                            <Users className="w-6 h-6 text-txt-muted" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-txt-muted">Tổng tài khoản</p>
                            <p className="text-2xl font-bold text-txt-primary mt-0.5">{accounts.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/50">
                            <ToggleRight className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-txt-muted">Đang hoạt động</p>
                            <p className="text-2xl font-bold text-txt-primary mt-0.5">{accounts.filter(a => a.is_active).length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-800/50">
                            <ToggleLeft className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-txt-muted">Đã tắt</p>
                            <p className="text-2xl font-bold text-txt-primary mt-0.5">{accounts.filter(a => !a.is_active).length}</p>
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
                        className="w-full pl-12 pr-4 py-3 bg-bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-txt-primary"
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
            <UserAccountTable
                loading={loading}
                filtered={filtered}
                search={search}
                onSetViewingAccount={setViewingAccount}
                onToggleActive={handleToggleActive}
                onOpenResetModal={setResetTarget}
                onDelete={handleDelete}
            />

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
                <ResetPasswordModal
                    resetTarget={resetTarget}
                    onClose={() => setResetTarget(null)}
                    onReset={handleResetPassword}
                />
            )}

            {/* View Details Modal */}
            {viewingAccount && (
                <ViewDetailsModal
                    viewingAccount={viewingAccount}
                    onClose={() => setViewingAccount(null)}
                    onOpenResetModal={() => {
                        const target = viewingAccount;
                        setViewingAccount(null);
                        setResetTarget(target);
                    }}
                />
            )}
        </div>
    );
};

export default UserAccountManager;
