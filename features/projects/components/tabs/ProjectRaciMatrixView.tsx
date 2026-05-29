import React, { useState } from 'react';
import { 
    Users, ShieldAlert, Check, HelpCircle, Edit2, AlertCircle, Info, Calendar
} from 'lucide-react';
import { ProjectStep, ProjectStepsService } from '@/services/ProjectStepsService';

const STAKEHOLDERS = [
    { code: 'BQL', name: 'Ban QLDA' },
    { code: 'BQL_PTDV', name: 'Phòng Phát triển DV' },
    { code: 'BQL_QLDA', name: 'Phòng QLDA' },
    { code: 'BQL_HCTH', name: 'Phòng HC-TH' },
    { code: 'BQL_KHDT', name: 'Phòng KH-ĐT' },
    { code: 'BQL_KTTD', name: 'Phòng KT-TĐ' },
    { code: 'TVTK', name: 'Tư vấn thiết kế' },
    { code: 'TVGS', name: 'Tư vấn giám sát' },
    { code: 'TVTT', name: 'Tư vấn thẩm tra' },
    { code: 'TVDT', name: 'Tư vấn đấu thầu' },
    { code: 'NTC', name: 'Nhà thầu chính' },
    { code: 'NTPHU', name: 'Nhà thầu phụ' },
    { code: 'NQDDT', name: 'Người quyết định đầu tư' },
    { code: 'SXD', name: 'Sở Xây dựng' },
    { code: 'STC', name: 'Sở Tài chính' },
    { code: 'UBND', name: 'UBND tỉnh' },
    { code: 'KBNN', name: 'Kho bạc Nhà nước' },
    { code: 'KTNN', name: 'Kiểm toán Nhà nước' }
];

