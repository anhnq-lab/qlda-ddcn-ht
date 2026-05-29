// ═══════════════════════════════════════════════════════════════
// CDE Markup 2D Layer — lớp pin/issue BCF-lite phủ trên tài liệu 2D
// (PDF/ảnh) trong CDEFilePreview. Click (khi bật chế độ markup) để thả pin
// → tạo issue source='doc_2d'. Pin lưu toạ độ chuẩn hoá 0..1 theo trang.
// Dùng chung bảng bim_issues với issue 3D (xem migration unified_issues_2d).
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react';
import { MapPin, X, Plus, Check } from 'lucide-react';
import { bimIssuesService, type BimIssue } from '../../../services/bimCollabService';

interface CDEMarkup2DLayerProps {
    docId: number;
    projectId: string;
    createdBy?: string;
    /** Bật chế độ thả pin (click để tạo issue) */
    active: boolean;
}

const STATUS_COLOR: Record<string, string> = {
    open: 'bg-blue-500',
    in_progress: 'bg-amber-500',
    resolved: 'bg-emerald-500',
    closed: 'bg-slate-500',
};

const CDEMarkup2DLayer: React.FC<CDEMarkup2DLayerProps> = ({ docId, projectId, createdBy, active }) => {
    const [issues, setIssues] = useState<BimIssue[]>([]);
    const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
    const [draftTitle, setDraftTitle] = useState('');
    const [activeIssueId, setActiveIssueId] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        const list = await bimIssuesService.listForDoc(docId);
        setIssues(list.filter((i) => i.source === 'doc_2d' && i.pin_x != null && i.pin_y != null));
    }, [docId]);

    useEffect(() => { void refresh(); }, [refresh]);

    const handleLayerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!active) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setDraft({ x: Math.min(Math.max(x, 0), 1), y: Math.min(Math.max(y, 0), 1) });
        setDraftTitle('');
    }, [active]);

    const saveDraft = useCallback(async () => {
        if (!draft || !draftTitle.trim()) return;
        await bimIssuesService.create({
            project_id: projectId,
            title: draftTitle.trim(),
            description: null,
            status: 'open',
            priority: 'normal',
            source: 'doc_2d',
            doc_id: docId,
            page: 1,
            pin_x: draft.x,
            pin_y: draft.y,
            created_by: createdBy ?? null,
        } as any);
        setDraft(null);
        setDraftTitle('');
        await refresh();
    }, [draft, draftTitle, projectId, docId, createdBy, refresh]);

    const cycleStatus = useCallback(async (issue: BimIssue) => {
        const order: BimIssue['status'][] = ['open', 'in_progress', 'resolved', 'closed'];
        const next = order[(order.indexOf(issue.status) + 1) % order.length];
        await bimIssuesService.update(issue.id, { status: next });
        await refresh();
    }, [refresh]);

    return (
        <div
            className={`absolute inset-0 ${active ? 'cursor-crosshair' : 'pointer-events-none'}`}
            onClick={handleLayerClick}
        >
            {/* Pin đã lưu */}
            {issues.map((it) => (
                <div
                    key={it.id}
                    className="absolute -translate-x-1/2 -translate-y-full pointer-events-auto"
                    style={{ left: `${(it.pin_x ?? 0) * 100}%`, top: `${(it.pin_y ?? 0) * 100}%` }}
                    onClick={(e) => { e.stopPropagation(); setActiveIssueId(activeIssueId === it.id ? null : it.id); }}
                >
                    <MapPin className={`w-6 h-6 drop-shadow ${it.status === 'resolved' || it.status === 'closed' ? 'text-emerald-500' : 'text-red-500'}`} fill="currentColor" />
                    {activeIssueId === it.id && (
                        <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-3 z-10 text-left">
                            <p className="text-xs font-bold text-txt-primary break-words">{it.title}</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); void cycleStatus(it); }}
                                className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-white px-2 py-1 rounded-lg"
                            >
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${STATUS_COLOR[it.status]}`}>
                                    {it.status}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            ))}

            {/* Pin nháp đang tạo */}
            {draft && (
                <div
                    className="absolute -translate-x-1/2 -translate-y-full pointer-events-auto"
                    style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%` }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <MapPin className="w-6 h-6 text-blue-600 animate-bounce" fill="currentColor" />
                    <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-blue-200 dark:border-blue-700 p-3 z-20">
                        <input
                            autoFocus
                            value={draftTitle}
                            onChange={(e) => setDraftTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') void saveDraft(); }}
                            placeholder="Nội dung ghi chú/issue..."
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-lg bg-bg-surface dark:text-slate-200"
                        />
                        <div className="flex justify-end gap-1.5 mt-2">
                            <button onClick={() => setDraft(null)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg" title="Hủy"><X className="w-4 h-4" /></button>
                            <button onClick={() => void saveDraft()} disabled={!draftTitle.trim()} className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50" title="Lưu issue"><Check className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            )}

            {/* Gợi ý khi bật markup */}
            {active && !draft && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow pointer-events-none flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Click lên tài liệu để thả pin ghi chú
                </div>
            )}
        </div>
    );
};

export default CDEMarkup2DLayer;
