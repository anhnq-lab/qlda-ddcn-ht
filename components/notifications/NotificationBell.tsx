import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUnreadNotificationsCount } from '../../hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';

export const NotificationBell: React.FC = () => {
    const { currentUser } = useAuth();
    const userId = currentUser?.EmployeeID;
    const { data: unreadCount = 0 } = useUnreadNotificationsCount(userId);
    const [isOpen, setIsOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative flex items-center" ref={bellRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Thông báo"
                className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[14px] h-[14px] flex items-center justify-center p-0.5 text-[8px] font-extrabold bg-red-500 text-white rounded-full border border-white dark:border-slate-900 shadow-sm animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            <NotificationDropdown
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </div>
    );
};
