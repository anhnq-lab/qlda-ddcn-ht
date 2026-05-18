/**
 * DesignFormRenderer — renders an interactive biểu mẫu (BM-TK1B/2B/3B) form
 * Data is read from/written to cde_internal_workflow_step_records.comment (JSON)
 */
import React, { useState, useCallback } from 'react';
import { CheckSquare, Square, FileText, Save, RotateCcw } from 'lucide-react';
import { getDesignForm } from '../data/designProcessForms';
import type { DesignFormSchema, ChecklistItem, SignatureBlock } from '../data/designProcessForms';

const SIG_LABELS: Record<SignatureBlock, string> = {
    inspector:   'Cán bộ kiểm tra',
    room_leader: 'Trưởng Phòng QLDA',
    drafter:     'Người lập',
    consultant:  'Tư vấn thực hiện',
    qlda:        'Chuyên viên QLDA',
    issuer:      'Người bàn giao',
    receiver:    'Người nhận',
    updater:     'Người cập nhật',
    director:    'Giám đốc / Phó Giám đốc',
    officer:     'Cán bộ phụ trách',
};

interface FormData {
    checklist: Record<string, boolean | null>; // true=Đạt, false=Không đạt, null=chưa chọn
    notes: Record<string, string>;             // ghi chú từng mục
    conclusion: 'pass' | 'fail' | null;
    generalNote: string;
    signedBy?: string;
    signedAt?: string;
}

interface DesignFormRendererProps {
    formCode: string;
    projectName?: string;
    packageName?: string;
    location?: string;
    officer?: string;
    initialData?: FormData;
    readOnly?: boolean;
    onSave?: (data: FormData) => Promise<void>;
}

const EMPTY_FORM_DATA: FormData = {
    checklist: {},
    notes: {},
    conclusion: null,
    generalNote: '',
};

