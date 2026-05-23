import React from 'react';
import { ArrowDownUp, Plus, FileDown, Pencil, Trash2, Receipt, DollarSign, RefreshCcw } from 'lucide-react';
import { Disbursement } from '../../../../../types/capital.types';
import { formatCurrency } from '../../../../../utils/format';
import { DISBURSEMENT_TYPE_LABELS } from '../../../../../utils/capitalConstants';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { exportM25, exportM26, exportM27 } from '../../../../../utils/disbursementTemplateExport';

const TYPE_LABELS = DISBURSEMENT_TYPE_LABELS;

type DisbursementFilter = 'all' | 'TamUng' | 'ThanhToanKLHT' | 'ThuHoiTamUng';

interface DisbursementHistorySectionProps {
    disbursements: Disbursement[];
    disbursementFilter: DisbursementFilter;
    setDisbursementFilter: (f: DisbursementFilter) => void;
    disbYearFilter: number | 'all';
    setDisbYearFilter: (y: number | 'all') => void;
    onAddDisb: () => void;
    onEditDisb: (d: Disbursement) => void;
    onDeleteDisb: (id: string) => void;
    onImport: () => void;
    // Export context
    projectName?: string;
    projectCode?: string;
}

const TYPE_FILTER_OPTIONS = [
    ['all', 'Tất cả'],
    ['TamUng', 'Tạm ứng'],
    ['ThanhToanKLHT', 'TT KLHT'],
    ['ThuHoiTamUng', 'Thu hồi TƯ'],
] as const;

