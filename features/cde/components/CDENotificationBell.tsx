import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, ExternalLink, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';

interface AppNotification {
    id: string;
    title: string;
    message: string | null;
    type: 'info' | 'warning' | 'error' | 'success' | 'task' | 'approval';
    read_at: string | null;
    action_url: string | null;
    created_at: string;
}

const TYPE_DOT: Record<string, string> = {
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    success: 'bg-emerald-500',
    task: 'bg-purple-500',
    approval: 'bg-orange-500',
};

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    return `${Math.floor(hrs / 24)} ngày trước`;
}

const CDENotificationBell: React.FC = () => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data: notifications = [] } = useQuery({
        queryKey: ['cde-notifications', currentUser?.EmployeeID],
        queryFn: async () => {
            if (!currentUser?.EmployeeID) return [];
            const { data } = await (supabase as any)
                .from('notifications')
                .select('id, title, message, type, read_at, action_url, created_at')
                .eq('user_id', currentUser.EmployeeID)
                .order('created_at', { ascending: false })
                .limit(30);
            return (data || []) as AppNotification[];
        },
        enabled: !!currentUser?.EmployeeID,
        refetchInterval: 60_000,
    });

    const unreadCount = notifications.filter(n => !n.read_at).length;

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const markAllRead = async () => {
        const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
        if (!unreadIds.length) return;
        await (supabase as any)
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadIds);
        queryClient.invalidateQueries({ queryKey: ['cde-notifications', currentUser?.EmployeeID] });
    };

    const markOneRead = async (id: string) => {
        await (supabase as any)
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id);
        queryClient.invalidateQueries({ queryKey: ['cde-notifications', currentUser?.EmployeeID] });
    };

    const handleNotifClick = (n: AppNotification) => {
        if (!n.read_at) markOneRead(n.id);
        if (n.action_url) {
            setOpen(false);
            window.location.href = n.action_url;
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className={`relative p-2.5 rounded-xl transition-all ${
                    open
                        ? 'bg-bg-muted text-txt-secondary'
                        : 'text-txt-muted hover:bg-bg-muted'
                }`}
                title="Thông báo"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-96 max-h-[500px] bg-bg-surface rounded-2xl shadow-xl border border-border flex flex-col z-[200] animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-txt-primary">Thông báo</h3>
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                >
                                    <CheckCheck className="w-3 h-3" /> Đọc tất cả
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notification list */}
                    <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-14 text-center">
                                <Bell className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-sm text-txt-placeholder">Không có thông báo nào</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotifClick(n)}
                                    className={`px-4 py-3 border-b border-gray-50 dark:border-slate-700/40 flex gap-3 cursor-pointer transition-colors hover:bg-bg-hover-row/50 ${
                                        !n.read_at ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                                    }`}
                                >
                                    <div className="flex flex-col items-center gap-1 shrink-0 mt-1.5">
                                        <div className={`w-2 h-2 rounded-full ${!n.read_at ? (TYPE_DOT[n.type] || 'bg-blue-500') : 'bg-gray-200 dark:bg-slate-600'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-bold truncate ${!n.read_at ? 'text-txt-primary' : 'text-txt-muted'}`}>
                                            {n.title}
                                        </p>
                                        {n.message && (
                                            <p className="text-[11px] text-txt-muted mt-0.5 line-clamp-2 leading-relaxed">
                                                {n.message}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-txt-placeholder mt-1">{relativeTime(n.created_at)}</p>
                                    </div>
                                    {n.action_url && (
                                        <ExternalLink className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600 shrink-0 mt-1" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CDENotificationBell;
