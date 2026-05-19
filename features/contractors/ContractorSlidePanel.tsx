import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Contractor, ContractorType, CONTRACTOR_TYPE_LABELS } from '../../types';
import { formatShortCurrency } from '../../utils/format';
import {
    X, Building2, MapPin, Phone, Hash, Calendar, FileText,
    CircleDollarSign, User, Award, Briefcase, Pencil, Loader2,
    ChevronRight, ExternalLink, Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/ui/EmptyState';

interface ContractorSlidePanelProps {
    contractor: Contractor;
    onClose: () => void;
    onEdit: (contractor: Contractor) => void;
}

interface ContractData {
    contract_id: string;
    contract_name: string;
    contract_type: string;
    value: number;
    sign_date: string | null;
    start_date: string | null;
    end_date: string | null;
    status: number;
    project_id: string;
    project_name: string;
}

interface BiddingData {
    package_id: string;
    package_number: string;
    package_name: string;
    winning_price: number | null;
    selection_method: string | null;
    project_name: string;
}

const CONTRACT_STATUS_MAP: Record<number, { label: string; color: string }> = {
    0: { label: 'Đang soạn', color: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700' },
    1: { label: 'Đang thực hiện', color: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30' },
    2: { label: 'Hoàn thành', color: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30' },
    3: { label: 'Đã nghiệm thu', color: 'text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-900/30' },
    4: { label: 'Đã thanh lý', color: 'text-purple-700 bg-purple-50 dark:text-purple-300 dark:bg-purple-900/30' },
};

const CONTRACTOR_TYPE_COLORS: Record<string, string> = {
    Construction: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    Consultancy: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    Supervision: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    Survey: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
    Appraisal: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
    Supplier: 'bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-300',
    Other: 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300',
};

type TabKey = 'overview' | 'contracts' | 'bidding';

const ContractorSlidePanel: React.FC<ContractorSlidePanelProps> = ({ contractor, onClose, onEdit }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabKey>('overview');

    // Fetch contracts
    const { data: contracts = [], isLoading: loadingContracts } = useQuery<ContractData[]>({
        queryKey: ['contractor-panel-contracts', contractor.ContractorID],
        queryFn: async () => {
            const { data: contractRows } = await supabase
                .from('contracts')
                .select('contract_id, contract_name, contract_type, value, sign_date, start_date, end_date, status, project_id')
                .eq('contractor_id', contractor.ContractorID)
                .order('sign_date', { ascending: false });

            if (!contractRows || contractRows.length === 0) return [];

            const projectIds = [...new Set(contractRows.map((c: any) => c.project_id))];
            const { data: projects } = await supabase
                .from('projects')
                .select('project_id, project_name')
                .in('project_id', projectIds);

            const projectMap = new Map((projects || []).map((p: any) => [p.project_id, p.project_name]));

            return contractRows.map((c: any) => ({
                ...c,
                project_name: projectMap.get(c.project_id) || c.project_id,
            }));
        },
        enabled: !!contractor.ContractorID,
    });

    // Fetch bidding packages won
    const { data: biddingPackages = [], isLoading: loadingBidding } = useQuery<BiddingData[]>({
        queryKey: ['contractor-panel-bidding', contractor.ContractorID],
        queryFn: async () => {
            const { data: pkgRows } = await supabase
                .from('bidding_packages')
                .select('package_id, package_number, package_name, winning_price, selection_method, project_id')
                .eq('winning_contractor_id', contractor.ContractorID)
                .order('package_number', { ascending: false });

            if (!pkgRows || pkgRows.length === 0) return [];

            const projectIds = [...new Set(pkgRows.map((p: any) => p.project_id))];
            const { data: projects } = await supabase
                .from('projects')
                .select('project_id, project_name')
                .in('project_id', projectIds);

            const projectMap = new Map((projects || []).map((p: any) => [p.project_id, p.project_name]));

            return pkgRows.map((p: any) => ({
                ...p,
                project_name: projectMap.get(p.project_id) || p.project_id,
            }));
        },
        enabled: !!contractor.ContractorID,
    });

    const totalContractValue = contracts.reduce((sum, c) => sum + (c.value || 0), 0);
    const totalWonValue = biddingPackages.reduce((sum, p) => sum + (p.winning_price || 0), 0);
    const activeContracts = contracts.filter(c => c.status === 1).length;

    const tabs: { key: TabKey; label: string; count?: number }[] = [
        { key: 'overview', label: 'Tổng quan' },
        { key: 'contracts', label: 'Hợp đồng', count: contracts.length },
        { key: 'bidding', label: 'Gói thầu', count: biddingPackages.length },
    ];

    const infoItems = [
        { icon: Hash, label: 'Mã số thuế', value: contractor.TaxCode },
        { icon: MapPin, label: 'Địa chỉ', value: contractor.Address },
        { icon: Phone, label: 'Liên hệ', value: contractor.ContactInfo },
        { icon: User, label: 'Người đại diện', value: contractor.Representative },
        { icon: Calendar, label: 'Năm thành lập', value: contractor.EstablishedYear ? String(contractor.EstablishedYear) : undefined },
        { icon: Award, label: 'Chứng chỉ năng lực', value: contractor.CapCertCode, link: contractor.CapCertLink },
    ].filter(item => item.value);

    const statusInfo = (status: number) => CONTRACT_STATUS_MAP[status] || { label: `Trạng thái ${status}`, color: 'text-gray-500 bg-gray-100' };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 bottom-0 left-64 bg-white dark:bg-slate-800 z-50 shadow-sm border-l border-gray-200 dark:border-slate-700 animate-in slide-in-from-right duration-300 flex flex-col">

                {/* ═══ HEADER ═══ */}
                <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-start gap-4 shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-warning-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/20">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 leading-tight truncate" title={contractor.FullName}>
                            {contractor.FullName}
                        </h2>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${CONTRACTOR_TYPE_COLORS[contractor.ContractorType] || CONTRACTOR_TYPE_COLORS.Other}`}>
                                {CONTRACTOR_TYPE_LABELS[contractor.ContractorType] || 'Khác'}
                            </span>
                            {contractor.TaxCode && (
                                <span className="text-[10px] text-gray-400 dark:text-slate-400 font-mono">
                                    MST: {contractor.TaxCode}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={() => onEdit(contractor)}
                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                            title="Chỉnh sửa"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-400 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ═══ TABS ═══ */}
                <div className="px-5 border-b border-gray-200 dark:border-slate-700 flex gap-1 shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-3 py-2.5 text-xs font-bold transition-colors relative whitespace-nowrap ${
                                activeTab === tab.key
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                            }`}
                        >
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${
                                    activeTab === tab.key
                                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                            {activeTab === tab.key && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-blue-400 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* ═══ CONTENT ═══ */}
                <div className="flex-1 overflow-y-auto">

                    {/* --- Tab: Tổng quan --- */}
                    {activeTab === 'overview' && (
                        <div className="p-5 space-y-5">
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-primary-50/80 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 rounded-xl p-3">
                                    <p className="text-[9px] text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wide">Hợp đồng</p>
                                    <p className="text-xl font-black text-primary-700 dark:text-primary-300 mt-0.5">{contracts.length}</p>
                                    <p className="text-[9px] text-primary-500 dark:text-primary-400/70">{activeContracts} đang thực hiện</p>
                                </div>
                                <div className="bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl p-3">
                                    <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide">Giá trị HĐ</p>
                                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{formatShortCurrency(totalContractValue)}</p>
                                </div>
                                <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-3">
                                    <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide">Trúng thầu</p>
                                    <p className="text-xl font-black text-blue-700 dark:text-blue-300 mt-0.5">{biddingPackages.length}</p>
                                    <p className="text-[9px] text-blue-500 dark:text-blue-400/70">{formatShortCurrency(totalWonValue)}</p>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                                <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                                    <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Thông tin tổ chức</h3>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                    {infoItems.length > 0 ? infoItems.map(item => (
                                        <div key={item.label} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                                            <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                                <item.icon className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-gray-400 dark:text-slate-400 uppercase tracking-wide font-medium">{item.label}</p>
                                                {item.link ? (
                                                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 font-medium truncate mt-0.5 hover:underline flex items-center gap-1">
                                                        {item.value} <Globe className="w-3 h-3" />
                                                    </a>
                                                ) : (
                                                    <p className="text-sm text-gray-800 dark:text-slate-200 font-medium truncate mt-0.5">{item.value}</p>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-4 text-xs text-gray-400 dark:text-slate-400 text-center italic">Chưa có thông tin chi tiết</div>
                                    )}
                                </div>
                            </div>

                            {/* Recent contracts preview */}
                            {contracts.length > 0 && (
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                                    <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                            <Briefcase className="w-3.5 h-3.5" /> Hợp đồng gần đây
                                        </h3>
                                        <button
                                            onClick={() => setActiveTab('contracts')}
                                            className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5"
                                        >
                                            Xem tất cả <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                        {contracts.slice(0, 3).map(ct => {
                                            const st = statusInfo(ct.status);
                                            return (
                                                <div
                                                    key={ct.contract_id}
                                                    className="p-3.5 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                                    onClick={() => navigate(`/contracts/${ct.contract_id}`)}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 leading-tight truncate">
                                                                {ct.contract_name}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5 truncate">
                                                                {ct.project_name}
                                                            </p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <div className="flex items-center gap-1 text-xs font-bold text-primary-700 dark:text-primary-400">
                                                                <CircleDollarSign className="w-3 h-3" />
                                                                {formatShortCurrency(ct.value)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${st.color}`}>{st.label}</span>
                                                        {ct.sign_date && (
                                                            <span className="text-[9px] text-gray-400 dark:text-slate-400 flex items-center gap-0.5">
                                                                <Calendar className="w-2.5 h-2.5" />
                                                                {new Date(ct.sign_date).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- Tab: Hợp đồng --- */}
                    {activeTab === 'contracts' && (
                        <div className="p-5 space-y-3">
                            {loadingContracts ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                </div>
                            ) : contracts.length === 0 ? (
                                <EmptyState
                                    icon={<FileText className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
                                    title="Chưa có hợp đồng nào"
                                />
                            ) : (
                                contracts.map(ct => {
                                    const st = statusInfo(ct.status);
                                    return (
                                        <div
                                            key={ct.contract_id}
                                            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                                            onClick={() => navigate(`/contracts/${ct.contract_id}`)}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-800 dark:text-slate-200 leading-tight">
                                                        {ct.contract_name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5 truncate">
                                                        {ct.project_name}
                                                    </p>
                                                </div>
                                                <ExternalLink className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600 shrink-0" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${st.color}`}>{st.label}</span>
                                                    {ct.contract_type && (
                                                        <span className="text-[9px] font-medium text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-600 px-1.5 py-0.5 rounded">
                                                            {ct.contract_type}
                                                        </span>
                                                    )}
                                                    {ct.sign_date && (
                                                        <span className="text-[9px] text-gray-400 dark:text-slate-400 flex items-center gap-0.5">
                                                            <Calendar className="w-2.5 h-2.5" />
                                                            {new Date(ct.sign_date).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs font-bold text-primary-700 dark:text-primary-400">
                                                    <CircleDollarSign className="w-3 h-3" />
                                                    {formatShortCurrency(ct.value)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* --- Tab: Gói thầu --- */}
                    {activeTab === 'bidding' && (
                        <div className="p-5 space-y-3">
                            {loadingBidding ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                </div>
                            ) : biddingPackages.length === 0 ? (
                                <EmptyState
                                    icon={<Award className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
                                    title="Chưa có gói thầu trúng"
                                />
                            ) : (
                                biddingPackages.map(pkg => (
                                    <div
                                        key={pkg.package_id}
                                        className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800 dark:text-slate-200 leading-tight">
                                                    {pkg.package_name}
                                                </p>
                                                <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5 truncate">
                                                    {pkg.project_name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                                                    Đã trúng thầu
                                                </span>
                                                {pkg.package_number && (
                                                    <span className="text-[9px] font-mono text-gray-400 dark:text-slate-400">
                                                        #{pkg.package_number}
                                                    </span>
                                                )}
                                                {pkg.selection_method && (
                                                    <span className="text-[9px] font-medium text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-600 px-1.5 py-0.5 rounded">
                                                        {pkg.selection_method}
                                                    </span>
                                                )}
                                            </div>
                                            {pkg.winning_price && (
                                                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                    <CircleDollarSign className="w-3 h-3" />
                                                    {formatShortCurrency(pkg.winning_price)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ContractorSlidePanel;
