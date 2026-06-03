import React from 'react';
import { Activity, FileText, Calendar, DollarSign, AlertTriangle, CheckCircle, ClipboardList, MessageSquare } from 'lucide-react';
import { PROJECT_CURRENT_STATUS_CONFIG } from '../../../../types';
import { SectionHeader, FormattedInput, labelClass, inputWithIconClass, inputClass, iconClass, selectWithIconClass } from './FormShared';

interface ProjectFormStatusProps {
    formData: Record<string, any>;
    updateField: (field: string, value: any) => void;
    aiHighlight: (field: string) => string;
}

export const ProjectFormStatus: React.FC<ProjectFormStatusProps> = ({ formData, updateField, aiHighlight }) => {
    const adj = formData.AdjustedApproval || {};
    const status = formData.ProjectStatusInfo || {};

    const setAdj = (key: string, v: any) => updateField('AdjustedApproval', { ...adj, [key]: v });
    const setStatus = (key: string, v: any) => updateField('ProjectStatusInfo', { ...status, [key]: v });

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SectionHeader icon={Activity} title="Hiện trạng dự án" subtitle="Điều chỉnh, tiến độ thực tế và tình hình thanh tra kiểm toán" />

            {/* ── QĐ điều chỉnh + thời gian ── */}
            <div>
                <h4 className="text-sm font-semibold text-txt-secondary mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" /> Quyết định phê duyệt điều chỉnh dự án
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Số QĐ điều chỉnh</label>
                        <div className="relative">
                            <input type="text" placeholder="VD: 456/QĐ-UBND"
                                className={inputWithIconClass}
                                value={adj.decisionNumber || ''}
                                onChange={e => setAdj('decisionNumber', e.target.value)} />
                            <FileText className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Ngày QĐ điều chỉnh</label>
                        <div className="relative">
                            <input type="date"
                                className={inputWithIconClass}
                                value={adj.decisionDate || ''}
                                onChange={e => setAdj('decisionDate', e.target.value)} />
                            <Calendar className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Tổng dự toán (sau ĐC, VNĐ)</label>
                        <FormattedInput placeholder="0" className={inputWithIconClass}
                            value={adj.totalEstimate || 0}
                            onChange={(v: string | number) => setAdj('totalEstimate', Number(v))}
                            icon={DollarSign} isDecimal={false} />
                    </div>
                </div>
            </div>

            {/* ── Thời gian điều chỉnh & thực tế ── */}
            <div className="pt-5 border-t border-border-subtle">
                <h4 className="text-sm font-semibold text-txt-secondary mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-500" /> Thời gian thực hiện dự án
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-txt-muted uppercase tracking-wide">Sau điều chỉnh</p>
                        <div>
                            <label className={labelClass}>Khởi công (sau ĐC)</label>
                            <div className="relative">
                                <input type="date"
                                    className={inputWithIconClass}
                                    value={adj.adjustedStartDate || ''}
                                    onChange={e => setAdj('adjustedStartDate', e.target.value)} />
                                <Calendar className={iconClass} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Hoàn thành (sau ĐC)</label>
                            <div className="relative">
                                <input type="date"
                                    className={inputWithIconClass}
                                    value={adj.adjustedEndDate || ''}
                                    onChange={e => setAdj('adjustedEndDate', e.target.value)} />
                                <Calendar className={iconClass} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-txt-muted uppercase tracking-wide">Thực tế</p>
                        <div>
                            <label className={labelClass}>Khởi công thực tế</label>
                            <div className="relative">
                                <input type="date"
                                    className={inputWithIconClass}
                                    value={adj.actualStartDate || ''}
                                    onChange={e => setAdj('actualStartDate', e.target.value)} />
                                <Calendar className={iconClass} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Hoàn thành thực tế</label>
                            <div className="relative">
                                <input type="date"
                                    className={inputWithIconClass}
                                    value={adj.actualEndDate || ''}
                                    onChange={e => setAdj('actualEndDate', e.target.value)} />
                                <Calendar className={iconClass} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Giai đoạn & Hiện trạng dự án ── */}
            <div className="pt-5 border-t border-border-subtle">
                <h4 className="text-sm font-semibold text-txt-secondary mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Giai đoạn &amp; hiện trạng dự án
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Giai đoạn dự án</label>
                        <div className="relative">
                            <select
                                className={selectWithIconClass}
                                value={formData.Stage || ''}
                                onChange={e => updateField('Stage', e.target.value)}
                            >
                                <option value="">-- Chọn giai đoạn --</option>
                                <option value="Preparation">Chuẩn bị dự án</option>
                                <option value="Execution">Thực hiện dự án</option>
                                <option value="Completion">Kết thúc xây dựng</option>
                            </select>
                            <Activity className={iconClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Hiện trạng dự án (chi tiết)</label>
                        <div className="relative">
                            <select
                                className={selectWithIconClass}
                                value={formData.CurrentStatusCode || ''}
                                onChange={e => updateField('CurrentStatusCode', e.target.value ? Number(e.target.value) : null)}
                            >
                                <option value="">-- Chọn hiện trạng dự án --</option>
                                {Object.entries(PROJECT_CURRENT_STATUS_CONFIG).map(([code, status]) => (
                                    <option key={code} value={code}>
                                        {code}. {status.label}
                                    </option>
                                ))}
                            </select>
                            <Activity className={iconClass} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tình hình thanh tra kiểm toán ── */}
            <div className="pt-5 border-t border-border-subtle">
                <h4 className="text-sm font-semibold text-txt-secondary mb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-warning-500" /> Tình hình thanh tra, kiểm toán
                </h4>
                <textarea
                    placeholder="Mô tả kết quả thanh tra, kiểm toán (nếu có)..."
                    className={inputClass + ' min-h-[80px] resize-none'}
                    value={status.auditStatus || ''}
                    onChange={e => setStatus('auditStatus', e.target.value)}
                    rows={3}
                />
            </div>

            {/* ── Chậm tiến độ ── */}
            <div className="pt-5 border-t border-border-subtle">
                <h4 className="text-sm font-semibold text-txt-secondary mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Chậm tiến độ
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Nguyên nhân</label>
                        <textarea
                            placeholder="Nêu nguyên nhân gây chậm tiến độ..."
                            className={inputClass + ' min-h-[80px] resize-none'}
                            value={status.delayReason || ''}
                            onChange={e => setStatus('delayReason', e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Trách nhiệm</label>
                        <textarea
                            placeholder="Đơn vị / cá nhân chịu trách nhiệm..."
                            className={inputClass + ' min-h-[80px] resize-none'}
                            value={status.delayResponsibility || ''}
                            onChange={e => setStatus('delayResponsibility', e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Kết quả xử lý</label>
                        <textarea
                            placeholder="Biện pháp và kết quả xử lý..."
                            className={inputClass + ' min-h-[80px] resize-none'}
                            value={status.delayResolution || ''}
                            onChange={e => setStatus('delayResolution', e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Kiến nghị, đề xuất giải pháp</label>
                        <textarea
                            placeholder="Đề xuất giải pháp xử lý tiếp theo..."
                            className={inputClass + ' min-h-[80px] resize-none'}
                            value={status.delayRecommendation || ''}
                            onChange={e => setStatus('delayRecommendation', e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
            </div>

            {/* ── Ghi chú ── */}
            <div className="pt-5 border-t border-border-subtle">
                <h4 className="text-sm font-semibold text-txt-secondary mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" /> Ghi chú
                </h4>
                <textarea
                    placeholder="Ghi chú bổ sung..."
                    className={inputClass + ' min-h-[80px] resize-none'}
                    value={status.notes || ''}
                    onChange={e => setStatus('notes', e.target.value)}
                    rows={3}
                />
            </div>
        </div>
    );
};
