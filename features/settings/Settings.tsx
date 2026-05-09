import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Leaf, ChevronRight, Palette, Bell, Shield, User, Users, ShieldCheck, LogOut, Grid, AlignJustify, ArrowDownFromLine, TableProperties } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import UserImpersonator from './UserImpersonator';

const Settings: React.FC = () => {
    const { theme, setTheme, density, setDensity, stickyHeader, setStickyHeader } = useTheme();
    const { currentUser, logout } = useAuth();

    // Only admin can impersonate
    const isAdmin = currentUser?.Role === 'Admin';

    const themeOptions = [
        {
            key: 'light' as const,
            label: 'Sáng',
            description: 'Nền trắng thuần, sắc nét',
            icon: Sun,
            preview: {
                bg: 'bg-white',
                sidebar: 'bg-slate-100',
                header: 'bg-white',
                card: 'bg-slate-100',
                text: 'bg-slate-300',
                accent: 'bg-blue-500',
            }
        },
        {
            key: 'nature' as const,
            label: 'Bảo vệ mắt',
            description: 'Nền cát ấm, giảm mỏi mắt',
            icon: Leaf,
            preview: {
                bg: 'bg-bg-surface',
                sidebar: 'bg-gray-100',
                header: 'bg-bg-surface',
                card: 'bg-bg-subtle',
                text: 'bg-gray-300',
                accent: 'bg-blue-500',
            }
        },
        {
            key: 'dark' as const,
            label: 'Tối',
            description: 'Nền đậm Navy, ban đêm',
            icon: Moon,
            preview: {
                bg: 'bg-slate-900',
                sidebar: 'bg-slate-800',
                header: 'bg-slate-800',
                card: 'bg-slate-700',
                text: 'bg-slate-400',
                accent: 'bg-blue-500',
            }
        },
    ];

    const settingSections = [
        { icon: User, label: 'Thông tin cá nhân', description: 'Cập nhật hồ sơ, ảnh đại diện', disabled: true },
        { icon: Bell, label: 'Thông báo', description: 'Cấu hình cảnh báo và email', disabled: true },
        { icon: Shield, label: 'Bảo mật', description: 'Đổi mật khẩu, xác thực 2 bước', disabled: true },
    ];

    return (
        <div className="max-w-[1400px] w-full lg:px-6">
            {/* Page Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Cài đặt</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Tùy chỉnh giao diện và cấu hình hệ thống</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="space-y-6 flex-1 w-full">
                    {/* Appearance Section */}
                    <div className="bg-bg-surface rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                                <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100">Giao diện</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">Chọn chế độ hiển thị phù hợp</p>
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {themeOptions.map(opt => {
                                    const isActive = theme === opt.key;
                                    return (
                                        <button
                                            key={opt.key}
                                            onClick={() => setTheme(opt.key)}
                                            className={`relative rounded-xl border-2 p-3 text-left transition-all duration-200 group ${isActive
                                                    ? opt.key === 'nature'
                                                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 ring-2 ring-emerald-200 dark:ring-emerald-800'
                                                        : 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800'
                                                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-bg-surface'
                                                }`}
                                        >
                                            {/* Mini Preview */}
                                            <div className={`${opt.preview.bg} rounded-lg border border-gray-200 dark:border-slate-600 p-2 mb-3 flex gap-1.5 h-16 overflow-hidden`}>
                                                <div className={`${opt.preview.sidebar} rounded w-5 flex flex-col gap-1 p-1`}>
                                                    <div className={`${opt.preview.accent} rounded-sm h-1`}></div>
                                                    <div className={`${opt.preview.text} rounded-sm h-1`}></div>
                                                    <div className={`${opt.preview.text} rounded-sm h-1`}></div>
                                                </div>
                                                <div className="flex-1 flex flex-col gap-1">
                                                    <div className={`${opt.preview.header} rounded h-2.5`}></div>
                                                    <div className="flex gap-1 flex-1">
                                                        <div className={`${opt.preview.card} rounded flex-1`}></div>
                                                        <div className={`${opt.preview.card} rounded flex-1`}></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Label */}
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${isActive
                                                        ? opt.key === 'nature'
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                                                            : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                                                    }`}>
                                                    <opt.icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${
                                                        isActive
                                                            ? opt.key === 'nature'
                                                                ? 'text-emerald-700 dark:text-emerald-300'
                                                                : 'text-blue-700 dark:text-blue-300'
                                                            : 'text-gray-800 dark:text-slate-100'
                                                        }`}>{opt.label}</p>
                                                    <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight mt-0.5">{opt.description}</p>
                                                </div>
                                            </div>

                                            {/* Active Indicator */}
                                            {isActive && (
                                                <div className={`absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center ${opt.key === 'nature' ? 'bg-emerald-500' : 'bg-primary-600'}`}>
                                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Data Display Settings */}
                    <div className="bg-bg-surface rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                                <TableProperties className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100">Hiển thị dữ liệu</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">Cách hiển thị bảng và danh sách</p>
                            </div>
                        </div>

                        <div className="p-4 space-y-6">
                            {/* Data Density */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-2">Mật độ dòng (Data Density)</h4>
                                <div className="flex bg-bg-subtle dark:bg-slate-900 rounded-xl max-w-sm p-1 border border-gray-200 dark:border-slate-700">
                                    <button
                                        onClick={() => setDensity('comfortable')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${density === 'comfortable'
                                                ? 'bg-bg-surface text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-slate-600'
                                                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        <AlignJustify className="w-4 h-4" />
                                        Tiêu chuẩn
                                    </button>
                                    <button
                                        onClick={() => setDensity('compact')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${density === 'compact'
                                                ? 'bg-bg-surface text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-slate-600'
                                                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        <Grid className="w-4 h-4" />
                                        Nén
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                                    {density === 'compact' ? 'Hiển thị nhiều dữ liệu hơn trên màn hình (để xem lướt).' : 'Khoảng cách thoáng hơn, dễ đọc các nội dung dài.'}
                                </p>
                            </div>

                            {/* Sticky Header */}
                            <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700 pt-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                                        <ArrowDownFromLine className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 dark:text-slate-100">Ghim tiêu đề bảng</h4>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">Luôn hiển thị Header khi cuộn xuống</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={stickyHeader}
                                        onChange={(e) => setStickyHeader(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-bg-surface after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Other Settings (Placeholder) */}
                    <div className="bg-bg-surface rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-100 dark:divide-slate-700">
                            {settingSections.map((section, idx) => (
                                <div key={idx} className="px-4 py-3 flex items-center justify-between opacity-60 cursor-not-allowed">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-bg-subtle dark:bg-slate-700 rounded-xl">
                                            <section.icon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-slate-100">{section.label}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">{section.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400 px-2 py-0.5 rounded-md uppercase">Sắp ra mắt</span>
                                        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-600" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Admin Section */}
                    {isAdmin && (
                        <div className="bg-bg-surface rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <Link
                                to="/admin"
                                className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-xl">
                                        <ShieldCheck className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-slate-100">Quản trị hệ thống</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">Quản lý tài khoản, phân quyền, cấu hình</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-slate-400" />
                            </Link>
                        </div>
                    )}

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="w-full bg-bg-surface rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden px-4 py-3 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 transition-colors group"
                    >
                        <div className="p-2 bg-bg-subtle dark:bg-slate-700 rounded-xl group-hover:bg-red-100 dark:group-hover:bg-red-900/40 transition-colors">
                            <LogOut className="w-5 h-5 text-gray-500 dark:text-slate-400 group-hover:text-red-500 transition-colors" />
                        </div>
                        <p className="text-sm font-bold text-gray-800 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Đăng xuất</p>
                    </button>
                </div>

                {/* Right Column: User Impersonator (Admin Only) */}
                {isAdmin && (
                    <div className="w-full lg:w-[500px] xl:w-[600px] 2xl:w-[700px] flex-shrink-0 relative">
                        <div className="bg-bg-surface rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm sticky top-6">
                            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                                    <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100">Giả làm người dùng</h3>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">Test phân quyền bằng cách đăng nhập với vai trò khác</p>
                                </div>
                            </div>
                            <div className="p-4">
                                <UserImpersonator />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;

