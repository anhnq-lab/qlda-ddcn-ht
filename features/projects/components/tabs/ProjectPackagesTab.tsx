import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProjectService from '../../../../services/ProjectService';
import ApiClient from '../../../../services/api';
import { BiddingPackage, PackageStatus, Project } from '../../../../types';
import { formatCurrency } from '../../../../utils/format';
import { BiddingPackageDetail } from '../BiddingPackageDetail';
import { BiddingPackagePanel } from '../BiddingPackagePanel';
import { PackageStatsDashboard } from './PackageStatsDashboard';
import { exportBiddingPackagesToExcel } from '../../../../utils/biddingExcelIO';
import { useSlidePanel } from '../../../../context/SlidePanelContext';
import { useToast } from '../../../../components/ui/Toast';
import {
    Search, Plus, Download, Edit, Trash2, Package2,
    Clock, AlertTriangle, CheckCircle2, MoreVertical, Loader2, GripVertical
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

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

    const { data: packages, isLoading, error } = useQuery({
        queryKey: ['project-packages', projectID],
        queryFn: () => ProjectService.getPackagesByProject(projectID)
    });

    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [selectedPackageIds, setSelectedPackageIds] = useState<Set<string>>(new Set());

    // Drag and Drop State
    const [draggedPkgId, setDraggedPkgId] = useState<string | null>(null);
    const [dragOverPkgId, setDragOverPkgId] = useState<string | null>(null);

    // Auto-open logic
    const [autoOpenProcessed, setAutoOpenProcessed] = useState<string | null>(null);
    useEffect(() => {
        if (openPackageId && packages && packages.length > 0 && autoOpenProcessed !== openPackageId) {
            const targetPkg = packages.find(p => p.PackageID === openPackageId);
            if (targetPkg) {
                handleView(targetPkg);
                setAutoOpenProcessed(openPackageId);
            }
        }
    }, [openPackageId, packages, autoOpenProcessed]);

    const deleteMutation = useMutation({
        mutationFn: (packageId: string) => ApiClient.delete(`/api/bidding-packages/${packageId}`, () => { }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-packages', projectID] });
            addToast({ title: 'Thành công', message: 'Đã xóa gói thầu', type: 'success' });
        },
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

    const getStatusColor = (status: PackageStatus) => {
        switch (status) {
            case PackageStatus.Selection: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800';
            case PackageStatus.Execution: return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800';
            case PackageStatus.Completed: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
            default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
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
        setOpenDropdownId(null);
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
        setOpenDropdownId(null);
    };

    const handleDelete = (pkg: BiddingPackage) => {
        if (confirm(`Bạn có chắc chắn muốn xóa gói thầu "${pkg.PackageName}"?`)) {
            deleteMutation.mutate(pkg.PackageID);
        }
        setOpenDropdownId(null);
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
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 font-sans">
            <Package2 className="w-12 h-12 text-gray-300 dark:text-slate-600 mb-4" />
            <p className="text-gray-500 dark:text-slate-400 mb-4 text-sm">Chưa có gói thầu nào</p>
            <button
                onClick={handleCreate}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm gói thầu..."
                            className="pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64 bg-white dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-slate-200"
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
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        <Download size={16} />
                        <span>Xuất Excel</span>
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm shadow-primary-200"
                    >
                        <Plus size={16} />
                        <span>Thêm gói thầu</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {filteredPackages.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-3 py-3 w-10 text-center"></th>
                                    <th className="px-4 py-3 w-12 text-center">TT</th>
                                    <th className="px-4 py-3">Tên gói thầu</th>
                                    <th className="px-4 py-3 text-right">Giá trị (VNĐ)</th>
                                    <th className="px-4 py-3">Nhà thầu trúng thầu</th>
                                    <th className="px-4 py-3 text-center">% TH</th>
                                    <th className="px-4 py-3">Hình thức LCNT</th>
                                    <th className="px-4 py-3">Loại HĐ</th>
                                    <th className="px-4 py-3 text-center">Trạng thái</th>
                                    <th className="px-4 py-3 w-12 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredPackages.map((pkg, index) => (
                                    <tr
                                        key={pkg.PackageID}
                                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group ${draggedPkgId === pkg.PackageID ? 'opacity-40' : ''} ${dragOverPkgId === pkg.PackageID ? 'ring-2 ring-blue-400 ring-inset bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, pkg.PackageID)}
                                        onDragOver={(e) => handleDragOver(e, pkg.PackageID)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, pkg.PackageID)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleView(pkg)}
                                    >
                                        <td className="px-3 py-4 text-center cursor-grab" onClick={(e) => e.stopPropagation()}>
                                            <GripVertical className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </td>
                                        <td className="px-4 py-4 text-center font-medium text-slate-500 dark:text-slate-400">{index + 1}</td>
                                        <td className="px-4 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100">{pkg.PackageName}</div>
                                            {pkg.PackageNumber && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mã: {pkg.PackageNumber}</div>}
                                        </td>
                                        <td className="px-4 py-4 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                            {formatCurrency(pkg.Price)}
                                            {pkg.WinningPrice && pkg.WinningPrice < pkg.Price && (
                                                <div className="text-xs text-green-600 dark:text-green-400 font-normal mt-0.5">
                                                    Trúng: {formatCurrency(pkg.WinningPrice)}
                                                </div>
                                            )}
                                        </td>
                                        {/* Nhà thầu trúng thầu — từ join query */}
                                        <td className="px-4 py-4">
                                            {pkg.WinningContractorName ? (
                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">
                                                    {pkg.WinningContractorName}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400 dark:text-slate-500 italic">Chưa chọn</span>
                                            )}
                                        </td>
                                        {/* % Tiến độ thực hiện — mini progress */}
                                        <td className="px-4 py-4 text-center">
                                            {pkg.Status === PackageStatus.Execution || pkg.Status === PackageStatus.Completed ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                                        {pkg.CompletionPct ?? 0}%
                                                    </span>
                                                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                                            style={{ width: `${pkg.CompletionPct ?? 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300 text-sm">
                                            {(pkg.SelectionMethod as any) === 'OpenBidding' ? 'Đấu thầu rộng rãi' :
                                                (pkg.SelectionMethod as any) === 'Appointed' ? 'Chỉ định thầu' :
                                                    pkg.SelectionMethod || '-'}
                                        </td>
                                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300 text-sm">
                                            {(pkg.ContractType as any) === 'LumpSum' ? 'Trọn gói' :
                                                (pkg.ContractType as any) === 'UnitPrice' ? 'Đơn giá' :
                                                    pkg.ContractType || '-'}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusColor(pkg.Status)}`}>
                                                {pkg.Status === PackageStatus.Selection && <Clock className="w-3 h-3" />}
                                                {pkg.Status === PackageStatus.Execution && <AlertTriangle className="w-3 h-3" />}
                                                {pkg.Status === PackageStatus.Completed && <CheckCircle2 className="w-3 h-3" />}
                                                {getStatusLabel(pkg.Status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setOpenDropdownId(openDropdownId === pkg.PackageID ? null : pkg.PackageID)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                {openDropdownId === pkg.PackageID && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)}></div>
                                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                                                            <button
                                                                onClick={() => { handleEdit(pkg); }}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                                            >
                                                                <Edit className="w-4 h-4" /> Chỉnh sửa
                                                            </button>
                                                            <button
                                                                onClick={() => { handleDelete(pkg); }}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            >
                                                                <Trash2 className="w-4 h-4" /> Xóa
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 mb-4 font-medium text-sm">Không tìm thấy gói thầu phù hợp</p>
                        <button onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                            className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                            Xóa bộ lọc
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
