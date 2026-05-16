import React from 'react';
import { Users, UserCheck, Building2, Shield, TrendingUp } from 'lucide-react';
import { Role } from '../../../types';
import { EmployeeStats } from '../hooks/useEmployeeList';

interface EmployeeStatsBarProps {
    stats: EmployeeStats | undefined;
    departments: string[];
    filterRole: string;
    setFilterRole: (role: string) => void;
}

const EmployeeStatsBar: React.FC<EmployeeStatsBarProps> = ({
    stats,
    departments,
    filterRole,
    setFilterRole,
}) => {
    return (
        <div className="flex items-center gap-1 flex-wrap bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm px-2 py-1.5">
            {/* Total */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-50/60 dark:hover:bg-blue-500/10 transition-colors">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                    <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{stats?.total || 0}</span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Nhân sự</span>
                </div>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

            {/* Active */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-emerald-50/60 dark:hover:bg-emerald-500/10 transition-colors">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{stats?.active || 0}</span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Hoạt động</span>
                </div>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

            {/* Nam / Nữ */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-cyan-50/60 dark:hover:bg-cyan-500/10 transition-colors">
                <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10">
                    <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">
                        {stats?.male || 0}<span className="text-slate-300 dark:text-slate-600 mx-0.5">/</span>{stats?.female || 0}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Nam / Nữ</span>
                </div>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

            {/* Departments */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary-50/60 dark:hover:bg-primary-500/10 transition-colors">
                <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-500/10">
                    <Building2 className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{departments.length}</span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Phòng ban</span>
                </div>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

            {/* Admins - clickable filter */}
            <button
                onClick={() => setFilterRole(filterRole === Role.Admin ? 'All' : Role.Admin)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${filterRole === Role.Admin ? 'bg-violet-100 dark:bg-violet-500/20 ring-1 ring-violet-300 dark:ring-violet-500/30' : 'hover:bg-violet-50/60 dark:hover:bg-violet-500/10'}`}
            >
                <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10">
                    <Shield className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{stats?.byRole?.[Role.Admin] || 0}</span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">QT.Viên</span>
                </div>
            </button>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

            {/* Managers - clickable filter */}
            <button
                onClick={() => setFilterRole(filterRole === Role.Manager ? 'All' : Role.Manager)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${filterRole === Role.Manager ? 'bg-rose-100 dark:bg-rose-500/20 ring-1 ring-rose-300 dark:ring-rose-500/30' : 'hover:bg-rose-50/60 dark:hover:bg-rose-500/10'}`}
            >
                <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10">
                    <TrendingUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{stats?.byRole?.[Role.Manager] || 0}</span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Quản lý</span>
                </div>
            </button>
        </div>
    );
};

export default EmployeeStatsBar;
