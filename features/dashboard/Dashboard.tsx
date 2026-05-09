import React, { useState } from 'react';
import { OverviewTab } from './components/OverviewTab';
import { MonthlyBriefingTab } from './components/MonthlyBriefingTab';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

import { Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'monthly'>('overview');

    return (
        <div className="space-y-6 pb-20 font-sans">
            {/* ── HEADER ── */}
            <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-slate-100 tracking-tight uppercase">
                    Trung tâm điều hành — Ban QLDA ĐTXD CN
                </h2>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Cập nhật dữ liệu: {new Date().toLocaleDateString('vi-VN')}
                </p>
            </div>

            {/* ── TABS NAVIGATION ── */}
            <div className="border-b border-[#ece7de] dark:border-slate-700 bg-[#FCF9F2] dark:bg-slate-800 px-6 pt-4 rounded-t-2xl">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-colors ${
                            activeTab === 'overview'
                                ? 'border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                    >
                        Tổng quan hệ thống
                    </button>
                    <button
                        onClick={() => setActiveTab('monthly')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-colors ${
                            activeTab === 'monthly'
                                ? 'border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                    >
                        Báo cáo giao ban tháng
                    </button>
                </nav>
            </div>

            {/* ── TAB CONTENT ── */}
            <div className="pt-2">
                {activeTab === 'overview' && (
                    <ErrorBoundary>
                        <OverviewTab />
                    </ErrorBoundary>
                )}
                {activeTab === 'monthly' && (
                    <ErrorBoundary>
                        <MonthlyBriefingTab />
                    </ErrorBoundary>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
