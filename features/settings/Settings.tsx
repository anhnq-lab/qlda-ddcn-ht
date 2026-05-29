import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Shield, Building2, Network, Wrench, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTabSearchParam } from '../../hooks/useTabSearchParam';

// Components (Lazy loaded)
const UserAccountManager = React.lazy(() => import('./components/admin/UserAccountManager'));
const PermissionManager = React.lazy(() => import('./PermissionManager'));
const RoleDefaultsManager = React.lazy(() => import('./RoleDefaultsManager'));
const ContractorAccountManager = React.lazy(() => import('./components/admin/ContractorAccountManager'));
const AuditLogViewer = React.lazy(() => import('./components/admin/AuditLogViewer'));
const UserImpersonator = React.lazy(() => import('./UserImpersonator'));
const DashboardWidgetManager = React.lazy(() => import('./components/admin/DashboardWidgetManager'));

// ============================================================
// SETTINGS — Unified Admin Control Panel
// ============================================================

type TabKey = 'accounts' | 'contractors' | 'role-defaults' | 'permissions' | 'dashboard-widgets' | 'audit-log' | 'tools';

interface TabDef {
    key: TabKey;
    label: string;
    icon: React.ElementType;
}

const TABS: TabDef[] = [
    { key: 'accounts', label: 'Tài khoản', icon: Users },
    { key: 'contractors', label: 'Nhà thầu', icon: Building2 },
    { key: 'role-defaults', label: 'Ma trận quyền', icon: ShieldCheck },
    { key: 'permissions', label: 'Quyền cá nhân', icon: Shield },
    { key: 'dashboard-widgets', label: 'Cấu hình Dashboard', icon: LayoutDashboard },
    { key: 'audit-log', label: 'Nhật ký hệ thống', icon: Network },
    { key: 'tools', label: 'Công cụ', icon: Wrench },
];

const Settings: React.FC = () => {
    const { currentUser } = useAuth();
    
    // Safety check - should be handled by ProtectedRoute, but good to be safe
    const isAdmin = currentUser?.Role === 'Admin';

    // Sync tab ↔ URL
    const [activeTab, setActiveTab] = useTabSearchParam<TabKey>(
        'accounts',
        ['accounts', 'contractors', 'role-defaults', 'permissions', 'dashboard-widgets', 'audit-log', 'tools'] as const,
        'tab'
    );

    const switchTab = (key: TabKey) => {
        setActiveTab(key);
    };

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-txt-muted">
                <ShieldCheck className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600" />
                <h2 className="text-xl font-semibold mb-2">Không có quyền truy cập</h2>
                <p>Chỉ Admin mới có thể truy cập cài đặt hệ thống.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col max-w-[1600px] w-full mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 px-6 lg:px-8 pt-8 pb-2">
                <div>
                    <h1 className="text-3xl font-bold text-txt-primary flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-sm shadow-primary-500/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        Cài đặt hệ thống
                    </h1>
                    <p className="text-sm text-txt-muted mt-2 font-medium">
                        Quản trị tài khoản, phân quyền, nhật ký và công cụ hệ thống
                    </p>
                </div>
            </div>

            {/* Tabs - Segmented Control Style */}
            <div className="px-6 lg:px-8 mt-4 mb-2">
                <div className="inline-flex p-1 gap-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto no-scrollbar max-w-full">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => switchTab(tab.key)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 text-sm font-semibold whitespace-nowrap
                                    rounded-lg transition-all duration-200
                                    ${isActive
                                        ? 'text-primary-700 dark:text-white bg-white dark:bg-primary-600 shadow-sm ring-1 ring-black/5 dark:ring-primary-500/50'
                                        : 'text-txt-muted hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700'
                                    }
                                `}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
                <React.Suspense
                    fallback={
                        <div className="flex items-center justify-center h-full">
                            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    }
                >
                    {activeTab === 'accounts' && (
                        <div className="p-6 lg:p-8 h-full flex flex-col min-h-0">
                            <UserAccountManager />
                        </div>
                    )}
                    {activeTab === 'contractors' && (
                        <div className="p-6 lg:p-8 h-full flex flex-col min-h-0">
                            <ContractorAccountManager />
                        </div>
                    )}
                    {activeTab === 'role-defaults' && (
                        <div className="p-6 lg:p-8 h-full flex flex-col min-h-0">
                            <RoleDefaultsManager />
                        </div>
                    )}
                    {activeTab === 'permissions' && (
                        <div className="p-6 lg:p-8 h-full flex flex-col min-h-0">
                            <PermissionManager />
                        </div>
                    )}
                    {activeTab === 'dashboard-widgets' && (
                        <div className="p-6 lg:p-8 h-full flex flex-col min-h-0">
                            <DashboardWidgetManager />
                        </div>
                    )}
                    {activeTab === 'audit-log' && (
                        <div className="p-6 lg:p-8 h-full flex flex-col min-h-0">
                            <AuditLogViewer standalone={true} />
                        </div>
                    )}
                    {activeTab === 'tools' && (
                        <div className="p-6 lg:p-8 max-w-2xl">
                            <div className="bg-bg-surface rounded-2xl border border-border shadow-sm">
                                <div className="p-4 border-b border-border flex items-center gap-3">
                                    <div className="p-2 bg-warning-50 dark:bg-warning-900/30 rounded-xl">
                                        <Users className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-txt-primary">Giả làm người dùng</h3>
                                        <p className="text-xs text-txt-muted">Test phân quyền bằng cách đăng nhập với vai trò khác</p>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <UserImpersonator />
                                </div>
                            </div>
                        </div>
                    )}
                </React.Suspense>
            </div>
        </div>
    );
};

export default Settings;

