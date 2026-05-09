import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AnnualPlanService } from '../../services/PlanService';
import {
    AnnualPlanItem, AnnualPlanItemInput,
    DepartmentCode, PlanFrequency, FREQUENCY_LABELS,
} from '../../types/plan.types';

interface Props {
    year: number;
    departmentCode: DepartmentCode;
    departmentName: string;
    item: AnnualPlanItem | null;
    onSaved: () => void;
    onClose: () => void;
}

const PERIOD_SUGGESTIONS = [
    'Quý I', 'Quý II', 'Quý III', 'Quý IV',
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
    'Hàng tháng', 'Hàng ngày', 'Hàng năm', 'Khi phát sinh',
];

const DEFAULT_FORM: AnnualPlanItemInput = {
    plan_year: new Date().getFullYear(),
    department_code: 'HCTH',
    department_name: '',
    group_name: '',
    group_sort_order: 0,
    task_name: '',
    deliverable: '',
    start_period: '',
    end_period: '',
    frequency: 'one_time',
    responsible_text: '',
    collaborating_text: '',
    notes: '',
    sort_order: 0,
};

const AnnualPlanItemModal: React.FC<Props> = ({
    year, departmentCode, departmentName, item, onSaved, onClose,
}) => {
    const [form, setForm] = useState<AnnualPlanItemInput>(DEFAULT_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (item) {
            setForm({
                plan_year: item.plan_year,
                department_code: item.department_code,
                department_name: item.department_name,
                group_name: item.group_name ?? '',
                group_sort_order: item.group_sort_order ?? 0,
                task_name: item.task_name,
                deliverable: item.deliverable ?? '',
                start_period: item.start_period ?? '',
                end_period: item.end_period ?? '',
                frequency: item.frequency,
                responsible_text: item.responsible_text ?? '',
                collaborating_text: item.collaborating_text ?? '',
                notes: item.notes ?? '',
                sort_order: item.sort_order ?? 0,
            });
        } else {
            setForm({ ...DEFAULT_FORM, plan_year: year, department_code: departmentCode, department_name: departmentName });
        }
    }, [item, year, departmentCode, departmentName]);

    const set = (field: keyof AnnualPlanItemInput, value: any) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.task_name.trim()) { setError('Vui lòng nhập nội dung nhiệm vụ'); return; }
        setSaving(true);
        setError('');
        try {
            if (item) {
                await AnnualPlanService.update(item.id, form);
            } else {
                await AnnualPlanService.create(form);
            }
            onSaved();
        } catch (e: any) {
            setError(e.message ?? 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800">
                        {item ? 'Sửa nhiệm vụ' : 'Thêm nhiệm vụ KH khung'}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-auto px-6 py-4 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
                    )}

                    {/* Nhóm công việc */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Nhóm công việc</label>
                        <input
                            value={form.group_name ?? ''}
                            onChange={e => set('group_name', e.target.value)}
                            placeholder="VD: Công tác Hành chính, Tham mưu tổng hợp..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Nội dung nhiệm vụ */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Nội dung nhiệm vụ <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={form.task_name}
                            onChange={e => set('task_name', e.target.value)}
                            rows={3}
                            placeholder="Mô tả nội dung công việc..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        />
                    </div>

                    {/* Sản phẩm đầu ra */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Sản phẩm đầu ra</label>
                        <input
                            value={form.deliverable ?? ''}
                            onChange={e => set('deliverable', e.target.value)}
                            placeholder="VD: Báo cáo tháng, Văn bản tham mưu..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Thời gian & Tần suất */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Thời gian bắt đầu</label>
                            <input
                                list="period-suggestions"
                                value={form.start_period ?? ''}
                                onChange={e => set('start_period', e.target.value)}
                                placeholder="Quý I, Tháng 4..."
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Thời gian hoàn thành</label>
                            <input
                                list="period-suggestions"
                                value={form.end_period ?? ''}
                                onChange={e => set('end_period', e.target.value)}
                                placeholder="Quý IV, Tháng 12..."
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Tần suất</label>
                            <select
                                value={form.frequency}
                                onChange={e => set('frequency', e.target.value as PlanFrequency)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                                    <option key={v} value={v}>{l}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Datalist cho gợi ý thời gian */}
                    <datalist id="period-suggestions">
                        {PERIOD_SUGGESTIONS.map(p => <option key={p} value={p} />)}
                    </datalist>

                    {/* Phụ trách */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Phòng/Cá nhân thực hiện
                            </label>
                            <input
                                value={form.responsible_text ?? ''}
                                onChange={e => set('responsible_text', e.target.value)}
                                placeholder="VD: HCTH/ Lộc, Minh/ Hữu"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Phòng/Cá nhân phối hợp
                            </label>
                            <input
                                value={form.collaborating_text ?? ''}
                                onChange={e => set('collaborating_text', e.target.value)}
                                placeholder="VD: KHĐT, KTTĐ"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {/* Ghi chú */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Ghi chú</label>
                        <input
                            value={form.notes ?? ''}
                            onChange={e => set('notes', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                        {saving ? 'Đang lưu...' : item ? 'Cập nhật' : 'Thêm nhiệm vụ'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnnualPlanItemModal;
