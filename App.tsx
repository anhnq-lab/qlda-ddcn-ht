
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ImpersonationProvider } from './context/ImpersonationContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import PageLoadingFallback from './components/ui/PageLoadingFallback';
import MainLayout from './layouts/MainLayout';

// Auth Features (eager load - needed immediately)
import Login from './features/auth/Login';

// Lazy-loaded Feature Modules (code splitting)
const Dashboard = React.lazy(() => import('./features/dashboard/Dashboard'));
const PersonalDashboard = React.lazy(() => import('./features/dashboard/PersonalDashboard'));

// Contractor-aware home: redirect contractors to CDE
const ContractorAwareHome: React.FC = () => {
    const { userType } = useAuth();
    if (userType === 'contractor') return <Navigate to="/cde" replace />;
    return <React.Suspense fallback={<PageLoadingFallback />}><Dashboard /></React.Suspense>;
};
const ProjectList = React.lazy(() => import('./features/projects/ProjectList'));
const ProjectDetail = React.lazy(() => import('./features/projects/ProjectDetail'));

const PackageDetail = React.lazy(() => import('./features/projects/PackageDetail'));
const ContractDetail = React.lazy(() => import('./features/contracts/ContractDetail'));
const BiddingContractPage = React.lazy(() => import('./features/bidding/BiddingContractPage'));
const ContractorList = React.lazy(() => import('./features/contractors/ContractorList'));
const ContractorDetail = React.lazy(() => import('./features/contractors/ContractorDetail'));
const EmployeeList = React.lazy(() => import('./features/employees/EmployeeList'));
const EmployeeDetail = React.lazy(() => import('./features/employees/EmployeeDetail'));
const TaskList = React.lazy(() => import('./features/tasks/TaskList'));
const TaskDetail = React.lazy(() => import('./features/tasks/TaskDetail'));
// PaymentList now loaded inside BiddingContractPage
// DocumentManager removed — integrated into CDE as 'Kho lưu trữ' tab
const CDEPage = React.lazy(() => import('./features/cde/CDEPage'));
const BimPage = React.lazy(() => import('./features/bim/BimPage'));
const ReportCenter = React.lazy(() => import('./features/reports/ReportCenter'));
const MidTermCapitalPage = React.lazy(() => import('./features/capital/MidTermCapitalPage'));
const Regulations = React.lazy(() => import('./features/regulations/Regulations'));
const EvaluationPage = React.lazy(() => import('./features/evaluation/EvaluationPage'));
const LegalDocumentSearch = React.lazy(() => import('./features/legal-documents/LegalDocumentSearch'));
const Settings = React.lazy(() => import('./features/settings/Settings'));
const AuditLogViewer = React.lazy(() => import('./features/admin/AuditLogViewer'));
const AdminUserManagement = React.lazy(() => import('./features/admin/AdminUserManagement'));

const WorkflowManagerPage = React.lazy(() => import('./features/workflows/WorkflowManagerPage'));
const WorkPlanPage = React.lazy(() => import('./features/work-plan/WorkPlanPage'));
import ProtectedRoute from './components/ProtectedRoute';


import { ToastProvider } from './components/ui/Toast';

import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { reportError } from './lib/errorReporting';

const mutationCache = new MutationCache({
    onError: (error, _variables, _context, mutation) => {
        // Report to centralized error tracking
        reportError(error instanceof Error ? error : new Error(String(error)), {
            source: 'mutation',
            mutationKey: mutation.options.mutationKey?.join('.') || 'unknown',
        });
    },
});

