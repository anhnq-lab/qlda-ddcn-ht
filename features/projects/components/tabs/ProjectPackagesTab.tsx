import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProjectService from '../../../../services/ProjectService';
import { BiddingPackage, PackageStatus, Project } from '../../../../types';
import { formatCurrency } from '../../../../utils/format';
import { BiddingPackageDetail } from '../BiddingPackageDetail';
import { BiddingPackagePanel } from '../BiddingPackagePanel';
import { PackageStatsDashboard } from './PackageStatsDashboard';
import { exportBiddingPackagesToExcel } from '../../../../utils/biddingExcelIO';
import { useSlidePanel } from '../../../../context/SlidePanelContext';
import { useToast } from '../../../../components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, Download, Edit, Trash2, Package2,
    Clock, AlertTriangle, CheckCircle2, MoreVertical, Loader2, GripVertical,
    ChevronDown, Check, FileText
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { ActionMenu } from '../../../../components/common/ActionMenu';

// ========================================
// PROJECT PACKAGES TAB - Flat List UI
// ========================================

interface ProjectPackagesTabProps {
    projectID: string;
    project?: Project | null;
    openPackageId?: string | null;
    initialDetailTab?: 'overview' | 'contractor' | 'contract' | 'settlement';
}

export const ProjectPackagesTab: React.FC<ProjectPackagesTabProps> = ({ projectID, project, openPackageId, initialDetailTab }) => {
    const queryClient = useQueryClient();
    const { openPanel, closePanel } = useSlidePanel();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const { data: packages, isLoading, error } = useQuery({
        queryKey: ['project-packages', projectID],
        queryFn: () => ProjectService.getPackagesByProject(projectID)
    });

     const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPackageIds, setSelectedPackageIds] = useState<Set<string>>(new Set());

    // Drag and Drop State
    const [draggedPkgId, setDraggedPkgId] = useState<string | null>(null);
    const [dragOverPkgId, setDragOverPkgId] = useState<string | null>(null);

    // Auto-open logic
    const autoOpenRef = useRef<string | null>(null);
    const [autoOpenProcessed, setAutoOpenProcessed] = useState<string | null>(null);
    const [activeDropdownPkgId, setActiveDropdownPkgId] = useState<string | null>(null);
    useEffect(() => {
        if (openPackageId && packages && packages.length > 0 && autoOpenRef.current !== openPackageId) {
            const targetPkg = packages.find(p => p.PackageID === openPackageId);
            if (targetPkg) {
                autoOpenRef.current = openPackageId;
                handleView(targetPkg);
                setAutoOpenProcessed(openPackageId);
            }
        }
    }, [openPackageId, packages]);

    const deleteMutation = useMutation({
        mutationFn: (packageId: string) => ProjectService.deletePackage(packageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-packages', projectID] });
            queryClient.invalidateQueries({ queryKey: ['all-packages'] });
            addToast({ title: 'Thành công', message: 'Đã xóa gói thầu', type: 'success' });
        },
        onError: (err: any) => {
            console.error('Lỗi khi xóa gói thầu:', err);
            addToast({
                title: 'Lỗi',
                message: err?.message || 'Không thể xóa gói thầu (gói thầu có thể đang liên kết với hợp đồng hoặc dữ liệu khác)',
                type: 'error'
            });
        }
    });

    const updateSortMutation = useMutation({
        mutationFn: async (updates: { packageId: string; sortOrder: number }[]) => {
            await Promise.all(updates.map(u =>
                (supabase.from('bidding_packages') as any)
                    .update({ sort_order: u.sortOrder })
                    .eq('package_id', u.packageId)
            ));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-packages', projectID] });
        },
    });

    const updateQuickStatusMutation = useMutation({
        mutationFn: async ({ packageId, status }: { packageId: string; status: PackageStatus }) => {
            return ProjectService.updatePackage(packageId, { Status: status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-packages', projectID] });
            queryClient.invalidateQueries({ queryKey: ['all-packages'] });
            addToast({ title: 'Thành công', message: 'Đã cập nhật trạng thái gói thầu', type: 'success' });
            setActiveDropdownPkgId(null);
        },
        onError: (err: any) => {
            console.error('Lỗi cập nhật trạng thái nhanh:', err);
            addToast({ title: 'Lỗi', message: 'Không thể cập nhật trạng thái', type: 'error' });
        }
    });

    const handleQuickStatusChange = (e: React.MouseEvent, pkg: BiddingPackage, newStatus: PackageStatus) => {
        e.stopPropagation();
        
        if (pkg.Status === newStatus) {
            setActiveDropdownPkgId(null);
            return;
        }

        // Kiểm tra điều kiện khi chuyển sang Đang thực hiện
        if (newStatus === PackageStatus.Execution) {
            const hasWinner = pkg.WinningContractorID || pkg.WinningContractorName;
            const hasApprovalDate = pkg.ApprovalDate_Result;
            
            if (!hasWinner || !hasApprovalDate) {
                const missingParts = [];
                if (!hasWinner) missingParts.push('Nhà thầu trúng thầu');
                if (!hasApprovalDate) missingParts.push('Ngày phê duyệt kết quả LCNT');
                
                const confirmMsg = `Gói thầu này chưa cập nhật đầy đủ thông tin: ${missingParts.join(', ')}.\nBạn có chắc chắn muốn chuyển sang trạng thái "Đang thực hiện" không?`;
                if (!window.confirm(confirmMsg)) {
                    setActiveDropdownPkgId(null);
                    return;
                }
            }
        }

        // Xác nhận chuyển trạng thái
        const confirmChange = window.confirm(`Xác nhận chuyển trạng thái gói thầu sang "${getStatusLabel(newStatus)}"?`);
        if (confirmChange) {
            updateQuickStatusMutation.mutate({ packageId: pkg.PackageID, status: newStatus });
        } else {
            setActiveDropdownPkgId(null);
        }
    };

    const getStatusColor = (status: PackageStatus) => {
        switch (status) {
            case PackageStatus.Selection: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case PackageStatus.Execution: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case PackageStatus.Completed: return 'bg-bg-muted text-txt-secondary border-border';
            default: return 'bg-bg-muted text-txt-primary border-border';
        }
    };

    const getStatusLabel = (status: PackageStatus) => {
        switch (status) {
            case PackageStatus.Selection: return 'Lựa chọn nhà thầu';
            case PackageStatus.Execution: return 'Đang thực hiện';
            case PackageStatus.Completed: return 'Kết thúc';
            default: return status;
        }
    };

    const filteredPackages = packages?.filter(pkg => {
        const matchesStatus = filterStatus === 'all' || pkg.Status === filterStatus;
        const matchesSearch = pkg.PackageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.PackageNumber.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    }).sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0)) || [];

    const handleView = (pkg: BiddingPackage) => {
        openPanel({
            title: pkg.PackageName,
            icon: <Package2 className="w-5 h-5 text-primary-500" />,
            component: (
                <BiddingPackageDetail
                    package_data={pkg}
                    initialTab={initialDetailTab}
                    isOpen={true}
                    asSlidePanel={true}
                    onClose={() => closePanel()}
                    onEdit={(p) => {
                        closePanel();
                        handleEdit(p);
                    }}
                />
            )
        });
    };

    const handleCreate = () => {
        openPanel({
            title: 'Thêm mới gói thầu',
            icon: <Plus className="w-5 h-5 text-primary-500" />,
            component: (
                <BiddingPackagePanel
                    projectId={projectID}
                    onClose={() => closePanel()}
                />
            ),
            width: '50vw'
        });
    };

    const handleEdit = (pkg: BiddingPackage) => {
        openPanel({
            title: 'Chỉnh sửa gói thầu',
            icon: <Edit className="w-5 h-5 text-primary-500" />,
            component: (
                <BiddingPackagePanel
                    projectId={projectID}
                    packageToEdit={pkg}
                    onClose={() => closePanel()}
                />
            ),
            width: '50vw'
        });
    };

    const handleDelete = (pkg: BiddingPackage) => {
        if (confirm(`Bạn có chắc chắn muốn xóa gói thầu "${pkg.PackageName}"?`)) {
            deleteMutation.mutate(pkg.PackageID);
        }
    };

    // Drag & Drop
    const handleDragStart = (e: React.DragEvent, pkgId: string) => {
        e.dataTransfer.effectAllowed = 'move';
        setDraggedPkgId(pkgId);
    };

    const handleDragOver = (e: React.DragEvent, pkgId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverPkgId(pkgId);
    };

    const handleDragLeave = () => {
        setDragOverPkgId(null);
    };

    const handleDrop = (e: React.DragEvent, targetPkgId: string) => {
        e.preventDefault();
        if (!draggedPkgId || draggedPkgId === targetPkgId) {
            setDraggedPkgId(null);
            setDragOverPkgId(null);
            return;
        }

        const fromIdx = filteredPackages.findIndex(p => p.PackageID === draggedPkgId);
        const toIdx = filteredPackages.findIndex(p => p.PackageID === targetPkgId);
        if (fromIdx === -1 || toIdx === -1) return;

        const reordered = [...filteredPackages];
        const [moved] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, moved);

        const updates = reordered.map((pkg, idx) => ({
            packageId: pkg.PackageID,
            sortOrder: idx + 1,
        }));

        updateSortMutation.mutate(updates);
        setDraggedPkgId(null);
        setDragOverPkgId(null);
    };

    const handleDragEnd = () => {
        setDraggedPkgId(null);
        setDragOverPkgId(null);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500 dark:text-slate-400 font-sans"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Đang tải dữ liệu...</div>;
    
    if (error && (!packages || packages.length === 0)) return (
        <div className="flex flex-col items-center justify-center p-12 bg-bg-surface rounded-2xl border border-border font-sans">
            <Package2 className="w-12 h-12 text-txt-muted mb-4" />
            <p className="text-txt-muted mb-4 text-sm">Chưa có gói thầu nào</p>
            <button
                onClick={handleCreate}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl flex items-center gap-2 hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
            >
                <Plus className="w-4 h-4" /> Thêm gói thầu mới
            </button>
        </div>
    );

    return (
        <div className="space-y-6 font-sans">
            <PackageStatsDashboard packages={packages || []} />

            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm gói thầu..."
                            className="pl-9 pr-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64 bg-bg-surface text-txt-primary placeholder-txt-muted"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-bg-surface text-txt-primary"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value={PackageStatus.Selection}>Lựa chọn nhà thầu</option>
                        <option value={PackageStatus.Execution}>Đang thực hiện</option>
                        <option value={PackageStatus.Completed}>Kết thúc</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => packages && exportBiddingPackagesToExcel(packages, project?.ProjectName || 'DuAn')}
                        disabled={!packages || packages.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-emerald-500/30 text-emerald-500 rounded-xl hover:bg-bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        <Download size={16} />
                        <span>Xuất Excel</span>
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
                    >
                        <Plus size={16} />
                        <span>Thêm gói thầu</span>
                    </button>
                </div>
            </div>

            <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                {filteredPackages.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse text-left">
                            <thead className="bg-bg-muted text-xs font-semibold text-txt-muted uppercase border-b border-border">
                                <tr>
                                    <th className="px-3 py-3 w-10 text-center"></th>
                                    <th className="px-4 py-3 w-12 text-center">TT</th>
                                    <th className="px-4 py-3">Tên gói thầu</th>
                                    <th className="px-4 py-3 text-right">Giá trị (VNĐ)</th>
                                    <th className="px-4 py-3">Hợp đồng</th>
                                    <th className="px-4 py-3">Nhà thầu trúng thầu</th>
                                    <th className="px-4 py-3 text-center">% TH</th>
                                    <th className="px-4 py-3">Loại HĐ</th>
                                    <th className="px-4 py-3 text-center">Trạng thái</th>
                                    <th className="px-4 py-3 w-12 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredPackages.map((pkg, index) => (
                                    <tr
                                        key={pkg.PackageID}
                                        className={`hover:bg-bg-muted/50 transition-colors cursor-pointer group ${draggedPkgId === pkg.PackageID ? 'opacity-40' : ''} ${dragOverPkgId === pkg.PackageID ? 'ring-2 ring-primary-500 ring-inset bg-primary-500/5' : ''}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, pkg.PackageID)}
                                        onDragOver={(e) => handleDragOver(e, pkg.PackageID)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, pkg.PackageID)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleView(pkg)}
                                    >
                                        <td className="px-3 py-4 text-center cursor-grab" onClick={(e) => e.stopPropagation()}>
                                            <GripVertical className="w-4 h-4 text-txt-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </td>
                                        <td className="px-4 py-4 text-center font-medium text-txt-muted">{index + 1}</td>
                                        <td className="px-4 py-4">
                                            <div className="font-semibold text-txt-primary">{pkg.PackageName}</div>
                                            {pkg.PackageNumber && <div className="text-xs text-txt-muted mt-1">Mã: {pkg.PackageNumber}</div>}
                                        </td>
                                        <td className="px-4 py-4 text-right font-semibold text-txt-primary tabular-nums">
                                            {formatCurrency(pkg.Price)}
                                            {pkg.WinningPrice && pkg.WinningPrice < pkg.Price && (
                                                <div className="text-xs text-emerald-500 font-normal mt-0.5">
                                                    Trúng: {formatCurrency(pkg.WinningPrice)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); navigate(`/contracts?package=${pkg.PackageID}`); }}
                                                className="text-primary-500 hover:text-primary-600 transition-colors"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            {pkg.WinningContractorName ? (
                                                <span className="text-xs font-medium text-txt-secondary leading-tight">
                                                    {pkg.WinningContractorName}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-txt-muted italic">Chưa chọn</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {pkg.Status === PackageStatus.Execution || pkg.Status === PackageStatus.Completed ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-xs font-bold text-primary-500">
                                                        {pkg.CompletionPct ?? 0}%
                                                    </span>
                                                    <div className="w-16 h-1.5 bg-bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary-500 rounded-full"
                                                            style={{ width: `${pkg.CompletionPct ?? 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-txt-muted">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-txt-secondary text-sm">
                                            {(pkg.ContractType as any) === 'LumpSum' ? 'Trọn gói' :
                                                (pkg.ContractType as any) === 'UnitPrice' ? 'Đơn giá' :
                                                    pkg.ContractType || '-'}
                                        </td>
                                         <td className="px-4 py-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                                             <button
                                                 onClick={(e) => {
                                                     e.stopPropagation();
                                                     setActiveDropdownPkgId(activeDropdownPkgId === pkg.PackageID ? null : pkg.PackageID);
                                                 }}
                                                 disabled={updateQuickStatusMutation.isPending}
                                                 className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all duration-200 hover:bg-opacity-80 active:scale-95 shadow-sm cursor-pointer disabled:opacity-50 ${getStatusColor(pkg.Status)}`}
                                             >
                                                 {pkg.Status === PackageStatus.Selection && <Clock className="w-3 h-3" />}
                                                 {pkg.Status === PackageStatus.Execution && <AlertTriangle className="w-3 h-3" />}
                                                 {pkg.Status === PackageStatus.Completed && <CheckCircle2 className="w-3 h-3" />}
                                                 <span>{getStatusLabel(pkg.Status)}</span>
                                                 <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                                             </button>

                                             {activeDropdownPkgId === pkg.PackageID && (
                                                 <>
                                                     <div
                                                         className="fixed inset-0 z-10"
                                                         onClick={(e) => {
                                                             e.stopPropagation();
                                                             setActiveDropdownPkgId(null);
                                                         }}
                                                     />
                                                     <div className="absolute right-4 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 py-1.5 z-20 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                                                         <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                                             Chuyển trạng thái nhanh
                                                         </div>
                                                         {[
                                                             { value: PackageStatus.Selection, label: 'Lựa chọn nhà thầu', color: 'text-blue-500 hover:bg-blue-500/5 dark:hover:bg-blue-500/10' },
                                                             { value: PackageStatus.Execution, label: 'Đang thực hiện', color: 'text-emerald-500 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10' },
                                                             { value: PackageStatus.Completed, label: 'Kết thúc', color: 'text-gray-500 dark:text-slate-400 hover:bg-slate-500/5 dark:hover:bg-slate-500/10' }
                                                         ].map((item) => (
                                                             <button
                                                                 key={item.value}
                                                                 onClick={(e) => handleQuickStatusChange(e, pkg, item.value)}
                                                                 className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${item.color} ${pkg.Status === item.value ? 'bg-slate-50/50 dark:bg-slate-700/30' : ''}`}
                                                             >
                                                                 <span>{item.label}</span>
                                                                 {pkg.Status === item.value && <Check className="w-3.5 h-3.5" />}
                                                             </button>
                                                         ))}
                                                     </div>
                                                 </>
                                             )}
                                         </td>
                                        <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <ActionMenu
                                                items={[
                                                    {
                                                        label: 'Chỉnh sửa',
                                                        icon: Edit,
                                                        onClick: () => handleEdit(pkg),
                                                    },
                                                    {
                                                        label: 'Xóa',
                                                        icon: Trash2,
                                                        onClick: () => handleDelete(pkg),
                                                        variant: 'danger',
                                                    },
                                                ]}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <Search className="w-10 h-10 text-txt-muted mx-auto mb-3" />
                        <p className="text-txt-muted mb-4 font-medium text-sm">Không tìm thấy gói thầu phù hợp</p>
                        <button onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                            className="px-4 py-2 text-sm font-medium text-primary-500 border border-primary-500/30 rounded-xl hover:bg-bg-muted transition-colors">
                            Xóa bộ lọc
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
