import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Project, ProjectStage, Employee, BiddingPackage, Contractor } from '@/types';
import {
    Pencil, Clock, Info, Maximize, Target,
    Hash, Building2, MapPin, Briefcase, Wallet, Copy, Check, Ruler
} from 'lucide-react';
import { SyncResult } from '@/services/NationalGatewayService';
import { LifecycleStepper, StageHistoryEntry } from '../LifecycleStepper';
import { GanttChartWidget } from '../GanttChartWidget';
import { ProjectTeamSection } from '../ProjectTeamSection';
import { ContractorsListSection } from '../ContractorsListSection';
import { ContractorDetailPanel } from '../ContractorDetailPanel';
import { RiskIndicators } from '../RiskIndicators';
import { BudgetVarianceCard } from '../BudgetVarianceCard';
import { KeyDatesWidget, KeyDate } from '../KeyDatesWidget';
import { QuickActionsPanel } from '../QuickActionsPanel';
import { LegalReferenceLink } from '../../../../components/common/LegalReferenceLink';
import { useSlidePanel } from '@/context/SlidePanelContext';

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
    const { data: realDisbursedTotal = 0 } = useQuery<number>({
        queryKey: ['project-real-disbursed', project.ProjectID],
        queryFn: async () => {
            const { data: rows } = await (supabase
                .from('disbursements')
                .select('amount, type, status')
                .eq('project_id', project.ProjectID)
                .in('status', ['Approved', 'approved', 'completed', 'Completed']) as any);
            if (!rows || rows.length === 0) return 0;
            let total = 0;
            for (const r of rows as any[]) {
                const amt = Number(r.amount) || 0;
                if (r.type === 'ThuHoiTamUng') {
                    total -= amt;
                } else {
                    total += amt;
                }
            }
            return Math.max(0, total);
        },
        enabled: !!project.ProjectID,
        staleTime: 5 * 60 * 1000,
    });

    const disbursedAmount = realDisbursedTotal;
    const disbursedPercent = project.TotalInvestment > 0
        ? (disbursedAmount / project.TotalInvestment) * 100
        : 0;



    // ═══ FETCH KEY DATES FROM MULTIPLE SOURCES ═══
    const { data: keyDates = [] } = useQuery<KeyDate[]>({
        queryKey: ['project-key-dates-v2', project.ProjectID],
        queryFn: async () => {
            const now = new Date();
            const nowISO = now.toISOString();
            const results: KeyDate[] = [];

            // ── Source 1: Tasks (overdue + upcoming with priority) ──
            // Overdue tasks (no date limit — show ALL overdue)
            const { data: overdueTasks } = await supabase
                .from('tasks')
                .select('task_id, title, due_date, status, priority')
                .eq('project_id', project.ProjectID)
                .not('status', 'in', '("Done")')
                .lt('due_date', nowISO)
                .order('due_date', { ascending: true })
                .limit(5);

            for (const t of overdueTasks || []) {
                const dueDate = new Date(t.due_date);
                const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                results.push({
                    id: t.task_id,
                    title: t.title,
                    date: t.due_date?.split('T')[0] || '',
                    type: t.priority?.toLowerCase() === 'critical' ? 'milestone' : t.priority?.toLowerCase() === 'high' ? 'milestone' : 'deadline',
                    status: 'overdue',
                    description: `Quá hạn ${daysOverdue} ngày`,
                });
            }

            // Upcoming tasks — high/critical priority: up to 6 months, others: up to 90 days
            const in6Months = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
            const { data: upcomingTasks } = await supabase
                .from('tasks')
                .select('task_id, title, due_date, status, priority')
                .eq('project_id', project.ProjectID)
                .not('status', 'in', '("Done")')
                .gte('due_date', nowISO)
                .lte('due_date', in6Months)
                .order('due_date', { ascending: true })
                .limit(10);

            for (const t of upcomingTasks || []) {
                const dueDate = new Date(t.due_date);
                const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isHighPriority = ['high', 'critical'].includes(t.priority?.toLowerCase() || '');

                // For non-high priority, only show if within 90 days
                if (!isHighPriority && daysUntil > 90) continue;

                let status: KeyDate['status'] = 'upcoming';
                if (daysUntil <= 7) status = 'due-soon';

                results.push({
                    id: t.task_id,
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
                const endDate = new Date(ct.end_date);
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

    // Fetch real disbursement data for BudgetVarianceCard
    const { data: disbursementData } = useQuery({
        queryKey: ['project-disbursement-overview', project.ProjectID],
        queryFn: async () => {
            const now = new Date();
            const thisMonth = now.getMonth() + 1;
            const thisYear = now.getFullYear();
            const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
            const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;

            // Planned disbursement from capital_plans
            const { data: planData } = await supabase
                .from('capital_plans')
                .select('planned_amount')
                .eq('project_id', project.ProjectID)
                .eq('year', thisYear);
            const planned = planData?.reduce((s: number, r: any) => s + (r.planned_amount || 0), 0) || 0;

            // Previous month disbursement
            const { data: prevData } = await (supabase
                .from('disbursements')
                .select('amount')
                .eq('project_id', project.ProjectID) as any)
                .eq('month', lastMonth)
                .eq('year', lastMonthYear);
            const prevMonth = (prevData as any[])?.reduce((s: number, r: any) => s + (r.amount || 0), 0) || 0;

            return { planned, prevMonth };
        },
        enabled: !!project.ProjectID,
        staleTime: 5 * 60 * 1000,
    });

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
                            <button
                                onClick={onEditProject}
                                className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline font-bold"
                            >
                                <Pencil className="w-3 h-3" />
                                Chỉnh sửa
                            </button>
                        </div>
                        <div className="p-2.5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                                <EnhancedInfoItem icon={Hash} label="Số dự án" value={project.ProjectNumber || project.ProjectID} copyable />
                                <EnhancedInfoItem icon={Briefcase} label="Nhóm dự án" value={`Nhóm ${project.GroupCode}`} highlight />
                                <EnhancedInfoItem icon={Building2} label="Chủ đầu tư" value={project.InvestorName} />
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
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Mục tiêu đầu tư</span>
                                    </div>
                                    <p className="text-xs text-gray-700 dark:text-slate-200 leading-relaxed whitespace-pre-line bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-2.5 border border-blue-100 dark:border-blue-800/30">
                                        {project.Objective}
                                    </p>
                                </div>
                            )}

                            {/* Tóm tắt quy mô đầu tư */}
                            {project.InvestmentScale && (
                                <div className="mt-2 px-2.5 pb-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Ruler className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Tóm tắt quy mô đầu tư</span>
                                    </div>
                                    <p className="text-xs text-gray-700 dark:text-slate-200 leading-relaxed whitespace-pre-line bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg p-2.5 border border-emerald-100 dark:border-emerald-800/30">
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
                                        <div key={i} className={`rounded-lg border py-1.5 px-2 text-center
                                            ${item.color === 'red' ? 'border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/15' :
                                            item.color === 'blue' ? 'border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/15' :
                                            'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/15'}`}
                                        >
                                            <p className="text-[9px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{item.label}</p>
                                            <p className={`text-sm font-black tabular-nums
                                                ${item.color === 'red' ? 'text-red-600 dark:text-red-400' :
                                                item.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                                                'text-emerald-600 dark:text-emerald-400'}`}
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

                    {/* ═══ Tiến độ giải ngân ═══ */}
                    <BudgetVarianceCard
                        totalInvestment={project.TotalInvestment}
                        disbursedAmount={disbursedAmount}
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
        <div className="group flex items-center gap-2 px-2.5 py-1.5 border-b border-gray-100 dark:border-slate-700/50 last:border-b-0 hover:bg-bg-subtle dark:hover:bg-slate-700 transition-colors">
            <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                <Icon className="w-3 h-3 text-gray-400 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-[10px] text-gray-400 dark:text-slate-400 uppercase tracking-wide font-medium">{label}</span>
                <p className={`text-xs truncate ${highlight ? 'text-primary-700 dark:text-primary-400 font-bold' : 'text-gray-800 dark:text-slate-200 font-medium'}`}>
                    {value || '—'}
                </p>
            </div>
            {copyable && value && (
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                    title="Sao chép"
                >
                    {copied
                        ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                        : <Copy className="w-3.5 h-3.5 text-gray-400" />
                    }
                </button>
            )}
        </div>
    );
};

export default ProjectInfoTab;
