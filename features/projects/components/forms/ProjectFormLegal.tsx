import React from 'react';
import { ProjectModalFormValues } from '../../../../schemas/project.schema';
import { Shield, FileText, Calendar, Building2, ArrowLeftRight, User } from 'lucide-react';
import { SectionHeader, labelClass, inputWithIconClass, iconClass, selectWithIconClass, CONSTRUCTION_GRADES } from './FormShared';

interface ProjectFormLegalProps {
    formData: Record<string, any>;
    updateField: (field: string, value: any) => void;
    aiHighlight: (field: string) => string;
    errors?: Record<string, any>;
}

export const ProjectFormLegal: React.FC<ProjectFormLegalProps> = ({ formData, updateField, aiHighlight, errors = {} }) => {
    return (
        <div className="space-y-6">
            {/* ── Quyết định chủ trương đầu tư ── */}
            <div className="pt-2">
                <SectionHeader icon={FileText} title="Quyết định chủ trương đầu tư" subtitle="Cấp phê duyệt và số quyết định chủ trương" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div>
                        <label className={labelClass}>Cấp QĐ chủ trương</label>
                        <div className="relative">
                            <select className={selectWithIconClass}
                                value={formData.PolicyDecisionLevel || ''}
                                onChange={e => updateField('PolicyDecisionLevel', e.target.value)}>
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
                        <label className={labelClass}>Số QĐ (CBT số)</label>
                        <div className="relative">
                            <input type="text" placeholder="VD: 123/QĐ"
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
                            <input type="text" placeholder="VD: UBND tỉnh"
                                className={inputWithIconClass + aiHighlight('PolicyDecisionAuthority')}
                                value={formData.PolicyDecisionAuthority || ''}
                                onChange={e => updateField('PolicyDecisionAuthority', e.target.value)}
                            />
                            <Shield className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Ngày ban hành</label>
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
            <div className="pt-5 border-t border-gray-100 dark:border-slate-500/50">
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

            {/* ── Cấp công trình ── */}
            <div className="pt-5 border-t border-gray-100 dark:border-slate-500/50">
                <SectionHeader icon={Building2} title="Cấp công trình" subtitle="Phân cấp công trình theo quy định" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                    <div className="flex items-end">
                        <p className="text-xs text-txt-placeholder pb-2">
                            Các thông số diện tích, chiều cao, số tầng… nhập tại tab <span className="font-semibold">Quy mô công trình</span>.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Bàn giao & Chuyển CĐT ── */}
            <div className="pt-5 border-t border-gray-100 dark:border-slate-500/50">
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
        </div>
    );
};
