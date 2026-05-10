import React from 'react';
import { TrendingUp, DollarSign, BarChart2, FileText, Calendar, Percent } from 'lucide-react';
import { SectionHeader, FormattedInput, labelClass, inputWithIconClass, iconClass } from './FormShared';

interface ProjectFormKHVProps {
    formData: Record<string, any>;
    updateField: (field: string, value: any) => void;
}

export const ProjectFormKHV: React.FC<ProjectFormKHVProps> = ({ formData, updateField }) => {
    const khv = formData.KHVInfo || {};
    const tracking = formData.ImplementationTracking || {};

    const setKHV = (key: string, v: any) => updateField('KHVInfo', { ...khv, [key]: v });
    const setTracking = (key: string, v: any) => updateField('ImplementationTracking', { ...tracking, [key]: v });

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SectionHeader icon={BarChart2} title="KHV & Theo dõi giải ngân" subtitle="Kế hoạch vốn được giao và tình hình thực hiện, giải ngân" />

            {/* ── Quyết định giao KHV ── */}
            <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" /> Quyết định giao kế hoạch vốn (KHV)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Số QĐ giao KHV</label>
                        <div className="relative">
                            <input type="text" placeholder="VD: 234/QĐ-UBND"
                                className={inputWithIconClass}
                                value={khv.decisionNumber || ''}
                                onChange={e => setKHV('decisionNumber', e.target.value)} />
                            <FileText className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Ngày QĐ</label>
                        <div className="relative">
                            <input type="date"
                                className={inputWithIconClass}
                                value={khv.decisionDate || ''}
                                onChange={e => setKHV('decisionDate', e.target.value)} />
                            <Calendar className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Mã nguồn vốn</label>
                        <div className="relative">
                            <input type="text" placeholder="VD: NS-ĐP-01"
                                className={inputWithIconClass}
                                value={khv.fundingSourceCode || ''}
                                onChange={e => setKHV('fundingSourceCode', e.target.value)} />
                            <FileText className={iconClass} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── KH Vốn được giao ── */}
            <div className="pt-5 border-t border-gray-100 dark:border-slate-700/50">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Kế hoạch vốn được giao (VNĐ)
                </h4>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Phân bổ theo năm kế hoạch</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Tổng KHV</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={khv.total || 0}
                            onChange={(v: number) => setKHV('total', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>KH 2025 kéo dài</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={khv.year2025Extended || 0}
                            onChange={(v: number) => setKHV('year2025Extended', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>KH 2026</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={khv.year2026 || 0}
                            onChange={(v: number) => setKHV('year2026', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>KH vốn còn lại</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={tracking.remainingCapital || 0}
                            onChange={(v: number) => setTracking('remainingCapital', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                </div>
            </div>

            {/* ── Khối lượng thực hiện ── */}
            <div className="pt-5 border-t border-gray-100 dark:border-slate-700/50">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-500" /> Khối lượng thực hiện
                </h4>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Cập nhật theo báo cáo định kỳ (đơn vị: VNĐ)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className={labelClass}>Tổng cộng</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={tracking.totalVolume || 0}
                            onChange={(v: number) => setTracking('totalVolume', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>Lũy kế đầu năm</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={tracking.ytdVolume || 0}
                            onChange={(v: number) => setTracking('ytdVolume', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>Thực hiện trong kỳ</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={tracking.periodVolume || 0}
                            onChange={(v: number) => setTracking('periodVolume', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>Tỷ lệ (%)</label>
                        <div className="relative">
                            <input type="number" min="0" max="100" step="0.1" placeholder="0"
                                className={inputWithIconClass}
                                value={tracking.volumeRate || ''}
                                onChange={e => setTracking('volumeRate', Number(e.target.value))} />
                            <Percent className={iconClass} />
                        </div>
                    </div>
                    <div className="col-span-2">
                        <label className={labelClass}>KL hoàn thành chưa giải ngân</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={tracking.completedNotDisbursed || 0}
                            onChange={(v: number) => setTracking('completedNotDisbursed', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                </div>
            </div>

            {/* ── Số đã giải ngân ── */}
            <div className="pt-5 border-t border-gray-100 dark:border-slate-700/50">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-500" /> Số đã giải ngân
                </h4>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Theo dõi giải ngân ngân sách (đơn vị: VNĐ)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className={labelClass}>Tổng cộng</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={tracking.totalDisbursed || 0}
                            onChange={(v: number) => setTracking('totalDisbursed', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>Lũy kế đầu năm</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={tracking.ytdDisbursed || 0}
                            onChange={(v: number) => setTracking('ytdDisbursed', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>Giải ngân trong kỳ</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={tracking.periodDisbursed || 0}
                            onChange={(v: number) => setTracking('periodDisbursed', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>Tỷ lệ giải ngân (%)</label>
                        <div className="relative">
                            <input type="number" min="0" max="100" step="0.1" placeholder="0"
                                className={inputWithIconClass}
                                value={tracking.disbursementRate || ''}
                                onChange={e => setTracking('disbursementRate', Number(e.target.value))} />
                            <Percent className={iconClass} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
