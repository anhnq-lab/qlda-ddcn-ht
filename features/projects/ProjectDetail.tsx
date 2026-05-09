import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTabSearchParam } from '@/hooks/useTabSearchParam';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ProjectService } from '@/services/ProjectService';
import { ProjectMemberService } from '@/services/ProjectMemberService';
import { NationalGatewayService, SyncResult } from '@/services/NationalGatewayService';
import { Project, Employee, ProjectStage } from '@/types';
import { useUpdateTask } from '@/hooks/useTasks';
import { useProjectTasks } from '@/hooks/useWorkflowTasks';
import { useBiddingPackages } from '@/hooks/useBiddingPackages';

/** Props when rendering inside a SlidePanel */
export interface ProjectDetailProps {
    /** If provided, overrides useParams().id — used when rendering in a panel */
    projectId?: string;
    /** Called to close this panel */
    onClose?: () => void;
    /** Render in panel mode (no breadcrumb nav, adjusted height) */
    inPanel?: boolean;
}
import { supabase } from '@/lib/supabase';
import { ProjectHeader } from './components/ProjectHeader';
// Always-visible on initial load — static imports
import { ProjectInfoTab } from './components/tabs/ProjectInfoTab';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { TableSkeleton } from '@/components/ui';
import { Info, CalendarCheck, Briefcase, FolderOpen, Landmark, Database, Settings2, Sparkles, Shield, X, ArrowLeft, Pencil, MoreVertical, Trash2, GitBranch } from 'lucide-react';
import { AIReportModal } from './components/AIReportModal';
import { generateMonthlyReport } from '@/services/aiService';
import { useToast } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Lazy-loaded: only fetched when user navigates to that tab or opens the modal
const ProjectPlanTab = React.lazy(() => import('./components/tabs/ProjectPlanTab').then(m => ({ default: m.ProjectPlanTab })));
const ProjectPackagesTab = React.lazy(() => import('./components/tabs/ProjectPackagesTab').then(m => ({ default: m.ProjectPackagesTab })));
const ProjectCapitalTab = React.lazy(() => import('./components/tabs/ProjectCapitalTab').then(m => ({ default: m.ProjectCapitalTab })));
const ProjectDocumentsTab = React.lazy(() => import('./components/tabs/ProjectDocumentsTab').then(m => ({ default: m.ProjectDocumentsTab })));
const ProjectComplianceTab = React.lazy(() => import('./components/tabs/ProjectComplianceTab').then(m => ({ default: m.ProjectComplianceTab })));
const ProjectWorkflowTab = React.lazy(() => import('./components/tabs/ProjectWorkflowTab').then(m => ({ default: m.ProjectWorkflowTab })));
const ProjectOperationsTab = React.lazy(() => import('./components/tabs/ProjectOperationsTab').then(m => ({ default: m.ProjectOperationsTab })));
const ProjectInspectionTab = React.lazy(() => import('./components/tabs/ProjectInspectionTab').then(m => ({ default: m.ProjectInspectionTab })));
const AISummaryWidget = React.lazy(() => import('@/components/ai/AISummaryWidget').then(m => ({ default: m.AISummaryWidget })));
const AICompliancePanel = React.lazy(() => import('@/components/ai/AICompliancePanel').then(m => ({ default: m.AICompliancePanel })));
const AIForecastChart = React.lazy(() => import('@/components/ai/AIForecastChart').then(m => ({ default: m.AIForecastChart })));
const AIDocumentDrafter = React.lazy(() => import('@/components/ai/AIDocumentDrafter').then(m => ({ default: m.AIDocumentDrafter })));

