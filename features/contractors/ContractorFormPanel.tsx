import React, { useState } from 'react';
import { Contractor, ContractorType, CONTRACTOR_TYPE_LABELS } from '../../types';
import { ContractorService } from '../../services/ContractorService';
import { useToast } from '../../components/ui/Toast';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Hash, Calendar, User, MapPin, Phone, Loader2, X, Check, Save } from 'lucide-react';

interface ContractorFormPanelProps {
    contractor?: Contractor;
    onSuccess?: () => void;
}

export const ContractorFormPanel: React.FC<ContractorFormPanelProps> = ({ contractor, onSuccess }) => {
    const isEditing = !!contractor;
    const { showToast } = useToast();
    const { closePanel } = useSlidePanel();
    const queryClient = useQueryClient();

    const [saving, setSaving] = useState(false);
    const [currentContractor, setCurrentContractor] = useState<Partial<Contractor>>(
        contractor || {
            FullName: '',
            TaxCode: '',
            CapCertCode: '',
            IsForeign: false,
            ContractorType: 'Construction',
            Address: '',
            ContactInfo: '',
            Representative: '',
            EstablishedYear: undefined,
            Email: '',
            Website: ''
        }
    );
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Validate MST format: 10 or 13 digits
    const validateTaxCode = (code: string): string | null => {
        if (!code) return null; // optional
        const cleaned = code.replace(/[\s-]/g, '');
        if (!/^\d{10}(\d{3})?$/.test(cleaned)) {
            return 'MST phải có 10 hoặc 13 chữ số';
        }
        return null;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};

        if (!currentContractor?.FullName?.trim()) {
            errors.FullName = 'Vui lòng nhập tên nhà thầu';
        }
        const taxErr = validateTaxCode(currentContractor.TaxCode || '');
        if (taxErr) errors.TaxCode = taxErr;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});

        try {
            setSaving(true);
            if (isEditing && currentContractor.ContractorID) {
                await ContractorService.update(currentContractor.ContractorID, currentContractor);
                showToast('Đã cập nhật thông tin nhà thầu', 'success');
            } else {
                // DB auto-generates ContractorID
                await ContractorService.create(currentContractor);
                showToast('Đã thêm nhà thầu mới thành công', 'success');
            }
            if (onSuccess) onSuccess();
            closePanel(); // Close the slide panel on success
        } catch (err: any) {
            if (err.message?.includes('idx_contractors_tax_code_unique')) {
                setFormErrors({ TaxCode: 'Mã số thuế đã tồn tại trong hệ thống' });
            } else {
                showToast(`Lỗi lưu: ${err.message}`, 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            {/* ═══ HEADER ═══ */}
            <div className="px-6 py-5 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/20">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-tight">
                            {isEditing ? 'Cập nhật nhà thầu' : 'Thêm nhà thầu mới'}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            {isEditing ? 'Chỉnh sửa thông tin tổ chức' : 'Nhập thông tin cho tổ chức mới'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => closePanel()}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-400 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* ═══ FORM CONTENT ═══ */}
            <div className="flex-1 overflow-y-auto">
                <form id="contractor-form" onSubmit={handleSave} className="p-4 space-y-4 max-w-3xl mx-auto">
                    
                    {/* Thông tin cơ bản */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 border-b border-gray-100 dark:border-slate-700/50 pb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary-500" /> Thông tin cơ bản
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Tên nhà thầu */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tên nhà thầu <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    value={currentContractor.FullName || ''}
                                    onChange={e => { setCurrentContractor(prev => ({ ...prev, FullName: e.target.value })); setFormErrors(prev => ({ ...prev, FullName: '' })); }}
                                    placeholder="VD: Công Ty CP Tư Vấn Xây Dựng ABC"
                                />
                                {formErrors.FullName && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.FullName}</p>}
                            </div>

                            {/* Loại hình */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Loại hình <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none cursor-pointer font-medium"
                                    value={currentContractor.ContractorType || 'Construction'}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, ContractorType: e.target.value as ContractorType }))}
                                >
                                    {(Object.entries(CONTRACTOR_TYPE_LABELS) as [ContractorType, string][]).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Mã số thuế */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <Hash className="w-3.5 h-3.5" /> Mã số thuế
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-mono"
                                        value={currentContractor.TaxCode || ''}
                                        onChange={e => { setCurrentContractor(prev => ({ ...prev, TaxCode: e.target.value })); setFormErrors(prev => ({ ...prev, TaxCode: '' })); }}
                                        placeholder="0100106112"
                                    />
                                    {formErrors.TaxCode && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.TaxCode}</p>}
                                </div>
                                {/* Năm thành lập */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" /> Năm thành lập
                                    </label>
                                    <input
                                        type="number"
                                        min="1900"
                                        max="2030"
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        value={currentContractor.EstablishedYear || ''}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, EstablishedYear: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        placeholder="1998"
                                    />
                                </div>
                            </div>
                            
                            {/* Mã chứng chỉ */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Mã chứng chỉ năng lực</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-mono"
                                    value={currentContractor.CapCertCode || ''}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, CapCertCode: e.target.value }))}
                                    placeholder="BXD-..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Thông tin liên hệ */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 border-b border-gray-100 dark:border-slate-700/50 pb-3 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-500" /> Thông tin liên hệ
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Người đại diện */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    Người đại diện
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    value={currentContractor.Representative || ''}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, Representative: e.target.value }))}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>

                            {/* Địa chỉ */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" /> Địa chỉ
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    value={currentContractor.Address || ''}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, Address: e.target.value }))}
                                    placeholder="123 Đường ABC, Quận XYZ, Hà Nội"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Email */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        value={currentContractor.Email || ''}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, Email: e.target.value }))}
                                        placeholder="info@contractor.vn"
                                    />
                                </div>
                                {/* Website */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                        Website
                                    </label>
                                    <input
                                        type="url"
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        value={currentContractor.Website || ''}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, Website: e.target.value }))}
                                        placeholder="https://contractor.vn"
                                    />
                                </div>
                            </div>

                            {/* Điện thoại */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5" /> Điện thoại
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    value={currentContractor.ContactInfo || ''}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, ContactInfo: e.target.value }))}
                                    placeholder="024 xxxx xxxx"
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* ═══ FOOTER ACTIONS ═══ */}
            <div className="px-6 py-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3 shrink-0">
                <button
                    type="button"
                    onClick={() => closePanel()}
                    className="px-5 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    disabled={saving}
                >
                    Hủy bỏ
                </button>
                <button
                    type="submit"
                    form="contractor-form"
                    disabled={saving}
                    className="btn btn-primary disabled:opacity-50 flex items-center gap-2 px-6 py-2.5 shadow-sm"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
            </div>
        </div>
    );
};
