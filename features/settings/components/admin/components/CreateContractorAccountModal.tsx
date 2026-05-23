import React, { useState, useEffect } from 'react';
import { UserPlus, AlertCircle, Mail, Phone, Key, EyeOff, Eye, Check, Copy, FolderOpen, RotateCcw } from 'lucide-react';
import { supabase, adminUserOp } from '../../../../../lib/supabase';
import { removeVietnamese, generatePassword } from '../utils/adminUtils';

interface ContractorInfo {
    contractor_id: string;
    full_name: string;
    representative: string | null;
}

interface ProjectInfo {
    project_id: string;
    project_name: string;
}

interface ContractorAccount {
    account_id: string;
    contractor_id: string;
    username: string;
    display_name: string;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    last_login: string | null;
    allowed_project_ids: string[] | null;
    auth_user_id: string | null;
    created_at: string | null;
    contractor_name?: string;
}

interface CreateModalProps {
    contractors: ContractorInfo[];
    projects: ProjectInfo[];
    existingAccounts: ContractorAccount[];
    preselectedContractor: string | null;
    onClose: () => void;
    onCreated: () => void;
}

export const CreateContractorAccountModal: React.FC<CreateModalProps> = ({
    contractors, projects, preselectedContractor, onClose, onCreated
}) => {
    const [selectedContractor, setSelectedContractor] = useState(preselectedContractor || '');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState(generatePassword());
    const [showPassword, setShowPassword] = useState(true);
    const [copied, setCopied] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const selectedCtr = contractors.find(c => c.contractor_id === selectedContractor);

    // Auto-generate username from display name
    useEffect(() => {
        if (!displayName) return;
        const parts = displayName.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            const lastName = parts[parts.length - 1];
            const initials = parts.slice(0, -1).map(p => p.charAt(0)).join('');
            setUsername(`${removeVietnamese(lastName)}.${removeVietnamese(initials)}`.toUpperCase());
        } else if (parts.length === 1) {
            setUsername(removeVietnamese(parts[0]).toUpperCase());
        }
    }, [displayName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContractor || !displayName || !username || !password) return;
        if (password.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự'); return; }

        setSubmitting(true);
        setError('');
        try {
            // Create Supabase auth user
            const authEmail = email || `${username.toLowerCase()}@cic.vn`;
            let authUserId: string | null = null;

            try {
                const authData = await adminUserOp<{ user: { id: string } | null }>('createUser', {
                    email: authEmail,
                    password,
                    email_confirm: true,
                    user_metadata: { full_name: displayName, contractor_id: selectedContractor },
                });
                authUserId = authData?.user?.id || null;
            } catch (e: any) {
                console.error('[ContractorAcct] Auth user creation failed', e);
                setError(`Không thể tạo tài khoản xác thực: ${e.message}`);
                setSubmitting(false);
                return;
            }

            // Create contractor_accounts record
            const { error: insertErr } = await supabase.from('contractor_accounts').insert({
                contractor_id: selectedContractor,
                username,
                display_name: displayName,
                email: authEmail,
                phone: phone || null,
                auth_user_id: authUserId,
                is_active: true,
                allowed_project_ids: selectedProjects.length > 0 ? selectedProjects : null,
            });

            if (insertErr) {
                if (insertErr.code === '23505') throw new Error('Username đã tồn tại');
                throw insertErr;
            }

            onCreated();
        } catch (err: any) {
            setError(err.message || 'Tạo tài khoản thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    const copyPwd = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleProject = (pid: string) => {
        setSelectedProjects(prev =>
            prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                        <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Tạo tài khoản nhà thầu</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Gán tài khoản đăng nhập cho nhân sự nhà thầu</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-slate-800 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2 border border-red-100 dark:border-red-900/50">
                        <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Contractor select */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Đơn vị nhà thầu <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedContractor}
                            onChange={e => setSelectedContractor(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-slate-100"
                            required
                        >
                            <option value="">-- Chọn nhà thầu --</option>
                            {contractors.map(c => (
                                <option key={c.contractor_id} value={c.contractor_id}>{c.full_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Display name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Họ tên nhân sự <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-slate-100"
                            placeholder="Nguyễn Văn A"
                            required
                        />
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Email
                            </label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100"
                                placeholder="abc@email.com" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> Điện thoại
                            </label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100"
                                placeholder="0901234567" />
                        </div>
                    </div>

                    {/* Username & Password */}
                    <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                            <Key className="w-3 h-3" /> Thông tin đăng nhập
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-mono text-gray-900 dark:text-slate-100"
                                    placeholder="nguyenvana" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">
                                    Mật khẩu <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full px-3.5 py-2.5 pr-20 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-mono text-gray-900 dark:text-slate-100"
                                        required
                                    />
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1 text-gray-400 hover:text-gray-600">
                                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                        <button type="button" onClick={copyPwd} className="p-1 text-gray-400 hover:text-primary-600">
                                            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                        <button type="button" onClick={() => { setPassword(generatePassword()); setCopied(false); }} className="p-1 text-gray-400 hover:text-primary-600">
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Project assignment */}
                    <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                            <FolderOpen className="w-3 h-3" /> Gán dự án ({selectedProjects.length})
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-1.5 bg-gray-50 dark:bg-slate-700 rounded-xl p-2">
                            {projects.map(proj => {
                                const isSelected = selectedProjects.includes(proj.project_id);
                                return (
                                    <button
                                        key={proj.project_id}
                                        type="button"
                                        onClick={() => toggleProject(proj.project_id)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-all ${isSelected
                                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 font-medium'
                                            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isSelected
                                            ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 dark:border-slate-600'
                                            }`}>
                                            {isSelected && <Check className="w-2.5 h-2.5" />}
                                        </div>
                                        <span className="truncate">{proj.project_name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={submitting || !selectedContractor || !displayName || !username || !password}
                            className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 shadow-sm shadow-primary-500/25">
                            {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
