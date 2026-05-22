import React, { useState, useMemo } from 'react';
import { OverviewTab } from './components/OverviewTab';
import { MonthlyBriefingTab } from './components/MonthlyBriefingTab';
import { AITab } from './components/AITab';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { MANAGEMENT_BOARDS } from '../../types';
import { useTabSearchParam } from '../../hooks/useTabSearchParam';

import { Clock, ChevronDown, Building2, Filter, X } from 'lucide-react';

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
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative">
                        <select
                            value={selectedYear ?? 'all'}
                            onChange={e => setSelectedYear(e.target.value === 'all' ? null : parseInt(e.target.value))}
                            aria-label="Lọc theo năm"
                            className="appearance-none pl-3 pr-8 py-2 filter-primary min-w-[120px]"
                        >
                            <option value="all">Tất cả năm</option>
                            {availableYears.map(y => (
                                <option key={y} value={y}>Năm {y}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted pointer-events-none" />
                    </div>

                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted pointer-events-none" />
                        <select
                            value={selectedBoard}
                            onChange={e => setSelectedBoard(e.target.value)}
                            aria-label="Lọc theo ban quản lý"
                            className="appearance-none pl-9 pr-8 py-2 filter-primary min-w-[140px]"
                        >
                            <option value="all">Tất cả ban</option>
                            {MANAGEMENT_BOARDS.map(b => (
                                <option key={b.value} value={b.value}>{b.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted pointer-events-none" />
                    </div>

                    {hasActiveFilter && (
                        <button
                            onClick={() => { setSelectedYear(currentYear); setSelectedBoard('all'); }}
                            className="flex items-center gap-1 text-xs font-bold text-txt-secondary hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <X className="w-3.5 h-3.5" /> Xóa lọc
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
                        {selectedBoard !== 'all' && ` • Ban QLDA ${selectedBoard}`}
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
                {activeTab === 'overview' && (
                    <ErrorBoundary>
                        <OverviewTab selectedYear={selectedYear} selectedBoard={selectedBoard} />
                    </ErrorBoundary>
                )}
                {activeTab === 'monthly' && (
                    <ErrorBoundary>
                        <MonthlyBriefingTab selectedYear={selectedYear ?? currentYear} />
                    </ErrorBoundary>
                )}
                {activeTab === 'ai' && (
                    <ErrorBoundary>
                        <AITab />
                    </ErrorBoundary>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
