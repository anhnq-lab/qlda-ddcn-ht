import React from 'react';
import { Users, Mail, Phone, ToggleRight, ToggleLeft, Key, Trash2 } from 'lucide-react';
import { Avatar } from '../../../../../components/ui';
import { UserAccount } from '../../../../../services/UserAccountService';
import { resolveSystemRole, ROLE_LABELS, ROLE_COLORS } from '../../../../../types/permission.types';

interface UserAccountTableProps {
    loading: boolean;
    filtered: UserAccount[];
    search: string;
    onSetViewingAccount: (account: UserAccount) => void;
    onToggleActive: (account: UserAccount) => Promise<void>;
    onOpenResetModal: (account: UserAccount) => void;
    onDelete: (account: UserAccount) => Promise<void>;
}

export const UserAccountTable: React.FC<UserAccountTableProps> = ({
    loading,
    filtered,
    search,
    onSetViewingAccount,
    onToggleActive,
    onOpenResetModal,
    onDelete
}) => {
    // Format date
    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
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
                                    onClick={() => onSetViewingAccount(account)}
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
                                            onClick={() => onToggleActive(account)}
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
                                                onClick={() => onOpenResetModal(account)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                                            >
                                                <Key className="w-3.5 h-3.5" />
                                                Reset MK
                                            </button>
                                            <button
                                                onClick={() => onDelete(account)}
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
    );
};
