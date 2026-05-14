import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, Users, Shield, Building2, Network, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Components (Lazy loaded)
const UserAccountManager = React.lazy(() => import('../admin/UserAccountManager'));
const PermissionManager = React.lazy(() => import('./PermissionManager'));
const RoleDefaultsManager = React.lazy(() => import('./RoleDefaultsManager'));
const ContractorAccountManager = React.lazy(() => import('../admin/ContractorAccountManager'));
const AuditLogViewer = React.lazy(() => import('../admin/AuditLogViewer'));
const UserImpersonator = React.lazy(() => import('./UserImpersonator'));

// ============================================================
// SETTINGS — Unified Admin Control Panel
// ============================================================

type TabKey = 'accounts' | 'contractors' | 'role-defaults' | 'permissions' | 'audit-log' | 'tools';

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
    { key: 'audit-log', label: 'Nhật ký hệ thống', icon: Network },
    { key: 'tools', label: 'Công cụ', icon: Wrench },
];

const Settings: React.FC = () => {
    const { currentUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Safety check - should be handled by ProtectedRoute, but good to be safe
    const isAdmin = currentUser?.Role === 'Admin';

    // Read tab from URL, default to 'accounts'
    const tabFromUrl = searchParams.get('tab') as TabKey | null;
    const [activeTab, setActiveTab] = useState<TabKey>(
        tabFromUrl && TABS.some(t => t.key === tabFromUrl) ? tabFromUrl : 'accounts'
    );

    // Sync tab → URL
    useEffect(() => {
        const current = searchParams.get('tab');
        if (current !== activeTab) {
            setSearchParams({ tab: activeTab }, { replace: true });
        }
    }, [activeTab, searchParams, setSearchParams]);

    const switchTab = (key: TabKey) => {
        setActiveTab(key);
    };

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-slate-400">
                <ShieldCheck className="w-16 h-16 mb-4 text-gray-300 dark:text-slate-600" />
                <h2 className="text-xl font-semibold mb-2">Không có quyền truy cập</h2>
                <p>Chỉ Admin mới có thể truy cập cài đặt hệ thống.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col max-w-[1600px] w-full mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 pt-5 pb-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-sm shadow-primary-500/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        Cài đặt hệ thống
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Quản trị tài khoản, phân quyền, nhật ký và công cụ hệ thống
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 mt-4 border-b border-gray-200 dark:border-slate-700">
                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => switchTab(tab.key)}
                                className={`
                                    flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap
                                    rounded-t-lg transition-all duration-200 relative
                                    ${isActive
                                        ? 'text-primary-700 dark:text-primary-400 bg-primary-50/50 dark:bg-slate-800'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-'
                                    }
                                `}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {/* Active underline */}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full" />
                                )}
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
                    {activeTab === 'audit-log' && (
                        <div className="p-6 lg:p-8 h-full flex flex-col min-h-0">
                            <AuditLogViewer standalone={true} />
                        </div>
                    )}
                    {activeTab === 'tools' && (
                        <div className="p-6 lg:p-8 max-w-2xl">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                                <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-warning-50 dark:bg-warning-900/30 rounded-xl">
                                        <Users className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100">Giả làm người dùng</h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">Test phân quyền bằng cách đăng nhập với vai trò khác</p>
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

