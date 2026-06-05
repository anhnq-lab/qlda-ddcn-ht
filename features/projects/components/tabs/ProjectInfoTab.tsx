import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Project, ProjectStage, Employee, BiddingPackage, Contractor } from '@/types';
import {
    Pencil, Clock, Info, Maximize, Target,
    Hash, Building2, MapPin, Briefcase, Wallet, Copy, Check, Ruler, Box, Layers, Database, Eye, EyeOff,
    ArrowRightLeft, FileText, UserCheck, AlertCircle, Calendar, Coins
} from 'lucide-react';
import { SyncResult } from '@/services/NationalGatewayService';
import { LifecycleStepper, StageHistoryEntry } from '../LifecycleStepper';
import { GanttChartWidget } from '../GanttChartWidget';
import { ProjectTeamSection } from '../ProjectTeamSection';
import { ContractorsListSection } from '../ContractorsListSection';
import { ContractorDetailPanel } from '@/components/common/ContractorDetailPanel';
import { RiskIndicators } from '../RiskIndicators';
import { BudgetVarianceCard } from '../BudgetVarianceCard';
import { KeyDatesWidget, KeyDate } from '../KeyDatesWidget';
import { QuickActionsPanel } from '../QuickActionsPanel';
import { TemplateExportModal } from '../TemplateExportModal';
import { LegalReferenceLink } from '../../../../components/common/LegalReferenceLink';
import { useSlidePanel } from '@/context/SlidePanelContext';
import { useProjectCapitalSummary } from '@/hooks/useCapital';

// Extended contractor with package info for display
interface ContractorWithPackages extends Contractor {
    contractNames?: string[];
    packageNames?: string[];
}

interface ProjectInfoTabProps {
    project: Project & {
        Stage?: ProjectStage;
        PhysicalProgress?: number;
        FinancialProgress?: number;
        RequiresBIM?: boolean;
        BIMStatus?: string;
        StageHistory?: StageHistoryEntry[];
        PlannedDisbursement?: number;
        ContractEndDate?: string;
    };
    projectMembers: Employee[];
    projectPackages: BiddingPackage[];
    isSyncing: boolean;
    syncResult: SyncResult | null;
    isGeneratingReport: boolean;
    onGenerateReport: (type: 'Monitoring' | 'Settlement') => void;
    onViewMember?: (employeeId: string) => void;
    onViewPackage?: (packageId: string) => void;
    onStageChange?: (newStage: ProjectStage, entry: StageHistoryEntry) => void;
    onHistoryUpdate?: (history: StageHistoryEntry[]) => void;
    onSync?: () => void;
    canEditLifecycle?: boolean;
    onEditProject?: () => void;
    onTabChange?: (tab: string) => void;
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
            return dateStr;
        }
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return dateStr || '—';
    }
};

const formatVND = (value?: number) => {
    if (value === undefined || value === null) return '—';
    return `${value.toLocaleString('vi-VN')} đ`;
};

