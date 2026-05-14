import React, { useState, useMemo } from 'react';
import {
    History, Filter, Search, Calendar, User, FileText,
    Edit3, Trash2, Plus, Eye, Clock, ChevronLeft, ChevronRight,
    Download, Building2, Briefcase, CreditCard
} from 'lucide-react';
import { useEmployees } from '../../hooks/useEmployees';

import { supabase } from '../../lib/supabase';

interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    entityName: string;
    details?: string;
    ipAddress?: string;
}

interface AuditLogViewerProps {
    isOpen?: boolean;
    onClose?: () => void;
    standalone?: boolean;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ isOpen = true, onClose, standalone = true }) => {
    const { data: employees } = useEmployees();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAction, setFilterAction] = useState<string>('all');
    const [filterEntity, setFilterEntity] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 10;

    React.useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('audit_logs')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                
                const formattedLogs = (data || []).map((item: any) => ({
                    id: item.id,
                    timestamp: item.created_at,
                    userId: item.changed_by,
                    action: item.action,
                    entityType: item.target_entity,
                    entityId: item.target_id,
                    entityName: `${item.target_entity} - ${item.target_id}`,
                    details: item.details,
                    ipAddress: ''
                }));
                
                setLogs(formattedLogs);
            } catch (err) {
                console.error("Error fetching audit logs", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const actionIcons: Record<string, React.ElementType> = {
        CREATE: Plus,
        UPDATE: Edit3,
        DELETE: Trash2,
        VIEW: Eye,
        EXPORT: Download,
        SYNC: History
    };

    const actionColors: Record<string, string> = {
        CREATE: 'bg-emerald-100 text-emerald-700',
        UPDATE: 'bg-blue-100 text-blue-700',
        DELETE: 'bg-red-100 text-red-700',
        VIEW: 'bg-gray-100 text-gray-700',
        EXPORT: 'bg-purple-100 text-purple-700',
        SYNC: 'bg-primary-100 text-primary-700'
    };

    const entityIcons: Record<string, React.ElementType> = {
        Project: Building2,
        Contract: FileText,
        Payment: CreditCard,
        Task: Clock,
        Document: FileText,
        Employee: User
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch =
                log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.entityId.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesAction = filterAction === 'all' || log.action === filterAction;
            const matchesEntity = filterEntity === 'all' || log.entityType === filterEntity;

            return matchesSearch && matchesAction && matchesEntity;
        });
    }, [logs, searchQuery, filterAction, filterEntity]);

    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(start, start + itemsPerPage);
    }, [filteredLogs, currentPage]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return 'Vừa xong';
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    const getUserName = (userId: string) => {
        const employee = (employees || []).find(e => e.EmployeeID === userId);
        return employee?.FullName || userId;
    };

    const content = (
        <div className={`space-y-6 ${standalone ? 'animate-in fade-in duration-300 h-full flex flex-col' : ''}`}>


            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                <div className="flex flex-wrap gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[250px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm theo tên, ID, chi tiết..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                        />
                    </div>

                    {/* Action Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            value={filterAction}
                            onChange={e => setFilterAction(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200"
                        >
                            <option value="all">Tất cả hành động</option>
                            <option value="CREATE">Tạo mới</option>
                            <option value="UPDATE">Cập nhật</option>
                            <option value="DELETE">Xóa</option>
                            <option value="VIEW">Xem</option>
                            <option value="EXPORT">Xuất file</option>
                            <option value="SYNC">Đồng bộ</option>
                        </select>
                    </div>

                    {/* Entity Filter */}
                    <select
                        value={filterEntity}
                        onChange={e => setFilterEntity(e.target.value)}
                        className="px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200"
                    >
                        <option value="all">Tất cả đối tượng</option>
                        <option value="Project">Dự án</option>
                        <option value="Contract">Hợp đồng</option>
                        <option value="Payment">Thanh toán</option>
                        <option value="Task">Công việc</option>
                        <option value="Document">Tài liệu</option>
                    </select>

                    <button className="ml-auto px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Xuất log
                    </button>
                </div>
            </div>

            {/* Log Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm relative">
                        <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)] dark:shadow-[inset_0_-1px_0_0_rgba(51,65,85,1)] text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3 text-left">Thời gian</th>
                                <th className="px-4 py-3 text-left">Người thực hiện</th>
                                <th className="px-4 py-3 text-left">Hành động</th>
                                <th className="px-4 py-3 text-left">Đối tượng</th>
                                <th className="px-4 py-3 text-left">Chi tiết</th>
                                <th className="px-4 py-3 text-left">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                        Không tìm thấy lịch sử nào
                                    </td>
                                </tr>
                            ) : paginatedLogs.map(log => {
                                const ActionIcon = actionIcons[log.action] || History;
                                const EntityIcon = entityIcons[log.entityType] || FileText;

                                return (
                                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate- border-b border-gray-100 dark:border-slate-700 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400 dark:text-slate-400 shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-slate-700 dark:text-slate-200 text-xs">{formatTime(log.timestamp)}</p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-400 tabular-nums">
                                                        {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0">
                                                    <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs">{getUserName(log.userId)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${actionColors[log.action]}`}>
                                                <ActionIcon className="w-3 h-3" />
                                                {log.action === 'CREATE' ? 'Tạo mới' :
                                                    log.action === 'UPDATE' ? 'Cập nhật' :
                                                        log.action === 'DELETE' ? 'Xóa' :
                                                            log.action === 'VIEW' ? 'Xem' :
                                                                log.action === 'EXPORT' ? 'Xuất file' : 'Đồng bộ'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <EntityIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-slate-700 dark:text-slate-200 text-xs">{log.entityName}</p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">{log.entityId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-[200px] truncate" title={log.details}>
                                                {log.details || '—'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="font-mono text-xs text-slate-400 dark:text-slate-400">{log.ipAddress || '—'}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-white dark:bg-slate-800">
                    <span className="text-sm text-gray-500 dark:text-slate-400">
                        Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} / {filteredLogs.length} bản ghi
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-slate-300"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-slate-200">
                            {currentPage} / {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="p-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-slate-300"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!standalone) {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-sm p-4">
                    {content}
                </div>
            </div>
        );
    }

    return content;
};

export default AuditLogViewer;
