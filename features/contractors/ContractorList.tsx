import React, { useState, useMemo, useCallback } from 'react';
import { useContractors } from '../../hooks/useContractors';
import { ContractorService } from '../../services/ContractorService';
import { Contractor, ContractorType, CONTRACTOR_TYPE_LABELS } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, X, Search, Users, HardHat, Ruler, Eye, MapPin, Phone, User, Calendar, Loader2, Hash, AlertCircle, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Building2, Download } from 'lucide-react';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { ContractorDetailPanel } from '../../components/common/ContractorDetailPanel';
import { ContractorFormPanel } from './ContractorFormPanel';
import { exportContractorsToExcel } from '../../utils/contractorExcelIO';

const ContractorList: React.FC = () => {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const { openPanel } = useSlidePanel();
    const { contractors, isLoading, error: loadError } = useContractors();
    const [typeFilter, setTypeFilter] = useState<ContractorType | ''>('');
    const [saving, setSaving] = useState(false);
    const [sortKey, setSortKey] = useState<'FullName' | 'TaxCode' | 'ContractorType' | 'Representative' | ''>('');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Modal State for Delete
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    // Stats by ContractorType
    const totalContractors = contractors.length;
    const typeCounts = contractors.reduce((acc, c) => {
        const t = c.ContractorType || 'Construction';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Filter — search removed, only type
    const filteredContractors = useMemo(() => {
        let result = contractors.filter(c => {
            if (typeFilter && c.ContractorType !== typeFilter) return false;
            return true;
        });

        // Sort
        if (sortKey) {
            result = [...result].sort((a, b) => {
                const valA = (a[sortKey] || '').toString().toLowerCase();
                const valB = (b[sortKey] || '').toString().toLowerCase();
                return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            });
        }

        return result;
    }, [contractors, typeFilter, sortKey, sortDir]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredContractors.length / ITEMS_PER_PAGE));
    const paginatedContractors = filteredContractors.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const toggleSort = (key: typeof sortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
        setPage(1);
    };

    const SortHeader = ({ label, field, className = '' }: { label: string; field: typeof sortKey; className?: string }) => (
        <th
            className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer select-none hover:text-primary-600 dark:hover:text-primary-400 transition-colors ${className}`}
            onClick={() => toggleSort(field)}
        >
            <span className="inline-flex items-center gap-1">
                {label}
                <ArrowUpDown className={`w-3 h-3 ${sortKey === field ? 'text-primary-600 dark:text-primary-400' : 'text-gray-300 dark:text-slate-600'}`} />
            </span>
        </th>
    );

    const handleAdd = () => {
        openPanel({
            title: 'Thêm nhà thầu',
            icon: <Building2 size={14} />,
            url: '/contractors/new',
            width: 768,
            component: <ContractorFormPanel onSuccess={() => queryClient.invalidateQueries({ queryKey: ['contractors'] })} />
        });
    };

    const handleEdit = (e: React.MouseEvent, contractor: Contractor) => {
        e.stopPropagation();
        openPanel({
            title: 'Chỉnh sửa nhà thầu',
            icon: <Building2 size={14} />,
            url: `/contractors/${contractor.ContractorID}/edit`,
            width: 768,
            component: <ContractorFormPanel contractor={contractor} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['contractors'] })} />
        });
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteTarget(id);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            setSaving(true);
            await ContractorService.delete(deleteTarget);
            await queryClient.invalidateQueries({ queryKey: ['contractors'] });
            showToast('Đã xóa nhà thầu thành công', 'success');
        } catch (err: any) {
            console.error('Delete contractor error:', err);
            let errorMessage = `Lỗi xóa: ${err.message}`;
            const errorMsgStr = String(err.message || '');
            if (errorMsgStr.includes('contracts_contractor_id_fkey') || (errorMsgStr.includes('foreign key constraint') && errorMsgStr.includes('contracts'))) {
                errorMessage = 'Không thể xóa nhà thầu này vì đang có hợp đồng liên kết trong hệ thống. Vui lòng xóa hoặc cập nhật các hợp đồng liên quan trước.';
            } else if (errorMsgStr.includes('package_bidders') || errorMsgStr.includes('bidding_packages')) {
                errorMessage = 'Không thể xóa nhà thầu này vì đang liên kết với thông tin gói thầu hoặc hồ sơ dự thầu.';
            } else if (errorMsgStr.includes('violates foreign key constraint') || errorMsgStr.includes('foreign key constraint')) {
                errorMessage = 'Không thể xóa nhà thầu này do đang có dữ liệu liên kết khác trong hệ thống. Vui lòng kiểm tra và xóa các liên kết trước.';
            }
            showToast(errorMessage, 'error');
        } finally {
            setSaving(false);
            setIsDeleteConfirmOpen(false);
            setDeleteTarget(null);
        }
    };


    const stats = [
        { label: 'Tổng nhà thầu', value: totalContractors, icon: Users, color: 'blue' as const },
        { label: 'Thi công', value: typeCounts['Construction'] || 0, icon: HardHat, color: 'emerald' as const },
        { label: 'Tư vấn / Giám sát', value: (typeCounts['Consultancy'] || 0) + (typeCounts['Supervision'] || 0), icon: Ruler, color: 'warning' as const },
        { label: 'Khác', value: totalContractors - (typeCounts['Construction'] || 0) - (typeCounts['Consultancy'] || 0) - (typeCounts['Supervision'] || 0), icon: Eye, color: 'violet' as const },
    ];

    const CONTRACTOR_TYPE_COLORS: Record<string, string> = {
        Construction: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
        Consultancy: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
        Supervision: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
        Survey: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
        Appraisal: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
        Supplier: 'bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-300',
        Other: 'bg-gray-100 dark:bg-gray-900 text-txt-secondary',
    };

    return (
        <div className="space-y-6">

            {/* Error State */}
            {loadError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Không tải được danh sách nhà thầu: {(loadError as Error).message}</span>
                </div>
            )}

            {/* Toolbar & Stats */}
            <div className="bg-bg-surface rounded-2xl border border-border shadow-sm p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                {/* Stats Badges */}
                {isLoading ? (
                    <div className="flex flex-wrap items-center gap-2.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-8 w-24 bg-bg-muted rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center gap-2.5">
                        {stats.map((stat) => {
                            const Icon = stat.icon;
                            const colorStyles: Record<string, string> = {
                                blue: 'bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border-blue-100/50 dark:border-blue-900/20',
                                emerald: 'bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/20',
                                warning: 'bg-amber-50/50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/20',
                                violet: 'bg-purple-50/50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 border-purple-100/50 dark:border-purple-900/20',
                            };
                            const styleClass = colorStyles[stat.color] || colorStyles.blue;
                            
                            return (
                                <div
                                    key={stat.label}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${styleClass}`}
                                >
                                    <Icon className="w-3.5 h-3.5 opacity-80" />
                                    <span className="opacity-90">{stat.label}:</span>
                                    <span className="font-extrabold text-sm leading-none">{stat.value}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Filter and Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:justify-end">
                    <div className="relative">
                        <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-txt-placeholder" />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as ContractorType | '')}
                            className="pl-8 pr-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-medium text-txt-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Tất cả loại hình</option>
                            {(Object.entries(CONTRACTOR_TYPE_LABELS) as [ContractorType, string][]).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Actions Divider */}
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

                    <button
                        onClick={() => exportContractorsToExcel(filteredContractors)}
                        className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
                        title="Xuất danh sách nhà thầu ra file Excel"
                    >
                        <Download className="w-4 h-4" /> Export Excel
                    </button>
                    
                    <button
                        onClick={handleAdd}
                        className="btn btn-primary shrink-0 flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" /> Thêm nhà thầu
                    </button>
                </div>
            </div>

            {/* Danh sách */}
            <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden mt-4">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)]">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-bg-subtle text-[10px] font-black uppercase tracking-widest border-b border-border shadow-sm shadow-slate-200/20">
                            <tr className="text-txt-muted">
                                <th className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest w-12 border-b border-border">STT</th>
                                <SortHeader label="Mã số thuế" field="TaxCode" />
                                <SortHeader label="Tên nhà thầu" field="FullName" />
                                <SortHeader label="Người đại diện" field="Representative" />
                                <SortHeader label="Loại hình" field="ContractorType" className="text-center" />
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b border-border">Địa chỉ / Liên hệ</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-right border-b border-border">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {isLoading ? (
                                // Loading skeleton
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : paginatedContractors.length > 0 ? (
                                paginatedContractors.map((contractor, index) => (
                                    <tr
                                        key={contractor.ContractorID}
                                        className="group cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-slate-700"
                                        onClick={() => openPanel({
                                            title: contractor.FullName,
                                            icon: <Building2 size={14} />,
                                            url: `/contractors/${contractor.ContractorID}`,
                                            component: (
                                                <ContractorDetailPanel
                                                    contractorId={contractor.ContractorID}
                                                />
                                            ),
                                        })}
                                    >
                                        <td className="px-3 py-4 text-center text-xs text-txt-muted font-medium">{(page - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs font-bold text-txt-muted bg-bg-muted px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-600">
                                                {contractor.TaxCode || contractor.ContractorID}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-txt-primary max-w-xs">
                                            <div className="truncate" title={contractor.FullName}>{contractor.FullName}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-txt-secondary">
                                            {contractor.Representative ? (
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-txt-placeholder shrink-0" />
                                                    {contractor.Representative}
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 dark:text-slate-600">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${CONTRACTOR_TYPE_COLORS[contractor.ContractorType] || CONTRACTOR_TYPE_COLORS.Other}`}>
                                                {CONTRACTOR_TYPE_LABELS[contractor.ContractorType] || 'Khác'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <div className="flex items-center gap-1.5 truncate max-w-xs font-medium text-txt-primary" title={contractor.Address}>
                                                <MapPin className="w-3 h-3 text-txt-placeholder shrink-0" />
                                                {contractor.Address || '—'}
                                            </div>
                                            {contractor.ContactInfo && (
                                                <div className="flex items-center gap-1.5 text-txt-placeholder mt-0.5">
                                                    <Phone className="w-3 h-3 shrink-0" />
                                                    {contractor.ContactInfo}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleEdit(e, contractor)}
                                                    className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                                                    title="Chỉnh sửa nhà thầu"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, contractor.ContractorID)}
                                                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                                    title="Xóa nhà thầu"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <Search className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-txt-muted">Không tìm thấy nhà thầu nào</p>
                                        <p className="text-xs text-txt-placeholder mt-1">Thử thay đổi từ khóa tìm kiếm</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-txt-muted">
                        Hiển thị {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filteredContractors.length)}-{Math.min(page * ITEMS_PER_PAGE, filteredContractors.length)} / {filteredContractors.length} nhà thầu
                    </span>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-1.5 rounded-lg hover:bg-bg-muted text-txt-muted disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                        {i > 0 && arr[i - 1] !== p - 1 && <span className="text-gray-300 dark:text-slate-600 text-xs px-1">...</span>}
                                        <button
                                            onClick={() => setPage(p)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                                                p === page
                                                    ? 'bg-primary-600 text-white shadow-sm'
                                                    : 'hover:bg-bg-muted text-txt-muted'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    </React.Fragment>
                                ))}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="p-1.5 rounded-lg hover:bg-bg-muted text-txt-muted disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>


            {/* Delete Confirmation Modal */}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-bg-surface rounded-2xl shadow-sm w-full max-w-sm border border-border p-4 animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-txt-primary mb-2">Xác nhận xóa</h3>
                            <p className="text-sm text-txt-muted">Bạn có chắc chắn muốn xóa nhà thầu này? Thao tác này không thể hoàn tác.</p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setIsDeleteConfirmOpen(false); setDeleteTarget(null); }}
                                className="flex-1 px-4 py-2.5 bg-bg-muted text-txt-muted text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                disabled={saving}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractorList;
