// ═══════════════════════════════════════════════════════════════
// BIM Page — Standalone BIM Module (BIM-centric view)
// Grid view of projects with BIM metadata → Click to open BIM Viewer
// URL-based routing: /bim (grid) → /bim/:projectId (viewer)
// ═══════════════════════════════════════════════════════════════

import React, { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScopedProjects } from '../../hooks/useScopedProjects';
import {
    ArrowLeft, Search, Layers, Box, Loader2, HardDrive, CheckCircle2,
    AlertCircle, Clock, Building2, FileBox, Cpu, Filter, ChevronRight,
    RefreshCw
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getAllBimModels, BimModel } from '../../lib/bimStorage';
import { StatCard, SkeletonCard } from '@/components/ui';

const ProjectBimTab = React.lazy(() =>
    import('../projects/components/tabs/ProjectBimTab').then(m => ({ default: m.ProjectBimTab }))
);

// ─── BIM Error Boundary ───
interface BimEBProps { children: React.ReactNode; }
interface BimEBState { hasError: boolean; error: Error | null; }

class BimErrorBoundary extends React.Component<BimEBProps, BimEBState> {
    state: BimEBState = { hasError: false, error: null };
    static getDerivedStateFromError(error: Error): BimEBState {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('BIM Viewer Error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-96 gap-4 text-center p-4">
                    <div className="text-red-500 dark:text-red-400 text-lg font-bold">⚠️ BIM Viewer Error</div>
                    <div className="text-txt-muted text-sm max-w-lg">
                        {this.state.error?.message || 'Unknown error'}
                    </div>
                    <button
                        // @ts-ignore
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary-600"
                    >
                        Thử lại
                    </button>
                </div>
            );
        }
        // @ts-ignore
        return this.props.children;
    }
}

