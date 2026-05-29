import React, { useState } from 'react';
import { Users, Search, ChevronDown, Check, X } from 'lucide-react';
import { Employee, SelectedMember } from '../../../../types';
import { SectionHeader, labelClass } from './FormShared';
import { Avatar } from '../../../../components/ui';

interface ProjectFormMembersProps {
    formData: Record<string, any>;
    employees: Employee[];
    selectedMembers: SelectedMember[];
    toggleMember: (empId: string) => void;
    updateMemberRole: (empId: string, role: string) => void;
}

export const ProjectFormMembers: React.FC<ProjectFormMembersProps> = ({
    formData,
    employees,
    selectedMembers,
    toggleMember,
    updateMemberRole,
}) => {
    const [memberSearch, setMemberSearch] = useState('');
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);

    const filteredEmployees = employees.filter(e => {
        const dept = e.Department || 'Khác';
        const isSearchMatch =
            e.FullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
            dept.toLowerCase().includes(memberSearch.toLowerCase());
        const matchOtherBan = dept.match(/Ban.*([1-7])/i);
        const currentBan = String(formData.ManagementBoard);
        const isOtherBan = matchOtherBan && currentBan !== '0' && matchOtherBan[1] !== currentBan;
        return isSearchMatch && !isOtherBan;
    });

    const groupedEmployees = filteredEmployees.reduce((acc, emp) => {
        const dept = emp.Department || 'Khác';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(emp);
        return acc;
    }, {} as Record<string, Employee[]>);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SectionHeader icon={Users} title="Thành viên dự án" subtitle="Chọn nhân sự tham gia quản lý dự án" />


            {/* Search & Dropdown */}
            <div className="relative">
                <div
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border flex items-center gap-2 transition-all duration-200 ${
                        showMemberDropdown 
                            ? 'border-primary-500 ring-2 ring-primary-500/20 bg-bg-surface dark:border-primary-500/50' 
                            : 'border-border bg-bg-subtle hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                    onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                >
                    <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${showMemberDropdown ? 'text-primary-500' : 'text-txt-placeholder'}`} />
                    <input
                        type="text"
                        placeholder={`Tìm kiếm và thêm nhân sự... (${selectedMembers.length} đã chọn)`}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-txt-primary placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        value={memberSearch}
                        onChange={e => { setMemberSearch(e.target.value); setShowMemberDropdown(true); }}
                        onFocus={() => setShowMemberDropdown(true)}
                    />
                    <ChevronDown className={`w-4 h-4 text-txt-placeholder transition-transform duration-200 ${showMemberDropdown ? 'rotate-180' : ''}`} />
                </div>

                {showMemberDropdown && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowMemberDropdown(false)} />
                        <div className="absolute z-20 mt-2 w-full bg-bg-surface border border-border rounded-xl shadow-lg dark:shadow-2xl dark:shadow-black/50 max-h-[320px] overflow-y-auto flex flex-col">
                            {Object.keys(groupedEmployees).length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-bg-subtle flex items-center justify-center mb-3">
                                        <Search className="w-5 h-5 text-txt-placeholder" />
                                    </div>
                                    <p className="text-sm font-medium text-txt-muted">Không tìm thấy nhân sự</p>
                                    <p className="text-xs text-txt-placeholder mt-1">Vui lòng thử từ khóa khác</p>
                                </div>
                            ) : (
                                Object.entries(groupedEmployees).map(([dept, emps]: [string, Employee[]]) => (
                                    <div key={dept} className="flex flex-col">
                                        <div className="px-4 py-2 bg-gray-100 dark:bg-slate-900 text-[11px] font-bold text-txt-muted uppercase tracking-wider sticky top-0 z-10 border-y border-border first:border-t-0">
                                            {dept}
                                        </div>
                                        <div className="flex flex-col py-1">
                                            {emps.map(emp => {
                                                const isSelected = selectedMembers.some(m => m.employeeId === emp.EmployeeID);
                                                return (
                                                    <button
                                                        key={emp.EmployeeID}
                                                        type="button"
                                                        onClick={() => toggleMember(emp.EmployeeID)}
                                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                                                            isSelected 
                                                                ? 'bg-blue-50 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-slate-600' 
                                                                : 'hover:bg-bg-muted'
                                                        }`}
                                                    >
                                                        <div className="relative">
                                                            <Avatar
                                                                name={emp.FullName}
                                                                imageUrl={emp.AvatarUrl}
                                                                size="sm"
                                                                className={`shadow-sm transition-transform ${isSelected ? 'scale-95' : ''}`}
                                                            />
                                                            {isSelected && (
                                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-slate-800 flex items-center justify-center">
                                                                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-txt-primary'}`}>
                                                                {emp.FullName}
                                                            </p>
                                                            <p className="text-[11px] text-txt-muted truncate">
                                                                {emp.Position || 'Nhân viên'}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>

            {selectedMembers.length === 0 && (
                <p className="text-[11px] text-primary-600 dark:text-primary-400 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-primary-500 dark:bg-primary-400 rounded-full"></span>
                    Có thể bổ sung thành viên sau khi tạo dự án
                </p>
            )}

            {/* Summary table when members selected */}
            {selectedMembers.length > 0 && (
                <div className="rounded-xl border border-border-subtle overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-bg-subtle">
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-txt-muted">Nhân sự</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-txt-muted">Phòng ban</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-txt-muted">Vai trò trong dự án</th>
                                <th className="px-4 py-2.5"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedMembers.map(sm => {
                                const emp = employees.find(e => e.EmployeeID === sm.employeeId);
                                if (!emp) return null;
                                return (
                                    <tr key={sm.employeeId} className="border-t border-border-subtle hover:bg-gray-50/50 dark:hover:bg-slate-50">
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    name={emp.FullName}
                                                    imageUrl={emp.AvatarUrl}
                                                    size="xs"
                                                />
                                                <div>
                                                    <p className="font-medium text-txt-primary">{emp.FullName}</p>
                                                    <p className="text-[10px] text-txt-placeholder">{emp.Position}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-txt-muted text-xs">{emp.Department || '—'}</td>
                                        <td className="px-4 py-2.5">
                                            <select
                                                value={sm.role}
                                                onChange={e => updateMemberRole(sm.employeeId, e.target.value)}
                                                className="text-xs bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 rounded-lg px-2 py-1 border border-blue-200 dark:border-blue-500/30 outline-none cursor-pointer font-medium"
                                            >
                                                <option value="Giám đốc dự án">Giám đốc dự án</option>
                                                <option value="Trưởng phòng phụ trách">Trưởng phòng phụ trách</option>
                                                <option value="Chuyên viên phụ trách">Chuyên viên phụ trách</option>
                                                <option value="Kế toán dự án">Kế toán dự án</option>
                                                <option value="Thành viên">Thành viên</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <button
                                                type="button"
                                                onClick={() => toggleMember(sm.employeeId)}
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
