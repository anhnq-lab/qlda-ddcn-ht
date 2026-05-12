/**
 * WelcomeHeader — Shared welcome banner for all dashboard tiers
 */
import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import type { SystemRole } from '../../../../types/permission.types';
import type { DashboardConfig } from '../../hooks/useDashboardConfig';

interface WelcomeHeaderProps {
    config: DashboardConfig;
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

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ config }) => {
    const { currentUser } = useAuth();

    return (
        <div className="rounded-2xl p-4 sm:p-8 relative overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 dark:from-slate-800 dark:to-slate-900 border border-transparent dark:border-slate-800 shadow-sm">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none"></div>
            <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 blur-xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur shadow-sm ring-1 ring-white/30">
                        {currentUser?.AvatarUrl ? (
                            <img src={currentUser.AvatarUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                            <User className="w-8 h-8 text-white" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white drop-shadow-lg">Xin chào, {currentUser?.FullName || 'Khách'}!</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-primary-100 dark:text-slate-300 font-medium">
                                {currentUser?.Position} — {currentUser?.Department}
                            </p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30`}>
                                {ROLE_LABELS[config.systemRole] || config.systemRole}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="text-left sm:text-right">
                    <p className="text-xs text-primary-100 dark:text-slate-400 uppercase tracking-wider font-bold">
                        {TIER_LABELS[config.tier] || 'Dashboard'}
                    </p>
                    <p className="text-lg font-bold text-white mt-0.5">
                        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WelcomeHeader;