// ─── Loading Skeleton ───
const BimViewerSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => (
    <div className="flex items-center justify-center h-full">
        <div className={`text-center p-4 rounded-2xl border shadow-sm backdrop-blur-xl ${isDark ? 'bg-slate-50 border-slate-600/30' : 'bg-white/95 border-gray-200'}`}>
            <div className="relative w-16 h-16 mx-auto mb-4">
                <div className={`absolute inset-0 border-4 border-t-transparent rounded-full animate-spin ${isDark ? 'border-blue-500' : 'border-blue-600'}`} />
                <div className={`absolute inset-2 border-4 border-b-transparent rounded-full animate-[spin_1.5s_linear_infinite_reverse] ${isDark ? 'border-cyan-400' : 'border-cyan-500'}`} />
                <Box className={`absolute inset-0 m-auto w-4 h-4 animate-pulse ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            </div>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Đang tải BIM Viewer...</p>
        </div>
    </div>
);

// ─── Constants ───
const DISCIPLINE_LABELS: Record<string, { label: string; color: string; darkColor?: string }> = {
    ARCH: { label: 'Kiến trúc', color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' },
    STRU: { label: 'Kết cấu', color: 'bg-warning-100 dark:bg-warning-500/20 text-warning-700 dark:text-warning-300' },
    MEP: { label: 'MEP', color: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' },
    ELEC: { label: 'Điện', color: 'bg-warning-100 dark:bg-warning-500/20 text-primary-700 dark:text-warning-300' },
    HVAC: { label: 'HVAC', color: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300' },
    PLUM: { label: 'Cấp thoát nước', color: 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300' },
    FIRE: { label: 'PCCC', color: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' },
    LAND: { label: 'Cảnh quan', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' },
    COMBINE: { label: 'Tổng hợp', color: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; darkColor?: string }> = {
    ready: { label: 'Sẵn sàng', icon: CheckCircle2, color: 'text-green-600 dark:text-green-400' },
    converting: { label: 'Đang xử lý', icon: Clock, color: 'text-primary-600 dark:text-primary-400' },
    uploading: { label: 'Đang tải lên', icon: Loader2, color: 'text-blue-600 dark:text-blue-400' },
    error: { label: 'Lỗi', icon: AlertCircle, color: 'text-red-600 dark:text-red-400' },
};

function formatFileSize(bytes: number | null): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
}

// ─── Types ───
interface ProjectBimSummary {
    projectId: string;
    projectName: string;
    models: (BimModel & { project_name?: string })[];
    totalSize: number;
    totalElements: number;
    disciplines: string[];
    statusCounts: Record<string, number>;
    lastUpdated: string | null;
}

// ─── Main Component ───
const BimPage: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { scopedProjects: projects } = useScopedProjects({ pageSize: 9999 });
    const { projectId: urlProjectId } = useParams<{ projectId?: string }>();
    const navigate = useNavigate();

    const [allModels, setAllModels] = useState<(BimModel & { project_name?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDiscipline, setFilterDiscipline] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    // ── Viewer persistence: keep up to MAX_CACHED_VIEWERS mounted ──
    const MAX_CACHED_VIEWERS = 3;
    const [mountedViewerIds, setMountedViewerIds] = useState<string[]>([]);

    // Mount viewer when navigating to a project (keeps previous ones alive)
    useEffect(() => {
        if (!urlProjectId) return;
        setMountedViewerIds(prev => {
            if (prev.includes(urlProjectId)) {
                // Already mounted — move to end (most recent)
                return [...prev.filter(id => id !== urlProjectId), urlProjectId];
            }
            // Add new viewer, evict oldest if over limit
            const next = [...prev, urlProjectId];
            return next.length > MAX_CACHED_VIEWERS ? next.slice(-MAX_CACHED_VIEWERS) : next;
        });
    }, [urlProjectId]);

    // Fetch all BIM models
    const fetchModels = useCallback(async () => {
        setLoading(true);
        try {
            const models = await getAllBimModels();
            setAllModels(models);
        } catch (err) {
            console.error('[BIM] Failed to fetch models:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!urlProjectId) fetchModels();
    }, [urlProjectId, fetchModels]);

    // Group models by project
    const projectSummaries = useMemo((): ProjectBimSummary[] => {
        const grouped = new Map<string, (BimModel & { project_name?: string })[]>();
        allModels.forEach(m => {
            const list = grouped.get(m.project_id) || [];
            list.push(m);
            grouped.set(m.project_id, list);
        });

        // Extract all allowed project IDs
        const allProjectIds = new Set(projects.map(p => p.ProjectID));

        return Array.from(allProjectIds).map(pid => {
            const models = grouped.get(pid) || [];
            const project = projects.find(p => p.ProjectID === pid);
            const projectName = models[0]?.project_name || project?.ProjectName || pid;

            return {
                projectId: pid,
                projectName,
                models,
                totalSize: models.reduce((sum, m) => sum + (m.file_size || 0), 0),
                totalElements: models.reduce((sum, m) => sum + (m.element_count || 0), 0),
                disciplines: [...new Set(models.map(m => m.discipline).filter(Boolean) as string[])],
                statusCounts: models.reduce((acc, m) => {
                    const s = m.status || 'unknown';
                    acc[s] = (acc[s] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
                lastUpdated: models.length > 0
                    ? models.reduce((latest, m) => {
                        const d = m.updated_at || m.created_at || '';
                        return d > latest ? d : latest;
                    }, '')
                    : null,
            };
        }).sort((a, b) => {
            // Projects with models first, then by last updated
            if (a.models.length === 0 && b.models.length > 0) return 1;
            if (a.models.length > 0 && b.models.length === 0) return -1;
            return (b.lastUpdated || '').localeCompare(a.lastUpdated || '');
        });
    }, [allModels, projects]);

    // KPI stats
    const kpi = useMemo(() => {
        const totalModels = allModels.length;
        const totalSize = allModels.reduce((sum, m) => sum + (m.file_size || 0), 0);
        const ready = allModels.filter(m => m.status === 'ready').length;
        const processing = allModels.filter(m => m.status === 'converting' || m.status === 'uploading').length;
        const errors = allModels.filter(m => m.status === 'error').length;
        const projectsWithBim = new Set(allModels.map(m => m.project_id)).size;
        const allDisciplines = [...new Set(allModels.map(m => m.discipline).filter(Boolean) as string[])];
        return { totalModels, totalSize, ready, processing, errors, projectsWithBim, allDisciplines };
    }, [allModels]);

    // Filter
    const filteredSummaries = useMemo(() => {
        return projectSummaries.filter(ps => {
            // Search
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = ps.projectName.toLowerCase().includes(q);
                const matchFile = ps.models.some(m => m.file_name.toLowerCase().includes(q));
                const matchId = ps.projectId.toLowerCase().includes(q);
                if (!matchName && !matchFile && !matchId) return false;
            }
            // Discipline filter
            if (filterDiscipline !== 'ALL') {
                if (!ps.disciplines.includes(filterDiscipline)) return false;
            }
            // Status filter
            if (filterStatus !== 'ALL') {
                if (!ps.statusCounts[filterStatus]) return false;
            }
            return true;
        });
    }, [projectSummaries, searchQuery, filterDiscipline, filterStatus]);

    const selectedProject = useMemo(
        () => urlProjectId ? projects.find(p => p.ProjectID === urlProjectId) : null,
        [projects, urlProjectId]
    );

    const handleOpenBim = (projectId: string) => navigate(`/bim/${projectId}`);
    const handleBack = () => navigate('/bim');

    // Resolve project name for a mounted viewer ID
    const getProjectForViewer = useCallback((viewerId: string) => {
        return projects.find(p => p.ProjectID === viewerId);
    }, [projects]);

    // ─── Viewer: active project header (only when a viewer is active) ───
    const isViewerActive = !!urlProjectId && !!selectedProject;

    // Loading for invalid URL
    if (urlProjectId && !selectedProject) {
        return (
            <div className="flex flex-col h-full items-center justify-center gap-4">
                {projects.length === 0 ? (
                    <>
                        <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Đang tải dự án...</p>
                    </>
                ) : (
                    <>
                        <Building2 className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Không tìm thấy dự án</p>
                        <button onClick={handleBack} className="text-sm text-blue-500 hover:text-blue-600 underline">Quay lại danh sách</button>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="relative h-full">
            {/* ─── Mounted BIM Viewers (persist across navigation) ─── */}
            {mountedViewerIds.map(viewerId => {
                const isActive = isViewerActive && urlProjectId === viewerId;
                const viewerProject = getProjectForViewer(viewerId);
                if (!viewerProject) return null;

                return (
                    <div
                        key={`bim-viewer-${viewerId}`}
                        className={`flex flex-col overflow-hidden ${
                            isActive 
                                ? '-mx-3 sm:-mx-4 lg:-mx-6 -mb-6 sm:-mb-8 -mt-2' 
                                : 'absolute inset-0 pointer-events-none'
                        }`}
                        style={{
                            height: isActive ? 'calc(100vh - 100px)' : '100%',
                            visibility: isActive ? 'visible' : 'hidden',
                            zIndex: isActive ? 1 : -1,
                        }}
                    >
                        {/* Header bar */}
                        <div className={`shrink-0 flex items-center gap-3 px-4 py-2 border-b ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-bg-surface'}`}>
                            <button onClick={handleBack} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                                <ArrowLeft className="w-4 h-4" />Quay lại
                            </button>
                            <div className={`h-5 w-px ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`} />
                            <div className="flex items-center gap-2 min-w-0">
                                <div className={`p-1.5 rounded-lg ${isDark ? 'bg-cyan-500/10' : 'bg-blue-50'}`}>
                                    <Layers className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className={`text-sm font-bold truncate ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{viewerProject.ProjectName}</h2>
                                    <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Mô hình BIM 3D</p>
                                </div>
                            </div>
                        </div>
                        {/* 3D Viewer */}
                        <div className="flex-1 min-h-0 relative">
                            <BimErrorBoundary>
                                <Suspense fallback={<BimViewerSkeleton isDark={isDark} />}>
                                    <ProjectBimTab projectID={viewerId} />
                                </Suspense>
                            </BimErrorBoundary>
                        </div>
                    </div>
                );
            })}

            {/* ─── Grid view (visible when no viewer is active) ─── */}
            {!isViewerActive && (
                <div className="h-full flex flex-col p-4 gap-5 overflow-hidden">
                    {/* Header */}
                    <div className="shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl shadow-sm ${isDark
                                    ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20'
                                    : 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100'}`}>
                                    <Layers className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                                </div>
                                <div>
                                    <h1 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Mô hình BIM</h1>
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Quản lý mô hình thông tin công trình</p>
                                </div>
                            </div>
                            <button onClick={fetchModels} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`} title="Làm mới">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {/* KPI Cards */}
                        {!loading && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                {[
                                    { icon: Box, label: 'Tổng mô hình', value: kpi.totalModels, sub: `${kpi.projectsWithBim} dự án`, color: 'blue' as const },
                                    { icon: HardDrive, label: 'Dung lượng', value: formatFileSize(kpi.totalSize), sub: 'Tổng dữ liệu BIM', color: 'slate' as const },
                                    { icon: CheckCircle2, label: 'Sẵn sàng', value: kpi.ready, sub: kpi.processing > 0 ? `${kpi.processing} đang xử lý` : 'Tất cả sẵn sàng', color: 'emerald' as const },
                                    { icon: Cpu, label: 'Bộ môn', value: kpi.allDisciplines.length, sub: kpi.allDisciplines.slice(0, 3).join(', ') || '—', color: 'amber' as const },
                                ].map((card, i) => (
                                    <StatCard
                                        key={i}
                                        label={card.label}
                                        value={card.value}
                                        icon={<card.icon className="w-5 h-5" />}
                                        color={card.color as any}
                                        footer={
                                            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{card.sub}</p>
                                        }
                                    />
                                ))}
                            </div>
                        )}

                        {/* Search & Filters */}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[200px] max-w-md">
                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                                <input
                                    type="text"
                                    placeholder="Tìm dự án, file IFC..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm border transition-all ${isDark
                                        ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50'
                                        : 'bg-bg-surface border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400'}`}
                                />
                            </div>

                            {/* Discipline Filter */}
                            <div className="flex items-center gap-1.5">
                                <Filter className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                                {['ALL', ...kpi.allDisciplines].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setFilterDiscipline(d)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                                            filterDiscipline === d
                                                ? (isDark ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30' : 'bg-blue-100 text-blue-700 ring-1 ring-blue-200')
                                                : (isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100')
                                        }`}
                                    >
                                        {d === 'ALL' ? 'Tất cả' : (DISCIPLINE_LABELS[d]?.label || d)}
                                    </button>
                                ))}
                            </div>

                            {/* Status Filter */}
                            {(kpi.processing > 0 || kpi.errors > 0) && (
                                <div className="flex items-center gap-1.5">
                                    {['ALL', 'ready', 'converting', 'error'].map(s => {
                                        const cfg = STATUS_CONFIG[s];
                                        return (
                                            <button
                                                key={s}
                                                onClick={() => setFilterStatus(s)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                                                    filterStatus === s
                                                        ? (isDark ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30' : 'bg-blue-100 text-blue-700 ring-1 ring-blue-200')
                                                        : (isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100')
                                                }`}
                                            >
                                                {s === 'ALL' ? 'Tất cả' : cfg?.label || s}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <SkeletonCard key={i} />
                                ))}
                            </div>
                        ) : filteredSummaries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Building2 className={`w-12 h-12 mb-4 ${isDark ? 'text-slate-700' : 'text-gray-300'}`} />
                                <p className={`text-sm font-medium ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                    {searchQuery || filterDiscipline !== 'ALL' || filterStatus !== 'ALL' ? 'Không tìm thấy dự án phù hợp' : 'Chưa có mô hình BIM nào'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Projects with BIM models */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {filteredSummaries.filter(ps => ps.models.length > 0).map(ps => (
                                        <BimProjectCard key={ps.projectId} summary={ps} isDark={isDark} onClick={() => handleOpenBim(ps.projectId)} />
                                    ))}
                                </div>

                                {/* Projects without BIM models — compact list */}
                                {filteredSummaries.some(ps => ps.models.length === 0) && (
                                    <div className="mt-6">
                                        <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                                            Dự án chưa có mô hình BIM ({filteredSummaries.filter(ps => ps.models.length === 0).length})
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {filteredSummaries.filter(ps => ps.models.length === 0).map(ps => (
                                                <button
                                                    key={ps.projectId}
                                                    onClick={() => handleOpenBim(ps.projectId)}
                                                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200
                                                        ${isDark
                                                            ? 'bg-slate-50 border-slate-700/40 hover:border-slate-600 hover:bg-slate-50'
                                                            : 'bg-bg-subtle border-gray-200 hover:border-gray-300 hover:bg-bg-surface'
                                                        }
                                                    `}
                                                >
                                                    <div className={`p-2 rounded-lg shrink-0 ${isDark ? 'bg-slate-50' : 'bg-gray-100'}`}>
                                                        <Building2 className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`text-sm font-medium truncate group-hover:text-blue-500 dark:group-hover:text-cyan-400 transition-colors ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                                            {ps.projectName}
                                                        </p>
                                                        <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>Chưa có mô hình</p>
                                                    </div>
                                                    <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── BIM Project Card Component (Enhanced) ───
const BimProjectCard: React.FC<{
    summary: ProjectBimSummary;
    isDark: boolean;
    onClick: () => void;
}> = ({ summary, isDark, onClick }) => {
    const readyCount = summary.statusCounts['ready'] || 0;
    const errorCount = summary.statusCounts['error'] || 0;
    const processingCount = (summary.statusCounts['converting'] || 0) + (summary.statusCounts['uploading'] || 0);
    const totalModels = summary.models.length;

    // Gradient based on primary discipline
    const primaryDiscipline = summary.disciplines[0];
    const gradientMap: Record<string, string> = {
        ARCH: isDark ? 'from-blue-600/25 via-primary-600/15 to-slate-900/0' : 'from-blue-100 via-primary-50 to-white',
        STRU: isDark ? 'from-warning-600/25 via-primary-600/15 to-slate-900/0' : 'from-warning-100 via-primary-50 to-white',
        MEP: isDark ? 'from-green-600/25 via-emerald-600/15 to-slate-900/0' : 'from-green-100 via-emerald-50 to-white',
        ELEC: isDark ? 'from-primary-600/25 via-primary-600/15 to-slate-900/0' : 'from-warning-100 via-primary-50 to-white',
        HVAC: isDark ? 'from-cyan-600/25 via-teal-600/15 to-slate-900/0' : 'from-cyan-100 via-teal-50 to-white',
        FIRE: isDark ? 'from-red-600/25 via-rose-600/15 to-slate-900/0' : 'from-red-100 via-rose-50 to-white',
        COMBINE: isDark ? 'from-purple-600/25 via-violet-600/15 to-slate-900/0' : 'from-purple-100 via-violet-50 to-white',
    };
    const gradient = gradientMap[primaryDiscipline] || (isDark ? 'from-cyan-600/20 via-blue-600/10 to-slate-900/0' : 'from-blue-50 via-sky-50 to-white');

    // Status ring: fraction of ready models
    const readyPercent = totalModels > 0 ? (readyCount / totalModels) * 100 : 0;
    const circumference = 2 * Math.PI * 18; // r=18

    return (
        <button
            onClick={onClick}
            className={`group relative w-full text-left rounded-2xl border transition-all duration-300 overflow-hidden
                ${isDark
                    ? 'bg-slate-50 border-slate-700/50 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-0.5'
                    : 'bg-bg-surface border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5'
                }
            `}
        >
            {/* Gradient header */}
            <div className={`relative h-28 bg-gradient-to-br ${gradient} flex items-center overflow-hidden px-5`}>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${isDark ? 'ffffff' : '000000'}' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />

                {/* Status ring + model count */}
                <div className="relative flex items-center gap-4 z-10">
                    <div className="relative w-14 h-14">
                        {/* Background ring */}
                        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 40 40">
                            <circle cx="20" cy="20" r="18" fill="none" strokeWidth="2.5"
                                className={isDark ? 'stroke-slate-700/50' : 'stroke-gray-200'}
                            />
                            {/* Progress ring */}
                            <circle cx="20" cy="20" r="18" fill="none" strokeWidth="2.5"
                                strokeLinecap="round"
                                className={errorCount > 0 ? 'stroke-red-400' : processingCount > 0 ? 'stroke-warning-400' : isDark ? 'stroke-cyan-400' : 'stroke-blue-500'}
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference - (readyPercent / 100) * circumference}
                                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                            />
                        </svg>
                        {/* Center: model count */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>{totalModels}</span>
                        </div>
                    </div>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Mô hình</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            {readyCount > 0 && (
                                <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                    <CheckCircle2 className="w-3 h-3" />{readyCount}
                                </span>
                            )}
                            {processingCount > 0 && (
                                <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                                    <Loader2 className="w-3 h-3 animate-spin" />{processingCount}
                                </span>
                            )}
                            {errorCount > 0 && (
                                <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                    <AlertCircle className="w-3 h-3" />{errorCount}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Decorative icon */}
                <Layers className={`absolute -right-3 -bottom-3 w-16 h-16 rotate-12 ${isDark ? 'text-white/[0.04]' : 'text-black/[0.03]'}`} />
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Project name */}
                <h3 className={`text-sm font-bold leading-snug line-clamp-2 mb-3 group-hover:text-blue-500 dark:group-hover:text-cyan-400 transition-colors ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                    {summary.projectName}
                </h3>

                {/* Discipline chips */}
                {summary.disciplines.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {summary.disciplines.map(d => {
                            const cfg = DISCIPLINE_LABELS[d];
                            return (
                                <span key={d} className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${cfg?.color || 'bg-bg-muted text-txt-muted'}`}>
                                    {cfg?.label || d}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Stats bar */}
                <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-slate-700/50' : 'border-gray-100'}`}>
                    <div className={`flex items-center gap-4 text-[11px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        <span className="flex items-center gap-1" title="Dung lượng">
                            <HardDrive className="w-3.5 h-3.5" />
                            {formatFileSize(summary.totalSize)}
                        </span>
                        <span className="flex items-center gap-1" title="Cập nhật">
                            <Clock className="w-3.5 h-3.5" />
                            {timeAgo(summary.lastUpdated)}
                        </span>
                    </div>
                    <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isDark ? 'text-cyan-400' : 'text-blue-500'}`}>
                        <span className="text-[10px] font-semibold">Xem</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>
            </div>
        </button>
    );
};

export default BimPage;