const queryClient = new QueryClient({
    mutationCache,
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff up to 10s
            gcTime: 1000 * 60 * 15, // 15 minutes cache retention
            refetchOnWindowFocus: false, // Prevent re-fetching when switching tabs
        },
    },
});

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <AuthProvider>
                        <ImpersonationProvider>
                        <ToastProvider>
                            <Router>
                                <Routes>
                                    <Route path="/login" element={<Login />} />

                                    {/* Protected Routes inside MainLayout */}
                                    <Route path="/" element={<MainLayout />}>
                                        <Route index element={<ContractorAwareHome />} />
                                        <Route path="my-dashboard" element={<React.Suspense fallback={<PageLoadingFallback />}><PersonalDashboard /></React.Suspense>} />

                                        {/* Projects Routes */}
                                        <Route path="projects" element={
                                            <ProtectedRoute resource="projects">
                                                <React.Suspense fallback={<PageLoadingFallback />}><ProjectList /></React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="projects/:id" element={
                                            <ProtectedRoute resource="projects">
                                                <React.Suspense fallback={<PageLoadingFallback />}><ProjectDetail /></React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="projects/:projectId/packages/:packageId" element={
                                            <ProtectedRoute resource="bidding">
                                                <React.Suspense fallback={<PageLoadingFallback />}><PackageDetail /></React.Suspense>
                                            </ProtectedRoute>
                                        } />

                                        {/* Unified Work-Plan page (Tasks + KH khung + KH tháng as tabs) */}
                                        <Route path="work-plan" element={
                                            <ProtectedRoute resource="tasks">
                                                <React.Suspense fallback={<PageLoadingFallback />}><WorkPlanPage /></React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        {/* Backward-compatible redirects */}
                                        <Route path="tasks" element={<Navigate to="/work-plan?tab=tasks" replace />} />
                                        <Route path="annual-plan" element={<Navigate to="/work-plan?tab=annual" replace />} />
                                        <Route path="monthly-plan" element={<Navigate to="/work-plan?tab=monthly" replace />} />
                                        <Route path="tasks/:id" element={
                                            <ProtectedRoute resource="tasks">
                                                <React.Suspense fallback={<PageLoadingFallback />}><TaskDetail /></React.Suspense>
                                            </ProtectedRoute>
                                        } />

                                        {/* HR Routes */}
                                        <Route path="employees" element={
                                            <ProtectedRoute resource="employees">
                                                <React.Suspense fallback={<PageLoadingFallback />}><EmployeeList /></React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="employees/:id" element={
                                            <ProtectedRoute resource="employees">
                                                <React.Suspense fallback={<PageLoadingFallback />}><EmployeeDetail /></React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="org-chart" element={<Navigate to="/employees" replace />} />

                                        {/* Contractor Routes */}
                                        <Route path="contractors" element={
                                            <ProtectedRoute resource="contractors">
                                                <React.Suspense fallback={<PageLoadingFallback />}><ContractorList /></React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="contractors/:id" element={
                                            <ProtectedRoute resource="contractors">
                                                <React.Suspense fallback={<PageLoadingFallback />}><ContractorDetail /></React.Suspense>
                                            </ProtectedRoute>
                                        } />

                                        {/* Bidding & Contract Module (merged) */}
                                        <Route path="bidding" element={
                                            <ProtectedRoute resource="bidding">
                                                <React.Suspense fallback={<PageLoadingFallback />}><BiddingContractPage /></React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="contracts/:id" element={
                                            <ProtectedRoute resource="contracts">
                                                <React.Suspense fallback={<PageLoadingFallback />}><ContractDetail /></React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        {/* Backward-compatible redirects */}
                                        <Route path="contracts" element={<Navigate to="/bidding?tab=contracts" replace />} />
                                        <Route path="payments" element={<Navigate to="/bidding?tab=payments" replace />} />
                                        <Route path="capital-planning" element={
                                            <ProtectedRoute resource="capital">
                                                <React.Suspense fallback={<PageLoadingFallback />}><MidTermCapitalPage /></React.Suspense>
                                            </ProtectedRoute>
                                        } />

                                        {/* Documents & Reports */}
                                        <Route path="documents" element={<Navigate to="/cde" replace />} />
                                        <Route path="cde" element={
                                            <ProtectedRoute resource="cde">
                                                <React.Suspense fallback={<PageLoadingFallback />}><CDEPage /></React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="bim" element={
                                            <ProtectedRoute resource="bim">
                                                <React.Suspense fallback={<PageLoadingFallback />}><BimPage /></React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="bim/:projectId" element={
                                            <ProtectedRoute resource="bim">
                                                <React.Suspense fallback={<PageLoadingFallback />}><BimPage /></React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="legal-documents" element={
                                            <ProtectedRoute resource="legal_docs">
                                                <React.Suspense fallback={<PageLoadingFallback />}><LegalDocumentSearch /></React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="reports" element={
                                            <ProtectedRoute resource="reports">
                                                <React.Suspense fallback={<PageLoadingFallback />}><ReportCenter /></React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="regulations" element={
                                            <ProtectedRoute resource="regulations">
                                                <React.Suspense fallback={<PageLoadingFallback />}><Regulations /></React.Suspense>
                                            </ProtectedRoute>
                                        } />

                                        {/* Evaluation Module */}
                                        <Route path="evaluation" element={
                                            <React.Suspense fallback={<PageLoadingFallback />}><EvaluationPage /></React.Suspense>
                                        } />

                                        {/* Admin */}
                                        <Route path="audit-log" element={
                                            <ProtectedRoute resource="admin_audit">
                                                <React.Suspense fallback={<PageLoadingFallback />}><AuditLogViewer /></React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="admin" element={
                                            <ProtectedRoute resource="admin_accounts">
                                                <React.Suspense fallback={<PageLoadingFallback />}>
                                                    <AdminUserManagement />
                                                </React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        {/* Workflow Manager */}
                                        <Route path="quy-trinh" element={
                                            <ProtectedRoute resource="workflows">
                                                <React.Suspense fallback={<PageLoadingFallback />}><WorkflowManagerPage /></React.Suspense>
                                            </ProtectedRoute>
                                        } />
                                        <Route path="workflows" element={<Navigate to="/quy-trinh" replace />} />
                                        {/* Backward-compatible redirects */}
                                        <Route path="user-accounts" element={<Navigate to="/admin?tab=accounts" replace />} />
                                        <Route path="permissions" element={<Navigate to="/admin?tab=permissions" replace />} />

                                        {/* Settings */}
                                        <Route path="settings" element={<React.Suspense fallback={<PageLoadingFallback />}><Settings /></React.Suspense>} />

                                        {/* Fallback */}
                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Route>
                                </Routes>
                            </Router>
                        </ToastProvider>
                        </ImpersonationProvider>
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
};

export default App;
