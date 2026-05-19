import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { validatePasswordStrength } from '../../services/UserAccountService';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

// ============================================================
// ResetPassword — Trang đặt lại mật khẩu từ email link
// Route: /reset-password
// Được gọi khi user click link từ ForgotPasswordModal
// ============================================================

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [hasSession, setHasSession] = useState<boolean | null>(null);

    // Kiểm tra session (Supabase sẽ auto parse token từ URL hash)
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setHasSession(!!session);
        });

        // Lắng nghe event PASSWORD_RECOVERY
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setHasSession(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const strengthResult = validatePasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!strengthResult.valid) {
            setError(strengthResult.message || 'Mật khẩu không đủ mạnh');
            return;
        }
        if (password !== confirm) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setIsLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                setError(updateError.message || 'Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn.');
                return;
            }
            setIsSuccess(true);
            // Tự chuyển về login sau 3 giây
            setTimeout(() => navigate('/login', { replace: true }), 3000);
        } catch (err: any) {
            setError(err.message || 'Lỗi hệ thống');
        } finally {
            setIsLoading(false);
        }
    };

    // Đang kiểm tra session
    if (hasSession === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Session không hợp lệ (link hết hạn hoặc đã dùng)
    if (!hasSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Liên kết không hợp lệ</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Liên kết đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng. Vui lòng yêu cầu liên kết mới.
                    </p>
                    <button
                        onClick={() => navigate('/login', { replace: true })}
                        className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                    >
                        Quay về trang đăng nhập
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-sm shadow-primary-500/20">
                            <Lock className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Đặt mật khẩu mới</h1>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Tạo mật khẩu mới cho tài khoản của bạn.
                    </p>
                </div>

                <div className="p-8">
                    {isSuccess ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                                Đặt lại mật khẩu thành công!
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Đang chuyển về trang đăng nhập...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* New password */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Mật khẩu mới <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="block w-full px-4 py-3 pr-12 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                                        placeholder="Nhập mật khẩu mới"
                                        required
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Password strength indicators */}
                                {password.length > 0 && (
                                    <ul className="mt-2 space-y-1 text-xs">
                                        {[
                                            { ok: password.length >= 8, text: 'Ít nhất 8 ký tự' },
                                            { ok: /[A-Z]/.test(password), text: 'Có chữ hoa (A-Z)' },
                                            { ok: /[a-z]/.test(password), text: 'Có chữ thường (a-z)' },
                                            { ok: /[0-9]/.test(password), text: 'Có chữ số (0-9)' },
                                        ].map(({ ok, text }) => (
                                            <li key={text} className={`flex items-center gap-1.5 ${ok ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                <span className="text-base leading-none">{ok ? '✓' : '○'}</span>
                                                {text}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Confirm password */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={confirm}
                                        onChange={e => setConfirm(e.target.value)}
                                        className={`block w-full px-4 py-3 pr-12 border rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm ${
                                            confirm.length > 0 && confirm !== password
                                                ? 'border-red-300 dark:border-red-700'
                                                : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                        placeholder="Nhập lại mật khẩu"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirm.length > 0 && confirm !== password && (
                                    <p className="text-xs text-red-500 mt-1">Mật khẩu xác nhận không khớp</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !strengthResult.valid || password !== confirm}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm mt-2"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <>
                                        <span>Đặt mật khẩu mới</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/login', { replace: true })}
                                className="w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            >
                                ← Quay về trang đăng nhập
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
