import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    UserCheck, Building2, FileText, DollarSign, Save, Loader2, Search,
    CheckCircle2, AlertCircle, X, Calendar, Hash
} from 'lucide-react';
import { useContractors } from '../../../hooks/useContractors';
import { supabase } from '../../../lib/supabase';
import ProjectService from '../../../services/ProjectService';
import { formatCurrency } from '../../../utils/format';
import { DocumentAttachments } from '../../../components/common/DocumentAttachments';
import { Contractor } from '../../../types';

// ========================================
// Tab 2 — Chỉ định thầu
// Luật Đấu thầu 2023: chỉ có 1 nhà thầu, không cạnh tranh
// Workflow: HSYC → Gửi HSYC → Nhận HSĐX → Đánh giá → QĐ chỉ định
// ========================================

interface DirectAppointmentSectionProps {
    packageId: string;
    packagePrice?: number;
}

interface AppointmentData {
    contractor_id: string;
    contractor_name: string;
    proposed_price: number | null;
    negotiated_price: number | null;
    appointment_reason: string;
    decision_number: string;
    decision_date: string;
    decision_agency: string;
    legal_basis: string;
    hsyc_date: string;
    hsdx_date: string;
    evaluation_result: 'pending' | 'qualified' | 'not_qualified';
    notes: string;
}

const LEGAL_BASIS_OPTIONS = [
    'Khoản 1a Điều 23 — Gói thầu cấp bách',
    'Khoản 1b Điều 23 — Bảo vệ tính mạng, tài sản',
    'Khoản 1c Điều 23 — Phòng chống dịch bệnh',
    'Khoản 1d Điều 23 — Bảo mật nhà nước',
    'Khoản 1e Điều 23 — Tương thích công nghệ',
    'Khoản 1g Điều 23 — Nghiên cứu, sở hữu trí tuệ',
    'Khoản 1h Điều 23 — Tác giả kiến trúc trúng tuyển',
    'Khoản 1i Điều 23 — Di dời hạ tầng, rà phá bom mìn',
    'Khoản 1k Điều 23 — Duy nhất 1 nhà thầu',
    'Khoản 1l Điều 23 — Dự án quan trọng quốc gia',
    'Khoản 1m Điều 23 — Hạn mức chỉ định thầu (TV ≤800tr / XL, PTV, HH, HH ≤2 tỷ — NĐ 214/2025)',
];

const INITIAL_DATA: AppointmentData = {
    contractor_id: '',
    contractor_name: '',
    proposed_price: null,
    negotiated_price: null,
    appointment_reason: '',
    decision_number: '',
    decision_date: '',
    decision_agency: '',
    legal_basis: '',
    hsyc_date: '',
    hsdx_date: '',
    evaluation_result: 'pending',
    notes: '',
};

