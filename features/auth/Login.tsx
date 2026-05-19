import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Lock, User, Eye, EyeOff, LayoutDashboard, BrainCircuit, ShieldCheck, Smartphone, Sun, Moon, Timer } from 'lucide-react';
import { LogoDDCN } from '../../components/common/LogoDDCN';
import { useLoginRateLimit } from './useLoginRateLimit';
import ForgotPasswordModal from './ForgotPasswordModal';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);

    const { isLocked, secondsRemaining, attemptCount, canAttempt, recordFailedAttempt, resetAttempts } = useLoginRateLimit();
    
    const { login, isAuthenticated } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // Auto-redirect if already authenticated (e.g. via Dev Auto Login or persistent session)
    React.useEffect(() => {
        if (isAuthenticated) {
            const from = (location.state as any)?.from || '/';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Brute-force guard
        if (!canAttempt) {
            setError(`Tài khoản tạm khóa. Vui lòng chờ ${secondsRemaining} giây.`);
            return;
        }

        if (!username.trim() || !password.trim()) {
            setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
            return;
        }

        setIsLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 400));

            const success = await login(username.trim(), password);
            if (success) {
                resetAttempts();
                const from = (location.state as any)?.from || '/dashboard';
                navigate(from, { replace: true });
            } else {
                recordFailedAttempt();
                const remaining = 5 - (attemptCount + 1);
                if (remaining <= 0) {
                    setError('Quá nhiều lần thử. Tài khoản bị tạm khóa 60 giây.');
                } else {
                    setError(`Tên đăng nhập hoặc mật khẩu không đúng. Còn ${remaining} lần thử.`);
                }
                setIsLoading(false);
            }
        } catch (err: any) {
            console.error('[Login Error]', err);
            setError('Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-[#FAFAF8] dark:bg-[#060A14] text-slate-800 dark:text-slate-100 font-sans selection:bg-primary-500/30 transition-colors duration-300 relative">
            {/* Theme Toggle Button */}
            <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="absolute top-6 right-6 lg:right-10 z-50 p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 backdrop-blur-md border border-slate-200/80 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-sm group"
                title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
            >
                {theme === 'dark' ? <Sun className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-500" />}
            </button>

            {/* ─── LEFT COLUMN: BRANDING & FEATURES (Hidden on Mobile) ─── */}
            <div className="hidden lg:flex w-1/2 flex-col justify-between relative overflow-hidden bg-[#F2EDE4] dark:bg-[#0A101D] border-r border-[#E8E1D5] dark:border-white/5 p-12 xl:p-20 transition-colors duration-300">
                {/* Background ambient accents - CIC style */}
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-slate-50 dark:bg-white/[0.02] blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-500/5 dark:bg-primary-500/[0.03] blur-[100px] pointer-events-none" />
                
                {/* Diagonal lines pattern / Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 100% 100%, #ffffff 1px, transparent 1px)', backgroundSize: '48px 48px' }}></div>

                {/* Top Branding */}
                <div className="relative z-10 flex items-center gap-4">
                    <LogoDDCN className="w-[64px] h-[64px] drop-shadow-md" />
                    <div>
                        <div className="font-black tracking-widest text-[18px] uppercase text-slate-900 dark:text-white leading-tight">
                            Smart<span className="text-primary-600 dark:text-primary-500">PM</span>
                        </div>
                        <div className="text-[12px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase mt-1">
                            Project Management Info System
                        </div>
                    </div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 mt-12 mb-8 xl:mt-0 xl:mb-0">
                    <h1 className="text-4xl xl:text-5xl font-black leading-[1.15] tracking-tight">
                        Quản trị <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-500 dark:to-primary-300">
                            thông minh.
                        </span>
                    </h1>
                    <p className="mt-4 text-base xl:text-lg text-slate-600 dark:text-slate-400 font-medium max-w-sm">
                        Tối ưu tiến độ giải ngân, kiểm soát chặt chẽ ngân sách đầu tư công.
                    </p>

                    {/* Feature List - CIC Style Cards */}
                    <div className="mt-12 space-y-3 w-full xl:pr-12">
                        {/* Feature 1 */}
                        <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/50 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/[0.06] transition-all duration-300">
                            <div className="text-primary-600 dark:text-primary-500 flex-shrink-0 opacity-90">
                                <LayoutDashboard className="w-[22px] h-[22px]" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">Biểu đồ trực quan</h3>
                                <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">Dashboard phân tích tiến độ, vốn theo thời gian thực</p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/50 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/[0.06] transition-all duration-300">
                            <div className="text-primary-600 dark:text-primary-500 flex-shrink-0 opacity-90">
                                <BrainCircuit className="w-[22px] h-[22px]" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">AI phân tích thông minh</h3>
                                <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">Tự động phát hiện xu hướng và đề xuất chiến lược tối ưu</p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/50 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/[0.06] transition-all duration-300">
                            <div className="text-primary-600 dark:text-primary-500 flex-shrink-0 opacity-90">
                                <Smartphone className="w-[22px] h-[22px]" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">Đa nền tảng đám mây</h3>
                                <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">Truy cập mượt mà trên desktop, tablet và điện thoại di động</p>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/50 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/[0.06] transition-all duration-300">
                            <div className="text-primary-600 dark:text-primary-500 flex-shrink-0 opacity-90">
                                <ShieldCheck className="w-[22px] h-[22px]" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">Bảo mật cấp chính phủ</h3>
                                <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">Phân quyền chi tiết (RBAC), kiểm soát truy cập theo vai trò</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="relative z-10 flex items-center gap-5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                    <span>Phiên bản 2.5</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    <span>Bảo mật SSL 256-bit</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 99.9% Uptime</span>
                </div>
            </div>

            {/* ─── RIGHT COLUMN: LOGIN FORM ─── */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 sm:p-12 relative bg-white dark:bg-slate-800 dark:bg-[#060A14] transition-colors duration-300">
                <div className="w-full max-w-[420px] lg:-mt-16">
                    
                    {/* Logo & Headers */}
                    <div className="flex flex-col items-center text-center mb-5 w-full">
                        <LogoDDCN className="w-[210px] h-auto drop-shadow-2xl dark:drop-shadow-[0_0_30px_rgba(255,255,255,0.03)] mb-2 transition-transform hover:scale-105 duration-500" />
                        <h2 className="text-[13px] sm:text-[14px] font-bold tracking-[0.15em] uppercase text-slate-600 dark:text-slate-400 mb-0.5 flex justify-center w-full">
                            Ban Quản Lý Dự Án ĐTXD Công Trình
                        </h2>
                        <h3 className="text-[20px] sm:text-[22px] font-black tracking-wider uppercase leading-snug flex justify-center w-full">
                            <span className="text-primary-600 dark:text-primary-500">DÂN DỤNG</span>
                            <span className="text-primary-700 dark:text-primary-600 mx-2">VÀ</span>
                            <span className="text-primary-800 dark:text-primary-700">HẠ TẦNG KHU VỰC</span>
                        </h3>
                        <p className="mt-0.5 text-[11px] font-bold text-slate-400 dark:text-slate-400 tracking-[0.2em] uppercase flex justify-center w-full">
                            UBND Tỉnh Hà Tĩnh
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-white/5"></div>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-400 tracking-widest uppercase">Đăng nhập ngay</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-800"></div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {error && (
                            <div className="p-3 bg-red-50/50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-500/20 flex items-center justify-center text-center animate-in fade-in">
                                {error}
                            </div>
                        )}

                        {/* Lockout Banner */}
                        {isLocked && (
                            <div className="p-3 bg-warning-50/80 dark:bg-warning-500/10 text-warning-700 dark:text-warning-400 text-sm font-medium rounded-xl border border-warning-200 dark:border-warning-500/20 flex items-center gap-2 animate-in fade-in">
                                <Timer className="w-4 h-4 flex-shrink-0" />
                                <span>Tài khoản tạm khóa. Mở khóa sau <strong>{secondsRemaining}s</strong></span>
                            </div>
                        )}

                        {/* Username Input */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                                <User className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="Tài khoản hoặc Email"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                disabled={isLocked || isLoading}
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-800 rounded-xl focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-500 transition-all text-sm font-medium placeholder-slate-400 text-slate-800 dark:text-slate-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                autoFocus
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Mật khẩu"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={isLocked || isLoading}
                                className="w-full pl-11 pr-12 py-3 bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-800 rounded-xl focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-500 transition-all text-sm font-medium placeholder-slate-400 text-slate-800 dark:text-slate-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="flex justify-between items-center pt-1 pb-2 px-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-[#D6CEBF] dark:border-slate-700 text-primary-600 focus:ring-primary-500 dark:bg-slate-800" />
                                <span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Ghi nhớ đăng nhập</span>
                            </label>
                            
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(true)}
                                className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400 transition-colors"
                            >
                                Quên mật khẩu?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || isLocked}
                            className="relative w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm border border-transparent"
                        >
                            {isLocked ? (
                                <>
                                    <Timer className="w-4 h-4" />
                                    <span>Mở khóa sau {secondsRemaining}s</span>
                                </>
                            ) : isLoading ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <span>Đăng nhập hệ thống</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            © 2026 Ban QLDA đầu tư xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh. <br className="sm:hidden" />All rights reserved.
                        </p>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal 
                isOpen={showForgotModal} 
                onClose={() => setShowForgotModal(false)} 
            />
        </div>
    );
};

export default Login;
