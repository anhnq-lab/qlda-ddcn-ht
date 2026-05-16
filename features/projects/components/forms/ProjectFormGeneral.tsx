import React from 'react';
import { Building2, Calendar, Shield, DollarSign, Layers, MapPin, Clock, User, HardHat } from 'lucide-react';
import { MANAGEMENT_BOARDS } from '../../../../types';
import { SectionHeader, labelClass, inputClass, inputWithIconClass, iconClass, selectWithIconClass, PROVINCES, CONSTRUCTION_TYPES } from './FormShared';

interface ProjectFormGeneralProps {
    formData: Record<string, any>;
    updateField: (field: string, value: any) => void;
    aiHighlight: (field: string) => string;
    errors?: Record<string, any>;
}

export const ProjectFormGeneral: React.FC<ProjectFormGeneralProps> = ({
    formData,
    updateField,
    aiHighlight,
    errors = {},
}) => {
    const err = (f: string) => errors[f]?.message as string | undefined;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">

            {/* ── Thông tin cơ bản ── */}
            <SectionHeader icon={Building2} title="Thông tin cơ bản" subtitle="Định danh và phân loại dự án" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <label className={labelClass}>
                        Mã dự án <span className="text-red-500">*</span> <span className="text-blue-500 dark:text-blue-400 text-xs font-normal">(Tự động theo TT24 hoặc nhập tay)</span>
                    </label>
                    <input
                        type="text"
                        className={`${inputClass} font-mono ${err('ProjectID') ? 'border-red-400 dark:border-red-500' : ''} ${aiHighlight('ProjectID')}`}
                        value={formData.ProjectID}
                        onChange={e => updateField('ProjectID', e.target.value)}
                        placeholder="Nhập mã dự án..."
                    />
                    {err('ProjectID') && <p className="text-xs text-red-500 mt-1">{err('ProjectID')}</p>}
                </div>
                <div>
                    <label className={labelClass}>Nhóm dự án</label>
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
            </div>

            <div className="mt-4">
                <label className={labelClass}>Tên dự án <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    placeholder="VD: Xây dựng Đường Cao tốc Bắc Nam..."
                    className={`${inputClass} ${err('ProjectName') ? 'border-red-400 dark:border-red-500' : ''}${aiHighlight('ProjectName')}`}
                    value={formData.ProjectName}
                    onChange={e => updateField('ProjectName', e.target.value)}
                />
                {err('ProjectName') && <p className="text-xs text-red-500 mt-1">{err('ProjectName')}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <label className={labelClass}>Mục tiêu đầu tư</label>
                    <textarea
                        placeholder="VD: Đáp ứng yêu cầu..."
                        className={inputClass + ' min-h-[72px] resize-none' + aiHighlight('Objective')}
                        value={formData.Objective}
                        onChange={e => updateField('Objective', e.target.value)}
                        rows={2}
                    />
                </div>
                <div>
                    <label className={labelClass}>Tóm tắt quy mô đầu tư</label>
                    <textarea
                        placeholder="VD: Cải tạo, sửa chữa..."
                        className={inputClass + ' min-h-[72px] resize-none' + aiHighlight('InvestmentScale')}
                        value={formData.InvestmentScale}
                        onChange={e => updateField('InvestmentScale', e.target.value)}
                        rows={2}
                    />
                </div>
            </div>

            {/* ── Phòng QLDA ── */}
            <div className="mt-4">
                <label className={labelClass}>Phòng Quản Lý Dự Án</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {MANAGEMENT_BOARDS.map(board => (
                        <button key={board.value} type="button"
                            onClick={() => updateField('ManagementBoard', board.value)}
                            className={`py-2 px-3 rounded-xl text-sm font-semibold transition-all border-2 text-center ${
                                formData.ManagementBoard === board.value
                                    ? `${board.color} text-white border-transparent shadow-md scale-[1.02]`
                                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-400 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}>
                            {board.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Thông tin đầu tư cơ bản ── */}
            <div className="pt-5 border-t border-gray-100 dark:border-slate-500/50">
                <SectionHeader icon={DollarSign} title="Thông tin đầu tư" subtitle="Vốn, địa điểm và thời gian thực hiện" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

                    {/* Loại công trình */}
                    <div>
                        <label className={labelClass}>Loại công trình</label>
                        <div className="relative">
                            <select
                                className={`${selectWithIconClass}${aiHighlight('ConstructionType')}`}
                                value={formData.ConstructionType || ''}
                                onChange={e => updateField('ConstructionType', e.target.value)}
                            >
                                <option value="">-- Chọn loại --</option>
                                {CONSTRUCTION_TYPES.map(t => (
                                    <option key={t.value} value={t.label}>{t.label}</option>
                                ))}
                            </select>
                            <HardHat className={iconClass} />
                        </div>
                    </div>

                    {/* Tỉnh / Thành phố */}
                    <div>
                        <label className={labelClass}>Tỉnh/Thành phố</label>
                        <div className="relative">
                            <select
                                className={selectWithIconClass}
                                value={formData.ProvinceCode}
                                onChange={e => updateField('ProvinceCode', e.target.value)}
                            >
                                {PROVINCES.map(p => (
                                    <option key={p.code} value={p.code}>{p.name}</option>
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
                        <label className={labelClass}>Khởi công (dự kiến) <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input type="date"
                                className={`${inputWithIconClass} ${err('StartDate') ? 'border-red-400 dark:border-red-500' : ''}${aiHighlight('StartDate')}`}
                                value={formData.StartDate}
                                onChange={e => updateField('StartDate', e.target.value)}
                            />
                            <Calendar className={iconClass} />
                        </div>
                        {err('StartDate') && <p className="text-xs text-red-500 mt-1">{err('StartDate')}</p>}
                    </div>

                    {/* Ngày hoàn thành */}
                    <div>
                        <label className={labelClass}>Hoàn thành (dự kiến)</label>
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
                                placeholder="VD: 36 tháng"
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

                    {/* Chủ đầu tư */}
                    <div>
                        <label className={labelClass}>Tên chủ đầu tư</label>
                        <div className="relative">
                            <input type="text"
                                placeholder="Tên CĐT..."
                                className={inputWithIconClass + aiHighlight('InvestorName')}
                                value={formData.InvestorName}
                                onChange={e => updateField('InvestorName', e.target.value)}
                            />
                            <User className={iconClass} />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
