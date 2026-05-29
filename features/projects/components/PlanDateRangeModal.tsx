import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, Zap, CheckCircle2 } from 'lucide-react';

import { supabase } from '@/lib/supabase';

export type DateRangeMode = 'range' | 'duration';

export interface PlanDateRange {
    startDate: string; // ISO date string "YYYY-MM-DD"
    endDate: string;   // ISO date string "YYYY-MM-DD"
    totalDays: number;
}

interface PlanDateRangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (range: PlanDateRange, workflowId?: string) => void;
    title: string;
    description?: string;
    defaultStartDate?: string;
    isLoading?: boolean;
    showWorkflowOption?: boolean;
    project?: any;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** ISO "YYYY-MM-DD" → display "DD/MM/YYYY" */
const isoToDisplay = (iso: string): string => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
};

/** Display "DD/MM/YYYY" → ISO "YYYY-MM-DD" (returns '' if invalid) */
const displayToIso = (val: string): string => {
    const cleaned = val.replace(/[^\d/]/g, '').trim();
    // Accept dd/mm/yyyy or dd-mm-yyyy
    const parts = cleaned.split(/[\/\-]/);
    if (parts.length === 3) {
        const [d, m, y] = parts;
        if (d.length <= 2 && m.length <= 2 && y.length === 4) {
            const dd = d.padStart(2, '0');
            const mm = m.padStart(2, '0');
            const iso = `${y}-${mm}-${dd}`;
            // Validate date
            const date = new Date(iso);
            if (!isNaN(date.getTime()) && date.toISOString().startsWith(iso)) {
                return iso;
            }
        }
    }
    return '';
};

/** Auto-insert slashes as user types: "27" → "27/", "2703" → "27/03/" */
const autoFormatInput = (raw: string, prev: string): string => {
    // Only forward-format (not when deleting)
    if (raw.length < prev.length) return raw;
    const digits = raw.replace(/\D/g, '');
    let out = '';
    if (digits.length >= 1) out = digits.slice(0, 2);
    if (digits.length >= 3) out += '/' + digits.slice(2, 4);
    if (digits.length >= 5) out += '/' + digits.slice(4, 8);
    return out;
};

// ── DateInput Component ───────────────────────────────────────────────────────

interface DateInputProps {
    label: string;
    required?: boolean;
    isoValue: string;
    onChange: (iso: string) => void;
    minIso?: string;
    colorClass?: string; // ring color class e.g. "focus:ring-emerald-300"
}

const DateInput: React.FC<DateInputProps> = ({
    label, required, isoValue, onChange, minIso, colorClass = 'focus:ring-emerald-300 dark:focus:ring-emerald-700',
}) => {
    const [text, setText] = useState(isoToDisplay(isoValue));
    const [isValid, setIsValid] = useState(true);
    const pickerRef = useRef<HTMLInputElement>(null);

    // Sync display text when ISO value changes externally
    useEffect(() => {
        const display = isoToDisplay(isoValue);
        // Only update if not currently focused to avoid cursor jump
        if (document.activeElement !== pickerRef.current) {
            setText(display);
        }
        setIsValid(true);
    }, [isoValue]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = autoFormatInput(e.target.value, text);
        setText(formatted);
        const iso = displayToIso(formatted);
        if (iso) {
            setIsValid(true);
            onChange(iso);
        } else {
            setIsValid(formatted.length === 0 || formatted.length < 10);
        }
    };

    const handleTextBlur = () => {
        const iso = displayToIso(text);
        if (iso) {
            setText(isoToDisplay(iso));
            setIsValid(true);
            onChange(iso);
        } else if (text.length > 0) {
            setIsValid(false);
        }
    };

    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const iso = e.target.value; // Already "YYYY-MM-DD"
        if (iso) {
            setText(isoToDisplay(iso));
            setIsValid(true);
            onChange(iso);
        }
    };

    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-txt-secondary">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={text}
                    onChange={handleTextChange}
                    onBlur={handleTextBlur}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    className={`w-full pl-3 pr-10 py-2.5 text-sm border rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 transition-shadow ${
                        !isValid
                            ? 'border-red-400 focus:ring-red-300 dark:focus:ring-red-700'
                            : `border-gray-300 dark:border-slate-600 ${colorClass}`
                    }`}
                />
                {/* Calendar icon triggers the hidden native date picker */}
                <button
                    type="button"
                    onClick={() => pickerRef.current?.showPicker?.()}
                    className="absolute right-2.5 p-0.5 text-gray-400 hover:text-emerald-500 transition-colors"
                    title="Mở lịch chọn ngày"
                >
                    <Calendar className="w-4 h-4" />
                </button>
                {/* Hidden native date picker — only for calendar UI, actual value shown in text */}
                <input
                    ref={pickerRef}
                    type="date"
                    value={isoValue}
                    min={minIso}
                    onChange={handlePickerChange}
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                />
            </div>
            {!isValid && (
                <p className="text-[10px] text-red-500">Định dạng: DD/MM/YYYY (ví dụ: 01/08/2025)</p>
            )}
        </div>
    );
};

// ── Main Modal ────────────────────────────────────────────────────────────────

