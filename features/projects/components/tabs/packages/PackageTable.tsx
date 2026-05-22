import React from 'react';
import {
    FileText, Search, Plus, Upload, GripVertical,
    Bell, Clock, AlertTriangle, CheckCircle2, Circle
} from 'lucide-react';
import { BiddingPackage, PackageStatus } from '../../../../../types';
import { formatCurrency } from '../../../../../utils/format';
import { ActionDropdown } from './ActionDropdown';
import { countPendingRequirements } from '../../../../../utils/mscCompliance';

type VisibleColumns = Record<string, boolean>;

interface PackageTableProps {
    planKey: string;
    packages: BiddingPackage[];
    allPlanPackages?: BiddingPackage[];  // before filter, for empty-state detection
    isUngrouped: boolean;
    visibleColumns: VisibleColumns;
    selectedPackageIds: Set<string>;
    openDropdownId: string | null;
    draggedPkgId: string | null;
    dragOverPkgId: string | null;
    searchTerm: string;
    filterStatus: string;
    onSelectAll: (planPackages: BiddingPackage[], checked: boolean) => void;
    onSelectOne: (packageId: string, checked: boolean) => void;
    onView: (pkg: BiddingPackage) => void;
    onEdit: (pkg: BiddingPackage) => void;
    onDelete: (pkg: BiddingPackage) => void;
    onCopyTBMT: (code: string) => void;
    onToggleDropdown: (pkgId: string) => void;
    onDragStart: (e: React.DragEvent, pkgId: string) => void;
    onDragOver: (e: React.DragEvent, pkgId: string) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent, targetPkgId: string, groupPkgs: BiddingPackage[]) => void;
    onDragEnd: () => void;
    onOpenImport: () => void;
    onOpenCreate: () => void;
    onClearFilter: () => void;
}

const SELECTION_METHOD_LABELS: Record<string, string> = {
    OpenBidding: 'Đấu thầu rộng rãi',
    Appointed: 'Chỉ định thầu thông thường',
    AppointedSimplified: 'Chỉ định thầu rút gọn',
    LimitedBidding: 'Đấu thầu hạn chế',
    CompetitiveNegotiation: 'Chào hàng cạnh tranh',
    DirectShopping: 'Mua sắm trực tiếp',
    SelfExecute: 'Tự thực hiện',
};

const SELECTION_PROCEDURE_LABELS: Record<string, string> = {
    Reduced: 'Rút gọn',
    Normal: 'Thông thường',
    OneStageOneEnvelope: '1 giai đoạn 1 túi hồ sơ',
    OneStageTwoEnvelope: '1 giai đoạn 2 túi hồ sơ',
    TwoStageOneEnvelope: '2 giai đoạn 1 túi hồ sơ',
    TwoStageTwoEnvelope: '2 giai đoạn 2 túi hồ sơ',
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
    LumpSum: 'Trọn gói',
    UnitPrice: 'Đơn giá cố định',
    FixedUnitPrice: 'Đơn giá cố định',
    AdjustableUnitPrice: 'Đơn giá điều chỉnh',
    TimeBased: 'Theo thời gian',
    Percentage: 'Theo tỷ lệ %',
    Mixed: 'Hỗn hợp',
};

const STATUS_COLORS: Record<string, string> = {
    [PackageStatus.Selection]: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
    [PackageStatus.Execution]: 'bg-warning-100 text-primary-700 border-warning-200 dark:bg-warning-900/40 dark:text-warning-300 dark:border-warning-800',
    [PackageStatus.Completed]: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
};
const STATUS_LABELS: Record<string, string> = {
    [PackageStatus.Selection]: 'Lựa chọn nhà thầu',
    [PackageStatus.Execution]: 'Đang thực hiện',
    [PackageStatus.Completed]: 'Kết thúc',
};

