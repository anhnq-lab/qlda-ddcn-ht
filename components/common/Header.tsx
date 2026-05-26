import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, LogOut, Menu, ChevronDown, Sun, Moon, Leaf, User } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../notifications/NotificationBell';
import { useTheme } from '../../context/ThemeContext';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { UserProfilePanel } from '../../features/profile/UserProfilePanel';
import { Avatar } from '../ui';

interface HeaderProps {
    onOpenSearch: () => void;
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onMenuClick }) => {
    const { currentUser, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const { openPanel } = useSlidePanel();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Keyboard shortcut for search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                onOpenSearch();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onOpenSearch]);

    // Close user menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="layout-header h-16 bg-white dark:bg-slate-900 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-colors duration-200">
            {/* Left: Mobile menu + Search */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1">
                <button
                    onClick={onMenuClick}
                    aria-label="Mở menu điều hướng"
                    className="lg:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                    <Menu size={20} />
                </button>

                <div className="relative flex-1 max-w-md hidden sm:flex">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <button
                        onClick={onOpenSearch}
                        className="block w-full pl-10 pr-3 py-2 text-left border border-border rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-white dark:bg-slate-850 dark:hover:bg-slate-700 text-sm text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all cursor-pointer group shadow-lg"
                    >
                        Tìm kiếm dự án, dữ liệu...
                        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-300 rounded border border-border">
                            Ctrl+K
                        </kbd>
                    </button>
                </div>
                
                {/* Mobile Search Button */}
                <button
                    onClick={onOpenSearch}
                    aria-label="Tìm kiếm"
                    className="sm:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                    <Search size={20} />
                </button>
            </div>

            {/* Right: Filter Chips + Notifications + User Menu */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0">

                {/* Notifications */}
                <NotificationBell />

                <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

                {/* User Menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2.5 p-1.5 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                        <Avatar
                            name={currentUser?.FullName || 'User'}
                            imageUrl={currentUser?.AvatarUrl}
                            size="sm"
                            ringColor="ring-primary-100 dark:ring-primary-900/50"
                        />
                        <div className="hidden sm:block text-left max-w-[120px]">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate leading-tight">
                                {currentUser?.FullName || 'Khách'}
                            </p>
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                                {currentUser?.Department || 'Chức vụ'}
                            </p>
                        </div>
                        <ChevronDown size={14} className={`hidden sm:block text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                        <div className="user-dropdown absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        name={currentUser?.FullName || 'User'}
                                        imageUrl={currentUser?.AvatarUrl}
                                        size="md"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                            {currentUser?.FullName || 'Người dùng'}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                            {currentUser?.Email || 'user@company.com'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-700">
                                <button
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        openPanel({
                                            title: 'Hồ sơ cá nhân',
                                            component: <UserProfilePanel />,
                                            width: '50vw'
                                        });
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                >
                                    <User size={16} />
                                    Hồ sơ cá nhân
                                </button>
                            </div>

                            <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-700">
                                {/* Theme Toggle */}
                                <div className="px-2 py-2 flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Giao diện</span>
                                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                        <button
                                            onClick={() => setTheme('light')}
                                            title="Sáng"
                                            className={`flex items-center justify-center p-2 rounded-md transition-all cursor-pointer ${
                                                theme === 'light'
                                                    ? 'bg-white text-primary-600 shadow-lg border border-slate-200'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            <Sun size={16} />
                                        </button>
                                        <button
                                            onClick={() => setTheme('nature')}
                                            title="Bảo vệ mắt"
                                            className={`flex items-center justify-center p-2 rounded-md transition-all cursor-pointer ${
                                                theme === 'nature'
                                                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-lg border border-border dark:border-transparent'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            <Leaf size={16} />
                                        </button>
                                        <button
                                            onClick={() => setTheme('dark')}
                                            title="Tối"
                                            className={`flex items-center justify-center p-2 rounded-md transition-all cursor-pointer ${
                                                theme === 'dark'
                                                    ? 'bg-slate-800 dark:bg-slate-700 text-primary-400 shadow-lg'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            <Moon size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-2">
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                                >
                                    <LogOut size={16} />
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
