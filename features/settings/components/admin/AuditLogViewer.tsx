import React, { useState, useMemo } from 'react';
import {
    History, Filter, Search, Calendar, User, FileText,
    Edit3, Trash2, Plus, Eye, Clock, ChevronLeft, ChevronRight,
    Download, Building2, Briefcase, CreditCard, Shield, ShieldAlert,
    LogOut, UserCheck, UserX
} from 'lucide-react';
import { useEmployees } from '../../../../hooks/useEmployees';
import { supabase } from '../../../../lib/supabase';

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
    
    // State lưu trữ dữ liệu liên kết tài khoản để phân giải UUID
    const [userAccounts, setUserAccounts] = useState<any[]>([]);
    const [contractorAccounts, setContractorAccounts] = useState<any[]>([]);
    const [contractors, setContractors] = useState<any[]>([]);

    const itemsPerPage = 10;

    React.useEffect(() => {
        const fetchLogsAndAccounts = async () => {
            setLoading(true);
            try {
                // Tải song song các bảng dữ liệu để tối ưu hiệu năng
                const [logsRes, userAccountsRes, contractorAccountsRes, contractorsRes] = await Promise.all([
                    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }),
                    supabase.from('user_accounts').select('auth_user_id, employee_id'),
                    supabase.from('contractor_accounts').select('auth_user_id, contractor_id, display_name'),
                    supabase.from('contractors').select('contractor_id, full_name')
                ]);
                
                if (logsRes.error) throw logsRes.error;
                
                setUserAccounts(userAccountsRes.data || []);
                setContractorAccounts(contractorAccountsRes.data || []);
                setContractors(contractorsRes.data || []);
                
                const formattedLogs = (logsRes.data || []).map((item: any) => ({
                    id: item.log_id || item.id,
                    timestamp: item.timestamp || item.created_at,
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

        fetchLogsAndAccounts();
    }, []);

    // Danh sách icon phong phú cho từng hành động
    const actionIcons: Record<string, React.ElementType> = {
        CREATE: Plus,
        UPDATE: Edit3,
        DELETE: Trash2,
        VIEW: Eye,
        EXPORT: Download,
        SYNC: History,
        LOGIN_SUCCESS: Shield,
        LOGIN_FAILED: ShieldAlert,
        LOGOUT: LogOut,
        impersonation_start: UserCheck,
        impersonation_stop: UserX,
        impersonation_auto_expired: Clock,
        ADD_CDE_ORG: Plus,
        REMOVE_CDE_ORG: Trash2,
        UPDATE_CDE_ROLE: Edit3,
        CREATE_CDE_STAFF_ACCOUNT: Plus
    };

    // Màu sắc nổi bật, đồng bộ giao diện sáng/tối
    const actionColors: Record<string, string> = {
        CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        VIEW: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400',
        EXPORT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        SYNC: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
        LOGIN_SUCCESS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        LOGIN_FAILED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        LOGOUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        impersonation_start: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
        impersonation_stop: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
        impersonation_auto_expired: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        ADD_CDE_ORG: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        REMOVE_CDE_ORG: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        UPDATE_CDE_ROLE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        CREATE_CDE_STAFF_ACCOUNT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    };

    const entityIcons: Record<string, React.ElementType> = {
        Project: Building2,
        Contract: FileText,
        Payment: CreditCard,
        Task: Clock,
        Document: FileText,
        Employee: User,
        employees: User,
        auth: Shield,
        role_permission_defaults: Shield,
        user_permissions: Shield,
        cde_permissions: Shield
    };

    // Hàm phân giải tên người dùng từ UUID hoặc mã ID
    const getUserName = (userId: string) => {
        if (!userId) return 'Không rõ';
        if (userId === 'system') return 'Hệ thống';
        if (userId === 'unknown') return 'Không rõ';

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

        if (isUuid) {
            // Tìm trong user_accounts (Nhân viên)
            const userAcc = userAccounts.find(ua => ua.auth_user_id === userId);
            if (userAcc) {
                const employee = (employees || []).find(e => e.EmployeeID === userAcc.employee_id);
                if (employee) return employee.FullName;
                return `Nhân viên (${userAcc.employee_id})`;
            }

            // Tìm trong contractor_accounts (Nhà thầu)
            const contractorAcc = contractorAccounts.find(ca => ca.auth_user_id === userId);
            if (contractorAcc) {
                const contractor = contractors.find(c => c.contractor_id === contractorAcc.contractor_id);
                if (contractor) return contractor.full_name;
                return contractorAcc.display_name || `Nhà thầu (${contractorAcc.contractor_id})`;
            }

            return `Tài khoản (${userId.substring(0, 8)})`;
        }

        // Trường hợp lưu trực tiếp employee_id (log cũ)
        const employee = (employees || []).find(e => e.EmployeeID === userId);
        if (employee) return employee.FullName;

        // Trường hợp lưu trực tiếp contractor_id (log cũ)
        const contractor = contractors.find(c => c.contractor_id === userId);
        if (contractor) return contractor.full_name;

        return userId;
    };

    // Dịch các hành động sang tiếng Việt
    const translateAction = (action: string) => {
        const actionMap: Record<string, string> = {
            CREATE: 'Tạo mới',
            UPDATE: 'Cập nhật',
            DELETE: 'Xóa',
            VIEW: 'Xem',
            EXPORT: 'Xuất file',
            SYNC: 'Đồng bộ',
            LOGIN_SUCCESS: 'Đăng nhập thành công',
            LOGIN_FAILED: 'Đăng nhập thất bại',
            LOGOUT: 'Đăng xuất',
            impersonation_start: 'Bắt đầu giả danh',
            impersonation_stop: 'Kết thúc giả danh',
            impersonation_auto_expired: 'Giả danh hết hạn',
            ADD_CDE_ORG: 'Thêm tổ chức CDE',
            REMOVE_CDE_ORG: 'Xóa tổ chức CDE',
            UPDATE_CDE_ROLE: 'Cập nhật vai trò CDE',
            CREATE_CDE_STAFF_ACCOUNT: 'Tạo tài khoản nhân viên CDE'
        };
        return actionMap[action] || action;
    };

    // Dịch tên các đối tượng sang tiếng Việt
    const translateEntity = (entity: string) => {
        const entityMap: Record<string, string> = {
            employees: 'Nhân sự',
            employee: 'Nhân sự',
            auth: 'Xác thực / Tài khoản',
            role_permission_defaults: 'Quyền mặc định vai trò',
            role_permissions: 'Quyền mặc định vai trò',
            user_permissions: 'Quyền cá nhân',
            projects: 'Dự án',
            Project: 'Dự án',
            contracts: 'Hợp đồng',
            Contract: 'Hợp đồng',
            payments: 'Thanh toán',
            Payment: 'Thanh toán',
            tasks: 'Công việc',
            Task: 'Công việc',
            documents: 'Tài liệu',
            Document: 'Tài liệu',
            bidding_packages: 'Gói thầu',
            BiddingPackage: 'Gói thầu',
            contractors: 'Nhà thầu',
            Contractor: 'Nhà thầu',
            cde_permissions: 'Phân quyền CDE',
            user_accounts: 'Tài khoản người dùng',
            contractor_accounts: 'Tài khoản nhà thầu',
            leadership_assignments: 'Phân công lãnh đạo',
            dashboard_widgets: 'Cấu hình Dashboard',
            sidebar_modules: 'Module Sidebar'
        };
        return entityMap[entity] || entity;
    };

    // Định dạng cột Đối tượng một cách trực quan
    const formatEntityName = (log: AuditLog) => {
        const entityTypeName = translateEntity(log.entityType);
        
        if (log.details) {
            try {
                const parsed = JSON.parse(log.details);
                if (parsed.target_name) {
                    return `${entityTypeName}: ${parsed.target_name}`;
                }
            } catch (_) {}
        }
        
        return `${entityTypeName} (${log.entityId})`;
    };

    // Định dạng cột Chi tiết bằng tiếng Việt dễ hiểu thay vì JSON thô
    const formatDetails = (log: AuditLog) => {
        if (!log.details) return '—';

        try {
            const parsed = JSON.parse(log.details);
            
            // 1. Logs giả danh
            if (log.action.startsWith('impersonation_')) {
                const actionText = 
                    log.action === 'impersonation_start' ? 'Bắt đầu giả danh' :
                    log.action === 'impersonation_stop' ? 'Kết thúc giả danh' : 'Hết hạn giả danh';
                return `${actionText} người dùng ${parsed.target_name} (Vai trò: ${parsed.target_role || '—'})`;
            }
            
            // 2. Logs thay đổi dữ liệu dạng SQL Trigger/API Audit
            if (parsed.op) {
                const opText = parsed.op === 'UPDATE' ? 'Cập nhật' : parsed.op === 'INSERT' ? 'Thêm mới' : 'Xóa';
                const entityText = translateEntity(log.entityType);
                
                // Trường hợp cập nhật trường cụ thể
                if (parsed.op === 'UPDATE' && parsed.new) {
                    const keys = Object.keys(parsed.new).filter(k => k !== 'updated_at' && k !== 'created_at');
                    if (keys.length > 0) {
                        return `Cập nhật ${entityText}: Thay đổi các trường (${keys.join(', ')})`;
                    }
                }
                return `${opText} dữ liệu ${entityText} thành công`;
            }

            // 3. Log thao tác có target_name
            if (parsed.target_name) {
                const entityText = translateEntity(log.entityType);
                return `Cập nhật thông tin ${entityText.toLowerCase()}: ${parsed.target_name}`;
            }
        } catch (_) {
            // Không phải JSON, kiểm tra chuỗi text
            const text = log.details;
            if (text.startsWith('Login via:')) {
                return text.replace('Login via:', 'Đăng nhập qua tài khoản:');
            }
            if (text.startsWith('Login failed for:')) {
                return text.replace('Login failed for:', 'Đăng nhập thất bại đối với tài khoản:');
            }
            return text;
        }

        return log.details;
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch =
                log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                translateEntity(log.entityType).toLowerCase().includes(searchQuery.toLowerCase()) ||
                getUserName(log.userId).toLowerCase().includes(searchQuery.toLowerCase());

            const matchesAction = filterAction === 'all' || log.action === filterAction;
            const matchesEntity = filterEntity === 'all' || log.entityType === filterEntity;

            return matchesSearch && matchesAction && matchesEntity;
        });
    }, [logs, searchQuery, filterAction, filterEntity, userAccounts, contractorAccounts, employees, contractors]);

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

    const content = (
        <div className={`space-y-6 ${standalone ? 'animate-in fade-in duration-300 h-full flex flex-col' : ''}`}>
            {/* Filters */}
            <div className="bg-bg-surface p-4 rounded-2xl border border-border shadow-sm">
                <div className="flex flex-wrap gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[250px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Tìm theo người thực hiện, đối tượng, chi tiết..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-bg-surface text-txt-primary placeholder-gray-400 dark:placeholder-slate-500"
                        />
                    </div>

                    {/* Action Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            value={filterAction}
                            onChange={e => setFilterAction(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-bg-surface text-txt-secondary"
                        >
                            <option value="all">Tất cả hành động</option>
                            <option value="CREATE">Tạo mới</option>
                            <option value="UPDATE">Cập nhật</option>
                            <option value="DELETE">Xóa</option>
                            <option value="VIEW">Xem</option>
                            <option value="EXPORT">Xuất file</option>
                            <option value="SYNC">Đồng bộ</option>
                            <option value="LOGIN_SUCCESS">Đăng nhập thành công</option>
                            <option value="LOGIN_FAILED">Đăng nhập thất bại</option>
                            <option value="impersonation_start">Bắt đầu giả danh</option>
                            <option value="impersonation_stop">Kết thúc giả danh</option>
                        </select>
                    </div>

                    {/* Entity Filter */}
                    <select
                        value={filterEntity}
                        onChange={e => setFilterEntity(e.target.value)}
                        className="px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-bg-surface text-txt-secondary"
                    >
                        <option value="all">Tất cả đối tượng</option>
                        <option value="Project">Dự án</option>
                        <option value="Contract">Hợp đồng</option>
                        <option value="Payment">Thanh toán</option>
                        <option value="Task">Công việc</option>
                        <option value="Document">Tài liệu</option>
                        <option value="employees">Nhân sự</option>
                        <option value="auth">Tài khoản & Xác thực</option>
                        <option value="role_permission_defaults">Quyền mặc định vai trò</option>
                    </select>

                    <button className="ml-auto px-4 py-2.5 text-sm font-medium text-txt-secondary bg-bg-surface border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-bg-hover-row transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Xuất log
                    </button>
                </div>
            </div>

            {/* Log Table */}
            <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm relative">
                        <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md sticky top-0 z-10 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)] dark:shadow-[inset_0_-1px_0_0_rgba(51,65,85,1)] text-[11px] uppercase font-bold tracking-wider text-txt-muted">
                            <tr>
                                <th className="px-4 py-3 text-left">Thời gian</th>
                                <th className="px-4 py-3 text-left">Người thực hiện</th>
                                <th className="px-4 py-3 text-left">Hành động</th>
                                <th className="px-4 py-3 text-left">Đối tượng</th>
                                <th className="px-4 py-3 text-left">Chi tiết</th>
                                <th className="px-4 py-3 text-left">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
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
                                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700 border-b border-border-subtle transition-colors">
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-txt-placeholder shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-txt-secondary text-xs">{formatTime(log.timestamp)}</p>
                                                    <p className="text-[10px] text-txt-placeholder tabular-nums">
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
                                                <span className="font-semibold text-txt-secondary text-xs">{getUserName(log.userId)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                                                <ActionIcon className="w-3 h-3" />
                                                {translateAction(log.action)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <EntityIcon className="w-3.5 h-3.5 text-txt-placeholder shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-txt-secondary text-xs">{formatEntityName(log)}</p>
                                                    <p className="text-[10px] text-txt-placeholder font-mono">{log.entityId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-txt-muted text-xs max-w-[280px] truncate" title={log.details}>
                                                {formatDetails(log)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="font-mono text-xs text-txt-placeholder">{log.ipAddress || '—'}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0 bg-bg-surface">
                    <span className="text-sm text-txt-muted">
                        Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} / {filteredLogs.length} bản ghi
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-bg-subtle dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-txt-muted"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium text-txt-secondary">
                            {currentPage} / {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="p-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-bg-subtle dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-txt-muted"
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
                <div className="bg-bg-surface w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-sm p-4">
                    {content}
                </div>
            </div>
        );
    }

    return content;
};

export default AuditLogViewer;
