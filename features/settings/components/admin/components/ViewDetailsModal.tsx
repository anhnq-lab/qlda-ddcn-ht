import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Avatar } from '../../../../../components/ui';
import { UserAccount } from '../../../../../services/UserAccountService';
import { resolveSystemRole, ROLE_LABELS } from '../../../../../types/permission.types';

interface ViewDetailsModalProps {
    viewingAccount: UserAccount;
    onClose: () => void;
    onOpenResetModal: () => void;
}

export const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({ viewingAccount, onClose, onOpenResetModal }) => {
    // Format date
    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
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
                                {(() => {
                                    const sysRole = resolveSystemRole(viewingAccount.role || 'Staff', viewingAccount.position || '');
                                    return (
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            viewingAccount.role === 'Admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                            viewingAccount.role === 'Manager' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                            'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                                        }`}>
                                            {ROLE_LABELS[sysRole] || viewingAccount.role || 'Staff'}
                                        </span>
                                    );
                                })()}
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
                                    Để cấp mật khẩu mới, vui lòng nhấn nút <strong className="text-primary-600 cursor-pointer hover:underline" onClick={onOpenResetModal}>Reset MK</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
