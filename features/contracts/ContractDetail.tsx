
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTabSearchParam } from '@/hooks/useTabSearchParam';
import { formatFullCurrency, formatShortCurrency } from '../../utils/format';
import { useContractors } from '../../hooks/useContractors';
import { useAllBiddingPackages } from '../../hooks/useAllBiddingPackages';
import { ContractStatus, PaymentStatus } from '../../types';
import { useContracts } from '../../hooks/useContracts';
import { usePayments } from '../../hooks/usePayments';
import { useProjects } from '../../hooks/useProjects';
import { ContractService } from '../../services/ContractService';
import { ContractModal } from './components/ContractModal';
import { EmptyState } from '../../components/ui/EmptyState';
import {
    ArrowLeft, FileText, Calendar, DollarSign,
    Building2, Printer, Download, Edit3, Trash2,
    CheckCircle2, Clock, AlertTriangle,
    TrendingUp, Layers, FileDigit, Briefcase, ShieldCheck
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
    AreaChart, Area, Legend
} from 'recharts';
import { useTasks } from '../../hooks/useTasks';
import { useVariationOrders } from '../../hooks/useVariationOrders';
import { VariationOrderTab } from './components/VariationOrderTab';

export interface ContractDetailProps {
    contractId?: string;
    asSlidePanel?: boolean;
}

