// ═══════════════════════════════════════════════════════════════
// RaciEditor — Form chỉnh sửa RACI cho 1 workflow node
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import type { StakeholderType } from '../services/StakeholderService';
import { StakeholderService } from '../services/StakeholderService';
import type { NodeRaciSummary } from '../services/WorkflowRaciService';

interface RaciEditorProps {
    nodeId: string;
    nodeName: string;
    stakeholders: StakeholderType[];
    currentRaci: NodeRaciSummary | undefined;
    onSave: (assignments: Array<{ stakeholder_code: string; raci_type: 'R' | 'A' | 'C' | 'I' }>) => void;
    onCancel: () => void;
    isSaving?: boolean;
}

type RaciType = 'R' | 'A' | 'C' | 'I';
const RACI_TYPES: RaciType[] = ['R', 'A', 'C', 'I'];

export const RaciEditor: React.FC<RaciEditorProps> = ({
    nodeId,
    nodeName,
    stakeholders,
    currentRaci,
    onSave,
    onCancel,
    isSaving = false,
}) => {
    // State: stakeholder_code → Set of RACI types
    const [selections, setSelections] = useState<Map<string, Set<RaciType>>>(new Map());

    // Initialize from current data
    useEffect(() => {
        const map = new Map<string, Set<RaciType>>();
        stakeholders.forEach(s => map.set(s.code, new Set()));
        if (currentRaci) {
            RACI_TYPES.forEach(type => {
                currentRaci[type].forEach(code => {
                    if (map.has(code)) {
                        map.get(code)!.add(type);
                    }
                });
            });
        }
        setSelections(map);
    }, [nodeId, currentRaci, stakeholders]);

    // Group stakeholders by category
    const groupedStakeholders = useMemo(() => {
        const groups = new Map<string, StakeholderType[]>();
        stakeholders.forEach(s => {
            if (!groups.has(s.category)) groups.set(s.category, []);
            groups.get(s.category)!.push(s);
        });
        return groups;
    }, [stakeholders]);

    const toggleRaci = (code: string, type: RaciType) => {
        setSelections(prev => {
            const next = new Map(prev);
            const set = new Set(next.get(code) || []);
            if (set.has(type)) {
                set.delete(type);
            } else {
                set.add(type);
            }
            next.set(code, set);
            return next;
        });
    };

    const handleSave = () => {
        const assignments: Array<{ stakeholder_code: string; raci_type: RaciType }> = [];
        selections.forEach((types, code) => {
            types.forEach(type => {
                assignments.push({ stakeholder_code: code, raci_type: type });
            });
        });
        onSave(assignments);
    };

    const hasChanges = useMemo(() => {
        if (!currentRaci) {
            // Check if any selection made
            let any = false;
            selections.forEach(types => { if (types.size > 0) any = true; });
            return any;
        }
        // Compare
        for (const [code, types] of selections) {
            for (const type of RACI_TYPES) {
                const inCurrent = currentRaci[type].includes(code);
                const inSelection = types.has(type);
                if (inCurrent !== inSelection) return true;
            }
        }
        return false;
    }, [selections, currentRaci]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="pb-3 border-b border-border">
                <h4 className="text-sm font-semibold text-txt-primary">
                    Ma trận RACI
                </h4>
                <p className="text-xs text-txt-muted mt-0.5">
                    {nodeName}
                </p>
            </div>

            {/* RACI Matrix Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs table-fixed">
                    <colgroup>
                        <col className="w-[120px]" />
                        <col className="w-auto" />
                        <col className="w-[60px]" />
                        <col className="w-[60px]" />
                        <col className="w-[60px]" />
                        <col className="w-[60px]" />
                    </colgroup>
                    <thead>
                        <tr className="border-b border-border">
                            <th colSpan={2} className="text-left py-2 px-2 font-medium text-txt-muted">
                                Bên liên quan
                            </th>
                            {RACI_TYPES.map(type => {
                                const color = StakeholderService.getRaciColor(type);
                                return (
                                    <th key={type} className={`text-center py-2 font-bold ${color.text}`}>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-sm">{type}</span>
                                            <span className="text-[9px] font-normal opacity-70">
                                                {StakeholderService.getRaciLabel(type)}
                                            </span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from(groupedStakeholders.entries()).map(([category, items]) => (
                            <React.Fragment key={category}>
                                {/* Category header */}
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="pt-3 pb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-txt-placeholder"
                                    >
                                        {StakeholderService.getCategoryLabel(category)}
                                    </td>
                                </tr>
                                {items.map(stakeholder => {
                                    const selected = selections.get(stakeholder.code) || new Set();
                                    return (
                                        <tr
                                            key={stakeholder.code}
                                            className="border-b border-border-subtle hover:bg-bg-hover-row/50 transition-colors"
                                        >
                                            <td className="py-1.5 px-2 align-middle">
                                                <span className="inline-block bg-bg-muted text-txt-muted px-1.5 py-0.5 rounded font-mono text-[9px] border border-border">
                                                    {stakeholder.code}
                                                </span>
                                            </td>
                                            <td className="py-1.5 px-2 align-middle">
                                                <span className="font-medium text-txt-secondary">{stakeholder.name}</span>
                                            </td>
                                            {RACI_TYPES.map(type => {
                                                const isChecked = selected.has(type);
                                                const color = StakeholderService.getRaciColor(type);
                                                return (
                                                    <td key={type} className="text-center py-1.5">
                                                        <div className="flex items-center justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleRaci(stakeholder.code, type)}
                                                                className={`w-7 h-7 rounded-md border-2 transition-all duration-150 flex items-center justify-center ${
                                                                    isChecked
                                                                        ? `${color.bg} ${color.border} ${color.text} shadow-sm`
                                                                        : 'border-border hover:border-gray-300 dark:hover:border-gray-600'
                                                                }`}
                                                            >
                                                                {isChecked && (
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1.5 text-xs font-medium text-txt-muted hover:text-gray-800 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    disabled={isSaving}
                >
                    Hủy
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                        hasChanges && !isSaving
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                    }`}
                >
                    {isSaving ? 'Đang lưu...' : 'Lưu RACI'}
                </button>
            </div>
        </div>
    );
};

export default RaciEditor;
