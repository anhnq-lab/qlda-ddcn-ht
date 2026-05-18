import React from 'react';
import { ArrowDownUp, Plus, FileDown, Pencil, Trash2, Receipt, DollarSign, RefreshCcw } from 'lucide-react';
import { Disbursement } from '../../../../../types/capital.types';
import { formatCurrency } from '../../../../../utils/format';
import { DISBURSEMENT_TYPE_LABELS, SOURCE_LABELS as SOURCE_LABELS_OBJ } from '../../../../../utils/capitalConstants';

const TYPE_LABELS = DISBURSEMENT_TYPE_LABELS;
// Flatten SOURCE_LABELS_OBJ { label, color } → { key: label } for select options
const SOURCE_LABEL_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(SOURCE_LABELS_OBJ).map(([k, v]) => [k, v.label])
);

type DisbursementFilter = 'all' | 'TamUng' | 'ThanhToanKLHT' | 'ThuHoiTamUng';

interface DisbursementHistorySectionProps {
    disbursements: Disbursement[];
    disbursementFilter: DisbursementFilter;
    setDisbursementFilter: (f: DisbursementFilter) => void;
    disbYearFilter: number | 'all';
    setDisbYearFilter: (y: number | 'all') => void;
    disbSourceFilter: string;
    setDisbSourceFilter: (s: string) => void;
    onAddDisb: () => void;
    onEditDisb: (d: Disbursement) => void;
    onDeleteDisb: (id: string) => void;
    onImport: () => void;
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
    disbSourceFilter,
    setDisbSourceFilter,
    onAddDisb,
    onEditDisb,
    onDeleteDisb,
    onImport,
}) => {
    const filtered = disbursements.filter(d => {
        if (disbursementFilter !== 'all' && d.Type !== disbursementFilter) return false;
        if (disbYearFilter !== 'all' && new Date(d.Date).getFullYear() !== disbYearFilter) return false;
        return true;
    });

    const years = Array.from(new Set(disbursements.map(d => new Date(d.Date).getFullYear()))).sort((a, b) => b - a);
    const sorted = [...filtered].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3">
                <h3 className="font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                    <ArrowDownUp className="w-4 h-4 text-emerald-600" />
                    Lịch sử giải ngân (NĐ 99/2021/NĐ-CP)
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Year filter */}
                    <select
                        value={disbYearFilter}
                        onChange={e => setDisbYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 dark:text-slate-200"
                    >
                        <option value="all">Tất cả năm</option>
                        {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
                    </select>

                    {/* Source filter */}
                    <select
                        value={disbSourceFilter}
                        onChange={e => setDisbSourceFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 dark:text-slate-200"
                    >
                        <option value="all">Tất cả nguồn vốn</option>
                        {Object.entries(SOURCE_LABEL_MAP).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>

                    {/* Type filter pills */}
                    <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5">
                        {TYPE_FILTER_OPTIONS.map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setDisbursementFilter(key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${disbursementFilter === key
                                    ? 'bg-white dark:bg-slate-600 text-gray-800 dark:text-slate-100 shadow-sm'
                                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <button onClick={onImport} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all">
                        <ArrowDownUp className="w-3.5 h-3.5" /> Import (Kế toán)
                    </button>
                    <button onClick={onAddDisb} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all">
                        <Plus className="w-3.5 h-3.5" /> Thêm bút toán
                    </button>

                    {/* Export buttons */}
                    <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5 ml-1 border border-gray-200 dark:border-slate-600">
                        <button className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600 rounded transition-all flex items-center gap-1.5" title="Đề nghị thanh toán vốn (Mẫu 25)">
                            <FileDown className="w-3.5 h-3.5 text-primary-600" /> M.25
                        </button>
                        <button className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600 rounded transition-all flex items-center gap-1.5" title="Đề nghị rút vốn (Mẫu 26)">
                            <FileDown className="w-3.5 h-3.5 text-blue-600" /> M.26
                        </button>
                        <button className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600 rounded transition-all flex items-center gap-1.5" title="Thu hồi vốn tạm ứng (Mẫu 27)">
                            <FileDown className="w-3.5 h-3.5 text-green-600" /> M.27
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-left text-slate-500 dark:text-slate-400">Ngày</th>
                            <th className="px-4 py-3 text-left text-slate-500 dark:text-slate-400">Nội dung</th>
                            <th className="px-4 py-3 text-left text-slate-500 dark:text-slate-400">HĐ số</th>
                            <th className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">Loại</th>
                            <th className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">Biểu mẫu</th>
                            <th className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">Số tiền</th>
                            <th className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">Lũy kế TT</th>
                            <th className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">Trạng thái</th>
                            <th className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 w-20">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                        {sorted.map(d => (
                            <tr key={d.DisbursementID} className={`hover:bg-bg-app dark:hover:bg-slate-700 transition-colors ${
                                d.Type === 'ThuHoiTamUng' ? 'bg-green-50/30 dark:bg-green-900/10' :
                                d.Type === 'TamUng' ? 'bg-primary-50/20 dark:bg-primary-900/10' : ''
                            }`}>
                                <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                                    {d.Date ? new Date(d.Date).toLocaleDateString('vi-VN') : '—'}
                                </td>
                                <td className="px-4 py-3.5">
                                    <p className="text-gray-800 dark:text-slate-200 font-medium text-xs line-clamp-1">{d.Description}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5 font-mono">{d.TreasuryCode || '—'}</p>
                                </td>
                                <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-slate-400 font-medium whitespace-nowrap">
                                    {d.ContractNumber || '—'}
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        d.Type === 'TamUng' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' :
                                        d.Type === 'ThanhToanKLHT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                        d.Type === 'ThuHoiTamUng' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                        'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
                                    }`}>
                                        {d.Type === 'TamUng' && <Receipt className="w-3 h-3" />}
                                        {d.Type === 'ThanhToanKLHT' && <DollarSign className="w-3 h-3" />}
                                        {d.Type === 'ThuHoiTamUng' && <RefreshCcw className="w-3 h-3" />}
                                        {TYPE_LABELS[d.Type || ''] || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded text-[10px] font-mono font-bold">
                                        {d.FormType || '—'}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono font-bold">
                                    <span className={d.Type === 'ThuHoiTamUng' ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-slate-100'}>
                                        {d.Type === 'ThuHoiTamUng' ? '-' : ''}{formatCurrency(d.Amount)}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-500 dark:text-slate-400">
                                    {d.CumulativeBefore != null ? formatCurrency(d.CumulativeBefore + d.Amount) : '—'}
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        d.Status === 'Approved' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                                        d.Status === 'Pending' ? 'bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-300' :
                                        'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            d.Status === 'Approved' ? 'bg-green-500' :
                                            d.Status === 'Pending' ? 'bg-warning-500' : 'bg-red-500'
                                        }`} />
                                        {d.Status === 'Approved' ? 'Đã duyệt' : d.Status === 'Pending' ? 'Chờ duyệt' : 'Từ chối'}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <button onClick={() => onEditDisb(d)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 rounded-lg transition-colors" title="Sửa">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => onDeleteDisb(d.DisbursementID)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 rounded-lg transition-colors" title="Xóa">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {sorted.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-6 py-8 text-center text-gray-400 dark:text-slate-400 text-sm">
                                    Không có giao dịch nào cho bộ lọc này
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