const ContractDetail: React.FC<ContractDetailProps> = ({ contractId: propContractId, asSlidePanel }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [paramTab, setParamTab] = useTabSearchParam('general', ['general', 'variation', 'boq', 'payment', 'progress'] as const);
    const [localTab, setLocalTab] = useState<'general' | 'variation' | 'boq' | 'payment' | 'progress'>('general');
    
    const activeTab = asSlidePanel ? localTab : paramTab;
    const setActiveTab = asSlidePanel ? setLocalTab : setParamTab;

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // 1. Get Data with decoding to handle IDs containing slashes
    const rParamId = decodeURIComponent(id || '');
    const contractId = propContractId || rParamId;
    const { contracts } = useContracts();
    const { payments: allPayments } = usePayments();
    const { projects: allProjects } = useProjects();
    const { contractors: allContractors } = useContractors();
    const { biddingPackages: allBiddingPackages } = useAllBiddingPackages();

    const contract = contracts.find(c => c.ContractID === contractId);
    const pkg = contract ? allBiddingPackages.find(p => p.PackageID === contract.PackageID) : undefined;
    const project = pkg ? allProjects.find(p => p.ProjectID === pkg.ProjectID) : undefined;
    const contractor = contract ? allContractors.find(c => c.ContractorID === contract.ContractorID) : undefined;
    const payments = contract ? allPayments.filter(p => p.ContractID === contract.ContractID) : [];
    
    // Fetch variation orders
    const { variationOrders } = useVariationOrders(contract?.ContractID || '');

    // Get project tasks for milestones (must be before any early return)
    const { data: projectTasks = [] } = useTasks(project?.ProjectID || '');

    // 4. Real milestones from tasks
    const milestones = useMemo(() => {
        if (!projectTasks.length) return [];
        return projectTasks
            .filter(t => t.TimelineStep === 'IMPL_BIDDING' || t.TimelineStep === 'IMPL_CONSTRUCTION' || t.TimelineStep === 'COMPLETION')
            .slice(0, 8)
            .map((t, idx) => ({
                id: idx + 1,
                name: t.Title,
                date: t.DueDate || '',
                status: t.Status === 'done' ? 'Done' : t.Status === 'in_progress' ? 'In Progress' : 'Pending',
            }));
    }, [projectTasks]);

    if (!contract) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-bg-subtle dark:bg-slate-900">
                <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-2">Không tìm thấy hợp đồng</h2>
                <p className="text-gray-500 dark:text-slate-400 mb-4 text-sm">Mã hợp đồng: {id}</p>
                <button onClick={() => navigate(-1)} className="text-blue-600 dark:text-blue-400 hover:underline">Quay lại</button>
            </div>
        );
    }

    // 2. Calculate Financials with Variation Orders
    const sumVariationOrders = variationOrders.reduce((sum, vo) => sum + vo.AdjustedAmount, 0);
    const totalAdjustedValue = contract.Value + sumVariationOrders;
    
    const sumDurationExtensions = variationOrders.reduce((sum, vo) => sum + (vo.AdjustedDuration || 0), 0);
    const totalAdjustedDuration = (contract.DurationMonths || 0) + sumDurationExtensions;

    const totalPaid = payments
        .filter(p => p.Status === PaymentStatus.Transferred)
        .reduce((sum, p) => sum + p.Amount, 0);
    const remaining = totalAdjustedValue - totalPaid;
    const paymentPercent = totalAdjustedValue > 0 ? (totalPaid / totalAdjustedValue) * 100 : 0;

    // 3. BOQ Data — từ DB khi có, hiện tại hiển thị placeholder
    const boqItems: { id: number; name: string; unit: string; qty: number; price: number; total: number }[] = [];

    // Chart Data
    const financialData = [
        { name: 'Giá trị HĐ (sau ĐC)', value: totalAdjustedValue, fill: '#404040' },
        { name: 'Đã thanh toán', value: totalPaid, fill: '#4a90e2' },
        { name: 'Còn lại', value: remaining, fill: '#357abd' },
    ];

    const handleDelete = async () => {
        if (payments.length > 0) {
            alert('Không thể xóa hợp đồng đã có dữ liệu thanh toán!');
            return;
        }
        if (variationOrders.length > 0) {
            alert('Không thể xóa hợp đồng đã có phụ lục!');
            return;
        }

        if (window.confirm(`Bạn có chắc muốn xóa hợp đồng "${contract.ContractID}"? Hành động này không thể hoàn tác.`)) {
            setIsDeleting(true);
            try {
                await ContractService.delete(contract.ContractID);
                navigate('/contracts');
            } catch (error: any) {
                alert('Lỗi xóa hợp đồng: ' + error.message);
                setIsDeleting(false);
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {!asSlidePanel && (
                        <button onClick={() => navigate('/bidding?tab=contracts')} className="p-2 bg-bg-surface border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-bg-subtle dark:hover:bg-slate-700 transition-colors shadow-sm">
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                        </button>
                    )}
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-gray-800 dark:text-slate-100 tracking-tight">Hợp đồng số: {contract.ContractID}</h1>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${contract.Status === ContractStatus.Executing ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                                contract.Status === ContractStatus.Liquidated ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                                }`}>
                                {contract.Status === ContractStatus.Executing ? 'Đang thực hiện' : 'Đã thanh lý'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">{pkg?.PackageName}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-bold rounded-xl hover:bg-bg-subtle dark:hover:bg-slate-700 text-sm transition-colors">
                        <Printer className="w-4 h-4" /> In Hợp đồng
                    </button>
                    <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-500 text-sm shadow-sm shadow-primary-200 dark:shadow-primary-900/30 transition-colors"
                    >
                        <Edit3 className="w-4 h-4" /> Điều chỉnh
                    </button>
                    <button 
                        onClick={handleDelete}
                        disabled={isDeleting || payments.length > 0 || variationOrders.length > 0}
                        title={(payments.length > 0 || variationOrders.length > 0) ? "Không thể xóa hợp đồng đã có thanh toán hoặc phụ lục" : "Xóa hợp đồng"}
                        className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="w-4 h-4" /> {isDeleting ? 'Đang xóa...' : 'Xóa HĐ'}
                    </button>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="stat-card stat-card-slate cursor-default">
                    <div className="absolute -right-3 -top-3 opacity-[0.12]"><DollarSign className="w-24 h-24" strokeWidth={1.2} /></div>
                    <div className="relative z-10 text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                            <FileDigit className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-[10px] font-extrabold text-white/90 uppercase tracking-[0.15em] mb-1">Giá trị hợp đồng (Gốc + Phụ lục)</p>
                        <p className="text-xl font-black text-white drop-shadow-lg">{formatShortCurrency(totalAdjustedValue)}</p>
                    </div>
                </div>
                <div className="stat-card stat-card-emerald cursor-default">
                    <div className="absolute -right-3 -top-3 opacity-[0.12]"><TrendingUp className="w-24 h-24" strokeWidth={1.2} /></div>
                    <div className="relative z-10 text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-[10px] font-extrabold text-white/90 uppercase tracking-[0.15em] mb-1">Đã thanh toán ({paymentPercent.toFixed(1)}%)</p>
                        <p className="text-xl font-black text-white drop-shadow-lg">{formatShortCurrency(totalPaid)}</p>
                    </div>
                </div>
                <div className="stat-card stat-card-amber cursor-default">
                    <div className="absolute -right-3 -top-3 opacity-[0.12]"><Clock className="w-24 h-24" strokeWidth={1.2} /></div>
                    <div className="relative z-10 text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                            <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-[10px] font-extrabold text-white/90 uppercase tracking-[0.15em] mb-1">Giá trị còn lại</p>
                        <p className="text-xl font-black text-white drop-shadow-lg">{formatShortCurrency(remaining)}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-bg-surface rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="border-b border-gray-200 dark:border-slate-700 px-6 flex gap-8 overflow-x-auto">
                    {[
                        { id: 'general', label: 'Thông tin chung', icon: FileText },
                        { id: 'boq', label: 'Nội dung & Khối lượng', icon: Layers },
                        { id: 'variation', label: 'Phụ lục hợp đồng', icon: FileDigit },
                        { id: 'payment', label: 'Thanh toán & Giải ngân', icon: DollarSign },
                        { id: 'progress', label: 'Tiến độ thực hiện', icon: Clock },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-4">
                    {/* TAB 1: GENERAL INFO */}
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Left Column: Contract Details */}
                            <div className="space-y-6">
                                <h3 className="section-header">
                                    <div className="section-icon"><FileText className="w-3.5 h-3.5" /></div>
                                    Thông tin hợp đồng
                                </h3>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-slate-400 font-bold uppercase">Ngày ký hợp đồng</p>
                                        <p className="font-medium text-gray-800 dark:text-slate-200">{contract.SignDate ? new Date(contract.SignDate).toLocaleDateString('vi-VN') : '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-slate-400 font-bold uppercase">Loại hợp đồng</p>
                                        <p className="font-medium text-gray-800 dark:text-slate-200">{pkg?.ContractType || "Trọn gói"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-slate-400 font-bold uppercase">Thời gian thực hiện</p>
                                        <p className="font-medium text-gray-800 dark:text-slate-200">
                                            {totalAdjustedDuration ? `${totalAdjustedDuration} tháng` : '—'} 
                                            {sumDurationExtensions > 0 && <span className="text-[10px] text-green-600 ml-1">(+{sumDurationExtensions})</span>}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-slate-400 font-bold uppercase">Ngày bắt đầu</p>
                                        <p className="font-medium text-gray-800 dark:text-slate-200">{contract.StartDate ? new Date(contract.StartDate).toLocaleDateString('vi-VN') : '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-slate-400 font-bold uppercase">Ngày kết thúc (dự kiến)</p>
                                        <p className="font-medium text-gray-800 dark:text-slate-200">{contract.EndDate ? new Date(contract.EndDate).toLocaleDateString('vi-VN') : '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-slate-400 font-bold uppercase">Bảo hành công trình</p>
                                        <p className="font-medium text-gray-800 dark:text-slate-200 flex items-center gap-1">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> {contract.Warranty} tháng
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-400 font-bold uppercase">Thuộc dự án</p>
                                        <p className="font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" onClick={() => navigate(`/projects/${project?.ProjectID}`)}>
                                            {project?.ProjectName}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Parties */}
                            <div className="space-y-8">
                                <div>
                                    <h3 className="section-header">
                                        <div className="section-icon"><Building2 className="w-3.5 h-3.5" /></div>
                                        Bên giao thầu (Bên A)
                                    </h3>
                                    <div className="mt-4 p-4 bg-bg-app dark:bg-slate-900 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600">
                                        <p className="font-bold text-gray-800 dark:text-slate-200 text-sm">{project?.InvestorName}</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Đại diện: Giám đốc Ban QLDA</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="section-header">
                                        <div className="section-icon"><Briefcase className="w-3.5 h-3.5" /></div>
                                        Bên nhận thầu (Bên B)
                                    </h3>
                                    <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/40">
                                        <p className="font-bold text-blue-900 dark:text-blue-200 text-sm">{contractor?.FullName}</p>
                                        <div className="mt-2 space-y-1 text-xs text-blue-800/70 dark:text-blue-300/70">
                                            <p>Mã số thuế: {contractor?.ContractorID}</p>
                                            <p>Địa chỉ: {contractor?.Address}</p>
                                            {contractor?.ContactInfo && <p>Liên hệ: {contractor.ContactInfo}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* TAB 2: VARIATION ORDERS (PHỤ LỤC HỢP ĐỒNG) */}
                    {activeTab === 'variation' && (
                        <VariationOrderTab contractId={contract.ContractID} />
                    )}

                    {activeTab === 'boq' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200">Phụ lục khối lượng công việc</h3>
                                {boqItems.length > 0 && (
                                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1">
                                        <Download className="w-4 h-4" /> Xuất Excel
                                    </button>
                                )}
                            </div>
                            {boqItems.length > 0 ? (
                                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-bg-subtle text-slate-500 dark:text-slate-400 font-bold uppercase text-xs border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-4 w-16 text-center">STT</th>
                                                <th className="px-6 py-4">Nội dung công việc</th>
                                                <th className="px-6 py-4 w-32 text-center">Đơn vị</th>
                                                <th className="px-6 py-4 w-32 text-right">Khối lượng</th>
                                                <th className="px-6 py-4 w-40 text-right">Đơn giá</th>
                                                <th className="px-6 py-4 w-40 text-right">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                            {boqItems.map((item, idx) => (
                                                <tr key={item.id} className="hover:bg-bg-subtle dark:hover:bg-slate-700">
                                                    <td className="px-6 py-4 text-center font-mono text-gray-400 dark:text-slate-400">{idx + 1}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-slate-200">{item.name}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500 dark:text-slate-400">{item.unit}</td>
                                                    <td className="px-6 py-4 text-right font-mono dark:text-slate-300">{item.qty.toLocaleString('vi-VN')}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-slate-400">{formatFullCurrency(item.price)}</td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-slate-100">{formatFullCurrency(item.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-bg-app dark:bg-slate-900 dark:bg-slate-700 font-bold text-gray-900 dark:text-slate-100 border-t border-gray-200 dark:border-slate-700">
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-right uppercase text-xs tracking-wider">Tổng giá trị hợp đồng gốc</td>
                                                <td className="px-6 py-4 text-right text-blue-600 dark:text-blue-400">{formatFullCurrency(contract.Value)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={<Layers className="w-12 h-12 text-gray-300 dark:text-slate-600" />}
                                    title="Chưa có phụ lục khối lượng"
                                    description="Dữ liệu BOQ sẽ được cập nhật khi quản lý khối lượng thi công"
                                    className="bg-bg-surface rounded-xl border border-dashed border-slate-200 dark:border-slate-600"
                                />
                            )}
                        </div>
                    )}

                    {/* TAB 3: PAYMENT */}
                    {activeTab === 'payment' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-6">Lịch sử thanh toán</h3>
                                <div className="space-y-4">
                                    {payments.length > 0 ? payments.map((pay) => (
                                        <div key={pay.PaymentID} className="bg-bg-surface border border-gray-200 dark:border-slate-600 p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${pay.Type === 'Advance' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                                    <DollarSign className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 dark:text-slate-200 text-sm uppercase">Đợt {pay.BatchNo}: {pay.Type === 'Advance' ? 'Tạm ứng hợp đồng' : 'Thanh toán khối lượng'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-mono">Mã GD Kho bạc: {pay.TreasuryRef}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-gray-900 dark:text-slate-100">{formatFullCurrency(pay.Amount)}</p>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${pay.Status === PaymentStatus.Transferred ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-yellow-100 dark:bg-yellow-900/40 text-primary-700 dark:text-yellow-300'
                                                    }`}>
                                                    {pay.Status === PaymentStatus.Transferred ? 'Đã giải ngân' : 'Chờ xử lý'}
                                                </span>
                                            </div>
                                        </div>
                                    )) : (
                                        <EmptyState
                                            icon={<DollarSign className="w-12 h-12 text-gray-300 dark:text-slate-600" />}
                                            title="Chưa có đợt thanh toán nào."
                                            className="bg-bg-surface rounded-xl border border-dashed border-slate-200 dark:border-slate-600"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Payment Chart */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-6">Biểu đồ dòng tiền</h3>
                                <div className="bg-bg-app dark:bg-slate-900 dark:bg-slate-700 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={financialData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                                            <RechartsTooltip
                                                cursor={{ fill: 'transparent' }}
                                                formatter={(value) => formatFullCurrency(Number(value))}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="value" barSize={32} radius={[0, 6, 6, 0]}>
                                                {financialData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/40">
                                    <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-2">Tỷ lệ hoàn thành tài chính</p>
                                    <div className="w-full bg-bg-surface rounded-full h-3 mb-2 border border-blue-100 dark:border-blue-800/40">
                                        <div className="bg-primary-600 h-full rounded-full transition-all duration-1000" style={{ width: `${paymentPercent}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium text-blue-700 dark:text-blue-300">
                                        <span>0%</span>
                                        <span>{paymentPercent.toFixed(1)}%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: PROGRESS with S-CURVE */}
                    {activeTab === 'progress' && (
                        <div className="space-y-8">
                            {/* S-Curve Chart */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200">Biểu đồ S-Curve</h3>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">So sánh tiến độ kế hoạch và thực tế</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                            <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Kế hoạch</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                            <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Thực tế</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-bg-app dark:bg-slate-900 dark:bg-slate-700 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={[
                                                { month: 'T1', planned: 5, actual: 3 },
                                                { month: 'T2', planned: 12, actual: 8 },
                                                { month: 'T3', planned: 22, actual: 18 },
                                                { month: 'T4', planned: 35, actual: 30 },
                                                { month: 'T5', planned: 48, actual: 42 },
                                                { month: 'T6', planned: 60, actual: 55 },
                                                { month: 'T7', planned: 70, actual: 65 },
                                                { month: 'T8', planned: 80, actual: 72 },
                                                { month: 'T9', planned: 88, actual: null },
                                                { month: 'T10', planned: 94, actual: null },
                                                { month: 'T11', planned: 98, actual: null },
                                                { month: 'T12', planned: 100, actual: null },
                                            ]}
                                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8A8A8A" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8A8A8A" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4a90e2" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#4a90e2" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="month"
                                                tick={{ fontSize: 11, fill: '#64748b' }}
                                                axisLine={{ stroke: '#e5e7eb' }}
                                            />
                                            <YAxis
                                                tickFormatter={(v) => `${v}%`}
                                                tick={{ fontSize: 11, fill: '#64748b' }}
                                                axisLine={{ stroke: '#e5e7eb' }}
                                                domain={[0, 100]}
                                            />
                                            <RechartsTooltip
                                                formatter={(value, name) => [
                                                    value ? `${value}%` : 'Chưa có dữ liệu',
                                                    name === 'planned' ? 'Kế hoạch' : 'Thực tế'
                                                ]}
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="planned"
                                                stroke="#8A8A8A"
                                                strokeWidth={2}
                                                fill="url(#colorPlanned)"
                                                name="planned"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="actual"
                                                stroke="#4a90e2"
                                                strokeWidth={2}
                                                fill="url(#colorActual)"
                                                name="actual"
                                                connectNulls={false}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Progress Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                    <div className="p-4 rounded-xl text-white stat-card-slate shadow-sm">
                                        <p className="text-xs font-bold text-white/90 uppercase">Tiến độ kế hoạch</p>
                                        <p className="text-2xl font-black text-white mt-1">80%</p>
                                        <p className="text-xs text-white/70 mt-1">Tháng 8/2024</p>
                                    </div>
                                    <div className="p-4 rounded-xl text-white stat-card-emerald shadow-sm">
                                        <p className="text-xs font-bold text-white/90 uppercase">Tiến độ thực tế</p>
                                        <p className="text-2xl font-black text-white mt-1">72%</p>
                                        <p className="text-xs text-white/70 mt-1">Cập nhật: Hôm nay</p>
                                    </div>
                                    <div className="p-4 rounded-xl text-white stat-card-amber shadow-sm">
                                        <p className="text-xs font-bold text-white/90 uppercase">Chênh lệch</p>
                                        <p className="text-2xl font-black text-white mt-1">-8%</p>
                                        <p className="text-xs text-white/70 mt-1">Chậm so với kế hoạch</p>
                                    </div>
                                </div>
                            </div>

                            {/* Milestones */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-6">Mốc tiến độ hợp đồng</h3>
                                <div className="relative border-l-2 border-gray-200 dark:border-slate-700 ml-4 space-y-8 pb-4">
                                    {milestones.map((ms, idx) => (
                                        <div key={ms.id} className="relative pl-10 group">
                                            {/* Status Dot */}
                                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125 ${ms.status === 'Done' ? 'bg-emerald-500' :
                                                ms.status === 'In Progress' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                                                }`}></div>

                                            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-bg-surface border border-gray-200 dark:border-slate-600 rounded-xl hover:shadow-md transition-shadow">
                                                <div>
                                                    <h4 className={`font-bold text-sm ${ms.status === 'Pending' ? 'text-gray-500 dark:text-slate-400' : 'text-gray-800 dark:text-slate-200'}`}>{ms.name}</h4>
                                                    <p className="text-xs text-gray-400 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> {ms.date}
                                                    </p>
                                                </div>
                                                <span className={`mt-2 md:mt-0 px-3 py-1 rounded-full text-[10px] font-black uppercase w-fit ${ms.status === 'Done' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                                                    ms.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                                                    }`}>
                                                    {ms.status === 'Done' ? 'Hoàn thành' : ms.status === 'In Progress' ? 'Đang thực hiện' : 'Chưa đến hạn'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Điều Chỉnh */}
            <ContractModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                existingContract={contract}
                initialPackageId={pkg?.PackageID}
            />
        </div>
    );
};

export default ContractDetail;

