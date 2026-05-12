import React, { useState } from 'react';
import { Building2, FileText, Calendar, Shield, DollarSign, Ruler, Layers, MapPin, Clock, User, ChevronDown, Check, ArrowLeftRight } from 'lucide-react';
import { MANAGEMENT_BOARDS } from '../../../../types';
import { SectionHeader, FormattedInput, labelClass, inputClass, inputWithIconClass, iconClass, selectWithIconClass, PROVINCES, CONSTRUCTION_GRADES } from './FormShared';

interface ProjectFormGeneralProps {
    formData: Record<string, any>;
    updateField: (field: string, value: any) => void;
    aiHighlight: (field: string) => string;
}

export const ProjectFormGeneral: React.FC<ProjectFormGeneralProps> = ({
    formData,
    updateField,
    aiHighlight,
}) => {
    const [showCapitalDropdown, setShowCapitalDropdown] = useState(false);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">

            {/* ── Thông tin cơ bản ── */}
            <SectionHeader icon={Building2} title="Thông tin cơ bản" subtitle="Định danh và phân loại dự án" />

            <div>
                <label className={labelClass}>
                    Mã dự án <span className="text-blue-500 dark:text-blue-400 text-xs font-normal">(Tự động theo TT24/2025 hoặc nhập tay)</span>
                </label>
                <input
                    type="text"
                    className={`${inputClass} font-mono ${aiHighlight('ProjectID')}`}
                    value={formData.ProjectID}
                    onChange={e => updateField('ProjectID', e.target.value)}
                    placeholder="Nhập mã dự án..."
                />
            </div>

            <div>
                <label className={labelClass}>Tên dự án <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    required
                    placeholder="VD: Xây dựng Đường Cao tốc Bắc Nam..."
                    className={inputClass + aiHighlight('ProjectName')}
                    value={formData.ProjectName}
                    onChange={e => updateField('ProjectName', e.target.value)}
                />
            </div>

            <div>
                <label className={labelClass}>Nhóm dự án <span className="text-red-500">*</span></label>
                <div className="relative">
                    <select
                        className={selectWithIconClass + aiHighlight('GroupCode')}
                        value={formData.GroupCode || 'C'}
                        onChange={e => updateField('GroupCode', e.target.value)}
                    >
                        <option value="QN">Quan trọng Quốc gia</option>
                        <option value="A">Nhóm A</option>
                        <option value="B">Nhóm B</option>
                        <option value="C">Nhóm C</option>
                    </select>
                    <Layers className={iconClass} />
                </div>
            </div>

            <div>
                <label className={labelClass}>Mục tiêu đầu tư</label>
                <textarea
                    placeholder="VD: Đáp ứng yêu cầu tổ chức các giải đấu quốc tế..."
                    className={inputClass + ' min-h-[72px] resize-none' + aiHighlight('Objective')}
                    value={formData.Objective}
                    onChange={e => updateField('Objective', e.target.value)}
                    rows={2}
                    onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                />
            </div>

            <div>
                <label className={labelClass}>Tóm tắt quy mô đầu tư</label>
                <textarea
                    placeholder="VD: Cải tạo, sửa chữa hiện trạng công trình gồm: trệt + mái tôn..."
                    className={inputClass + ' min-h-[72px] resize-none' + aiHighlight('InvestmentScale')}
                    value={formData.InvestmentScale}
                    onChange={e => updateField('InvestmentScale', e.target.value)}
                    rows={2}
                    onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                />
            </div>

            {/* ── Thông tin đầu tư cơ bản ── */}
            <div className="pt-5 border-t border-gray-100 dark:border-slate-700/50">
                <SectionHeader icon={DollarSign} title="Thông tin đầu tư" subtitle="Vốn, địa điểm và thời gian thực hiện" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Tổng mức đầu tư */}
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

                    {/* Nguồn vốn */}
                    <div className="relative z-20">
                        <label className={labelClass}>Nguồn vốn đầu tư</label>
                        <div
                            className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 cursor-pointer flex justify-between items-center transition-all ${showCapitalDropdown ? 'ring-2 ring-blue-500/20 border-blue-500 dark:border-blue-400' : ''}`}
                            onClick={() => setShowCapitalDropdown(!showCapitalDropdown)}
                        >
                            <span className={formData.CapitalSource ? 'text-gray-800 dark:text-slate-100 line-clamp-1 text-sm' : 'text-gray-500 dark:text-slate-400 text-sm'}>
                                {formData.CapitalSource || 'Chọn nguồn vốn...'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCapitalDropdown ? 'rotate-180' : ''}`} />
                        </div>
                        {showCapitalDropdown && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowCapitalDropdown(false)} />
                                <div className="absolute z-20 mt-1 w-full bg-bg-surface border border-gray-200 dark:border-slate-600 rounded-xl shadow-sm overflow-hidden py-1">
                                    {['Ngân sách Trung ương', 'Ngân sách Địa phương', 'Vốn ODA', 'Vốn tư nhân', 'Khác'].map(source => {
                                        const current = formData.CapitalSource ? formData.CapitalSource.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                                        const isSelected = current.includes(source);
                                        return (
                                            <div key={source} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-app dark:hover:bg-slate-700 cursor-pointer"
                                                onClick={() => {
                                                    const next = isSelected ? current.filter((s: string) => s !== source) : [...current, source];
                                                    updateField('CapitalSource', next.join(', '));
                                                }}>
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

                    {/* Tỉnh / Thành phố */}
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

                    {/* Địa điểm */}
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

                    {/* Ngày khởi công */}
                    <div>
                        <label className={labelClass}>Ngày khởi công dự kiến</label>
                        <div className="relative">
                            <input type="date"
                                className={inputWithIconClass + aiHighlight('StartDate')}
                                value={formData.StartDate}
                                onChange={e => updateField('StartDate', e.target.value)}
                            />
                            <Calendar className={iconClass} />
                        </div>
                    </div>

                    {/* Ngày hoàn thành */}
                    <div>
                        <label className={labelClass}>Ngày hoàn thành dự kiến</label>
                        <div className="relative">
                            <input type="date"
                                className={inputWithIconClass + aiHighlight('ExpectedEndDate')}
                                value={formData.ExpectedEndDate || ''}
                                onChange={e => updateField('ExpectedEndDate', e.target.value)}
                            />
                            <Calendar className={iconClass} />
                        </div>
                    </div>

                    {/* Thời gian */}
                    <div>
                        <label className={labelClass}>Thời gian thực hiện</label>
                        <div className="relative">
                            <input type="text"
                                placeholder="VD: 36 tháng (2025-2028)"
                                className={inputWithIconClass + aiHighlight('Duration')}
                                value={formData.Duration}
                                onChange={e => updateField('Duration', e.target.value)}
                            />
                            <Clock className={iconClass} />
                        </div>
                    </div>

                    {/* Người quyết định đầu tư */}
                    <div>
                        <label className={labelClass}>Người quyết định đầu tư</label>
                        <div className="relative">
                            <input type="text"
                                placeholder="VD: UBND tỉnh Hà Tĩnh"
                                className={inputWithIconClass + aiHighlight('CompetentAuthority')}
                                value={formData.CompetentAuthority}
                                onChange={e => updateField('CompetentAuthority', e.target.value)}
                            />
                            <Shield className={iconClass} />
                        </div>
                    </div>
                </div>

                {/* Chủ đầu tư — full width */}
                <div className="mt-4">
                    <label className={labelClass}>Tên chủ đầu tư</label>
                    <div className="relative">
                        <input type="text"
                            placeholder="VD: Ban Quản lý dự án đầu tư xây dựng công trình dân dụng và hạ tầng khu vực"
                            className={inputWithIconClass + aiHighlight('InvestorName')}
                            value={formData.InvestorName}
                            onChange={e => updateField('InvestorName', e.target.value)}
                        />
                        <User className={iconClass} />
                    </div>
                </div>
            </div>

            {/* ── Quyết định chủ trương đầu tư ── */}
            <div className="pt-5 border-t border-gray-100 dark:border-slate-700/50">
                <SectionHeader icon={FileText} title="Quyết định chủ trương đầu tư" subtitle="Cấp phê duyệt và số quyết định chủ trương" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className={labelClass}>Cấp quyết định chủ trương</label>
                        <div className="relative">
                            <select className={selectWithIconClass}
                                value={formData.PolicyDecisionLevel || ''}
                                onChange={e => updateField('PolicyDecisionLevel', e.target.value)}>
                                <option value="">-- Chọn cấp quyết định --</option>
                                <option value="Quốc hội">Quốc hội</option>
                                <option value="Chính phủ">Chính phủ</option>
                                <option value="Thủ tướng Chính phủ">Thủ tướng Chính phủ</option>
                                <option value="Bộ trưởng">Bộ trưởng / Thủ trưởng cơ quan TW</option>
                                <option value="UBND tỉnh">UBND tỉnh / thành phố</option>
                                <option value="UBND huyện">UBND huyện / quận</option>
                            </select>
                            <Shield className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Số QĐ chủ trương (CBT số)</label>
                        <div className="relative">
                            <input type="text" placeholder="VD: 123/QĐ-UBND"
                                className={inputWithIconClass + aiHighlight('PolicyDecisionNumber')}
                                value={formData.PolicyDecisionNumber || ''}
                                onChange={e => updateField('PolicyDecisionNumber', e.target.value)}
                            />
                            <FileText className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Cơ quan ban hành</label>
                        <div className="relative">
                            <input type="text" placeholder="VD: UBND tỉnh Hà Tĩnh"
                                className={inputWithIconClass + aiHighlight('PolicyDecisionAuthority')}
                                value={formData.PolicyDecisionAuthority || ''}
                                onChange={e => updateField('PolicyDecisionAuthority', e.target.value)}
                            />
                            <Shield className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Ngày ban hành QĐ chủ trương</label>
                        <div className="relative">
                            <input type="date"
                                className={inputWithIconClass + aiHighlight('PolicyDecisionDate')}
                                value={formData.PolicyDecisionDate || ''}
                                onChange={e => updateField('PolicyDecisionDate', e.target.value)}
                            />
                            <Calendar className={iconClass} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Quyết định phê duyệt dự án ── */}
            <div className="pt-5 border-t border-gray-100 dark:border-slate-700/50">
                <SectionHeader icon={FileText} title="Quyết định phê duyệt dự án" subtitle="Số, cơ quan và ngày phê duyệt" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className={labelClass}>Số quyết định phê duyệt</label>
                        <div className="relative">
                            <input type="text" placeholder="Số QĐ phê duyệt..."
                                className={inputWithIconClass + aiHighlight('DecisionNumber')}
                                value={formData.DecisionNumber || ''}
                                onChange={e => updateField('DecisionNumber', e.target.value)}
                            />
                            <FileText className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Cơ quan phê duyệt</label>
                        <div className="relative">
                            <input type="text" placeholder="VD: UBND tỉnh Hà Tĩnh"
                                className={inputWithIconClass + aiHighlight('DecisionAuthority')}
                                value={formData.DecisionAuthority || ''}
                                onChange={e => updateField('DecisionAuthority', e.target.value)}
                            />
                            <Shield className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Ngày phê duyệt</label>
                        <div className="relative">
                            <input type="date"
                                className={inputWithIconClass + aiHighlight('ApprovalDate')}
                                value={formData.ApprovalDate || ''}
                                onChange={e => updateField('ApprovalDate', e.target.value)}
                            />
                            <Calendar className={iconClass} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Quy mô công trình ── */}
            <div className="pt-5 border-t border-gray-100 dark:border-slate-700/50">
                <SectionHeader icon={Ruler} title="Quy mô công trình" subtitle="Thông số kỹ thuật: diện tích, tầng, chiều cao" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className={labelClass}>Cấp công trình</label>
                        <div className="relative">
                            <select
                                className={selectWithIconClass + aiHighlight('ConstructionGrade')}
                                value={formData.ConstructionGrade || ''}
                                onChange={e => updateField('ConstructionGrade', e.target.value)}
                            >
                                <option value="">-- Chọn cấp --</option>
                                {CONSTRUCTION_GRADES.map(g => (
                                    <option key={g.value} value={g.value}>{g.label}</option>
                                ))}
                            </select>
                            <Building2 className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Tổng dự toán (VNĐ)</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={formData.TotalEstimate || 0}
                            onChange={(v: number) => updateField('TotalEstimate', v)}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                    <div>
                        <label className={labelClass}>Diện tích khu đất (m²)</label>
                        <FormattedInput placeholder="0" className={inputClass}
                            value={formData.SiteArea || 0}
                            onChange={(v: number) => updateField('SiteArea', v)} isDecimal={true} />
                    </div>
                    <div>
                        <label className={labelClass}>DT xây dựng (m²)</label>
                        <FormattedInput placeholder="0" className={inputClass}
                            value={formData.ConstructionArea || 0}
                            onChange={(v: number) => updateField('ConstructionArea', v)} isDecimal={true} />
                    </div>
                    <div>
                        <label className={labelClass}>DT sàn sử dụng (m²)</label>
                        <FormattedInput placeholder="0" className={inputClass}
                            value={formData.FloorArea || 0}
                            onChange={(v: number) => updateField('FloorArea', v)} isDecimal={true} />
                    </div>
                    <div>
                        <label className={labelClass}>Chiều cao (m)</label>
                        <FormattedInput placeholder="0" className={inputClass}
                            value={formData.BuildingHeight || 0}
                            onChange={(v: number) => updateField('BuildingHeight', v)} isDecimal={true} />
                    </div>
                    <div>
                        <label className={labelClass}>Mật độ xây dựng (%)</label>
                        <FormattedInput placeholder="0" className={inputClass}
                            value={formData.BuildingDensity || 0}
                            onChange={(v: number) => updateField('BuildingDensity', v)} isDecimal={true} />
                    </div>
                    <div>
                        <label className={labelClass}>Hệ số sử dụng đất</label>
                        <FormattedInput placeholder="0" className={inputClass}
                            value={formData.LandUseCoefficient || 0}
                            onChange={(v: number) => updateField('LandUseCoefficient', v)} isDecimal={true} />
                    </div>
                    <div>
                        <label className={labelClass}>Số tầng nổi</label>
                        <div className="relative">
                            <input type="number" min="0" step="1" placeholder="0"
                                className={inputWithIconClass}
                                value={formData.AboveGroundFloors || ''}
                                onChange={e => updateField('AboveGroundFloors', Number(e.target.value))} />
                            <Layers className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Số tầng hầm</label>
                        <div className="relative">
                            <input type="number" min="0" step="1" placeholder="0"
                                className={inputWithIconClass}
                                value={formData.BasementFloors || ''}
                                onChange={e => updateField('BasementFloors', Number(e.target.value))} />
                            <Layers className={iconClass} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bàn giao & Chuyển CĐT ── */}
            <div className="pt-5 border-t border-gray-100 dark:border-slate-700/50">
                <SectionHeader icon={ArrowLeftRight} title="Bàn giao & Chuyển chủ đầu tư" subtitle="Thông tin về CĐT cũ và quyết định chuyển giao (nếu có)" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className={labelClass}>Cấp QĐ đầu tư trước bàn giao</label>
                        <div className="relative">
                            <select className={selectWithIconClass}
                                value={formData.DecisionLevelBeforeHandover || ''}
                                onChange={e => updateField('DecisionLevelBeforeHandover', e.target.value)}>
                                <option value="">-- Chọn cấp --</option>
                                <option value="Quốc hội">Quốc hội</option>
                                <option value="Chính phủ">Chính phủ</option>
                                <option value="Thủ tướng Chính phủ">Thủ tướng Chính phủ</option>
                                <option value="Bộ trưởng">Bộ trưởng / Thủ trưởng cơ quan TW</option>
                                <option value="UBND tỉnh">UBND tỉnh / thành phố</option>
                                <option value="UBND huyện">UBND huyện / quận</option>
                            </select>
                            <Shield className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Chủ đầu tư cũ (CĐT cũ)</label>
                        <div className="relative">
                            <input type="text" placeholder="Tên CĐT trước khi bàn giao..."
                                className={inputWithIconClass + aiHighlight('OldInvestor')}
                                value={formData.OldInvestor || ''}
                                onChange={e => updateField('OldInvestor', e.target.value)} />
                            <User className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Số QĐ chuyển CĐT</label>
                        <div className="relative">
                            <input type="text" placeholder="VD: 789/QĐ-UBND"
                                className={inputWithIconClass + aiHighlight('TransferDecision')}
                                value={formData.TransferDecision || ''}
                                onChange={e => updateField('TransferDecision', e.target.value)} />
                            <FileText className={iconClass} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Phòng QLDA ── */}
            <div className="pt-5 border-t border-gray-100 dark:border-slate-700/50">
                <label className={labelClass}>Phòng Quản Lý Dự Án</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {MANAGEMENT_BOARDS.map(board => (
                        <button key={board.value} type="button"
                            onClick={() => updateField('ManagementBoard', board.value)}
                            className={`py-2 px-3 rounded-xl text-sm font-semibold transition-all border-2 text-center ${
                                formData.ManagementBoard === board.value
                                    ? `${board.color} text-white border-transparent shadow-md scale-[1.02]`
                                    : 'bg-bg-surface text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}>
                            {board.label}
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full" />
                    Nhóm dự án tự động áp dụng thời gian chuẩn theo Luật ĐTC
                </p>
            </div>
        </div>
    );
};
