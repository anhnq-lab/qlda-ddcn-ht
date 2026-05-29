import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Calculator, Shield, Calendar, FileText, Hash,
    Loader2, Save, Edit, DollarSign, Clock
} from 'lucide-react';
import { SettlementService, SettlementRecord } from '../../../services/SettlementService';
import { formatCurrency, formatDate } from '../../../utils/format';
import { DocumentAttachments } from '../../../components/common/DocumentAttachments';

// ========================================
// SETTLEMENT SECTION
// Quyết toán + Bảo hành
// ========================================

interface SettlementSectionProps {
    contractId: string;
    contractValue: number;
    totalPaid: number;
    packageField?: string; // 'Construction' | 'Consultancy' etc.
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: 'Chờ quyết toán', color: 'bg-warning-100 dark:bg-warning-900/40 text-primary-600 dark:text-warning-400' },
    approved: { label: 'Đã duyệt', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
    completed: { label: 'Hoàn thành', color: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' },
};

const WARRANTY_STATUS: Record<string, { label: string; color: string }> = {
    pending: { label: 'Chưa bảo hành', color: 'bg-bg-muted text-txt-muted' },
    active: { label: 'Đang bảo hành', color: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' },
    expired: { label: 'Hết hạn BH', color: 'bg-warning-100 dark:bg-warning-900/40 text-warning-600 dark:text-warning-400' },
    released: { label: 'Đã hoàn trả', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
};

interface FormData {
    settlementValue: string;
    settlementDate: string;
    decisionNumber: string;
    retentionAmount: string;
    warrantyMonths: string;
    warrantyStartDate: string;
    warrantyStatus: 'pending' | 'active' | 'expired' | 'released';
    status: 'pending' | 'approved' | 'completed';
    notes: string;
}

export const SettlementSection: React.FC<SettlementSectionProps> = ({
    contractId,
    contractValue,
    totalPaid,
    packageField,
}) => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const defaultWarrantyMonths = packageField === 'Construction' ? 24 : 12;
    const defaultRetention = contractValue * 0.05;

    const { data: settlement, isLoading } = useQuery({
        queryKey: ['settlement', contractId],
        queryFn: () => SettlementService.getByContractId(contractId),
        enabled: !!contractId,
    });

    const [form, setForm] = useState<FormData>({
        settlementValue: String(contractValue),
        settlementDate: new Date().toISOString().split('T')[0],
        decisionNumber: '',
        retentionAmount: String(defaultRetention),
        warrantyMonths: String(defaultWarrantyMonths),
        warrantyStartDate: '',
        warrantyStatus: 'pending',
        status: 'pending',
        notes: '',
    });

    // Sync form with loaded data
    useEffect(() => {
        if (settlement) {
            setForm({
                settlementValue: String(settlement.settlementValue),
                settlementDate: settlement.settlementDate || '',
                decisionNumber: settlement.decisionNumber || '',
                retentionAmount: String(settlement.retentionAmount),
                warrantyMonths: String(settlement.warrantyMonths),
                warrantyStartDate: settlement.warrantyStartDate || '',
                warrantyStatus: settlement.warrantyStatus || 'pending',
                status: settlement.status || 'pending',
                notes: settlement.notes || '',
            });
        }
    }, [settlement]);

    const warrantyEndDate = useMemo(() => {
        if (!form.warrantyStartDate || !form.warrantyMonths) return '';
        const start = new Date(form.warrantyStartDate);
        start.setMonth(start.getMonth() + Number(form.warrantyMonths));
        return start.toISOString().split('T')[0];
    }, [form.warrantyStartDate, form.warrantyMonths]);

    const upsertMutation = useMutation({
        mutationFn: (data: Partial<SettlementRecord>) => SettlementService.upsert(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settlement', contractId] });
            setIsEditing(false);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        upsertMutation.mutate({
            contractId,
            settlementValue: Number(form.settlementValue),
            settlementDate: form.settlementDate,
            decisionNumber: form.decisionNumber,
            retentionAmount: Number(form.retentionAmount),
            warrantyMonths: Number(form.warrantyMonths),
            warrantyStartDate: form.warrantyStartDate,
            warrantyEndDate,
            warrantyStatus: form.warrantyStatus,
            status: form.status,
            notes: form.notes,
        });
    };

    const inputClass = "w-full px-3 py-2 text-sm bg-bg-surface border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-txt-primary transition-colors";
    const labelClass = "block text-xs font-medium text-txt-muted mb-1";

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-4 text-txt-placeholder">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
            </div>
        );
    }

    // DISPLAY MODE
    if (settlement && !isEditing) {
        const stStatus = STATUS_LABELS[settlement.status] || STATUS_LABELS.pending;
        const wStatus = WARRANTY_STATUS[settlement.warrantyStatus] || WARRANTY_STATUS.pending;

        return (
            <div className="space-y-4">
                {/* Quyết toán */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-txt-primary flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            Quyết toán
                        </h4>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                            <Edit className="w-3.5 h-3.5" /> Sửa
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between p-2 bg-bg-subtle rounded-lg">
                            <span className="text-txt-muted">Giá trị quyết toán</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(settlement.settlementValue)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-bg-subtle rounded-lg">
                            <span className="text-txt-muted">Số QĐ</span>
                            <span className="font-medium text-txt-primary">{settlement.decisionNumber || '-'}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-bg-subtle rounded-lg">
                            <span className="text-txt-muted">Ngày quyết toán</span>
                            <span className="font-medium text-txt-primary">{settlement.settlementDate ? formatDate(settlement.settlementDate) : '-'}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-bg-subtle rounded-lg">
                            <span className="text-txt-muted">Trạng thái</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${stStatus.color}`}>{stStatus.label}</span>
                        </div>
                    </div>
                </div>

                {/* Bảo hành */}
                <div className="space-y-3 pt-3 border-t border-border">
                    <h4 className="font-semibold text-txt-primary flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        Bảo hành
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between p-2 bg-bg-subtle rounded-lg">
                            <span className="text-txt-muted">Thời gian BH</span>
                            <span className="font-medium text-txt-primary">{settlement.warrantyMonths} tháng</span>
                        </div>
                        <div className="flex justify-between p-2 bg-bg-subtle rounded-lg">
                            <span className="text-txt-muted">Giữ lại BH</span>
                            <span className="font-bold text-warning-600 dark:text-warning-400">{formatCurrency(settlement.retentionAmount)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-bg-subtle rounded-lg">
                            <span className="text-txt-muted">Bắt đầu</span>
                            <span className="font-medium">{settlement.warrantyStartDate ? formatDate(settlement.warrantyStartDate) : '-'}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-bg-subtle rounded-lg">
                            <span className="text-txt-muted">Kết thúc</span>
                            <span className="font-medium">{settlement.warrantyEndDate ? formatDate(settlement.warrantyEndDate) : '-'}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-bg-subtle rounded-lg col-span-2">
                            <span className="text-txt-muted">Trạng thái BH</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${wStatus.color}`}>{wStatus.label}</span>
                        </div>
                    </div>
                </div>

                {settlement.notes && (
                    <div className="text-sm text-txt-muted bg-bg-subtle rounded-lg p-3">
                        <span className="font-medium text-txt-muted">Ghi chú:</span> {settlement.notes}
                    </div>
                )}

                {/* Tài liệu quyết toán */}
                <div className="pt-3 border-t border-border">
                    <DocumentAttachments relatedType="settlement" relatedId={settlement.id} />
                </div>
            </div>
        );
    }

    // FORM MODE
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quyết toán header */}
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-txt-primary flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    {settlement ? 'Sửa quyết toán' : 'Nhập quyết toán'}
                </h4>
                {settlement && (
                    <button type="button" onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-bg-muted rounded-lg transition-colors">
                        <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Row 1: Settlement value + date */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={labelClass}>
                        <DollarSign className="w-3 h-3 inline mr-1" />Giá trị quyết toán (VND)
                    </label>
                    <input type="number" value={form.settlementValue} onChange={e => setForm(prev => ({ ...prev, settlementValue: e.target.value }))} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>
                        <Calendar className="w-3 h-3 inline mr-1" />Ngày quyết toán
                    </label>
                    <input type="date" value={form.settlementDate} onChange={e => setForm(prev => ({ ...prev, settlementDate: e.target.value }))} className={inputClass} />
                </div>
            </div>

            {/* Row 2: Decision number + status */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={labelClass}>
                        <Hash className="w-3 h-3 inline mr-1" />Số quyết định
                    </label>
                    <input type="text" value={form.decisionNumber} onChange={e => setForm(prev => ({ ...prev, decisionNumber: e.target.value }))} placeholder="Số QĐ quyết toán..." className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Trạng thái</label>
                    <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))} className={inputClass}>
                        <option value="pending">Chờ quyết toán</option>
                        <option value="approved">Đã duyệt</option>
                        <option value="completed">Hoàn thành</option>
                    </select>
                </div>
            </div>

            {/* Bảo hành section */}
            <div className="pt-3 border-t border-border">
                <h4 className="font-semibold text-txt-primary flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Bảo hành
                </h4>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className={labelClass}>
                            <Clock className="w-3 h-3 inline mr-1" />Thời gian BH (tháng)
                        </label>
                        <input type="number" min="0" value={form.warrantyMonths} onChange={e => setForm(prev => ({ ...prev, warrantyMonths: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>
                            <DollarSign className="w-3 h-3 inline mr-1" />Giá trị giữ lại (VND)
                        </label>
                        <input type="number" value={form.retentionAmount} onChange={e => setForm(prev => ({ ...prev, retentionAmount: e.target.value }))} className={inputClass} />
                        <p className="text-xs text-gray-400 mt-0.5">Mặc định 5% = {formatCurrency(defaultRetention)}</p>
                    </div>
                    <div>
                        <label className={labelClass}>Trạng thái BH</label>
                        <select value={form.warrantyStatus} onChange={e => setForm(prev => ({ ...prev, warrantyStatus: e.target.value as any }))} className={inputClass}>
                            <option value="pending">Chưa bảo hành</option>
                            <option value="active">Đang bảo hành</option>
                            <option value="expired">Hết hạn</option>
                            <option value="released">Đã hoàn trả</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                        <label className={labelClass}>Ngày bắt đầu BH</label>
                        <input type="date" value={form.warrantyStartDate} onChange={e => setForm(prev => ({ ...prev, warrantyStartDate: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Ngày kết thúc BH (tự tính)</label>
                        <input type="date" value={warrantyEndDate} readOnly className={`${inputClass} bg-bg-subtle cursor-not-allowed`} />
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className={labelClass}>
                    <FileText className="w-3 h-3 inline mr-1" />Ghi chú
                </label>
                <textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Ghi chú quyết toán..." rows={2} className={`${inputClass} resize-none`} />
            </div>

            {/* Tài liệu quyết toán */}
            {settlement && (
                <div className="pt-3 border-t border-border">
                    <DocumentAttachments relatedType="settlement" relatedId={settlement.id} />
                </div>
            )}

            {upsertMutation.isError && (
                <div className="text-sm text-red-500">Lỗi: {(upsertMutation.error as Error)?.message}</div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
                {settlement && (
                    <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-txt-muted hover:bg-bg-muted rounded-lg transition-colors">
                        Hủy
                    </button>
                )}
                <button type="submit" disabled={upsertMutation.isPending} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white rounded-lg disabled:opacity-50 transition-colors">
                    {upsertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {settlement ? 'Cập nhật' : 'Lưu quyết toán'}
                </button>
            </div>
        </form>
    );
};

export default SettlementSection;
