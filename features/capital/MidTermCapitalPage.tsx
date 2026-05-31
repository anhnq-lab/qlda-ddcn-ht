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
import { FilterChip } from '../../components/ui';

const CapitalOverviewChart = React.lazy(() => import('./components/CapitalOverviewChart'));
import { CapitalImportModal } from './CapitalImportModal';
import { APPROVAL_BADGES, SOURCE_LABELS, normalizeSource, MONTHS } from '../../utils/capitalConstants';
import { useSlidePanelSafe } from '../../context/SlidePanelContext';
const ProjectCapitalTab = React.lazy(() => import('../../components/common/ProjectCapitalTab').then(m => ({ default: m.ProjectCapitalTab })));

import { MidTermTab } from './components/MidTermTab';
import { AnnualTab } from './components/AnnualTab';
import { DisbPlanTab } from './components/DisbPlanTab';
import { DisbProgressTab } from './components/DisbProgressTab';
import { EmptyState } from './components/EmptyState';

// ═══════════════════════════════════════════════════
//  KẾ HOẠCH VỐN & GIẢI NGÂN — Module tổng hợp
//  Features #15-21 | Luật ĐTC 58/2024/QH15
// ═══════════════════════════════════════════════════

type PageTab = 'mid_term' | 'annual' | 'disb_plan' | 'disb_progress';

// ─── Helpers ────────────────────────────────────────────

function fmtB(n: number): string {
    if (n >= 1e9) return `${(n / 1e9).toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} tỷ`;
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
            <div className="p-4 text-center text-txt-muted">
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
                        <span className="text-txt-primary">Kế hoạch Vốn & Giải ngân</span>
                    </h1>
                    <p className="text-sm text-txt-muted mt-1 ml-14">
                        Luật ĐTC 58/2024/QH15 • Quản lý tổng hợp tất cả dự án
                    </p>
                </div>
            </div>

            {/* ───── Toolbar & Stats ───── */}
            <div className="bg-bg-surface rounded-2xl border border-border shadow-sm p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                {/* Stats Badges */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {[
                        { label: 'Vốn Trung hạn', value: fmtB(totalMidTerm), sub: `${midTermPlans.length} KH`, icon: Landmark, color: 'blue' },
                        { label: `Vốn giao ${yearFilter}`, value: fmtB(totalAnnual), sub: `${annualPlans.filter((p: any) => p.year === yearFilter).length} DA`, icon: Calendar, color: 'emerald' },
                        { label: `Đã giải ngân`, value: fmtB(totalDisbursed), sub: `${disbRate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`, icon: DollarSign, color: 'amber' },
                        { label: 'Còn lại', value: fmtB(totalAnnual - totalDisbursed), sub: disbRate < 50 ? 'Chậm' : 'Bình thường', icon: ArrowUpDown, color: disbRate < 50 ? 'rose' : 'violet' }
                    ].map((stat) => {
                        const Icon = stat.icon;
                        const colorStyles: Record<string, string> = {
                            blue: 'bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border-blue-100/50 dark:border-blue-900/20',
                            emerald: 'bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/20',
                            amber: 'bg-amber-50/50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/20',
                            violet: 'bg-purple-50/50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 border-purple-100/50 dark:border-purple-900/20',
                            rose: 'bg-rose-50/50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 border-rose-100/50 dark:border-rose-900/20',
                        };
                        const styleClass = colorStyles[stat.color] || colorStyles.blue;
                        return (
                            <div
                                key={stat.label}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${styleClass}`}
                            >
                                <Icon className="w-3.5 h-3.5 opacity-80" />
                                <span className="opacity-90">{stat.label}:</span>
                                <span className="font-extrabold text-[13px] leading-none">{stat.value}</span>
                                <span className="text-[10px] opacity-75 font-medium">({stat.sub})</span>
                            </div>
                        );
                    })}
                </div>

                {/* Filters and Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:justify-end">
                    <FilterChip
                        label="Nguồn vốn"
                        value={sourceFilter}
                        onChange={setSourceFilter}
                        options={[
                            { value: 'all', label: 'Tất cả nguồn' },
                            { value: 'NSĐP', label: 'NS Địa phương' },
                            { value: 'NSTW', label: 'NS Trung ương' },
                            { value: 'ODA', label: 'ODA/Vốn vay' },
                        ]}
                    />
                    <FilterChip
                        label="Năm"
                        value={String(yearFilter)}
                        onChange={v => setYearFilter(Number(v))}
                        options={Array.from({ length: 8 }, (_, i) => new Date().getFullYear() + 2 - i).map(y => ({ value: String(y), label: String(y) }))}
                    />
                    
                    {/* Actions Divider */}
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

                    {/* Import Excel */}
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
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
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                        title="Xuất dữ liệu ra Excel"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Xuất Excel
                    </button>
                </div>
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
                                <div key={p.plan_id} className="bg-bg-surface rounded-lg p-3 shadow-sm border border-rose-100 dark:border-rose-800/50 flex flex-col justify-between cursor-pointer hover:border-rose-300 transition-colors" onClick={() => navigate(`/projects/${p.project_id}?tab=capital`)}>
                                    <p className="text-[11px] font-bold text-txt-primary line-clamp-2 mb-2" title={p.project_name || p.project_id}>
                                        {p.project_name || p.project_id}
                                    </p>
                                    <div className="flex justify-between items-end mt-auto">
                                        <div>
                                            <p className="text-[10px] text-txt-muted">Đã GN / Kế hoạch</p>
                                            <p className="text-[11px] font-mono font-bold text-txt-secondary">
                                                {fmtB(Number(p.disbursed_amount))} / {fmtB(Number(p.amount))}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-[11px] font-black ${rate < 30 ? 'text-red-600 dark:text-red-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                                {rate}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
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
                <h3 className="text-sm font-bold text-txt-primary mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    Tổng quan Kế hoạch vs Giải ngân (5 năm)
                </h3>
                <React.Suspense fallback={<div className="h-48 bg-bg-subtle rounded-xl animate-pulse" />}>
                    <CapitalOverviewChart chartData={chartData} />
                </React.Suspense>
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
                                        : 'text-txt-muted hover:bg-bg-subtle dark:hover:bg-slate-700'
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

            {/* ═══════ TAB: TIẾN ĐỘ GIẢI NGÂN (Features #20, #21) ═══════ */}
            {activeTab === 'disb_progress' && (
                <DisbProgressTab
                    disbPlans={disbPlans}
                    disbursements={disbursements}
                    annualPlans={filteredAnnual}
                    yearFilter={yearFilter}
                    searchTerm={searchTerm}
                />
            )}
        </div>
    );
};

// ─── Empty State ────────────────────────────────
export default CapitalPlanningPage;

