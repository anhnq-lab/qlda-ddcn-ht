import React, { useState, useCallback, useEffect, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualList } from '../../hooks/useVirtualList';
import { useProjectsRealtime } from '../../hooks/useProjectsRealtime';
import { useInvalidateProjects } from '../../hooks/usePaginatedProjects';
import { ProjectGroup, MANAGEMENT_BOARDS, ProjectStatus, PROJECT_CURRENT_STATUS_CONFIG } from '../../types';
import { ProjectCard, STATUS_CONFIG } from './ProjectCard';
import { ProgressBar, DataTable, Column } from '../../components/ui';
import { formatShortCurrency as formatCurrency } from '../../utils/format';
import { getGroupGradient, getGroupColor } from '../../utils/projectCompliance';
import PermissionGate from '../../components/PermissionGate';
import { Plus, Filter, ChevronRight, ChevronLeft, Calendar, FileText, CheckCircle, BarChart3, Clock, AlertTriangle, Layers, Maximize2, Search, LayoutGrid, List as ListIcon, ArrowUpDown, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ProjectImportModal } from './components/ProjectImportModal';
import { SelectedMember } from '../../types';
import ProjectService from '../../services/ProjectService';
import { Project } from '../../types';
import { supabase } from '../../lib/supabase';
import ExcelJS from 'exceljs';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { useImpersonation } from '../../context/ImpersonationContext';
import { useAuth } from '../../context/AuthContext';
import { extractBanNumber } from '../../hooks/useScopedProjects';

