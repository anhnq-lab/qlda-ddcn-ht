import React from 'react';
import { Mail, Phone, ClipboardList, FolderOpen } from 'lucide-react';
import { Employee, EmployeeStatus, Role } from '../../../types';
import { Column } from '../../../components/ui/DataTable';
import { Avatar } from '../../../components/ui';
import { WorkloadData } from '../hooks/useEmployeeList';

const getRoleInfo = (role: Role) => {
    switch (role) {
        case Role.Admin: return { label: 'Q.Trị', color: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/20', dot: 'bg-primary-500' };
        case Role.Manager: return { label: 'Q.Lý', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20', dot: 'bg-emerald-500' };
        default: return { label: 'N.Viên', color: 'bg-slate-50 text-slate-600 dark:text-slate-400 ring-1 ring-slate-500/20', dot: 'bg-slate-400' };
    }
};

export function getEmployeeColumns(
    employeeWorkload: Record<string, WorkloadData>
): Column<Employee>[] {
    return [
        {
            key: 'stt',
            header: 'STT',
            width: '48px',
            align: 'center',
            render: (_: any, __: Employee, index: number) => (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{index + 1}</span>
            ),
        },
        {
            key: 'FullName',
            header: 'Nhân viên',
            render: (_: any, emp: Employee) => (
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar name={emp.FullName} imageUrl={emp.AvatarUrl} size="md" ringColor="ring-white dark:ring-slate-900" />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${emp.Status === EmployeeStatus.Active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm group-hover:text-blue-600 transition-colors truncate">{emp.FullName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{emp.EmployeeID}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'Position',
            header: 'Chức vụ / Phòng ban',
            render: (_: any, emp: Employee) => (
                <div className="min-w-0">
                    <p className="font-medium text-slate-700 dark:text-slate-300 text-sm truncate">{emp.Position}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">{emp.Department}</p>
                </div>
            ),
        },
        {
            key: 'Email',
            header: 'Liên hệ',
            render: (_: any, emp: Employee) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{emp.Email}</span>
                    </div>
                    {emp.Phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{emp.Phone}</span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'workload',
            header: 'KL.CV',
            align: 'center',
            render: (_: any, emp: Employee) => {
                const workload = employeeWorkload[emp.EmployeeID];
                return (
                    <div className="flex items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20" title="Công việc đang thực hiện">
                            <ClipboardList className="w-3 h-3" />
                            {workload?.activeTaskCount || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-primary-500/10 text-primary-600 ring-1 ring-primary-500/20" title="Dự án tham gia">
                            <FolderOpen className="w-3 h-3" />
                            {workload?.projectCount || 0}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'Role',
            header: 'Vai trò',
            align: 'center',
            render: (_: any, emp: Employee) => {
                const roleInfo = getRoleInfo(emp.Role);
                return (
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md ${roleInfo.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${roleInfo.dot}`} />
                        {roleInfo.label}
                    </span>
                );
            },
        },
        {
            key: 'Status',
            header: 'TT',
            align: 'center',
            width: '48px',
            render: (_: any, emp: Employee) => (
                <div
                    className={`w-2.5 h-2.5 rounded-full mx-auto ring-2 ${emp.Status === EmployeeStatus.Active
                        ? 'bg-emerald-500 ring-emerald-200'
                        : 'bg-slate-300 ring-slate-200'
                        }`}
                    title={emp.Status === EmployeeStatus.Active ? 'Đang hoạt động' : 'Đã nghỉ'}
                />
            ),
        },
    ];
}
