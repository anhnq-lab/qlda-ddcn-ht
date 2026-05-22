/**
 * BimVisualizationPanel — Combined panel for the "pro" visualization tools:
 *   • Explode slider (0 → 1)
 *   • Color-by dropdown (none / discipline / storey / type)
 *   • Storey checkbox list (show/hide by IfcBuildingStorey)
 *
 * Lives next to the Toolbar and is opened via a button. Keeps everything in
 * one place so the user discovers them as a coherent feature set instead of
 * hunting through menus.
 */
import React, { useCallback } from 'react';
import { Eye, EyeOff, X, Layers, Palette, ChevronsUpDown } from 'lucide-react';
import { useBimContext } from './context/BimContext';
import type { ColorByMode } from './useBimVisualization';

interface Props {
    onClose: () => void;
}

const COLOR_BY_OPTIONS: Array<{ value: ColorByMode; label: string }> = [
    { value: 'none', label: 'Mặc định' },
    { value: 'discipline', label: 'Theo bộ môn' },
    { value: 'storey', label: 'Theo tầng' },
    { value: 'type', label: 'Theo loại đối tượng' },
];

export const BimVisualizationPanel: React.FC<Props> = ({ onClose }) => {
    const { visualization, isDarkMode, engine } = useBimContext();

    const handleExplodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        visualization.setExplodeFactor(v);
        engine.requestRender();
    }, [visualization, engine]);

    const handleColorByChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        visualization.setColorByMode(e.target.value as ColorByMode);
        engine.requestRender();
    }, [visualization, engine]);

    const handleStoreyToggle = useCallback((storeyId: number, currentlyVisible: boolean) => {
        // visibleStoreys empty = show all. If empty and user clicks one storey,
        // we want only that storey visible → seed the set with that storey.
        // Otherwise toggle membership normally.
        if (visualization.visibleStoreys.size === 0) {
            visualization.setStoreyVisible(storeyId, true);
            // Now hide everything else: mark every OTHER storey as not in the set
            // (no-op since set already only contains storeyId)
        } else {
            visualization.setStoreyVisible(storeyId, !currentlyVisible);
        }
        engine.requestRender();
    }, [visualization, engine]);

    const handleShowAll = useCallback(() => {
        visualization.showAllStoreys();
        engine.requestRender();
    }, [visualization, engine]);

    const explodePct = Math.round(visualization.explodeFactor * 100);

    return (
        <div className={`flex flex-col h-full ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-white text-gray-800'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-3 py-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-semibold">Hiển thị</span>
                </div>
                <button onClick={onClose} className="p-1 rounded hover:bg-bg-muted">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* Explode */}
                <section>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold flex items-center gap-1.5">
                            <ChevronsUpDown className="w-3 h-3 text-amber-500" />
                            Tách phần tử (Explode)
                        </label>
                        <span className="text-[10px] font-mono text-slate-500">{explodePct}%</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={visualization.explodeFactor}
                        onChange={handleExplodeChange}
                        className="w-full accent-amber-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                        Kéo để tách rời các phần tử khỏi tâm mô hình — hữu ích khi xem cấu kiện chồng lấp.
                    </p>
                </section>

                {/* Color-by */}
                <section>
                    <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5">
                        <Palette className="w-3 h-3 text-purple-500" />
                        Tô màu theo
                    </label>
                    <select
                        value={visualization.colorByMode}
                        onChange={handleColorByChange}
                        className={`w-full px-2 py-1.5 text-xs rounded-lg border ${
                            isDarkMode
                                ? 'bg-slate-800 border-slate-600'
                                : 'bg-white border-gray-200'
                        }`}
                    >
                        {COLOR_BY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                        Tô màu các đối tượng theo nhóm để phân biệt nhanh.
                    </p>
                </section>

                {/* Storey filter */}
                <section>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold flex items-center gap-1.5">
                            <Layers className="w-3 h-3 text-blue-500" />
                            Tầng hiển thị
                        </label>
                        <button
                            onClick={handleShowAll}
                            className="text-[10px] font-medium text-blue-500 hover:underline"
                        >
                            Hiện tất cả
                        </button>
                    </div>
                    {visualization.allStoreyIds.length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic">
                            Chưa nhận diện được tầng (cần spatial tree từ file IFC).
                        </p>
                    ) : (
                        <div className="space-y-0.5">
                            {visualization.allStoreyIds.map((id) => {
                                const isVisible = visualization.visibleStoreys.size === 0 || visualization.visibleStoreys.has(id);
                                const name = visualization.storeyNames[id] || `Storey ${id}`;
                                return (
                                    <button
                                        key={id}
                                        onClick={() => handleStoreyToggle(id, isVisible)}
                                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                                            isVisible
                                                ? (isDarkMode ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700')
                                                : 'text-slate-500 hover:bg-bg-muted'
                                        }`}
                                    >
                                        <span className="text-xs truncate">{name}</span>
                                        {isVisible
                                            ? <Eye className="w-3.5 h-3.5 shrink-0" />
                                            : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};
