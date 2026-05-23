import React, { useState } from 'react';
import { EyeOff, Eye, Check, Copy } from 'lucide-react';
import { UserAccountService } from '../../../../../services/UserAccountService';
import { UserAccount } from '../../../../../services/UserAccountService';

interface ResetPasswordModalProps {
    resetTarget: UserAccount;
    onClose: () => void;
    onReset: (password: string) => Promise<void>;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ resetTarget, onClose, onReset }) => {
    const [newPassword, setNewPassword] = useState(UserAccountService.generatePassword());
    const [showNewPassword, setShowNewPassword] = useState(true);
    const [copiedPassword, setCopiedPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const copyPassword = () => {
        navigator.clipboard.writeText(newPassword);
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
    };

    const handleConfirm = async () => {
        if (!newPassword) return;
        setSubmitting(true);
        setError('');
        try {
            await onReset(newPassword);
        } catch (err: any) {
            setError(err.message || 'Lỗi khi reset mật khẩu');
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">Reset mật khẩu</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                    Đặt mật khẩu mới cho <strong>{resetTarget.full_name}</strong> ({resetTarget.username})
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                        {error}
                    </div>
                )}

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
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!newPassword || submitting}
                        className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-sm shadow-primary-500/25"
                    >
                        {submitting ? 'Đang cập nhật...' : 'Xác nhận'}
                    </button>
                </div>
            </div>
        </div>
    );
};
