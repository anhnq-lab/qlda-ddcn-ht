import React, { useMemo } from 'react';
import { FileText, Clock, CheckCircle2, XCircle, ArrowRight, Upload, TrendingUp, Building2 } from 'lucide-react';
import type { CDEDocument } from '../types';
import { getStatusLabel, getStatusColor, CONTAINER_COLORS } from '../constants';
import { StatCard } from '../../../components/ui';

interface CDEContractorDashboardProps {
    docs: CDEDocument[];
    contractorName: string;
    onViewDoc: (doc: CDEDocument) => void;
    onSubmitNew: () => void;
}

const CDEContractorDashboard: React.FC<CDEContractorDashboardProps> = ({
    docs, contractorName, onViewDoc, onSubmitNew,
}) => {
    const stats = useMemo(() => ({
        total: docs.length,
        pending: docs.filter(d => ['S0', 'S1', 'S2', 'S3'].includes(d.cde_status)).length,
        approved: docs.filter(d => ['A1', 'A2', 'A3'].includes(d.cde_status)).length,
        rejected: docs.filter(d => d.cde_status === 'S0' && d.notes?.includes('Từ chối')).length,
    }), [docs]);

    const recentDocs = useMemo(() =>
        [...docs].sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()).slice(0, 8),
        [docs]
    );

    const kpiCards = [
        { label: 'Tổng hồ sơ nộp', value: stats.total, icon: FileText, color: 'slate' as const },
        { label: 'Đang chờ duyệt', value: stats.pending, icon: Clock, color: 'amber' as const },
        { label: 'Đã phê duyệt', value: stats.approved, icon: CheckCircle2, color: 'emerald' as const },
        { label: 'Bị từ chối', value: stats.rejected, icon: XCircle, color: 'rose' as const },
    ];

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-3 duration-500">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl p-4 text-white shadow-sm bg-gradient-to-br from-primary-500 to-primary-600">
                <div className="absolute -right-10 -top-10 w-40 h-40 opacity-10">
                    <Building2 className="w-full h-full" />
                </div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-white/80">Xin chào,</p>
                        <h2 className="text-2xl font-black tracking-tight">{contractorName}</h2>
                        <p className="text-sm text-white/70 mt-1">Cổng nộp hồ sơ dự án — ISO 19650 CDE</p>
                    </div>
                    <button
                        onClick={onSubmitNew}
                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-5 py-3 rounded-xl text-sm font-bold transition-all border border-white/20 hover:border-white/40 shadow-sm"
                    >
                        <Upload className="w-4 h-4" /> Nộp hồ sơ mới
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
                {kpiCards.map((card, idx) => (
                    <StatCard
                        key={idx}
                        label={card.label}
                        value={card.value}
                        icon={<card.icon className="w-5 h-5 flex-shrink-0" />}
                        color={card.color}
                    />
                ))}
            </div>

            {/* Recent Submissions */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-wider">Hồ sơ gần đây</h3>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">{docs.length} hồ sơ</span>
                </div>

                {recentDocs.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">Chưa có hồ sơ nào</p>
                        <button onClick={onSubmitNew} className="mt-3 text-blue-600 text-sm font-bold hover:underline">Nộp hồ sơ đầu tiên →</button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                        {recentDocs.map(doc => {
                            const statusColor = getStatusColor(doc.cde_status || 'S0');
                            return (
                                <div
                                    key={doc.doc_id}
                                    onClick={() => onViewDoc(doc)}
                                    className="px-5 py-3.5 flex items-center gap-4 hover:bg-blue-50/40 dark:hover:bg-slate-700 cursor-pointer transition-all group"
                                >
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate">{doc.doc_name}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5">
                                            {doc.discipline || '—'} • {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString('vi-VN') : '—'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2.5 shrink-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
                                            <span className="text-[11px] font-semibold text-gray-600 dark:text-slate-300">{getStatusLabel(doc.cde_status || 'S0')}</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CDEContractorDashboard;
