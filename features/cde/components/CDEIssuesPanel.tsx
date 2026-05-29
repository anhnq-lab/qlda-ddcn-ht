// ═══════════════════════════════════════════════════════════════
// CDE Issues Panel — danh sách issue hợp nhất 2D (tài liệu) + 3D (BIM)
// Dùng chung bảng bim_issues. Click issue 2D → mở tài liệu; 3D → mở viewer.
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ClipboardList, Box, FileText, Filter, Loader2 } from 'lucide-react';
import { bimIssuesService, type BimIssue, type BimIssueStatus } from '../../../services/bimCollabService';

interface CDEIssuesPanelProps {
    projectId: string;
    /** Mở tài liệu 2D theo doc_id (để xem pin) */
    onOpenDoc?: (docId: number) => void;
    /** Mở viewer 3D */
    onOpenBim?: () => void;
}

const STATUS_META: Record<BimIssueStatus, { label: string; cls: string }> = {
    open: { label: 'Mở', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    in_progress: { label: 'Đang xử lý', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    resolved: { label: 'Đã xử lý', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    closed: { label: 'Đóng', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
};

const CDEIssuesPanel: React.FC<CDEIssuesPanelProps> = ({ projectId, onOpenDoc, onOpenBim }) => {
    const [issues, setIssues] = useState<BimIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<BimIssueStatus | 'all'>('all');

    const refresh = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        const list = await bimIssuesService.list(projectId);
        setIssues(list);
        setLoading(false);
    }, [projectId]);

    useEffect(() => { void refresh(); }, [refresh]);

    const filtered = useMemo(
        () => (statusFilter === 'all' ? issues : issues.filter((i) => i.status === statusFilter)),
        [issues, statusFilter]
    );

    const counts = useMemo(() => ({
        all: issues.length,
        open: issues.filter((i) => i.status === 'open').length,
        in_progress: issues.filter((i) => i.status === 'in_progress').length,
        resolved: issues.filter((i) => i.status === 'resolved').length,
        closed: issues.filter((i) => i.status === 'closed').length,
    }), [issues]);

    return (
        <div className="bg-bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center">
                        <ClipboardList className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-txt-primary">Vấn đề / Ghi chú (Issues)</h3>
                        <p className="text-[10px] text-gray-400">Hợp nhất 2D tài liệu + 3D mô hình BIM</p>
                    </div>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-bg-muted px-2.5 py-1 rounded-lg">{filtered.length} issue</span>
            </div>

            {/* Filter trạng thái */}
            <div className="px-5 py-3 border-b border-border-subtle flex items-center gap-2 bg-bg-subtle flex-wrap">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${statusFilter === s ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-bg-muted'}`}
                    >
                        {s === 'all' ? 'Tất cả' : STATUS_META[s].label} ({counts[s]})
                    </button>
                ))}
            </div>

            <div className="max-h-[560px] overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <ClipboardList className="w-10 h-10 mx-auto text-gray-200 dark:text-slate-600 mb-3" />
                        <p className="text-sm text-gray-400 font-medium">Chưa có issue nào</p>
                        <p className="text-[10px] text-gray-300 mt-1">Tạo issue từ markup tài liệu 2D hoặc từ viewer 3D</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border-subtle">
                        {filtered.map((it) => {
                            const is2D = it.source === 'doc_2d';
                            const meta = STATUS_META[it.status];
                            return (
                                <button
                                    key={it.id}
                                    onClick={() => { if (is2D && it.doc_id) onOpenDoc?.(it.doc_id); else if (!is2D) onOpenBim?.(); }}
                                    className="w-full text-left px-5 py-3.5 flex items-start gap-3 hover:bg-bg-subtle dark:hover:bg-slate-700 transition-all"
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${is2D ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-cyan-50 dark:bg-cyan-900/20'}`}>
                                        {is2D ? <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <Box className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-txt-primary truncate">{it.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${meta.cls}`}>{meta.label}</span>
                                            <span className="text-[10px] font-bold text-gray-400 bg-bg-muted px-1.5 py-0.5 rounded uppercase">{is2D ? '2D' : '3D'}</span>
                                            {it.priority && it.priority !== 'normal' && (
                                                <span className="text-[10px] text-gray-400">• {it.priority}</span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 shrink-0">{new Date(it.created_at).toLocaleDateString('vi-VN')}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CDEIssuesPanel;
