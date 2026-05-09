import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, LogOut, Menu, ChevronDown, Sun, Moon, Leaf } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from './NotificationCenter';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
    onOpenSearch: () => void;
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onMenuClick }) => {
    const { currentUser, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

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
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-16 bg-[#FCF9F2]/95 dark:bg-slate-900 backdrop-blur-md border-b border-[#ece7de] dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-colors duration-200">
            {/* Left: Mobile menu + Search */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1">
                <button
                    onClick={onMenuClick}
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
                        className="block w-full pl-10 pr-3 py-2 text-left border border-[#ece7de] dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-[#FCF9F2] dark:hover:bg-slate-700 text-sm text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all cursor-pointer group shadow-lg"
                    >
                        Tìm kiếm dự án, dữ liệu...
                        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#FCF9F2] dark:bg-slate-700 text-[10px] font-bold text-slate-400 dark:text-slate-300 rounded border border-[#ece7de] dark:border-slate-600">
                            Ctrl+K
                        </kbd>
                    </button>
                </div>
                
                {/* Mobile Search Button */}
                <button
                    onClick={onOpenSearch}
                    className="sm:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                    <Search size={20} />
                </button>
            </div>

            {/* Right: Notifications, User Menu */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                    >
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 min-w-[8px] h-[8px] flex items-center justify-center px-1 text-[10px] bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                    </button>
                    {isNotificationOpen && (
                        <div className="absolute top-full right-0 mt-2 z-50">
                            <NotificationCenter
                                isOpen={isNotificationOpen}
                                onClose={() => setIsNotificationOpen(false)}
                            />
                        </div>
                    )}
                </div>

                <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

                {/* User Menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2.5 p-1.5 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                        {currentUser?.AvatarUrl ? (
                            <img
                                src={currentUser.AvatarUrl}
                                alt={currentUser?.FullName || 'User'}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900/50"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center ring-2 ring-primary-100 dark:ring-primary-900/50 shadow-lg">
                                <span className="text-white text-xs font-bold">
                                    {currentUser?.FullName?.charAt(0) || 'U'}
                                </span>
                            </div>
                        )}
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
                        <div className="absolute right-0 top-full mt-2 w-72 bg-[#FCF9F2] dark:bg-slate-900 rounded-xl shadow-xl border border-[#ece7de] dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    {currentUser?.AvatarUrl ? (
                                        <img
                                            src={currentUser.AvatarUrl}
                                            alt={currentUser?.FullName || 'User'}
                                            className="w-10 h-10 rounded-full object-cover shrink-0"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shrink-0">
                                            <span className="text-white text-sm font-bold">
                                                {currentUser?.FullName?.charAt(0) || 'U'}
                                            </span>
                                        </div>
                                    )}
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

                            <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-800">
                                {/* Theme Toggle */}
                                <div className="px-2 py-2 flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Giao diện</span>
                                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                        <button
                                            onClick={() => setTheme('light')}
                                            title="Sáng (nền trắng)"
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                                theme === 'light'
                                                    ? 'bg-white text-primary-600 shadow-lg border border-slate-200'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            <Sun size={13} /> Sáng
                                        </button>
                                        <button
                                            onClick={() => setTheme('nature')}
                                            title="Bảo vệ mắt (nền cát)"
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                                theme === 'nature'
                                                    ? 'bg-[#FCF9F2] dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-lg border border-[#ece7de] dark:border-transparent'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            <Leaf size={13} /> Bảo mắt
                                        </button>
                                        <button
                                            onClick={() => setTheme('dark')}
                                            title="Tối (Navy)"
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                                theme === 'dark'
                                                    ? 'bg-slate-800 dark:bg-slate-700 text-primary-400 shadow-lg'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            <Moon size={13} /> Tối
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
