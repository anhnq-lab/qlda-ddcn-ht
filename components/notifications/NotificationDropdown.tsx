import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, BellOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
    useNotifications,
    useUnreadNotificationsCount,
    useMarkNotificationAsRead,
    useMarkAllNotificationsAsRead
} from '../../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { DbNotification } from '../../services/NotificationService';

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const userId = currentUser?.EmployeeID;

    const { data: notifications = [], isLoading } = useNotifications(userId, 10);
    const { data: unreadCount = 0 } = useUnreadNotificationsCount(userId);

    const markAsReadMutation = useMarkNotificationAsRead();
    const markAllAsReadMutation = useMarkAllNotificationsAsRead();

    const handleNotificationClick = async (notif: DbNotification) => {
        if (!notif.read_at) {
            await markAsReadMutation.mutateAsync(notif.id);
        }
        if (notif.action_url) {
            navigate(notif.action_url);
            onClose();
        }
    };

    const handleMarkAllRead = async () => {
        if (userId) {
            await markAllAsReadMutation.mutateAsync(userId);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 cursor-default" onClick={onClose} />

            {/* Dropdown Card */}
            <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header */}
                <div className="px-4 py-3.5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Thông báo</span>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-red-500 text-white rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="p-1.5 text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Đánh dấu tất cả đã đọc"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* List Container */}
                <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center">
                            <BellOff className="w-10 h-10 mb-3 text-slate-350 dark:text-slate-600" />
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Không có thông báo mới</p>
                        </div>
                    ) : (
                        notifications.map(notif => (
                            <NotificationItem
                                key={notif.id}
                                notification={notif}
                                onItemClick={handleNotificationClick}
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center">
                    <button
                        onClick={() => {
                            navigate('/notifications');
                            onClose();
                        }}
                        className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors cursor-pointer"
                    >
                        Xem tất cả thông báo
                    </button>
                </div>
            </div>
        </>
    );
};
