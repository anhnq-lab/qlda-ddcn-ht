import React, { useState, useEffect, Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import { Header } from '../components/common/Header';
import { AIChatbot } from '../components/common/AIChatbot';
import { GlobalSearch } from '../components/common/GlobalSearch';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { SlidePanelContainer } from '../components/ui/SlidePanel';
import { SlidePanelProvider } from '../context/SlidePanelContext';
import { useAuth } from '../context/AuthContext';
import { useImpersonation } from '../context/ImpersonationContext';
import { useTheme } from '../context/ThemeContext';
import { UserCheck, X } from 'lucide-react';


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
    const { impersonatedUser, isImpersonating, stopImpersonation } = useImpersonation();
    const location = useLocation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { theme } = useTheme();

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
                        <Header
                            onOpenSearch={() => setIsSearchOpen(true)}
                            onMenuClick={() => setIsSidebarOpen(true)}
                        />

                        {/* Page Content */}
                        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                            {/* Breadcrumb */}
                            <div className="px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6 pb-2">
                                <Breadcrumb />
                            </div>

                            {/* Content */}
                            <div className={`px-3 sm:px-4 lg:px-6 ${isImpersonating ? 'pb-20' : 'pb-6 sm:pb-8'}`}>
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

                        {/* AI Chatbot */}
                        <AIChatbot />
                    </div>
                </div>
            </div>

            {/* Floating Impersonation Bar */}
            {isImpersonating && impersonatedUser && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary-500 to-warning-500 text-white shadow-2xl">
                    <div className="max-w-screen-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                                {impersonatedUser.FullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <UserCheck size={14} />
                                    <span className="text-xs font-bold uppercase tracking-wide">Đang giả làm</span>
                                </div>
                                <p className="text-sm font-bold">
                                    {impersonatedUser.FullName}
                                    <span className="font-normal opacity-80 ml-2">
                                        {impersonatedUser.Position} • {impersonatedUser.Department}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={stopImpersonation}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition-colors"
                        >
                            <X size={16} />
                            Dừng giả làm
                        </button>
                    </div>
                </div>
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