export const PlanDateRangeModal: React.FC<PlanDateRangeModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    defaultStartDate,
    isLoading = false,
    showWorkflowOption = false,
    project,
}) => {
    // Only 'range' mode is truly relevant here now, but we keep it simple since we only need Start Date for Workflow
    const [startDate, setStartDate] = useState('');
    const [error, setError] = useState('');
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
    const [estimatedDays, setEstimatedDays] = useState<number>(0);

    // Fetch workflows when modal opens
    useEffect(() => {
        if (!isOpen || !showWorkflowOption) return;
        const fetchWorkflows = async () => {
            const { data, error } = await supabase
                .from('workflows')
                .select('id, name, code')
                .eq('is_active', true)
                .eq('category', 'project')
                .order('created_at', { ascending: false });
            
            if (data && !error) {
                setWorkflows(data);
                
                // Find correct workflow to select by default based on project DesignSteps
                const designSteps = project?.DesignSteps || project?.design_steps || 1;
                let targetCode = 'QT-DA1B';
                if (designSteps === 3) targetCode = 'QT-DA3B';
                if (designSteps === 2) targetCode = 'QT-DA2B';

                const defaultWf = data.find(w => w.code === targetCode);
                
                if (defaultWf) {
                    setSelectedWorkflowId(defaultWf.id);
                } else if (data.length > 0) {
                    setSelectedWorkflowId(data[0].id);
                }
            }
        };
        fetchWorkflows();
    }, [isOpen, showWorkflowOption, project]);

    // Fetch estimated days when workflow changes
    useEffect(() => {
        if (!selectedWorkflowId) {
            setEstimatedDays(0);
            return;
        }
        const fetchSLA = async () => {
            const { data, error } = await supabase
                .from('workflow_nodes')
                .select('sla_formula, type')
                .eq('workflow_id', selectedWorkflowId)
                .eq('is_deleted', false);
                
            if (data && !error) {
                const workNodes = data.filter(n => ['approval', 'input', 'automated', 'start'].includes(n.type ?? ''));
                let totalSla = 0;
                workNodes.forEach(n => {
                    if (n.sla_formula) {
                        const match = n.sla_formula.match(/^(\d+)d$/);
                        if (match) totalSla += parseInt(match[1]);
                    } else {
                        totalSla += 1;
                    }
                });
                setEstimatedDays(totalSla);
            }
        };
        fetchSLA();
    }, [selectedWorkflowId]);

    // Initialize default dates when modal opens
    useEffect(() => {
        if (!isOpen) return;
        const today = defaultStartDate || new Date().toISOString().split('T')[0];
        setStartDate(today);
        setError('');
    }, [isOpen, defaultStartDate]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        setError('');
        if (!startDate) { setError('Vui lòng nhập ngày bắt đầu'); return; }

        if (showWorkflowOption && !selectedWorkflowId) {
            setError('Vui lòng chọn quy trình dự án');
            return;
        }

        // We only pass startDate really needed for workflow mode. 
        // EndDate dummy is preserved for compatibility if needed.
        onConfirm({ startDate, endDate: startDate, totalDays: estimatedDays }, showWorkflowOption ? selectedWorkflowId : undefined);
    };

    const fmt = (iso: string) => {
        if (!iso) return '';
        return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Calculate approximate end date based on working days
    const calculateEndDate = (start: string, days: number) => {
        if (!start || days === 0) return '';
        let d = new Date(start);
        let added = 0;
        while (added < days) {
            d.setDate(d.getDate() + 1);
            if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip Sunday(0) and Saturday(6)
                added++;
            }
        }
        return fmt(d.toISOString().split('T')[0]);
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-bg-surface rounded-2xl shadow-sm w-full max-w-md border border-border animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-txt-primary text-sm leading-tight">{title}</h3>
                            {description && (
                                <p className="text-xs text-txt-muted mt-0.5">{description}</p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-bg-muted rounded-lg transition-colors">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Workflow Template Selection */}
                    {showWorkflowOption && (
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-txt-secondary">
                                Quy trình dự án <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedWorkflowId}
                                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                                className="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 transition-shadow appearance-none cursor-pointer"
                            >
                                <option value="" disabled>-- Chọn quy trình --</option>
                                {workflows.map(wf => (
                                    <option key={wf.id} value={wf.id}>{wf.name}</option>
                                ))}
                            </select>
                            {project && (
                                <p className="text-[10px] text-gray-500 italic">Quy trình mặc định được chọn dựa trên số bước thiết kế của dự án ({project.DesignSteps || project.design_steps || 1} bước). Bạn có thể thay đổi nếu cần.</p>
                            )}
                        </div>
                    )}

                    {/* Start Date */}
                    <DateInput
                        label="Ngày bắt đầu dự án"
                        required
                        isoValue={startDate}
                        onChange={setStartDate}
                        colorClass="focus:ring-emerald-300 dark:focus:ring-emerald-700"
                    />

                    {/* Summary Preview */}
                    {startDate && estimatedDays > 0 && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                            <div className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold block mb-1">Dự kiến tiến độ thực hiện:</span>
                                    <ul className="space-y-1 pl-1">
                                        <li>• Tổng thời gian: <strong>{estimatedDays} ngày làm việc</strong> (SLA)</li>
                                        <li>• Bắt đầu: <strong>{fmt(startDate)}</strong></li>
                                        <li>• Dự kiến hoàn thành: <strong>{calculateEndDate(startDate, estimatedDays)}</strong></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                            ⚠️ {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-bg-subtle rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-txt-muted hover:bg-bg-muted rounded-xl transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-wait"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Đang tạo...
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4" />
                                Tạo kế hoạch
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

