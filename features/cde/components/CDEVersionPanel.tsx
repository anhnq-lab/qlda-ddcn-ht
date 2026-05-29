// ═══════════════════════════════════════════════════════════════
// CDE Version Panel — lịch sử phiên bản + tải phiên bản mới + so sánh 2 bản
// Dùng version_group_id. So sánh 2D: side-by-side PDF/ảnh.
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, History, Upload, GitCompare, Loader2 } from 'lucide-react';
import type { CDEDocument } from '../types';
import { CDEService } from '../../../services/CDEService';
import { useCDERevisions, useUploadRevision } from '../../../hooks/useCDE';

interface Rev {
    doc_id: number; version: string; revision: string; date: string;
    author: string; reason: string; size: string; storagePath?: string; is_latest?: boolean;
}

interface CDEVersionPanelProps {
    doc: CDEDocument;
    projectId: string;
    user?: { id?: string; name?: string; org?: string };
    onClose: () => void;
}

const isPdf = (n: string) => n.toLowerCase().endsWith('.pdf');
const isImg = (n: string) => /\.(png|jpe?g|gif|webp)$/i.test(n);

const ComparePane: React.FC<{ docName: string; storagePath?: string }> = ({ docName, storagePath }) => {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        let alive = true;
        if (!storagePath) { setUrl(null); return; }
        setLoading(true);
        CDEService.downloadDocument(storagePath)
            .then((u) => { if (alive) setUrl(u); })
            .catch(() => { if (alive) setUrl(null); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [storagePath]);

    if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-slate-900"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
    if (!url) return <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-slate-900 text-xs text-gray-400">Không tải được</div>;
    if (isPdf(docName)) return <iframe src={`${url}#toolbar=0`} className="flex-1 w-full border-0" title="rev" />;
    if (isImg(docName)) return <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-2"><img src={url} className="max-w-full max-h-full object-contain" alt="rev" /></div>;
    return <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-slate-900 text-xs text-gray-400">Định dạng chưa hỗ trợ so sánh trực tiếp</div>;
};

const CDEVersionPanel: React.FC<CDEVersionPanelProps> = ({ doc, projectId, user, onClose }) => {
    const { data: revisions = [], isLoading } = useCDERevisions(doc.doc_id);
    const uploadRev = useUploadRevision();
    const fileRef = useRef<HTMLInputElement>(null);
    const [reason, setReason] = useState('');
    const [mode, setMode] = useState<'history' | 'compare'>('history');
    const [aId, setAId] = useState<number | null>(null);
    const [bId, setBId] = useState<number | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const revs = revisions as Rev[];

    useEffect(() => {
        if (mode === 'compare' && revs.length >= 2 && aId == null && bId == null) {
            setAId(revs[0].doc_id);
            setBId(revs[1].doc_id);
        }
    }, [mode, revs, aId, bId]);

    const onPickFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        uploadRev.mutate({
            baseDoc: doc,
            file,
            reason: reason || 'Cập nhật phiên bản',
            userId: user?.id || '',
            userName: user?.name || '',
            userOrg: user?.org || 'Ban QLDA',
        }, {
            onSuccess: () => { setReason(''); setToast('Đã tải lên phiên bản mới'); setTimeout(() => setToast(null), 3000); },
            onError: (err: Error) => { setToast(`Lỗi: ${err.message}`); setTimeout(() => setToast(null), 4000); },
        });
    }, [doc, reason, user, uploadRev]);

    const revA = revs.find((r) => r.doc_id === aId);
    const revB = revs.find((r) => r.doc_id === bId);

    return (
        <div className="fixed inset-0 z-[105] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-bg-surface w-full max-w-5xl h-[88vh] rounded-2xl shadow-sm overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-bg-subtle">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <History className="w-5 h-5 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                            <h3 className="text-sm font-black text-txt-primary truncate">Phiên bản — {doc.doc_name}</h3>
                            <p className="text-[10px] text-gray-400">{revs.length} phiên bản</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-bg-muted rounded-xl p-1">
                            <button onClick={() => setMode('history')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${mode === 'history' ? 'bg-white dark:bg-slate-700 text-txt-primary shadow-sm' : 'text-gray-500'}`}>Lịch sử</button>
                            <button onClick={() => setMode('compare')} disabled={revs.length < 2} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-40 ${mode === 'compare' ? 'bg-white dark:bg-slate-700 text-txt-primary shadow-sm' : 'text-gray-500'}`}><GitCompare className="w-3.5 h-3.5" />So sánh</button>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><X className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {mode === 'history' ? (
                        <div className="flex-1 overflow-y-auto p-5">
                            {/* Upload new revision */}
                            <div className="mb-4 p-4 rounded-xl border border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/10">
                                <p className="text-xs font-bold text-txt-muted mb-2">Tải lên phiên bản mới</p>
                                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do/ghi chú thay đổi..." className="w-full px-3 py-2 mb-2 text-xs border border-gray-200 dark:border-slate-600 rounded-lg bg-bg-surface dark:text-slate-200" />
                                <button onClick={() => fileRef.current?.click()} disabled={uploadRev.isPending} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {uploadRev.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Chọn file & tải lên
                                </button>
                                <input ref={fileRef} type="file" className="hidden" onChange={onPickFile} />
                            </div>

                            {isLoading ? (
                                <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
                            ) : (
                                <div className="space-y-2">
                                    {revs.map((r) => (
                                        <div key={r.doc_id} className={`p-3 rounded-xl border flex items-center justify-between ${r.is_latest ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/15' : 'border-border-subtle'}`}>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black font-mono bg-bg-muted px-2 py-0.5 rounded">v{r.version}</span>
                                                    {r.is_latest && <span className="text-[9px] font-bold text-blue-600 uppercase">Mới nhất</span>}
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-1">{r.date} • {r.author} • {r.size}</p>
                                                {r.reason && <p className="text-[10px] text-txt-muted italic mt-0.5">{r.reason}</p>}
                                            </div>
                                            <button onClick={() => r.storagePath && CDEService.downloadDocument(r.storagePath).then((u) => window.open(u, '_blank'))} className="text-[10px] font-bold text-blue-600 hover:underline">Tải xuống</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Chọn 2 phiên bản */}
                            <div className="px-5 py-3 border-b border-border-subtle flex items-center gap-3 bg-bg-subtle text-xs">
                                <label className="flex items-center gap-1.5">A:
                                    <select value={aId ?? ''} onChange={(e) => setAId(Number(e.target.value))} className="px-2 py-1 border border-gray-200 dark:border-slate-600 rounded-lg bg-bg-surface dark:text-slate-200">
                                        {revs.map((r) => <option key={r.doc_id} value={r.doc_id}>v{r.version} ({r.date})</option>)}
                                    </select>
                                </label>
                                <label className="flex items-center gap-1.5">B:
                                    <select value={bId ?? ''} onChange={(e) => setBId(Number(e.target.value))} className="px-2 py-1 border border-gray-200 dark:border-slate-600 rounded-lg bg-bg-surface dark:text-slate-200">
                                        {revs.map((r) => <option key={r.doc_id} value={r.doc_id}>v{r.version} ({r.date})</option>)}
                                    </select>
                                </label>
                            </div>
                            <div className="flex-1 flex min-h-0">
                                <div className="flex-1 flex flex-col border-r border-border">
                                    <div className="px-3 py-1.5 text-[10px] font-bold bg-bg-muted text-txt-muted">A · v{revA?.version}</div>
                                    <ComparePane docName={doc.doc_name} storagePath={revA?.storagePath} />
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <div className="px-3 py-1.5 text-[10px] font-bold bg-bg-muted text-txt-muted">B · v{revB?.version}</div>
                                    <ComparePane docName={doc.doc_name} storagePath={revB?.storagePath} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {toast && <div className="absolute bottom-4 right-4 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow">{toast}</div>}
            </div>
        </div>
    );
};

export default CDEVersionPanel;