// Tab definitions — extracted for reuse
const TAB_DEFINITIONS = [
    { id: 'info', label: 'TỔNG QUAN', icon: Info },
    { id: 'plan', label: 'KẾ HOẠCH', icon: CalendarCheck },
    { id: 'packages', label: 'GÓI THẦU', icon: Briefcase },
    { id: 'capital', label: 'VỐN & GIẢI NGÂN', icon: Landmark },
    { id: 'documents', label: 'HỒ SƠ', icon: FolderOpen },
    { id: 'inspection', label: 'THANH TRA', icon: Shield },
    { id: 'operations', label: 'VẬN HÀNH', icon: Settings2 },
    { id: 'workflow', label: 'QUY TRÌNH', icon: GitBranch },
    { id: 'tt24', label: 'ĐỒNG BỘ CSDL', icon: Database },
] as const;

type TabId = typeof TAB_DEFINITIONS[number]['id'];
const TAB_IDS = TAB_DEFINITIONS.map(t => t.id) as unknown as readonly TabId[];

// ─────── Skeleton Loading ───────
const ProjectDetailSkeleton: React.FC = () => (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-[#F8FAFC] dark:bg-slate-900 animate-pulse">
        <div className="shrink-0 px-4 pt-4 space-y-4">
            {/* Header skeleton */}
            <div className="bg-bg-surface rounded-2xl p-4 border border-gray-200 dark:border-slate-700">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-xl" />
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded-lg w-2/3" />
                            <div className="h-6 bg-primary-100 dark:bg-primary-900/20 rounded-md w-28" />
                        </div>
                        <div className="flex gap-4">
                            <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded w-24" />
                            <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded w-32" />
                            <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded w-20" />
                            <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded w-16" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-9 w-24 bg-blue-100 dark:bg-blue-900/20 rounded-xl" />
                        <div className="h-9 w-9 bg-gray-100 dark:bg-slate-700 rounded-xl" />
                    </div>
                </div>
            </div>
            {/* Tab skeleton */}
            <div className="flex gap-8 border-b border-gray-200 dark:border-slate-700 pb-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="h-4 bg-gray-100 dark:bg-slate-700 rounded w-20" />
                ))}
            </div>
        </div>
        {/* Content skeleton */}
        <div className="flex-1 p-4 mt-2">
            <div className="bg-bg-surface rounded-xl border border-gray-200 dark:border-slate-700 h-[calc(100vh-220px)] overflow-hidden p-4">
                <TableSkeleton columns={5} rows={10} />
            </div>
        </div>
    </div>
);



