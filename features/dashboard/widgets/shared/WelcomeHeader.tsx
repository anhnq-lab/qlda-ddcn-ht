import React, { useMemo } from 'react';
import { User, Download, FileText } from 'lucide-react';
import { Avatar } from '../../../../components/ui';
import { useAuth } from '../../../../context/AuthContext';
import { useImpersonation } from '../../../../context/ImpersonationContext';
import type { SystemRole } from '../../../../types/permission.types';
import type { DashboardConfig } from '../../hooks/useDashboardConfig';

interface WelcomeHeaderProps {
    config: DashboardConfig;
    taskStats?: {
        inProgress: number;
        todo: number;
        done: number;
        overdue: number;
        total: number;
    };
}

const TIER_LABELS: Record<string, string> = {
    director: 'Trung tâm điều hành',
    manager: 'Quản lý phòng ban',
    staff: 'Không gian làm việc',
};

const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Quản trị viên',
    director: 'Giám đốc',
    deputy_director: 'Phó Giám đốc',
    chief_accountant: 'Kế toán trưởng',
    dept_head: 'Trưởng phòng',
    deputy_head: 'Phó phòng',
    specialist: 'Chuyên viên',
    staff: 'Nhân viên',
    contractor: 'Nhà thầu',
};

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ config, taskStats }) => {
    const { currentUser } = useAuth();
    const { impersonatedUser, isImpersonating } = useImpersonation();
    // Hiển thị theo người đang được giả lập (nếu có) để khớp với badge vai trò.
    const displayUser = isImpersonating && impersonatedUser ? impersonatedUser : currentUser;

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    }, []);

    const quickSummary = useMemo(() => {
        if (!taskStats) return null;
        if (config.tier === 'director') {
            return `Hệ thống ghi nhận bạn có ${taskStats.todo} việc cần xử lý và ${taskStats.overdue} việc trễ hạn.`;
        }
        if (config.tier === 'manager') {
            return `Phòng ban hiện có ${taskStats.inProgress} việc đang thực hiện, ${taskStats.overdue} việc quá hạn cần đôn đốc.`;
        }
        // staff
        return `Bạn đang có ${taskStats.inProgress} việc đang làm, ${taskStats.todo} việc chờ xử lý và ${taskStats.overdue} việc quá hạn.`;
    }, [taskStats, config.tier]);

    const handleExportCSV = () => {
        if (!taskStats) return;
        
        const rows = [
            ['BÁO CÁO NHANH DASHBOARD CÁ NHÂN'],
            [`Thời gian xuất:`, new Date().toLocaleString('vi-VN')],
            [`Người xuất:`, displayUser?.FullName || ''],
            [`Chức vụ:`, displayUser?.Position || ''],
            [`Phòng ban:`, displayUser?.Department || ''],
            [],
            ['CHỈ SỐ KPI', 'SỐ LƯỢNG'],
            ['Đang thực hiện', taskStats.inProgress],
            ['Chờ xử lý', taskStats.todo],
            ['Đã hoàn thành', taskStats.done],
            ['Quá hạn', taskStats.overdue],
            ['Tổng số công việc', taskStats.total]
        ];

        const csvContent = "\uFEFF" + rows.map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintPDF = () => {
        window.print();
    };

    return (
        <div className="rounded-2xl p-4 sm:p-8 relative overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 dark:from-slate-800 dark:to-slate-900 border border-transparent dark:border-slate-800 shadow-sm print:shadow-none print:border-none print:p-0">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none print:hidden"></div>
            <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 blur-xl pointer-events-none print:hidden"></div>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Avatar
                        name={displayUser?.FullName || 'User'}
                        imageUrl={displayUser?.AvatarUrl}
                        size="lg"
                    />
                    <div>
                        <h1 className="text-2xl font-bold text-white drop-shadow-lg print:text-black">
                            {greeting}, {displayUser?.FullName || 'Khách'}!
                        </h1>
                        <p className="text-xs text-primary-100 dark:text-slate-300 font-medium mt-0.5 print:text-gray-600">
                            {quickSummary}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-primary-100/80 dark:text-slate-400 font-medium print:text-gray-500">
                                {displayUser?.Position} — {displayUser?.Department}
                            </p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 print:border-gray-300 print:text-gray-700">
                                {ROLE_LABELS[config.systemRole] || config.systemRole}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="text-left sm:text-right flex flex-col items-start sm:items-end justify-between h-full min-h-[70px]">
                    <div>
                        <p className="text-xs text-primary-100 dark:text-slate-400 uppercase tracking-wider font-bold print:text-gray-500">
                            {TIER_LABELS[config.tier] || 'Dashboard'}
                        </p>
                        <p className="text-lg font-bold text-white mt-0.5 print:text-black">
                            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    
                    {taskStats && (
                        <div className="flex gap-2 mt-3 sm:mt-auto print:hidden">
                            <button 
                                onClick={handleExportCSV}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer shadow-sm select-none"
                                title="Xuất báo cáo dạng CSV/Excel"
                            >
                                <Download className="w-3.5 h-3.5" /> Xuất Excel
                            </button>
                            <button 
                                onClick={handlePrintPDF}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer shadow-sm select-none"
                                title="In báo cáo dạng PDF"
                            >
                                <FileText className="w-3.5 h-3.5" /> In PDF
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WelcomeHeader;
