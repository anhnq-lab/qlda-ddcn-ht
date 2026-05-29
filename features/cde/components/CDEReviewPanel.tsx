// ═══════════════════════════════════════════════════════════════
// CDE Review Panel — gói duyệt nhiều tài liệu (GĐ4)
// Tạo gói duyệt (chọn tài liệu + người duyệt + hạn) → mỗi người duyệt
// Approve/Reject (kèm tuỳ chọn ký số) → trạng thái rollup tự cập nhật.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from 'react';
import { ClipboardCheck, Plus, X, Check, Ban, Clock, FileText, Loader2, PenTool } from 'lucide-react';
import type { CDEDocument, CDEReview, CDEReviewApprover } from '../types';
import { useCDEReviews, useCreateReview, useRecordReviewDecision } from '../../../hooks/useCDE';

interface CDEReviewPanelProps {
    projectId: string;
    projectDocs: CDEDocument[];
    user?: { id?: string; name?: string };
    onSign?: (doc: { doc_name: string }) => void;
}

const STATUS_META: Record<CDEReview['status'], { label: string; cls: string }> = {
    open: { label: 'Đang duyệt', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    approved: { label: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    rejected: { label: 'Bị từ chối', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    closed: { label: 'Đã đóng', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
};

const CDEReviewPanel: React.FC<CDEReviewPanelProps> = ({ projectId, projectDocs, user, onSign }) => {
    const { data: reviews = [], isLoading } = useCDEReviews(projectId);
    const createReview = useCreateReview();
    const recordDecision = useRecordReviewDecision();

    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
    const [approverNames, setApproverNames] = useState('');

    const docName = useMemo(() => {
        const m = new Map<number, string>();
        projectDocs.forEach((d) => m.set(d.doc_id, d.doc_name));
        return m;
    }, [projectDocs]);

    const resetForm = () => { setTitle(''); setDueDate(''); setSelectedDocs([]); setApproverNames(''); setShowCreate(false); };

    const submitCreate = useCallback(() => {
        if (!title.trim()) return;
        const approvers = approverNames.split(',').map((s) => s.trim()).filter(Boolean).map((name) => ({ name }));
        if (approvers.length === 0 && user?.name) approvers.push({ name: user.name });
        createReview.mutate({
            projectId,
            title: title.trim(),
            dueDate: dueDate || null,
            docIds: selectedDocs,
            approvers,
            createdBy: user?.id,
            createdByName: user?.name,
        }, { onSuccess: resetForm });
    }, [title, dueDate, selectedDocs, approverNames, projectId, user, createReview]);

    const decide = useCallback((review: CDEReview, ap: CDEReviewApprover, decision: 'approved' | 'rejected', signed = false) => {
        recordDecision.mutate({
            approverRowId: ap.id,
            reviewId: review.id,
            projectId,
            decision,
            signed,
            actorId: user?.id,
            actorName: user?.name,
        });
    }, [recordDecision, projectId, user]);

    return (
        <div className="bg-bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                        <ClipboardCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-txt-primary">Gói duyệt (Reviews)</h3>
                        <p className="text-[10px] text-gray-400">Duyệt nhiều tài liệu — gán người duyệt, ký số, rollup</p>
                    </div>
                </div>
                <button onClick={() => setShowCreate((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">
                    <Plus className="w-4 h-4" /> Tạo gói duyệt
                </button>
            </div>

            {/* Create form */}
            {showCreate && (
                <div className="px-5 py-4 border-b border-border-subtle bg-bg-subtle space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên gói duyệt *" className="px-3 py-2 text-xs border border-gray-200 dark:border-slate-600 rounded-lg bg-bg-surface dark:text-slate-200" />
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="px-3 py-2 text-xs border border-gray-200 dark:border-slate-600 rounded-lg bg-bg-surface dark:text-slate-200" />
                    </div>
                    <input value={approverNames} onChange={(e) => setApproverNames(e.target.value)} placeholder="Người duyệt (cách nhau bởi dấu phẩy)" className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-600 rounded-lg bg-bg-surface dark:text-slate-200" />
                    <div>
                        <p className="text-[10px] font-bold text-txt-muted uppercase mb-1.5">Chọn tài liệu ({selectedDocs.length})</p>
                        <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-slate-600 rounded-lg divide-y divide-border-subtle">
                            {projectDocs.length === 0 && <p className="p-3 text-xs text-gray-400">Chưa có tài liệu</p>}
                            {projectDocs.map((d) => (
                                <label key={d.doc_id} className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-bg-subtle">
                                    <input type="checkbox" checked={selectedDocs.includes(d.doc_id)} onChange={() => setSelectedDocs((prev) => prev.includes(d.doc_id) ? prev.filter((x) => x !== d.doc_id) : [...prev, d.doc_id])} />
                                    <FileText className="w-3.5 h-3.5 text-gray-400" /> <span className="truncate">{d.doc_name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={resetForm} className="px-4 py-2 text-xs font-bold text-gray-500 bg-bg-muted rounded-lg">Hủy</button>
                        <button onClick={submitCreate} disabled={!title.trim() || createReview.isPending} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-1.5">
                            {createReview.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Tạo
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="max-h-[560px] overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                    <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
                ) : reviews.length === 0 ? (
                    <div className="p-12 text-center">
                        <ClipboardCheck className="w-10 h-10 mx-auto text-gray-200 dark:text-slate-600 mb-3" />
                        <p className="text-sm text-gray-400 font-medium">Chưa có gói duyệt nào</p>
                    </div>
                ) : reviews.map((r) => {
                    const meta = STATUS_META[r.status];
                    return (
                        <div key={r.id} className="border border-border-subtle rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-txt-primary">{r.title}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${meta.cls}`}>{meta.label}</span>
                                        <span className="text-[10px] text-gray-400">{r.items?.length || 0} tài liệu</span>
                                        {r.due_date && <span className="text-[10px] text-gray-400 inline-flex items-center gap-1"><Clock className="w-3 h-3" />Hạn {new Date(r.due_date).toLocaleDateString('vi-VN')}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Tài liệu */}
                            {(r.items?.length ?? 0) > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {r.items!.map((it) => (
                                        <span key={it.id} className="text-[10px] bg-bg-muted text-txt-muted px-2 py-0.5 rounded inline-flex items-center gap-1">
                                            <FileText className="w-3 h-3" />{docName.get(it.doc_id) || `#${it.doc_id}`}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Người duyệt */}
                            <div className="mt-3 space-y-1.5">
                                {(r.approvers || []).map((ap) => (
                                    <div key={ap.id} className="flex items-center justify-between gap-2 bg-bg-subtle rounded-lg px-3 py-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-xs font-semibold text-txt-primary truncate">{ap.approver_name}</span>
                                            {ap.decision === 'approved' && <span className="text-[10px] font-bold text-emerald-600 inline-flex items-center gap-1"><Check className="w-3 h-3" />Duyệt{ap.signed ? ' (đã ký)' : ''}</span>}
                                            {ap.decision === 'rejected' && <span className="text-[10px] font-bold text-red-600 inline-flex items-center gap-1"><Ban className="w-3 h-3" />Từ chối</span>}
                                            {ap.decision === 'pending' && <span className="text-[10px] font-bold text-amber-600 inline-flex items-center gap-1"><Clock className="w-3 h-3" />Chờ</span>}
                                        </div>
                                        {ap.decision === 'pending' && (
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button onClick={() => decide(r, ap, 'approved')} className="px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 rounded-md hover:bg-emerald-200">Duyệt</button>
                                                {onSign && (
                                                    <button onClick={() => { onSign({ doc_name: r.title }); decide(r, ap, 'approved', true); }} className="px-2 py-1 text-[10px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/30 rounded-md hover:bg-blue-200 inline-flex items-center gap-1" title="Duyệt + ký số"><PenTool className="w-3 h-3" />Ký</button>
                                                )}
                                                <button onClick={() => decide(r, ap, 'rejected')} className="px-2 py-1 text-[10px] font-bold text-red-700 bg-red-100 dark:bg-red-900/30 rounded-md hover:bg-red-200">Từ chối</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CDEReviewPanel;
