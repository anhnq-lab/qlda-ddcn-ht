import React, { useState } from 'react';
import { TrendingUp, LayoutList, AlertTriangle } from 'lucide-react';
import { SectionHeader, FormattedInput, labelClass, inputClass } from './FormShared';

interface ProjectFormInvestmentProps {
    formData: Record<string, any>;
    updateField: (field: string, value: any) => void;
    errors?: Record<string, any>;
}

export const ProjectFormInvestment: React.FC<ProjectFormInvestmentProps> = ({
    formData,
    updateField,
    errors = {},
}) => {
    const [showCapitalDropdown, setShowCapitalDropdown] = useState(false);

    const updateCostBreakdown = (key: string, value: number) => {
        updateField('CostBreakdown', { ...(formData.CostBreakdown || {}), [key]: value });
    };

    const updateBudgetAllocation = (key: string, value: number) => {
        updateField('BudgetAllocations', { ...(formData.BudgetAllocations || {}), [key]: value });
    };

    // ── Kiểm tra nhất quán: Tổng mức đầu tư vs tổng cơ cấu chi phí / nguồn vốn ──
    const totalInvestment = Number(formData.TotalInvestment) || 0;
    const costSum = ['landClearance', 'construction', 'equipment', 'management', 'consultancy', 'other', 'contingency']
        .reduce((sum, key) => sum + (Number(formData.CostBreakdown?.[key]) || 0), 0);
    const budgetSum = ['BudgetNSTW', 'BudgetNSDiaphuong', 'BudgetLoan', 'BudgetODA', 'BudgetOtherNSNN']
        .reduce((sum, key) => sum + (Number(formData.BudgetAllocations?.[key]) || 0), 0);
    const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
    const costMismatch = costSum > 0 && totalInvestment > 0 && costSum !== totalInvestment;
    const budgetMismatch = budgetSum > 0 && totalInvestment > 0 && budgetSum !== totalInvestment;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SectionHeader icon={TrendingUp} title="Cơ cấu vốn & Chi phí" subtitle="Phân tích nguồn vốn và hạng mục chi phí trong tổng mức đầu tư" />

            {(costMismatch || budgetMismatch) && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                        <p className="font-semibold">Số liệu chưa khớp Tổng mức đầu tư ({fmt(totalInvestment)} VNĐ):</p>
                        {costMismatch && <p>• Tổng hạng mục chi phí: {fmt(costSum)} VNĐ (lệch {fmt(Math.abs(costSum - totalInvestment))})</p>}
                        {budgetMismatch && <p>• Tổng cơ cấu nguồn vốn: {fmt(budgetSum)} VNĐ (lệch {fmt(Math.abs(budgetSum - totalInvestment))})</p>}
                    </div>
                </div>
            )}

            {/* ── Thông tin tổng quát ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tổng mức đầu tư */}
                <div>
                    <label className={labelClass}>Tổng mức đầu tư (VNĐ)</label>
                    <FormattedInput
                        placeholder="0"
                        className={inputClass}
                        value={formData.TotalInvestment}
                        onChange={(v: string | number) => updateField('TotalInvestment', Number(v))}
                        isDecimal={false}
                    />
                </div>

                {/* Nguồn vốn */}
                <div className="relative z-20">
                    <label className={labelClass}>Nguồn vốn đầu tư</label>
                    <div
                        className={`w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-[#293548] bg-bg-surface dark:text-slate-100 cursor-pointer flex justify-between items-center transition-all shadow-sm`}
                        onClick={() => setShowCapitalDropdown(v => !v)}
                    >
                        <span className={formData.CapitalSource ? 'text-txt-primary line-clamp-1 text-sm' : 'text-txt-muted text-sm'}>
                            {formData.CapitalSource || 'Chọn nguồn vốn...'}
                        </span>
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                    </div>
                    {showCapitalDropdown && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowCapitalDropdown(false)} />
                            <div className="absolute z-20 mt-1 w-full bg-bg-surface border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg overflow-hidden py-1">
                                {['Ngân sách Trung ương', 'Ngân sách Địa phương', 'Vốn ODA', 'Vốn tư nhân', 'Khác'].map(source => {
                                    const current = formData.CapitalSource ? formData.CapitalSource.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                                    const isSelected = current.includes(source);
                                    return (
                                        <div key={source} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover-row cursor-pointer"
                                            onClick={() => {
                                                const next = isSelected ? current.filter((s: string) => s !== source) : [...current, source];
                                                updateField('CapitalSource', next.join(', '));
                                            }}>
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-slate-500'}`}>
                                                {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                                            </div>
                                            <span className="text-sm text-txt-secondary">{source}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Cơ cấu nguồn vốn chi tiết ── */}
            <div>
                <h4 className="text-sm font-semibold text-txt-secondary mb-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Cơ cấu nguồn vốn chi tiết
                </h4>
                <p className="text-xs text-txt-placeholder mb-3">Phân bổ theo từng nguồn vốn (đơn vị: VNĐ)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Ngân sách Trung ương</label>
                        <FormattedInput placeholder="0" className={inputClass}
                            value={formData.BudgetAllocations?.BudgetNSTW || 0}
                            onChange={(v: string | number) => updateBudgetAllocation('BudgetNSTW', Number(v))}
                            isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>Ngân sách địa phương</label>
                        <FormattedInput placeholder="0" className={inputClass}
                            value={formData.BudgetAllocations?.BudgetNSDiaphuong || 0}
                            onChange={(v: string | number) => updateBudgetAllocation('BudgetNSDiaphuong', Number(v))}
                            isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>Vốn vay</label>
                        <FormattedInput placeholder="0" className={inputClass}
                            value={formData.BudgetAllocations?.BudgetLoan || 0}
                            onChange={(v: string | number) => updateBudgetAllocation('BudgetLoan', Number(v))}
                            isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>Vốn ODA / nước ngoài</label>
                        <FormattedInput placeholder="0" className={inputClass}
                            value={formData.BudgetAllocations?.BudgetODA || 0}
                            onChange={(v: string | number) => updateBudgetAllocation('BudgetODA', Number(v))}
                            isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>Vốn khác ngoài NSNN</label>
                        <FormattedInput placeholder="0" className={inputClass}
                            value={formData.BudgetAllocations?.BudgetOtherNSNN || 0}
                            onChange={(v: string | number) => updateBudgetAllocation('BudgetOtherNSNN', Number(v))}
                            isDecimal={false} />
                    </div>
                </div>
            </div>

            {/* ── Hạng mục chi phí ── */}
            <div className="pt-5 border-t border-gray-100 dark:border-slate-500/50">
                <h4 className="text-sm font-semibold text-txt-secondary mb-1 flex items-center gap-2">
                    <LayoutList className="w-4 h-4 text-violet-500" /> Hạng mục chi phí trong tổng mức đầu tư
                </h4>
                <p className="text-xs text-txt-placeholder mb-3">Phân tích theo cơ cấu hạng mục (đơn vị: VNĐ)</p>
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-500 bg-bg-surface shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-bg-subtle text-txt-muted">
                            <tr>
                                <th className="px-4 py-3 font-semibold border-b border-gray-200 dark:border-slate-500 w-1/3">Hạng mục chi phí</th>
                                <th className="px-4 py-3 font-semibold border-b border-gray-200 dark:border-slate-500">Giá trị (VNĐ)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {[
                                { key: 'landClearance', label: 'Chi phí đền bù, GPMB' },
                                { key: 'construction', label: 'Chi phí xây dựng' },
                                { key: 'equipment', label: 'Chi phí thiết bị' },
                                { key: 'management', label: 'Chi phí quản lý dự án' },
                                { key: 'consultancy', label: 'Chi phí tư vấn đầu tư xây dựng' },
                                { key: 'other', label: 'Chi phí khác' },
                                { key: 'contingency', label: 'Chi phí dự phòng' },
                            ].map((item) => (
                                <tr key={item.key} className="hover:bg-gray-50/50 dark:hover:bg-slate-700 transition-colors">
                                    <td className="px-4 py-3 font-medium text-txt-secondary">
                                        {item.label}
                                    </td>
                                    <td className="px-4 py-2">
                                        <FormattedInput 
                                            placeholder="0" 
                                            className={inputClass}
                                            value={formData.CostBreakdown?.[item.key] || 0}
                                            onChange={(v: string | number) => updateCostBreakdown(item.key, Number(v))}
                                            isDecimal={false} 
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-blue-50/50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-slate-500">
                            <tr>
                                <td className="px-4 py-3 font-bold text-txt-primary text-right">Tổng cộng:</td>
                                <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400 text-lg">
                                    {new Intl.NumberFormat('vi-VN').format(
                                        ['landClearance', 'construction', 'equipment', 'management', 'consultancy', 'other', 'contingency']
                                            .reduce((sum, key) => sum + (formData.CostBreakdown?.[key] || 0), 0)
                                    )} <span className="text-sm font-medium text-gray-500">VNĐ</span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};
