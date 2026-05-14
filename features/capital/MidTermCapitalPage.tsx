import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTabSearchParam } from '@/hooks/useTabSearchParam';
import { formatCurrency } from '../../utils/format';
import { CapitalService } from '../../services/CapitalService';
import { CapitalPlanRow, DisbursementPlanRow, DisbursementRow } from '../../types/capital.types';
import * as XLSX from 'xlsx';
import {
    CalendarRange, Calendar, Landmark, TrendingUp, AlertTriangle,
    ChevronDown, ChevronRight, Search, Building2, ArrowRight, DollarSign,
    BarChart3, TrendingDown, ArrowUpDown, Download, Filter, X, BookOpen, FileText, Upload
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { StatCard } from '../../components/ui';
import { CapitalImportModal } from './CapitalImportModal';
import { APPROVAL_BADGES, SOURCE_LABELS, normalizeSource, MONTHS } from '../../utils/capitalConstants';
import { useSlidePanelSafe } from '../../context/SlidePanelContext';
import { ProjectCapitalTab } from '../projects/components/tabs/ProjectCapitalTab';

// ═══════════════════════════════════════════════════
//  KẾ HOẠCH VỐN & GIẢI NGÂN — Module tổng hợp
//  Features #15-21 | Luật ĐTC 58/2024/QH15
// ═══════════════════════════════════════════════════

type PageTab = 'mid_term' | 'annual' | 'disb_plan' | 'disb_progress';

// ─── Helpers ────────────────────────────────────────────

function fmtB(n: number): string {
    if (n >= 1e9) return `${(n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1, minimumFractionDigits: 0 })} tỷ`;
    if (n >= 1e6) return `${(n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} tr`;
    return formatCurrency(n);
}

// ═══════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════

const currentMonth = new Date().getMonth() + 1; // 1-12

// ─── Excel Export helper ──────────────────────────────────
function exportCapitalToExcel(data: any[], tab: PageTab, year: number, extraData?: { disbPlans?: any[]; disbursements?: any[]; annualPlans?: any[] }) {
    let rows: Record<string, any>[] = [];
    let sheetName = 'Data';
    
    if (tab === 'mid_term') {
        sheetName = 'KH Trung hạn';
        rows = data.map((p: any, i: number) => ({
            'STT': i + 1,
            'Dự án': p.project_name || p.project_id,
            'Giai đoạn': `${p.period_start}-${p.period_end}`,
            'Nguồn vốn': normalizeSource(p.source),
            'QĐ giao vốn': p.decision_number || '',
            'Ngày giao': p.date_assigned || '',
            'Vốn KH (VNĐ)': Number(p.amount) || 0,
            'Đã giải ngân (VNĐ)': Number(p.disbursed_amount) || 0,
            'Tỷ lệ GN (%)': Number(p.amount) > 0 ? Math.round((Number(p.disbursed_amount) / Number(p.amount)) * 100) : 0,
            'Trạng thái': APPROVAL_BADGES[p.approval_status || 'draft']?.label || 'Dự thảo',
        }));
    } else if (tab === 'annual') {
        sheetName = `KH Hàng năm ${year}`;
        rows = data.map((p: any, i: number) => ({
            'STT': i + 1,
            'Dự án': p.project_name || p.project_id,
            'QĐ giao vốn': p.decision_number || '',
            'Nguồn vốn': normalizeSource(p.source),
            'KHV (VNĐ)': Number(p.amount) || 0,
            'Đã giải ngân (VNĐ)': Number(p.disbursed_amount) || 0,
            'Còn lại (VNĐ)': Number(p.amount) - Number(p.disbursed_amount),
            'Tỷ lệ GN (%)': Number(p.amount) > 0 ? Math.round((Number(p.disbursed_amount) / Number(p.amount)) * 100) : 0,
        }));
    } else if (tab === 'disb_plan' && extraData?.disbPlans) {
        sheetName = `KH Giải ngân ${year}`;
        const yearPlans = extraData.disbPlans.filter((d: any) => d.year === year);
        const pids = [...new Set(yearPlans.map((d: any) => d.project_id))];
        rows = pids.map((pid, i) => {
            const pPlans = yearPlans.filter((d: any) => d.project_id === pid);
            const row: Record<string, any> = { 'STT': i + 1, 'Dự án': pPlans[0]?.project_name || pid };
            MONTHS.forEach((m, idx) => { row[m] = pPlans.find((d: any) => d.month === idx + 1)?.planned_amount || 0; });
            row['Tổng KH GN'] = pPlans.reduce((s: number, d: any) => s + (Number(d.planned_amount) || 0), 0);
            return row;
        });
    } else if (tab === 'disb_progress' && extraData?.disbPlans && extraData?.disbursements) {
        sheetName = `Tiến độ GN ${year}`;
        const yearDisbPlans = extraData.disbPlans.filter((d: any) => d.year === year);
        const yearDisbs = extraData.disbursements.filter((d: any) => new Date(d.date).getFullYear() === year && d.status !== 'Rejected');
        const pids = [...new Set([...yearDisbs.map((d: any) => d.project_id), ...yearDisbPlans.map((d: any) => d.project_id)])];
        rows = [];
        pids.forEach((pid, i) => {
            const pName = yearDisbs.find((d:any) => d.project_id === pid)?.project_name || yearDisbPlans.find((d:any) => d.project_id === pid)?.project_name || pid;
            const khRow: Record<string, any> = { 'STT': i + 1, 'Dự án': pName, 'Loại': 'KH' };
            const ttRow: Record<string, any> = { 'STT': '', 'Dự án': '', 'Loại': 'TT' };
            MONTHS.forEach((m, idx) => {
                khRow[m] = yearDisbPlans.find((d: any) => d.project_id === pid && d.month === idx + 1)?.planned_amount || 0;
                const actual = yearDisbs.filter((d: any) => d.project_id === pid && new Date(d.date).getMonth() === idx).reduce((s: number, d: any) => s + Number(d.amount), 0);
                ttRow[m] = actual || 0;
            });
            rows.push(khRow, ttRow);
        });
    }

    if (rows.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0]).map(k => ({ wch: k.length < 10 ? 12 : Math.min(k.length + 5, 35) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `KHVon_${sheetName.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

const CapitalPlanningPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useTabSearchParam<PageTab>('mid_term', ['mid_term', 'annual', 'disb_plan', 'disb_progress'] as const);
    const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const { data: allPlans = [], isLoading: loadingPlans } = useQuery<CapitalPlanRow[]>({
        queryKey: ['all-capital-plans'],
        queryFn: CapitalService.fetchAllCapitalPlans,
    });

    const { data: disbPlans = [] } = useQuery<DisbursementPlanRow[]>({
        queryKey: ['all-disb-plans'],
        queryFn: CapitalService.fetchAllDisbursementPlans,
    });

    const { data: disbursements = [] } = useQuery<DisbursementRow[]>({
        queryKey: ['all-disbursements'],
        queryFn: CapitalService.fetchAllDisbursements,
    });

    // Split plans
    const midTermPlans = useMemo(() => allPlans.filter((p: any) => p.plan_type === 'mid_term'), [allPlans]);
    const annualPlans = useMemo(() => allPlans.filter((p: any) => p.plan_type !== 'mid_term'), [allPlans]);

    // Apply source filter
    const applySourceFilter = (plans: any[]) => {
        if (sourceFilter === 'all') return plans;
        return plans.filter((p: any) => normalizeSource(p.source) === sourceFilter);
    };

    const filteredMidTerm = useMemo(() => applySourceFilter(midTermPlans), [midTermPlans, sourceFilter]);
    const filteredAnnual = useMemo(() => applySourceFilter(annualPlans), [annualPlans, sourceFilter]);

    // KPI (always based on filtered data)
    const totalMidTerm = filteredMidTerm.reduce((s: number, p: any) => s + Number(p.amount), 0);
    const totalAnnual = filteredAnnual.filter((p: any) => p.year === yearFilter).reduce((s: number, p: any) => s + Number(p.amount), 0);
    const totalDisbursed = filteredAnnual.filter((p: any) => p.year === yearFilter).reduce((s: number, p: any) => s + Number(p.disbursed_amount), 0);
    const disbRate = totalAnnual > 0 ? (totalDisbursed / totalAnnual) * 100 : 0;

    // Current displayed data (for export)
    const currentExportData = activeTab === 'mid_term' ? filteredMidTerm : filteredAnnual.filter((p: any) => p.year === yearFilter);

    // Chart Data (Aggregated by Year)
    const chartData = useMemo(() => {
        const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
        return years.map(y => {
            const yPlans = filteredAnnual.filter((p: any) => p.year === y);
            const totalKH = yPlans.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
            const totalGN = yPlans.reduce((sum: number, p: any) => sum + Number(p.disbursed_amount), 0);
            return {
                name: y.toString(),
                'Kế hoạch': totalKH,
                'Giải ngân': totalGN,
            };
        });
    }, [filteredAnnual]);

    // Automatic Alerts (Projects with < 50% disbursement in current year)
    const slowDisbursementAlerts = useMemo(() => {
        const currentYearPlans = filteredAnnual.filter((p: any) => p.year === yearFilter && Number(p.amount) > 0);
        return currentYearPlans.filter((p: any) => {
            const rate = (Number(p.disbursed_amount) / Number(p.amount)) * 100;
            return rate < 50;
        }).sort((a: any, b: any) => {
            const rateA = (Number(a.disbursed_amount) / Number(a.amount));
            const rateB = (Number(b.disbursed_amount) / Number(b.amount));
            return rateA - rateB;
        });
    }, [filteredAnnual, yearFilter]);

    const TAB_CFG: { key: PageTab; label: string; icon: React.ElementType; color: string }[] = [
        { key: 'mid_term', label: 'Trung hạn', icon: CalendarRange, color: 'blue' },
        { key: 'annual', label: 'Hàng năm', icon: Calendar, color: 'indigo' },
        { key: 'disb_plan', label: 'KH Giải ngân', icon: BarChart3, color: 'amber' },
        { key: 'disb_progress', label: 'Tiến độ GN', icon: TrendingUp, color: 'emerald' },
    ];

    if (loadingPlans) {
        return (
            <div className="p-4 text-center text-gray-500 dark:text-slate-400">
                <CalendarRange className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse" />
                Đang tải dữ liệu...
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-5">
            {/* ───── Header ───── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl flex items-center gap-3" style={{ fontFamily: 'var(--font-heading)' }}>
                        <div className="p-2.5 rounded-xl shadow-sm bg-gradient-to-br from-primary-500 to-primary-600">
                            <Landmark className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-gray-800 dark:text-slate-100">Kế hoạch Vốn & Giải ngân</span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 ml-14">
                        Luật ĐTC 58/2024/QH15 • Quản lý tổng hợp tất cả dự án
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Source filter */}
                    <div className="flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-gray-400" />
                        <select
                            value={sourceFilter}
                            onChange={e => setSourceFilter(e.target.value)}
                            className="filter-primary px-3 py-1.5 text-xs"
                        >
                            <option value="all">Tất cả nguồn</option>
                            <option value="NSĐP">NS Địa phương</option>
                            <option value="NSTW">NS Trung ương</option>
                            <option value="ODA">ODA/Vốn vay</option>
                        </select>
                    </div>
                    {/* Year filter */}
                    <div className="flex items-center gap-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Năm:</label>
                        <select
                            value={yearFilter}
                            onChange={e => setYearFilter(Number(e.target.value))}
                            className="filter-primary px-3 py-1.5"
                        >
                            {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() + 2 - i).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    {/* Import Excel */}
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                        title="Import Kế hoạch vốn từ Excel"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        Nhập Excel
                    </button>
                    {/* Export Excel — all tabs */}
                    <button
                        onClick={() => exportCapitalToExcel(
                            currentExportData, activeTab, yearFilter,
                            { disbPlans: disbPlans as any[], disbursements: disbursements as any[], annualPlans: filteredAnnual }
                        )}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                        title="Xuất dữ liệu ra Excel"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Xuất Excel
                    </button>
                </div>
            </div>

            {/* ───── KPI Cards (stat-card design system) ───── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'VỐN TRUNG HẠN', value: fmtB(totalMidTerm), sub: `${midTermPlans.length} KH`, icon: <Landmark className="w-5 h-5" />, variant: 'blue' },
                    { label: `VỐN GIAO ${yearFilter}`, value: fmtB(totalAnnual), sub: `${annualPlans.filter((p:any) => p.year === yearFilter).length} DA`, icon: <Calendar className="w-5 h-5" />, variant: 'emerald' },
                    { label: `ĐÃ GIẢI NGÂN ${yearFilter}`, value: fmtB(totalDisbursed), sub: `${disbRate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`, icon: <DollarSign className="w-5 h-5" />, variant: 'amber' },
                    { label: 'CHÊNH LỆCH', value: fmtB(totalAnnual - totalDisbursed), sub: disbRate < 50 ? 'Cần đẩy nhanh' : 'Bình thường', icon: <ArrowUpDown className={`w-5 h-5 ${disbRate < 50 ? 'animate-pulse' : ''}`} />, variant: disbRate < 50 ? 'rose' : 'violet' },
                ].map((kpi, index) => (
                    <StatCard
                        key={index}
                        label={kpi.label}
                        value={kpi.value}
                        icon={kpi.icon}
                        color={kpi.variant as "blue" | "emerald" | "amber" | "violet" | "rose"}
                        footer={
                            <div className="text-[10px] font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                                {kpi.sub}
                            </div>
                        }
                    />
                ))}
            </div>

            {/* ───── Automatic Alerts ───── */}
            {slowDisbursementAlerts.length > 0 && (
                <div className="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-200/50 dark:border-rose-800/30 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4" />
                        Cảnh báo: {slowDisbursementAlerts.length} dự án giải ngân chậm (Dưới 50% KH năm {yearFilter})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {slowDisbursementAlerts.map((p: any) => {
                            const rate = Math.round((Number(p.disbursed_amount) / Number(p.amount)) * 100);
                            return (
                                <div key={p.plan_id} className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-rose-100 dark:border-rose-800/50 flex flex-col justify-between cursor-pointer hover:border-rose-300 transition-colors" onClick={() => navigate(`/projects/${p.project_id}?tab=capital`)}>
                                    <p className="text-[11px] font-bold text-gray-800 dark:text-slate-200 line-clamp-2 mb-2" title={p.project_name || p.project_id}>
                                        {p.project_name || p.project_id}
                                    </p>
                                    <div className="flex justify-between items-end mt-auto">
                                        <div>
                                            <p className="text-[10px] text-gray-500 dark:text-slate-400">Đã GN / Kế hoạch</p>
                                            <p className="text-[11px] font-mono font-bold text-gray-700 dark:text-slate-300">
                                                {fmtB(Number(p.disbursed_amount))} / {fmtB(Number(p.amount))}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-[11px] font-black ${rate < 30 ? 'text-red-600 dark:text-red-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                                {rate}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                                        <div className={`h-1.5 rounded-full ${rate < 30 ? 'bg-red-500' : 'bg-rose-400'}`} style={{ width: `${Math.max(2, rate)}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ───── Overview Chart ───── */}
            <div className="section-card p-4">
                <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    Tổng quan Kế hoạch vs Giải ngân (5 năm)
                </h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(val) => fmtB(val)} />
                            <Tooltip
                                cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => [`${value.toLocaleString()} trđ`, undefined]}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="Kế hoạch" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            <Bar dataKey="Giải ngân" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ───── Tab Bar ───── */}
            <div className="section-card">
                <div className="p-1.5 flex gap-1">
                    {TAB_CFG.map(t => {
                        const isActive = activeTab === t.key;
                        const tabColors: Record<string, string> = { blue: '#2563eb', indigo: '#4f46e5', amber: '#d97706', emerald: '#059669' };
                        return (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                                    isActive
                                        ? 'text-white shadow-md'
                                        : 'text-gray-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700'
                                }`}
                                style={isActive ? { background: tabColors[t.color] } : undefined}
                            >
                                <t.icon className="w-4 h-4" /> {t.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ───── Search with clear ───── */}
            <div className="search-input-wrapper" style={{ position: 'relative' }}>
                <Search className="search-icon" />
                <input
                    type="text" placeholder="Tìm kiếm dự án..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
                        title="Xóa tìm kiếm"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* ═══════ TAB: TRUNG HẠN (Features #15, #17) ═══════ */}
            {activeTab === 'mid_term' && <MidTermTab plans={filteredMidTerm} annualPlans={filteredAnnual} searchTerm={searchTerm} expandedPlan={expandedPlan} setExpandedPlan={setExpandedPlan} navigate={navigate} />}

            {/* ═══════ TAB: HÀNG NĂM (Feature #16) ═══════ */}
            {activeTab === 'annual' && <AnnualTab plans={filteredAnnual} yearFilter={yearFilter} searchTerm={searchTerm} navigate={navigate} />}

            {/* ═══════ TAB: KH GIẢI NGÂN (Features #18, #19) ═══════ */}
            {activeTab === 'disb_plan' && <DisbPlanTab disbPlans={disbPlans} annualPlans={filteredAnnual} yearFilter={yearFilter} searchTerm={searchTerm} />}

            {/* ═══════ TAB: TIẾN ĐỘ GN (Features #20, #21) ═══════ */}
            {activeTab === 'disb_progress' && <DisbProgressTab disbPlans={disbPlans} disbursements={disbursements} annualPlans={filteredAnnual} yearFilter={yearFilter} searchTerm={searchTerm} />}

            {/* Legal footer */}
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-3">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <strong>Căn cứ:</strong> Luật ĐTC 58/2024/QH15 (Đ.49-55), NĐ 99/2021/NĐ-CP, sửa đổi bởi Luật 90/2025/QH15
                </p>
            </div>

            {/* Import Modal */}
            <CapitalImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                currentYear={yearFilter}
            />
        </div>
    );
};

// ═══════════════════════════════════════════════════
//  TAB 1: TRUNG HẠN
// ═══════════════════════════════════════════════════
const MidTermTab: React.FC<{plans: any[]; annualPlans: any[]; searchTerm: string; expandedPlan: string|null; setExpandedPlan: (v:string|null)=>void; navigate: any}> = ({ plans, annualPlans, searchTerm, expandedPlan, setExpandedPlan, navigate }) => {
    const filtered = plans.filter((p: any) => !searchTerm || (p.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Group by period
    const grouped = useMemo(() => {
        const map = new Map<string, any[]>();
        filtered.forEach((p: any) => {
            const key = `${p.period_start}-${p.period_end}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(p);
        });
        return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    }, [filtered]);

    if (filtered.length === 0) return <EmptyState icon={CalendarRange} text="Chưa có KH vốn trung hạn" />;

    return (
        <div className="space-y-4">
            {grouped.map(([period, grpPlans]) => {
                const total = grpPlans.reduce((s: number, p: any) => s + Number(p.amount), 0);
                const disbursed = grpPlans.reduce((s: number, p: any) => s + Number(p.disbursed_amount), 0);
                const rate = total > 0 ? (disbursed / total) * 100 : 0;
                return (
                    <div key={period} className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-base font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-600" /> Giai đoạn {period}
                            </h2>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500">
                                <span>Tổng: <span className="text-blue-700">{fmtB(total)}</span></span>
                                <span>GN: <span className={rate >= 50 ? 'text-emerald-600' : 'text-warning-600'}>{rate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</span></span>
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded-full">{grpPlans.length} DA</span>
                            </div>
                        </div>
                        {grpPlans.map((plan: any) => {
                            const isExp = expandedPlan === plan.plan_id;
                            const badge = APPROVAL_BADGES[plan.approval_status || 'draft'];
                            const BadgeIcon = badge.icon;
                            const dr = Number(plan.amount) > 0 ? (Number(plan.disbursed_amount) / Number(plan.amount)) * 100 : 0;
                            const linked = annualPlans.filter((a: any) => a.project_id === plan.project_id && a.year >= plan.period_start && a.year <= plan.period_end);

                            return (
                                <div key={plan.plan_id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors" onClick={() => setExpandedPlan(isExp ? null : plan.plan_id)}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {isExp ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4 text-blue-600" />}
                                                <div>
                                                    <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5 text-gray-400" /> {plan.project_name}
                                                    </h3>
                                                    <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 ml-5">{plan.decision_number} • {plan.date_assigned} • <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${(SOURCE_LABELS[plan.source] || SOURCE_LABELS['NSĐP']).color}`}>{(SOURCE_LABELS[plan.source] || SOURCE_LABELS['NSĐP']).label}</span></p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-blue-700 dark:text-blue-400">{formatCurrency(Number(plan.amount))}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                                                        <div className="h-2 w-20 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden"><div className={`h-full rounded-full ${dr >= 80 ? 'bg-emerald-500' : dr >= 50 ? 'bg-blue-500' : 'bg-warning-500'}`} style={{ width: `${Math.min(dr, 100)}%` }} /></div>
                                                        <span className={`text-[10px] font-bold ${dr >= 80 ? 'text-emerald-600' : dr >= 50 ? 'text-blue-600' : 'text-warning-600'}`}>GN {dr.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</span>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 whitespace-nowrap ${badge.color}`}>
                                                    <BadgeIcon className="w-3 h-3" /> {badge.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {isExp && (
                                        <div className="px-5 py-4 border-t border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                            <div className="grid grid-cols-4 gap-3 mb-4">
                                                {[
                                                    { label: 'Tổng KH trung hạn', value: formatCurrency(Number(plan.amount)), cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700' },
                                                    { label: 'Đã giải ngân', value: formatCurrency(Number(plan.disbursed_amount)), cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
                                                    { label: 'Đã phân bổ HN', value: formatCurrency(linked.reduce((s:number, a:any) => s + Number(a.amount), 0)), cls: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' },
                                                    { label: 'Chưa phân bổ', value: formatCurrency(Math.max(0, Number(plan.amount) - linked.reduce((s:number, a:any) => s + Number(a.amount), 0))), cls: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
                                                ].map(kpi => (
                                                    <div key={kpi.label} className={`p-3 rounded-lg ${kpi.cls.split(' ').slice(0,2).join(' ')}`}>
                                                        <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase">{kpi.label}</p>
                                                        <p className={`text-sm font-black mt-1 ${kpi.cls.split(' ').pop()}`}>{kpi.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            {plan.notes && <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg mb-3 text-xs text-gray-600 dark:text-slate-300 italic border border-gray-100 dark:border-slate-600 flex items-start gap-1.5"><FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" /><span>{plan.notes}</span></div>}
                                            {linked.length > 0 && (
                                                <>
                                                    <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Phân bổ theo năm ({linked.length} KH)</h5>
                                                    <table className="w-full text-xs mb-3">
                                                        <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                                                            <tr><th className="px-3 py-1.5 text-left">Năm</th><th className="px-3 py-1.5 text-left">QĐ</th><th className="px-3 py-1.5 text-right">Vốn giao</th><th className="px-3 py-1.5 text-right">Đã GN</th><th className="px-3 py-1.5 text-right">Tỷ lệ</th></tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                            {linked.sort((a:any,b:any) => a.year - b.year).map((ap: any) => {
                                                                const r = Number(ap.amount) > 0 ? (Number(ap.disbursed_amount) / Number(ap.amount)) * 100 : 0;
                                                                return (
                                                                    <tr key={ap.plan_id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10">
                                                                        <td className="px-3 py-1.5 font-bold">{ap.year}</td>
                                                                        <td className="px-3 py-1.5 text-gray-600">{ap.decision_number || '—'}</td>
                                                                        <td className="px-3 py-1.5 text-right font-mono font-bold text-blue-700">{formatCurrency(Number(ap.amount))}</td>
                                                                        <td className="px-3 py-1.5 text-right font-mono text-emerald-600">{formatCurrency(Number(ap.disbursed_amount))}</td>
                                                                        <td className="px-3 py-1.5 text-right"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r >= 80 ? 'bg-emerald-100 text-emerald-600' : r >= 50 ? 'bg-blue-100 text-blue-600' : 'bg-warning-100 text-warning-600'}`}>{r.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</span></td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </>
                                            )}
                                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-700">
                                                <div className="text-[10px] text-gray-500">{plan.approved_by && <span>Phê duyệt: <strong>{plan.approved_by}</strong> • {plan.approved_date}</span>}</div>
                                                <button onClick={() => navigate(`/projects/${plan.project_id}`)} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all"><ArrowRight className="w-3 h-3" /> Xem dự án</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

// ═══════════════════════════════════════════════════
//  TAB 2: HÀNG NĂM (Feature #16)
// ═══════════════════════════════════════════════════
const AnnualTab: React.FC<{plans: any[]; yearFilter: number; searchTerm: string; navigate: any}> = ({ plans, yearFilter, searchTerm, navigate }) => {
    const slidePanel = useSlidePanelSafe();

    const filtered = plans
        .filter((p: any) => p.year === yearFilter)
        .filter((p: any) => !searchTerm || (p.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a: any, b: any) => Number(b.amount) - Number(a.amount));

    const totalAlloc = filtered.reduce((s: number, p: any) => s + Number(p.amount), 0);
    const totalDisb = filtered.reduce((s: number, p: any) => s + Number(p.disbursed_amount), 0);

    if (filtered.length === 0) return <EmptyState icon={Calendar} text={`Chưa có KH vốn hàng năm ${yearFilter}`} />;

    return (
        <div className="section-card">
            <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider">
                            <th className="px-4 py-3 text-left w-8">STT</th>
                            <th className="px-4 py-3 text-left">Dự án</th>
                            <th className="px-4 py-3 text-left">QĐ giao vốn</th>
                            <th className="px-4 py-3">Nguồn</th>
                            <th className="px-4 py-3 text-right">KHV {yearFilter}</th>
                            <th className="px-4 py-3 text-right">Đã giải ngân</th>
                            <th className="px-4 py-3 text-right">Còn lại</th>
                            <th className="px-4 py-3 text-center">Tỷ lệ GN</th>
                            <th className="px-4 py-3 text-center w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                        {filtered.map((p: any, idx: number) => {
                            const remaining = Number(p.amount) - Number(p.disbursed_amount);
                            const rate = Number(p.amount) > 0 ? (Number(p.disbursed_amount) / Number(p.amount)) * 100 : 0;
                            return (
                                <tr key={p.plan_id} 
                                    className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group"
                                    onClick={() => {
                                        if (slidePanel) {
                                            slidePanel.openPanel({
                                                title: `Vốn & Giải ngân: ${p.project_name}`,
                                                component: <ProjectCapitalTab projectID={p.project_id} />,
                                                icon: <Landmark className="w-5 h-5 text-blue-500" />,
                                                url: `/projects/${p.project_id}?tab=capital`
                                            });
                                        } else {
                                            navigate(`/projects/${p.project_id}?tab=capital`);
                                        }
                                    }}
                                >
                                    <td className="px-4 py-2.5 text-gray-400 font-mono">{idx + 1}</td>
                                    <td className="px-4 py-2.5">
                                        <p className="font-bold text-gray-800 dark:text-slate-100">{p.project_name}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{p.project_id}</p>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <p className="text-gray-700 dark:text-slate-300 font-medium">{p.decision_number || '—'}</p>
                                        <p className="text-[10px] text-gray-400">{p.date_assigned}</p>
                                    </td>
                                    <td className="px-4 py-2.5 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${(SOURCE_LABELS[normalizeSource(p.source)] || SOURCE_LABELS['NSĐP']).color}`}>{(SOURCE_LABELS[normalizeSource(p.source)] || SOURCE_LABELS['NSĐP']).label}</span></td>
                                    <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-600 dark:text-blue-300">{formatCurrency(Number(p.amount))}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(p.disbursed_amount))}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-gray-600 dark:text-slate-300">{formatCurrency(remaining)}</td>
                                    <td className="px-4 py-2.5 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <div className="w-14 h-1.5 bg-gray-100 dark:bg-slate-600 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-blue-500' : 'bg-warning-500'}`} style={{ width: `${Math.min(rate, 100)}%` }} />
                                            </div>
                                            <span className={`text-[10px] font-bold ${rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-blue-600' : 'text-warning-600'}`}>{rate.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                        <div className="p-1 text-gray-400 group-hover:text-blue-600 transition-colors" title="Xem chi tiết">
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-blue-50/50 dark:bg-blue-900/20 font-bold border-t-2 border-blue-200 dark:border-blue-800">
                        <tr>
                            <td className="px-4 py-2.5" colSpan={4}><span className="text-gray-800 dark:text-slate-100">TỔNG CỘNG</span></td>
                            <td className="px-4 py-2.5 text-right font-mono text-blue-600 dark:text-blue-300">{formatCurrency(totalAlloc)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400">{formatCurrency(totalDisb)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-gray-600 dark:text-slate-300">{formatCurrency(totalAlloc - totalDisb)}</td>
                            <td className="px-4 py-2.5 text-center text-xs font-bold text-blue-600 dark:text-blue-300">{totalAlloc > 0 ? ((totalDisb/totalAlloc)*100).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : 0}%</td>
                            <td className="px-4 py-2.5"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════
//  TAB 3: KH GIẢI NGÂN (Features #18, #19)
//  Grid: DA × 12 tháng (planned amounts)
// ═══════════════════════════════════════════════════
const DisbPlanTab: React.FC<{disbPlans: any[]; annualPlans: any[]; yearFilter: number; searchTerm: string}> = ({ disbPlans, annualPlans, yearFilter, searchTerm }) => {
    // Group by project
    const yearDisbPlans = disbPlans.filter((d: any) => d.year === yearFilter);
    const projectIds: string[] = [...new Set<string>(yearDisbPlans.map((d: any) => d.project_id))].filter(pid => !searchTerm || (yearDisbPlans.find((d:any) => d.project_id === pid)?.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()));

    if (projectIds.length === 0) return <EmptyState icon={BarChart3} text={`Chưa có KH giải ngân ${yearFilter}`} />;

    return (
        <div className="section-card">
            <div className="section-card-header">
                <span>Quản lý nguồn vốn & KH giải ngân {yearFilter} — Theo tháng</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase sticky left-0 z-10 min-w-[200px]" style={{ background: 'inherit' }}>Dự án</th>
                            <th className="px-3 py-2 text-right text-[10px] font-bold uppercase min-w-[80px]">KHV</th>
                            {MONTHS.map((m, i) => <th key={m} className={`px-2 py-2 text-right text-[10px] font-bold uppercase min-w-[80px] ${i + 1 === currentMonth ? 'bg-primary-100/60 dark:bg-primary-900/20' : ''}`}>{m}</th>)}
                            <th className="px-3 py-2 text-right text-[10px] font-bold uppercase min-w-[90px]">Tổng KH GN</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {projectIds.map((pid) => {
                            const pPlans = yearDisbPlans.filter((d: any) => d.project_id === pid);
                            const pName = pPlans[0]?.project_name || pid;
                            const monthlyMap = new Map<number, number>();
                            pPlans.forEach((d: any) => monthlyMap.set(d.month, Number(d.planned_amount) || 0));
                            const totalPlanned = Array.from(monthlyMap.values()).reduce((s, v) => s + v, 0);
                            const annualPlan = annualPlans.find((a: any) => a.project_id === pid && a.year === yearFilter);
                            const khv = annualPlan ? Number(annualPlan.amount) : 0;

                            return (
                                <tr key={pid} className="hover:bg-primary-50/20 dark:hover:bg-primary-900/5 transition-colors">
                                    <td className="px-3 py-2 sticky left-0 bg-white dark:bg-slate-800 z-10">
                                        <p className="font-bold text-gray-800 dark:text-slate-100 truncate">{pName}</p>
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono font-bold text-blue-600 dark:text-blue-300">{khv > 0 ? fmtB(khv) : '—'}</td>
                                    {MONTHS.map((_, i) => {
                                        const v = monthlyMap.get(i + 1) || 0;
                                        return <td key={i} className={`px-2 py-2 text-right font-mono text-slate-600 dark:text-slate-300 ${i + 1 === currentMonth ? 'bg-primary-50/40 dark:bg-primary-900/10' : ''}`}>{v > 0 ? fmtB(v) : ''}</td>;
                                    })}
                                    <td className="px-3 py-2 text-right font-mono font-bold text-primary-600 dark:text-primary-300">{totalPlanned > 0 ? fmtB(totalPlanned) : '—'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-primary-50/30 dark:bg-primary-900/10 font-bold border-t-2 border-primary-200 dark:border-primary-800">
                        <tr>
                            <td className="px-3 py-2 sticky left-0 bg-primary-50/30 dark:bg-primary-900/10 z-10 font-black text-gray-800 dark:text-slate-100">TỔNG</td>
                            <td className="px-3 py-2 text-right font-mono text-blue-600 dark:text-blue-300">{fmtB(projectIds.reduce((s: number, pid: string) => { const ap = annualPlans.find((a:any) => a.project_id === pid && a.year === yearFilter); return s + (ap ? Number(ap.amount) : 0); }, 0))}</td>
                            {MONTHS.map((_, i) => {
                                const total = projectIds.reduce((s: number, pid: string) => {
                                    const d = yearDisbPlans.find((x:any) => x.project_id === pid && x.month === i + 1);
                                    return s + (d ? Number(d.planned_amount) : 0);
                                }, 0);
                                return <td key={i} className={`px-2 py-2 text-right font-mono text-primary-600 dark:text-primary-300 ${i + 1 === currentMonth ? 'bg-primary-100/60 dark:bg-primary-900/20' : ''}`}>{total > 0 ? fmtB(total) : ''}</td>;
                            })}
                            <td className="px-3 py-2 text-right font-mono text-primary-600 dark:text-primary-300 font-black">{fmtB(yearDisbPlans.reduce((s:number, d:any) => s + (Number(d.planned_amount) || 0), 0))}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════
//  TAB 4: TIẾN ĐỘ GIẢI NGÂN (Features #20, #21)
//  Grid: DA × 12 tháng (actual amounts + KH vs TT comparison)
// ═══════════════════════════════════════════════════
const DisbProgressTab: React.FC<{disbPlans: any[]; disbursements: any[]; annualPlans: any[]; yearFilter: number; searchTerm: string}> = ({ disbPlans, disbursements, annualPlans, yearFilter, searchTerm }) => {
    // Build actual disbursement by project × month from disbursements table
    const yearDisbs = disbursements.filter((d: any) => {
        const date = new Date(d.date);
        return date.getFullYear() === yearFilter && d.status !== 'Rejected';
    });
    
    const yearDisbPlans = disbPlans.filter((d: any) => d.year === yearFilter);

    // All project IDs that have either planned or actual data
    const projectIds = [...new Set([
        ...yearDisbs.map((d: any) => d.project_id),
        ...yearDisbPlans.map((d: any) => d.project_id),
    ])].filter(pid => {
        if (!searchTerm) return true;
        const name = yearDisbs.find((d:any) => d.project_id === pid)?.project_name || yearDisbPlans.find((d:any) => d.project_id === pid)?.project_name || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (projectIds.length === 0) return <EmptyState icon={TrendingUp} text={`Chưa có dữ liệu giải ngân ${yearFilter}`} />;

    return (
        <div className="section-card">
            <div className="section-card-header">
                <span>Quản lý tiến độ giải ngân {yearFilter} — So sánh KH vs Thực tế</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase sticky left-0 z-10 min-w-[200px]" style={{ background: 'inherit' }}>Dự án</th>
                            <th className="px-3 py-2 text-center text-[10px] font-bold uppercase min-w-[50px]">Loại</th>
                            <th className="px-3 py-2 text-right text-[10px] font-bold uppercase min-w-[80px]">KHV</th>
                            {MONTHS.map((m, i) => <th key={m} className={`px-2 py-2 text-right text-[10px] font-bold uppercase min-w-[80px] ${i + 1 === currentMonth ? 'bg-emerald-100/40 dark:bg-emerald-900/20' : ''}`}>{m}</th>)}
                            <th className="px-3 py-2 text-right text-[10px] font-bold uppercase min-w-[90px]">Tổng</th>
                            <th className="px-3 py-2 text-center text-[10px] font-bold uppercase min-w-[60px]">Tỷ lệ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projectIds.map((pid) => {
                            const pName = yearDisbs.find((d:any) => d.project_id === pid)?.project_name || yearDisbPlans.find((d:any) => d.project_id === pid)?.project_name || pid;
                            
                            // Planned by month
                            const plannedMap = new Map<number, number>();
                            yearDisbPlans.filter((d:any) => d.project_id === pid).forEach((d:any) => plannedMap.set(d.month, Number(d.planned_amount) || 0));
                            
                            // Actual by month
                            const actualMap = new Map<number, number>();
                            yearDisbs.filter((d:any) => d.project_id === pid).forEach((d:any) => {
                                const m = new Date(d.date).getMonth() + 1;
                                actualMap.set(m, (actualMap.get(m) || 0) + Number(d.amount));
                            });

                            const totalPlanned = Array.from(plannedMap.values()).reduce((s, v) => s + v, 0);
                            const totalActual = Array.from(actualMap.values()).reduce((s, v) => s + v, 0);
                            const annualPlan = annualPlans.find((a:any) => a.project_id === pid && a.year === yearFilter);
                            const khv = annualPlan ? Number(annualPlan.amount) : 0;
                            const rate = khv > 0 ? (totalActual / khv) * 100 : 0;

                            return (
                                <React.Fragment key={pid}>
                                    {/* Row KH (planned) */}
                                    <tr className="border-t border-gray-200 dark:border-slate-600 bg-blue-50/20 dark:bg-blue-900/5">
                                        <td className="px-3 py-1.5 sticky left-0 bg-blue-50/20 dark:bg-blue-900/5 z-10" rowSpan={2}>
                                            <p className="font-bold text-gray-800 dark:text-slate-100 truncate">{pName}</p>
                                        </td>
                                        <td className="px-3 py-1.5 text-center"><span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[9px] font-bold rounded">KH</span></td>
                                        <td className="px-3 py-1.5 text-right font-mono text-blue-600 dark:text-blue-300" rowSpan={2}>{khv > 0 ? fmtB(khv) : '—'}</td>
                                        {MONTHS.map((_, i) => {
                                            const v = plannedMap.get(i + 1) || 0;
                                            return <td key={i} className={`px-2 py-1.5 text-right font-mono text-blue-500 dark:text-blue-300/70 ${i + 1 === currentMonth ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>{v > 0 ? fmtB(v) : ''}</td>;
                                        })}
                                        <td className="px-3 py-1.5 text-right font-mono text-blue-600 dark:text-blue-300 font-bold">{totalPlanned > 0 ? fmtB(totalPlanned) : '—'}</td>
                                        <td className="px-3 py-1.5 text-center" rowSpan={2}>
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black ${rate >= 80 ? 'bg-emerald-100 text-emerald-600' : rate >= 50 ? 'bg-blue-100 text-blue-600' : 'bg-warning-100 text-warning-600'}`}>
                                                {rate.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}%
                                            </span>
                                        </td>
                                    </tr>
                                    {/* Row TT (actual) */}
                                    <tr className="bg-emerald-50/20 dark:bg-emerald-900/5 border-b border-gray-200 dark:border-slate-700">
                                        <td className="px-3 py-1.5 text-center"><span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[9px] font-bold rounded">TT</span></td>
                                        {MONTHS.map((_, i) => {
                                            const vActual = actualMap.get(i + 1) || 0;
                                            const vPlanned = plannedMap.get(i + 1) || 0;
                                            const diff = vActual - vPlanned;
                                            return (
                                                <td key={i} className={`px-2 py-1.5 text-right font-mono ${i + 1 === currentMonth ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>
                                                    {vActual > 0 ? <span className={diff >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-500 dark:text-red-400'}>{fmtB(vActual)}</span> : ''}
                                                </td>
                                            );
                                        })}
                                        <td className="px-3 py-1.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">{totalActual > 0 ? fmtB(totalActual) : '—'}</td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-emerald-50/30 dark:bg-emerald-900/10 font-bold border-t-2 border-emerald-200 dark:border-emerald-800">
                        <tr>
                            <td className="px-3 py-2 sticky left-0 bg-emerald-50/30 dark:bg-emerald-900/10 z-10 font-black text-gray-800 dark:text-slate-100">TỔNG</td>
                            <td className="px-3 py-2 text-center text-[9px] font-bold text-blue-600">KH</td>
                            <td className="px-3 py-2 text-right font-mono text-blue-600 dark:text-blue-300">{fmtB(projectIds.reduce((s: number, pid: string) => { const ap = annualPlans.find((a:any) => a.project_id === pid && a.year === yearFilter); return s + (ap ? Number(ap.amount) : 0); }, 0))}</td>
                            {MONTHS.map((_, i) => {
                                const total = projectIds.reduce((s: number, pid: string) => {
                                    const d = yearDisbPlans.find((x:any) => x.project_id === pid && x.month === i + 1);
                                    return s + (d ? Number(d.planned_amount) : 0);
                                }, 0);
                                return <td key={`kh-${i}`} className={`px-2 py-2 text-right font-mono text-blue-600 dark:text-blue-300 ${i + 1 === currentMonth ? 'bg-emerald-100/40 dark:bg-emerald-900/20' : ''}`}>{total > 0 ? fmtB(total) : ''}</td>;
                            })}
                            <td className="px-3 py-2 text-right font-mono text-blue-600 dark:text-blue-300 font-black">{fmtB(yearDisbPlans.reduce((s:number, d:any) => s + (Number(d.planned_amount) || 0), 0))}</td>
                            <td className="px-3 py-2"></td>
                        </tr>
                        <tr>
                            <td className="px-3 py-2 sticky left-0 bg-emerald-50/30 dark:bg-emerald-900/10 z-10"></td>
                            <td className="px-3 py-2 text-center text-[9px] font-bold text-emerald-600">TT</td>
                            <td className="px-3 py-2"></td>
                            {MONTHS.map((_, i) => {
                                const total = projectIds.reduce((s: number, pid: string) => {
                                    return s + yearDisbs.filter((d:any) => d.project_id === pid && new Date(d.date).getMonth() === i).reduce((ss: number, d: any) => ss + Number(d.amount), 0);
                                }, 0);
                                return <td key={`tt-${i}`} className={`px-2 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold ${i + 1 === currentMonth ? 'bg-emerald-100/40 dark:bg-emerald-900/20' : ''}`}>{total > 0 ? fmtB(total) : ''}</td>;
                            })}
                            <td className="px-3 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black">{fmtB(yearDisbs.reduce((s:number, d:any) => s + (Number(d.amount) || 0), 0))}</td>
                            <td className="px-3 py-2"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            {/* Legend */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-700 flex items-center gap-4 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-100 rounded" /> KH = Kế hoạch</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-100 rounded" /> TT = Thực tế</span>
                <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-500" /> Đỏ = Thấp hơn KH</span>
            </div>

        </div>
    );
};

// ─── Empty State ────────────────────────────────
const EmptyState: React.FC<{icon: React.ElementType; text: string}> = ({ icon: Icon, text }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-12 text-center">
        <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
        <p className="text-sm font-bold text-gray-400 dark:text-slate-400">{text}</p>
    </div>
);

export default CapitalPlanningPage;
