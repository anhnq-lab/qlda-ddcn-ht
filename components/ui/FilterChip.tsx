import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// ============================================================================
// FILTER CHIP — Design System
// Pill-style filter dropdown, dùng chung cho mọi list view.
// Trích từ ProjectFilters.ChipSelect (module Quản lý dự án) làm CHUẨN chung.
// ============================================================================

export interface FilterChipOption {
    /** Giá trị truyền vào onChange */
    value: string;
    /** Nhãn hiển thị */
    label: string;
    /** Màu chấm tròn (hex) — vd màu trạng thái */
    color?: string;
    /** Số lượng hiển thị bên phải mỗi option */
    count?: number;
}

export interface FilterChipProps {
    /** Nhãn mặc định khi chưa chọn (vd "Trạng thái") */
    label: string;
    /** Giá trị đang chọn (controlled) */
    value: string;
    options: FilterChipOption[];
    onChange: (value: string) => void;
    /** Giá trị coi là "tất cả/chưa lọc" (mặc định 'all') */
    allValue?: string;
    className?: string;
}

/**
 * FilterChip — pill dropdown chuẩn (giống module Quản lý dự án).
 * Active = viền + chữ primary + ring. Dropdown panel bo tròn, có count + ✓.
 */
export const FilterChip: React.FC<FilterChipProps> = ({
    label,
    value,
    options,
    onChange,
    allValue = 'all',
    className = '',
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const isActive = value !== allValue;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const selected = options.find(o => o.value === value);
    const selectedLabel = selected?.label ?? label;
    const selectedColor = selected?.color;

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className={`
                    flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold
                    border transition-all duration-150 cursor-pointer select-none whitespace-nowrap
                    ${isActive
                        ? 'bg-bg-surface border-primary-500 dark:border-primary-500 text-primary-700 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/20'
                        : 'bg-bg-surface border-border dark:border-slate-600 text-txt-secondary hover:bg-bg-hover-row'
                    }
                `}
            >
                {isActive && selectedColor && (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedColor }} />
                )}
                <span>{isActive ? selectedLabel : label}</span>
                <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="
                    absolute top-full left-0 mt-1.5 min-w-[180px] max-h-72 overflow-y-auto
                    bg-bg-surface rounded-xl shadow-xl border border-border
                    py-1.5 z-[9999] animate-in fade-in slide-in-from-top-2 duration-150
                ">
                    {options.map(opt => {
                        const isSel = value === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={`
                                    w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left
                                    transition-colors
                                    ${isSel
                                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                        : 'text-txt-secondary hover:bg-bg-hover-row'
                                    }
                                `}
                            >
                                {opt.color && (
                                    <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/50" style={{ backgroundColor: opt.color }} />
                                )}
                                <span className="flex-1 truncate">{opt.label}</span>
                                {opt.count !== undefined && opt.count > 0 && (
                                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-bg-muted text-txt-muted font-semibold tabular-nums">
                                        {opt.count}
                                    </span>
                                )}
                                {isSel && <span className="text-primary-600 dark:text-primary-400 text-[10px] font-bold ml-1">✓</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FilterChip;
