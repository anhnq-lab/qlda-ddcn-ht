import React, { useState, useMemo, lazy, Suspense } from 'react';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

const OverviewTab = lazy(() => import('./components/OverviewTab').then(m => ({ default: m.OverviewTab })));
const MonthlyBriefingTab = lazy(() => import('./components/MonthlyBriefingTab').then(m => ({ default: m.MonthlyBriefingTab })));
const AITab = lazy(() => import('./components/AITab').then(m => ({ default: m.AITab })));
import { MANAGEMENT_BOARDS } from '../../types';
import { useTabSearchParam } from '../../hooks/useTabSearchParam';

import { Clock, X, Filter } from 'lucide-react';
import { FilterChip } from '../../components/ui';

const Dashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useTabSearchParam<'overview' | 'monthly' | 'ai'>('overview', ['overview', 'monthly', 'ai'] as const, 'tab');

    // ── Shared Filters (dùng chung cho cả 2 tab) ──
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<number | null>(currentYear);
    const [selectedBoard, setSelectedBoard] = useState<string>('all');

    const availableYears = useMemo(() => {
        const years: number[] = [];
        for (let y = currentYear + 1; y >= 2020; y--) years.push(y);
        return years;
    }, [currentYear]);

    const hasActiveFilter = selectedYear !== currentYear || selectedBoard !== 'all';

    return (
        <div className="space-y-6 pb-20 font-sans">
            {/* ── HEADER + FILTER ROW ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-txt-primary tracking-tight uppercase">
                        Ban QLDA Đầu tư xây dựng Dân dụng & Hạ tầng khu vực
                    </h2>
                    <p className="text-sm font-medium text-txt-secondary mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Cập nhật dữ liệu: {new Date().toLocaleDateString('vi-VN')}
                    </p>
                </div>

                {/* ── SHARED FILTERS ── */}
                <div className="flex flex-wrap gap-1.5 items-center">
                    <FilterChip
                        label="Năm"
                        value={selectedYear != null ? String(selectedYear) : 'all'}
                        onChange={v => setSelectedYear(v === 'all' ? null : parseInt(v))}
                        options={[
                            { value: 'all', label: 'Tất cả năm' },
                            ...availableYears.map(y => ({ value: String(y), label: `Năm ${y}` })),
                        ]}
                    />
                    <FilterChip
                        label="Phòng QLDA"
                        value={selectedBoard}
                        onChange={setSelectedBoard}
                        options={[
                            { value: 'all', label: 'Tất cả phòng' },
                            ...MANAGEMENT_BOARDS.map(b => ({ value: String(b.value), label: b.label })),
                        ]}
                    />

                    {hasActiveFilter && (
                        <button
                            onClick={() => { setSelectedYear(currentYear); setSelectedBoard('all'); }}
                            className="flex items-center gap-1 text-xs font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/50 px-2 py-1.5 h-8 rounded-lg transition-all"
                        >
                            <X className="w-3 h-3" /> Xóa lọc
                        </button>
                    )}
                </div>
            </div>

            {/* Active filter badge */}
            {hasActiveFilter && selectedYear !== null && (
                <div className="flex items-center gap-2 -mt-2">
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full border border-primary-200 dark:border-primary-800 flex items-center gap-1.5">
                        <Filter className="w-3 h-3" />
                        {selectedYear && selectedYear !== currentYear && `Năm ${selectedYear}`}
                        {selectedBoard !== 'all' && ` • ${MANAGEMENT_BOARDS.find(b => b.value.toString() === selectedBoard)?.label || `Phòng QLDA ${selectedBoard}`}`}
                    </span>
                </div>
            )}

            {/* ── TABS NAVIGATION ── */}
            <div className="border-b border-border bg-bg-surface px-6 pt-4 rounded-t-2xl">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-colors ${
                            activeTab === 'overview'
                                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                                : 'border-transparent text-txt-secondary hover:text-txt-primary hover:border-border'
                        }`}
                    >
                        Tổng quan hệ thống
                    </button>
                    <button
                        onClick={() => setActiveTab('monthly')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-colors ${
                            activeTab === 'monthly'
                                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                                : 'border-transparent text-txt-secondary hover:text-txt-primary hover:border-border'
                        }`}
                    >
                        Báo cáo giao ban tháng
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-colors ${
                            activeTab === 'ai'
                                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                                : 'border-transparent text-txt-secondary hover:text-txt-primary hover:border-border'
                        }`}
                    >
                        Trợ lý AI
                    </button>
                </nav>
            </div>

            {/* ── TAB CONTENT ── */}
            <div className="pt-2">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center h-64 gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                        <span className="text-xs text-txt-secondary font-medium">Đang tải dữ liệu phân hệ...</span>
                    </div>
                }>
                    {activeTab === 'overview' && (
                        <ErrorBoundary>
                            <OverviewTab selectedYear={selectedYear} selectedBoard={selectedBoard} />
                        </ErrorBoundary>
                    )}
                     {activeTab === 'monthly' && (
                        <ErrorBoundary>
                            <MonthlyBriefingTab selectedYear={selectedYear ?? currentYear} selectedBoard={selectedBoard} />
                        </ErrorBoundary>
                    )}
                    {activeTab === 'ai' && (
                        <ErrorBoundary>
                            <AITab />
                        </ErrorBoundary>
                    )}
                </Suspense>
            </div>
        </div>
    );
};

export default Dashboard;
