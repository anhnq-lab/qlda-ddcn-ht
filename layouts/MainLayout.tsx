import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import { Header } from '../components/common/Header';
import { MobileHeader } from '../components/common/MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { AIChatbot } from '../components/common/AIChatbot';
import { GlobalSearch } from '../components/common/GlobalSearch';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { SlidePanelContainer } from '../components/ui/SlidePanel';
import { SlidePanelProvider } from '../context/SlidePanelContext';
import { useAuth } from '../context/AuthContext';
import { useImpersonation } from '../context/ImpersonationContext';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import { UserCheck, X, RefreshCw, Clock, ChevronUp, Search, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { resolveSystemRole, ROLE_LABELS, ROLE_COLORS, type SystemRole } from '../types/permission.types';
import { Employee } from '../types';
import { Avatar } from '../components/ui';


// Loading skeleton for lazy-loaded pages
const PageLoadingSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded-lg w-1/3"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
            <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
            <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
        </div>
        <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded-xl mt-4"></div>
    </div>
);

// ========================================
// MAIN LAYOUT - Design System v2
// ========================================

const MainLayout: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { impersonatedUser, isImpersonating, stopImpersonation, minutesRemaining, expiryWarning, extendSession, startImpersonation } = useImpersonation();
    const location = useLocation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { theme } = useTheme();
    const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
    const [quickUsers, setQuickUsers] = useState<Employee[]>([]);
    const [quickContractors, setQuickContractors] = useState<any[]>([]);
    const [quickSearch, setQuickSearch] = useState('');
    const [quickLoading, setQuickLoading] = useState(false);

    useEffect(() => {
        if (showQuickSwitcher && quickUsers.length === 0) {
            setQuickLoading(true);
            Promise.all([
                supabase.from('employees').select('*').eq('status', 1).order('full_name'),
                (supabase as any).from('contractor_accounts').select('id, contractor_id, username, display_name, contractors(full_name)').eq('is_active', true).order('display_name')
            ]).then(([empRes, ctrRes]) => {
                if (empRes.data) {
                    setQuickUsers(empRes.data.map((e: any) => ({
                        EmployeeID: e.employee_id,
                        FullName: e.full_name,
                        Department: e.department || '',
                        Position: e.position || '',
                        Email: e.email || '',
                        Phone: e.phone || '',
                        AvatarUrl: e.avatar_url || '',
                        Status: e.status,
                        JoinDate: e.join_date || '',
                        Username: e.username || '',
                        Role: e.role,
                        SystemRole: e.system_role,
                    })));
                }
                if (ctrRes.data) {
                    setQuickContractors(ctrRes.data.map((c: any) => ({
                        id: c.id,
                        contractor_id: c.contractor_id,
                        username: c.username,
                        display_name: c.display_name,
                        contractor_name: c.contractors?.full_name || c.contractor_id,
                        allowed_project_ids: c.allowed_project_ids || [],
                    })));
                }
                setQuickLoading(false);
            }).catch(err => {
                console.error('[QuickSwitcher] Load error:', err);
                setQuickLoading(false);
            });
        }
    }, [showQuickSwitcher]);

    const filteredQuickEmployees = useMemo(() => {
        return quickUsers.filter(emp => {
            const effRole = emp.SystemRole || resolveSystemRole(emp.Role, emp.Position, emp.Department);
            if (effRole === 'super_admin') return false;
            return (
                emp.FullName?.toLowerCase().includes(quickSearch.toLowerCase()) ||
                emp.Position?.toLowerCase().includes(quickSearch.toLowerCase()) ||
                emp.Department?.toLowerCase().includes(quickSearch.toLowerCase())
            );
        });
    }, [quickUsers, quickSearch]);

    const filteredQuickContractors = useMemo(() => {
        return quickContractors.filter(c =>
            c.display_name.toLowerCase().includes(quickSearch.toLowerCase()) ||
            c.contractor_name.toLowerCase().includes(quickSearch.toLowerCase())
        );
    }, [quickContractors, quickSearch]);

    const handleQuickSwitchEmployee = (emp: Employee) => {
        startImpersonation(emp);
        setShowQuickSwitcher(false);
        setQuickSearch('');
    };

    const handleQuickSwitchContractor = (ctr: any) => {
        const fakeEmployee: Employee = {
            EmployeeID: ctr.id,
            FullName: ctr.display_name,
            Role: 'contractor' as any,
            Department: ctr.contractor_name,
            Position: 'Nhà thầu',
            Email: ctr.email || '',
            Phone: '',
            AvatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(ctr.display_name)}&background=4a90e2&color=fff`,
            JoinDate: '',
            Status: 'Active' as any,
            Username: ctr.username,
            Password: '',
            AllowedProjectIDs: ctr.allowed_project_ids,
        };
        startImpersonation(fakeEmployee);
        setShowQuickSwitcher(false);
        setQuickSearch('');
    };

    // Layout background — sử dụng CSS variable (tự động theo theme)
    const layoutBg = 'bg-bg-app';


    // Persist sidebar collapse state
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved) setIsSidebarCollapsed(saved === 'true');
    }, []);

    const handleToggleCollapse = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    const isMobile = useIsMobile();

    // Show loading skeleton while checking auth session
    if (isLoading) return <PageLoadingSkeleton />;

    if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;

    return (
        <SlidePanelProvider>
        <div className={`flex h-screen overflow-hidden ${layoutBg}`}>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Main Flex layout */}
            <div className="flex-1 flex w-full h-full">

                {/* Sidebar - Desktop */}
                <aside className="hidden lg:block shrink-0 z-10 h-screen sticky top-0 transition-all duration-300 ease-out shadow-xl">
                    <Sidebar
                        isCollapsed={isSidebarCollapsed}
                        onToggleCollapse={handleToggleCollapse}
                    />
                </aside>

                {/* Sidebar - Mobile */}
                <aside className={`
                    fixed inset-y-0 left-0 w-64 z-50 lg:hidden
                    transform transition-transform duration-300 ease-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <Sidebar onClose={() => setIsSidebarOpen(false)} />
                </aside>

                {/* Main Content Area */}
                <div className={`flex-1 flex flex-col min-w-0 min-h-0 ${layoutBg}`}>

                    <div className="flex-1 flex flex-col min-w-0 min-h-0">
                        {/* Header */}
                        {isMobile ? (
                            <MobileHeader onOpenSearch={() => setIsSearchOpen(true)} />
                        ) : (
                            <Header
                                onOpenSearch={() => setIsSearchOpen(true)}
                                onMenuClick={() => setIsSidebarOpen(true)}
                            />
                        )}

                        {/* Page Content */}
                        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                            {/* Breadcrumb */}
                            <div className="px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6 pb-2">
                                <Breadcrumb />
                            </div>

                            {/* Content */}
                            <div className={`px-3 sm:px-4 lg:px-6 ${
                                isMobile 
                                    ? (isImpersonating ? 'pb-36' : 'pb-24') 
                                    : (isImpersonating ? 'pb-20' : 'pb-6 sm:pb-8')
                            }`}>
                                <ErrorBoundary>
                                    <Suspense fallback={<PageLoadingSkeleton />}>
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={location.pathname}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -15 }}
                                                transition={{ duration: 0.25, ease: "easeOut" }}
                                            >
                                                <Outlet />
                                            </motion.div>
                                        </AnimatePresence>
                                    </Suspense>
                                </ErrorBoundary>
                            </div>
                        </main>

                        {/* AI Chatbot - Adjust bottom position on mobile to avoid bottom nav overlay */}
                        <div className={isMobile ? 'pb-16' : ''}>
                            <AIChatbot />
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Impersonation Pill & Quick Switcher */}
            {isImpersonating && impersonatedUser && (
                <>
                    {/* Quick Switcher Panel */}
                    {showQuickSwitcher && (
                        <div 
                            className={`fixed ${isMobile ? 'bottom-36' : 'bottom-24'} left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-bg-elevated/90 dark:bg-slate-900/90 backdrop-blur-lg border border-border rounded-2xl shadow-2xl p-4 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200`}
                            style={{ maxHeight: '380px' }}
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
                                <h4 className="text-xs font-bold text-txt-primary uppercase tracking-wider flex items-center gap-1.5">
                                    <UserCheck size={14} className="text-primary-500" />
                                    Chuyển đổi người dùng nhanh
                                </h4>
                                <button 
                                    onClick={() => setShowQuickSwitcher(false)}
                                    className="p-1 hover:bg-bg-muted rounded-full transition-colors"
                                >
                                    <X size={14} className="text-txt-muted" />
                                </button>
                            </div>

                            <div className="relative mb-3">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên, vai trò, phòng..."
                                    value={quickSearch}
                                    onChange={e => setQuickSearch(e.target.value)}
                                    className="w-full pl-8 pr-8 py-1.5 bg-bg-subtle dark:bg-slate-950 border border-border rounded-lg text-xs text-txt-primary focus:outline-none"
                                    autoFocus
                                />
                                {quickSearch && (
                                    <button 
                                        onClick={() => setQuickSearch('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-bg-muted rounded-full"
                                    >
                                        <X size={10} className="text-txt-muted" />
                                    </button>
                                )}
                            </div>

                            <div className="overflow-y-auto space-y-1 pr-1" style={{ maxHeight: '240px' }}>
                                {quickLoading ? (
                                    <div className="text-center py-6 text-xs text-txt-muted animate-pulse">
                                        Đang tải danh sách...
                                    </div>
                                ) : (
                                    <>
                                        {/* Employees Section */}
                                        {filteredQuickEmployees.length > 0 && (
                                            <div className="space-y-0.5">
                                                <div className="text-[9px] font-bold text-txt-muted uppercase tracking-wider px-2 py-1 bg-bg-subtle/50 rounded">
                                                    Nhân sự Ban
                                                </div>
                                                {filteredQuickEmployees.map(emp => {
                                                    const role = (emp.SystemRole || resolveSystemRole(emp.Role, emp.Position, emp.Department)) as SystemRole;
                                                    const isCurrent = impersonatedUser.EmployeeID === emp.EmployeeID;
                                                    return (
                                                        <button
                                                            key={emp.EmployeeID}
                                                            onClick={() => !isCurrent && handleQuickSwitchEmployee(emp)}
                                                            disabled={isCurrent}
                                                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                                                                isCurrent
                                                                    ? 'bg-primary-50/50 dark:bg-primary-950/20 text-primary-600 cursor-not-allowed'
                                                                    : 'hover:bg-bg-muted/70 text-txt-secondary'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <Avatar name={emp.FullName} imageUrl={emp.AvatarUrl} size="sm" />
                                                                <div className="truncate">
                                                                    <p className="text-xs font-semibold text-txt-primary truncate">{emp.FullName}</p>
                                                                    <p className="text-[10px] text-txt-muted truncate mt-0.5">{emp.Position}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                                                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border ${ROLE_COLORS[role] || 'bg-bg-muted'}`}>
                                                                    {ROLE_LABELS[role] || role}
                                                                </span>
                                                                {isCurrent && <Check size={12} className="text-green-500 shrink-0" />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Contractors Section */}
                                        {filteredQuickContractors.length > 0 && (
                                            <div className="space-y-0.5 mt-2">
                                                <div className="text-[9px] font-bold text-txt-muted uppercase tracking-wider px-2 py-1 bg-bg-subtle/50 rounded">
                                                    Nhà thầu
                                                </div>
                                                {filteredQuickContractors.map(ctr => {
                                                    const isCurrent = impersonatedUser.EmployeeID === ctr.id;
                                                    return (
                                                        <button
                                                            key={ctr.id}
                                                            onClick={() => !isCurrent && handleQuickSwitchContractor(ctr)}
                                                            disabled={isCurrent}
                                                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                                                                isCurrent
                                                                    ? 'bg-primary-50/50 dark:bg-primary-950/20 text-primary-600 cursor-not-allowed'
                                                                    : 'hover:bg-bg-muted/70 text-txt-secondary'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <Avatar name={ctr.display_name} size="sm" />
                                                                <div className="truncate">
                                                                    <p className="text-xs font-semibold text-txt-primary truncate">{ctr.display_name}</p>
                                                                    <p className="text-[10px] text-txt-muted truncate mt-0.5">{ctr.contractor_name}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                                                <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-purple-200/50 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                                                    Nhà thầu
                                                                </span>
                                                                {isCurrent && <Check size={12} className="text-green-500 shrink-0" />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {filteredQuickEmployees.length === 0 && filteredQuickContractors.length === 0 && (
                                            <div className="text-center py-6 text-xs text-txt-muted">
                                                Không tìm thấy người dùng phù hợp
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Floating Impersonation Pill */}
                    <div 
                        className={`fixed ${
                            isMobile ? 'bottom-20' : 'bottom-6 sm:bottom-8'
                        } left-1/2 -translate-x-1/2 z-50 max-w-2xl w-[92%] bg-slate-900/85 dark:bg-slate-950/85 text-white shadow-2xl rounded-2xl border border-white/10 backdrop-blur-md overflow-hidden transition-all duration-300 ${
                            expiryWarning ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-900 animate-pulse-slow' : 'hover:border-white/20'
                        }`}
                    >
                        <div className="px-4 py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar 
                                    name={impersonatedUser.FullName} 
                                    imageUrl={impersonatedUser.AvatarUrl}
                                    size="sm" 
                                    ringColor={expiryWarning ? "ring-red-500 ring-2" : "ring-amber-500 ring-2"}
                                    className="shrink-0 scale-105"
                                />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-400">
                                            <UserCheck size={10} />
                                            Giả làm
                                        </span>
                                        {minutesRemaining !== null && (
                                            <span className={`text-[10px] font-bold ${
                                                expiryWarning ? 'text-red-400' : 'text-slate-300'
                                            }`}>
                                                ({minutesRemaining}m)
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-bold text-slate-100 truncate">
                                        {impersonatedUser.FullName}
                                        <span className="font-medium text-slate-400 text-[11px] ml-2 truncate">
                                            {impersonatedUser.Position} • {impersonatedUser.Department}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                {expiryWarning && (
                                    <button
                                        onClick={extendSession}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-warning-500 hover:bg-warning-600 active:scale-95 text-[11px] font-extrabold text-white rounded-lg transition-all"
                                    >
                                        <RefreshCw size={11} className="animate-spin-slow" />
                                        Gia hạn
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowQuickSwitcher(!showQuickSwitcher)}
                                    className={`flex items-center gap-1 px-3 py-1.5 ${
                                        showQuickSwitcher 
                                            ? 'bg-slate-700/80 text-white' 
                                            : 'bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white'
                                    } active:scale-95 text-[11px] font-bold rounded-lg transition-all`}
                                >
                                    Đổi vai
                                    <ChevronUp size={12} className={`transition-transform duration-200 ${showQuickSwitcher ? 'rotate-180' : ''}`} />
                                </button>
                                <button
                                    onClick={stopImpersonation}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-[11px] font-bold rounded-lg transition-colors shadow-inner"
                                >
                                    Thoát
                                </button>
                            </div>
                        </div>

                        {/* Progress Bar Timer */}
                        {minutesRemaining !== null && (
                            <div className="w-full h-[3px] bg-white/5 relative">
                                <div 
                                    className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ${
                                        expiryWarning ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-amber-400 to-amber-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, (minutesRemaining / 30) * 100))}%` }}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Mobile Bottom Navigation */}
            {isMobile && (
                <MobileBottomNav 
                    onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                    isSidebarOpen={isSidebarOpen} 
                />
            )}

            {/* Global Search Modal */}
            <GlobalSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />

            {/* ═══ Slide Panel System (Bitrix24-style) ═══ */}
            <SlidePanelContainer isSidebarCollapsed={isSidebarCollapsed} />
        </div>
        </SlidePanelProvider>
    );

};

export default MainLayout;
