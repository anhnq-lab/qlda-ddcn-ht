/**
 * BimIssuesPanel — BCF-lite issue tracker embedded in the BIM viewer.
 * What works today:
 *   • Create issue from current viewpoint (camera state + screenshot)
 *   • List issues with status / priority filters
 *   • Click an issue → restore its viewpoint
 *   • Threaded comments (chronological)
 *   • Status workflow: open → in_progress → resolved → closed
 *
 * The viewpoint payload is the same shape used by Saved Views, so future BCF
 * import/export only needs a single mapper.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { ClipboardList, Plus, X, Loader2, AlertCircle, Camera, MessageSquare, Send } from 'lucide-react';
import { useBimContext } from './context/BimContext';
import {
    bimIssuesService,
    type BimIssue,
    type BimIssueComment,
    type BimIssueStatus,
    type BimIssuePriority,
} from '../../../../services/bimCollabService';
import { captureViewport } from './utils/captureViewport';

interface Props {
    onClose: () => void;
}

const STATUS_OPTIONS: Array<{ value: BimIssueStatus; label: string; color: string }> = [
    { value: 'open',         label: 'Mở',         color: 'text-blue-500' },
    { value: 'in_progress',  label: 'Đang xử lý', color: 'text-amber-500' },
    { value: 'resolved',     label: 'Đã xử lý',   color: 'text-green-500' },
    { value: 'closed',       label: 'Đóng',       color: 'text-slate-500' },
];

const PRIORITY_OPTIONS: Array<{ value: BimIssuePriority; label: string }> = [
    { value: 'low', label: 'Thấp' },
    { value: 'normal', label: 'Bình thường' },
    { value: 'high', label: 'Cao' },
    { value: 'critical', label: 'Khẩn cấp' },
];

export const BimIssuesPanel: React.FC<Props> = ({ onClose }) => {
    const { projectID, engine, selection, isDarkMode } = useBimContext();
    const [issues, setIssues] = useState<BimIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<BimIssueStatus | 'all'>('all');
    const [creating, setCreating] = useState(false);
    const [activeIssue, setActiveIssue] = useState<BimIssue | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        const list = await bimIssuesService.list(projectID);
        setIssues(list);
        setLoading(false);
    }, [projectID]);

    useEffect(() => { refresh(); }, [refresh]);

    const filtered = useMemo(() => {
        if (statusFilter === 'all') return issues;
        return issues.filter((i) => i.status === statusFilter);
    }, [issues, statusFilter]);

    // ── Create issue ─────────────────────────────────────────────────
    const handleCreate = useCallback(async (title: string, description: string, priority: BimIssuePriority) => {
        if (!title.trim()) return;
        setCreating(true);
        try {
            const world = engine.worldRef.current;
            // Capture viewpoint (camera + selection)
            let viewpoint: any = null;
            if (world?.camera) {
                const controls = (world.camera as any).controls;
                const pos = controls.getPosition(new THREE.Vector3());
                const tgt = controls.getTarget(new THREE.Vector3());
                viewpoint = {
                    camera: {
                        position: [pos.x, pos.y, pos.z],
                        target: [tgt.x, tgt.y, tgt.z],
                    },
                };
            }
            const screenshot = await captureViewport(world);

            const created = await bimIssuesService.create({
                project_id: projectID,
                title: title.trim(),
                description: description.trim() || null,
                status: 'open',
                priority,
                viewpoint,
                screenshot_url: screenshot, // data URL — stored inline; swap for Storage upload later
                target_express_id: selection.selectedElement ? Number(selection.selectedElement.id) || null : null,
                target_model_id: null,
                assigned_to: null,
                due_date: null,
                created_by: null,
            });
            if (created) setIssues((prev) => [created, ...prev]);
        } finally {
            setCreating(false);
        }
    }, [engine.worldRef, projectID, selection.selectedElement]);

    const handleStatusChange = useCallback(async (id: string, status: BimIssueStatus) => {
        await bimIssuesService.update(id, { status });
        setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    }, []);

    const handleRestore = useCallback((issue: BimIssue) => {
        const world = engine.worldRef.current;
        const vp: any = issue.viewpoint;
        if (!world || !vp?.camera) return;
        const controls = (world.camera as any)?.controls;
        if (!controls) return;
        const [px, py, pz] = vp.camera.position;
        const [tx, ty, tz] = vp.camera.target;
        controls.setLookAt(px, py, pz, tx, ty, tz, true);
        engine.requestRender();
    }, [engine]);

    if (activeIssue) {
        return (
            <IssueDetail
                issue={activeIssue}
                isDarkMode={isDarkMode}
                onClose={() => setActiveIssue(null)}
                onStatusChange={(s) => {
                    handleStatusChange(activeIssue.id, s);
                    setActiveIssue({ ...activeIssue, status: s });
                }}
                onRestoreViewpoint={() => handleRestore(activeIssue)}
            />
        );
    }

    return (
        <div className={`flex flex-col h-full ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-white text-gray-800'}`}>
            <div className={`flex items-center justify-between px-3 py-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-semibold">Issues</span>
                    <span className="text-[10px] text-slate-500">({issues.length})</span>
                </div>
                <button onClick={onClose} className="p-1 rounded hover:bg-bg-muted">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <CreateIssueForm onSubmit={handleCreate} isSubmitting={creating} isDarkMode={isDarkMode} />

            {/* Filters */}
            <div className={`flex items-center gap-1 px-3 py-1.5 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} overflow-x-auto`}>
                {(['all', ...STATUS_OPTIONS.map((o) => o.value)] as Array<BimIssueStatus | 'all'>).map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
                            statusFilter === s
                                ? 'bg-blue-500 text-white'
                                : 'text-slate-500 hover:bg-bg-muted'
                        }`}
                    >
                        {s === 'all' ? 'Tất cả' : STATUS_OPTIONS.find((o) => o.value === s)?.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="px-3 py-8 text-center text-[11px] text-slate-500">
                        Chưa có issue nào.
                    </div>
                ) : (
                    <ul className="divide-y divide-border">
                        {filtered.map((issue) => {
                            const statusCfg = STATUS_OPTIONS.find((o) => o.value === issue.status);
                            return (
                                <li key={issue.id}>
                                    <button
                                        onClick={() => setActiveIssue(issue)}
                                        className="w-full text-left px-3 py-2 hover:bg-bg-muted transition-colors"
                                    >
                                        <div className="flex items-start gap-2">
                                            {issue.screenshot_url ? (
                                                <img
                                                    src={issue.screenshot_url}
                                                    alt=""
                                                    className="w-10 h-10 rounded object-cover bg-slate-200 dark:bg-slate-800 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                    <Camera className="w-4 h-4 text-slate-400" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold truncate">{issue.title}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className={`text-[10px] font-medium ${statusCfg?.color}`}>
                                                        {statusCfg?.label}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">·</span>
                                                    <span className="text-[10px] text-slate-500">
                                                        {new Date(issue.created_at).toLocaleDateString('vi-VN')}
                                                    </span>
                                                    {issue.priority === 'critical' && (
                                                        <AlertCircle className="w-3 h-3 text-red-500" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

// ── Subcomponents ──────────────────────────────────────────────────────

const CreateIssueForm: React.FC<{
    onSubmit: (title: string, description: string, priority: BimIssuePriority) => void | Promise<void>;
    isSubmitting: boolean;
    isDarkMode: boolean;
}> = ({ onSubmit, isSubmitting, isDarkMode }) => {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<BimIssuePriority>('normal');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(title, description, priority);
        setTitle('');
        setDescription('');
        setPriority('normal');
        setOpen(false);
    };

    if (!open) {
        return (
            <div className={`px-3 py-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <button
                    onClick={() => setOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white"
                >
                    <Plus className="w-3.5 h-3.5" /> Tạo issue
                </button>
                <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                    Issue lưu ảnh + góc nhìn hiện tại để teammate kiểm tra
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={`px-3 py-2 border-b space-y-2 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tiêu đề issue *"
                required
                className={`w-full px-2 py-1.5 text-xs rounded-lg border ${
                    isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'
                }`}
            />
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả (tùy chọn)"
                rows={2}
                className={`w-full px-2 py-1.5 text-xs rounded-lg border resize-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'
                }`}
            />
            <div className="flex items-center gap-2">
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as BimIssuePriority)}
                    className={`flex-1 px-2 py-1 text-xs rounded-lg border ${
                        isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'
                    }`}
                >
                    {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>Ưu tiên: {p.label}</option>)}
                </select>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-2 py-1 text-xs text-slate-500 hover:bg-bg-muted rounded-lg"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-2.5 py-1 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Tạo'}
                </button>
            </div>
        </form>
    );
};

const IssueDetail: React.FC<{
    issue: BimIssue;
    isDarkMode: boolean;
    onClose: () => void;
    onStatusChange: (s: BimIssueStatus) => void;
    onRestoreViewpoint: () => void;
}> = ({ issue, isDarkMode, onClose, onStatusChange, onRestoreViewpoint }) => {
    const [comments, setComments] = useState<BimIssueComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            setComments(await bimIssuesService.listComments(issue.id));
            setLoading(false);
        })();
    }, [issue.id]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        const body = draft.trim();
        if (!body) return;
        const c = await bimIssuesService.addComment({ issueId: issue.id, body });
        if (c) setComments((prev) => [...prev, c]);
        setDraft('');
    };

    return (
        <div className={`flex flex-col h-full ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-white text-gray-800'}`}>
            <div className={`flex items-center justify-between px-3 py-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <button onClick={onClose} className="text-xs text-slate-500 hover:underline">← Quay lại</button>
                <button onClick={onRestoreViewpoint} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                    <Camera className="w-3 h-3" /> Khôi phục góc nhìn
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <h3 className="text-sm font-bold">{issue.title}</h3>
                {issue.description && <p className="text-xs text-txt-muted">{issue.description}</p>}

                <div className="flex items-center gap-1">
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => onStatusChange(opt.value)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                issue.status === opt.value
                                    ? 'bg-blue-500 text-white'
                                    : `${opt.color} hover:bg-bg-muted`
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {issue.screenshot_url && (
                    <img src={issue.screenshot_url} alt="" className="w-full rounded border border-border" />
                )}

                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Bình luận ({comments.length})
                    </p>
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : comments.length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic">Chưa có bình luận.</p>
                    ) : (
                        <ul className="space-y-1.5">
                            {comments.map((c) => (
                                <li key={c.id} className="text-xs">
                                    <p>{c.body}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        {c.author || 'Người dùng'} · {new Date(c.created_at).toLocaleString('vi-VN')}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <form onSubmit={handleAddComment} className={`px-3 py-2 border-t flex items-center gap-2 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Viết bình luận..."
                    className={`flex-1 px-2 py-1.5 text-xs rounded-lg border ${
                        isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'
                    }`}
                />
                <button type="submit" className="p-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white">
                    <Send className="w-3.5 h-3.5" />
                </button>
            </form>
        </div>
    );
};
