import React, { useState } from 'react';
import { Building2, Users, Search, ChevronDown, Check, X } from 'lucide-react';
import { MANAGEMENT_BOARDS, Employee, SelectedMember } from '../../../../types';
import { SectionHeader, labelClass, inputClass } from './FormShared';

interface ProjectFormGeneralProps {
    formData: Record<string, any>;
    updateField: (field: string, value: any) => void;
    aiHighlight: (field: string) => string;
    employees: Employee[];
    selectedMembers: SelectedMember[];
    toggleMember: (empId: string) => void;
    updateMemberRole: (empId: string, role: string) => void;
}

export const ProjectFormGeneral: React.FC<ProjectFormGeneralProps> = ({
    formData,
    updateField,
    aiHighlight,
    employees,
    selectedMembers,
    toggleMember,
    updateMemberRole
}) => {
    const [memberSearch, setMemberSearch] = useState('');
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);

    const filteredEmployees = employees.filter(e => {
        const dept = e.Department || 'Khác';
        const isSearchMatch = e.FullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
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
            <SectionHeader icon={Building2} title="Thông tin cơ bản" subtitle="Định danh và phân loại dự án" />

            {/* Project Code (Auto) */}
            <div className="mb-4">
                <label className={labelClass}>
                    Mã dự án <span className="text-blue-500 dark:text-blue-400 text-xs font-normal">(Tự động theo TT24/2025)</span>
                </label>
                <input
                    type="text"
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-bg-app dark:bg-slate-900 dark:bg-slate-700 text-gray-500 dark:text-slate-400 font-mono outline-none cursor-not-allowed"
                    value={formData.ProjectID}
                />
            </div>

            {/* Project Name */}
            <div className="mb-4">
                <label className={labelClass}>Tên dự án <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    required
                    placeholder="VD: Xây dựng Đường Cao tốc Bắc Nam..."
                    className={inputClass + aiHighlight('ProjectName')}
                    value={formData.ProjectName}
                    onChange={e => updateField('ProjectName', e.target.value)}
                />
            </div>

            {/* Mục tiêu đầu tư */}
            <div className="mt-4">
                <label className={labelClass}>Mục tiêu đầu tư</label>
                <textarea
                    placeholder="VD: Đáp ứng yêu cầu tổ chức các giải đấu quốc tế, góp phần tạo cơ sở vật chất hoàn chỉnh..."
                    className={inputClass + ' min-h-[72px] resize-none' + aiHighlight('Objective')}
                    value={formData.Objective}
                    onChange={e => updateField('Objective', e.target.value)}
                    rows={2}
                    onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                />
            </div>

            {/* Tóm tắt quy mô đầu tư */}
            <div className="mt-4">
                <label className={labelClass}>Tóm tắt quy mô đầu tư</label>
                <textarea
                    placeholder="VD: Cải tạo, sửa chữa hiện trạng công trình gồm: trệt + mái tôn; dài khoảng 135,65m..."
                    className={inputClass + ' min-h-[72px] resize-none' + aiHighlight('InvestmentScale')}
                    value={formData.InvestmentScale}
                    onChange={e => updateField('InvestmentScale', e.target.value)}
                    rows={2}
                    onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                />
            </div>

            {/* Ban QLDA */}
            <div className="mt-4">
                <label className={labelClass}>Ban Quản Lý Dự Án</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {MANAGEMENT_BOARDS.map(board => (
                        <button
                            key={board.value}
                            type="button"
                            onClick={() => updateField('ManagementBoard', board.value)}
                            className={`py-2 px-3 rounded-xl text-sm font-semibold transition-all border-2 whitespace-nowrap flex items-center justify-center ${
                                formData.ManagementBoard === board.value
                                    ? `${board.color} text-white border-transparent shadow-md scale-[1.02]`
                                    : 'bg-bg-surface text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            Ban {board.value}
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full"></span>
                Nhóm dự án tự động áp dụng thời gian chuẩn theo Luật ĐTC
            </p>

            {/* Thành viên dự án */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-blue-500" />
                    <div>
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-100">Thành viên dự án</h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Chọn nhân sự tham gia quản lý dự án</p>
                    </div>
                </div>

                {/* Selected Members Chips */}
                {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {selectedMembers.map(sm => {
                            const emp = employees.find(e => e.EmployeeID === sm.employeeId);
                            if (!emp) return null;
                            return (
                                <div key={sm.employeeId} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl px-3 py-1.5 group">
                                    <img
                                        src={emp.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.FullName)}&background=random&color=fff&size=24`}
                                        alt={emp.FullName}
                                        className="w-5 h-5 rounded-full object-cover"
                                    />
                                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">{emp.FullName}</span>
                                    <select
                                        value={sm.role}
                                        onChange={e => updateMemberRole(sm.employeeId, e.target.value)}
                                        className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-md px-1 py-0.5 border-none outline-none cursor-pointer font-semibold"
                                    >
                                        <option value="Giám đốc dự án">Giám đốc DA</option>
                                        <option value="Phó Giám đốc dự án">Phó GĐ DA</option>
                                        <option value="Trưởng phòng phụ trách">TP phụ trách</option>
                                        <option value="Kỹ sư giám sát">KS giám sát</option>
                                        <option value="Cán bộ kỹ thuật">CB kỹ thuật</option>
                                        <option value="Kế toán dự án">Kế toán DA</option>
                                        <option value="Thành viên">Thành viên</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => toggleMember(sm.employeeId)}
                                        className="w-4 h-4 rounded-full flex items-center justify-center text-blue-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Search & Dropdown */}
                <div className="relative">
                    <div
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 flex items-center gap-2 cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors"
                        onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                    >
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Tìm nhân sự... (${selectedMembers.length} đã chọn)`}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                            value={memberSearch}
                            onChange={e => { setMemberSearch(e.target.value); setShowMemberDropdown(true); }}
                            onFocus={() => setShowMemberDropdown(true)}
                        />
                        <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-slate-400 transition-transform ${showMemberDropdown ? 'rotate-180' : ''}`} />
                    </div>

                    {showMemberDropdown && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMemberDropdown(false)}></div>
                            <div className="absolute z-20 mt-1 w-full bg-bg-surface border border-gray-200 dark:border-slate-600 rounded-xl shadow-sm max-h-56 overflow-y-auto">
                                {Object.keys(groupedEmployees).length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-400 dark:text-slate-400">Không tìm thấy nhân sự</div>
                                ) : (
                                    Object.entries(groupedEmployees).map(([dept, emps]: [string, Employee[]]) => (
                                        <div key={dept}>
                                            <div className="px-3 py-1.5 bg-bg-app dark:bg-slate-900 dark:bg-slate-700 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider sticky top-0">
                                                {dept}
                                            </div>
                                            {emps.map(emp => {
                                                const isSelected = selectedMembers.some(m => m.employeeId === emp.EmployeeID);
                                                return (
                                                    <button
                                                        key={emp.EmployeeID}
                                                        type="button"
                                                        onClick={() => {
                                                            toggleMember(emp.EmployeeID);
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-500/15' : ''}`}
                                                    >
                                                        <img
                                                            src={emp.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.FullName)}&background=random&color=fff&size=28`}
                                                            alt={emp.FullName}
                                                            className="w-7 h-7 rounded-full object-cover ring-2 ring-white dark:ring-slate-700 shadow-sm"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{emp.FullName}</p>
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-400 truncate">{emp.Position}</p>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                                                                <Check className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>

                {selectedMembers.length === 0 && (
                    <p className="text-[11px] text-primary-600 dark:text-primary-400 mt-2 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 bg-primary-500 dark:bg-primary-400 rounded-full"></span>
                        Có thể bổ sung thành viên sau khi tạo dự án
                    </p>
                )}
            </div>
        </div>
    );
};
