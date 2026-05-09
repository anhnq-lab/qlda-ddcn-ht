import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { MonthlyPlanItemService } from '../../services/PlanService';
import {
    MonthlyPlanItem, MonthlyPlanItemInput,
    DepartmentCode, MonthlyTaskStatus, MONTHLY_STATUS_LABELS,
} from '../../types/plan.types';

interface Props {
    monthlyPlanId: string;
    month: number;
    year: number;
    departmentCode: DepartmentCode;
    item: MonthlyPlanItem | null;
    onSaved: () => void;
    onClose: () => void;
}

const DEFAULT_FORM: MonthlyPlanItemInput = {
    monthly_plan_id: '',
    task_name: '',
    deliverable: '',
    group_name: '',
    group_sort_order: 0,
    deadline_note: '',
    staff_name: '',
    dept_head_name: '',
    ban_head_name: '',
    status: 'planned',
    completion_result: '',
    incomplete_reason: '',
    notes: '',
    sort_order: 0,
};

const MonthlyPlanItemModal: React.FC<Props> = ({
    monthlyPlanId, month, year, item, onSaved, onClose,
}) => {
    const [form, setForm] = useState<MonthlyPlanItemInput>({ ...DEFAULT_FORM, monthly_plan_id: monthlyPlanId });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (item) {
            setForm({
                monthly_plan_id: item.monthly_plan_id,
                annual_plan_item_id: item.annual_plan_item_id,
                project_id: item.project_id,
                group_name: item.group_name ?? '',
                group_sort_order: item.group_sort_order ?? 0,
                task_name: item.task_name,
                deliverable: item.deliverable ?? '',
                deadline_note: item.deadline_note ?? `Tháng ${month}`,
                staff_id: item.staff_id,
                staff_name: item.staff_name ?? '',
                dept_head_id: item.dept_head_id,
                dept_head_name: item.dept_head_name ?? '',
                ban_head_id: item.ban_head_id,
                ban_head_name: item.ban_head_name ?? '',
                status: item.status,
                completion_result: item.completion_result ?? '',
                incomplete_reason: item.incomplete_reason ?? '',
                notes: item.notes ?? '',
                sort_order: item.sort_order ?? 0,
            });
        } else {
            setForm({ ...DEFAULT_FORM, monthly_plan_id: monthlyPlanId, deadline_note: `Tháng ${month}` });
        }
    }, [item, monthlyPlanId, month]);

    const set = (field: keyof MonthlyPlanItemInput, value: any) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.task_name.trim()) { setError('Vui lòng nhập nội dung nhiệm vụ'); return; }
        setSaving(true);
        setError('');
        try {
            if (item) {
                await MonthlyPlanItemService.update(item.id, form);
            } else {
                await MonthlyPlanItemService.create(form);
            }
            onSaved();
        } catch (e: any) {
            setError(e.message ?? 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    const showResultFields = form.status !== 'planned';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800">
                        {item ? 'Sửa nhiệm vụ' : `Thêm nhiệm vụ — Tháng ${month}/${year}`}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-auto px-6 py-4 space-y-4">
                    {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Nhóm công việc</label>
                        <input
                            value={form.group_name ?? ''}
                            onChange={e => set('group_name', e.target.value)}
                            placeholder="VD: Công tác Hành chính"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Nội dung nhiệm vụ <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={form.task_name}
                            onChange={e => set('task_name', e.target.value)}
                            rows={3}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Kết quả đầu ra</label>
                        <input
                            value={form.deliverable ?? ''}
                            onChange={e => set('deliverable', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Thời hạn hoàn thành</label>
                            <input
                                value={form.deadline_note ?? ''}
                                onChange={e => set('deadline_note', e.target.value)}
                                placeholder={`Tháng ${month}`}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Trạng thái</label>
                            <select
                                value={form.status}
                                onChange={e => set('status', e.target.value as MonthlyTaskStatus)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {Object.entries(MONTHLY_STATUS_LABELS).map(([v, l]) => (
                                    <option key={v} value={v}>{l}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Cán bộ phụ trách</label>
                            <input
                                value={form.staff_name ?? ''}
                                onChange={e => set('staff_name', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Lãnh đạo Phòng</label>
                            <input
                                value={form.dept_head_name ?? ''}
                                onChange={e => set('dept_head_name', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Lãnh đạo Ban</label>
                            <input
                                value={form.ban_head_name ?? ''}
                                onChange={e => set('ban_head_name', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {showResultFields && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Kết quả thực hiện</label>
                                <textarea
                                    value={form.completion_result ?? ''}
                                    onChange={e => set('completion_result', e.target.value)}
                                    rows={2}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                />
                            </div>
                            {(form.status === 'incomplete' || form.status === 'partial') && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Lý do chưa hoàn thành</label>
                                    <input
                                        value={form.incomplete_reason ?? ''}
                                        onChange={e => set('incomplete_reason', e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </form>

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                        Hủy
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                        {saving ? 'Đang lưu...' : item ? 'Cập nhật' : 'Thêm nhiệm vụ'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MonthlyPlanItemModal;