// ─────── Main Component ───────
const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId: propProjectId, onClose, inPanel = false }) => {
    const { id: paramId } = useParams<{ id: string }>();
    const id = propProjectId || paramId;
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Project fetch — React Query for caching (re-visits skip DB round-trip)
    const { data: project = null, isLoading: loading, refetch: refetchProject } = useQuery({
        queryKey: ['project-detail', id],
        queryFn: () => ProjectService.getById(id!),
        enabled: !!id,
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
    const { addToast } = useToast();

    // Tab state synced with URL ?tab= (persists on reload)
    const [activeTab, setActiveTab] = useTabSearchParam<TabId>('info', TAB_IDS);

    // Support cross-page navigation via location.state (e.g., TaskDetail → plan tab)
    const openPackageId = (location.state as any)?.openPackageId || null;
    const initialDetailTab = (location.state as any)?.initialDetailTab || undefined;
    useEffect(() => {
        const stateTab = (location.state as any)?.activeTab as TabId | undefined;
        if (stateTab && TAB_IDS.includes(stateTab) && stateTab !== activeTab) {
            setActiveTab(stateTab);
            // Clear location.state to avoid re-triggering on back/forward
            window.history.replaceState({}, '');
        }
    }, [location.state]);

    // Module 1: National Gateway State
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    // AI Report Modal state
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportContent, setReportContent] = useState('');
    const [showAISummary, setShowAISummary] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState<string | undefined>();

    // Delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Edit modal
    const [showEditModal, setShowEditModal] = useState(false);

    // AI Document Drafter modal
    const [showDrafter, setShowDrafter] = useState(false);

    // Lazy-mount flags: once mounted, stay mounted to preserve state
    const [opsMounted, setOpsMounted] = useState(activeTab === 'operations');
    const [planMounted, setPlanMounted] = useState(activeTab === 'plan');
    const [packagesMounted, setPackagesMounted] = useState(activeTab === 'packages');
    const [capitalMounted, setCapitalMounted] = useState(activeTab === 'capital');
    const [workflowMounted, setWorkflowMounted] = useState(activeTab === 'workflow');

    // Mount heavy tabs on first visit
    useEffect(() => {
        if (activeTab === 'operations' && !opsMounted) setOpsMounted(true);
        if (activeTab === 'plan' && !planMounted) setPlanMounted(true);
        if (activeTab === 'packages' && !packagesMounted) setPackagesMounted(true);
        if (activeTab === 'capital' && !capitalMounted) setCapitalMounted(true);
        if (activeTab === 'workflow' && !workflowMounted) setWorkflowMounted(true);
    }, [activeTab, opsMounted, planMounted, packagesMounted, capitalMounted, workflowMounted]);

    // Keyboard: Arrow Left/Right to switch tabs
    const activeTabRef = React.useRef(activeTab);
    activeTabRef.current = activeTab;
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const currentIdx = TAB_DEFINITIONS.findIndex(t => t.id === activeTabRef.current);
                if (currentIdx === -1) return;
                const nextIdx = e.key === 'ArrowRight'
                    ? Math.min(currentIdx + 1, TAB_DEFINITIONS.length - 1)
                    : Math.max(currentIdx - 1, 0);
                setActiveTab(TAB_DEFINITIONS[nextIdx].id);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Refetch project when switching to info tab (picks up DB-trigger stage/progress changes)
    useEffect(() => {
        if (activeTab === 'info' && id && !loading) {
            refetchProject();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, id]);

    // Derived Data — use `id` from URL directly so these fire in parallel with the project fetch,
    // not after it (project?.ProjectID === id — same value, no need to wait for DB round trip)
    const { data: workflowTasks = [] } = useProjectTasks(id);
    const { mutate: saveTask } = useUpdateTask();

    // Get bidding packages for this project
    const { data: packages = [] } = useBiddingPackages(id || '');

    // Get project members — also starts in parallel with project fetch
    const [projectMembers, setProjectMembers] = useState<Employee[]>([]);
    useEffect(() => {
        if (!id) return;
        const loadMembers = async () => {
            try {
                const members = await ProjectMemberService.getMembersWithDetails(id);
                setProjectMembers(members);
            } catch (error) {
                console.error('Failed to load project members:', error);
                setProjectMembers([]);
            }
        };
        loadMembers();
    }, [id]);

    // ─── Handlers ───
    const handleSync = useCallback(async () => {
        if (!project) return;
        setIsSyncing(true);
        try {
            const result = await NationalGatewayService.syncProject(project);
            setSyncResult(result);
            if (result.success) addToast({ title: 'Đồng bộ thành công', message: result.message, type: 'success' });
            else addToast({ title: 'Đồng bộ thất bại', message: result.message, type: 'error' });
        } catch (error) {
            console.error(error);
            addToast({ title: 'Lỗi đồng bộ', message: 'Có lỗi xảy ra khi đồng bộ dữ liệu.', type: 'error' });
        } finally {
            setIsSyncing(false);
        }
    }, [project]);

    const handleGenerateReport = useCallback(async (type: 'Monitoring' | 'Settlement') => {
        if (!project) return;

        if (type === 'Monitoring') {
            // AI-powered monthly report
            setReportModalOpen(true);
            setReportLoading(true);
            setReportContent('');
            setReportError(undefined);
            setIsGeneratingReport(true);
            try {
                const projectData = {
                    ProjectID: project.ProjectID,
                    ProjectName: project.ProjectName,
                    ProjectNumber: project.ProjectNumber,
                    GroupCode: project.GroupCode,
                    Stage: project.Stage,
                    InvestorName: project.InvestorName,
                    LocationCode: project.LocationCode,
                    TotalInvestment: project.TotalInvestment,
                    PhysicalProgress: project.PhysicalProgress,
                    FinancialProgress: project.FinancialProgress,
                    DisbursedAmount: (project as any).DisbursedAmount,
                    PlannedDisbursement: (project as any).PlannedDisbursement,
                    ContractEndDate: (project as any).ContractEndDate,
                    Duration: project.Duration,
                    CapitalSource: project.CapitalSource,
                    ManagementForm: project.ManagementForm,
                };
                const content = await generateMonthlyReport(projectData);
                setReportContent(content);
            } catch (error) {
                console.error('Error generating AI report:', error);
                setReportError(error instanceof Error ? error.message : 'Lỗi không xác định khi tạo báo cáo AI');
            } finally {
                setReportLoading(false);
                setIsGeneratingReport(false);
            }
        } else {
            // Settlement report — keep legacy mock for now
            setIsGeneratingReport(true);
            try {
                const report = await NationalGatewayService.generateSettlementReport(project.ProjectID);
                addToast({ title: 'Thành công', message: `Đã trích xuất báo cáo quyết toán: ${report.id}`, type: 'success' });
            } catch (error) {
                console.error(error);
            } finally {
                setIsGeneratingReport(false);
            }
        }
    }, [project]);

    const handleDeleteProject = useCallback(async () => {
        if (!project) return;
        setIsDeleting(true);
        try {
            await ProjectService.delete(project.ProjectID);
            await queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.removeQueries({ queryKey: ['project-capital', project.ProjectID] });
            queryClient.removeQueries({ queryKey: ['capital-plans', project.ProjectID] });
            queryClient.removeQueries({ queryKey: ['disbursements', project.ProjectID] });
            navigate('/projects');
        } catch (err) {
            console.error('Delete project failed:', err);
            addToast({ title: 'Xóa thất bại', message: 'Xoá dự án thất bại. Vui lòng thử lại.', type: 'error' });
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    }, [project, queryClient, navigate]);

    const handleEditSave = useCallback(async (data: Partial<Project>) => {
        if (!project) return;
        try {
            await ProjectService.update(project.ProjectID, data);
            await queryClient.invalidateQueries({ queryKey: ['project-detail', id] });
            await queryClient.invalidateQueries({ queryKey: ['projects'] });
        } catch (err) {
            console.error('Update project failed:', err);
            throw err;
        }
    }, [project, queryClient, id]);

    // ─── Render ───
    if (loading) return <ProjectDetailSkeleton />;
    if (!project) return <div className="flex h-screen items-center justify-center font-bold text-gray-500 dark:text-slate-400">Dự án không tồn tại.</div>;

    return (
        <div className={`flex flex-col relative ${inPanel ? 'h-screen bg-bg-surface' : 'h-[calc(100vh-120px)] bg-transparent'} dark:bg-slate-900 border-l-0`}>
            {/* Fixed Header + Tabs — does NOT scroll */}
            <div className={`shrink-0 px-4 ${activeTab === 'operations' ? 'pt-1' : inPanel ? 'pt-1' : 'pt-2'}`}>
                {/* 1. Minimal Header — just title + actions */}
                <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                        {!inPanel && (
                            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0">
                                <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                            </button>
                        )}
                        <h1 className="text-base font-black text-gray-900 dark:text-white truncate">{project.ProjectName}</h1>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                            Number(project.Status) === 3 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                            Number(project.Status) === 2 ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' :
                            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                        }`}>
                            {Number(project.Status) === 3 ? 'Kết thúc XD' : Number(project.Status) === 2 ? 'Đang triển khai' : 'Chuẩn bị dự án'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            id="btn-ai-summary"
                            onClick={() => setShowAISummary(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/15 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-[11px] font-bold text-blue-600 dark:text-blue-400"
                        >
                            <Sparkles className="w-3 h-3" />
                            Tóm tắt AI
                        </button>
                        <button
                            id="btn-edit-project"
                            onClick={() => setShowEditModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 gradient-btn text-white rounded-lg text-[11px] font-bold shadow-sm transition-all hover:-translate-y-0.5"
                        >
                            <Pencil className="w-3 h-3" />
                            Chỉnh sửa
                        </button>
                        <div className="relative group">
                            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-bg-surface rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 py-1 min-w-[140px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Xoá dự án
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Tab Navigation */}
                <div className={`border-b border-gray-200 dark:border-slate-700 flex gap-0.5 overflow-x-auto scrollbar-hide scroll-smooth`}>
                    {TAB_DEFINITIONS.map(t => {
                        const isActive = activeTab === t.id;
                        // Badge counts
                        const badgeCount = t.id === 'packages' ? packages.length :
                                           t.id === 'plan' ? workflowTasks.length : 0;
                        return (
                            <button
                                id={`tab-${t.id}`}
                                key={t.id} onClick={() => setActiveTab(t.id)}
                                className={`${activeTab === 'operations' || inPanel ? 'py-2' : 'py-3'} px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 tracking-wider whitespace-nowrap ${isActive ? 'border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-500'}`}
                                title={`${t.label} (← → chuyển tab)`}
                            >
                                <t.icon className="w-3.5 h-3.5" />
                                {t.label}
                                {badgeCount > 0 && (
                                    <span className={`ml-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-black ${isActive ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                        {badgeCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Tab Content — Heavy tabs stay mounted after first visit */}
            {/* Light tabs: info, documents, tt24, inspection — mount/unmount normally */}
            {activeTab === 'info' && (
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
                    <div className="space-y-3">
                        <ProjectInfoTab
                            project={project}
                            projectMembers={projectMembers}
                            projectPackages={packages}
                            isSyncing={isSyncing}
                            syncResult={syncResult}
                            isGeneratingReport={isGeneratingReport}
                            onGenerateReport={handleGenerateReport}
                            onViewMember={(employeeId) => {
                                console.log('View member:', employeeId);
                            }}
                            onViewPackage={(packageId) => {
                                setActiveTab('packages');
                            }}
                            onStageChange={async (newStage, entry) => {
                                const stageToStatus: Record<string, number> = {
                                    'Preparation': 1,
                                    'Execution': 2,
                                    'Completion': 3,
                                };
                                const newStatus = stageToStatus[newStage] || 1;
                                queryClient.setQueryData(['project-detail', id], (prev: Project | undefined) => prev ? {
                                    ...prev,
                                    Stage: newStage,
                                    Status: newStatus as any,
                                    StageHistory: [...((prev as any).StageHistory || []), entry]
                                } : prev);
                                try {
                                    await ProjectService.update(project.ProjectID, {
                                        Stage: newStage,
                                        Status: newStatus as any,
                                    } as any);
                                } catch (err) {
                                    console.error('Failed to persist stage change:', err);
                                }
                            }}
                            onHistoryUpdate={(history) => {
                                queryClient.setQueryData(['project-detail', id], (prev: Project | undefined) => prev ? { ...prev, StageHistory: history } : prev);
                            }}
                            canEditLifecycle={true}
                            onEditProject={() => setShowEditModal(true)}
                            onTabChange={(tab) => setActiveTab(tab)}
                        />
                    </div>
                </div>
            )}
            {activeTab === 'documents' && (
                <ErrorBoundary>
                <React.Suspense fallback={<div className="flex-1 p-4"><TableSkeleton columns={4} rows={8} /></div>}>
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
                    <div className="space-y-3">
                        <AICompliancePanel projectId={project.ProjectID} />
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowDrafter(true)}
                                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
                            >
                                <Sparkles className="w-4 h-4" /> Soạn văn bản AI
                            </button>
                        </div>
                        <ProjectDocumentsTab
                            projectID={project.ProjectID}
                            projectStage={project.Stage || ProjectStage.Execution}
                            investmentPolicy={(project as any).InvestmentPolicy}
                            feasibilityStudy={(project as any).FeasibilityStudy}
                        />
                    </div>
                </div>
                </React.Suspense>
                </ErrorBoundary>
            )}
            {activeTab === 'tt24' && (
                <ErrorBoundary>
                <React.Suspense fallback={<div className="flex-1 p-4"><TableSkeleton columns={4} rows={8} /></div>}>
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
                    <div className="space-y-3">
                        <ProjectComplianceTab
                            project={project}
                            onUpdate={(updated) => {
                                queryClient.setQueryData(['project-detail', id], (prev: Project | undefined) => prev ? { ...prev, ...updated } : prev);
                            }}
                        />
                    </div>
                </div>
                </React.Suspense>
                </ErrorBoundary>
            )}
            {activeTab === 'inspection' && (
                <ErrorBoundary>
                <React.Suspense fallback={<div className="flex-1 p-4"><TableSkeleton columns={4} rows={8} /></div>}>
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
                    <ProjectInspectionTab projectID={project.ProjectID} />
                </div>
                </React.Suspense>
                </ErrorBoundary>
            )}

            {/* Heavy tabs: plan, packages, capital — lazy mounted + lazy imported, stay alive via CSS visibility */}
            {planMounted && (
                <div
                    className={`flex-1 min-h-0 overflow-y-auto px-4 py-3 ${activeTab === 'plan' ? '' : 'absolute inset-0 pointer-events-none'}`}
                    style={activeTab === 'plan' ? undefined : { visibility: 'hidden', zIndex: -1 }}
                >
                    <ErrorBoundary>
                    <React.Suspense fallback={<TableSkeleton columns={5} rows={10} />}>
                    <ProjectPlanTab
                        workflowTasks={workflowTasks}
                        projectID={project.ProjectID}
                        onSaveTask={(t) => saveTask(t)}
                        groupCode={project.GroupCode}
                        isODA={project.IsODA}
                        project={project}
                    />
                    </React.Suspense>
                    </ErrorBoundary>
                </div>
            )}
            {packagesMounted && (
                <div
                    className={`flex-1 min-h-0 overflow-y-auto px-4 py-3 ${activeTab === 'packages' ? '' : 'absolute inset-0 pointer-events-none'}`}
                    style={activeTab === 'packages' ? undefined : { visibility: 'hidden', zIndex: -1 }}
                >
                    <ErrorBoundary>
                    <React.Suspense fallback={<TableSkeleton columns={5} rows={10} />}>
                    <ProjectPackagesTab
                        projectID={project.ProjectID}
                        project={project}
                        openPackageId={openPackageId}
                        initialDetailTab={initialDetailTab}
                    />
                    </React.Suspense>
                    </ErrorBoundary>
                </div>
            )}
            {capitalMounted && (
                <div
                    className={`flex-1 min-h-0 overflow-y-auto px-4 py-3 ${activeTab === 'capital' ? '' : 'absolute inset-0 pointer-events-none'}`}
                    style={activeTab === 'capital' ? undefined : { visibility: 'hidden', zIndex: -1 }}
                >
                    <ErrorBoundary>
                    <React.Suspense fallback={<TableSkeleton columns={4} rows={8} />}>
                    <div className="space-y-3">
                        <AIForecastChart
                            projectId={project.ProjectID}
                            currentDisbursementRate={project.PaymentProgress || project.FinancialProgress || 0}
                        />
                        <ProjectCapitalTab projectID={project.ProjectID} />
                    </div>
                    </React.Suspense>
                    </ErrorBoundary>
                </div>
            )}
            {workflowMounted && (
                <div
                    className={`flex-1 min-h-0 overflow-y-auto px-4 py-3 ${activeTab === 'workflow' ? '' : 'absolute inset-0 pointer-events-none'}`}
                    style={activeTab === 'workflow' ? undefined : { visibility: 'hidden', zIndex: -1 }}
                >
                    <ErrorBoundary>
                    <React.Suspense fallback={<TableSkeleton columns={4} rows={8} />}>
                    <ProjectWorkflowTab projectID={project.ProjectID} project={project} />
                    </React.Suspense>
                    </ErrorBoundary>
                </div>
            )}
            {opsMounted && (
                <div
                    className={`flex-1 min-h-0 ${activeTab === 'operations' ? '' : 'absolute inset-0 pointer-events-none'}`}
                    style={activeTab === 'operations' ? undefined : { visibility: 'hidden', zIndex: -1 }}
                >
                    <ErrorBoundary>
                    <React.Suspense fallback={<TableSkeleton columns={4} rows={8} />}>
                    <ProjectOperationsTab projectID={project.ProjectID} />
                    </React.Suspense>
                    </ErrorBoundary>
                </div>
            )}

            {/* ─── Delete Confirmation Modal ─── */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteProject}
                title="Xoá dự án"
                message={`Bạn có chắc muốn xoá dự án "${project.ProjectName}"?\n\nHành động này không thể hoàn tác. Tất cả dữ liệu liên quan (công việc, tài liệu, gói thầu, hợp đồng, vốn, giải ngân...) sẽ bị xoá.`}
                confirmText="Xoá dự án"
                cancelText="Hủy"
                variant="danger"
                isLoading={isDeleting}
            />

            {/* ─── Edit Project Modal (reuse CreateProjectModal in edit mode) ─── */}
            <CreateProjectModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={async (data, members) => {
                    try {
                        await handleEditSave(data as Partial<Project>);
                        // Save members: delete old, insert new
                        if (project) {
                            try {
                                await ProjectMemberService.replaceMembers(project.ProjectID, members);
                                // Reload members to update the overview tab
                                const updatedMembers = await ProjectMemberService.getMembersWithDetails(project.ProjectID);
                                setProjectMembers(updatedMembers);
                            } catch (error) {
                                console.error('Failed to save members:', error);
                            }
                        }
                        setShowEditModal(false);
                    } catch (error) {
                        const errObj = error as any;
                        addToast({ title: 'Lỗi cập nhật', message: errObj?.message || 'Vui lòng thử lại.', type: 'error' });
                        console.error('Edit error:', error);
                    }
                }}
                editProject={project}
            />

            {/* ─── AI Document Drafter Modal ─── */}
            {showDrafter && (
                <React.Suspense fallback={null}>
                    <AIDocumentDrafter
                        projectId={project.ProjectID}
                        projectName={project.ProjectName}
                        isOpen={showDrafter}
                        onClose={() => setShowDrafter(false)}
                    />
                </React.Suspense>
            )}

            {/* ─── AI Monthly Report Modal ─── */}
            <AIReportModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                reportContent={reportContent}
                isLoading={reportLoading}
                error={reportError}
                projectName={project.ProjectName}
                onRegenerate={() => handleGenerateReport('Monitoring')}
            />

            {/* ─── AI Summary Popup Dialog ─── */}
            {showAISummary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowAISummary(false)}>
                    <div className="bg-bg-surface rounded-2xl shadow-sm w-full max-w-lg border border-gray-200 dark:border-slate-700 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-bold text-gray-800 dark:text-slate-100">Tóm tắt AI</span>
                            </div>
                            <button onClick={() => setShowAISummary(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto">
                            <React.Suspense fallback={<div className="py-6 text-center text-sm text-slate-400">Đang tải...</div>}>
                                <AISummaryWidget projectId={project.ProjectID} />
                            </React.Suspense>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetail;