// ── PaginationBar — memo để tránh re-render không cần thiết khi filter/sort thay đổi ──
const PaginationBar = memo(({ page, totalPages, total, pageSize, onPageChange }: {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onPageChange: (p: number) => void;
}) => {
    if (totalPages <= 1) return null;
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, total);

    return (
        <div className="flex items-center justify-between bg-bg-surface rounded-2xl border border-border px-4 py-2.5 mt-3">
            <span className="text-xs text-txt-muted font-medium">
                Hiển thị {startItem}-{endItem} / {total} dự án
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg hover:bg-bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Trang trước"
                >
                    <ChevronLeft className="w-4 h-4 text-txt-secondary" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                        pageNum = i + 1;
                    } else if (page <= 4) {
                        pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                    } else {
                        pageNum = page - 3 + i;
                    }
                    return (
                        <button
                            key={pageNum}
                            onClick={() => onPageChange(pageNum)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                page === pageNum
                                    ? 'bg-primary-500 text-white shadow-sm'
                                    : 'text-txt-secondary hover:bg-bg-muted'
                            }`}
                        >
                            {pageNum}
                        </button>
                    );
                })}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg hover:bg-bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Trang sau"
                >
                    <ChevronRight className="w-4 h-4 text-txt-secondary" />
                </button>
            </div>
        </div>
    );
});
PaginationBar.displayName = 'PaginationBar';

import { ProjectMemberService } from '../../services/ProjectMemberService';
import { STATUS_OPTIONS, CURRENT_STATUS_OPTIONS, GROUP_OPTIONS, SortOption } from './hooks/useProjectFilters';
import { useProjectFilterContext } from '../../context/ProjectFilterContext';
import { useToast } from '../../components/ui/Toast';
import { ProjectFilters } from '../../components/common/ProjectFilters';

const ProjectList: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();

    // ── Real-time: auto-refresh when other users modify projects ──
    useProjectsRealtime();
    const invalidateProjects = useInvalidateProjects();

    // ── Auth & Permissions ──
    const { currentUser } = useAuth();
    const { isGlobalScope, systemRole } = usePermissionCheck();
    const { impersonatedUser, isImpersonating } = useImpersonation();
    const effectiveUser = isImpersonating && impersonatedUser ? impersonatedUser : currentUser;
    const banNumber = useMemo(() => extractBanNumber(effectiveUser?.Department), [effectiveUser]);

    // ── Filter + Data from shared Context (same instance as Header) ──
    const { can } = usePermissionCheck();
    const systemRoleCheck = usePermissionCheck();
    
    console.log('[DEBUG-ProjectList] systemRole:', systemRoleCheck.systemRole);
    console.log('[DEBUG-ProjectList] can("projects", "create"):', can('projects', 'create'));
    console.log('[DEBUG-ProjectList] loading:', systemRoleCheck.loading);

    const {
        searchQuery, setSearchQuery,
        sortBy, setSortBy,
        page, setPage,
        viewMode, setViewMode,
        hasActiveFilters, clearFilters,
        scopedProjects, total, totalPages, pageSize,
        isLoading, isFetching, refetch,
        queryParams,
    } = useProjectFilterContext();

    // Create & Import Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    // Responsive setup
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleCreateProject = () => {
        setIsModalOpen(true);
    };

    const handleSaveProject = async (data: Partial<Project> & { StartDate: Date }, members: SelectedMember[]) => {
        try {
            // 1. Create Project
            const newProject = await ProjectService.create(data);

            // 2. Save Project Members
            if (members.length > 0) {
                try {
                    await ProjectMemberService.saveMembers(newProject.ProjectID, members);
                } catch (memberError: any) {
                    console.error('Failed to save members:', memberError.message);
                    addToast({ title: 'Cảnh báo', message: 'Tạo dự án thành công nhưng lưu thành viên thất bại.', type: 'warning' });
                }
            }

            // 3. Notify and Navigate
            invalidateProjects();
            setIsModalOpen(false);
            addToast({ title: 'Thành công', message: `Đã tạo dự án "${newProject.ProjectName}"`, type: 'success' });
            navigate(`/projects/${newProject.ProjectID}`);
        } catch (error) {
            console.error('Error creating project:', error);
            const errObj = error as any;
            addToast({
                title: 'Lỗi tạo dự án',
                message: errObj?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.',
                type: 'error',
            });
        }
    };

    // Open project detail — full page navigation
    const handleOpenProject = useCallback((project: Project) => {
        navigate(`/projects/${project.ProjectID}`);
    }, [navigate]);

    const handleExportExcel = async () => {
        try {
            // Build filter params with board scope injected
            const exportParams = {
                search: queryParams.search,
                filters: { ...queryParams.filters },
                sortBy: queryParams.sortBy,
                sortOrder: queryParams.sortOrder,
            };

            if (!isGlobalScope && systemRole !== 'super_admin' && systemRole !== 'contractor' && banNumber !== null) {
                exportParams.filters.board = banNumber.toString();
            }

            let allProjects = await ProjectService.getAll(exportParams);

            if (systemRole === 'contractor') {
                const allowedIds = effectiveUser?.AllowedProjectIDs || [];
                allProjects = allProjects.filter(p => allowedIds.includes(p.ProjectID));
            }

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Danh sách dự án');

            // Columns definition
            ws.columns = [
                { header: 'STT', key: 'stt', width: 6 },
                { header: 'Mã dự án', key: 'project_id', width: 25 },
                { header: 'Tên dự án', key: 'project_name', width: 40 },
                { header: 'Nhóm', key: 'group_code', width: 10 },
                { header: 'Loại hình đầu tư', key: 'investment_type', width: 25 },
                { header: 'Tổng mức đầu tư', key: 'total_investment', width: 20 },
                { header: 'Nguồn vốn', key: 'capital_source', width: 25 },
                { header: 'Trạng thái', key: 'status', width: 20 },
                { header: 'Hiện trạng chi tiết', key: 'current_status', width: 30 },
                { header: 'Địa điểm', key: 'location_code', width: 20 },
                { header: 'Lĩnh vực', key: 'sector', width: 20 },
                { header: 'Cấp QĐ chủ trương', key: 'policy_level', width: 20 },
                { header: 'Số QĐ chủ trương', key: 'policy_number', width: 20 },
                { header: 'Ngày QĐ chủ trương', key: 'policy_date', width: 20 },
                { header: 'Phòng QLDA', key: 'management_board', width: 20 },
                { header: 'Chủ đầu tư cũ', key: 'old_investor', width: 25 },
                { header: 'Quyết định điều chuyển', key: 'transfer_decision', width: 25 },
                { header: 'Ngày khởi công', key: 'start_date', width: 15 },
                { header: 'Hạn chót dự kiến', key: 'expected_end_date', width: 15 },
                { header: 'Thực tế kết thúc', key: 'actual_end_date', width: 15 },
                { header: 'Tiến độ vật lý (%)', key: 'progress', width: 15 },
                { header: 'Tiến độ giải ngân (%)', key: 'payment_progress', width: 15 },
            ];

            // Title block
            ws.insertRow(1, []);
            ws.insertRow(2, [null, 'DANH SÁCH DỰ ÁN CHI TIẾT']);
            ws.mergeCells('B2:K2');
            const titleRow = ws.getRow(2);
            titleRow.height = 32;
            titleRow.getCell(2).font = { name: 'Times New Roman', bold: true, size: 16, color: { argb: 'FF1F4E78' } };
            titleRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

            ws.insertRow(3, [null, `Xuất ngày: ${new Date().toLocaleDateString('vi-VN')} | Tổng số: ${allProjects.length} dự án`]);
            ws.mergeCells('B3:K3');
            const subtitleRow = ws.getRow(3);
            subtitleRow.height = 20;
            subtitleRow.getCell(2).font = { name: 'Times New Roman', italic: true, size: 11, color: { argb: 'FF595959' } };
            subtitleRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

            ws.insertRow(4, []);

            // Headers style
            const headerRow = ws.getRow(5);
            headerRow.height = 28;
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1F4E78' }
                };
                cell.font = { name: 'Times New Roman', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                };
            });

            // Map and add rows
            const PROJECT_STATUS_LABELS: Record<number, string> = {
                1: 'Chuẩn bị dự án',
                2: 'Thực hiện dự án',
                3: 'Kết thúc xây dựng',
            };

            const INVESTMENT_TYPE_LABELS: Record<number, string> = {
                1: 'Đầu tư công',
                2: 'Vốn NN ngoài ĐTC',
                3: 'PPP',
                4: 'Khác',
            };

            allProjects.forEach((proj, idx) => {
                const boardLabel = proj.ManagementBoard ? `Phòng QLDA ${proj.ManagementBoard}` : '';
                const currentStatusLabel = proj.CurrentStatusCode ? (PROJECT_CURRENT_STATUS_CONFIG[proj.CurrentStatusCode]?.label || '') : '';
                
                const row = ws.addRow({
                    stt: idx + 1,
                    project_id: proj.ProjectID,
                    project_name: proj.ProjectName,
                    group_code: proj.GroupCode ? `Nhóm ${proj.GroupCode}` : '',
                    investment_type: INVESTMENT_TYPE_LABELS[proj.InvestmentType] || '',
                    total_investment: proj.TotalInvestment || 0,
                    capital_source: proj.CapitalSource || '',
                    status: PROJECT_STATUS_LABELS[proj.Status] || '',
                    current_status: currentStatusLabel,
                    location_code: proj.LocationCode || '',
                    sector: proj.Sector || '',
                    policy_level: proj.PolicyDecisionLevel || '',
                    policy_number: proj.PolicyDecisionNumber || '',
                    policy_date: proj.PolicyDecisionDate || '',
                    management_board: boardLabel,
                    old_investor: proj.OldInvestor || '',
                    transfer_decision: proj.TransferDecision || '',
                    start_date: proj.StartDate || '',
                    expected_end_date: proj.ExpectedEndDate || '',
                    actual_end_date: proj.ActualEndDate || '',
                    progress: proj.Progress || 0,
                    payment_progress: proj.PaymentProgress || 0,
                });

                row.height = 22;

                // Color based on status
                let rowColor = 'FFFFFFFF';
                if (proj.Status === 3) {
                    rowColor = 'FFE2EFDA'; // Light green
                }

                row.eachCell({ includeEmpty: true }, (cell, cellNumber) => {
                    cell.font = { name: 'Times New Roman', size: 10 };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: rowColor }
                    };
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                        right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    };

                    // Alignments
                    if ([1, 2, 4, 8, 10, 14, 15, 18, 19, 20, 21, 22].includes(cellNumber)) {
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    } else if (cellNumber === 6) { // TotalInvestment
                        cell.alignment = { horizontal: 'right', vertical: 'middle' };
                        cell.numFmt = '#,##0';
                    } else {
                        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
                    }
                });
            });

            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DS_DuAn_${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Lỗi khi xuất file Excel:', error);
            alert('Có lỗi xảy ra khi xuất file Excel.');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Mau_Import_DuAn');

            // Columns definition
            ws.columns = [
                { header: 'Tên dự án (*)', key: 'project_name', width: 35 },
                { header: 'Mã dự án (chỉ điền khi muốn cập nhật)', key: 'project_id', width: 25 },
                { header: 'Nhóm dự án (QN/A/B/C)', key: 'group_code', width: 20 },
                { header: 'Loại hình đầu tư (Đầu tư công / Vốn nhà nước ngoài đầu tư công / PPP / Khác)', key: 'investment_type', width: 30 },
                { header: 'Tổng mức đầu tư (VNĐ)', key: 'total_investment', width: 22 },
                { header: 'Nguồn vốn', key: 'capital_source', width: 25 },
                { header: 'Trạng thái (Chuẩn bị dự án / Thực hiện dự án / Kết thúc xây dựng)', key: 'status', width: 30 },
                { header: 'Hiện trạng chi tiết (ví dụ: Đang thi công)', key: 'current_status', width: 30 },
                { header: 'Địa điểm', key: 'location_code', width: 20 },
                { header: 'Lĩnh vực', key: 'sector', width: 20 },
                { header: 'Cấp quyết định chủ trương', key: 'policy_level', width: 25 },
                { header: 'Số QĐ chủ trương', key: 'policy_number', width: 20 },
                { header: 'Ngày QĐ chủ trương (YYYY-MM-DD)', key: 'policy_date', width: 25 },
                { header: 'Phòng QLDA (Phòng 1/Phòng 2/Phòng 3)', key: 'management_board', width: 25 },
                { header: 'Chủ đầu tư cũ', key: 'old_investor', width: 25 },
                { header: 'Quyết định điều chuyển', key: 'transfer_decision', width: 25 },
                { header: 'Ngày khởi công (YYYY-MM-DD)', key: 'start_date', width: 25 },
                { header: 'Hạn chót dự kiến (YYYY-MM-DD)', key: 'expected_end_date', width: 25 },
                { header: 'Thực tế kết thúc (YYYY-MM-DD)', key: 'actual_end_date', width: 25 },
                { header: 'Tiến độ vật lý (%)', key: 'progress', width: 18 },
                { header: 'Tiến độ giải ngân (%)', key: 'payment_progress', width: 20 },
            ];

            // Title block
            ws.insertRow(1, []);
            ws.insertRow(2, [null, 'MẪU FILE NHẬP DỰ ÁN HÀNG LOẠT (PROJECT IMPORT TEMPLATE)']);
            ws.mergeCells('B2:M2');
            const titleRow = ws.getRow(2);
            titleRow.height = 32;
            titleRow.getCell(2).font = { name: 'Times New Roman', bold: true, size: 15, color: { argb: 'FFC00000' } };
            titleRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

            ws.insertRow(3, [
                null,
                'HƯỚNG DẪN: Các cột có dấu (*) là bắt buộc. Nhập đúng các giá trị trong ngoặc đơn ở tiêu đề cột. Định dạng ngày là YYYY-MM-DD.'
            ]);
            ws.mergeCells('B3:M3');
            const subtitleRow = ws.getRow(3);
            subtitleRow.height = 20;
            subtitleRow.getCell(2).font = { name: 'Times New Roman', italic: true, size: 10, color: { argb: 'FF595959' } };
            subtitleRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

            ws.insertRow(4, []);

            // Table headers style
            const headerRow = ws.getRow(5);
            headerRow.height = 30;
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF3B82F6' }
                };
                cell.font = { name: 'Times New Roman', bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                };
            });

            // Add sample row
            const sampleRow = ws.addRow({
                project_name: 'Dự án Đầu tự xây dựng tuyến đường trục chính kết nối khu công nghiệp X',
                project_id: '', // Empty for new project
                group_code: 'B',
                investment_type: 'Đầu tư công',
                total_investment: 150000000000,
                capital_source: 'Ngân sách Trung ương',
                status: 'Thực hiện dự án',
                current_status: 'Đang thi công',
                location_code: 'Hà Tĩnh',
                sector: 'Transport',
                policy_level: 'UBND tỉnh',
                policy_number: '123/QĐ-UBND',
                policy_date: '2025-01-15',
                management_board: 'Phòng QLDA 1',
                old_investor: 'CĐT Cũ X',
                transfer_decision: '456/QĐ-TC',
                start_date: '2025-03-01',
                expected_end_date: '2026-12-31',
                actual_end_date: '',
                progress: 30,
                payment_progress: 25,
            });

            sampleRow.height = 24;
            sampleRow.eachCell((cell, cellNumber) => {
                cell.font = { name: 'Times New Roman', size: 9, italic: true, color: { argb: 'FF808080' } };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                };
                cell.alignment = { vertical: 'middle', wrapText: true };
                if (cellNumber === 5) {
                    cell.numFmt = '#,##0';
                }
            });

            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Mau_Import_DuAn.xlsx';
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Lỗi khi tải mẫu Excel:', error);
            alert('Có lỗi xảy ra khi tải mẫu Excel.');
        }
    };

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300 pb-20">

                {/* MAIN LIST AREA — full width now that sidebar is removed */}
                <div className="flex-1 w-full space-y-4">

                    {/* Toolbar & Filters Container */}
                    <div className="bg-bg-surface p-2.5 pr-4 pl-4 rounded-2xl border border-border shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
                        {/* Filters on the left */}
                        <div className="flex flex-wrap items-center gap-2 flex-1 w-full lg:w-auto">
                            <ProjectFilters />
                        </div>

                        {/* Actions on the right */}
                        <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-between lg:justify-end">
                            {/* Result count */}
                            <span className="text-xs text-txt-muted font-medium whitespace-nowrap">
                                {total} dự án
                            </span>

                            <div className="h-6 w-px bg-border hidden lg:block"></div>

                            <div className="flex items-center gap-3">
                                <div className="flex bg-bg-muted p-0.5 rounded-lg border border-border/50">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-bg-surface shadow-sm text-primary-600 dark:text-primary-400' : 'text-txt-muted hover:text-txt-primary'}`}
                                        aria-label="Hiển thị dạng lưới"
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-bg-surface shadow-sm text-primary-600 dark:text-primary-400' : 'text-txt-muted hover:text-txt-primary'}`}
                                        aria-label="Hiển thị dạng danh sách"
                                    >
                                        <ListIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Sort Dropdown */}
                                <div className="flex items-center gap-1 bg-bg-muted/50 px-2 py-1.5 rounded-lg border border-border/50">
                                    <ArrowUpDown className="w-3.5 h-3.5 text-txt-muted" />
                                    <select
                                        value={sortBy}
                                        onChange={e => setSortBy(e.target.value as SortOption)}
                                        className="text-xs font-semibold bg-transparent border-none outline-none text-txt-secondary cursor-pointer"
                                        aria-label="Sắp xếp dự án"
                                    >
                                        <option value="name">Tên A→Z</option>
                                        <option value="budget">Ngân sách ↓</option>
                                        <option value="progress">Tiến độ ↓</option>
                                        <option value="created">Mới nhất</option>
                                    </select>
                                </div>

                                <PermissionGate resource="projects" action="view">
                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-txt-secondary hover:text-txt-primary border border-border/50 shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold h-8 transition-all"
                                        title="Tải mẫu nhập dự án từ Excel"
                                    >
                                        <Download className="w-3.5 h-3.5 text-txt-muted" />
                                        <span className="hidden md:inline">Tải Mẫu</span>
                                    </button>
                                </PermissionGate>

                                <PermissionGate resource="projects" action="create">
                                    <button
                                        onClick={() => setIsImportOpen(true)}
                                        className="inline-flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold h-8 shadow-sm transition-all"
                                        title="Nhập danh sách dự án từ Excel"
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        <span className="hidden md:inline">Nhập Excel</span>
                                    </button>
                                </PermissionGate>

                                <button
                                    onClick={handleExportExcel}
                                    className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold h-8 shadow-sm transition-all"
                                    title="Xuất danh sách dự án ra Excel"
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                    <span className="hidden md:inline">Xuất Excel</span>
                                </button>

                                <PermissionGate resource="projects" action="create">
                                    <button
                                        onClick={handleCreateProject}
                                        className="btn btn-primary shrink-0 py-1.5 text-xs h-8 flex items-center justify-center gap-1"
                                        title="Thêm mới dự án"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Thêm mới</span>
                                    </button>
                                </PermissionGate>
                            </div>
                        </div>
                    </div>

                    {/* Pagination fetch indicator — thin bar shown during page/filter changes */}
                    {isFetching && !isLoading && (
                        <div className="h-0.5 w-full rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/30">
                            <div className="h-full w-2/5 bg-primary-500 rounded-full animate-pulse" />
                        </div>
                    )}

                    {/* Content */}
                    <div className={`min-h-[400px] transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="bg-bg-surface h-72 rounded-2xl p-4 space-y-4 border border-border">
                                        <Skeleton className="h-40 w-full rounded-xl" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : scopedProjects.length === 0 ? (
                            <EmptyState
                                icon={
                                    <svg width="60" height="60" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="60" cy="60" r="56" fill="currentColor" className="text-bg-muted" />
                                        <rect x="30" y="35" width="60" height="45" rx="6" stroke="currentColor" strokeWidth="2" className="text-border" fill="none" />
                                        <path d="M30 47h60" stroke="currentColor" strokeWidth="2" className="text-border" />
                                        <circle cx="38" cy="41" r="2" fill="currentColor" className="text-border" />
                                        <circle cx="45" cy="41" r="2" fill="currentColor" className="text-border" />
                                        <circle cx="52" cy="41" r="2" fill="currentColor" className="text-border" />
                                        <path d="M50 62l6 6 14-14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-border" />
                                    </svg>
                                }
                                title={hasActiveFilters ? 'Không tìm thấy dự án phù hợp' : 'Chưa có dự án nào'}
                                description={hasActiveFilters
                                    ? 'Không có dự án nào phù hợp với bộ lọc hiện tại. Hãy thử thay đổi từ khóa hoặc bộ lọc.'
                                    : 'Hãy bắt đầu bằng việc tạo dự án đầu tiên.'}
                                className="bg-bg-surface rounded-2xl border border-border border-dashed"
                            >
                                {hasActiveFilters ? (
                                    <button
                                        onClick={clearFilters}
                                        className="text-primary-600 dark:text-primary-400 font-bold hover:underline text-sm"
                                    >
                                        Xóa tất cả bộ lọc
                                    </button>
                                ) : (
                                    <PermissionGate resource="projects" action="create">
                                        <button
                                            onClick={handleCreateProject}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-400 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-md active:scale-95"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Tạo dự án mới
                                        </button>
                                    </PermissionGate>
                                )}
                            </EmptyState>
                        ) : viewMode === 'list' ? (
                            <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
                                    <table className="w-full text-left text-sm">
                                        <thead className="sticky top-0 z-10 bg-bg-subtle text-[10px] font-black uppercase tracking-widest border-b border-border shadow-sm">
                                            <tr className="text-txt-muted">
                                                <th className="px-3 py-3 text-center w-12 border-b border-border">STT</th>
                                                <th className="px-4 py-3 min-w-[280px] border-b border-border">Tên dự án</th>
                                                <th className="px-4 py-3 text-center w-20 border-b border-border">Nhóm</th>
                                                <th className="px-4 py-3 text-center w-24 border-b border-border">Phòng QLDA</th>
                                                <th className="px-4 py-3 text-center w-36 border-b border-border">Giai đoạn</th>
                                                <th className="px-4 py-3 text-right w-28 border-b border-border">Tiến độ</th>
                                                <th className="px-4 py-3 text-right w-28 border-b border-border">Giải ngân</th>
                                                <th className="px-4 py-3 text-right w-32 border-b border-border">Tổng mức ĐT</th>
                                                <th className="px-4 py-3 min-w-[160px] border-b border-border">Nguồn vốn</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-subtle">
                                            {scopedProjects.map((project, index) => {
                                                const board = project.ManagementBoard ? MANAGEMENT_BOARDS.find(b => b.value === project.ManagementBoard) : null;
                                                const currentStatus = project.CurrentStatusCode ? PROJECT_CURRENT_STATUS_CONFIG[project.CurrentStatusCode] : null;
                                                const status = currentStatus || STATUS_CONFIG[project.Status] || { label: 'N/A', hex: '#9CA3AF' };
                                                
                                                return (
                                                    <tr
                                                        key={project.ProjectID}
                                                        className="group cursor-pointer transition-all duration-200 hover:bg-bg-muted"
                                                        onClick={() => handleOpenProject(project)}
                                                    >
                                                        {/* STT */}
                                                        <td className="px-3 py-4 text-center text-xs text-txt-muted font-medium tabular-nums">
                                                            {(page - 1) * pageSize + index + 1}
                                                        </td>
                                                        {/* Dự án */}
                                                        <td className="px-4 py-4">
                                                            <div className="flex flex-col">
                                                                <p className="font-semibold text-txt-primary text-sm leading-snug line-clamp-2 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                                                                    {project.ProjectName}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="font-mono text-[10px] text-txt-muted bg-bg-muted px-1 rounded">
                                                                        #{(project.ProjectID || '').slice(-5)}
                                                                    </span>
                                                                    {project.LocationCode && (
                                                                        <span className="text-[10px] text-txt-muted truncate max-w-[220px]">
                                                                            {project.LocationCode}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {/* Nhóm */}
                                                        <td className="px-4 py-4 text-center">
                                                            <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-full ${getGroupGradient(project.GroupCode)}`}>
                                                                Nhóm {project.GroupCode}
                                                            </span>
                                                        </td>
                                                        {/* Ban QLDA */}
                                                        <td className="px-4 py-4 text-center">
                                                            {board ? (
                                                                <span className="inline-flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: board.hex }}>
                                                                    Phòng {board.value}
                                                                </span>
                                                            ) : (
                                                                <span className="text-txt-muted">—</span>
                                                            )}
                                                        </td>
                                                        {/* Giai đoạn */}
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap" style={{ backgroundColor: status.hex }}>
                                                                {status.label}
                                                            </span>
                                                        </td>
                                                        {/* Tiến độ */}
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">{project.Progress || 0}%</span>
                                                                <ProgressBar value={project.Progress || 0} color="blue" size="sm" className="w-16" />
                                                            </div>
                                                        </td>
                                                        {/* Giải ngân */}
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{project.PaymentProgress || 0}%</span>
                                                                <ProgressBar value={project.PaymentProgress || 0} color="emerald" size="sm" className="w-16" />
                                                            </div>
                                                        </td>
                                                        {/* Tổng mức ĐT */}
                                                        <td className="px-4 py-4 text-right">
                                                            <span className="text-xs font-mono font-bold text-txt-primary tabular-nums whitespace-nowrap">
                                                                {formatCurrency(project.TotalInvestment)}
                                                            </span>
                                                        </td>
                                                        {/* Nguồn vốn */}
                                                        <td className="px-4 py-4">
                                                            <span className="text-[11px] text-txt-secondary line-clamp-2">
                                                                {project.CapitalSource || <span className="text-txt-muted">—</span>}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {scopedProjects.map(project => (
                                <ProjectCard
                                        key={project.ProjectID}
                                        project={project}
                                        onClick={handleOpenProject}
                                        layout="grid"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <PaginationBar
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        pageSize={50}
                        onPageChange={setPage}
                    />
                </div>

            {/* Create Project Modal */}
            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProject}
            />

            {/* Import Project Modal */}
            <ProjectImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
            />
        </div>
    );
};

export default ProjectList;