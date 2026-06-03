import React from 'react';
import { HardHat, FileText, Search, Shield, Gavel, Building, User, MapPin, Hash, Users } from 'lucide-react';
import { SectionHeader, labelClass, inputWithIconClass, iconClass, selectWithIconClass } from './FormShared';

interface ProjectFormContractorsProps {
    formData: Record<string, any>;
    updateField: (field: string, value: any) => void;
    aiHighlight: (field: string) => string;
}

export const ProjectFormContractors: React.FC<ProjectFormContractorsProps> = ({
    formData,
    updateField,
    aiHighlight
}) => {
    const cd = formData.ContractorDetails || {};
    const pm = formData.ProjectManagement || {};

    const setCD = (key: string, v: string) => updateField('ContractorDetails', { ...cd, [key]: v });
    const setPM = (key: string, v: string) => updateField('ProjectManagement', { ...pm, [key]: v });

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SectionHeader icon={HardHat} title="Nhà thầu & Tiêu chuẩn" subtitle="Thông tin đơn vị thực hiện và tiêu chuẩn áp dụng" />

            {/* ── Hình thức lựa chọn nhà thầu ── */}
            <div>
                <label className={labelClass}>Hình thức lựa chọn nhà thầu</label>
                <div className="relative">
                    <select
                        className={selectWithIconClass + aiHighlight('BiddingForm')}
                        value={formData.BiddingForm || ''}
                        onChange={e => updateField('BiddingForm', e.target.value)}
                    >
                        <option value="">-- Chọn hình thức --</option>
                        <option value="Đấu thầu rộng rãi">Đấu thầu rộng rãi</option>
                        <option value="Đấu thầu hạn chế">Đấu thầu hạn chế</option>
                        <option value="Chỉ định thầu">Chỉ định thầu</option>
                        <option value="Chào hàng cạnh tranh">Chào hàng cạnh tranh</option>
                        <option value="Mua sắm trực tiếp">Mua sắm trực tiếp</option>
                        <option value="Tự thực hiện">Tự thực hiện</option>
                        <option value="Tham gia thực hiện cộng đồng">Tham gia thực hiện cộng đồng</option>
                    </select>
                    <Gavel className={iconClass} />
                </div>
            </div>

            {/* ── Tiêu chuẩn áp dụng + Nhà thầu chính ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Tiêu chuẩn, quy chuẩn áp dụng</label>
                    <div className="relative">
                        <input type="text"
                            placeholder="VD: TCVN 5574:2018, QCVN 03:2022/BXD..."
                            className={inputWithIconClass + aiHighlight('ApplicableStandards')}
                            value={formData.ApplicableStandards}
                            onChange={e => updateField('ApplicableStandards', e.target.value)}
                        />
                        <FileText className={iconClass} />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Tên nhà thầu chính</label>
                    <div className="relative">
                        <input type="text"
                            placeholder="Tên nhà thầu thi công chính..."
                            className={inputWithIconClass}
                            value={formData.MainContractorName || ''}
                            onChange={e => updateField('MainContractorName', e.target.value)}
                        />
                        <Building className={iconClass} />
                    </div>
                </div>
            </div>

            {/* ── Nhà thầu tư vấn ── */}
            <div className="pt-4 border-t border-border-subtle">
                <h4 className="text-sm font-semibold text-txt-secondary mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-500" /> Nhà thầu tư vấn
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>NT lập BCNCKT</label>
                        <div className="relative">
                            <input type="text" placeholder="Tên nhà thầu..."
                                className={inputWithIconClass}
                                value={formData.FeasibilityContractor}
                                onChange={e => updateField('FeasibilityContractor', e.target.value)} />
                            <HardHat className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>NT khảo sát xây dựng</label>
                        <div className="relative">
                            <input type="text" placeholder="Tên nhà thầu..."
                                className={inputWithIconClass}
                                value={formData.SurveyContractor}
                                onChange={e => updateField('SurveyContractor', e.target.value)} />
                            <Search className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>NT thẩm tra</label>
                        <div className="relative">
                            <input type="text" placeholder="Tên nhà thầu..."
                                className={inputWithIconClass}
                                value={formData.ReviewContractor}
                                onChange={e => updateField('ReviewContractor', e.target.value)} />
                            <Shield className={iconClass} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Đơn vị thực hiện ── */}
            <div className="pt-5 border-t border-border-subtle">
                <h4 className="text-sm font-semibold text-txt-secondary mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4 text-violet-500" /> Đơn vị thực hiện (Nhà thầu thi công)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Tên đơn vị</label>
                        <div className="relative">
                            <input type="text" placeholder="Tên công ty..."
                                className={inputWithIconClass}
                                value={cd.unitName || ''}
                                onChange={e => setCD('unitName', e.target.value)} />
                            <Building className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Mã số thuế</label>
                        <div className="relative">
                            <input type="text" placeholder="0100000000"
                                className={inputWithIconClass}
                                value={cd.taxCode || ''}
                                onChange={e => setCD('taxCode', e.target.value)} />
                            <Hash className={iconClass} />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Địa chỉ</label>
                        <div className="relative">
                            <input type="text" placeholder="Địa chỉ đơn vị..."
                                className={inputWithIconClass}
                                value={cd.address || ''}
                                onChange={e => setCD('address', e.target.value)} />
                            <MapPin className={iconClass} />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Nội dung Hợp đồng</label>
                        <div className="relative">
                            <input type="text" placeholder="Tóm tắt nội dung hợp đồng..."
                                className={inputWithIconClass}
                                value={cd.contractContent || ''}
                                onChange={e => setCD('contractContent', e.target.value)} />
                            <FileText className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Số hiệu gói thầu</label>
                        <div className="relative">
                            <input type="text" placeholder="VD: GT-01"
                                className={inputWithIconClass}
                                value={cd.packageNumber || ''}
                                onChange={e => setCD('packageNumber', e.target.value)} />
                            <Hash className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Đại diện Pháp luật</label>
                        <div className="relative">
                            <input type="text" placeholder="Họ tên người đại diện..."
                                className={inputWithIconClass}
                                value={cd.legalRep || ''}
                                onChange={e => setCD('legalRep', e.target.value)} />
                            <User className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Chỉ huy công trường</label>
                        <div className="relative">
                            <input type="text" placeholder="Họ tên chỉ huy..."
                                className={inputWithIconClass}
                                value={cd.siteManager || ''}
                                onChange={e => setCD('siteManager', e.target.value)} />
                            <HardHat className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Cán bộ kỹ thuật (NT)</label>
                        <div className="relative">
                            <input type="text" placeholder="Họ tên cán bộ kỹ thuật..."
                                className={inputWithIconClass}
                                value={cd.techStaff || ''}
                                onChange={e => setCD('techStaff', e.target.value)} />
                            <Users className={iconClass} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Quản lý dự án (nội bộ) ── */}
            <div className="pt-5 border-t border-border-subtle">
                <h4 className="text-sm font-semibold text-txt-secondary mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" /> Nhân sự quản lý dự án (nội bộ)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Kế toán theo dõi</label>
                        <div className="relative">
                            <input type="text" placeholder="Họ tên kế toán..."
                                className={inputWithIconClass}
                                value={pm.accountant || ''}
                                onChange={e => setPM('accountant', e.target.value)} />
                            <User className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Giám đốc QLDA</label>
                        <div className="relative">
                            <input type="text" placeholder="Họ tên giám đốc..."
                                className={inputWithIconClass}
                                value={pm.projectDirector || ''}
                                onChange={e => setPM('projectDirector', e.target.value)} />
                            <User className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Cán bộ kỹ thuật (nội bộ)</label>
                        <div className="relative">
                            <input type="text" placeholder="Họ tên cán bộ kỹ thuật..."
                                className={inputWithIconClass}
                                value={pm.techStaff || ''}
                                onChange={e => setPM('techStaff', e.target.value)} />
                            <Users className={iconClass} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
