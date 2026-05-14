import React, { useState, useEffect, useCallback } from 'react';
import { X, Link2, Users, ClipboardList, CalendarClock, ChevronDown, ChevronUp } from 'lucide-react';
import { AnnualPlanService } from '../../services/PlanService';
import {
    AnnualPlanItem, AnnualPlanItemInput,
    DepartmentCode, PlanFrequency, FREQUENCY_LABELS,
} from '../../types/plan.types';
import ComboboxSelect from '../../components/ui/ComboboxSelect';
import { useGroupSuggestions, useProjectOptions } from '../../hooks/usePlanData';

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
    'Hàng tháng', 'Hàng ngày', 'Hàng năm', 'Khi phát sinh', 'Cả năm',
];

// Gợi ý tên phụ trách theo phòng ban
const DEPT_SUGGESTIONS = [
    'HCTH', 'KHDT', 'KTTD', 'QLDA1', 'QLDA2', 'QLDA3', 'PTDV',
    'Toàn Ban', 'Các phòng',
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

type SectionKey = 'thongtin' | 'thoigian' | 'phancong' | 'lienket';

const AnnualPlanItemModal: React.FC<Props> = ({
    year, departmentCode, departmentName, item, onSaved, onClose,
}) => {
    const [form, setForm] = useState<AnnualPlanItemInput>(DEFAULT_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState<Set<SectionKey>>(new Set(['thongtin', 'thoigian', 'phancong']));

    const groups = useGroupSuggestions(year);
    const { options: projectOptions, loading: projLoading } = useProjectOptions();

    const groupOptions = groups.map(g => ({ value: g, label: g }));
    const selectedProject = projectOptions.find(o => o.value === form.project_id);

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
                project_id: item.project_id,
                responsible_text: item.responsible_text ?? '',
                collaborating_text: item.collaborating_text ?? '',
                notes: item.notes ?? '',
                sort_order: item.sort_order ?? 0,
            });
        } else {
            setForm({ ...DEFAULT_FORM, plan_year: year, department_code: departmentCode, department_name: departmentName });
        }
    }, [item, year, departmentCode, departmentName]);

    const set = useCallback((field: keyof AnnualPlanItemInput, value: any) =>
        setForm(prev => ({ ...prev, [field]: value })), []);

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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onKeyDown={handleKeyDown}
        >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <div>
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                            {item ? 'Sửa nhiệm vụ KH khung' : `Thêm nhiệm vụ KH khung — ${year}`}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">{departmentName} · Ctrl+Enter để lưu</p>
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

                        {/* ── Thông tin nhiệm vụ ── */}
                        <SectionPanel
                            icon={<ClipboardList className="w-4 h-4 text-primary-500" />}
                            title="Thông tin nhiệm vụ"
                            sectionKey="thongtin"
                            expanded={expanded}
                            onToggle={toggleSection}
                        >
                            <div className="space-y-3 pt-3">
                                <div>
                                    <label className="field-label">Nhóm công việc</label>
                                    <ComboboxSelect
                                        options={groupOptions}
                                        value={form.group_name ?? ''}
                                        onChange={val => set('group_name', val)}
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
                                        placeholder="Mô tả nội dung công việc cần thực hiện trong năm..."
                                        className="field-input resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="field-label">Sản phẩm / Kết quả đầu ra</label>
                                    <input
                                        value={form.deliverable ?? ''}
                                        onChange={e => set('deliverable', e.target.value)}
                                        placeholder="VD: Báo cáo tháng, Văn bản tham mưu, Quyết định..."
                                        className="field-input"
                                    />
                                </div>
                            </div>
                        </SectionPanel>

                        {/* ── Thời gian & Tần suất ── */}
                        <SectionPanel
                            icon={<CalendarClock className="w-4 h-4 text-warning-500" />}
                            title="Thời gian & Tần suất"
                            sectionKey="thoigian"
                            expanded={expanded}
                            onToggle={toggleSection}
                            badge={
                                form.frequency !== 'one_time'
                                    ? <span className="text-xs bg-warning-50 text-warning-600 px-1.5 py-0.5 rounded-full">
                                        {FREQUENCY_LABELS[form.frequency]}
                                    </span>
                                    : null
                            }
                        >
                            <div className="grid grid-cols-3 gap-3 pt-3">
                                <div>
                                    <label className="field-label">Bắt đầu</label>
                                    <input
                                        list="period-suggestions"
                                        value={form.start_period ?? ''}
                                        onChange={e => set('start_period', e.target.value)}
                                        placeholder="Quý I, Tháng 3..."
                                        className="field-input"
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Hoàn thành</label>
                                    <input
                                        list="period-suggestions"
                                        value={form.end_period ?? ''}
                                        onChange={e => set('end_period', e.target.value)}
                                        placeholder="Quý IV, Tháng 12..."
                                        className="field-input"
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Tần suất</label>
                                    <select
                                        value={form.frequency}
                                        onChange={e => set('frequency', e.target.value as PlanFrequency)}
                                        className="field-input"
                                    >
                                        {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                                            <option key={v} value={v}>{l}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <datalist id="period-suggestions">
                                {PERIOD_SUGGESTIONS.map(p => <option key={p} value={p} />)}
                            </datalist>
                        </SectionPanel>

                        {/* ── Phân công ── */}
                        <SectionPanel
                            icon={<Users className="w-4 h-4 text-emerald-500" />}
                            title="Phân công thực hiện"
                            sectionKey="phancong"
                            expanded={expanded}
                            onToggle={toggleSection}
                        >
                            <div className="grid grid-cols-2 gap-3 pt-3">
                                <div>
                                    <label className="field-label">Phòng / Cá nhân thực hiện</label>
                                    <input
                                        list="dept-suggestions"
                                        value={form.responsible_text ?? ''}
                                        onChange={e => set('responsible_text', e.target.value)}
                                        placeholder="VD: HCTH/ Lộc, Minh"
                                        className="field-input"
                                    />
                                    <datalist id="dept-suggestions">
                                        {DEPT_SUGGESTIONS.map(d => <option key={d} value={d} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="field-label">Phòng / Cá nhân phối hợp</label>
                                    <input
                                        list="dept-suggestions"
                                        value={form.collaborating_text ?? ''}
                                        onChange={e => set('collaborating_text', e.target.value)}
                                        placeholder="VD: KHDT, KTTD"
                                        className="field-input"
                                    />
                                </div>
                            </div>
                        </SectionPanel>

                        {/* ── Liên kết Dự án ── */}
                        <SectionPanel
                            icon={<Link2 className="w-4 h-4 text-blue-500" />}
                            title="Liên kết dự án"
                            sectionKey="lienket"
                            expanded={expanded}
                            onToggle={toggleSection}
                            badge={
                                form.project_id
                                    ? <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                                        {selectedProject?.label?.substring(0, 20) ?? 'Đã liên kết'}
                                    </span>
                                    : null
                            }
                        >
                            <div className="pt-3">
                                <label className="field-label">Dự án liên quan (không bắt buộc)</label>
                                <ComboboxSelect
                                    options={projectOptions}
                                    value={form.project_id}
                                    displayValue={selectedProject?.label}
                                    onChange={val => set('project_id', val || undefined)}
                                    placeholder="Tìm và chọn dự án liên kết..."
                                    loading={projLoading}
                                    clearable
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    Liên kết nếu nhiệm vụ này gắn với 1 dự án cụ thể
                                </p>
                            </div>
                        </SectionPanel>

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
                        {item ? `Cập nhật: ${new Date(item.updated_at ?? '').toLocaleDateString('vi-VN')}` : 'Bản ghi mới'}
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
                            className="px-5 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
                        >
                            {saving ? 'Đang lưu...' : item ? 'Cập nhật' : 'Thêm nhiệm vụ'}
                        </button>
                    </div>
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
                .field-input:focus { border-color: var(--color-primary-500, #6366f1); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
                .dark .field-input { background: #1e293b; border-color: #475569; color: #e2e8f0; }
            `}</style>
        </div>
    );
};

// ─── SectionPanel ─────────────────────────────────────────────
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

export default AnnualPlanItemModal;
