import React, { useState, useMemo, useCallback } from 'react';
import { useContractors } from '../../hooks/useContractors';
import { ContractorService } from '../../services/ContractorService';
import { Contractor, ContractorType, CONTRACTOR_TYPE_LABELS } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, X, Search, Users, HardHat, Ruler, Eye, MapPin, Phone, User, Calendar, Loader2, Hash, AlertCircle, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Building2, Download } from 'lucide-react';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { ContractorDetailPanel } from '../projects/components/ContractorDetailPanel';
import { exportContractorsToExcel } from '../../utils/contractorExcelIO';
import { StatCard } from '../../components/ui';
import { SkeletonStatCard } from '../../components/ui/Skeleton';

const ContractorList: React.FC = () => {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const { openPanel } = useSlidePanel();
    const { contractors, isLoading, error: loadError } = useContractors();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<ContractorType | ''>('');
    const [saving, setSaving] = useState(false);
    const [sortKey, setSortKey] = useState<'FullName' | 'TaxCode' | 'ContractorType' | 'Representative' | ''>('');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentContractor, setCurrentContractor] = useState<Partial<Contractor>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Stats by ContractorType
    const totalContractors = contractors.length;
    const typeCounts = contractors.reduce((acc, c) => {
        const t = c.ContractorType || 'Construction';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Filter — search + type
    const filteredContractors = useMemo(() => {
        let result = contractors.filter(c => {
            if (typeFilter && c.ContractorType !== typeFilter) return false;
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return c.FullName.toLowerCase().includes(term) ||
                (c.TaxCode || '').toLowerCase().includes(term) ||
                (c.Address || '').toLowerCase().includes(term) ||
                (c.Representative || '').toLowerCase().includes(term);
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
    }, [contractors, searchTerm, typeFilter, sortKey, sortDir]);

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
            className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest cursor-pointer select-none hover:text-primary-600 dark:hover:text-primary-400 transition-colors ${className}`}
            onClick={() => toggleSort(field)}
        >
            <span className="inline-flex items-center gap-1">
                {label}
                <ArrowUpDown className={`w-3 h-3 ${sortKey === field ? 'text-primary-600 dark:text-primary-400' : 'text-gray-300 dark:text-slate-600'}`} />
            </span>
        </th>
    );

    const handleAdd = () => {
        setIsEditing(false);
        setFormErrors({});
        setCurrentContractor({
            FullName: '',
            TaxCode: '',
            CapCertCode: '',
            IsForeign: false,
            ContractorType: 'Construction',
            Address: '',
            ContactInfo: '',
            Representative: '',
            EstablishedYear: undefined,
        });
        setIsModalOpen(true);
    };

    const handleEdit = (e: React.MouseEvent, contractor: Contractor) => {
        e.stopPropagation();
        setIsEditing(true);
        setFormErrors({});
        setCurrentContractor({ ...contractor });
        setIsModalOpen(true);
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
            showToast(`Lỗi xóa: ${err.message}`, 'error');
        } finally {
            setSaving(false);
            setIsDeleteConfirmOpen(false);
            setDeleteTarget(null);
        }
    };

    // Validate MST format: 10 or 13 digits
    const validateTaxCode = (code: string): string | null => {
        if (!code) return null; // optional
        const cleaned = code.replace(/[\s-]/g, '');
        if (!/^\d{10}(\d{3})?$/.test(cleaned)) {
            return 'MST phải có 10 hoặc 13 chữ số';
        }
        return null;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};

        if (!currentContractor?.FullName?.trim()) {
            errors.FullName = 'Vui lòng nhập tên nhà thầu';
        }
        const taxErr = validateTaxCode(currentContractor.TaxCode || '');
        if (taxErr) errors.TaxCode = taxErr;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});

        try {
            setSaving(true);
            if (isEditing && currentContractor.ContractorID) {
                await ContractorService.update(currentContractor.ContractorID, currentContractor);
                showToast('Đã cập nhật thông tin nhà thầu', 'success');
            } else {
                // DB auto-generates ContractorID
                await ContractorService.create(currentContractor);
                showToast('Đã thêm nhà thầu mới thành công', 'success');
            }
            await queryClient.invalidateQueries({ queryKey: ['contractors'] });
            setIsModalOpen(false);
        } catch (err: any) {
            if (err.message?.includes('idx_contractors_tax_code_unique')) {
                setFormErrors({ TaxCode: 'Mã số thuế đã tồn tại trong hệ thống' });
            } else {
                showToast(`Lỗi lưu: ${err.message}`, 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const stats = [
        { label: 'Tổng nhà thầu', value: totalContractors, icon: Users, color: 'blue' as const },
        { label: 'Thi công', value: typeCounts['Construction'] || 0, icon: HardHat, color: 'emerald' as const },
        { label: 'Tư vấn / Giám sát', value: (typeCounts['Consultancy'] || 0) + (typeCounts['Supervision'] || 0), icon: Ruler, color: 'amber' as const },
        { label: 'Khác', value: totalContractors - (typeCounts['Construction'] || 0) - (typeCounts['Consultancy'] || 0) - (typeCounts['Supervision'] || 0), icon: Eye, color: 'violet' as const },
    ];

    const CONTRACTOR_TYPE_COLORS: Record<string, string> = {
        Construction: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
        Consultancy: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
        Supervision: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
        Survey: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
        Appraisal: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
        Supplier: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
        Other: 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300',
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

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <StatCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            icon={<stat.icon className="w-4 h-4" />}
                            color={stat.color}
                        />
                    ))}
                </div>
            )}

            {/* Toolbar */}
            <div className="bg-[#FCF9F2] dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="relative max-w-sm flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, mã số thuế, địa chỉ..."
                            className="filter-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as ContractorType | '')}
                                className="pl-8 pr-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-medium text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Tất cả loại hình</option>
                                {(Object.entries(CONTRACTOR_TYPE_LABELS) as [ContractorType, string][]).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Actions Divider */}
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>

                        <button
                            onClick={() => exportContractorsToExcel(filteredContractors)}
                            className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                            title="Xuất danh sách nhà thầu ra file Excel"
                        >
                            <Download className="w-4 h-4" /> Export Excel
                        </button>
                        
                        <button
                            onClick={handleAdd}
                            className="btn btn-primary shrink-0 ml-1.5"
                        >
                            <Plus className="w-5 h-5" /> Thêm nhà thầu
                        </button>
                    </div>
            </div>

            {/* Danh sách */}
            <div className="bg-[#FCF9F2] dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mt-4">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)]">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-[#F5EFE6] dark:bg-slate-800">
                                <th className="px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-widest w-12">STT</th>
                                <SortHeader label="Mã số thuế" field="TaxCode" />
                                <SortHeader label="Tên nhà thầu" field="FullName" />
                                <SortHeader label="Người đại diện" field="Representative" />
                                <SortHeader label="Loại hình" field="ContractorType" className="text-center" />
                                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest">Địa chỉ / Liên hệ</th>
                                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
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
                                        className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group"
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
                                        <td className="px-3 py-4 text-center text-xs text-gray-500 dark:text-slate-400 font-medium">{(page - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-600">
                                                {contractor.TaxCode || contractor.ContractorID}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-slate-100 max-w-xs">
                                            <div className="truncate" title={contractor.FullName}>{contractor.FullName}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                                            {contractor.Representative ? (
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
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
                                            <div className="flex items-center gap-1.5 truncate max-w-xs font-medium text-gray-900 dark:text-slate-200" title={contractor.Address}>
                                                <MapPin className="w-3 h-3 text-gray-400 dark:text-slate-500 shrink-0" />
                                                {contractor.Address || '—'}
                                            </div>
                                            {contractor.ContactInfo && (
                                                <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500 mt-0.5">
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
                                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Không tìm thấy nhà thầu nào</p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Thử thay đổi từ khóa tìm kiếm</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                        Hiển thị {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filteredContractors.length)}-{Math.min(page * ITEMS_PER_PAGE, filteredContractors.length)} / {filteredContractors.length} nhà thầu
                    </span>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 disabled:opacity-30 transition-colors"
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
                                                    : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    </React.Fragment>
                                ))}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#FCF9F2] dark:bg-slate-800 rounded-2xl shadow-sm w-full max-w-lg border border-gray-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                                {isEditing ? 'Cập nhật thông tin' : 'Thêm nhà thầu mới'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-4 space-y-4">
                            {/* Row: Tên nhà thầu */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tên nhà thầu <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    value={currentContractor.FullName || ''}
                                    onChange={e => { setCurrentContractor(prev => ({ ...prev, FullName: e.target.value })); setFormErrors(prev => ({ ...prev, FullName: '' })); }}
                                    placeholder="VD: Công Ty CP Tư Vấn XD..."
                                />
                                {formErrors.FullName && <p className="text-red-500 text-xs mt-1">{formErrors.FullName}</p>}
                            </div>

                            {/* Row: Loại hình nhà thầu */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Loại hình <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    value={currentContractor.ContractorType || 'Construction'}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, ContractorType: e.target.value as ContractorType }))}
                                >
                                    {(Object.entries(CONTRACTOR_TYPE_LABELS) as [ContractorType, string][]).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Row: MST + Năm thành lập */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                        <Hash className="w-3 h-3 inline mr-1" />Mã số thuế
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-mono"
                                        value={currentContractor.TaxCode || ''}
                                        onChange={e => { setCurrentContractor(prev => ({ ...prev, TaxCode: e.target.value })); setFormErrors(prev => ({ ...prev, TaxCode: '' })); }}
                                        placeholder="0100106112"
                                    />
                                    {formErrors.TaxCode && <p className="text-red-500 text-xs mt-1">{formErrors.TaxCode}</p>}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                        <Calendar className="w-3 h-3 inline mr-1" />Năm thành lập
                                    </label>
                                    <input
                                        type="number"
                                        min="1900"
                                        max="2030"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        value={currentContractor.EstablishedYear || ''}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, EstablishedYear: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        placeholder="1998"
                                    />
                                </div>
                            </div>

                            {/* Row: Người đại diện */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    <User className="w-3 h-3 inline mr-1" />Người đại diện
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    value={currentContractor.Representative || ''}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, Representative: e.target.value }))}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>

                            {/* Row: Địa chỉ */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    <MapPin className="w-3 h-3 inline mr-1" />Địa chỉ
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    value={currentContractor.Address || ''}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, Address: e.target.value }))}
                                />
                            </div>

                            {/* Row: Email + Website */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                        📧 Email
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        value={currentContractor.Email || ''}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, Email: e.target.value }))}
                                        placeholder="info@contractor.vn"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                        🌐 Website
                                    </label>
                                    <input
                                        type="url"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        value={currentContractor.Website || ''}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, Website: e.target.value }))}
                                        placeholder="https://contractor.vn"
                                    />
                                </div>
                            </div>

                            {/* Row: Liên hệ + Chứng chỉ */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                        <Phone className="w-3 h-3 inline mr-1" />Điện thoại
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        value={currentContractor.ContactInfo || ''}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, ContactInfo: e.target.value }))}
                                        placeholder="024 xxxx xxxx"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Mã chứng chỉ năng lực</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        value={currentContractor.CapCertCode || ''}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, CapCertCode: e.target.value }))}
                                    />
                                </div>
                            </div>



                            {/* Actions */}
                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-slate-700 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                    disabled={saving}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-primary disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#FCF9F2] dark:bg-slate-800 rounded-2xl shadow-sm w-full max-w-sm border border-gray-200 dark:border-slate-700 p-4 animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-2">Xác nhận xóa</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Bạn có chắc chắn muốn xóa nhà thầu này? Thao tác này không thể hoàn tác.</p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setIsDeleteConfirmOpen(false); setDeleteTarget(null); }}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
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