export const DisbursementHistorySection: React.FC<DisbursementHistorySectionProps> = ({
    disbursements,
    disbursementFilter,
    setDisbursementFilter,
    disbYearFilter,
    setDisbYearFilter,
    onAddDisb,
    onEditDisb,
    onDeleteDisb,
    onImport,
    projectName = 'Dự án',
    projectCode,
}) => {
    // Filter: chỉ theo type và year (bỏ filter nguồn vốn vì disbursement không có source trực tiếp)
    const filtered = disbursements.filter(d => {
        if (disbursementFilter !== 'all' && d.Type !== disbursementFilter) return false;
        if (disbYearFilter !== 'all' && new Date(d.Date).getFullYear() !== disbYearFilter) return false;
        return true;
    });

    const years = (Array.from(new Set(disbursements.map(d => new Date(d.Date).getFullYear()))) as number[]).sort((a, b) => b - a);
    const sorted = [...filtered].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

    // Tính lũy kế tích lũy từ đầu (sắp xếp theo ngày tăng dần để tính running total)
    const allSorted = [...disbursements]
        .filter(d => d.Status === 'Approved')
        .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
    
    const cumulativeMap = new Map<string, number>();
    let running = 0;
    for (const d of allSorted) {
        const delta = d.Type === 'ThuHoiTamUng' ? -d.Amount : d.Amount;
        cumulativeMap.set(d.DisbursementID, running + delta);
        running += delta;
    }

    return (
        <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex flex-wrap justify-between items-center gap-3">
                <h3 className="font-bold text-txt-primary flex items-center gap-2">
                    <ArrowDownUp className="w-4 h-4 text-emerald-500" />
                    Lịch sử giải ngân
                    <span className="text-[10px] font-normal text-txt-muted">(NĐ 99/2021/NĐ-CP)</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Year filter */}
                    <select
                        value={disbYearFilter}
                        onChange={e => setDisbYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="px-3 py-1.5 text-xs font-medium bg-bg-muted border border-border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-txt-primary transition-all cursor-pointer"
                    >
                        <option value="all">Tất cả năm</option>
                        {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
                    </select>

                    {/* Type filter pills */}
                    <div className="flex bg-bg-muted border border-border rounded-xl p-0.5">
                        {TYPE_FILTER_OPTIONS.map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setDisbursementFilter(key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${disbursementFilter === key
                                    ? 'bg-bg-surface text-txt-primary shadow-sm'
                                    : 'text-txt-muted hover:text-txt-primary'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <button
                        onClick={onImport}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                    >
                        <ArrowDownUp className="w-3.5 h-3.5" /> Import (Kế toán)
                    </button>
                    <button
                        onClick={onAddDisb}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                        title="Thêm bút toán giải ngân mới"
                    >
                        <Plus className="w-3.5 h-3.5" /> Thêm bút toán
                    </button>

                    {/* Export template buttons */}
                    <div className="flex bg-bg-muted border border-border rounded-xl p-0.5 ml-1">
                        <button
                            onClick={() => exportM25(disbursements, projectName, projectCode)}
                            className="px-3 py-1.5 text-xs font-bold text-txt-secondary hover:bg-bg-surface rounded-lg transition-all flex items-center gap-1.5"
                            title="Đề nghị thanh toán vốn (Mẫu 25 - TT 08/2016/TT-BTC)"
                        >
                            <FileDown className="w-3.5 h-3.5 text-primary-500" /> M.25
                        </button>
                        <button
                            onClick={() => exportM26(disbursements, projectName, projectCode)}
                            className="px-3 py-1.5 text-xs font-bold text-txt-secondary hover:bg-bg-surface rounded-lg transition-all flex items-center gap-1.5"
                            title="Đề nghị rút vốn tạm ứng (Mẫu 26 - TT 08/2016/TT-BTC)"
                        >
                            <FileDown className="w-3.5 h-3.5 text-blue-500" /> M.26
                        </button>
                        <button
                            onClick={() => exportM27(disbursements, projectName, projectCode)}
                            className="px-3 py-1.5 text-xs font-bold text-txt-secondary hover:bg-bg-surface rounded-lg transition-all flex items-center gap-1.5"
                            title="Thu hồi vốn tạm ứng (Mẫu 27 - TT 08/2016/TT-BTC)"
                        >
                            <FileDown className="w-3.5 h-3.5 text-emerald-500" /> M.27
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 z-10 bg-bg-muted text-[10px] font-black uppercase tracking-widest border-b border-border shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-left text-txt-muted">Ngày</th>
                            <th className="px-4 py-3 text-left text-txt-muted">Nội dung</th>
                            <th className="px-4 py-3 text-left text-txt-muted">HĐ số</th>
                            <th className="px-4 py-3 text-center text-txt-muted">Loại</th>
                            <th className="px-4 py-3 text-center text-txt-muted">Biểu mẫu</th>
                            <th className="px-4 py-3 text-right text-txt-muted">Số tiền</th>
                            <th className="px-4 py-3 text-right text-txt-muted">Lũy kế TT</th>
                            <th className="px-4 py-3 text-center text-txt-muted">Trạng thái</th>
                            <th className="px-4 py-3 text-center text-txt-muted w-20">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sorted.map(d => (
                            <tr
                                key={d.DisbursementID}
                                className={`hover:bg-bg-muted/50 transition-colors ${
                                    d.Type === 'ThuHoiTamUng' ? 'bg-emerald-500/5' :
                                    d.Type === 'TamUng' ? 'bg-primary-500/5' : ''
                                }`}
                            >
                                <td className="px-4 py-3.5 text-txt-muted font-mono text-xs whitespace-nowrap">
                                    {d.Date ? new Date(d.Date).toLocaleDateString('vi-VN') : '—'}
                                </td>
                                <td className="px-4 py-3.5">
                                    <p className="text-txt-primary font-medium text-xs line-clamp-1">{d.Description || '—'}</p>
                                    {d.TreasuryCode && (
                                        <p className="text-[10px] text-txt-muted mt-0.5 font-mono">{d.TreasuryCode}</p>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 text-xs text-txt-secondary font-medium whitespace-nowrap">
                                    {d.ContractNumber || '—'}
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        d.Type === 'TamUng' ? 'bg-primary-500/10 text-primary-500' :
                                        d.Type === 'ThanhToanKLHT' ? 'bg-blue-500/10 text-blue-500' :
                                        d.Type === 'ThuHoiTamUng' ? 'bg-emerald-500/10 text-emerald-500' :
                                        'bg-bg-muted text-txt-secondary'
                                    }`}>
                                        {d.Type === 'TamUng' && <Receipt className="w-3 h-3" />}
                                        {d.Type === 'ThanhToanKLHT' && <DollarSign className="w-3 h-3" />}
                                        {d.Type === 'ThuHoiTamUng' && <RefreshCcw className="w-3 h-3" />}
                                        {TYPE_LABELS[d.Type || ''] || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                    <span className="px-2 py-0.5 bg-bg-muted border border-border text-txt-secondary rounded text-[10px] font-mono font-bold">
                                        {d.FormType || '—'}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono font-bold">
                                    <span className={d.Type === 'ThuHoiTamUng' ? 'text-emerald-500' : 'text-txt-primary'}>
                                        {d.Type === 'ThuHoiTamUng' ? '-' : ''}{formatCurrency(d.Amount)}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono text-xs text-txt-muted">
                                    {d.Status === 'Approved' && cumulativeMap.has(d.DisbursementID)
                                        ? formatCurrency(cumulativeMap.get(d.DisbursementID)!)
                                        : '—'}
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        d.Status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                        d.Status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                        'bg-red-500/10 text-red-500'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            d.Status === 'Approved' ? 'bg-emerald-500' :
                                            d.Status === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`} />
                                        {d.Status === 'Approved' ? 'Đã duyệt' :
                                            d.Status === 'Pending' ? 'Chờ duyệt' : 'Từ chối'}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <button
                                            onClick={() => onEditDisb(d)}
                                            className="p-1.5 hover:bg-bg-muted text-txt-muted hover:text-primary-500 rounded-xl transition-colors"
                                            title="Sửa bút toán"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => onDeleteDisb(d.DisbursementID)}
                                            className="p-1.5 hover:bg-red-500/10 text-txt-muted hover:text-red-500 rounded-xl transition-colors"
                                            title="Xóa bút toán"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {sorted.length === 0 && (
                            <tr>
                                <td colSpan={9}>
                                    <EmptyState
                                        icon={<ArrowDownUp className="w-10 h-10 text-txt-muted" />}
                                        title="Không có giao dịch nào"
                                        description={disbursementFilter !== 'all' || disbYearFilter !== 'all'
                                            ? 'Thử bỏ bộ lọc để xem tất cả giao dịch'
                                            : 'Nhấn "Thêm bút toán" hoặc "Import" để bắt đầu nhập liệu giải ngân'
                                        }
                                        className="py-8"
                                    />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary footer */}
            {sorted.length > 0 && (
                <div className="px-6 py-3 border-t border-border bg-bg-muted flex items-center justify-between text-xs">
                    <span className="text-txt-muted font-medium">
                        {sorted.length} giao dịch
                        {disbYearFilter !== 'all' ? ` · Năm ${disbYearFilter}` : ''}
                        {disbursementFilter !== 'all' ? ` · ${TYPE_LABELS[disbursementFilter] || disbursementFilter}` : ''}
                    </span>
                    <div className="flex items-center gap-4">
                        <span className="text-txt-muted">
                            Tổng phát sinh:{' '}
                            <span className="font-bold text-txt-primary">
                                {formatCurrency(sorted.filter(d => d.Type !== 'ThuHoiTamUng').reduce((s, d) => s + d.Amount, 0))}
                            </span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
