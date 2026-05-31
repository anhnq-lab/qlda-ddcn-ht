import React, { useState } from 'react';
import { Filter, X, Calendar, ChevronDown } from 'lucide-react';
import { CDE_DISCIPLINES, CDE_DOC_TYPES, CDE_STATUS_CONFIG, getStatusColor } from '../constants';
import type { CDEStatusCode } from '../types';

export interface CDEFilters {
    status: string[];
    discipline: string[];
    docType: string[];
    dateFrom: string;
    dateTo: string;
}

interface CDEFilterBarProps {
    filters: CDEFilters;
    onChange: (filters: CDEFilters) => void;
    onClear: () => void;
    resultCount: number;
}

const CDEFilterBar: React.FC<CDEFilterBarProps> = ({ filters, onChange, onClear, resultCount }) => {
    const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

    const activeCount = filters.status.length + filters.discipline.length + filters.docType.length + (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0);

    const toggleArrayItem = (key: 'status' | 'discipline' | 'docType', value: string) => {
        const arr = filters[key];
        const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
        onChange({ ...filters, [key]: next });
    };

    const FilterDropdown = ({ label, filterKey, options, icon }: {
        label: string; filterKey: string;
        options: { value: string; label: string; color?: string }[];
        icon?: React.ReactNode;
    }) => {
        const isOpen = expandedFilter === filterKey;
        const selectedCount = (filters as any)[filterKey]?.length || 0;

        return (
            <div className="relative" data-filter-dropdown>
                <button
                    onClick={() => setExpandedFilter(isOpen ? null : filterKey)}
                    className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer select-none whitespace-nowrap ${selectedCount > 0
                        ? 'bg-bg-surface border-primary-500 dark:border-primary-500 text-primary-700 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/20'
                        : 'bg-bg-surface border-border dark:border-slate-600 text-txt-secondary hover:bg-bg-hover-row'
                        }`}
                >
                    {icon}
                    {label}
                    {selectedCount > 0 && (
                        <span className="bg-primary-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{selectedCount}</span>
                    )}
                    <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full mt-1.5 left-0 min-w-[180px] w-56 bg-bg-surface border border-border rounded-xl shadow-xl z-[9999] py-1.5 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                        {options.map(opt => {
                            const isSelected = (filters as any)[filterKey]?.includes(opt.value);
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => toggleArrayItem(filterKey as any, opt.value)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors ${isSelected
                                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                        : 'text-txt-secondary hover:bg-bg-hover-row'
                                        }`}
                                >
                                    {opt.color && <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/50" style={{ backgroundColor: opt.color }} />}
                                    <span className="flex-1 truncate">{opt.label}</span>
                                    {isSelected && <span className="text-primary-600 dark:text-primary-400 text-[10px] font-bold ml-1">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex items-center gap-2 flex-wrap" onClick={(e) => { if ((e.target as HTMLElement).closest('[data-filter-dropdown]') === null) setExpandedFilter(null); }}>
            <div className="flex items-center gap-1.5 text-txt-muted">
                <Filter className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Bộ lọc</span>
            </div>

            <FilterDropdown
                label="Trạng thái"
                filterKey="status"
                options={Object.entries(CDE_STATUS_CONFIG).map(([code, cfg]) => ({
                    value: code, label: cfg.label, color: cfg.color,
                }))}
            />

            <FilterDropdown
                label="Lĩnh vực"
                filterKey="discipline"
                options={CDE_DISCIPLINES}
            />

            <FilterDropdown
                label="Loại hồ sơ"
                filterKey="docType"
                options={CDE_DOC_TYPES}
            />

            {/* Date Range */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-bg-surface border border-border rounded-lg px-2.5 py-1.5 shadow-sm">
                    <span className="text-[10px] font-bold text-txt-placeholder uppercase tracking-wider shrink-0 select-none">Từ:</span>
                    <input type="date" value={filters.dateFrom} onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
                        className="text-[11px] bg-transparent border-none outline-none w-28 text-txt-secondary focus:ring-0" />
                </div>
                <span className="text-gray-300 dark:text-slate-600 text-xs select-none">—</span>
                <div className="flex items-center gap-1.5 bg-bg-surface border border-border rounded-lg px-2.5 py-1.5 shadow-sm">
                    <span className="text-[10px] font-bold text-txt-placeholder uppercase tracking-wider shrink-0 select-none">Đến:</span>
                    <input type="date" value={filters.dateTo} onChange={e => onChange({ ...filters, dateTo: e.target.value })}
                        className="text-[11px] bg-transparent border-none outline-none w-28 text-txt-secondary focus:ring-0" />
                </div>
            </div>

            {/* Active badges + clear */}
            {activeCount > 0 && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                    <span className="text-[10px] font-bold text-gray-400">{resultCount} kết quả</span>
                    <button onClick={onClear} className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors">
                        <X className="w-3 h-3" /> Xóa bộ lọc
                    </button>
                </div>
            )}
        </div>
    );
};

export default CDEFilterBar;
export type { CDEFilters as CDEFilterState };
