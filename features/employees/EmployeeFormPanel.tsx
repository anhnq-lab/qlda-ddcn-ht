import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmployeeCreateSchema, EmployeeCreateInput } from '../../schemas/employee.schema';
import { useDepartments, useCreateEmployee, useUpdateEmployee } from '../../hooks/useEmployees';
import { useAuth } from '../../context/AuthContext';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { useToast } from '../../components/ui/Toast';
import { EmployeeStatus, Role } from '../../types';
import { SectionHeader } from '../../components/ui';
import { User, Building2, ChevronDown, Briefcase, Mail, Phone, Lock, Hash, Shield, Calendar, Save, X, Sparkles } from 'lucide-react';

export interface EmployeeFormPanelProps {
    editMode: 'create' | 'edit';
    employeeId?: string;
    initialData?: Partial<EmployeeCreateInput>;
}

const EmployeeFormPanel: React.FC<EmployeeFormPanelProps> = ({ editMode, employeeId, initialData }) => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const { closePanel } = useSlidePanel();

    const { data: departments = [] } = useDepartments();
    const createMutation = useCreateEmployee();
    const updateMutation = useUpdateEmployee();

    const canManageUsers = currentUser?.Role === Role.Admin;

    const form = useForm<EmployeeCreateInput>({
        resolver: zodResolver(EmployeeCreateSchema) as any,
        defaultValues: {
            FullName: '',
            Department: departments[0] || 'Phòng Hành chính - Tổng hợp',
            Position: 'Chuyên viên',
            Email: '',
            Phone: '',
            Username: '',
            Password: '',
            Role: Role.Staff,
            Status: EmployeeStatus.Active,
            JoinDate: new Date().toISOString().split('T')[0],
            DateOfBirth: '',
            PermanentAddress: '',
            Specialty: '',
            PoliticalTheory: '',
            TenureInfo: ''
        }
    });

    useEffect(() => {
        if (initialData) {
            form.reset(initialData as any);
        }
    }, [initialData, form]);

    const onSubmit = async (data: EmployeeCreateInput) => {
        try {
            if (editMode === 'create') {
                await createMutation.mutateAsync(data);
                showToast('Thêm nhân sự mới thành công!', 'success');
                closePanel('/employees/new');
            } else {
                if (!employeeId) return;
                await updateMutation.mutateAsync({
                    id: employeeId,
                    data: data
                });
                showToast('Cập nhật thông tin thành công!', 'success');
                closePanel(`/employees/edit/${employeeId}`);
            }
        } catch (err: any) {
            console.error('[EmployeeSaveError]', err);
            showToast(`Lỗi: ${err.message || 'Vui lòng thử lại.'}`, 'error');
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center sticky top-0 z-10">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {editMode === 'create' ? 'Thêm nhân sự mới' : 'Cập nhật thông tin'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {editMode === 'create' ? 'Điền đầy đủ thông tin để tạo tài khoản' : 'Chỉnh sửa thông tin nhân sự'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Section: Thông tin cơ bản */}
                <div>
                    <SectionHeader title="Thông tin cơ bản" icon={<User className="w-4 h-4" />} size="sm" />
                    <div className="grid grid-cols-2 gap-5 mt-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Họ và tên *</label>
                            <input
                                {...form.register('FullName')}
                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${form.formState.errors.FullName ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/30'} rounded-xl focus:outline-none focus:ring-2 text-sm dark:text-slate-200 font-medium transition-all`}
                                placeholder="Nguyễn Văn A"
                            />
                            {form.formState.errors.FullName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.FullName.message}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Phòng ban *</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                <select
                                    disabled={!canManageUsers && editMode === 'edit'}
                                    {...form.register('Department')}
                                    className={`w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border ${form.formState.errors.Department ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all appearance-none`}
                                >
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                            </div>
                            {form.formState.errors.Department && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Department.message}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Chức danh *</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                <select
                                    disabled={!canManageUsers && editMode === 'edit'}
                                    {...form.register('Position')}
                                    className={`w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border ${form.formState.errors.Position ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all appearance-none`}
                                >
                                    <option value="Giám đốc Ban">Giám đốc Ban</option>
                                    <option value="Phó Giám đốc Ban">Phó Giám đốc Ban</option>
                                    <option value="Trưởng phòng">Trưởng phòng</option>
                                    <option value="Phó phòng">Phó phòng</option>
                                    <option value="Chánh Văn phòng">Chánh Văn phòng</option>
                                    <option value="Phó Văn phòng">Phó Văn phòng</option>
                                    <option value="Kế toán trưởng">Kế toán trưởng</option>
                                    <option value="Kế toán viên">Kế toán viên</option>
                                    <option value="Chuyên viên chính">Chuyên viên chính</option>
                                    <option value="Chuyên viên">Chuyên viên</option>
                                    <option value="Kỹ sư chính">Kỹ sư chính</option>
                                    <option value="Kỹ sư">Kỹ sư</option>
                                    <option value="Tư vấn giám sát">Tư vấn giám sát</option>
                                    <option value="Cán bộ kỹ thuật">Cán bộ kỹ thuật</option>
                                    <option value="Cán bộ hiện trường">Cán bộ hiện trường</option>
                                    <option value="Nhân viên">Nhân viên</option>
                                    <option value="Khác">Khác</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                            </div>
                            {form.formState.errors.Position && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Position.message}</p>}
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Section: Liên hệ */}
                <div>
                    <SectionHeader title="Thông tin liên hệ" icon={<Mail className="w-4 h-4" />} size="sm" />
                    <div className="grid grid-cols-2 gap-5 mt-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Email *</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                <input
                                    type="email"
                                    {...form.register('Email')}
                                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${form.formState.errors.Email ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all`}
                                    placeholder="email@example.com"
                                />
                            </div>
                            {form.formState.errors.Email && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Email.message}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Số điện thoại</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                <input
                                    type="tel"
                                    {...form.register('Phone')}
                                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${form.formState.errors.Phone ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all`}
                                    placeholder="0912345678"
                                />
                            </div>
                            {form.formState.errors.Phone && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Phone.message}</p>}
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Section: Tài khoản & Quyền */}
                <div>
                    <SectionHeader title="Tài khoản & Phân quyền" icon={<Lock className="w-4 h-4" />} size="sm" />
                    <div className="grid grid-cols-2 gap-5 mt-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Tên đăng nhập</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                <input
                                    type="text"
                                    {...form.register('Username')}
                                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${form.formState.errors.Username ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all`}
                                    placeholder="username"
                                />
                            </div>
                            {form.formState.errors.Username && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Username.message}</p>}
                        </div>
                        {editMode === 'create' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Mật khẩu</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                    <input
                                        type="password"
                                        {...form.register('Password')}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${form.formState.errors.Password ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all`}
                                        placeholder="••••••"
                                    />
                                </div>
                                {form.formState.errors.Password && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Password.message}</p>}
                            </div>
                        )}
                        <div className={editMode === 'edit' ? 'col-span-2' : ''}>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Vai trò *</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                <select
                                    disabled={!canManageUsers}
                                    {...form.register('Role')}
                                    className={`w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border ${form.formState.errors.Role ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all appearance-none`}
                                >
                                    <option value={Role.Staff}>Nhân viên</option>
                                    <option value={Role.Manager}>Quản lý</option>
                                    <option value={Role.Admin}>Quản trị viên</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                            </div>
                            {form.formState.errors.Role && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Role.message}</p>}
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Section: Lý lịch & Trình độ */}
                <div>
                    <SectionHeader title="Lý lịch & Trình độ" icon={<Sparkles className="w-4 h-4" />} size="sm" />
                    <div className="grid grid-cols-2 gap-5 mt-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Ngày sinh</label>
                            <input
                                type="date"
                                {...form.register('DateOfBirth')}
                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${form.formState.errors.DateOfBirth ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all`}
                            />
                            {form.formState.errors.DateOfBirth && <p className="text-red-500 text-xs mt-1">{form.formState.errors.DateOfBirth.message}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Lý luận chính trị</label>
                            <div className="relative">
                                <select
                                    {...form.register('PoliticalTheory')}
                                    className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${form.formState.errors.PoliticalTheory ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all appearance-none`}
                                >
                                    <option value="">Không</option>
                                    <option value="Sơ cấp">Sơ cấp</option>
                                    <option value="Trung cấp">Trung cấp</option>
                                    <option value="Cao cấp">Cao cấp</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                            </div>
                            {form.formState.errors.PoliticalTheory && <p className="text-red-500 text-xs mt-1">{form.formState.errors.PoliticalTheory.message}</p>}
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Chuyên môn / Học vị</label>
                            <input
                                type="text"
                                {...form.register('Specialty')}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
                                placeholder="Ví dụ: Kỹ sư xây dựng, Thạc sỹ QLDA..."
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Nơi thường trú</label>
                            <input
                                type="text"
                                {...form.register('PermanentAddress')}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
                                placeholder="Nhập địa chỉ đăng ký thường trú..."
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Thời gian công tác</label>
                            <textarea
                                {...form.register('TenureInfo')}
                                rows={2}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all resize-none"
                                placeholder="Quá trình công tác / Thời gian giữ chức vụ..."
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Section: Thời gian & Trạng thái */}
                <div>
                    <SectionHeader title="Thời gian & Trạng thái" icon={<Calendar className="w-4 h-4" />} size="sm" />
                    <div className="grid grid-cols-2 gap-5 mt-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Ngày vào làm</label>
                            <input
                                type="date"
                                {...form.register('JoinDate')}
                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${form.formState.errors.JoinDate ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all`}
                            />
                            {form.formState.errors.JoinDate && <p className="text-red-500 text-xs mt-1">{form.formState.errors.JoinDate.message}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Trạng thái</label>
                            <div className="relative">
                                <select
                                    disabled={!canManageUsers}
                                    {...form.register('Status', { valueAsNumber: true })}
                                    className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${form.formState.errors.Status ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/30'} rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 transition-all appearance-none`}
                                >
                                    <option value={EmployeeStatus.Active}>Đang làm việc</option>
                                    <option value={EmployeeStatus.Inactive}>Đã nghỉ việc</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                            </div>
                            {form.formState.errors.Status && <p className="text-red-500 text-xs mt-1">{form.formState.errors.Status.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Nội dung công việc & Tiêu chí */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Nội dung công việc</label>
                        <textarea
                            {...form.register('JobContent')}
                            rows={3}
                            placeholder="Mô tả nội dung công việc..."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Tiêu chí đánh giá hoàn thành</label>
                        <textarea
                            {...form.register('CompletionCriteria')}
                            rows={3}
                            placeholder="Tiêu chí đánh giá..."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Bottom padding for fixed actions */}
                <div className="h-10"></div>
            </form>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 sticky bottom-0">
                <button
                    type="button"
                    onClick={() => closePanel(editMode === 'create' ? '/employees/new' : `/employees/edit/${employeeId}`)}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                    Hủy bỏ
                </button>
                <button
                    onClick={form.handleSubmit(onSubmit)}
                    type="button"
                    className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 rounded-xl shadow-sm shadow-primary-600/25 transition-all active:scale-[0.98] flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {editMode === 'create' ? 'Tạo nhân sự' : 'Lưu thay đổi'}
                </button>
            </div>
        </div>
    );
};

export default EmployeeFormPanel;
