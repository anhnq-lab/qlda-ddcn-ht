import React from 'react';
import {
    Clock, AlertTriangle, CheckCircle2, FileText,
    Info, XCircle, ChevronRight
} from 'lucide-react';
import { DbNotification } from '../../services/NotificationService';

interface NotificationItemProps {
    notification: DbNotification;
    onItemClick: (notif: DbNotification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onItemClick }) => {
    const { title, message, type, read_at, created_at, action_url } = notification;
    const isRead = !!read_at;

    // Get icon and color based on notification type
    const getIconConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: CheckCircle2,
                    colorClass: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20'
                };
            case 'warning':
                return {
                    icon: AlertTriangle,
                    colorClass: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20'
                };
            case 'error':
                return {
                    icon: XCircle,
                    colorClass: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/20'
                };
            case 'task':
                return {
                    icon: FileText,
                    colorClass: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20'
                };
            case 'approval':
                return {
                    icon: FileText,
                    colorClass: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/20'
                };
            default:
                return {
                    icon: Info,
                    colorClass: 'text-txt-secondary bg-bg-subtle'
                };
        }
    };

    const { icon: Icon, colorClass } = getIconConfig();

    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays === 1) return 'Hôm qua';
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div
            onClick={() => onItemClick(notification)}
            className={`px-4 py-3 flex gap-3 transition-colors cursor-pointer group ${
                isRead
                    ? 'bg-bg-surface hover:bg-bg-hover-row'
                    : 'bg-blue-50/30 hover:bg-blue-50/50 dark:bg-blue-950/10 dark:hover:bg-blue-950/20'
            } border-b border-border-subtle`}
        >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                <Icon className="w-4.5 h-4.5" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-bold leading-tight ${isRead ? 'text-txt-secondary' : 'text-txt-primary'}`}>
                        {title}
                    </p>
                    {!isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
                    )}
                </div>
                {message && (
                    <p className="text-xs text-txt-muted mt-1 line-clamp-2">
                        {message}
                    </p>
                )}
                <p className="text-[10px] text-txt-placeholder mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(created_at)}
                </p>
            </div>

            {action_url && (
                <ChevronRight className="w-4 h-4 text-txt-placeholder group-hover:text-txt-muted shrink-0 self-center transition-colors" />
            )}
        </div>
    );
};
