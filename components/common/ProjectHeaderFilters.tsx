/**
 * ProjectHeaderFilters
 * 
 * Filter chips inline trong Header, giống pattern CIC ERP contract.
 * Chỉ render khi đang ở route /projects (không có /projects/:id).
 * 
 * Layout:  [Giai đoạn ▾] [Trạng thái ▾] [Nhóm ▾] [Phòng QLDA ▾] [✕ Xóa lọc]
 */
import React, { useRef, useState, useEffect } from 'react';
import { useMatch } from 'react-router-dom';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { useProjectFilterContextSafe } from '../../context/ProjectFilterContext';
import { STATUS_OPTIONS, CURRENT_STATUS_OPTIONS, GROUP_OPTIONS, SPECIALTY_OPTIONS } from '../../features/projects/hooks/useProjectFilters';
import { MANAGEMENT_BOARDS } from '../../types';


// ─────────────────────────────────────────────────────────
// Generic chip select dropdown
// ─────────────────────────────────────────────────────────
interface ChipOption { val: string; label: string; hex?: string }

interface ChipSelectProps {
    label: string;
    value: string;
    options: ChipOption[];
    counts?: Record<string, number>;
    totalUnfiltered?: number;
    onChange: (val: string) => void;
}

const ChipSelect: React.FC<ChipSelectProps> = ({ label, value, options, counts, totalUnfiltered, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const isActive = value !== 'all';

    // Click outside to close
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const selectedLabel = options.find(o => o.val === value)?.label ?? label;
    const selectedHex = options.find(o => o.val === value)?.hex;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(v => !v)}
                className={`
                    flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold
                    border transition-all duration-150 cursor-pointer select-none whitespace-nowrap
                    ${isActive
                        ? 'bg-white dark:bg-slate-800 border-primary-500 dark:border-primary-500 text-primary-700 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/20'
                        : 'bg-white dark:bg-slate-800 border-border dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }
                `}
            >
                {isActive && selectedHex && (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedHex }} />
                )}
                <span>{isActive ? selectedLabel : label}</span>
                <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="
                    absolute top-full left-0 mt-1.5 min-w-[180px] max-h-72 overflow-y-auto
                    bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700
                    py-1.5 z-[9999] animate-in fade-in slide-in-from-top-2 duration-150
                ">
                    {options.map(opt => {
                        const count = opt.val === 'all' ? totalUnfiltered : (counts?.[opt.val] ?? counts?.[Number(opt.val)] ?? undefined);
                        const selected = value === opt.val;
                        return (
                            <button
                                key={opt.val}
                                onClick={() => { onChange(opt.val); setOpen(false); }}
                                className={`
                                    w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left
                                    transition-colors
                                    ${selected
                                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }
                                `}
                            >
                                {opt.hex && (
                                    <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/50" style={{ backgroundColor: opt.hex }} />
                                )}
                                <span className="flex-1 truncate">{opt.label}</span>
                                {count !== undefined && count > 0 && (
                                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold tabular-nums">
                                        {count}
                                    </span>
                                )}
                                {selected && <span className="text-primary-600 dark:text-primary-400 text-[10px] font-bold ml-1">✓</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────
export const ProjectHeaderFilters: React.FC = () => {
    // Chỉ render khi đang ở /projects (list), không ở /projects/:id
    const isProjectList = useMatch('/projects');
    const filters = useProjectFilterContextSafe();

    if (!isProjectList || !filters) return null;

    const {
        selectedStatus, setSelectedStatus,
        selectedCurrentStatus, setSelectedCurrentStatus,
        selectedGroup, setSelectedGroup,
        selectedBoard, setSelectedBoard,
        selectedSpecialty, setSelectedSpecialty,
        hasActiveFilters, clearFilters,
        statusCounts, currentStatusCounts, groupCounts, boardCounts, specialtyCounts, totalUnfiltered,
    } = filters;

    // Build board options
    const boardOptions: ChipOption[] = [
        { val: 'all', label: 'Tất cả phòng' },
        ...(MANAGEMENT_BOARDS || []).map((b: any) => ({
            val: b.value.toString(),
            label: b.label,
            hex: b.hex,
        })),
    ];

    // Short label for status options (remove the "all" verbose label)
    const statusOpts: ChipOption[] = STATUS_OPTIONS.map(o => ({
        val: o.val,
        label: o.val === 'all' ? 'Tất cả giai đoạn' : o.label,
        hex: o.hex,
    }));

    const currentStatusOpts: ChipOption[] = CURRENT_STATUS_OPTIONS.map(o => ({
        val: o.val,
        label: o.val === 'all' ? 'Tất cả TT' : o.label,
        hex: o.hex,
    }));

    const groupOpts: ChipOption[] = GROUP_OPTIONS.map(g => ({
        val: g,
        label: g === 'all' ? 'Tất cả nhóm' : `Nhóm ${g}`,
    }));

    const specialtyOpts: ChipOption[] = SPECIALTY_OPTIONS.map(o => ({
        val: o.val,
        label: o.val === 'all' ? 'Tất cả chuyên ngành' : o.label,
    }));

    const activeCount = [
        selectedStatus !== 'all',
        selectedCurrentStatus !== 'all',
        selectedGroup !== 'all',
        selectedBoard !== 'all',
        selectedSpecialty !== 'all',
    ].filter(Boolean).length;

    return (
        <div className="flex items-center gap-1.5 mr-2">
            {/* Icon indicator */}
            <div className="flex items-center gap-1 mr-0.5">
                <SlidersHorizontal className={`w-3.5 h-3.5 ${hasActiveFilters ? 'text-primary-500' : 'text-slate-400 dark:text-slate-500'}`} />
                {activeCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {activeCount}
                    </span>
                )}
            </div>

            {/* Chip selects */}
            <ChipSelect
                label="Giai đoạn"
                value={selectedStatus}
                options={statusOpts}
                counts={statusCounts}
                totalUnfiltered={totalUnfiltered}
                onChange={setSelectedStatus}
            />
            <ChipSelect
                label="Trạng thái"
                value={selectedCurrentStatus}
                options={currentStatusOpts}
                counts={currentStatusCounts}
                totalUnfiltered={totalUnfiltered}
                onChange={setSelectedCurrentStatus}
            />
            <ChipSelect
                label="Nhóm"
                value={selectedGroup}
                options={groupOpts}
                counts={groupCounts}
                totalUnfiltered={totalUnfiltered}
                onChange={setSelectedGroup}
            />
            <ChipSelect
                label="Chuyên ngành"
                value={selectedSpecialty}
                options={specialtyOpts}
                counts={specialtyCounts}
                totalUnfiltered={totalUnfiltered}
                onChange={setSelectedSpecialty}
            />
            <ChipSelect
                label="Phòng QLDA"
                value={selectedBoard}
                options={boardOptions}
                counts={boardCounts}
                totalUnfiltered={totalUnfiltered}
                onChange={setSelectedBoard}
            />

            {/* Clear all */}
            {hasActiveFilters && (
                <button
                    onClick={clearFilters}
                    title="Xóa tất cả bộ lọc"
                    className="flex items-center gap-1 h-8 px-2 rounded-lg text-[11px] font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/50 transition-all"
                >
                    <X className="w-3 h-3" />
                    Xóa lọc
                </button>
            )}
        </div>
    );
};
