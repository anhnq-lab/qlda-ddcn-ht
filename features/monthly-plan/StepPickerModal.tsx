/**
 * StepPickerModal — Chọn bước dự án để đưa vào KH tháng
 *
 * Hiển thị danh sách các project_steps chưa lên KH (schedule_state='project_step')
 * thuộc phòng hiện tại. User tích chọn rồi bấm "Đưa vào KH tháng".
 */
import React, { useState, useMemo } from 'react';
import { X, FolderOpen, CalendarDays, CheckSquare, Square, ChevronDown, ChevronRight } from 'lucide-react';
import type { ProjectStep } from '../../services/ProjectStepsService';

const PHASE_LABELS: Record<string, string> = {
    preparation: 'Giai đoạn Chuẩn bị đầu tư',
    execution:   'Giai đoạn Thực hiện xây lắp',
    completion:  'Giai đoạn Kết thúc dự án',
};

const PHASE_ORDER = ['preparation', 'execution', 'completion'];

interface StepPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    steps: ProjectStep[];
    loading: boolean;
    scheduling: boolean;
    onConfirm: (selectedIds: string[]) => void;
    month: number;
    year: number;
}

export const StepPickerModal: React.FC<StepPickerModalProps> = ({
    isOpen, onClose, steps, loading, scheduling, onConfirm, month, year,
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
        preparation: true,
        execution: true,
        completion: true,
    });

    const byPhase = useMemo(() => {
        const map: Record<string, ProjectStep[]> = {};
        steps.forEach(s => {
            const phase = s.phase || 'execution';
            if (!map[phase]) map[phase] = [];
            map[phase].push(s);
        });
        return map;
    }, [steps]);

    const toggleStep = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const togglePhase = (phase: string) => {
        setExpandedPhases(prev => ({ ...prev, [phase]: !prev[phase] }));
    };

    const toggleAll = () => {
        if (selectedIds.size === steps.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(steps.map(s => s.id)));
        }
    };

    const handleConfirm = () => {
        if (selectedIds.size === 0) return;
        onConfirm([...selectedIds]);
    };

    if (!isOpen) return null;

    const MONTH_NAMES = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                        <h2 className="text-base font-bold text-txt-primary flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-violet-500" />
                            Chọn bước đưa vào {MONTH_NAMES[month]} {year}
                        </h2>
                        <p className="text-xs text-txt-muted mt-0.5">
                            Chọn các bước dự án chưa lên lịch để thêm vào kế hoạch tháng
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-muted transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-slate-400">
                            <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full mr-2" />
                            Đang tải danh sách bước...
                        </div>
                    ) : steps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                            <CalendarDays className="w-10 h-10 opacity-30" />
                            <p className="text-sm">Không có bước nào chưa lên KH tháng</p>
                            <p className="text-xs text-slate-400">Tất cả bước đã được lên lịch hoặc chưa có kế hoạch tổng thể</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Select all */}
                            <button
                                onClick={toggleAll}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-txt-muted hover:bg-bg-hover-row/50 rounded-lg transition-colors"
                            >
                                {selectedIds.size === steps.length
                                    ? <CheckSquare className="w-4 h-4 text-violet-600" />
                                    : <Square className="w-4 h-4 text-slate-400" />
                                }
                                <span className="font-medium">
                                    {selectedIds.size === steps.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                </span>
                                <span className="ml-auto text-xs text-slate-400">{steps.length} bước</span>
                            </button>

                            {/* By phase */}
                            {PHASE_ORDER.filter(p => byPhase[p]?.length).map(phase => (
                                <div key={phase} className="border border-border rounded-xl overflow-hidden">
                                    {/* Phase header */}
                                    <button
                                        onClick={() => togglePhase(phase)}
                                        className="flex items-center gap-2 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700/50 text-left"
                                    >
                                        {expandedPhases[phase]
                                            ? <ChevronDown className="w-4 h-4 text-slate-400" />
                                            : <ChevronRight className="w-4 h-4 text-slate-400" />
                                        }
                                        <span className="text-xs font-bold text-txt-secondary uppercase tracking-wide">
                                            {PHASE_LABELS[phase] ?? phase}
                                        </span>
                                        <span className="ml-auto text-xs text-slate-400 font-normal normal-case">
                                            {byPhase[phase].filter(s => selectedIds.has(s.id)).length}/{byPhase[phase].length} đã chọn
                                        </span>
                                    </button>

                                    {/* Step rows */}
                                    {expandedPhases[phase] && (
                                        <div className="divide-y divide-border-subtle">
                                            {byPhase[phase].map(step => (
                                                <button
                                                    key={step.id}
                                                    onClick={() => toggleStep(step.id)}
                                                    className={`flex items-start gap-3 w-full px-3 py-2.5 text-left transition-colors hover:bg-violet-50/50 dark:hover:bg-violet-900/10 ${
                                                        selectedIds.has(step.id) ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                                                    }`}
                                                >
                                                    <div className="mt-0.5 flex-shrink-0">
                                                        {selectedIds.has(step.id)
                                                            ? <CheckSquare className="w-4 h-4 text-violet-600" />
                                                            : <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-txt-primary truncate">
                                                            {step.task_name}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                            {step.assignee_role && (
                                                                <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-1.5 py-0.5 rounded">
                                                                    {step.assignee_role}
                                                                </span>
                                                            )}
                                                            {step.due_date && (
                                                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                                                    <CalendarDays className="w-3 h-3" />
                                                                    {new Date(step.due_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                                                </span>
                                                            )}
                                                            {step.duration_days && (
                                                                <span className="text-[10px] text-slate-400">
                                                                    {step.duration_days} ngày
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 p-4 border-t border-border">
                    <span className="text-sm text-txt-muted">
                        Đã chọn <strong>{selectedIds.size}</strong> bước
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-txt-muted border border-border rounded-lg hover:bg-bg-hover-row transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedIds.size === 0 || scheduling}
                            className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {scheduling && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                            Đưa vào KH tháng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepPickerModal;
