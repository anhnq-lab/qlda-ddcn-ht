import React, { useState, useEffect, useCallback } from 'react';
import { X, Link2, Briefcase, Users, ClipboardList, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import { MonthlyPlanItemService } from '../../services/PlanService';
import {
    MonthlyPlanItem, MonthlyPlanItemInput,
    DepartmentCode, MonthlyTaskStatus, MONTHLY_STATUS_LABELS,
} from '../../types/plan.types';
import ComboboxSelect from '../../components/ui/ComboboxSelect';
import {
    useAnnualPlanItems,
    useGroupSuggestions,
    useEmployeeOptions,
    useProjectOptions,
} from '../../hooks/usePlanData';

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
    status: 'planned',
    completion_result: '',
    incomplete_reason: '',
    notes: '',
    sort_order: 0,
    staff_ids: [],
    staff_names: [],
};

type SectionKey = 'lienket' | 'thongtin' | 'phancong' | 'ketqua';

const MonthlyPlanItemModal: React.FC<Props> = ({
    monthlyPlanId, month, year, departmentCode, item, onSaved, onClose,
}) => {
    const [form, setForm] = useState<MonthlyPlanItemInput>({ ...DEFAULT_FORM, monthly_plan_id: monthlyPlanId });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [projectSearch, setProjectSearch] = useState('');
    const [expanded, setExpanded] = useState<Set<SectionKey>>(new Set(['thongtin', 'phancong']));

    // Data hooks
    const { options: annualOptions, items: annualItems, loading: annualLoading } =
        useAnnualPlanItems(year, departmentCode);
    const groups = useGroupSuggestions(year);
    const { options: employeeOptions, loading: empLoading } = useEmployeeOptions();
    const { options: projectOptions, loading: projLoading } = useProjectOptions(projectSearch);

    const groupOptions = groups.map(g => ({ value: g, label: g }));

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
                due_date: item.due_date,
                staff_id: item.staff_id,
                staff_name: item.staff_name ?? '',
                staff_ids: item.staff_ids ?? (item.staff_id ? [item.staff_id] : []),
                staff_names: item.staff_names ?? (item.staff_name ? [item.staff_name] : []),
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
            // Mở section kết quả nếu đang edit và có kết quả
            if (item.status !== 'planned') {
                setExpanded(prev => new Set([...prev, 'ketqua']));
            }
        } else {
            setForm({ ...DEFAULT_FORM, monthly_plan_id: monthlyPlanId, deadline_note: `Tháng ${month}` });
        }
    }, [item, monthlyPlanId, month]);

    const set = useCallback((field: keyof MonthlyPlanItemInput, value: any) =>
        setForm(prev => ({ ...prev, [field]: value })), []);

    // Toggle nhân viên trong danh sách staff_ids
    const toggleStaff = useCallback((id: string, name: string) => {
        setForm(prev => {
            const ids = prev.staff_ids ?? [];
            const names = prev.staff_names ?? [];
            const idx = ids.indexOf(id);
            if (idx >= 0) {
                return { ...prev, staff_ids: ids.filter(i => i !== id), staff_names: names.filter((_, j) => j !== idx) };
            } else {
                return { ...prev, staff_ids: [...ids, id], staff_names: [...names, name] };
            }
        });
    }, []);

    // Khi chọn từ KH khung → auto-fill
    const handleAnnualItemSelect = (value: string) => {
        const found = annualItems.find(i => i.id === value);
        if (found) {
            set('annual_plan_item_id', value);
            if (!form.task_name || form.task_name === '') set('task_name', found.task_name);
            if (!form.deliverable && found.deliverable) set('deliverable', found.deliverable);
            if (!form.group_name && found.group_name) set('group_name', found.group_name);
        } else {
            set('annual_plan_item_id', value);
        }
    };

    const toggleSection = (key: SectionKey) =>
        setExpanded(prev => {
            const n = new Set(prev);
            n.has(key) ? n.delete(key) : n.add(key);
            return n;
        });

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
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

    // Ctrl+Enter submit
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
    };

    const showResultFields = form.status !== 'planned';

    // Find display values for comboboxes
    const annualDisplayVal = annualItems.find(i => i.id === form.annual_plan_item_id)?.task_name;
    const selectedProject = projectOptions.find(o => o.value === form.project_id);

    return (
        <div
            className="flex flex-col h-full bg-white dark:bg-slate-900 animate-in fade-in duration-300"
            onKeyDown={handleKeyDown}
        >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <div>
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                            {item ? 'Sửa nhiệm vụ' : `Thêm nhiệm vụ — Tháng ${month}/${year}`}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Ctrl+Enter để lưu nhanh</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto">
                    <form onSubmit={handleSubmit} className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {error && (
                            <div className="mx-6 mt-4 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        {/* ── SECTION: Liên kết ── */}
                        <SectionPanel
                            icon={<Link2 className="w-4 h-4 text-blue-500" />}
                            title="Liên kết"
                            sectionKey="lienket"
                            expanded={expanded}
                            onToggle={toggleSection}
                            badge={
                                (form.annual_plan_item_id || form.project_id)
                                    ? <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                                        {[form.annual_plan_item_id && 'KH khung', form.project_id && 'Dự án'].filter(Boolean).join(', ')}
                                    </span>
                                    : null
                            }
                        >
                            <div className="space-y-3 pt-3">
                                <div>
                                    <label className="field-label">
                                        🗂 Từ KH khung năm
                                        {form.annual_plan_item_id && (
                                            <span className="ml-2 text-blue-500 text-xs font-normal">✓ Đã liên kết</span>
                                        )}
                                    </label>
                                    <ComboboxSelect
                                        options={annualOptions}
                                        value={form.annual_plan_item_id}
                                        displayValue={annualDisplayVal}
                                        onChange={(val) => handleAnnualItemSelect(val)}
                                        placeholder="Chọn nhiệm vụ từ KH khung (tự điền thông tin)..."
                                        loading={annualLoading}
                                        clearable
                                    />
                                    {form.annual_plan_item_id && (
                                        <p className="text-xs text-blue-500 mt-1">
                                            ↑ Tên và kết quả đầu ra đã được tự động điền từ KH khung
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="field-label">
                                        📁 Dự án liên quan
                                    </label>
                                    <ComboboxSelect
                                        options={projectOptions}
                                        value={form.project_id}
                                        displayValue={selectedProject?.label}
                                        onChange={(val) => set('project_id', val || undefined)}
                                        placeholder="Liên kết với dự án (nếu có)..."
                                        loading={projLoading}
                                        clearable
                                    />
                                </div>
                            </div>
                        </SectionPanel>

                        {/* ── SECTION: Thông tin cơ bản ── */}
                        <SectionPanel
                            icon={<ClipboardList className="w-4 h-4 text-indigo-500" />}
                            title="Thông tin nhiệm vụ"
                            sectionKey="thongtin"
                            expanded={expanded}
                            onToggle={toggleSection}
                        >
                            <div className="space-y-3 pt-3">
                                <div>
                                    <label className="field-label">Loại công việc</label>
                                    <select
                                        value={(form as any).task_type ?? 'project'}
                                        onChange={e => set('task_type' as any, e.target.value)}
                                        className="field-input"
                                    >
                                        <option value="project">📁 Công việc dự án</option>
                                        <option value="management">📋 Công việc điều hành</option>
                                        <option value="internal">🏢 Công việc nội bộ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="field-label">Nhóm công việc</label>
                                    <ComboboxSelect
                                        options={groupOptions}
                                        value={form.group_name ?? ''}
                                        onChange={(val) => set('group_name', val)}
                                        placeholder="Chọn hoặc nhập nhóm mới..."
                                        allowCustom
                                        clearable={false}
                                    />
                                </div>

                                <div>
                                    <label className="field-label">
                                        Nội dung nhiệm vụ <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={form.task_name}
                                        onChange={e => set('task_name', e.target.value)}
                                        rows={3}
                                        placeholder="Mô tả nội dung nhiệm vụ cần thực hiện..."
                                        className="field-input resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="field-label">Kết quả đầu ra / Sản phẩm</label>
                                    <input
                                        value={form.deliverable ?? ''}
                                        onChange={e => set('deliverable', e.target.value)}
                                        placeholder="VD: Báo cáo tổng hợp, Tờ trình phê duyệt..."
                                        className="field-input"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="field-label">Thời hạn</label>
                                        <input
                                            list="deadline-options"
                                            value={form.deadline_note ?? ''}
                                            onChange={e => set('deadline_note', e.target.value)}
                                            placeholder={`Tháng ${month}`}
                                            className="field-input"
                                        />
                                        <datalist id="deadline-options">
                                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                                <option key={m} value={`Tháng ${m}`} />
                                            ))}
                                            <option value="Quý I" />
                                            <option value="Quý II" />
                                            <option value="Quý III" />
                                            <option value="Quý IV" />
                                            <option value="Tuần 1" />
                                            <option value="Tuần 2" />
                                            <option value="Tuần 3" />
                                            <option value="Tuần 4" />
                                            <option value="Hàng tuần" />
                                            <option value="Hàng tháng" />
                                            <option value="Khi phát sinh" />
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="field-label">Ngày cụ thể</label>
                                        <input
                                            type="date"
                                            value={form.due_date ?? ''}
                                            onChange={e => set('due_date', e.target.value || undefined)}
                                            className="field-input"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="field-label">Trạng thái</label>
                                    <select
                                        value={form.status}
                                        onChange={e => {
                                            const s = e.target.value as MonthlyTaskStatus;
                                            set('status', s);
                                            if (s !== 'planned') setExpanded(prev => new Set([...prev, 'ketqua']));
                                        }}
                                        className="field-input"
                                    >
                                        {Object.entries(MONTHLY_STATUS_LABELS).map(([v, l]) => (
                                            <option key={v} value={v}>{l}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </SectionPanel>

                        {/* ── SECTION: Phân công ── */}
                        <SectionPanel
                            icon={<Users className="w-4 h-4 text-emerald-500" />}
                            title="Phân công thực hiện"
                            sectionKey="phancong"
                            expanded={expanded}
                            onToggle={toggleSection}
                            badge={
                                (form.staff_names && form.staff_names.length > 0)
                                    ? <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">{form.staff_names.join(', ')}</span>
                                    : form.staff_name
                                        ? <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">{form.staff_name}</span>
                                        : null
                            }
                        >
                            <div className="space-y-3 pt-3">
                                {/* Multi-select cán bộ phụ trách */}
                                <div>
                                    <label className="field-label">Cán bộ phụ trách <span className="text-slate-400 font-normal">(có thể chọn nhiều người)</span></label>
                                    {empLoading ? (
                                        <div className="text-xs text-slate-400 py-2">Đang tải danh sách...</div>
                                    ) : (
                                        <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                                            {employeeOptions.map(opt => {
                                                const selected = (form.staff_ids ?? []).includes(opt.value);
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => toggleStaff(opt.value, opt.label)}
                                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0 ${
                                                            selected
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        <span className={`w-4 h-4 flex items-center justify-center rounded border ${
                                                            selected
                                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                                            : 'border-slate-300 dark:border-slate-600'
                                                        }`}>
                                                            {selected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                                        </span>
                                                        <span className="truncate flex-1">{opt.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {(form.staff_ids ?? []).length > 0 && (
                                        <p className="text-xs text-emerald-600 mt-1">
                                            ✓ Đã chọn: {(form.staff_names ?? []).join(', ')}
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <label className="field-label">Lãnh đạo Phòng</label>
                                        <ComboboxSelect
                                            options={employeeOptions}
                                            value={form.dept_head_id}
                                            displayValue={form.dept_head_name}
                                            onChange={(val, opt) => {
                                                set('dept_head_id', val || undefined);
                                                set('dept_head_name', opt?.label ?? '');
                                            }}
                                            placeholder="Chọn lãnh đạo..."
                                            loading={empLoading}
                                            allowCustom
                                        />
                                    </div>
                                    <div>
                                        <label className="field-label">Lãnh đạo Ban</label>
                                        <ComboboxSelect
                                            options={employeeOptions}
                                            value={form.ban_head_id}
                                            displayValue={form.ban_head_name}
                                            onChange={(val, opt) => {
                                                set('ban_head_id', val || undefined);
                                                set('ban_head_name', opt?.label ?? '');
                                            }}
                                            placeholder="Chọn lãnh đạo..."
                                            loading={empLoading}
                                            allowCustom
                                        />
                                    </div>
                                </div>
                            </div>
                        </SectionPanel>

                        {/* ── SECTION: Kết quả BC tháng ── */}
                        {showResultFields && (
                            <SectionPanel
                                icon={<Briefcase className="w-4 h-4 text-amber-500" />}
                                title="Kết quả báo cáo tháng"
                                sectionKey="ketqua"
                                expanded={expanded}
                                onToggle={toggleSection}
                            >
                                <div className="space-y-3 pt-3">
                                    <div>
                                        <label className="field-label">Kết quả thực hiện</label>
                                        <textarea
                                            value={form.completion_result ?? ''}
                                            onChange={e => set('completion_result', e.target.value)}
                                            rows={2}
                                            placeholder="Mô tả kết quả đã thực hiện được..."
                                            className="field-input resize-none"
                                        />
                                    </div>
                                    {(form.status === 'incomplete' || form.status === 'partial' || form.status === 'deferred') && (
                                        <div>
                                            <label className="field-label">Lý do chưa hoàn thành / Chuyển tháng</label>
                                            <input
                                                value={form.incomplete_reason ?? ''}
                                                onChange={e => set('incomplete_reason', e.target.value)}
                                                placeholder="Nguyên nhân và dự kiến xử lý..."
                                                className="field-input"
                                            />
                                        </div>
                                    )}
                                </div>
                            </SectionPanel>
                        )}

                        {/* Ghi chú */}
                        <div className="px-6 py-4">
                            <label className="field-label">Ghi chú</label>
                            <input
                                value={form.notes ?? ''}
                                onChange={e => set('notes', e.target.value)}
                                placeholder="Ghi chú thêm nếu cần..."
                                className="field-input"
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-400">
                        {item ? `Sửa lần cuối: ${new Date(item.updated_at ?? '').toLocaleDateString('vi-VN')}` : 'Bản ghi mới'}
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
                        >
                            {saving ? 'Đang lưu...' : item ? 'Cập nhật' : 'Thêm nhiệm vụ'}
                        </button>
                    </div>
                </div>
            <style>{`
                .field-label { display: block; font-size: 0.75rem; font-weight: 500; color: #475569; margin-bottom: 0.25rem; }
                .dark .field-label { color: #94a3b8; }
                .field-input {
                    width: 100%; border: 1px solid #e2e8f0; border-radius: 0.5rem;
                    padding: 0.5rem 0.75rem; font-size: 0.875rem;
                    background: white; color: #1e293b;
                    outline: none; transition: border-color 0.15s, box-shadow 0.15s;
                }
                .field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
                .dark .field-input { background: #1e293b; border-color: #475569; color: #e2e8f0; }
                .dark .field-input:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(129,140,248,0.2); }
            `}</style>
        </div>
    );
};

// ─── SectionPanel helper ──────────────────────────────────────
interface SectionPanelProps {
    icon: React.ReactNode;
    title: string;
    sectionKey: SectionKey;
    expanded: Set<SectionKey>;
    onToggle: (key: SectionKey) => void;
    badge?: React.ReactNode;
    children: React.ReactNode;
}

const SectionPanel: React.FC<SectionPanelProps> = ({ icon, title, sectionKey, expanded, onToggle, badge, children }) => {
    const isOpen = expanded.has(sectionKey);
    return (
        <div className="px-6 py-3">
            <button
                type="button"
                onClick={() => onToggle(sectionKey)}
                className="w-full flex items-center gap-2 text-left group"
            >
                {icon}
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">{title}</span>
                {badge}
                {isOpen
                    ? <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                }
            </button>
            {isOpen && children}
        </div>
    );
};

export default MonthlyPlanItemModal;
