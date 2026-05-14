import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CheckCircle2, Plus, Calendar, User, FileText,
    Loader2, Save, X, Trash2, ClipboardCheck, AlertCircle
} from 'lucide-react';
import { AcceptanceService, AcceptanceRecord } from '../../../services/SettlementService';
import { formatDate } from '../../../utils/format';
import { DocumentAttachments } from '../../../components/common/DocumentAttachments';

// ========================================
// ACCEPTANCE SECTION
// Quản lý nghiệm thu — form + danh sách
// ========================================

interface AcceptanceSectionProps {
    contractId: string;
}

const QUALITY_LABELS: Record<string, { label: string; color: string }> = {
    passed: { label: 'Đạt yêu cầu', color: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' },
    conditional: { label: 'Đạt có điều kiện', color: 'bg-warning-100 dark:bg-warning-900/40 text-primary-600 dark:text-warning-400' },
    failed: { label: 'Không đạt', color: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' },
};

const TYPE_LABELS: Record<string, string> = {
    partial: 'Nghiệm thu từng phần',
    final: 'Nghiệm thu hoàn thành',
};

interface FormData {
    acceptanceType: 'partial' | 'final';
    acceptanceDate: string;
    description: string;
    qualityRating: 'passed' | 'conditional' | 'failed';
    inspector: string;
    notes: string;
}

export const AcceptanceSection: React.FC<AcceptanceSectionProps> = ({ contractId }) => {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<FormData>({
        acceptanceType: 'partial',
        acceptanceDate: new Date().toISOString().split('T')[0],
        description: '',
        qualityRating: 'passed',
        inspector: '',
        notes: '',
    });

    const { data: records = [], isLoading } = useQuery({
        queryKey: ['acceptance', contractId],
        queryFn: () => AcceptanceService.getByContractId(contractId),
        enabled: !!contractId,
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<AcceptanceRecord>) => AcceptanceService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['acceptance', contractId] });
            setShowForm(false);
            resetForm();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => AcceptanceService.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['acceptance', contractId] }),
    });

    const resetForm = () => {
        setForm({
            acceptanceType: 'partial',
            acceptanceDate: new Date().toISOString().split('T')[0],
            description: '',
            qualityRating: 'passed',
            inspector: '',
            notes: '',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            contractId,
            acceptanceType: form.acceptanceType,
            acceptanceDate: form.acceptanceDate,
            description: form.description,
            qualityRating: form.qualityRating,
            inspector: form.inspector,
            notes: form.notes,
        });
    };

    const hasFinalAcceptance = records.some(r => r.acceptanceType === 'final');
    const inputClass = "w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 dark:text-slate-200 transition-colors";
    const labelClass = "block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1";

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    Nghiệm thu
                    {records.length > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full">{records.length}</span>
                    )}
                </h4>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm biên bản
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>
                                <ClipboardCheck className="w-3 h-3 inline mr-1" />Loại nghiệm thu
                            </label>
                            <select
                                value={form.acceptanceType}
                                onChange={e => setForm(prev => ({ ...prev, acceptanceType: e.target.value as 'partial' | 'final' }))}
                                className={inputClass}
                            >
                                <option value="partial">Nghiệm thu từng phần</option>
                                <option value="final">Nghiệm thu hoàn thành</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>
                                <Calendar className="w-3 h-3 inline mr-1" />Ngày nghiệm thu
                            </label>
                            <input
                                type="date"
                                value={form.acceptanceDate}
                                onChange={e => setForm(prev => ({ ...prev, acceptanceDate: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>
                                <User className="w-3 h-3 inline mr-1" />Người nghiệm thu
                            </label>
                            <input
                                type="text"
                                value={form.inspector}
                                onChange={e => setForm(prev => ({ ...prev, inspector: e.target.value }))}
                                placeholder="Tên người nghiệm thu..."
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                <AlertCircle className="w-3 h-3 inline mr-1" />Đánh giá chất lượng
                            </label>
                            <select
                                value={form.qualityRating}
                                onChange={e => setForm(prev => ({ ...prev, qualityRating: e.target.value as 'passed' | 'conditional' | 'failed' }))}
                                className={inputClass}
                            >
                                <option value="passed">Đạt yêu cầu</option>
                                <option value="conditional">Đạt có điều kiện</option>
                                <option value="failed">Không đạt</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>
                            <FileText className="w-3 h-3 inline mr-1" />Mô tả nội dung
                        </label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Mô tả phạm vi nghiệm thu..."
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Ghi chú</label>
                        <textarea
                            value={form.notes}
                            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Ghi chú bổ sung..."
                            rows={2}
                            className={`${inputClass} resize-none`}
                        />
                    </div>

                    {createMutation.isError && (
                        <div className="text-sm text-red-500">Lỗi: {(createMutation.error as Error)?.message}</div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-green-200 dark:border-green-800">
                        <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors">
                            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Lưu biên bản
                        </button>
                    </div>
                </form>
            )}

            {/* Records list */}
            {isLoading ? (
                <div className="flex items-center justify-center p-4 text-gray-400 dark:text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
                </div>
            ) : records.length > 0 ? (
                <div className="space-y-2">
                    {records.map(record => {
                        const quality = QUALITY_LABELS[record.qualityRating] || QUALITY_LABELS.passed;
                        return (
                            <div
                                key={record.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${record.acceptanceType === 'final'
                                    ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20'
                                    : 'border-gray-200 dark:border-slate-700'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${record.acceptanceType === 'final'
                                        ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                                        : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                        }`}>
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">
                                            {TYPE_LABELS[record.acceptanceType]}
                                            {record.description && ` — ${record.description}`}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                            <span>{formatDate(record.acceptanceDate)}</span>
                                            {record.inspector && <span>• {record.inspector}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${quality.color}`}>
                                        {quality.label}
                                    </span>
                                    <button
                                        onClick={() => { if (confirm('Xóa biên bản nghiệm thu này?')) deleteMutation.mutate(record.id); }}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                {/* Đính kèm per record */}
                                <div className="mt-2 ml-12">
                                    <DocumentAttachments relatedType="acceptance" relatedId={record.id} compact />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : !showForm ? (
                <div className="text-center py-6">
                    <CheckCircle2 className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-slate-400">Chưa nghiệm thu</p>
                    <p className="text-xs text-gray-400 dark:text-slate-400">Hoàn thành hợp đồng để nghiệm thu</p>
                </div>
            ) : null}

            {/* Final acceptance indicator */}
            {hasFinalAcceptance && (
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="font-medium">Đã nghiệm thu hoàn thành</span> — có thể tiến hành quyết toán
                </div>
            )}
        </div>
    );
};

export default AcceptanceSection;