const RACI_TYPES = [
    { code: 'R', label: 'Responsible (Thực hiện)', bg: 'bg-blue-500 text-white', dot: 'bg-blue-500', hoverBg: 'hover:bg-blue-600', lightBg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' },
    { code: 'A', label: 'Accountable (Phê duyệt)', bg: 'bg-emerald-500 text-white', dot: 'bg-emerald-500', hoverBg: 'hover:bg-emerald-600', lightBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' },
    { code: 'C', label: 'Consulted (Tham vấn)', bg: 'bg-amber-500 text-white', dot: 'bg-amber-500', hoverBg: 'hover:bg-amber-600', lightBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' },
    { code: 'I', label: 'Informed (Thông báo)', bg: 'bg-gray-500 text-white', dot: 'bg-gray-500', hoverBg: 'hover:bg-gray-600', lightBg: 'bg-bg-muted text-txt-muted' }
];

interface ProjectRaciMatrixViewProps {
    steps: ProjectStep[];
    onRefresh: () => void;
}

export const ProjectRaciMatrixView: React.FC<ProjectRaciMatrixViewProps> = ({ steps, onRefresh }) => {
    const [editingCell, setEditingCell] = useState<{ stepId: string; stakeholderCode: string } | null>(null);
    const [updating, setUpdating] = useState(false);

    const getRaciForCell = (step: ProjectStep, stakeholderCode: string) => {
        return step.raci?.find(r => r.stakeholder_code === stakeholderCode);
    };

    const handleRaciChange = async (step: ProjectStep, stakeholderCode: string, raciType: 'R' | 'A' | 'C' | 'I' | null) => {
        setUpdating(true);
        try {
            // Lấy danh sách RACI hiện tại của step
            const currentRaci = step.raci || [];
            
            // Lọc bỏ stakeholder hiện tại
            let nextRaci = currentRaci
                .filter(r => r.stakeholder_code !== stakeholderCode)
                .map(r => ({
                    stakeholder_code: r.stakeholder_code,
                    raci_type: r.raci_type,
                    stakeholder_name: r.stakeholder_name,
                    note: r.note
                }));

            // Nếu người dùng chọn một vai trò mới (không phải clear) thì add vào
            if (raciType) {
                nextRaci.push({
                    stakeholder_code: stakeholderCode,
                    raci_type: raciType,
                    stakeholder_name: null,
                    note: null
                });
            }

            await ProjectStepsService.setRaciForStep(step.id, nextRaci);
            onRefresh();
        } catch (err) {
            console.error('Lỗi khi cập nhật RACI:', err);
        } finally {
            setUpdating(false);
            setEditingCell(null);
        }
    };

    return (
        <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-border bg-bg-subtle flex flex-wrap justify-between items-center gap-3">
                <div>
                    <h4 className="font-bold text-txt-primary text-sm uppercase flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary-500" /> Ma trận phân công trách nhiệm (RACI)
                    </h4>
                    <p className="text-xs text-txt-muted mt-1">
                        Nhấp trực tiếp vào ô giao điểm để thay đổi vai trò: <strong>R</strong> (Thực hiện), <strong>A</strong> (Phê duyệt), <strong>C</strong> (Tham vấn), <strong>I</strong> (Thông báo).
                    </p>
                </div>
                {/* Chú thích màu sắc */}
                <div className="flex flex-wrap gap-3 text-xs">
                    {RACI_TYPES.map(t => (
                        <div key={t.code} className="flex items-center gap-1">
                            <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-extrabold ${t.lightBg} border border-current/10`}>
                                {t.code}
                            </span>
                            <span className="text-txt-muted text-[11px]">{t.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Table wrapper */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse table-fixed min-w-[1200px]">
                    <thead>
                        <tr className="bg-bg-subtle border-b border-border text-[10px] uppercase tracking-wider text-txt-muted font-semibold">
                            <th className="p-3 w-12 text-center">TT</th>
                            <th className="p-3 w-80">Nội dung công việc (Bước quy trình)</th>
                            {STAKEHOLDERS.map(s => (
                                <th key={s.code} className="p-3 text-center w-24" title={s.name}>
                                    <div className="truncate">{s.code}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {steps.map((step, idx) => (
                            <tr key={step.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                {/* TT */}
                                <td className="p-3 text-center font-bold text-txt-placeholder">
                                    {idx + 1}
                                </td>
                                
                                {/* Tên bước */}
                                <td className="p-3 font-semibold text-txt-secondary">
                                    <div>{step.task_name}</div>
                                    {step.legal_basis && (
                                        <div className="text-[10px] text-gray-400 font-normal mt-0.5" title="Căn cứ pháp lý">
                                            {step.legal_basis}
                                        </div>
                                    )}
                                </td>

                                {/* Ma trận các stakeholder */}
                                {STAKEHOLDERS.map(s => {
                                    const raci = getRaciForCell(step, s.code);
                                    const isEditing = editingCell?.stepId === step.id && editingCell?.stakeholderCode === s.code;

                                    return (
                                        <td 
                                            key={s.code} 
                                            className="p-3 text-center relative border-l border-border-subtle"
                                        >
                                            {isEditing ? (
                                                <div className="absolute inset-0 bg-bg-surface z-10 flex items-center justify-center p-1 gap-0.5 shadow-md rounded">
                                                    {RACI_TYPES.map(type => (
                                                        <button
                                                            key={type.code}
                                                            disabled={updating}
                                                            onClick={() => handleRaciChange(step, s.code, type.code as any)}
                                                            className={`w-5 h-5 flex items-center justify-center text-[10px] font-extrabold rounded border border-current/10 ${type.lightBg} hover:opacity-80 transition-opacity`}
                                                            title={type.label}
                                                        >
                                                            {type.code}
                                                        </button>
                                                    ))}
                                                    <button
                                                        disabled={updating}
                                                        onClick={() => handleRaciChange(step, s.code, null)}
                                                        className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 shrink-0"
                                                        title="Gỡ vai trò"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingCell({ stepId: step.id, stakeholderCode: s.code })}
                                                    className="w-full h-8 flex items-center justify-center rounded-lg hover:bg-bg-muted/50 transition-colors group/cell"
                                                >
                                                    {raci ? (
                                                        (() => {
                                                            const typeStyle = RACI_TYPES.find(t => t.code === raci.raci_type);
                                                            return (
                                                                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-black ${typeStyle?.lightBg} border border-current/10 shadow-sm transition-transform group-hover/cell:scale-110`}>
                                                                    {raci.raci_type}
                                                                </span>
                                                            );
                                                        })()
                                                    ) : (
                                                        <span className="opacity-0 group-hover/cell:opacity-100 text-[10px] text-txt-placeholder font-bold transition-opacity">
                                                            +
                                                        </span>
                                                    )}
                                                </button>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {steps.length === 0 && (
                <div className="p-8 text-center text-gray-400 italic">
                    Chưa khởi tạo kế hoạch dự án. Hãy lập kế hoạch tổng thể trước.
                </div>
            )}
        </div>
    );
};
