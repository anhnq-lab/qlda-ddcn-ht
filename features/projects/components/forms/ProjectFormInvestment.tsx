import React from 'react';
import { DollarSign, Calendar, ChevronDown, Check, MapPin, Clock, Shield, User, FileText } from 'lucide-react';
import { SectionHeader, FormattedInput, labelClass, inputWithIconClass, iconClass, selectWithIconClass, PROVINCES } from './FormShared';

interface ProjectFormInvestmentProps {
    formData: Record<string, any>;
    updateField: (field: string, value: any) => void;
    aiHighlight: (field: string) => string;
    showCapitalDropdown: boolean;
    setShowCapitalDropdown: (show: boolean) => void;
}

export const ProjectFormInvestment: React.FC<ProjectFormInvestmentProps> = ({
    formData,
    updateField,
    aiHighlight,
    showCapitalDropdown,
    setShowCapitalDropdown
}) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SectionHeader icon={DollarSign} title="Thông tin đầu tư" subtitle="Vốn, địa điểm và thời gian thực hiện" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Investment */}
                <div>
                    <label className={labelClass}>Tổng mức đầu tư (VNĐ)</label>
                    <FormattedInput
                        placeholder="0"
                        className={inputWithIconClass + aiHighlight('TotalInvestment')}
                        value={formData.TotalInvestment}
                        onChange={(v: number) => updateField('TotalInvestment', v)}
                        icon={DollarSign}
                        isDecimal={false}
                    />
                </div>

                {/* Start Date */}
                <div>
                    <label className={labelClass}>Ngày bắt đầu dự kiến</label>
                    <div className="relative">
                        <input
                            type="date"
                            className={inputWithIconClass + aiHighlight('StartDate')}
                            value={formData.StartDate}
                            onChange={e => updateField('StartDate', e.target.value)}
                        />
                        <Calendar className={iconClass} />
                    </div>
                </div>

                {/* Capital Source */}
                <div className="relative z-20">
                    <label className={labelClass}>Nguồn vốn đầu tư</label>
                    <div 
                        className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 cursor-pointer flex justify-between items-center transition-all ${showCapitalDropdown ? 'ring-2 ring-blue-500/20 border-blue-500 dark:border-blue-400' : ''}`}
                        onClick={() => setShowCapitalDropdown(!showCapitalDropdown)}
                    >
                        <span className={formData.CapitalSource ? 'text-gray-800 dark:text-slate-100 line-clamp-1' : 'text-gray-500 dark:text-slate-400'}>
                            {formData.CapitalSource || 'Chọn nguồn vốn...'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-slate-400 transition-transform ${showCapitalDropdown ? 'rotate-180' : ''}`} />
                    </div>

                    {showCapitalDropdown && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowCapitalDropdown(false)} />
                            <div className="absolute z-20 mt-1 w-full bg-bg-surface border border-gray-200 dark:border-slate-600 rounded-xl shadow-sm overflow-hidden py-1">
                                {['Ngân sách Trung ương', 'Ngân sách Địa phương', 'Vốn ODA', 'Vốn tư nhân', 'Khác'].map(source => {
                                    const currentSources = formData.CapitalSource ? formData.CapitalSource.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                                    const isSelected = currentSources.includes(source);
                                    return (
                                        <div 
                                            key={source}
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-app dark:bg-slate-900 dark:hover:bg-slate-700 cursor-pointer"
                                            onClick={() => {
                                                const newSources = isSelected 
                                                    ? currentSources.filter((s: string) => s !== source)
                                                    : [...currentSources, source];
                                                updateField('CapitalSource', newSources.join(', '));
                                            }}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-slate-500'}`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-sm text-gray-700 dark:text-slate-200">{source}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Province */}
                <div>
                    <label className={labelClass}>Tỉnh/Thành phố <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <select
                            className={selectWithIconClass}
                            value={formData.ProvinceCode}
                            onChange={e => updateField('ProvinceCode', e.target.value)}
                        >
                            {PROVINCES.map(p => (
                                <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                            ))}
                        </select>
                        <MapPin className={iconClass} />
                    </div>
                </div>

                {/* Location (free text) */}
                <div>
                    <label className={labelClass}>Địa điểm xây dựng</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="VD: Xã Thạch Hạ, TP. Hà Tĩnh"
                            className={inputWithIconClass + aiHighlight('LocationCode')}
                            value={formData.LocationCode}
                            onChange={e => updateField('LocationCode', e.target.value)}
                        />
                        <MapPin className={iconClass} />
                    </div>
                </div>

                {/* Duration */}
                <div>
                    <label className={labelClass}>Thời gian thực hiện</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="VD: 36 tháng (2025-2028)"
                            className={inputWithIconClass + aiHighlight('Duration')}
                            value={formData.Duration}
                            onChange={e => updateField('Duration', e.target.value)}
                        />
                        <Clock className={iconClass} />
                    </div>
                </div>

                {/* Competent Authority */}
                <div>
                    <label className={labelClass}>Người quyết định đầu tư</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="VD: UBND TP.HCM"
                            className={inputWithIconClass + aiHighlight('CompetentAuthority')}
                            value={formData.CompetentAuthority}
                            onChange={e => updateField('CompetentAuthority', e.target.value)}
                        />
                        <Shield className={iconClass} />
                    </div>
                </div>
            </div>

            {/* Investor Name - full width */}
            <div className="mt-4">
                <label className={labelClass}>Tên chủ đầu tư</label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="VD: Ban QLDA Đầu tư xây dựng khu vực..."
                        className={inputWithIconClass + aiHighlight('InvestorName')}
                        value={formData.InvestorName}
                        onChange={e => updateField('InvestorName', e.target.value)}
                    />
                    <User className={iconClass} />
                </div>
            </div>

            {/* Quyết định phê duyệt */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <label className={labelClass}>Số quyết định phê duyệt dự án</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Số QĐ phê duyệt..."
                            className={inputWithIconClass + aiHighlight('DecisionNumber')}
                            value={formData.DecisionNumber}
                            onChange={e => updateField('DecisionNumber', e.target.value)}
                        />
                        <FileText className={iconClass} />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Ngày phê duyệt dự án</label>
                    <div className="relative">
                        <input
                            type="date"
                            className={inputWithIconClass + aiHighlight('ApprovalDate')}
                            value={formData.ApprovalDate}
                            onChange={e => updateField('ApprovalDate', e.target.value)}
                        />
                        <Calendar className={iconClass} />
                    </div>
                </div>
            </div>
        </div>
    );
};

