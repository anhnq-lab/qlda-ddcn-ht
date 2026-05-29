import React, { useState, useEffect, useMemo } from 'react';
import { X, CalendarRange, Save, ListChecks } from 'lucide-react';
import { DisbursementPlanItem } from '../../../services/CapitalService';
import { formatCurrency } from '../../../utils/format';
import { Task } from '../../../types';

interface MonthEntry {
    id?: string;
    month: number;
    plannedAmount: string; // Keep as string, we will store raw digits here
    actualAmount: string;   // Keep as string
    notes: string;
}

interface DisbursementPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (year: number, plans: { id?: string, month: number, plannedAmount: number, actualAmount: number, notes: string }[]) => void;
    projectID: string;
    defaultYear: number;
    allPlans: DisbursementPlanItem[];
    annualLimit: number;
    isSaving?: boolean;
    projectTasks?: Task[];
}

/** Compute tasks active in a given month/year based on date range overlap */
function getTasksForMonth(tasks: Task[], month: number, year: number): string[] {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0); // last day of month

    return tasks
        .filter(t => {
            const taskStart = t.PlannedStartDate || t.StartDate || t.DueDate;
            const taskEnd = t.PlannedEndDate || t.DueDate;
            if (!taskEnd) return false;

            const tStart = new Date(taskStart || taskEnd);
            const tEnd = new Date(taskEnd);

            // Check overlap: task range overlaps with month range
            return tStart <= monthEnd && tEnd >= monthStart;
        })
        .map(t => t.Title);
}

