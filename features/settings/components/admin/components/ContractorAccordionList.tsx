import React from 'react';
import { Building2, ChevronDown, ChevronRight, Users, UserPlus, Mail, Phone, FolderOpen, ToggleRight, ToggleLeft, Key, Trash2 } from 'lucide-react';

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

interface ContractorGroup {
    contractor_id: string;
    contractor_name: string;
    representative: string | null;
    accounts: ContractorAccount[];
    activeCount: number;
}

interface ContractorAccordionListProps {
    grouped: ContractorGroup[];
    expandedOrgs: Set<string>;
    onToggleExpand: (id: string) => void;
    onSetCreateForContractor: (contractorId: string) => void;
    onShowCreateModal: () => void;
    onSetProjectTarget: (account: ContractorAccount) => void;
    onToggleActive: (account: ContractorAccount) => Promise<void>;
    onOpenResetModal: (account: ContractorAccount) => void;
    onDeleteAccount: (account: ContractorAccount) => Promise<void>;
}

export const ContractorAccordionList: React.FC<ContractorAccordionListProps> = ({
    grouped,
    expandedOrgs,
    onToggleExpand,
    onSetCreateForContractor,
    onShowCreateModal,
    onSetProjectTarget,
    onToggleActive,
    onOpenResetModal,
    onDeleteAccount
}) => {
    return (
        <div className="space-y-3">
            {grouped.map(group => {
                const isExpanded = expandedOrgs.has(group.contractor_id);
                return (
                    <div key={group.contractor_id}
                        className="bg-bg-surface rounded-2xl border border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] overflow-hidden transition-all duration-200">
                        {/* Org Header */}
                        <div
                            className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors select-none"
                            onClick={() => onToggleExpand(group.contractor_id)}
                        >
                            {isExpanded
                                ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                            }
                            <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center shrink-0">
                                <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{group.contractor_name}</p>
                                <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5">
                                    {group.representative || group.contractor_id} · {group.accounts.length} tài khoản · {group.activeCount} hoạt động
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                <span className="px-2.5 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg text-[10px] font-bold">
                                    <Users className="w-3 h-3 inline mr-1" />{group.accounts.length}
                                </span>
                                <button
                                    onClick={() => { onSetCreateForContractor(group.contractor_id); onShowCreateModal(); }}
                                    className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Thêm nhân sự"
                                >
                                    <UserPlus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Expanded — Staff List */}
                        {isExpanded && (
                            <div className="border-t border-gray-100 dark:border-slate-700">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/80 dark:bg-slate-700">
                                            <th className="text-left px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 w-8">#</th>
                                            <th className="text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Nhân sự</th>
                                            <th className="text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Username</th>
                                            <th className="text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Liên hệ</th>
                                            <th className="text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Dự án</th>
                                            <th className="text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Trạng thái</th>
                                            <th className="text-right px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700/40">
                                        {group.accounts.map((acc, idx) => {
                                            const projectCount = acc.allowed_project_ids?.length || 0;
                                            return (
                                                <tr key={acc.account_id} className="hover:bg-blue-50/30 dark:hover:bg-slate-700 transition-colors">
                                                    <td className="px-5 py-2.5 text-gray-300 dark:text-slate-600 text-xs">{idx + 1}</td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                                                {acc.display_name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="font-medium text-gray-800 dark:text-slate-200 text-xs">{acc.display_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded font-mono text-[11px] text-gray-600 dark:text-slate-400">
                                                            {acc.username}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-[11px] text-gray-500 dark:text-slate-400">
                                                        {acc.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{acc.email}</span>}
                                                        {acc.phone && <span className="flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{acc.phone}</span>}
                                                        {!acc.email && !acc.phone && '—'}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <button onClick={() => onSetProjectTarget(acc)}
                                                            className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/15 text-blue-600 dark:text-blue-400 rounded-md text-[11px] font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                                            <FolderOpen className="w-3 h-3" />{projectCount} DA
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <button onClick={() => onToggleActive(acc)}
                                                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-colors ${acc.is_active
                                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100'
                                                                : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100'
                                                                }`}>
                                                            {acc.is_active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                                                            {acc.is_active ? 'ON' : 'OFF'}
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-2.5 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button onClick={() => onOpenResetModal(acc)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/15 rounded-md hover:bg-primary-100 transition-colors">
                                                                <Key className="w-3 h-3" />Reset MK
                                                            </button>
                                                            <button onClick={() => onDeleteAccount(acc)}
                                                                className="inline-flex items-center justify-center w-6 h-6 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                                title="Xóa tài khoản">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
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
            })}
        </div>
    );
};
