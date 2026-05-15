import React, { useState, useEffect, useMemo } from 'react';
import { ScrollText, Filter, Search, FileText, UserCheck, Shield, FolderInput, Send, Trash2, Edit2, Eye, Download, Clock } from 'lucide-react';
import { supabase, supabaseExt } from '@/lib/supabase';
import type { CDEAuditEntry } from '../types';

const ACTION_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
    'upload': { label: 'Tải lên', icon: FileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    'approve': { label: 'Phê duyệt', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    'reject': { label: 'Từ chối', icon: Shield, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
    'move': { label: 'Di chuyển', icon: FolderInput, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
    'transmit': { label: 'Chuyển giao', icon: Send, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
    'delete': { label: 'Xóa', icon: Trash2, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
    'edit': { label: 'Sửa đổi', icon: Edit2, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    'view': { label: 'Xem', icon: Eye, color: 'text-gray-500 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700' },
    'download': { label: 'Tải xuống', icon: Download, color: 'text-gray-500 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700' },
    'permission': { label: 'Phân quyền', icon: Shield, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
};

interface CDEAuditLogProps {
    projectId: string;
}

const CDEAuditLog: React.FC<CDEAuditLogProps> = ({ projectId }) => {
    const [entries, setEntries] = useState<CDEAuditEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAction, setFilterAction] = useState('');

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            const { data } = await supabaseExt
                .from('cde_audit_log')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(100);
            if (data) setEntries(data);
            setIsLoading(false);
        })();
    }, [projectId]);

    const filtered = useMemo(() => {
        let result = entries;
        if (filterAction) result = result.filter(e => e.action === filterAction);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(e => e.actor_name.toLowerCase().includes(q) || e.entity_id.toLowerCase().includes(q) || JSON.stringify(e.details).toLowerCase().includes(q));
        }
        return result;
    }, [entries, filterAction, searchQuery]);

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = (now.getTime() - d.getTime()) / 1000;
        if (diff < 60) return 'vừa xong';
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                        <ScrollText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-800 dark:text-slate-100">Nhật ký hoạt động</h3>
                        <p className="text-[10px] text-gray-400">Audit Trail — ISO 19650</p>
                    </div>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">{filtered.length} bản ghi</span>
            </div>

            {/* Filters */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700/50 flex items-center gap-3 bg-slate-50 dark:bg-slate-800">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <input type="text" placeholder="Tìm kiếm..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-xs dark:text-slate-200" />
                </div>
                <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-xs dark:text-slate-200">
                    <option value="">Tất cả hành động</option>
                    {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                    ))}
                </select>
            </div>

            {/* Audit Entries */}
            <div className="max-h-[500px] overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Đang tải...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <ScrollText className="w-10 h-10 mx-auto text-gray-200 dark:text-slate-600 mb-3" />
                        <p className="text-sm text-gray-400 font-medium">Chưa có hoạt động nào</p>
                        <p className="text-[10px] text-gray-300 mt-1">Các thao tác trên CDE sẽ được ghi lại tự động</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                        {filtered.map(entry => {
                            const actionCfg = ACTION_CONFIG[entry.action] || ACTION_CONFIG['view'];
                            const ActionIcon = actionCfg.icon;
                            return (
                                <div key={entry.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all group">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${actionCfg.color}`}>
                                        <ActionIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-800 dark:text-slate-100">{entry.actor_name || entry.actor_id}</span>
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{actionCfg.label}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                                            {entry.entity_type}: <span className="font-mono font-semibold">{entry.entity_id}</span>
                                        </p>
                                        {entry.details && Object.keys(entry.details).length > 0 && (
                                            <p className="text-[10px] text-gray-400 mt-1 bg-gray-50 dark:bg-slate-700 px-2 py-1 rounded border border-gray-100 dark:border-slate-600 font-mono truncate">
                                                {JSON.stringify(entry.details).substring(0, 120)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 shrink-0 mt-0.5">
                                        <Clock className="w-3 h-3" />
                                        <span>{formatTime(entry.created_at)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CDEAuditLog;
