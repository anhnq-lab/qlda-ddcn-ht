import React, { useState, useCallback, useMemo } from 'react';
import { Send, FileText, Plus, X, Users, Building2, ClipboardList, Loader2 } from 'lucide-react';
import { supabase, supabaseExt } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { CDEDocument, TransmittalPurpose } from '../types';

const PURPOSES: { value: TransmittalPurpose; label: string }[] = [
    { value: 'for_review', label: 'Để xem xét (For Review)' },
    { value: 'for_approval', label: 'Để phê duyệt (For Approval)' },
    { value: 'for_information', label: 'Để biết (For Information)' },
    { value: 'for_construction', label: 'Để thi công (For Construction)' },
    { value: 'as_built', label: 'Hoàn công (As-Built)' },
];

interface CDETransmittalFormProps {
    isOpen: boolean;
    projectId: string;
    docs: CDEDocument[];
    preSelectedDocIds?: number[];
    onClose: () => void;
    onSent: () => void;
}

const CDETransmittalForm: React.FC<CDETransmittalFormProps> = ({
    isOpen, projectId, docs, preSelectedDocIds = [], onClose, onSent,
}) => {
    const { currentUser } = useAuth();
    const [form, setForm] = useState({
        subject: '',
        to_org: '',
        to_person: '',
        purpose: 'for_review' as TransmittalPurpose,
        notes: '',
        cc: '',
    });
    const [selectedDocIds, setSelectedDocIds] = useState<number[]>(preSelectedDocIds);
    const [isPending, setIsPending] = useState(false);

    const transmittalNo = useMemo(() => {
        const now = new Date();
        return `TR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    }, []);

    const toggleDoc = useCallback((docId: number) => {
        setSelectedDocIds(prev => prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]);
    }, []);

    const handleSend = useCallback(async () => {
        if (!form.subject || !form.to_org || selectedDocIds.length === 0) return;
        setIsPending(true);
        const { error } = await supabaseExt.from('cde_transmittals').insert({
            project_id: projectId,
            transmittal_no: transmittalNo,
            subject: form.subject,
            from_org: currentUser?.Department || 'Ban QLDA',
            from_person: currentUser?.FullName || '',
            to_org: form.to_org,
            to_person: form.to_person,
            cc_list: form.cc ? form.cc.split(',').map(s => s.trim()) : [],
            doc_ids: selectedDocIds,
            purpose: form.purpose,
            notes: form.notes,
            status: 'sent',
            sent_at: new Date().toISOString(),
            created_by: currentUser?.EmployeeID || '',
        });
        setIsPending(false);
        if (!error) { onSent(); onClose(); }
    }, [form, selectedDocIds, projectId, transmittalNo, currentUser, onSent, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                            <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-gray-800 dark:text-slate-100">Phiếu chuyển giao tài liệu</h2>
                            <p className="text-[10px] font-mono text-gray-400">{transmittalNo}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* From/To */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Bên gửi</p>
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-600" />
                                <div>
                                    <p className="text-xs font-bold text-gray-800 dark:text-slate-100">{currentUser?.Department || 'Ban QLDA'}</p>
                                    <p className="text-[10px] text-gray-400">{currentUser?.FullName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Bên nhận *</label>
                            <input placeholder="Tên đơn vị" value={form.to_org} onChange={e => setForm(f => ({ ...f, to_org: e.target.value }))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-xs dark:text-slate-200" />
                            <input placeholder="Người nhận" value={form.to_person} onChange={e => setForm(f => ({ ...f, to_person: e.target.value }))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-xs dark:text-slate-200" />
                        </div>
                    </div>

                    {/* Subject + Purpose */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Tiêu đề *</label>
                        <input placeholder="Chuyển giao hồ sơ thiết kế..." value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium dark:text-slate-200" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Mục đích</label>
                            <select value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value as TransmittalPurpose }))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-xs dark:text-slate-200">
                                {PURPOSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">CC (phân cách dấu phẩy)</label>
                            <input placeholder="abc@email.com, xyz@email.com" value={form.cc} onChange={e => setForm(f => ({ ...f, cc: e.target.value }))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-xs dark:text-slate-200" />
                        </div>
                    </div>

                    {/* Document Selection */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Tài liệu đính kèm *</label>
                            <span className="text-[10px] font-bold text-blue-600">{selectedDocIds.length} đã chọn</span>
                        </div>
                        <div className="border border-gray-200 dark:border-slate-600 rounded-xl max-h-40 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700/50">
                            {docs.length === 0 ? (
                                <p className="p-4 text-xs text-gray-400 text-center">Không có tài liệu</p>
                            ) : docs.map(doc => (
                                <label key={doc.doc_id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50/40 dark:hover:bg-slate-700 cursor-pointer transition-all">
                                    <input type="checkbox" checked={selectedDocIds.includes(doc.doc_id)} onChange={() => toggleDoc(doc.doc_id)}
                                        className="w-3.5 h-3.5 rounded border-gray-300 dark:border-slate-600 text-blue-600" />
                                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-800 dark:text-slate-100 truncate">{doc.doc_name}</p>
                                        <p className="text-[10px] text-gray-400">{doc.version || 'P01.01'} • {doc.discipline || '—'}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Ghi chú</label>
                        <textarea rows={3} placeholder="Ghi chú bổ sung..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-xs resize-none dark:text-slate-200" />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50/80 dark:bg-slate-800">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 text-sm font-medium hover:text-gray-700">Hủy bỏ</button>
                    <button onClick={handleSend} disabled={isPending || !form.subject || !form.to_org || selectedDocIds.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-md">
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Gửi phiếu chuyển giao
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CDETransmittalForm;
