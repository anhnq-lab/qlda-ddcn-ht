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
            <div className="relative">
                <button
                    onClick={() => setExpandedFilter(isOpen ? null : filterKey)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${selectedCount > 0
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-gray-300'
                        }`}
                >
                    {icon}
                    {label}
                    {selectedCount > 0 && (
                        <span className="bg-primary-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{selectedCount}</span>
                    )}
                    <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full mt-1 left-0 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm z-30 p-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        {options.map(opt => {
                            const isSelected = (filters as any)[filterKey]?.includes(opt.value);
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => toggleArrayItem(filterKey as any, opt.value)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-all ${isSelected
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold'
                                        : 'text-gray-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {opt.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
                                    <span className="flex-1 truncate">{opt.label}</span>
                                    {isSelected && <span className="text-blue-600 dark:text-blue-400 font-black text-sm">✓</span>}
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
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400">
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
            <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <input type="date" value={filters.dateFrom} onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
                        className="text-[11px] bg-transparent border-none outline-none w-28 text-gray-700 dark:text-slate-200" placeholder="Từ ngày" />
                </div>
                <span className="text-gray-300 text-xs">—</span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5">
                    <input type="date" value={filters.dateTo} onChange={e => onChange({ ...filters, dateTo: e.target.value })}
                        className="text-[11px] bg-transparent border-none outline-none w-28 text-gray-700 dark:text-slate-200" placeholder="Đến ngày" />
                </div>
            </div>

            {/* Active badges + clear */}
            {activeCount > 0 && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-slate-700">
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
