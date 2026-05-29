import React, { useState } from 'react';
import { useVariationOrders } from '../../../hooks/useVariationOrders';
import { VariationOrder } from '../../../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VariationOrderService } from '../../../services/VariationOrderService';
import { formatCurrency } from '../../../utils/format';
import { Plus, Edit3, Trash2, Save, X, FileText, Calendar, Hash, Loader2 } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';

interface Props {
    contractId: string;
}

export const VariationOrderTab: React.FC<Props> = ({ contractId }) => {
    const { variationOrders, isLoading } = useVariationOrders(contractId);
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState<Partial<VariationOrder>>({
        ContractID: contractId,
        Number: '',
        SignDate: '',
        Content: '',
        AdjustedAmount: 0,
        AdjustedDuration: 0,
    });

    const resetForm = () => {
        setForm({
            ContractID: contractId,
            Number: '',
            SignDate: '',
            Content: '',
            AdjustedAmount: 0,
            AdjustedDuration: 0,
        });
        setEditingId(null);
        setIsEditing(false);
    };

    const handleEdit = (vo: VariationOrder) => {
        setForm({
            Number: vo.Number,
            SignDate: vo.SignDate,
            Content: vo.Content,
            AdjustedAmount: vo.AdjustedAmount,
            AdjustedDuration: vo.AdjustedDuration,
        });
        setEditingId(vo.VOID);
        setIsEditing(true);
    };

    const mutationSubmit = useMutation({
        mutationFn: (data: Partial<VariationOrder>) => {
            if (editingId) {
                return VariationOrderService.update(editingId, data);
            }
            return VariationOrderService.create({ ...data, ContractID: contractId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['variationOrders', contractId] });
            resetForm();
        }
    });

    const mutationDelete = useMutation({
        mutationFn: (id: string) => VariationOrderService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['variationOrders', contractId] });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutationSubmit.mutate(form);
    };

    const inputClass = "w-full px-3 py-2 text-sm bg-bg-surface border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-txt-primary";
    const labelClass = "block text-xs font-medium text-txt-muted mb-1";

    if (isLoading) return <div className="p-4 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-txt-primary flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Phụ lục hợp đồng
                </h3>
                {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Thêm phụ lục
                    </button>
                )}
            </div>

            {isEditing && (
                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-blue-800 dark:text-blue-300">
                            {editingId ? 'Chỉnh sửa phụ lục' : 'Thêm mới phụ lục'}
                        </h4>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}><Hash className="w-3 h-3 inline mr-1"/>Số phụ lục</label>
                                <input 
                                    type="text" required 
                                    value={form.Number} onChange={e => setForm({...form, Number: e.target.value})} 
                                    className={inputClass} placeholder="VD: PL01/2026/HĐ" 
                                />
                            </div>
                            <div>
                                <label className={labelClass}><Calendar className="w-3 h-3 inline mr-1"/>Ngày ký</label>
                                <input 
                                    type="date" required 
                                    value={form.SignDate} onChange={e => setForm({...form, SignDate: e.target.value})} 
                                    className={inputClass} 
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Nội dung điều chỉnh</label>
                                <textarea 
                                    required rows={2}
                                    value={form.Content} onChange={e => setForm({...form, Content: e.target.value})} 
                                    className={inputClass} placeholder="Mô tả nội dung điều chỉnh..." 
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Giá trị điều chỉnh (VND) - Có thể âm</label>
                                <input 
                                    type="number" 
                                    value={form.AdjustedAmount} onChange={e => setForm({...form, AdjustedAmount: Number(e.target.value)})} 
                                    className={inputClass} 
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Tháng gia hạn thêm</label>
                                <input 
                                    type="number" 
                                    value={form.AdjustedDuration} onChange={e => setForm({...form, AdjustedDuration: Number(e.target.value)})} 
                                    className={inputClass} 
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-blue-200/50 dark:border-blue-800/50 mt-4">
                            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-txt-muted hover:bg-bg-muted rounded-lg transition-colors">Hủy</button>
                            <button type="submit" disabled={mutationSubmit.isPending} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors disabled:opacity-50">
                                {mutationSubmit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Lưu phụ lục
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {variationOrders.length > 0 ? (
                <div className="bg-bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-bg-subtle text-txt-muted font-bold uppercase text-xs border-b border-border">
                            <tr>
                                <th className="px-5 py-3 text-center w-12">STT</th>
                                <th className="px-5 py-3">Số Phụ lục</th>
                                <th className="px-5 py-3">Ngày ký</th>
                                <th className="px-5 py-3">Nội dung</th>
                                <th className="px-5 py-3 text-right">Giá trị ĐC</th>
                                <th className="px-5 py-3 text-center">Gia hạn</th>
                                <th className="px-5 py-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle text-txt-secondary">
                            {variationOrders.map((vo, idx) => (
                                <tr key={vo.VOID} className="hover:bg-bg-subtle dark:hover:bg-slate-700">
                                    <td className="px-5 py-3 text-center font-mono text-txt-placeholder">{idx + 1}</td>
                                    <td className="px-5 py-3 font-semibold">{vo.Number}</td>
                                    <td className="px-5 py-3">{vo.SignDate ? new Date(vo.SignDate).toLocaleDateString('vi-VN') : '—'}</td>
                                    <td className="px-5 py-3 text-xs">{vo.Content}</td>
                                    <td className={`px-5 py-3 text-right font-mono font-bold ${vo.AdjustedAmount > 0 ? 'text-green-600 dark:text-green-400' : vo.AdjustedAmount < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                        {vo.AdjustedAmount > 0 ? '+' : ''}{formatCurrency(vo.AdjustedAmount || 0)}
                                    </td>
                                    <td className="px-5 py-3 text-center font-mono">
                                        {vo.AdjustedDuration ? `+${vo.AdjustedDuration} tháng` : '—'}
                                    </td>
                                    <td className="px-5 py-3 flex items-center justify-end gap-2">
                                        <button onClick={() => handleEdit(vo)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 hover:bg-blue-50 dark:bg-slate-700 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => { if(window.confirm('Xóa phụ lục này?')) mutationDelete.mutate(vo.VOID); }} 
                                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 hover:bg-red-50 dark:bg-slate-700 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-slate-700 border-t border-border font-bold">
                            <tr>
                                <td colSpan={4} className="px-5 py-3 text-right uppercase text-xs tracking-wider text-txt-muted">
                                    Tổng giá trị điều chỉnh
                                </td>
                                <td className="px-5 py-3 text-right font-mono text-blue-600 dark:text-blue-400">
                                    {formatCurrency(variationOrders.reduce((sum, vo) => sum + vo.AdjustedAmount, 0))}
                                </td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : (
                <EmptyState
                    icon={<FileText className="w-12 h-12 text-gray-300 dark:text-slate-600" />}
                    title="Chưa có phụ lục hợp đồng nào"
                    className="bg-bg-surface rounded-xl border border-dashed border-slate-200 dark:border-slate-600"
                />
            )}
        </div>
    );
};
