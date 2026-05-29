import React from 'react';
import { Mail, Phone, ClipboardList, FolderOpen } from 'lucide-react';
import { Employee, EmployeeStatus, Role } from '../../../types';
import { Avatar } from '../../../components/ui';
import { WorkloadData } from '../hooks/useEmployeeList';

const getRoleInfo = (role: Role) => {
    switch (role) {
        case Role.Admin: return { label: 'Q.Trị', color: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/20', dot: 'bg-primary-500' };
        case Role.Manager: return { label: 'Q.Lý', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20', dot: 'bg-emerald-500' };
        default: return { label: 'N.Viên', color: 'bg-slate-50 text-txt-muted ring-1 ring-slate-500/20', dot: 'bg-slate-400' };
    }
};

interface EmployeeGridViewProps {
    employees: Employee[];
    onView: (emp: Employee) => void;
    employeeWorkload: Record<string, WorkloadData>;
}

const EmployeeGridView: React.FC<EmployeeGridViewProps> = ({
    employees,
    onView,
    employeeWorkload,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {employees.map((emp) => {
                const roleInfo = getRoleInfo(emp.Role);
                const workload = employeeWorkload[emp.EmployeeID];
                return (
                    <div
                        key={emp.EmployeeID}
                        onClick={() => onView(emp)}
                        className="bg-bg-surface rounded-2xl border border-border-subtle hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                    >
                        {/* Header gradient */}
                        <div className="h-20 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-b-[3px] border-primary-500 relative">
                            <div className="absolute inset-0 bg-black/10" />
                            <div className="absolute top-3 right-3">
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md bg-white/20 backdrop-blur-sm text-white">
                                    {roleInfo.label}
                                </span>
                            </div>
                        </div>

                        {/* Avatar overlapping */}
                        <div className="px-5 -mt-10 relative z-10">
                            <div className="relative inline-block">
                                <Avatar
                                    name={emp.FullName}
                                    imageUrl={emp.AvatarUrl}
                                    size="xl"
                                    ringColor="ring-4 ring-white dark:ring-slate-800"
                                />
                                <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${emp.Status === EmployeeStatus.Active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="px-5 pt-3 pb-5">
                            <h3 className="text-lg font-bold text-txt-primary group-hover:text-blue-600 transition-colors">{emp.FullName}</h3>
                            <p className="text-sm text-blue-600 font-medium">{emp.Position}</p>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{emp.Department}</p>

                            {/* Workload Badges */}
                            <div className="flex items-center gap-2 mt-4">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400">
                                    <ClipboardList className="w-3 h-3" /> {workload?.activeTaskCount || 0} công việc
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                                    <FolderOpen className="w-3 h-3" /> {workload?.projectCount || 0} dự án
                                </span>
                            </div>

                            {/* Contact actions */}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={(e) => { e.stopPropagation(); }}
                                    className="flex-1 py-2.5 bg-bg-subtle dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-txt-muted rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Mail className="w-3 h-3" /> Email
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); }}
                                    className="flex-1 py-2.5 bg-bg-subtle dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-txt-muted rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Phone className="w-3 h-3" /> Gọi
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default EmployeeGridView;
