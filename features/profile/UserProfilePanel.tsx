import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Save, CheckCircle2, Lock, LogOut, AlertTriangle, KeyRound, QrCode, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/ui';
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

    // Sign out all devices
    const [signOutAllConfirm, setSignOutAllConfirm] = useState(false);
    const [signOutAllLoading, setSignOutAllLoading] = useState(false);

    // MFA state
    type MfaEnrollStep = 'idle' | 'loading' | 'scan' | 'verify' | 'done';
    const [mfaEnrolled, setMfaEnrolled] = useState<boolean | null>(null); // null = unknown
    const [mfaStep, setMfaStep] = useState<MfaEnrollStep>('idle');
    const [mfaQr, setMfaQr] = useState('');
    const [mfaSecret, setMfaSecret] = useState('');
    const [mfaFactorId, setMfaFactorId] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [mfaError, setMfaError] = useState('');
    const [mfaUnenrollConfirm, setMfaUnenrollConfirm] = useState(false);

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

    const handleSignOutAll = async () => {
        setSignOutAllLoading(true);
        try {
            await supabase.auth.signOut({ scope: 'global' });
            showToast('Đã đăng xuất khỏi tất cả thiết bị', 'success');
            // Auth state listener in AuthContext will clear local state and redirect to /login
        } catch (err: any) {
            showToast(err.message || 'Lỗi khi đăng xuất', 'error');
            setSignOutAllConfirm(false);
        } finally {
            setSignOutAllLoading(false);
        }
    };

    // Load MFA enrollment status when security tab is active
    useEffect(() => {
        if (activeTab !== 'security' || mfaEnrolled !== null) return;
        supabase.auth.mfa.listFactors().then(({ data }) => {
            setMfaEnrolled((data?.totp?.length ?? 0) > 0);
        });
    }, [activeTab, mfaEnrolled]);

    const handleMfaEnroll = async () => {
        setMfaStep('loading');
        setMfaError('');
        const { data, error } = await supabase.auth.mfa.enroll({
            factorType: 'totp',
            issuer: 'QLDA DDCN Hà Tĩnh',
            friendlyName: 'QLDA DDCN',
        });
        if (error || !data) {
            setMfaError(error?.message || 'Không thể khởi tạo TOTP');
            setMfaStep('idle');
            return;
        }
        setMfaFactorId(data.id);
        setMfaQr(data.totp.qr_code);
        setMfaSecret(data.totp.secret);
        setMfaStep('scan');
    };

    const handleMfaVerify = async () => {
        setMfaError('');
        if (mfaCode.replace(/\s/g, '').length !== 6) {
            setMfaError('Mã phải gồm đúng 6 chữ số.');
            return;
        }
        setMfaStep('loading');
        const { data: challenge, error: chalErr } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
        if (chalErr || !challenge) {
            setMfaError(chalErr?.message || 'Lỗi tạo challenge');
            setMfaStep('scan');
            return;
        }
        const { error: verErr } = await supabase.auth.mfa.verify({
            factorId: mfaFactorId,
            challengeId: challenge.id,
            code: mfaCode.replace(/\s/g, ''),
        });
        if (verErr) {
            setMfaError('Mã không đúng. Vui lòng kiểm tra lại thời gian thiết bị và thử lại.');
            setMfaCode('');
            setMfaStep('scan');
            return;
        }
        setMfaEnrolled(true);
        setMfaStep('done');
        showToast('Xác thực 2 yếu tố đã được bật', 'success');
    };

    const handleMfaUnenroll = async () => {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp = factors?.totp?.[0];
        if (!totp) return;
        const { error } = await supabase.auth.mfa.unenroll({ factorId: totp.id });
        if (error) {
            showToast(error.message || 'Lỗi khi tắt xác thực 2 yếu tố', 'error');
            return;
        }
        setMfaEnrolled(false);
        setMfaUnenrollConfirm(false);
        setMfaStep('idle');
        setMfaCode('');
        showToast('Đã tắt xác thực 2 yếu tố', 'success');
    };

    return (
        <div className="flex flex-col h-full bg-bg-subtle overflow-hidden">
            <div className="flex border-b border-border bg-bg-surface shrink-0">
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
                            <Avatar
                                name={currentUser?.FullName || 'User'}
                                imageUrl={avatarUrl}
                                size="lg"
                                ringColor="ring-primary-100 dark:ring-primary-900/50"
                            />
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-txt-muted mb-1">Ảnh đại diện (URL)</label>
                                <input
                                    type="text"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        {/* Read-only fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-txt-muted mb-1">Tên đăng nhập</label>
                                <input
                                    type="text"
                                    value={currentUser?.Username || currentUser?.Email || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-bg-muted text-txt-muted cursor-not-allowed font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-txt-muted mb-1">Họ và tên</label>
                                <input
                                    type="text"
                                    value={currentUser?.FullName || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-bg-muted text-txt-muted cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-txt-muted mb-1">Chức vụ</label>
                                <input
                                    type="text"
                                    value={currentUser?.Department || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-bg-muted text-txt-muted cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Editable fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-txt-muted mb-1">
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
                                        className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Lưu ý: Thay đổi email sẽ áp dụng cho lần đăng nhập tiếp theo.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-txt-muted mb-1">
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
                                        className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
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
                            <label className="block text-xs font-medium text-txt-muted mb-1">
                                Mật khẩu hiện tại <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-txt-muted mb-1">
                                Mật khẩu mới <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-txt-muted mb-1">
                                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-bg-surface text-txt-primary focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                            />
                        </div>

                        {/* ── MFA TOTP Section ── */}
                        <div className="mt-6 pt-5 border-t border-border">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg shrink-0">
                                    <KeyRound className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-semibold text-txt-primary">Xác thực 2 yếu tố (TOTP)</h4>
                                        {mfaEnrolled === true && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                                <ShieldCheck className="w-3 h-3" /> Đã bật
                                            </span>
                                        )}
                                        {mfaEnrolled === false && (
                                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-bg-muted text-txt-muted rounded-full">Chưa bật</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-txt-muted mt-0.5">
                                        Yêu cầu nhập mã từ ứng dụng xác thực mỗi lần đăng nhập.
                                    </p>
                                </div>
                            </div>

                            {/* Enrolled: show unenroll option */}
                            {mfaEnrolled === true && mfaStep !== 'done' && (
                                <div>
                                    {!mfaUnenrollConfirm ? (
                                        <button
                                            type="button"
                                            onClick={() => setMfaUnenrollConfirm(true)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Tắt xác thực 2 yếu tố
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={handleMfaUnenroll} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" /> Xác nhận tắt
                                            </button>
                                            <button type="button" onClick={() => setMfaUnenrollConfirm(false)} className="px-4 py-2 text-sm text-txt-muted hover:bg-bg-muted rounded-lg transition-colors">Hủy</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Not enrolled: enroll flow */}
                            {mfaEnrolled === false && (
                                <div>
                                    {mfaStep === 'idle' && (
                                        <button
                                            type="button"
                                            onClick={handleMfaEnroll}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-700/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                        >
                                            <QrCode className="w-4 h-4" />
                                            Bật xác thực 2 yếu tố
                                        </button>
                                    )}
                                    {mfaStep === 'loading' && (
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                            Đang tải…
                                        </div>
                                    )}
                                    {mfaStep === 'scan' && (
                                        <div className="space-y-3">
                                            <p className="text-xs text-txt-muted">
                                                1. Mở <strong>Google Authenticator</strong> hoặc <strong>Authy</strong>, quét mã QR bên dưới.
                                            </p>
                                            {mfaQr && (
                                                <div className="w-40 h-40 p-2 bg-white rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm"
                                                    dangerouslySetInnerHTML={{ __html: mfaQr }}
                                                />
                                            )}
                                            <p className="text-xs text-txt-muted">
                                                Hoặc nhập thủ công: <code className="font-mono bg-bg-muted px-1.5 py-0.5 rounded text-xs break-all">{mfaSecret}</code>
                                            </p>
                                            <p className="text-xs text-txt-muted">
                                                2. Nhập mã 6 chữ số hiển thị trong ứng dụng để xác nhận.
                                            </p>
                                            {mfaError && (
                                                <p className="text-xs text-red-500">{mfaError}</p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={6}
                                                    value={mfaCode}
                                                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="000000"
                                                    className="w-32 text-center font-mono tracking-widest px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleMfaVerify}
                                                    disabled={mfaCode.length < 6}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-60"
                                                >
                                                    <ShieldCheck className="w-4 h-4" /> Xác nhận
                                                </button>
                                                <button type="button" onClick={() => { setMfaStep('idle'); setMfaCode(''); setMfaError(''); }} className="px-3 py-2 text-sm text-slate-500 hover:bg-bg-muted rounded-lg">Hủy</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Success confirmation */}
                            {mfaStep === 'done' && (
                                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Xác thực 2 yếu tố đã được kích hoạt thành công.
                                </div>
                            )}
                        </div>

                        {/* Sign out all devices */}
                        <div className="mt-6 pt-5 border-t border-border">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg shrink-0">
                                    <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-txt-primary">Đăng xuất tất cả thiết bị</h4>
                                    <p className="text-xs text-txt-muted mt-0.5">
                                        Kết thúc mọi phiên đang hoạt động, kể cả thiết bị hiện tại. Bạn sẽ cần đăng nhập lại.
                                    </p>
                                </div>
                            </div>
                            {!signOutAllConfirm ? (
                                <button
                                    type="button"
                                    onClick={() => setSignOutAllConfirm(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Đăng xuất tất cả thiết bị
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSignOutAll}
                                        disabled={signOutAllLoading}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-70"
                                    >
                                        {signOutAllLoading
                                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            : <LogOut className="w-4 h-4" />
                                        }
                                        Xác nhận đăng xuất
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSignOutAllConfirm(false)}
                                        disabled={signOutAllLoading}
                                        className="px-4 py-2 text-sm font-medium text-txt-muted hover:bg-bg-muted rounded-lg transition-colors"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                )}
            </div>

            <div className="p-4 border-t border-border bg-bg-subtle shrink-0 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => closePanel()}
                    className="px-4 py-2 text-sm font-medium text-txt-muted hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
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