export const ProjectInfoTab: React.FC<ProjectInfoTabProps> = ({
    project,
    projectMembers,
    projectPackages,
    isSyncing,
    syncResult,
    isGeneratingReport,
    onGenerateReport,
    onViewMember,
    onViewPackage,
    onStageChange,
    onHistoryUpdate,
    onSync,
    canEditLifecycle = true,
    onEditProject,
    onTabChange
}) => {

    const { openPanel } = useSlidePanel();

    const [isHiddenOnMap, setIsHiddenOnMap] = useState<boolean>(() => {
        try {
            const stored = localStorage.getItem('hiddenProjectIds');
            if (stored && project.ProjectID) {
                const hiddenSet = new Set(JSON.parse(stored).map(String));
                return hiddenSet.has(String(project.ProjectID));
            }
        } catch { }
        return false;
    });

    // State for Mẫu 16 Export
    const [showExportKhoiCong, setShowExportKhoiCong] = useState(false);

    useEffect(() => {
        const handleStorageChange = () => {
            try {
                const stored = localStorage.getItem('hiddenProjectIds');
                if (stored && project.ProjectID) {
                    const hiddenSet = new Set(JSON.parse(stored).map(String));
                    setIsHiddenOnMap(hiddenSet.has(String(project.ProjectID)));
                } else {
                    setIsHiddenOnMap(false);
                }
            } catch { }
        };
        window.addEventListener('hiddenProjectIdsChanged', handleStorageChange);
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('hiddenProjectIdsChanged', handleStorageChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [project.ProjectID]);

    const toggleHideOnMap = () => {
        try {
            const stored = localStorage.getItem('hiddenProjectIds');
            const hiddenSet = stored ? new Set<string>(JSON.parse(stored).map(String)) : new Set<string>();
            const idStr = String(project.ProjectID);
            if (isHiddenOnMap) {
                hiddenSet.delete(idStr);
            } else {
                hiddenSet.add(idStr);
            }
            localStorage.setItem('hiddenProjectIds', JSON.stringify(Array.from(hiddenSet)));
            setIsHiddenOnMap(!isHiddenOnMap);
            window.dispatchEvent(new Event('hiddenProjectIdsChanged'));
        } catch (error) {
            console.error('Failed to toggle hidden state', error);
        }
    };

    // Fetch real contractors from contracts + contractors + bidding_packages tables
    const { data: projectContractors = [] } = useQuery<ContractorWithPackages[]>({
        queryKey: ['project-contractors', project.ProjectID],
        queryFn: async () => {
            // Get contracts with contractor_id AND package_id
            const { data: contractRows } = await supabase
                .from('contracts')
                .select('contractor_id, contract_name, package_id')
                .eq('project_id', project.ProjectID)
                .not('contractor_id', 'is', null);
            if (!contractRows || contractRows.length === 0) return [];

            const uniqueIds = [...new Set(contractRows.map((r: any) => r.contractor_id))];
            const { data: contractors } = await supabase
                .from('contractors')
                .select('*')
                .in('contractor_id', uniqueIds);
            if (!contractors) return [];

            // Fetch package names for linked packages
            const packageIds = [...new Set(contractRows.filter((r: any) => r.package_id).map((r: any) => r.package_id))];
            let packageMap = new Map<string, string>();
            if (packageIds.length > 0) {
                const { data: packages } = await supabase
                    .from('bidding_packages')
                    .select('package_id, package_name')
                    .in('package_id', packageIds);
                if (packages) {
                    packageMap = new Map(packages.map((p: any) => [p.package_id, p.package_name]));
                }
            }

            return contractors.map((c: any) => {
                // Find all contracts for this contractor
                const relatedContracts = contractRows.filter((r: any) => r.contractor_id === c.contractor_id);
                const contractNames = relatedContracts.map((r: any) => r.contract_name).filter(Boolean);
                const packageNames = relatedContracts
                    .map((r: any) => r.package_id ? packageMap.get(r.package_id) : null)
                    .filter(Boolean) as string[];

                return {
                    ContractorID: c.contractor_id,
                    FullName: c.full_name || '',
                    TaxCode: c.tax_code || '',
                    Address: c.address || '',
                    Representative: c.representative || '',
                    ContactInfo: c.contact_info || '',
                    IsForeign: c.is_foreign || false,
                    ContractorType: c.contractor_type || 'Main',
                    CapCertCode: c.cap_cert_code || '',
                    OpLicenseNo: c.op_license_no || '',
                    EstablishedYear: c.established_year,
                    contractNames,
                    packageNames,
                };
            });
        },
        enabled: !!project.ProjectID,
    });

    // Handler: open contractor detail slide panel
    const handleViewContractor = useCallback((contractorId: string) => {
        const contractor = (projectContractors as ContractorWithPackages[]).find(c => c.ContractorID === contractorId);
        openPanel({
            title: contractor?.FullName || 'Chi tiết nhà thầu',
            icon: <Building2 size={14} />,
            url: `/contractors/${contractorId}`,
            component: (
                <ContractorDetailPanel
                    contractorId={contractorId}
                    projectId={project.ProjectID}
                />
            ),
        });
    }, [openPanel, projectContractors, project.ProjectID]);

    // ═══ Calculate progress from TASKS plan data ═══
    const { data: taskProgressData } = useQuery<{ projectProgress: number; constructionProgress: number }>({
        queryKey: ['project-task-progress-v2', project.ProjectID],
        queryFn: async () => {
            const { TaskService } = await import('../../../../services/TaskService');
            // Using the new workflow engine to get tasks linked to this project's instances
            const wfTasks = await TaskService.getProjectTasks(project.ProjectID);

            if (!wfTasks || wfTasks.length === 0) {
                // No tasks → dùng progress dự án, thi công = 0 (chưa có tasks thi công)
                return {
                    projectProgress: project.PhysicalProgress ?? project.Progress ?? 0,
                    constructionProgress: 0,
                };
            }

            // All tasks → Tiến độ dự án (overall plan progress)
            const allProgress = wfTasks.map(t => t.progress ?? (t.status === 'done' ? 100 : 0));
            const projectProg = allProgress.length > 0
                ? Math.round(allProgress.reduce((a, b) => a + b, 0) / allProgress.length)
                : 0;

            // Simplified: constructionProgress falls back to projectProg 
            const constructionProg = projectProg;

            return { projectProgress: projectProg, constructionProgress: constructionProg };
        },
        enabled: !!project.ProjectID,
        staleTime: 5 * 60 * 1000,
    });
    const physicalProgress = taskProgressData?.projectProgress ?? project.PhysicalProgress ?? project.Progress ?? 0;
    const financialProgress = taskProgressData?.constructionProgress ?? 0;

    // ═══ Calculate disbursed amount from real disbursement data ═══
    const { data: capitalSummary } = useProjectCapitalSummary(project.ProjectID);
    const disbursedAmount = capitalSummary?.summary.totalDisbursed || 0;

    const isHandoverProject = useMemo(() => {
        return !!(
            project.OldInvestor ||
            project.TransferDecision ||
            project.DecisionLevelBeforeHandover ||
            project.ProjectManagement?.ban_tiep_nhan ||
            project.ProjectManagement?.thoi_diem_ban_giao ||
            project.ProjectManagement?.ho_so_ban_giao ||
            (project.ProjectManagement?.gia_tri_khoi_luong_ban_giao !== undefined && project.ProjectManagement?.gia_tri_khoi_luong_ban_giao > 0) ||
            project.ProjectStatusInfo?.ton_tai_vuong_mac_ban_giao ||
            project.ProjectStatusInfo?.tinh_trang_quyet_toan_den_30_6_2025 ||
            project.ProjectStatusInfo?.cong_no_den_30_6_2025 ||
            project.ProjectStatusInfo?.tinh_trang_quyet_toan_sau_ban_giao ||
            project.ProjectStatusInfo?.cong_no_sau_ban_giao ||
            project.ProjectStatusInfo?.cham_tien_do
        );
    }, [project]);


    // ═══ FETCH KEY DATES FROM MULTIPLE SOURCES ═══
    const { data: keyDates = [] } = useQuery<KeyDate[]>({
        queryKey: ['project-key-dates-v2', project.ProjectID],
        queryFn: async () => {
            const now = new Date();
            const nowISO = now.toISOString();
            const results: KeyDate[] = [];

            // ── Source 1: Tasks (overdue + upcoming with priority) ──
            // Overdue tasks (no date limit — show ALL overdue)
            const { data: overdueTasks } = await (supabase as any)
                .from('tasks')
                .select('id, title, due_date, status, priority')
                .eq('project_id', project.ProjectID)
                .not('status', 'in', '(Done,done,completed)')
                .lt('due_date', nowISO)
                .order('due_date', { ascending: true })
                .limit(5) as { data: any[] | null };

            for (const t of overdueTasks || []) {
                const dueDate = new Date(t.due_date);
                const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                results.push({
                    id: t.id,
                    title: t.title,
                    date: t.due_date?.split('T')[0] || '',
                    type: t.priority?.toLowerCase() === 'critical' ? 'milestone' : t.priority?.toLowerCase() === 'high' ? 'milestone' : 'deadline',
                    status: 'overdue',
                    description: `Quá hạn ${daysOverdue} ngày`,
                });
            }

            // Upcoming tasks — high/critical priority: up to 6 months, others: up to 90 days
            const in6Months = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
            const { data: upcomingTasks } = await (supabase as any)
                .from('tasks')
                .select('id, title, due_date, status, priority')
                .eq('project_id', project.ProjectID)
                .not('status', 'in', '(Done,done,completed)')
                .gte('due_date', nowISO)
                .lte('due_date', in6Months)
                .order('due_date', { ascending: true })
                .limit(10) as { data: any[] | null };

            for (const t of upcomingTasks || []) {
                const dueDate = new Date(t.due_date);
                const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isHighPriority = ['high', 'critical'].includes(t.priority?.toLowerCase() || '');

                // For non-high priority, only show if within 90 days
                if (!isHighPriority && daysUntil > 90) continue;

                let status: KeyDate['status'] = 'upcoming';
                if (daysUntil <= 7) status = 'due-soon';

                results.push({
                    id: t.id,
                    title: t.title,
                    date: t.due_date?.split('T')[0] || '',
                    type: isHighPriority ? 'milestone' : 'deadline',
                    status,
                    description: daysUntil === 0 ? 'Hôm nay'
                        : daysUntil === 1 ? 'Ngày mai'
                        : `Còn ${daysUntil} ngày`,
                });
            }

            // ── Source 2: Contract end dates (active contracts) ──
            const { data: activeContracts } = await supabase
                .from('contracts')
                .select('contract_id, contract_name, end_date, status')
                .eq('project_id', project.ProjectID)
                .eq('status', 1)  // Đang thực hiện
                .not('end_date', 'is', null)
                .order('end_date', { ascending: true });

            for (const ct of activeContracts || []) {
                const endDate = new Date(ct.end_date ?? '');
                const daysUntil = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                let status: KeyDate['status'] = 'upcoming';
                if (daysUntil < 0) status = 'overdue';
                else if (daysUntil <= 30) status = 'due-soon';

                results.push({
                    id: `ct-${ct.contract_id}`,
                    title: `Kết thúc: ${ct.contract_name}`,
                    date: ct.end_date?.split('T')[0] || '',
                    type: 'milestone',
                    status,
                    description: daysUntil < 0
                        ? `Quá hạn hợp đồng ${Math.abs(daysUntil)} ngày`
                        : daysUntil === 0 ? 'Hết hạn hôm nay'
                        : `Còn ${daysUntil} ngày`,
                });
            }

            // ── Source 3: Pending payments (NOT already paid) ──
            const { data: pendingPayments } = await supabase
                .from('payments')
                .select('payment_id, description, request_date, status, amount, type, paid_date')
                .eq('project_id', project.ProjectID)
                .in('status', ['pending', 'submitted', 'approved', 'draft'])
                .order('request_date', { ascending: true })
                .limit(5);

            for (const pm of pendingPayments || []) {
                // Skip payments that already have a paid_date (they're done)
                if (pm.paid_date && pm.paid_date !== '') continue;

                const reqDate = new Date(pm.request_date || now);
                const daysAgo = Math.ceil((now.getTime() - reqDate.getTime()) / (1000 * 60 * 60 * 24));

                // For draft payments, only show if within 60 days
                if (pm.status === 'draft' && daysAgo < -60) continue;

                results.push({
                    id: `pm-${pm.payment_id}`,
                    title: pm.description || `Thanh toán ${pm.type || ''}`,
                    date: pm.request_date?.split('T')[0] || '',
                    type: 'report',
                    status: daysAgo > 14 ? 'overdue' : daysAgo > 7 ? 'due-soon' : 'upcoming',
                    description: pm.status === 'pending' ? 'Chờ duyệt'
                        : pm.status === 'approved' ? 'Đã duyệt — chờ chi'
                        : pm.status === 'draft' ? 'Đang soạn'
                        : 'Đã nộp',
                });
            }

            // Sort: overdue first, then by date ascending
            results.sort((a, b) => {
                const statusOrder: Record<string, number> = { overdue: 0, 'due-soon': 1, upcoming: 2, completed: 3 };
                const sa = statusOrder[a.status] ?? 2;
                const sb = statusOrder[b.status] ?? 2;
                if (sa !== sb) return sa - sb;
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            });

            return results;
        },
        enabled: !!project.ProjectID,
        staleTime: 5 * 60 * 1000,
    });

    // Calculate disbursement data for BudgetVarianceCard
    const disbursementData = useMemo(() => {
        if (!capitalSummary) return { planned: 0, prevMonth: 0 };
        const now = new Date();
        const thisMonth = now.getMonth() + 1;
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
        const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;

        const prevMonthDisbs = capitalSummary.disbursements.filter(d => {
            if (!d.Date) return false;
            const dDate = new Date(d.Date);
            return dDate.getMonth() + 1 === lastMonth && dDate.getFullYear() === lastMonthYear && d.Status === 'Approved';
        });

        const prevMonth = prevMonthDisbs.reduce((s, d) => {
            if (d.Type === 'ThuHoiTamUng') return s - d.Amount;
            return s + d.Amount;
        }, 0);

        return {
            planned: capitalSummary.summary.yearlyTarget || 0,
            prevMonth
        };
    }, [capitalSummary]);

    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-2.5 py-1">

            {/* ═══ LIFECYCLE STEPPER ═══ */}
            <LifecycleStepper
                currentStage={project.Stage || ProjectStage.Preparation}
                stageHistory={project.StageHistory || []}
                editable={canEditLifecycle}
                onStageChange={onStageChange}
                onHistoryUpdate={onHistoryUpdate}
            />

            {/* ═══ MAIN CONTENT GRID ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">

                {/* ── LEFT COLUMN (2/3) ── */}
                <div className="lg:col-span-2 space-y-2.5">

                    {/* ═══ THÔNG TIN DỰ ÁN ═══ */}
                    <div className="section-card">
                        <div className="section-card-header">
                            <div className="flex items-center gap-2">
                                <div className="section-icon"><Info className="w-3.5 h-3.5" /></div>
                                <span>Thông tin dự án</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Hide on Map Button */}
                                <button
                                    onClick={toggleHideOnMap}
                                    className={`flex items-center gap-1 text-[10px] font-bold ${isHiddenOnMap ? 'text-txt-muted hover:text-txt-primary' : 'text-rose-500 hover:text-rose-700'}`}
                                >
                                    {isHiddenOnMap ? (
                                        <>
                                            <Eye className="w-3 h-3" />
                                            Hiện trên bản đồ
                                        </>
                                    ) : (
                                        <>
                                            <EyeOff className="w-3 h-3" />
                                            Ẩn khỏi bản đồ
                                        </>
                                    )}
                                </button>
                                {onEditProject && (
                                    <button
                                        onClick={onEditProject}
                                        className="flex items-center gap-1 text-[10px] text-primary-500 hover:underline font-bold"
                                    >
                                        <Pencil className="w-3 h-3" />
                                        Chỉnh sửa
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="p-2.5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                                <EnhancedInfoItem icon={Hash} label="Mã dự án" value={project.ProjectNumber || project.ProjectID} copyable />
                                <EnhancedInfoItem icon={Briefcase} label="Nhóm dự án" value={`Nhóm ${project.GroupCode}`} highlight />
                                <EnhancedInfoItem 
                                    icon={Layers} 
                                    label="Chuyên ngành" 
                                    value={
                                        project.SpecialtyType 
                                            ? ({
                                                civil_industrial: 'Dân dụng & Công nghiệp',
                                                civil: 'Dân dụng & Công nghiệp',
                                                industrial: 'Dân dụng & Công nghiệp',
                                                transport_urban: 'Giao thông & Đô thị',
                                                transportation: 'Giao thông & Đô thị',
                                                agriculture_rural: 'Nông nghiệp & PTNT',
                                                agriculture: 'Nông nghiệp & PTNT',
                                                technical_infrastructure: 'Hạ tầng kỹ thuật',
                                                mixed: 'Hỗn hợp',
                                                other: 'Khác',
                                                '': 'Chưa phân loại'
                                              } as Record<string, string>)[project.SpecialtyType] || project.SpecialtyType 
                                            : 'Chưa phân loại'
                                    } 
                                    highlight={!!project.SpecialtyType}
                                />
                                <EnhancedInfoItem icon={Info} label="Chi tiết chuyên ngành" value={project.SpecialtyDetails || '—'} />
                                <EnhancedInfoItem icon={MapPin} label="Địa điểm" value={project.LocationCode} />
                                <EnhancedInfoItem icon={Clock} label="Thời gian thực hiện" value={project.Duration || '—'} />
                                <EnhancedInfoItem icon={Briefcase} label="Hình thức quản lý" value={project.ManagementForm || 'Chủ đầu tư trực tiếp quản lý'} />
                                <EnhancedInfoItem icon={Wallet} label="Nguồn vốn" value={project.CapitalSource || 'Ngân sách tỉnh'} />
                            </div>

                            {/* Mục tiêu đầu tư */}
                            {project.Objective && (
                                <div className="mt-2 px-2.5 pb-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Target className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                                        <span className="text-[10px] font-bold text-txt-muted uppercase tracking-wider">Mục tiêu đầu tư</span>
                                    </div>
                                    <p className="text-xs text-txt-secondary leading-relaxed whitespace-pre-line bg-bg-muted rounded-xl p-2.5 border border-border">
                                        {project.Objective}
                                    </p>
                                </div>
                            )}

                            {/* Tóm tắt quy mô đầu tư */}
                            {project.InvestmentScale && (
                                <div className="mt-2 px-2.5 pb-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Ruler className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                        <span className="text-[10px] font-bold text-txt-muted uppercase tracking-wider">Tóm tắt quy mô đầu tư</span>
                                    </div>
                                    <p className="text-xs text-txt-secondary leading-relaxed whitespace-pre-line bg-bg-muted rounded-xl p-2.5 border border-border">
                                        {project.InvestmentScale}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ═══ QUY MÔ CÔNG TRÌNH (separate section) ═══ */}
                    {(project.TotalEstimate || project.SiteArea || project.ConstructionArea || project.FloorArea || project.BuildingHeight || project.AboveGroundFloors || project.BasementFloors) ? (
                        <div className="section-card">
                            <div className="section-card-header">
                                <div className="flex items-center gap-2">
                                    <div className="section-icon"><Maximize className="w-3.5 h-3.5" /></div>
                                    <span>Quy mô công trình</span>
                                </div>
                            </div>
                            <div className="p-2.5 space-y-2">
                                {/* Stat cards row */}
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: 'Tổng dự toán', value: project.TotalEstimate, color: 'red' },
                                        { label: 'Diện tích (m²)', value: project.SiteArea, color: 'blue' },
                                        { label: 'DT xây dựng (m²)', value: project.ConstructionArea, color: 'emerald' },
                                    ].map((item, i) => (
                                        <div key={i} className={`rounded-xl border py-1.5 px-2 text-center
                                            ${item.color === 'red' ? 'border-red-500/20 bg-red-500/10' :
                                            item.color === 'blue' ? 'border-blue-500/20 bg-blue-500/10' :
                                            'border-emerald-500/20 bg-emerald-500/10'}`}
                                        >
                                            <p className="text-[9px] font-bold text-txt-muted uppercase tracking-wide">{item.label}</p>
                                            <p className={`text-sm font-black tabular-nums
                                                ${item.color === 'red' ? 'text-rose-500' :
                                                item.color === 'blue' ? 'text-blue-500' :
                                                'text-emerald-500'}`}
                                            >
                                                {item.value ? Number(item.value).toLocaleString('vi-VN') : '—'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                {/* Detail items */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-0">
                                    {project.FloorArea ? <EnhancedInfoItem icon={Ruler} label="DT sàn sử dụng" value={`${Number(project.FloorArea).toLocaleString('vi-VN')} m²`} /> : null}
                                    {project.BuildingHeight ? <EnhancedInfoItem icon={Ruler} label="Chiều cao" value={`${project.BuildingHeight} m`} /> : null}
                                    {project.BuildingDensity ? <EnhancedInfoItem icon={Building2} label="Mật độ XD" value={`${project.BuildingDensity}%`} /> : null}
                                    {project.LandUseCoefficient ? <EnhancedInfoItem icon={Building2} label="Hệ số SDĐ" value={`${project.LandUseCoefficient}`} /> : null}
                                    {project.AboveGroundFloors ? <EnhancedInfoItem icon={Building2} label="Tầng nổi" value={`${project.AboveGroundFloors}`} /> : null}
                                    {project.BasementFloors ? <EnhancedInfoItem icon={Building2} label="Tầng hầm" value={`${project.BasementFloors}`} /> : null}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* ═══ THÔNG TIN BÀN GIAO & TIẾP NHẬN ═══ */}
                    {isHandoverProject && (
                        <div className="section-card">
                            <div className="section-card-header">
                                <div className="flex items-center gap-2">
                                    <div className="section-icon">
                                        <ArrowRightLeft className="w-3.5 h-3.5" />
                                    </div>
                                    <span>Thông tin bàn giao & Tiếp nhận</span>
                                </div>
                            </div>
                            <div className="p-2.5 space-y-3">
                                {/* Grid thông tin chung bàn bàn giao */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-border-subtle pb-2">
                                    {project.OldInvestor && (
                                        <EnhancedInfoItem
                                            icon={Building2}
                                            label="Chủ đầu tư cũ (Bàn giao)"
                                            value={project.OldInvestor}
                                        />
                                    )}
                                    {project.DecisionLevelBeforeHandover && (
                                        <EnhancedInfoItem
                                            icon={Briefcase}
                                            label="Cấp quyết định trước bàn giao"
                                            value={project.DecisionLevelBeforeHandover}
                                        />
                                    )}
                                    {project.TransferDecision && (
                                        <EnhancedInfoItem
                                            icon={FileText}
                                            label="Quyết định bàn giao"
                                            value={project.TransferDecision}
                                        />
                                    )}
                                    {(project.ProjectManagement?.thoi_diem_ban_giao || project.HandoverDate) && (
                                        <EnhancedInfoItem
                                            icon={Calendar}
                                            label="Ngày bàn giao"
                                            value={formatDate(project.ProjectManagement?.thoi_diem_ban_giao || project.HandoverDate)}
                                        />
                                    )}
                                    {project.ProjectManagement?.ban_tiep_nhan && (
                                        <EnhancedInfoItem
                                            icon={UserCheck}
                                            label="Đơn vị tiếp nhận"
                                            value={project.ProjectManagement?.ban_tiep_nhan}
                                        />
                                    )}
                                    {project.ProjectManagement?.ho_so_ban_giao && (
                                        <EnhancedInfoItem
                                            icon={FileText}
                                            label="Hồ sơ bàn giao"
                                            value={project.ProjectManagement?.ho_so_ban_giao}
                                        />
                                    )}
                                    {project.ProjectManagement?.gia_tri_khoi_luong_ban_giao !== undefined && project.ProjectManagement?.gia_tri_khoi_luong_ban_giao > 0 && (
                                        <EnhancedInfoItem
                                            icon={Coins}
                                            label="Giá trị khối lượng bàn giao"
                                            value={formatVND(project.ProjectManagement?.gia_tri_khoi_luong_ban_giao)}
                                            highlight
                                        />
                                    )}
                                </div>

                                {/* Quyết toán & Công nợ */}
                                {(project.ProjectStatusInfo?.tinh_trang_quyet_toan_den_30_6_2025 || 
                                  project.ProjectStatusInfo?.cong_no_den_30_6_2025 || 
                                  project.ProjectStatusInfo?.tinh_trang_quyet_toan_sau_ban_giao || 
                                  project.ProjectStatusInfo?.cong_no_sau_ban_giao) && (
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold text-txt-muted uppercase tracking-wider px-2.5">
                                            Tình trạng quyết toán & Công nợ
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-2.5">
                                            {/* Mốc 30/6/2025 */}
                                            {(project.ProjectStatusInfo?.tinh_trang_quyet_toan_den_30_6_2025 || project.ProjectStatusInfo?.cong_no_den_30_6_2025 !== undefined) && (
                                                <div className="rounded-xl border border-border-subtle bg-bg-muted/30 p-2.5">
                                                    <div className="text-[10px] font-bold text-txt-muted mb-1">Mốc 30/06/2025 (Trước bàn giao)</div>
                                                    <div className="space-y-1">
                                                        {project.ProjectStatusInfo?.tinh_trang_quyet_toan_den_30_6_2025 && (
                                                            <div className="text-xs">
                                                                <span className="text-txt-muted">Trạng thái QT: </span>
                                                                <span className="font-semibold text-txt-primary">{project.ProjectStatusInfo.tinh_trang_quyet_toan_den_30_6_2025}</span>
                                                            </div>
                                                        )}
                                                        {project.ProjectStatusInfo?.cong_no_den_30_6_2025 !== undefined && (
                                                            <div className="text-xs">
                                                                <span className="text-txt-muted">Công nợ: </span>
                                                                <span className="font-bold text-rose-500">{formatVND(project.ProjectStatusInfo.cong_no_den_30_6_2025)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Sau bàn giao */}
                                            {(project.ProjectStatusInfo?.tinh_trang_quyet_toan_sau_ban_giao || project.ProjectStatusInfo?.cong_no_sau_ban_giao !== undefined) && (
                                                <div className="rounded-xl border border-border-subtle bg-bg-muted/30 p-2.5">
                                                    <div className="text-[10px] font-bold text-txt-muted mb-1">Sau khi bàn giao</div>
                                                    <div className="space-y-1">
                                                        {project.ProjectStatusInfo?.tinh_trang_quyet_toan_sau_ban_giao && (
                                                            <div className="text-xs">
                                                                <span className="text-txt-muted">Trạng thái QT: </span>
                                                                <span className="font-semibold text-txt-primary">{project.ProjectStatusInfo.tinh_trang_quyet_toan_sau_ban_giao}</span>
                                                            </div>
                                                        )}
                                                        {project.ProjectStatusInfo?.cong_no_sau_ban_giao !== undefined && (
                                                            <div className="text-xs">
                                                                <span className="text-txt-muted">Công nợ: </span>
                                                                <span className="font-bold text-rose-500">{formatVND(project.ProjectStatusInfo.cong_no_sau_ban_giao)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Tồn tại vướng mắc bàn giao */}
                                {project.ProjectStatusInfo?.ton_tai_vuong_mac_ban_giao && (
                                    <div className="px-2.5 pb-1">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
                                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Tồn tại, vướng mắc bàn giao</span>
                                        </div>
                                        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed bg-amber-50 dark:bg-amber-950/20 rounded-xl p-2.5 border border-amber-200 dark:border-amber-900/30">
                                            {project.ProjectStatusInfo.ton_tai_vuong_mac_ban_giao}
                                        </p>
                                    </div>
                                )}

                                {/* Chậm tiến độ & Kiến nghị */}
                                {project.ProjectStatusInfo?.cham_tien_do && (
                                    <div className="px-2.5 pb-1 space-y-2 border-t border-border-subtle pt-2">
                                        <div className="flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Thông tin chậm tiến độ & Kiến nghị</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                            {project.ProjectStatusInfo.cham_tien_do.thoi_gian_hoan_thanh && (
                                                <div className="flex justify-between items-center bg-bg-muted rounded-lg p-2 border border-border-subtle">
                                                    <span className="text-txt-muted text-[11px]">Hạn hoàn thành:</span>
                                                    <span className="font-semibold text-txt-primary">{project.ProjectStatusInfo.cham_tien_do.thoi_gian_hoan_thanh}</span>
                                                </div>
                                            )}
                                            {project.ProjectStatusInfo.cham_tien_do.thoi_gian_cham && (
                                                <div className="flex justify-between items-center bg-bg-muted rounded-lg p-2 border border-border-subtle">
                                                    <span className="text-txt-muted text-[11px]">Thời gian chậm:</span>
                                                    <span className="font-semibold text-rose-500">{project.ProjectStatusInfo.cham_tien_do.thoi_gian_cham}</span>
                                                </div>
                                            )}
                                        </div>
                                        {project.ProjectStatusInfo.cham_tien_do.nguyen_nhan && (
                                            <div className="bg-bg-muted rounded-xl p-2.5 border border-border-subtle">
                                                <div className="text-[10px] font-bold text-txt-muted mb-1">Nguyên nhân chậm trễ:</div>
                                                <p className="text-xs text-txt-secondary leading-relaxed">{project.ProjectStatusInfo.cham_tien_do.nguyen_nhan}</p>
                                            </div>
                                        )}
                                        {project.ProjectStatusInfo.cham_tien_do.bien_phap_da_ap_dung && (
                                            <div className="bg-bg-muted rounded-xl p-2.5 border border-border-subtle">
                                                <div className="text-[10px] font-bold text-txt-muted mb-1">Biện pháp đã áp dụng:</div>
                                                <p className="text-xs text-txt-secondary leading-relaxed">{project.ProjectStatusInfo.cham_tien_do.bien_phap_da_ap_dung}</p>
                                            </div>
                                        )}
                                        {project.ProjectStatusInfo.cham_tien_do.kien_nghi_de_xuat && (
                                            <div className="bg-emerald-50 dark:bg-emerald-950/15 rounded-xl p-2.5 border border-emerald-100 dark:border-emerald-900/30">
                                                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">Kiến nghị, đề xuất giải pháp:</div>
                                                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">{project.ProjectStatusInfo.cham_tien_do.kien_nghi_de_xuat}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                    {/* ═══ Tiến độ giải ngân ═══ */}
                    <BudgetVarianceCard
                        totalInvestment={project.TotalInvestment}
                        disbursedAmount={disbursedAmount}
                        luyKeNghiemThu={capitalSummary?.summary.totalLuyKeNghiemThu || 0}
                        plannedDisbursement={project.PlannedDisbursement || disbursementData?.planned || 0}
                        previousMonthDisbursed={disbursementData?.prevMonth || 0}
                    />

                    {/* ═══ GANTT CHART (Tiến độ thực hiện) ═══ */}
                    <GanttChartWidget
                        projectId={project.ProjectID}
                        onViewAll={onTabChange ? () => onTabChange('plan') : undefined}
                    />
                </div>

                {/* ── RIGHT COLUMN (1/3) ── */}
                <div className="space-y-2.5">
                    {/* Project Team (moved from left) */}
                    <ProjectTeamSection
                        members={projectMembers}
                        onViewMember={onViewMember}
                    />

                    {/* Key Dates */}
                    <KeyDatesWidget
                        dates={keyDates}
                        maxItems={4}
                        onViewAll={() => {}}
                    />

                    {/* Quick Actions — compact */}
                    <QuickActionsPanel
                        onGenerateMonthlyReport={() => onGenerateReport('Monitoring')}
                        onExportKhoiCong={() => setShowExportKhoiCong(true)}
                        onSendReminder={() => {}}
                        onExportExcel={() => {}}
                        onScheduleMeeting={() => {}}
                        onSync={onSync}
                        isSyncing={isSyncing}
                    />

                    {/* Contractors */}
                    <ContractorsListSection
                        contractors={projectContractors}
                        packages={projectPackages}
                        onViewContractor={handleViewContractor}
                        onViewPackage={onViewPackage}
                    />
                </div>
            </div>

            {/* Template Export Modal for Mẫu 16 */}
            {/* Template Export Modal for Mẫu 16 */}
            <TemplateExportModal
                isOpen={showExportKhoiCong}
                onClose={() => setShowExportKhoiCong(false)}
                templatePath="mau-16-thong-bao-khoi-cong.md"
                templateLabel="Thông báo khởi công"
                project={project}
                packages={projectPackages}
            />
        </div>
    );
};

// ─── Enhanced InfoItem with icon, hover, and optional copy ───

const EnhancedInfoItem: React.FC<{
    icon: React.ElementType;
    label: string;
    value: string;
    highlight?: boolean;
    copyable?: boolean;
}> = ({ icon: Icon, label, value, highlight, copyable }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }, [value]);

    return (
        <div className="group flex items-center gap-2 px-2.5 py-1.5 border-b border-border-subtle last:border-b-0 hover:bg-bg-muted transition-colors">
            <div className="w-6 h-6 rounded-md bg-bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary-500/10 transition-colors">
                <Icon className="w-3 h-3 text-txt-muted group-hover:text-primary-500 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-[10px] text-txt-muted uppercase tracking-wide font-medium">{label}</span>
                <p className={`text-xs truncate ${highlight ? 'text-primary-500 font-bold' : 'text-txt-secondary font-medium'}`}>
                    {value || '—'}
                </p>
            </div>
            {copyable && value && (
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-bg-muted transition-all"
                    title="Sao chép"
                >
                    {copied
                         ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                         : <Copy className="w-3.5 h-3.5 text-txt-muted" />
                    }
                </button>
            )}
        </div>
    );
};

export default ProjectInfoTab;
