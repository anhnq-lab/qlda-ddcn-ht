import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Clock, Plus, Edit3, Trash2, Download, History, Eye, 
    FileText, User, Activity, Building2, CreditCard, ChevronRight
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useEmployees } from '../../../../hooks/useEmployees';
import { useAuth } from '../../../../context/AuthContext';
import { EmptyState } from '../../../../components/ui';

interface ActivityItem {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string;
}

export const InlineActivityFeed: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { data: employees } = useEmployees();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    // State phục vụ ánh xạ tài khoản để lấy tên hiển thị từ UUID
    const [userAccounts, setUserAccounts] = useState<any[]>([]);
    const [contractorAccounts, setContractorAccounts] = useState<any[]>([]);
    const [contractors, setContractors] = useState<any[]>([]);

    useEffect(() => {
        const fetchRecentActivities = async () => {
            setLoading(true);
            try {
                // Tải song song log và các bảng map tài khoản để tối ưu hiệu năng
                const [logsRes, userAccountsRes, contractorAccountsRes, contractorsRes] = await Promise.all([
                    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(6),
                    supabase.from('user_accounts').select('auth_user_id, employee_id'),
                    supabase.from('contractor_accounts').select('auth_user_id, contractor_id, display_name'),
                    supabase.from('contractors').select('contractor_id, full_name')
                ]);

                if (logsRes.error) throw logsRes.error;

                const userAccs = userAccountsRes.data || [];
                const contractorAccs = contractorAccountsRes.data || [];
                const contrs = contractorsRes.data || [];
                
                setUserAccounts(userAccs);
                setContractorAccounts(contractorAccs);
                setContractors(contrs);

                const formatted: ActivityItem[] = (logsRes.data || []).map((item: any) => {
                    const getUserName = (userId: string) => {
                        if (!userId) return 'Không rõ';
                        if (userId === 'system') return 'Hệ thống';
                        if (userId === 'unknown') return 'Không rõ';

                        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

                        if (isUuid) {
                            const userAcc = userAccs.find(ua => ua.auth_user_id === userId);
                            if (userAcc) {
                                const employee = (employees || []).find(e => e.EmployeeID === userAcc.employee_id);
                                if (employee) return employee.FullName;
                                return `Nhân viên (${userAcc.employee_id})`;
                            }

                            const contractorAcc = contractorAccs.find(ca => ca.auth_user_id === userId);
                            if (contractorAcc) {
                                const contractor = contrs.find(c => c.contractor_id === contractorAcc.contractor_id);
                                if (contractor) return contractor.full_name;
                                return contractorAcc.display_name || `Nhà thầu (${contractorAcc.contractor_id})`;
                            }

                            return `Tài khoản (${userId.substring(0, 8)})`;
                        }

                        const employee = (employees || []).find(e => e.EmployeeID === userId);
                        if (employee) return employee.FullName;

                        const contractor = contrs.find(c => c.contractor_id === userId);
                        if (contractor) return contractor.full_name;

                        return userId;
                    };

                    return {
                        id: item.id,
                        timestamp: item.created_at,
                        userId: item.changed_by,
                        userName: getUserName(item.changed_by),
                        action: item.action,
                        entityType: item.target_entity,
                        entityId: item.target_id,
                        details: item.details || '',
                    };
                });

                setActivities(formatted);
            } catch (e) {
                console.error('Error fetching activities:', e);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchRecentActivities();
        }
    }, [currentUser, employees]);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'CREATE':
            case 'ADD_CDE_ORG':
            case 'CREATE_CDE_STAFF_ACCOUNT':
                return <Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />;
            case 'UPDATE':
            case 'UPDATE_CDE_ROLE':
                return <Edit3 className="w-3 h-3 text-blue-600 dark:text-blue-400" />;
            case 'DELETE':
            case 'REMOVE_CDE_ORG':
                return <Trash2 className="w-3 h-3 text-rose-600 dark:text-rose-400" />;
            case 'VIEW': return <Eye className="w-3 h-3 text-txt-muted" />;
            case 'EXPORT': return <Download className="w-3 h-3 text-purple-600 dark:text-purple-400" />;
            case 'LOGIN_SUCCESS':
            case 'impersonation_start':
                return <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />;
            case 'LOGIN_FAILED':
                return <Activity className="w-3 h-3 text-rose-600 dark:text-rose-400" />;
            default: return <Activity className="w-3 h-3 text-primary-600 dark:text-primary-400" />;
        }
    };

    const getActionBg = (action: string) => {
        switch (action) {
            case 'CREATE':
            case 'ADD_CDE_ORG':
            case 'CREATE_CDE_STAFF_ACCOUNT':
            case 'LOGIN_SUCCESS':
            case 'impersonation_start':
                return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/30';
            case 'UPDATE':
            case 'UPDATE_CDE_ROLE':
                return 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-900/30';
            case 'DELETE':
            case 'REMOVE_CDE_ORG':
            case 'LOGIN_FAILED':
                return 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-900/30';
            case 'EXPORT': return 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-900/30';
            default: return 'bg-bg-subtle border-border';
        }
    };

    const getEntityIcon = (entityType: string) => {
        switch (entityType) {
            case 'Project': return <Building2 className="w-3.5 h-3.5 text-txt-secondary" />;
            case 'Task': return <Clock className="w-3.5 h-3.5 text-txt-secondary" />;
            case 'Contract': return <FileText className="w-3.5 h-3.5 text-txt-secondary" />;
            case 'Payment': return <CreditCard className="w-3.5 h-3.5 text-txt-secondary" />;
            case 'employees':
            case 'employee':
            case 'auth':
            case 'user_accounts':
            case 'contractor_accounts':
                return <User className="w-3.5 h-3.5 text-txt-secondary" />;
            default: return <FileText className="w-3.5 h-3.5 text-txt-secondary" />;
        }
    };

    const formatRelativeTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const diffMs = Date.now() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const handleItemClick = (item: ActivityItem) => {
        if (item.entityType === 'Project') {
            navigate(`/projects/${item.entityId}`);
        } else if (item.entityType === 'Task') {
            navigate(`/tasks/${item.entityId}`);
        }
    };

    // Định dạng nội dung chi tiết dạng Tiếng Việt thân thiện
    const formatDetails = (item: ActivityItem) => {
        if (!item.details) return '—';

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

        try {
            const parsed = JSON.parse(item.details);
            
            // 1. Logs giả danh
            if (item.action.startsWith('impersonation_')) {
                const actionText = 
                    item.action === 'impersonation_start' ? 'Bắt đầu giả danh' :
                    item.action === 'impersonation_stop' ? 'Kết thúc giả danh' : 'Hết hạn giả danh';
                return `${actionText} người dùng ${parsed.target_name}`;
            }
            
            // 2. Logs thay đổi dữ liệu (Trigger / API)
            if (parsed.op) {
                const opText = parsed.op === 'UPDATE' ? 'Cập nhật' : parsed.op === 'INSERT' ? 'Thêm mới' : 'Xóa';
                return `${opText} dữ liệu ${translateEntity(item.entityType)} (ID: ${item.entityId})`;
            }

            // 3. Log có target_name
            if (parsed.target_name) {
                return `Thao tác trên ${translateEntity(item.entityType).toLowerCase()}: ${parsed.target_name}`;
            }
        } catch (_) {
            const text = item.details;
            if (text.startsWith('Login via:')) {
                return text.replace('Login via:', 'Đăng nhập qua tài khoản:');
            }
            if (text.startsWith('Login failed for:')) {
                return text.replace('Login failed for:', 'Đăng nhập thất bại đối với tài khoản:');
            }
            return text;
        }

        return item.details;
    };

    return (
        <div className="section-card h-full flex flex-col">
            <div className="section-card-header flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <div className="section-icon"><Activity className="w-3.5 h-3.5" /></div>
                    <span>Hoạt động gần đây</span>
                </div>
            </div>
            
            <div className="flex-1 divide-y divide-border-subtle overflow-y-auto max-h-[300px]">
                {loading ? (
                    <div className="space-y-3 p-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-8 h-8 bg-bg-subtle rounded-full" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-2.5 bg-bg-subtle rounded w-3/4" />
                                    <div className="h-2 bg-bg-subtle rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <EmptyState 
                        icon={<Activity className="w-10 h-10 text-txt-muted" />} 
                        title="Không có hoạt động gần đây" 
                        className="py-10" 
                    />
                ) : (
                    activities.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => handleItemClick(item)}
                            className="p-3 flex items-start gap-3 hover:bg-bg-subtle/50 transition-all cursor-pointer group"
                        >
                            {/* Entity Icon with Action badge */}
                            <div className="relative shrink-0 mt-0.5">
                                <div className="w-8 h-8 rounded-full bg-bg-subtle border border-border flex items-center justify-center">
                                    {getEntityIcon(item.entityType)}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full border flex items-center justify-center shadow-sm ${getActionBg(item.action)}`}>
                                    {getActionIcon(item.action)}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline gap-2">
                                    <p className="text-[11px] font-bold text-txt-primary truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {item.userName}
                                    </p>
                                    <span className="text-[9px] text-txt-muted flex items-center gap-0.5 shrink-0 tabular-nums">
                                        <Clock className="w-2.5 h-2.5" />
                                        {formatRelativeTime(item.timestamp)}
                                    </span>
                                </div>
                                <p className="text-[11px] text-txt-secondary mt-0.5 line-clamp-2" title={item.details}>
                                    {formatDetails(item)}
                                </p>
                            </div>
                            
                            <ChevronRight className="w-3.5 h-3.5 text-txt-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all self-center" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default InlineActivityFeed;
