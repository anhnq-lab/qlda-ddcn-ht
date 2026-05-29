import React, { useState, useCallback } from 'react';
import { ClipboardList, Building2, User, Calendar, FileText, CheckCircle2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import type { CDETransmittal, TransmittalStatus } from '../types';

const PURPOSE_LABELS: Record<string, string> = {
    for_review: 'Để xem xét',
    for_approval: 'Để phê duyệt',
    for_information: 'Để biết',
    for_construction: 'Để thi công',
    as_built: 'Hoàn công',
};

const STATUS_CONFIG: Record<TransmittalStatus, { label: string; color: string }> = {
    draft: { label: 'Nháp', color: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300' },
    sent: { label: 'Đã gửi', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    acknowledged: { label: 'Đã nhận', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    closed: { label: 'Đóng', color: 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400' },
};

interface CDETransmittalsListProps {
    projectId: string;
    onNewTransmittal: () => void;
}

const CDETransmittalsList: React.FC<CDETransmittalsListProps> = ({ projectId, onNewTransmittal }) => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [ackPending, setAckPending] = useState<string | null>(null);

    const { data: transmittals = [], isLoading } = useQuery({
        queryKey: ['cde-transmittals', projectId],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('cde_transmittals')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []) as CDETransmittal[];
        },
        enabled: !!projectId,
    });

    const handleAcknowledge = useCallback(async (t: CDETransmittal) => {
        setAckPending(t.id);
        try {
            await (supabase as any)
                .from('cde_transmittals')
                .update({ status: 'acknowledged' })
                .eq('id', t.id);
            queryClient.invalidateQueries({ queryKey: ['cde-transmittals', projectId] });
        } finally {
            setAckPending(null);
        }
    }, [projectId, queryClient]);

    if (isLoading) return (
        <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
    );

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-black text-txt-primary">Phiếu chuyển giao tài liệu</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{transmittals.length} phiếu • {transmittals.filter(t => t.status === 'sent').length} chờ xác nhận</p>
                </div>
                <button
                    onClick={onNewTransmittal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-primary-200/40 dark:shadow-none"
                >
                    <ClipboardList className="w-4 h-4" />
                    Tạo phiếu mới
                </button>
            </div>

            {transmittals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-txt-placeholder">
                    <ClipboardList className="w-14 h-14 mb-4 opacity-30" />
                    <p className="font-semibold">Chưa có phiếu chuyển giao</p>
                    <p className="text-sm mt-1">Tạo phiếu mới để chuyển giao tài liệu cho các bên liên quan</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {transmittals.map(t => {
                        const isExpanded = expandedId === t.id;
                        const statusCfg = STATUS_CONFIG[t.status];
                        return (
                            <div key={t.id} className="bg-bg-surface rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="px-5 py-4 flex items-center gap-4">
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors shrink-0"
                                    >
                                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-[10px] text-txt-placeholder shrink-0 bg-bg-muted px-1.5 py-0.5 rounded">
                                                {t.transmittal_no}
                                            </span>
                                            <h3 className="text-sm font-bold text-txt-primary truncate">{t.subject}</h3>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-[11px] text-txt-placeholder flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Building2 className="w-3 h-3" />
                                                {t.from_org} → {t.to_org}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {t.sent_at ? new Date(t.sent_at).toLocaleDateString('vi-VN') : '—'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-3 h-3" />
                                                {t.doc_ids?.length || 0} tài liệu
                                            </span>
                                            <span className="italic">{PURPOSE_LABELS[t.purpose] || t.purpose}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${statusCfg.color}`}>
                                            {statusCfg.label}
                                        </span>
                                        {t.status === 'sent' && (
                                            <button
                                                onClick={() => handleAcknowledge(t)}
                                                disabled={ackPending === t.id}
                                                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all"
                                            >
                                                {ackPending === t.id
                                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                                    : <CheckCircle2 className="w-3 h-3" />
                                                }
                                                Xác nhận nhận
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-14 pb-4 pt-2 border-t border-border-subtle bg-gray-50/50 dark:bg-slate-800/30">
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Bên gửi</p>
                                                <p className="font-semibold text-txt-secondary">{t.from_org}</p>
                                                {t.from_person && (
                                                    <p className="text-txt-muted flex items-center gap-1 mt-0.5">
                                                        <User className="w-3 h-3" />{t.from_person}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Bên nhận</p>
                                                <p className="font-semibold text-txt-secondary">{t.to_org}</p>
                                                {t.to_person && (
                                                    <p className="text-txt-muted flex items-center gap-1 mt-0.5">
                                                        <User className="w-3 h-3" />{t.to_person}
                                                    </p>
                                                )}
                                            </div>
                                            {t.cc_list?.length > 0 && (
                                                <div className="col-span-2">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">CC</p>
                                                    <p className="text-txt-muted">{t.cc_list.join(', ')}</p>
                                                </div>
                                            )}
                                            {t.notes && (
                                                <div className="col-span-2">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Ghi chú</p>
                                                    <p className="text-txt-muted italic">{t.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CDETransmittalsList;