export const DisbursementPlanModal: React.FC<DisbursementPlanModalProps> = ({
    isOpen, onClose, onSave, projectID, defaultYear, allPlans, annualLimit, isSaving, projectTasks = []
}) => {
    const [year, setYear] = useState(defaultYear);
    const [entries, setEntries] = useState<MonthEntry[]>([]);

    // Compute task labels for each month
    const monthlyTasks = useMemo(() => {
        const map: Record<number, string[]> = {};
        for (let m = 1; m <= 12; m++) {
            map[m] = getTasksForMonth(projectTasks, m, year);
        }
        return map;
    }, [projectTasks, year]);

    const loadPlansForYear = (y: number) => {
        const initial: MonthEntry[] = [];
        for (let m = 1; m <= 12; m++) {
            const existing = allPlans.find(p => p.Year === y && p.Month === m);
            initial.push({
                id: existing?.Id,
                month: m,
                plannedAmount: existing?.PlannedAmount ? String(existing.PlannedAmount) : '',
                actualAmount: existing?.ActualAmount ? String(existing.ActualAmount) : '',
                notes: existing?.Notes || ''
            });
        }
        setEntries(initial);
    };

    useEffect(() => {
        if (isOpen) {
            setYear(defaultYear);
            loadPlansForYear(defaultYear);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleYearChange = (newYear: number) => {
        setYear(newYear);
        loadPlansForYear(newYear);
    };

    const handleChange = (month: number, field: keyof MonthEntry, value: string) => {
        if (field === 'plannedAmount') {
            // Remove non-digit characters for raw storage
            const rawValue = value.replace(/\D/g, '');
            setEntries(prev => prev.map(e => e.month === month ? { ...e, [field]: rawValue } : e));
        } else {
            setEntries(prev => prev.map(e => e.month === month ? { ...e, [field]: value } : e));
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const plansToSave = entries.map(e => ({
            id: e.id,
            month: e.month,
            plannedAmount: Number(e.plannedAmount) || 0,
            actualAmount: Number(e.actualAmount) || 0,
            notes: e.notes || ''
        }));

        onSave(year, plansToSave);
    };

    const totalPlanned = entries.reduce((acc, curr) => acc + (Number(curr.plannedAmount) || 0), 0);
    const totalActual = entries.reduce((acc, curr) => acc + (Number(curr.actualAmount) || 0), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-bg-surface rounded-2xl shadow-sm w-full max-w-5xl mx-4 border border-border animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                            <CalendarRange className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-txt-primary flex items-center gap-3">
                                Lập kế hoạch 12 tháng
                                {annualLimit > 0 && (
                                    <span className="text-xs font-medium px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
                                        Vốn giao năm: {formatCurrency(annualLimit)}
                                    </span>
                                )}
                            </h2>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 hover:bg-bg-muted rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-4 shrink-0 border-b border-border-subtle">
                        <div className="w-48">
                            <label className="block text-xs font-semibold text-txt-muted mb-1.5">
                                Kế hoạch Năm <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={year}
                                onChange={e => handleYearChange(Number(e.target.value))}
                                min={2020} max={2035}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-txt-primary text-sm font-bold focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 bg-bg-subtle dark:text-slate-400 rounded-lg border-b border-border">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-lg rounded-bl-lg w-24">Tháng</th>
                                    <th className="py-3 px-4 w-1/5">Kế hoạch (VNĐ)</th>
                                    <th className="py-3 px-4 w-1/5">Thực tế (VNĐ)</th>
                                    <th className="py-3 px-4 rounded-tr-lg rounded-br-lg">
                                        <div className="flex items-center gap-1.5">
                                            <ListChecks className="w-3.5 h-3.5 text-violet-500" />
                                            Việc trong tháng
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map(e => {
                                    const tasksInMonth = monthlyTasks[e.month] || [];
                                    const autoTaskText = tasksInMonth.length > 0
                                        ? tasksInMonth.join(', ')
                                        : '';

                                    return (
                                        <tr key={e.month} className="border-b border-border-subtle last:border-0 hover:bg-bg-subtle dark:hover:bg-slate-800 transition-colors">
                                            <td className="py-2.5 px-4 font-medium text-txt-secondary">
                                                Tháng {e.month}
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <input
                                                    type="text"
                                                    value={e.plannedAmount ? Number(e.plannedAmount).toLocaleString('vi-VN') : ''}
                                                    onChange={ev => handleChange(e.month, 'plannedAmount', ev.target.value)}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-bg-surface text-txt-primary text-sm font-mono focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <span className="text-emerald-700 dark:text-emerald-400 font-mono font-medium block w-full px-3 py-1.5 bg-bg-subtle dark:bg-slate-700 rounded-lg border border-transparent">
                                                    {formatCurrency(Number(e.actualAmount) || 0)}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4">
                                                {tasksInMonth.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {tasksInMonth.slice(0, 3).map((taskName, i) => (
                                                            <span key={i} className="inline-block px-2 py-0.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[11px] font-medium rounded-md border border-violet-200 dark:border-violet-800/50 truncate max-w-[180px]" title={taskName}>
                                                                {taskName}
                                                            </span>
                                                        ))}
                                                        {tasksInMonth.length > 3 && (
                                                            <span className="inline-block px-2 py-0.5 bg-bg-muted text-txt-muted text-[11px] font-medium rounded-md" title={tasksInMonth.slice(3).join(', ')}>
                                                                +{tasksInMonth.length - 3} việc
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 dark:text-slate-600 text-xs italic">Không có việc</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {/* Tổng cộng footer */}
                                <tr className="bg-gray-50 dark:bg-slate-700 font-bold border-t border-gray-200 dark:border-slate-600">
                                    <td className="py-3 px-4 text-txt-primary">Tổng cộng</td>
                                    <td className="py-3 px-4 text-violet-700 dark:text-violet-400 font-mono">
                                        {formatCurrency(totalPlanned)}
                                    </td>
                                    <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-mono">
                                        {formatCurrency(totalActual)}
                                    </td>
                                    <td className="py-3 px-4"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center px-6 py-4 border-t border-border shrink-0 bg-bg-subtle rounded-b-2xl">
                        <div>
                            {totalPlanned > annualLimit && (
                                <p className="text-red-500 font-medium tracking-tight text-sm bg-red-50 dark:bg-red-900/20 px-3 py-1.5 border border-red-200 dark:border-red-800/50 rounded-lg shadow-sm">
                                    ⚠️ Tổng kế hoạch ({formatCurrency(totalPlanned)}) đang vượt quá Vốn giao ({formatCurrency(annualLimit)})!
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-txt-muted bg-bg-surface border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || totalPlanned > annualLimit}
                                className="px-5 py-2 text-sm font-bold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'Đang lưu...' : 'Lưu kế hoạch'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
