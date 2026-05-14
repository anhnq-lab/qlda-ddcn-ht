import React from 'react';
import { DollarSign, TrendingUp, LayoutList } from 'lucide-react';
import { SectionHeader, FormattedInput, labelClass, inputWithIconClass } from './FormShared';

interface ProjectFormInvestmentProps {
    formData: Record<string, any>;
    updateField: (field: string, value: any) => void;
}

export const ProjectFormInvestment: React.FC<ProjectFormInvestmentProps> = ({
    formData,
    updateField,
}) => {
    const updateCostBreakdown = (key: string, value: number) => {
        updateField('CostBreakdown', { ...(formData.CostBreakdown || {}), [key]: value });
    };

    const updateBudgetAllocation = (key: string, value: number) => {
        updateField('BudgetAllocations', { ...(formData.BudgetAllocations || {}), [key]: value });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SectionHeader icon={TrendingUp} title="Cơ cấu vốn & Chi phí" subtitle="Phân tích nguồn vốn và hạng mục chi phí trong tổng mức đầu tư" />

            {/* ── Cơ cấu nguồn vốn chi tiết ── */}
            <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Cơ cấu nguồn vốn chi tiết
                </h4>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Phân bổ theo từng nguồn vốn (đơn vị: VNĐ)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Ngân sách Trung ương</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={formData.BudgetAllocations?.BudgetNSTW || 0}
                            onChange={(v: number) => updateBudgetAllocation('BudgetNSTW', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>Ngân sách địa phương</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={formData.BudgetAllocations?.BudgetNSDiaphuong || 0}
                            onChange={(v: number) => updateBudgetAllocation('BudgetNSDiaphuong', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>Vốn vay</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={formData.BudgetAllocations?.BudgetLoan || 0}
                            onChange={(v: number) => updateBudgetAllocation('BudgetLoan', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>Vốn ODA / nước ngoài</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={formData.BudgetAllocations?.BudgetODA || 0}
                            onChange={(v: number) => updateBudgetAllocation('BudgetODA', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>Vốn khác ngoài NSNN</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={formData.BudgetAllocations?.BudgetOtherNSNN || 0}
                            onChange={(v: number) => updateBudgetAllocation('BudgetOtherNSNN', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                </div>
            </div>

            {/* ── Hạng mục chi phí ── */}
            <div className="pt-5 border-t border-gray-100 dark:border-slate-700/50">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1 flex items-center gap-2">
                    <LayoutList className="w-4 h-4 text-violet-500" /> Hạng mục chi phí trong tổng mức đầu tư
                </h4>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Phân tích theo cơ cấu hạng mục (đơn vị: VNĐ)</p>
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
                            <tr>
                                <th className="px-4 py-3 font-semibold border-b border-gray-200 dark:border-slate-700 w-1/3">Hạng mục chi phí</th>
                                <th className="px-4 py-3 font-semibold border-b border-gray-200 dark:border-slate-700">Giá trị (VNĐ)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                            {[
                                { key: 'landClearance', label: 'GPM&B' },
                                { key: 'construction', label: 'Xây lắp (XL)' },
                                { key: 'equipment', label: 'Thiết bị' },
                                { key: 'consultancy', label: 'Tư vấn (TV)' },
                                { key: 'management', label: 'Quản lý (QL)' },
                                { key: 'other', label: 'Chi phí khác' },
                                { key: 'contingency', label: 'Dự phòng' },
                            ].map((item) => (
                                <tr key={item.key} className="hover:bg-gray-50/50 dark:hover:bg-slate- transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-slate-300">
                                        {item.label}
                                    </td>
                                    <td className="px-4 py-2">
                                        <FormattedInput 
                                            placeholder="0" 
                                            className={inputWithIconClass}
                                            value={formData.CostBreakdown?.[item.key] || 0}
                                            onChange={(v: number) => updateCostBreakdown(item.key, v)}
                                            icon={DollarSign} 
                                            isDecimal={false} 
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-blue-50/50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-slate-700">
                            <tr>
                                <td className="px-4 py-3 font-bold text-gray-800 dark:text-slate-200 text-right">Tổng cộng:</td>
                                <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400 text-lg">
                                    {new Intl.NumberFormat('vi-VN').format(
                                        ['landClearance', 'construction', 'equipment', 'consultancy', 'management', 'other', 'contingency']
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