export const DirectAppointmentSection: React.FC<DirectAppointmentSectionProps> = ({ packageId, packagePrice }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<AppointmentData>(INITIAL_DATA);
    const [isEditing, setIsEditing] = useState(false);
    const [contractorSearch, setContractorSearch] = useState('');
    const [showContractorList, setShowContractorList] = useState(false);

    // Fetch contractors using the existing hook
    const { contractors, isLoading: loadingContractors } = useContractors();

    // Fetch existing bidder (should be max 1 for CĐT)
    const { data: bidders = [], isLoading } = useQuery({
        queryKey: ['package-bidders', packageId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('package_bidders')
                .select('*')
                .eq('package_id', packageId);
            if (error) throw error;
            return data || [];
        },
    });

    // Load existing bidder data
    useEffect(() => {
        if (bidders.length > 0) {
            const b = bidders[0];
            const contractor = contractors?.find(c => c.ContractorID === b.contractor_id);
            setFormData({
                contractor_id: b.contractor_id || '',
                contractor_name: contractor?.FullName || '',
                proposed_price: b.bid_price || null,
                negotiated_price: b.negotiated_price || null,
                appointment_reason: b.appointment_reason || b.notes || '',
                decision_number: b.decision_number || '',
                decision_date: b.decision_date || '',
                decision_agency: b.decision_agency || '',
                legal_basis: b.legal_basis || '',
                hsyc_date: b.hsyc_date || '',
                hsdx_date: b.hsdx_date || '',
                evaluation_result: b.status === 'winner' ? 'qualified' : b.status === 'invalid' ? 'not_qualified' : 'pending',
                notes: b.notes || '',
            });
        }
    }, [bidders]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async (data: AppointmentData) => {
            const payload = {
                package_id: packageId,
                contractor_id: data.contractor_id,
                bid_price: data.proposed_price,
                negotiated_price: data.negotiated_price,
                appointment_reason: data.appointment_reason,
                decision_number: data.decision_number,
                decision_date: data.decision_date || null,
                decision_agency: data.decision_agency,
                legal_basis: data.legal_basis,
                hsyc_date: data.hsyc_date || null,
                hsdx_date: data.hsdx_date || null,
                status: data.evaluation_result === 'qualified' ? 'winner' :
                    data.evaluation_result === 'not_qualified' ? 'invalid' : 'submitted',
                notes: data.notes || data.appointment_reason,
            };

            if (bidders.length > 0) {
                const { error } = await supabase
                    .from('package_bidders')
                    .update(payload)
                    .eq('id', bidders[0].id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('package_bidders')
                    .insert(payload);
                if (error) throw error;
            }

            // Sync with Winning Contractor if marked as winner
            if (payload.status === 'winner') {
                // 1. Update package via service (uses mapper correctly)
                await ProjectService.updatePackage(packageId, {
                    WinningContractorID: data.contractor_id,
                    WinningPrice: data.proposed_price || 0,
                });
            } else {
                // If unset from winner, clear it
                await ProjectService.updatePackage(packageId, {
                    WinningContractorID: null as any,
                    WinningPrice: undefined,
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['package-bidders', packageId] });
            queryClient.invalidateQueries({ queryKey: ['package-winning-contractors', packageId] });
            queryClient.invalidateQueries({ queryKey: ['project-packages'] });
            setIsEditing(false);
        },
    });

    // Contractor search filter
    const filteredContractors = contractors.filter((c: Contractor) => {
        if (!contractorSearch) return true;
        const search = contractorSearch.toLowerCase();
        return (c.FullName || '').toLowerCase().includes(search) ||
            (c.TaxCode || '').includes(search);
    }).slice(0, 20);

    const selectContractor = (contractor: Contractor) => {
        setFormData(prev => ({
            ...prev,
            contractor_id: contractor.ContractorID,
            contractor_name: contractor.FullName,
        }));
        setShowContractorList(false);
        setContractorSearch('');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-4 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Đang tải...
            </div>
        );
    }

    const hasExistingData = bidders.length > 0;
    const showForm = isEditing || !hasExistingData;

    return (
        <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
                <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-primary-800 dark:text-primary-300">
                        Gói thầu chỉ định thầu
                    </p>
                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                        Theo Điều 23, Luật Đấu thầu 2023 — Chỉ 1 nhà thầu được chỉ định,
                        không qua đấu thầu cạnh tranh. Phát hành HSYC thay vì HSMT.
                    </p>
                </div>
            </div>

            {showForm ? (
                <div className="space-y-4">
                    {/* Step 1: Chọn nhà thầu */}
                    <div className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-blue-500" />
                            Nhà thầu được chỉ định
                        </h4>

                        {formData.contractor_id ? (
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                        {formData.contractor_name || formData.contractor_id}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, contractor_id: '', contractor_name: '' }))}
                                    className="p-1 text-blue-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="flex items-center gap-2">
                                    <Search className="w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={contractorSearch}
                                        onChange={(e) => {
                                            setContractorSearch(e.target.value);
                                            setShowContractorList(true);
                                        }}
                                        onFocus={() => setShowContractorList(true)}
                                        placeholder="Tìm nhà thầu (tên hoặc MST)..."
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm 
                                                   bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200
                                                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                {showContractorList && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm max-h-72 overflow-y-auto">
                                        {filteredContractors.length > 0 ? filteredContractors.map((c: Contractor) => (
                                            <button
                                                key={c.ContractorID}
                                                onClick={() => selectContractor(c)}
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border-b border-gray-100 dark:border-slate-600 last:border-b-0"
                                            >
                                                <div className="font-medium text-gray-800 dark:text-slate-200">{c.FullName}</div>
                                                {c.TaxCode && <div className="text-xs text-gray-500">MST: {c.TaxCode}</div>}
                                            </button>
                                        )) : (
                                            <div className="px-3 py-2 text-sm text-gray-400">Không tìm thấy nhà thầu</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Step 2: Giá và thương thảo */}
                    <div className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            Giá đề xuất & thương thảo
                        </h4>
                        <div className="space-y-3">
                            {/* Giá gói thầu - reference */}
                            {packagePrice != null && packagePrice > 0 && (
                                <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Giá gói thầu (được duyệt)</span>
                                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(packagePrice)}</span>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Giá đề xuất (VNĐ)</label>
                                    <input
                                        type="number"
                                        value={formData.proposed_price || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, proposed_price: parseFloat(e.target.value) || null }))}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm
                                               bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200"
                                    />
                                    {formData.proposed_price && (
                                        <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(formData.proposed_price)}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Giá sau thương thảo (VNĐ)</label>
                                    <input
                                        type="number"
                                        value={formData.negotiated_price || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, negotiated_price: parseFloat(e.target.value) || null }))}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm
                                               bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200"
                                    />
                                    {formData.negotiated_price && (
                                        <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(formData.negotiated_price)}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Căn cứ pháp lý */}
                    <div className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-500" />
                            Căn cứ pháp lý & Quyết định
                        </h4>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Căn cứ chỉ định thầu</label>
                                <select
                                    value={formData.legal_basis}
                                    onChange={(e) => setFormData(prev => ({ ...prev, legal_basis: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm
                                               bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200"
                                >
                                    <option value="">-- Chọn căn cứ pháp lý --</option>
                                    {LEGAL_BASIS_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Số QĐ chỉ định thầu</label>
                                    <input
                                        type="text"
                                        value={formData.decision_number}
                                        onChange={(e) => setFormData(prev => ({ ...prev, decision_number: e.target.value }))}
                                        placeholder="VD: 123/QĐ-BQL"
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm
                                                   bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Ngày QĐ</label>
                                    <input
                                        type="date"
                                        value={formData.decision_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, decision_date: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm
                                                   bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Lý do chỉ định thầu</label>
                                <textarea
                                    value={formData.appointment_reason}
                                    onChange={(e) => setFormData(prev => ({ ...prev, appointment_reason: e.target.value }))}
                                    placeholder="Mô tả lý do chỉ định thầu..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm
                                               bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 4: Hồ sơ & Đánh giá */}
                    <div className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-warning-500" />
                            Hồ sơ yêu cầu & Đánh giá
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Ngày phát hành HSYC</label>
                                <input
                                    type="date"
                                    value={formData.hsyc_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, hsyc_date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm
                                               bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Ngày nhận HSĐX</label>
                                <input
                                    type="date"
                                    value={formData.hsdx_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, hsdx_date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm
                                               bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Kết quả đánh giá năng lực</label>
                                <select
                                    value={formData.evaluation_result}
                                    onChange={(e) => setFormData(prev => ({ ...prev, evaluation_result: e.target.value as any }))}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm
                                               bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200"
                                >
                                    <option value="pending">⏳ Chưa đánh giá</option>
                                    <option value="qualified">✅ Đạt yêu cầu — Đề nghị chỉ định</option>
                                    <option value="not_qualified">❌ Không đạt yêu cầu</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                        <button
                            onClick={() => saveMutation.mutate(formData)}
                            disabled={!formData.contractor_id || saveMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg
                                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Lưu thông tin
                        </button>
                        {hasExistingData && (
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Hủy
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                /* Display mode */
                <div className="space-y-3">
                    {/* Contractor info */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                        {formData.contractor_name || 'Nhà thầu được chỉ định'}
                                    </p>
                                    {formData.proposed_price && (
                                        <p className="text-xs text-blue-600 dark:text-blue-400">
                                            Giá đề xuất: {formatCurrency(formData.proposed_price)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {formData.evaluation_result === 'qualified' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                        <CheckCircle2 className="w-3 h-3" /> Đạt yêu cầu
                                    </span>
                                )}
                                {formData.evaluation_result === 'not_qualified' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                        <X className="w-3 h-3" /> Không đạt
                                    </span>
                                )}
                                {formData.evaluation_result === 'pending' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                        ⏳ Đang đánh giá
                                    </span>
                                )}
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                    <FileText className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-1 text-sm">
                        {formData.legal_basis && (
                            <div className="col-span-2">
                                <span className="text-gray-500 dark:text-slate-400">Căn cứ pháp lý:</span>
                                <span className="ml-2 text-gray-800 dark:text-slate-200 font-medium">{formData.legal_basis}</span>
                            </div>
                        )}
                        {formData.decision_number && (
                            <div>
                                <span className="text-gray-500 dark:text-slate-400">Số QĐ:</span>
                                <span className="ml-2 text-gray-800 dark:text-slate-200">{formData.decision_number}</span>
                            </div>
                        )}
                        {formData.decision_date && (
                            <div>
                                <span className="text-gray-500 dark:text-slate-400">Ngày QĐ:</span>
                                <span className="ml-2 text-gray-800 dark:text-slate-200">{formData.decision_date}</span>
                            </div>
                        )}
                        {formData.negotiated_price && (
                            <div>
                                <span className="text-gray-500 dark:text-slate-400">Giá thương thảo:</span>
                                <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">{formatCurrency(formData.negotiated_price)}</span>
                            </div>
                        )}
                        {formData.appointment_reason && (
                            <div className="col-span-2">
                                <span className="text-gray-500 dark:text-slate-400">Lý do:</span>
                                <span className="ml-2 text-gray-800 dark:text-slate-200">{formData.appointment_reason}</span>
                            </div>
                        )}
                        {formData.hsyc_date && (
                            <div>
                                <span className="text-gray-500 dark:text-slate-400">Ngày HSYC:</span>
                                <span className="ml-2 text-gray-800 dark:text-slate-200">{formData.hsyc_date}</span>
                            </div>
                        )}
                        {formData.hsdx_date && (
                            <div>
                                <span className="text-gray-500 dark:text-slate-400">Ngày HSĐX:</span>
                                <span className="ml-2 text-gray-800 dark:text-slate-200">{formData.hsdx_date}</span>
                            </div>
                        )}
                    </div>

                    {/* Documents */}
                    <DocumentAttachments
                        relatedType={"bidding_package" as any}
                        relatedId={packageId}
                    />
                </div>
            )}
        </div>
    );
};
