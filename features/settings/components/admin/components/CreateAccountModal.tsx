import React, { useState, useEffect } from 'react';
import { UserPlus, AlertCircle, User as UserIcon, Mail, Phone, Key, EyeOff, Eye, Check, Copy, RotateCcw } from 'lucide-react';
import { UserAccountService } from '../../../../../services/UserAccountService';
import { removeVietnamese } from '../utils/adminUtils';

interface CreateModalProps {
    onClose: () => void;
    onCreated: () => void;
    createdBy?: string;
}

export const CreateAccountModal: React.FC<CreateModalProps> = ({ onClose, onCreated, createdBy }) => {
    const [employees, setEmployees] = useState<{ employee_id: string; full_name: string; email: string; phone: string; department: string }[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState(UserAccountService.generatePassword());
    const [showPassword, setShowPassword] = useState(true);
    const [copied, setCopied] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        UserAccountService.getEmployeesWithoutAccount().then(data => {
            setEmployees(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    // Auto-generate username from employee name
    useEffect(() => {
        if (!selectedEmployee) return;
        const emp = employees.find(e => e.employee_id === selectedEmployee);
        if (emp) {
            // Generate username from name: remove Vietnamese chars, join with dot
            const parts = emp.full_name.split(' ').filter(Boolean);
            if (parts.length >= 2) {
                const lastName = parts[parts.length - 1];
                const initials = parts.slice(0, -1).map(p => p.charAt(0)).join('');
                setUsername(`${removeVietnamese(lastName)}.${removeVietnamese(initials)}`.toUpperCase());
            } else {
                setUsername(removeVietnamese(emp.full_name).toUpperCase());
            }
        }
    }, [selectedEmployee, employees]);

    const selectedEmp = employees.find(e => e.employee_id === selectedEmployee);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee || !username || !password) return;

        if (!selectedEmp?.email) {
            setError('Nhân viên này chưa có email trên hệ thống. Vui lòng cập nhật email trước.');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            await UserAccountService.create({
                employee_id: selectedEmployee,
                username,
                password,
                email: selectedEmp.email,
            }, createdBy);
            onCreated();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const copyPwd = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                        <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Tạo tài khoản mới</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Gán tài khoản đăng nhập cho nhân viên</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Employee select */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Chọn nhân viên <span className="text-red-500">*</span>
                        </label>
                        {loading ? (
                            <div className="py-3 text-sm text-gray-400">Đang tải...</div>
                        ) : employees.length === 0 ? (
                            <div className="py-3 text-sm text-gray-400">Tất cả nhân viên đều đã có tài khoản</div>
                        ) : (
                            <select
                                value={selectedEmployee}
                                onChange={e => setSelectedEmployee(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-slate-100"
                                required
                            >
                                <option value="">-- Chọn nhân viên --</option>
                                {employees.map(emp => (
                                    <option key={emp.employee_id} value={emp.employee_id}>
                                        {emp.full_name} — {emp.department || 'Chưa phân phòng'}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Selected employee info */}
                    {selectedEmp && (
                        <div className="bg-primary-50 dark:bg-slate-800 border border-primary-100 dark:border-slate-700 rounded-xl p-3 text-sm">
                            <div className="flex items-center gap-2 text-primary-700 dark:text-primary-400">
                                <UserIcon className="w-4 h-4" />
                                <strong>{selectedEmp.full_name}</strong>
                            </div>
                            <div className="mt-1 space-y-0.5 text-primary-600/70 dark:text-primary-400/70 text-xs">
                                {selectedEmp.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedEmp.email}</p>}
                                {selectedEmp.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedEmp.phone}</p>}
                            </div>
                        </div>
                    )}

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Username <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-gray-900 dark:text-slate-100"
                                placeholder="VD: NGUYEN.VA"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Mật khẩu <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-11 pr-28 py-3 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-gray-900 dark:text-slate-100"
                                required
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1.5 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button type="button" onClick={copyPwd} className="p-1.5 text-gray-400 hover:text-primary-600" title="Copy">
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setPassword(UserAccountService.generatePassword()); setCopied(false); }}
                                    className="p-1.5 text-gray-400 hover:text-primary-600"
                                    title="Sinh mới"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Gửi mật khẩu này cho nhân viên. Người dùng có thể đổi sau.</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !selectedEmployee || !username || !password}
                            className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 shadow-sm shadow-primary-500/25"
                        >
                            {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
