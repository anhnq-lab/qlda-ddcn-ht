import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
    Building2, MapPin, Phone, Hash, Calendar, FileText, CircleDollarSign,
    User, Globe, Award, Briefcase, Package2, Files, Info, ChevronRight
} from 'lucide-react';
import { formatShortCurrency } from '@/utils/format';
import { useSlidePanel } from '@/context/SlidePanelContext';
import { BiddingPackageDetail } from '@/features/projects/components/BiddingPackageDetail';

interface ContractorDetailPanelProps {
    contractorId: string;
    projectId?: string;
}

interface ContractorData {
    contractor_id: string;
    full_name: string;
    tax_code: string | null;
    address: string | null;
    representative: string | null;
    contact_info: string | null;
    email: string | null;
    website: string | null;
    established_year: number | null;
    contractor_type: string | null;
    cap_cert_code: string | null;
    op_license_no: string | null;
}

const CONTRACT_STATUS_MAP: Record<number, { label: string; color: string }> = {
    0: { label: 'Đang soạn', color: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700' },
    1: { label: 'Đang thực hiện', color: 'text-primary-700 bg-primary-50 dark:text-primary-300 dark:bg-primary-900/30' },
    2: { label: 'Hoàn thành', color: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30' },
    3: { label: 'Đã nghiệm thu', color: 'text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-900/30' },
    4: { label: 'Đã thanh lý', color: 'text-warning-700 bg-warning-50 dark:text-warning-300 dark:bg-warning-900/30' },
};

export const ContractorDetailPanel: React.FC<ContractorDetailPanelProps> = ({ contractorId, projectId }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'packages' | 'documents'>('overview');

    const { data: contractor, isLoading: loadingContractor } = useQuery<ContractorData | null>({
        queryKey: ['contractor-detail', contractorId],
        queryFn: async (): Promise<ContractorData | null> => {
            const { data } = await supabase
                .from('contractors')
                .select('*')
                .eq('contractor_id', contractorId)
                .single();
            return (data as unknown) as ContractorData | null;
        },
        enabled: !!contractorId,
    });

    if (loadingContractor) {
        return (
            <div className="p-4 space-y-4 animate-pulse">
                <div className="h-16 bg-gray-200 dark:bg-slate-700 rounded-lg w-full mb-6" />
                <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded-lg w-2/3" />
                <div className="space-y-3 mt-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-12 bg-gray-100 dark:bg-slate-700 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (!contractor) {
        return (
            <div className="p-4 text-center">
                <p className="text-gray-500 dark:text-slate-400">Không tìm thấy thông tin nhà thầu</p>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Tổng quan', icon: Info },
        { id: 'contracts', label: 'Hợp đồng', icon: Briefcase },
        { id: 'packages', label: 'Gói thầu', icon: Package2 },
        { id: 'documents', label: 'Tài liệu', icon: Files },
    ] as const;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 relative">
            {/* ═══ STICKY HEADER ═══ */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-800">
                <div className="p-5 pb-4">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-400 to-warning-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/20">
                            <Building2 className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-tight">
                                {contractor.full_name}
                            </h2>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                {contractor.tax_code && (
                                    <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
                                        <Hash className="w-3 h-3 text-gray-400" /> MST: {contractor.tax_code}
                                    </p>
                                )}
                                {contractor.contractor_type && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] font-bold rounded-full uppercase tracking-wider border border-primary-200 dark:border-primary-800">
                                        <Briefcase className="w-3 h-3" /> {contractor.contractor_type}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center px-5 gap-6 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-bold text-sm transition-colors whitespace-nowrap ${
                                    isActive
                                        ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-slate-400'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ═══ TAB CONTENT ═══ */}
            <div className="flex-1 overflow-y-auto p-5 pb-20">
                {activeTab === 'overview' && <OverviewTab contractor={contractor} contractorId={contractorId} projectId={projectId} />}
                {activeTab === 'contracts' && <ContractsTab contractorId={contractorId} projectId={projectId} />}
                {activeTab === 'packages' && <PackagesTab contractorId={contractorId} />}
                {activeTab === 'documents' && <DocumentsTab contractorId={contractorId} />}
            </div>
        </div>
    );
};

// ─── 1. OVERVIEW TAB ───
const OverviewTab: React.FC<{ contractor: ContractorData; contractorId: string; projectId?: string }> = ({ contractor, contractorId, projectId }) => {
    const { data: stats } = useQuery({
        queryKey: ['contractor-stats-quick', contractorId, projectId],
        queryFn: async () => {
            let query = supabase.from('contracts').select('value').eq('contractor_id', contractorId);
            if (projectId) query = query.eq('project_id', projectId);
            const { data: ctData } = await query;
            const totalContracts = ctData?.length || 0;
            const totalValue = (ctData || []).reduce((sum: number, c: any) => sum + (c.value || 0), 0);
            const { count: totalPkgs } = await supabase.from('bidding_packages').select('package_id', { count: 'exact', head: true }).eq('winning_contractor_id', contractorId);
            return { totalContracts, totalValue, totalPkgs: totalPkgs || 0 };
        },
        enabled: !!contractorId,
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-primary-50/80 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 rounded-xl p-3">
                    <p className="text-[10px] text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wide">Số hợp đồng</p>
                    <p className="text-xl font-black text-primary-700 dark:text-primary-300 mt-1">{stats?.totalContracts ?? '-'}</p>
                </div>
                <div className="bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl p-3">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide">Tổng giá trị</p>
                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{stats ? formatShortCurrency(stats.totalValue) : '-'}</p>
                </div>
                <div className="bg-warning-50/80 dark:bg-warning-900/20 border border-warning-100 dark:border-warning-800/50 rounded-xl p-3">
                    <p className="text-[10px] text-warning-600 dark:text-warning-400 font-bold uppercase tracking-wide">Gói thầu đã trúng</p>
                    <p className="text-xl font-black text-warning-700 dark:text-warning-300 mt-1">{stats?.totalPkgs ?? '-'}</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-750 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wide">Thông tin tổ chức</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
                    {contractor.representative && <InfoRow icon={User} label="Người đại diện" value={contractor.representative} />}
                    {contractor.address && <InfoRow icon={MapPin} label="Địa chỉ trụ sở" value={contractor.address} />}
                    {contractor.contact_info && <InfoRow icon={Phone} label="Điện thoại liên hệ" value={contractor.contact_info} />}
                    {contractor.email && <InfoRow icon={User} label="Email" value={contractor.email} />}
                    {contractor.website && <InfoRow icon={Globe} label="Website" value={contractor.website} />}
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-750 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wide">Hồ sơ năng lực & pháp lý</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
                    {contractor.cap_cert_code ? <InfoRow icon={Award} label="Mã chứng chỉ năng lực" value={contractor.cap_cert_code} /> : <EmptyRow icon={Award} label="Mã chứng chỉ năng lực" />}
                    {contractor.op_license_no ? <InfoRow icon={FileText} label="Giấy phép kinh doanh/hoạt động" value={contractor.op_license_no} /> : <EmptyRow icon={FileText} label="Giấy phép kinh doanh/hoạt động" />}
                    {contractor.established_year ? <InfoRow icon={Calendar} label="Năm thành lập" value={String(contractor.established_year)} /> : <EmptyRow icon={Calendar} label="Năm thành lập" />}
                </div>
            </div>
        </div>
    );
};

// ─── 2. CONTRACTS TAB ───
const ContractsTab: React.FC<{ contractorId: string; projectId?: string }> = ({ contractorId, projectId }) => {
    const { data: contracts = [], isLoading } = useQuery({
        queryKey: ['contractor-contracts', contractorId, projectId],
        queryFn: async () => {
            let query = supabase.from('contracts').select('contract_id, contract_name, contract_type, value, sign_date, status, project_id').eq('contractor_id', contractorId).order('sign_date', { ascending: false });
            if (projectId) query = query.eq('project_id', projectId);
            const { data } = await query;
            if (!data || data.length === 0) return [];
            const pIds = [...new Set(data.map((c: any) => c.project_id))];
            const { data: projs } = await supabase.from('projects').select('project_id, project_name').in('project_id', pIds);
            const pMap = new Map((projs || []).map((p: any) => [p.project_id, p.project_name]));
            return data.map((c: any) => ({ ...c, project_name: pMap.get(c.project_id) || c.project_id }));
        },
        enabled: !!contractorId,
    });

    if (isLoading) return <LoadingList />;
    if (contracts.length === 0) return <EmptyState icon={Briefcase} title="Chưa có hợp đồng" message="Nhà thầu này chưa tham gia hợp đồng nào." />;

    return (
        <div className="space-y-3">
            {contracts.map((ct: any) => {
                const st = CONTRACT_STATUS_MAP[ct.status] || { label: 'Không xác định', color: 'bg-gray-100 text-gray-500' };
                return (
                    <div key={ct.contract_id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h4 className="font-bold text-primary-700 dark:text-primary-400 text-sm leading-tight">{ct.contract_name}</h4>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1.5"><Building2 className="w-3 h-3" /> {ct.project_name}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 whitespace-nowrap ${st.color}`}>{st.label}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CircleDollarSign className="w-3.5 h-3.5" /> {formatShortCurrency(ct.value)}
                            </span>
                            {ct.contract_type && <span className="text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{ct.contract_type}</span>}
                            {ct.sign_date && <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Ký: {new Date(ct.sign_date).toLocaleDateString('vi-VN')}</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ─── 3. PACKAGES TAB ───
const PackagesTab: React.FC<{ contractorId: string }> = ({ contractorId }) => {
    const { openPanel, closePanel } = useSlidePanel();
    const { data: packages = [], isLoading } = useQuery({
        queryKey: ['contractor-packages', contractorId],
        queryFn: async () => {
            const { data } = await supabase.from('bidding_packages').select('*').eq('winning_contractor_id', contractorId).order('created_at', { ascending: false });
            if (!data || data.length === 0) return [];
            const pIds = [...new Set(data.filter((p: any) => !!p.project_id).map((p: any) => p.project_id))];
            let pMap = new Map();
            if (pIds.length > 0) {
                const { data: projs } = await supabase.from('projects').select('project_id, project_name').in('project_id', pIds);
                pMap = new Map((projs || []).map((p: any) => [p.project_id, p.project_name]));
            }
            return data.map((pkg: any) => ({ ...pkg, project_name: pMap.get(pkg.project_id) || pkg.project_id }));
        },
        enabled: !!contractorId,
    });

    if (isLoading) return <LoadingList />;
    if (packages.length === 0) return <EmptyState icon={Package2} title="Không có gói thầu" message="Nhà thầu này chưa trúng gói thầu nào." />;

    return (
        <div className="space-y-3">
            {packages.map((pkg: any) => (
                <div
                    key={pkg.package_id}
                    onClick={() => openPanel({ title: pkg.package_name, icon: <Package2 className="w-5 h-5 text-primary-500" />, component: (<BiddingPackageDetail isOpen={true} onClose={() => closePanel()} package_data={{ PackageID: pkg.package_id, PackageName: pkg.package_name, PackageNumber: pkg.package_number, Field: pkg.field, Price: pkg.price, Status: pkg.status, SelectionMethod: pkg.selection_method, WinningContractorID: pkg.winning_contractor_id, WinningPrice: pkg.winning_price, NotificationCode: pkg.notification_code } as any} asSlidePanel={true} />) })}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition-all cursor-pointer hover:border-primary-300 dark:hover:border-primary-600 group"
                >
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <h4 className="font-bold text-gray-900 group-hover:text-primary-600 dark:text-slate-100 dark:group-hover:text-primary-400 text-sm leading-tight transition-colors">{pkg.package_name}</h4>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1.5"><Building2 className="w-3 h-3" /> {pkg.project_name}</p>
                        </div>
                        <span className="px-2 py-1 rounded text-[10px] font-bold shrink-0 whitespace-nowrap bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">Đã trúng thầu</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        <span className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1"><CircleDollarSign className="w-3.5 h-3.5" /> {formatShortCurrency(pkg.price)}</span>
                        {pkg.field && <span className="text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md uppercase text-[10px] font-bold">{pkg.field}</span>}
                        {pkg.selection_method && <span className="text-gray-500 dark:text-slate-400 pt-0.5">{pkg.selection_method}</span>}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─── 4. DOCUMENTS TAB ───
const DocumentsTab: React.FC<{ contractorId: string }> = ({ contractorId }) => {
    const { data: documents = [], isLoading } = useQuery({
        queryKey: ['contractor-documents', contractorId],
        queryFn: async () => {
            const { data: rawData } = await (supabase as any).from('documents').select('doc_id, doc_name, category, issue_date, project_id, doc_type, size').eq('contractor_id', contractorId).order('issue_date', { ascending: false });
            const data = rawData as any[];
            if (!data || data.length === 0) return [];
            const pIds = [...new Set(data.filter(d => !!d.project_id).map(d => d.project_id))];
            let pMap = new Map();
            if (pIds.length > 0) {
                const { data: projs } = await supabase.from('projects').select('project_id, project_name').in('project_id', pIds);
                pMap = new Map((projs || []).map((p: any) => [p.project_id, p.project_name]));
            }
            return data.map(doc => ({ ...doc, project_name: doc.project_id ? (pMap.get(doc.project_id) || doc.project_id) : 'Hồ sơ chung' }));
        },
        enabled: !!contractorId,
    });

    if (isLoading) return <LoadingList />;
    if (documents.length === 0) return <EmptyState icon={Files} title="Chưa có tài liệu" message="Chưa có hồ sơ/tài liệu nào được liên kết với nhà thầu này." />;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {documents.map((doc: any) => (
                    <div key={doc.doc_id} className="p-3 hover:bg-gray-50/80 dark:hover:bg-slate-750 transition-colors flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-primary-500 dark:text-primary-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{doc.doc_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-medium">{doc.project_name}</span>
                                    {doc.doc_type && <span className="text-[10px] text-gray-400 dark:text-slate-400">• {doc.doc_type}</span>}
                                    {doc.issue_date && <span className="text-[10px] text-gray-400 dark:text-slate-400">• N/h: {new Date(doc.issue_date).toLocaleDateString('vi-VN')}</span>}
                                </div>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-primary-500 dark:group-hover:text-primary-400 shrink-0 transform group-hover:translate-x-1 transition-all" />
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Utility components ──
const InfoRow: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 dark:text-slate-400 uppercase tracking-wide font-bold">{label}</p>
            <p className="text-sm text-gray-800 dark:text-slate-200 font-medium mt-0.5" style={{ wordBreak: 'break-word' }}>{value}</p>
        </div>
    </div>
);

const EmptyRow: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/30 dark:bg-slate-800">
        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0 opacity-50">
            <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 dark:text-slate-400 uppercase tracking-wide font-bold">{label}</p>
            <p className="text-xs text-gray-400 dark:text-slate-400 italic mt-0.5">Chưa cập nhật</p>
        </div>
    </div>
);

const EmptyState = ({ icon: Icon, title, message }: { icon: React.ElementType; title: string; message: string }) => (
    <div className="p-4 text-center flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 h-64">
        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-gray-400 dark:text-slate-400" />
        </div>
        <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs">{message}</p>
    </div>
);

const LoadingList = () => (
    <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 dark:bg-slate-800 rounded-xl animate-pulse" />)}
    </div>
);
