import React from 'react';
import { Ruler, DollarSign, Layers } from 'lucide-react';
import { SectionHeader, FormattedInput, labelClass, inputClass, inputWithIconClass, iconClass } from './FormShared';

interface ProjectFormScaleProps {
    formData: Record<string, any>;
    updateField: (field: string, value: any) => void;
}

export const ProjectFormScale: React.FC<ProjectFormScaleProps> = ({
    formData,
    updateField
}) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SectionHeader icon={Ruler} title="Quy mô công trình" subtitle="Thông vị kỹ thuật: diện tích, tầng, chiều cao" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tổng dự toán */}
                <div>
                    <label className={labelClass}>Tổng dự toán (VNĐ)</label>
                    <FormattedInput
                        placeholder="0"
                        className={inputWithIconClass}
                        value={formData.TotalEstimate}
                        onChange={(v: string | number) => updateField('TotalEstimate', Number(v))}
                        icon={DollarSign}
                        isDecimal={false}
                    />
                </div>

                {/* Diện tích (m²) */}
                <div>
                    <label className={labelClass}>Diện tích khu đất (m²)</label>
                    <FormattedInput
                        placeholder="0"
                        className={inputClass}
                        value={formData.SiteArea}
                        onChange={(v: string | number) => updateField('SiteArea', Number(v))}
                        isDecimal={true}
                    />
                </div>

                {/* DT xây dựng (m²) */}
                <div>
                    <label className={labelClass}>DT xây dựng (m²)</label>
                    <FormattedInput
                        placeholder="0"
                        className={inputClass}
                        value={formData.ConstructionArea}
                        onChange={(v: string | number) => updateField('ConstructionArea', Number(v))}
                        isDecimal={true}
                    />
                </div>

                {/* DT sàn SD (m²) */}
                <div>
                    <label className={labelClass}>DT sàn sử dụng (m²)</label>
                    <FormattedInput
                        placeholder="0"
                        className={inputClass}
                        value={formData.FloorArea}
                        onChange={(v: string | number) => updateField('FloorArea', Number(v))}
                        isDecimal={true}
                    />
                </div>

                {/* Chiều cao (m) */}
                <div>
                    <label className={labelClass}>Chiều cao (m)</label>
                    <FormattedInput
                        placeholder="0"
                        className={inputClass}
                        value={formData.BuildingHeight}
                        onChange={(v: string | number) => updateField('BuildingHeight', Number(v))}
                        isDecimal={true}
                    />
                </div>

                {/* Mật độ XD (%) */}
                <div>
                    <label className={labelClass}>Mật độ xây dựng (%)</label>
                    <FormattedInput
                        placeholder="0"
                        className={inputClass}
                        value={formData.BuildingDensity}
                        onChange={(v: string | number) => updateField('BuildingDensity', Number(v))}
                        isDecimal={true}
                    />
                </div>

                {/* Hệ số SDĐ */}
                <div>
                    <label className={labelClass}>Hệ số sử dụng đất</label>
                    <FormattedInput
                        placeholder="0"
                        className={inputClass}
                        value={formData.LandUseCoefficient}
                        onChange={(v: string | number) => updateField('LandUseCoefficient', Number(v))}
                        isDecimal={true}
                    />
                </div>

                {/* Số tầng nổi */}
                <div>
                    <label className={labelClass}>Số tầng nổi</label>
                    <div className="relative">
                        <input
                            type="number" min="0" step="1" placeholder="0"
                            className={inputWithIconClass}
                            value={formData.AboveGroundFloors || ''}
                            onChange={e => updateField('AboveGroundFloors', Number(e.target.value))}
                        />
                        <Layers className={iconClass} />
                    </div>
                </div>

                {/* Số tầng hầm */}
                <div>
                    <label className={labelClass}>Số tầng hầm</label>
                    <div className="relative">
                        <input
                            type="number" min="0" step="1" placeholder="0"
                            className={inputWithIconClass}
                            value={formData.BasementFloors || ''}
                            onChange={e => updateField('BasementFloors', Number(e.target.value))}
                        />
                        <Layers className={iconClass} />
                    </div>
                </div>
            </div>
        </div>
    );
};
