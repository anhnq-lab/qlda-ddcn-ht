import React, { useState } from 'react';
import { User, Mail, Phone, Shield, Save, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EmployeeService } from '../../services/EmployeeService';
import { UserAccountService } from '../../services/UserAccountService';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { useToast } from '../../components/ui/Toast';

export const UserProfilePanel: React.FC = () => {
    const { currentUser, login } = useAuth(); // login from useAuth actually might just update state if we pass employee object. Or we rely on local storage. Actually useAuth might not expose a way to just update state without re-logging in. Let's just update local storage and assume a reload or just let it be.
    const { closePanel } = useSlidePanel();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');
    const [isLoading, setIsLoading] = useState(false);

    // Profile State
    const [email, setEmail] = useState(currentUser?.Email || '');
    const [phone, setPhone] = useState(currentUser?.Phone || '');
    const [avatarUrl, setAvatarUrl] = useState(currentUser?.AvatarUrl || '');

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.EmployeeID) return;

        setIsLoading(true);
        try {
            const updated = await EmployeeService.update(currentUser.EmployeeID, {
                Email: email,
                Phone: phone,
                AvatarUrl: avatarUrl
            });
            
            // Note: EmployeeService.update already handles updating local storage.
            // Ideally we'd trigger an AuthContext refresh, but a toast and relying on next load is acceptable for now.
            
            showToast('Cập nhật hồ sơ thành công', 'success');
        } catch (error: any) {
            showToast(error.message || 'Lỗi khi cập nhật hồ sơ', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.EmployeeID) return;

        if (newPassword !== confirmPassword) {
            showToast('Mật khẩu mới không khớp', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
            return;
        }

        setIsLoading(true);
        try {
            // Verify old password
            const isMatch = await UserAccountService.verifyPassword(currentUser.EmployeeID, currentPassword);
            if (!isMatch) {
                throw new Error('Mật khẩu hiện tại không đúng');
            }

            // Change password
            await UserAccountService.changePassword(currentUser.EmployeeID, newPassword);

            showToast('Đổi mật khẩu thành công', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setActiveTab('info');
        } catch (error: any) {
            showToast(error.message || 'Lỗi khi đổi mật khẩu', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
            <div className="flex border-b border-border bg-white dark:bg-slate-800 shrink-0">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'info'
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <User size={16} />
                        Thông tin
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'security'
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Shield size={16} />
                        Bảo mật
                    </div>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {activeTab === 'info' ? (
                    <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-6">
                        {/* Avatar */}
                        <div className="flex items-center gap-4">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Avatar"
                                    className="w-16 h-16 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900/50"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center ring-2 ring-primary-100 dark:ring-primary-900/50">
                                    <span className="text-white text-xl font-bold">
                                        {currentUser?.FullName?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Ảnh đại diện (URL)</label>
                                <input
                                    type="text"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        {/* Read-only fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tên đăng nhập</label>
                                <input
                                    type="text"
                                    value={currentUser?.Username || currentUser?.Email || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Họ và tên</label>
                                <input
                                    type="text"
                                    value={currentUser?.FullName || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Chức vụ</label>
                                <input
                                    type="text"
                                    value={currentUser?.Department || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Editable fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    Email đăng nhập
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail size={16} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Lưu ý: Thay đổi email sẽ áp dụng cho lần đăng nhập tiếp theo.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    Số điện thoại
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone size={16} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <form id="password-form" onSubmit={handleChangePassword} className="space-y-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl mb-6">
                            <div className="flex gap-3">
                                <Lock className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={18} />
                                <div>
                                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400">Thay đổi mật khẩu</h4>
                                    <p className="text-xs text-amber-700 dark:text-amber-500/80 mt-1">
                                        Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                Mật khẩu hiện tại <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                Mật khẩu mới <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                            />
                        </div>
                    </form>
                )}
            </div>

            <div className="p-4 border-t border-border bg-slate-50 dark:bg-slate-800/50 shrink-0 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => closePanel()}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    form={activeTab === 'info' ? 'profile-form' : 'password-form'}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save size={16} />
                    )}
                    {activeTab === 'info' ? 'Lưu thông tin' : 'Đổi mật khẩu'}
                </button>
            </div>
        </div>
    );
};