export const PackageTable: React.FC<PackageTableProps> = ({
    planKey, packages, allPlanPackages = [], isUngrouped,
    visibleColumns, selectedPackageIds, openDropdownId,
    draggedPkgId, dragOverPkgId, searchTerm, filterStatus,
    onSelectAll, onSelectOne, onView, onEdit, onDelete, onCopyTBMT,
    onToggleDropdown, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
    onOpenImport, onOpenCreate, onClearFilter,
}) => {
    const planTotal = packages.reduce((s, p) => s + (p.Price || 0), 0);

    // Empty state logic
    if (packages.length === 0) {
        const isFiltered = allPlanPackages.length > 0;
        return (
            <div className="p-6 text-center">
                {isFiltered ? (
                    <>
                        <Search className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-400 dark:text-slate-400 mb-1">Không tìm thấy gói thầu phù hợp</p>
                        <p className="text-xs text-gray-400 dark:text-slate-400 mb-3">
                            Có {allPlanPackages.length} gói trong nhóm này nhưng không khớp bộ lọc
                        </p>
                        <button onClick={onClearFilter}
                            className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors">
                            Xóa bộ lọc
                        </button>
                    </>
                ) : (
                    <>
                        <FileText className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-400 dark:text-slate-400 mb-3">Chưa có gói thầu trong nhóm này</p>
                        <div className="flex justify-center gap-2">
                            <button onClick={onOpenImport}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-50 transition-colors">
                                <Upload size={13} /> Import Excel
                            </button>
                            <button onClick={onOpenCreate}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                                <Plus size={13} /> Thêm gói thầu
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    const allChecked = packages.every(p => selectedPackageIds.has(p.PackageID));

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-200/20">
                    <tr className="text-slate-500 dark:text-slate-400">
                        <th rowSpan={2} className="border border-slate-200 dark:border-slate-700 px-1 py-3 text-center w-8" />
                        <th rowSpan={2} className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center w-10">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                checked={allChecked}
                                onChange={e => onSelectAll(packages, e.target.checked)} />
                        </th>
                        <th rowSpan={2} className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center w-10">TT</th>
                        <th colSpan={visibleColumns.description ? 2 : 1} className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center">Tên gói thầu</th>
                        {visibleColumns.price && <th rowSpan={2} className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center w-[110px]">Giá gói thầu<br />(Đồng)</th>}
                        {visibleColumns.fundingSource && <th rowSpan={2} className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center min-w-[100px]">Nguồn vốn</th>}
                        {visibleColumns.selectionMethod && <th rowSpan={2} className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center">Hình thức<br />lựa chọn<br />nhà thầu</th>}
                        {visibleColumns.selectionProcedure && <th rowSpan={2} className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center">Phương thức<br />lựa chọn<br />nhà thầu</th>}
                        {visibleColumns.selectionDuration && <th rowSpan={2} className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center w-[90px]">Thời gian<br />tổ chức<br />LCNT</th>}
                        {visibleColumns.selectionStartDate && <th rowSpan={2} className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center w-[90px]">Thời gian<br />bắt đầu<br />tổ chức<br />LCNT</th>}
                        {visibleColumns.contractType && <th rowSpan={2} className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center">Loại<br />hợp đồng</th>}
                        {visibleColumns.duration && <th rowSpan={2} className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center w-[90px]">Thời gian<br />thực hiện<br />gói thầu</th>}
                        {visibleColumns.hasOption && <th rowSpan={2} className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center w-[60px]">Tùy chọn<br />mua thêm</th>}
                        {visibleColumns.status && <th rowSpan={2} className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center w-[90px]">Trạng thái</th>}
                        <th rowSpan={2} className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center w-12 sticky right-0 bg-slate-50 dark:bg-slate-800/50 z-20 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">Thao tác</th>
                    </tr>
                    <tr className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400">
                        <th className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-center min-w-[120px]">Tên gói thầu</th>
                        {visibleColumns.description && <th className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-center min-w-[140px]">Tóm tắt công việc<br />chính của gói thầu</th>}
                    </tr>
                </thead>
                <tbody>
                    {packages.map((pkg, index) => (
                        <tr key={pkg.PackageID}
                            className={`hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${draggedPkgId === pkg.PackageID ? 'opacity-40' : ''} ${dragOverPkgId === pkg.PackageID ? 'ring-2 ring-blue-400 ring-inset' : ''}`}
                            draggable
                            onDragStart={e => onDragStart(e, pkg.PackageID)}
                            onDragOver={e => onDragOver(e, pkg.PackageID)}
                            onDragLeave={onDragLeave}
                            onDrop={e => onDrop(e, pkg.PackageID, packages)}
                            onDragEnd={onDragEnd}
                            onClick={() => onView(pkg)}
                        >
                            {/* Grip */}
                            <td className="border border-slate-200 dark:border-slate-700 px-1 py-2 text-center cursor-grab" onClick={e => e.stopPropagation()}>
                                <GripVertical className="w-3.5 h-3.5 text-gray-400 mx-auto" />
                            </td>
                            {/* Checkbox */}
                            <td className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-center" onClick={e => e.stopPropagation()}>
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    checked={selectedPackageIds.has(pkg.PackageID)}
                                    onChange={e => onSelectOne(pkg.PackageID, e.target.checked)} />
                            </td>
                            <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center font-bold text-slate-500 dark:text-slate-400 align-top">{index + 1}</td>
                            {/* Package name */}
                            <td className="border border-slate-200 dark:border-slate-700 px-3 py-3 align-top" title={pkg.PackageName}>
                                <div className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">{pkg.PackageName}</div>
                                {pkg.NotificationCode && (
                                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono text-blue-600 dark:text-blue-400">
                                        <Bell className="w-2.5 h-2.5" />{pkg.NotificationCode}
                                    </span>
                                )}
                            </td>
                            {visibleColumns.description && <td className="border border-slate-200 dark:border-slate-700 px-3 py-3 text-slate-600 dark:text-slate-300 align-top leading-snug">{pkg.Description || '-'}</td>}
                            {visibleColumns.price && <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-right font-bold tabular-nums text-slate-800 dark:text-slate-200 align-top">{formatCurrency(pkg.Price)}</td>}
                            {visibleColumns.fundingSource && <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center text-slate-700 dark:text-slate-300 align-top">{pkg.FundingSource || '-'}</td>}
                            {visibleColumns.selectionMethod && <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center text-slate-700 dark:text-slate-300 align-top">{SELECTION_METHOD_LABELS[pkg.SelectionMethod as string] || pkg.SelectionMethod || '-'}</td>}
                            {visibleColumns.selectionProcedure && <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center text-slate-700 dark:text-slate-300 align-top">{SELECTION_PROCEDURE_LABELS[pkg.SelectionProcedure as string] || pkg.SelectionProcedure || pkg.BidType || '-'}</td>}
                            {visibleColumns.selectionDuration && <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center text-slate-700 dark:text-slate-300 align-top">{pkg.SelectionDuration || '45 ngày'}</td>}
                            {visibleColumns.selectionStartDate && <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center text-slate-700 dark:text-slate-300 align-top">{pkg.SelectionStartDate || '-'}</td>}
                            {visibleColumns.contractType && <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center text-slate-700 dark:text-slate-300 align-top">{CONTRACT_TYPE_LABELS[pkg.ContractType as string] || pkg.ContractType || '-'}</td>}
                            {visibleColumns.duration && <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center text-slate-700 dark:text-slate-300 align-top font-medium">{pkg.Duration || '-'}</td>}
                            {visibleColumns.hasOption && <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center text-slate-700 dark:text-slate-300 align-top">{pkg.HasOption ? 'Có' : 'Không'}</td>}
                            {visibleColumns.status && (
                                <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center align-top">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold ${STATUS_COLORS[pkg.Status] || STATUS_COLORS[PackageStatus.Selection]}`}>
                                        {pkg.Status === PackageStatus.Selection && <Clock className="w-2.5 h-2.5 animate-pulse" />}
                                        {pkg.Status === PackageStatus.Execution && <AlertTriangle className="w-2.5 h-2.5" />}
                                        {pkg.Status === PackageStatus.Completed && <CheckCircle2 className="w-2.5 h-2.5" />}
                                        {STATUS_LABELS[pkg.Status] || pkg.Status}
                                    </span>
                                </td>
                            )}
                            {/* Action dropdown */}
                            <td className="border border-slate-200 dark:border-slate-700 px-1 py-2 text-center sticky right-0 bg-white dark:bg-slate-900 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]" onClick={e => e.stopPropagation()}>
                                <ActionDropdown
                                    pkg={pkg}
                                    isOpen={openDropdownId === pkg.PackageID}
                                    onToggle={() => onToggleDropdown(pkg.PackageID)}
                                    onClose={() => onToggleDropdown('')}
                                    onView={onView}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onCopyTBMT={onCopyTBMT}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
                {packages.length > 0 && (
                    <tfoot>
                        <tr className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-t-2 border-slate-200 dark:border-slate-700/50">
                            <td colSpan={4 + (visibleColumns.description ? 1 : 0)} className="border border-slate-200 dark:border-slate-800 px-3 py-2 text-right text-xs uppercase tracking-wider">
                                Tổng ({packages.length} gói):
                            </td>
                            {visibleColumns.price && (
                                <td className="border border-slate-200 dark:border-slate-800 px-2 py-2 text-right text-slate-900 dark:text-slate-100 tabular-nums text-sm">
                                    {formatCurrency(planTotal)}
                                </td>
                            )}
                            <td colSpan={Object.values(visibleColumns).filter(Boolean).length - (visibleColumns.price ? 1 : 0) - (visibleColumns.description ? 1 : 0) + 2} className="border border-slate-200 dark:border-slate-800" />
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
};
