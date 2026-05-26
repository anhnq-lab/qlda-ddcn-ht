import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, Check, Trash2, BellOff, Filter,
    CheckCircle2, AlertTriangle, FileText, Info, XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
    useNotifications,
    useUnreadNotificationsCount,
    useMarkNotificationAsRead,
    useMarkAllNotificationsAsRead
} from '../../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { DbNotification } from '../../services/NotificationService';

export const NotificationPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const userId = currentUser?.EmployeeID;

    const [limit, setLimit] = useState(25);
    const [selectedType, setSelectedType] = useState<string>('all');

    const { data: notifications = [], isLoading } = useNotifications(userId, limit);
    const { data: unreadCount = 0 } = useUnreadNotificationsCount(userId);

    const markAsReadMutation = useMarkNotificationAsRead();
    const markAllAsReadMutation = useMarkAllNotificationsAsRead();

    // Filter notifications on the client side since we fetch by limit
    const filteredNotifications = notifications.filter(notif => {
        if (selectedType === 'all') return true;
        if (selectedType === 'unread') return !notif.read_at;
        return notif.type === selectedType;
    });

    const handleNotificationClick = async (notif: DbNotification) => {
        if (!notif.read_at) {
            await markAsReadMutation.mutateAsync(notif.id);
        }
        if (notif.action_url) {
            navigate(notif.action_url);
        }
    };

    const handleMarkAllRead = async () => {
        if (userId) {
            await markAllAsReadMutation.mutateAsync(userId);
        }
    };

    const handleLoadMore = () => {
        setLimit(prev => prev + 25);
    };

    const filterClass = (type: string) =>
        `px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            selectedType === type
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200/50 dark:shadow-primary-900/30'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-surface p-6 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Trung tâm thông báo</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Bạn có <span className="font-bold text-red-500">{unreadCount}</span> thông báo chưa đọc
                        </p>
                    </div>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-sm"
                    >
                        <Check className="w-4 h-4" />
                        Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            {/* Filter buttons */}
            <div className="bg-bg-surface p-3 rounded-2xl border border-border shadow-sm flex items-center gap-1.5 overflow-x-auto">
                <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedType('all')} className={filterClass('all')}>
                        Tất cả
                    </button>
                    <button onClick={() => setSelectedType('unread')} className={filterClass('unread')}>
                        Chưa đọc ({unreadCount})
                    </button>
                    <button onClick={() => setSelectedType('task')} className={filterClass('task')}>
                        Công việc
                    </button>
                    <button onClick={() => setSelectedType('approval')} className={filterClass('approval')}>
                        Phê duyệt
                    </button>
                    <button onClick={() => setSelectedType('warning')} className={filterClass('warning')}>
                        Cảnh báo
                    </button>
                    <button onClick={() => setSelectedType('success')} className={filterClass('success')}>
                        Thành công
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-850">
                {isLoading ? (
                    <div className="py-24 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="py-24 text-center flex flex-col items-center justify-center">
                        <BellOff className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Không tìm thấy thông báo</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                            Hiện tại không có thông báo nào thuộc bộ lọc đã chọn.
                        </p>
                    </div>
                ) : (
                    <>
                        {filteredNotifications.map(notif => (
                            <NotificationItem
                                key={notif.id}
                                notification={notif}
                                onItemClick={handleNotificationClick}
                            />
                        ))}

                        {notifications.length >= limit && (
                            <div className="p-4 flex justify-center bg-slate-50/50 dark:bg-slate-900/50">
                                <button
                                    onClick={handleLoadMore}
                                    className="px-6 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-border rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                                >
                                    Xem thêm thông báo
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default NotificationPage;
