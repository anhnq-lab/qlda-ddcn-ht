// Date helpers + DateInputVN + status/priority config used by ProjectTaskModal.
// Extracted from ProjectTaskModal.tsx so the main file no longer carries
// ~110 LOC of supporting code unrelated to the modal's form logic.
import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { TaskStatus, TaskPriority } from '@/types';

// ── Date helpers ─────────────────────────────────────────────────

export const todayISO = (): string => new Date().toISOString();

export const toYMD = (iso?: string | null): string => {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    } catch {
        return '';
    }
};

export const toDMY = (iso?: string | null): string => {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${dd}/${mm}/${d.getFullYear()}`;
    } catch {
        return '';
    }
};

// ── DateInputVN: a DD/MM/YYYY input that also exposes a native picker ──

export const DateInputVN: React.FC<{
    value?: string | null;
    onChange: (iso: string) => void;
    borderClass?: string;
}> = ({ value, onChange, borderClass = 'border-gray-300 dark:border-slate-700' }) => {
    const [localValue, setLocalValue] = useState(toDMY(value));

    useEffect(() => {
        setLocalValue(toDMY(value));
    }, [value]);

    const handleBlur = () => {
        const parts = localValue.split(/[\/\-]/);
        if (parts.length === 3) {
            let [d, m, y] = parts;
            if (y.length === 2) y = '20' + y;
            if (y.length === 4) {
                const parsedDate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`);
                if (!isNaN(parsedDate.getTime())) {
                    onChange(parsedDate.toISOString());
                    return;
                }
            }
        }
        if (!localValue.trim()) onChange('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);

        const parts = val.split(/[\/\-]/);
        if (parts.length === 3 && parts[2].length === 4) {
            const [d, m, y] = parts;
            const parsedDate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`);
            if (!isNaN(parsedDate.getTime())) onChange(parsedDate.toISOString());
        } else if (!val.trim()) {
            onChange('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleBlur();
    };

    return (
        <div className={`relative flex items-center w-full rounded-xl border bg-white dark:bg-slate-800 group transition-all duration-200 focus-within:ring-2 focus-within:ring-primary-500/30 ${borderClass}`}>
            <Calendar className="absolute left-3.5 w-4 h-4 text-gray-400 dark:text-slate-400 pointer-events-none group-focus-within:text-primary-500 transition-colors" />
            <input
                type="text"
                placeholder="DD/MM/YYYY"
                className="w-full flex-1 bg-transparent py-2.5 pl-10 pr-10 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0"
                value={localValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
            />
            <div className="absolute right-2 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity overflow-hidden w-8 h-8 flex items-center justify-center cursor-pointer">
                <input
                    type="date"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    value={toYMD(value)}
                    onChange={(e) => {
                        if (e.target.value) onChange(new Date(e.target.value).toISOString());
                    }}
                />
                <Calendar className="w-4 h-4 text-gray-400 hover:text-primary-500 pointer-events-none" />
            </div>
        </div>
    );
};

// ── Status / Priority badge configs ──────────────────────────────

export const getStatusConfig = (s?: TaskStatus) => {
    switch (s) {
        case TaskStatus.Done:
            return {
                label: 'Hoàn thành',
                bg: 'bg-emerald-500',
                text: 'text-emerald-600',
                light: 'bg-emerald-50 dark:bg-emerald-900/30',
                ring: 'ring-emerald-500/20',
            };
        case TaskStatus.InProgress:
            return {
                label: 'Đang thực hiện',
                bg: 'bg-primary-500',
                text: 'text-primary-600',
                light: 'bg-primary-50 dark:bg-primary-900/30',
                ring: 'ring-primary-500/20',
            };
        case TaskStatus.Review:
            return {
                label: 'Chờ duyệt',
                bg: 'bg-warning-500',
                text: 'text-warning-600',
                light: 'bg-warning-50 dark:bg-warning-900/30',
                ring: 'ring-warning-500/20',
            };
        default:
            return {
                label: 'Cần làm',
                bg: 'bg-slate-300',
                text: 'text-slate-500',
                light: 'bg-slate-50 dark:bg-slate-700',
                ring: 'ring-slate-300/20',
            };
    }
};

export const getPriorityConfig = (p?: TaskPriority) => {
    switch (p) {
        case TaskPriority.Urgent:
            return { label: 'Khẩn cấp', color: 'text-red-600 bg-red-50 ring-1 ring-red-500/20' };
        case TaskPriority.High:
            return { label: 'Cao', color: 'text-warning-600 bg-warning-50 ring-1 ring-warning-500/20' };
        case TaskPriority.Medium:
            return { label: 'Trung bình', color: 'text-sky-600 bg-sky-50 ring-1 ring-sky-500/20' };
        case TaskPriority.Low:
            return { label: 'Thấp', color: 'text-slate-500 bg-slate-50 ring-1 ring-slate-300/20' };
        default:
            return { label: 'N/A', color: 'text-slate-400 bg-slate-50 dark:bg-slate-800' };
    }
};
