/**
 * BimElementSearchPanel — Search elements by name, type, or expressId.
 * Walks the spatial tree, scores matches (exact id > exact name > substring),
 * and lets the user click a result to zoom + highlight.
 *
 * Inspired by Autodesk Viewer's "Search" panel: a single input does it all,
 * results show element name + type + storey path so the user can disambiguate.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { useBimContext } from './context/BimContext';
import type { SpatialNode } from './BimModelTree';

interface Props {
    onClose: () => void;
}

interface SearchHit {
    expressId: number;
    name: string;
    type: string;
    path: string;       // breadcrumb (Site > Building > Storey > …)
    score: number;
}

/** Walk the spatial tree once, collecting flat (node, path) entries. */
function flattenTree(roots: SpatialNode[]): Array<{ node: SpatialNode; path: string[] }> {
    const out: Array<{ node: SpatialNode; path: string[] }> = [];
    const walk = (node: SpatialNode, path: string[]) => {
        out.push({ node, path });
        if (Array.isArray(node.children)) {
            const nextPath = [...path, node.name || node.type];
            for (const child of node.children) walk(child as any, nextPath);
        }
    };
    for (const r of roots) walk(r, []);
    return out;
}

export const BimElementSearchPanel: React.FC<Props> = ({ onClose }) => {
    const { selection, engine, isDarkMode } = useBimContext();
    const [query, setQuery] = useState('');

    const flat = useMemo(() => flattenTree(selection.spatialTree || []), [selection.spatialTree]);

    const hits = useMemo<SearchHit[]>(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];

        const idMatch = /^#?(\d+)$/.exec(q);
        const targetId = idMatch ? parseInt(idMatch[1], 10) : null;

        const results: SearchHit[] = [];
        for (const { node, path } of flat) {
            const name = (node.name || '').toLowerCase();
            const type = (node.type || '').toLowerCase();
            let score = 0;

            if (targetId !== null && node.id === targetId) score = 1000;
            else if (name === q) score = 800;
            else if (type === q) score = 600;
            else if (name.includes(q)) score = 400 - Math.abs(name.length - q.length);
            else if (type.includes(q)) score = 300;

            if (score > 0) {
                results.push({
                    expressId: node.id,
                    name: node.name || `#${node.id}`,
                    type: node.type || 'Unknown',
                    path: path.join(' › '),
                    score,
                });
            }
            if (results.length > 200) break; // hard cap so the panel stays responsive
        }
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, 100);
    }, [query, flat]);

    const handleSelect = useCallback((hit: SearchHit) => {
        selection.handleSelectElementFromTree(hit.expressId);
        // Fire & forget — zoom uses async strategies internally
        void engine.zoomToExpressId(hit.expressId);
    }, [selection, engine]);

    return (
        <div className={`flex flex-col h-full ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-white text-gray-800'}`}>
            <div className={`flex items-center justify-between px-3 py-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold">Tìm phần tử</span>
                </div>
                <button onClick={onClose} className="p-1 rounded hover:bg-bg-muted">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className={`px-3 py-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tên, loại (IfcWall…), hoặc #expressId"
                        className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border ${
                            isDarkMode
                                ? 'bg-slate-800 border-slate-600 placeholder-slate-500'
                                : 'bg-white border-gray-200 placeholder-gray-400'
                        }`}
                    />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                    Đã index <strong>{flat.length}</strong> phần tử trong spatial tree.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto">
                {query.trim() === '' ? (
                    <div className="px-3 py-6 text-center text-[11px] text-slate-500">
                        Gõ tên/loại để bắt đầu tìm.
                    </div>
                ) : hits.length === 0 ? (
                    <div className="px-3 py-6 text-center text-[11px] text-slate-500">
                        Không tìm thấy phần tử khớp.
                    </div>
                ) : (
                    <ul className="divide-y divide-border">
                        {hits.map((h) => (
                            <li key={h.expressId}>
                                <button
                                    onClick={() => handleSelect(h)}
                                    className="w-full text-left px-3 py-2 hover:bg-bg-muted transition-colors group"
                                >
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xs font-semibold truncate flex-1">{h.name}</span>
                                        <span className="text-[10px] font-mono text-slate-400">#{h.expressId}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-muted text-txt-muted font-mono">
                                            {h.type}
                                        </span>
                                        {h.path && (
                                            <span className="text-[10px] text-slate-500 truncate flex items-center gap-0.5">
                                                <MapPin className="w-2.5 h-2.5" />
                                                {h.path}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