const DesignFormRenderer: React.FC<DesignFormRendererProps> = ({
    formCode,
    projectName = '',
    packageName = '',
    location = '',
    officer = '',
    initialData,
    readOnly = false,
    onSave,
}) => {
    const schema: DesignFormSchema | null = getDesignForm(formCode);
    const [formData, setFormData] = useState<FormData>(initialData ?? EMPTY_FORM_DATA);
    const [saving, setSaving] = useState(false);

    const handleCheck = useCallback((itemId: string, value: boolean) => {
        if (readOnly) return;
        setFormData(prev => ({
            ...prev,
            checklist: {
                ...prev.checklist,
                [itemId]: prev.checklist[itemId] === value ? null : value,
            }
        }));
    }, [readOnly]);

    const handleNote = useCallback((itemId: string, note: string) => {
        if (readOnly) return;
        setFormData(prev => ({ ...prev, notes: { ...prev.notes, [itemId]: note } }));
    }, [readOnly]);

    const handleSave = async () => {
        if (!onSave || saving) return;
        setSaving(true);
        try {
            await onSave(formData);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (readOnly) return;
        setFormData(EMPTY_FORM_DATA);
    };

    if (!schema) {
        return (
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-700 dark:text-yellow-300">
                Không tìm thấy biểu mẫu <strong>{formCode}</strong>
            </div>
        );
    }

    const passCount = Object.values(formData.checklist).filter(v => v === true).length;
    const failCount = Object.values(formData.checklist).filter(v => v === false).length;
    const totalItems = schema.checklist?.length ?? 0;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-sm">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <FileText size={15} className="text-primary-500 flex-shrink-0" />
                            <span className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{schema.code}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-base">{schema.title}</h3>
                        {schema.description && (
                            <p className="text-xs text-slate-500 mt-1">{schema.description}</p>
                        )}
                    </div>
                    {totalItems > 0 && (
                        <div className="flex-shrink-0 text-right">
                            <div className="text-xs text-slate-500">{passCount}/{totalItems} Đạt</div>
                            {failCount > 0 && <div className="text-xs text-red-500 mt-0.5">{failCount} Không đạt</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* Project info header */}
            {(projectName || packageName || location || officer) && (
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-x-4 gap-y-1">
                    {projectName && <InfoRow label="Dự án" value={projectName} />}
                    {packageName && <InfoRow label="Hạng mục/Gói thầu" value={packageName} />}
                    {location   && <InfoRow label="Địa điểm" value={location} />}
                    {officer    && <InfoRow label="Cán bộ phụ trách" value={officer} />}
                </div>
            )}

            {/* Checklist */}
            {schema.checklist && schema.checklist.length > 0 && (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    <div className="px-5 py-2 bg-slate-50 dark:bg-slate-900/50 grid grid-cols-[1fr_auto_auto] gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>Nội dung kiểm tra</span>
                        <span className="w-14 text-center">Đạt</span>
                        <span className="w-20 text-center">Không đạt</span>
                    </div>
                    {schema.checklist.map((item: ChecklistItem, idx) => {
                        const val = formData.checklist[item.id];
                        const note = formData.notes[item.id] ?? '';
                        return (
                            <div key={item.id} className={`px-5 py-3 ${val === false ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                                <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-start">
                                    <div>
                                        <span className="text-slate-400 font-mono mr-2">{idx + 1}.</span>
                                        <span className="text-slate-700 dark:text-slate-200">
                                            {item.label}
                                            {item.required && <span className="text-red-500 ml-1">*</span>}
                                        </span>
                                    </div>
                                    {/* Đạt */}
                                    <button
                                        onClick={() => handleCheck(item.id, true)}
                                        disabled={readOnly}
                                        className={`w-14 flex justify-center p-1 rounded transition-colors ${val === true ? 'text-green-600' : 'text-slate-300 dark:text-slate-600 hover:text-green-500'} ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                        title="Đạt"
                                    >
                                        {val === true ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </button>
                                    {/* Không đạt */}
                                    <button
                                        onClick={() => handleCheck(item.id, false)}
                                        disabled={readOnly}
                                        className={`w-20 flex justify-center p-1 rounded transition-colors ${val === false ? 'text-red-600' : 'text-slate-300 dark:text-slate-600 hover:text-red-500'} ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                        title="Không đạt"
                                    >
                                        {val === false ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </button>
                                </div>
                                {/* Note field — show when not-pass or when user typed something */}
                                {(val === false || note) && !readOnly && (
                                    <input
                                        type="text"
                                        placeholder="Ghi chú / yêu cầu chỉnh sửa..."
                                        value={note}
                                        onChange={e => handleNote(item.id, e.target.value)}
                                        className="mt-2 ml-6 w-[calc(100%-1.5rem)] text-xs rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                                    />
                                )}
                                {(val === false || note) && readOnly && note && (
                                    <p className="mt-1 ml-6 text-xs text-slate-500 italic">{note}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Table (single optional table per form) */}
            {schema.table && (
                <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-100 dark:bg-slate-900">
                                    {schema.table.columns.map((col: { key: string; label: string }) => (
                                        <th key={col.key} className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: schema.table.defaultRows }).map((_, ri) => (
                                    <tr key={ri} className="even:bg-slate-50/50 dark:even:bg-slate-800/50">
                                        {schema.table!.columns.map((col: { key: string; label: string }) => (
                                            <td key={col.key} className="px-3 py-2 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 min-w-[80px]">
                                                &nbsp;
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Conclusion + general note */}
            <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-wrap gap-4">
                    <label className={`flex items-center gap-2 cursor-pointer text-sm font-medium ${readOnly ? 'cursor-default' : ''}`}>
                        <input
                            type="radio" name={`conclusion-${schema.code}`} value="pass"
                            checked={formData.conclusion === 'pass'}
                            onChange={() => !readOnly && setFormData(p => ({ ...p, conclusion: 'pass' }))}
                            disabled={readOnly}
                            className="text-green-500 focus:ring-green-400"
                        />
                        <span className="text-green-700 dark:text-green-400">Đủ điều kiện chuyển bước tiếp theo / phê duyệt / trình thẩm định</span>
                    </label>
                    <label className={`flex items-center gap-2 cursor-pointer text-sm font-medium ${readOnly ? 'cursor-default' : ''}`}>
                        <input
                            type="radio" name={`conclusion-${schema.code}`} value="fail"
                            checked={formData.conclusion === 'fail'}
                            onChange={() => !readOnly && setFormData(p => ({ ...p, conclusion: 'fail' }))}
                            disabled={readOnly}
                            className="text-red-500 focus:ring-red-400"
                        />
                        <span className="text-red-700 dark:text-red-400">Chưa đủ điều kiện — yêu cầu chỉnh sửa, bổ sung</span>
                    </label>
                </div>

                {!readOnly && (
                    <textarea
                        rows={2}
                        placeholder="Ghi chú chung / ý kiến kết luận..."
                        value={formData.generalNote}
                        onChange={e => setFormData(p => ({ ...p, generalNote: e.target.value }))}
                        className="w-full text-xs rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none"
                    />
                )}
                {readOnly && formData.generalNote && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">{formData.generalNote}</p>
                )}
            </div>

            {/* Signature blocks */}
            {schema.signature_blocks.length > 0 && (
                <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-6">
                        {schema.signature_blocks.map((sig, i) => (
                            <div key={i} className="text-center border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/30">
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-8">{SIG_LABELS[sig] ?? sig}</p>
                                <p className="text-xs text-slate-400">(Ký, ghi rõ họ tên)</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            {!readOnly && onSave && (
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                        <RotateCcw size={13} /> Làm mới
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Save size={13} /> {saving ? 'Đang lưu...' : 'Lưu biểu mẫu'}
                    </button>
                </div>
            )}
        </div>
    );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="text-xs">
        <span className="text-slate-400 dark:text-slate-500">{label}: </span>
        <span className="font-medium text-slate-700 dark:text-slate-200">{value}</span>
    </div>
);

export default DesignFormRenderer;
