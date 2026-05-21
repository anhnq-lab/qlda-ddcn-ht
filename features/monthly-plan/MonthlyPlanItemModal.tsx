import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Link2, Briefcase, Users, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import { MonthlyPlanItemService } from '../../services/PlanService';
import {
    MonthlyPlanItem, MonthlyPlanItemInput,
    DepartmentCode, MonthlyTaskStatus, MONTHLY_STATUS_LABELS, DEPARTMENT_NAMES,
} from '../../types/plan.types';
import ComboboxSelect from '../../components/ui/ComboboxSelect';
import Select from '../../components/ui/Select';
import {
    useAnnualPlanItems,
    useGroupSuggestions,
    useEmployeeOptions,
    useProjectOptions,
} from '../../hooks/usePlanData';
import { MonthlyPlanItemFormSchema, type MonthlyPlanItemFormInput } from '../../schemas/monthlyPlan.schema';

interface Props {
    monthlyPlanId: string;
    month: number;
    year: number;
    departmentCode: DepartmentCode;
    item: MonthlyPlanItem | null;
    initialAnnualPlanItem?: any;
    onSaved: () => void;
    onClose: () => void;
}

type SectionKey = 'lienket' | 'thongtin' | 'phancong' | 'ketqua';

const MonthlyPlanItemModal: React.FC<Props> = ({
    monthlyPlanId, month, year, departmentCode, item, initialAnnualPlanItem, onSaved, onClose,
}) => {
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState('');
    const [projectSearch, setProjectSearch] = useState('');
    const [expanded, setExpanded] = useState<Set<SectionKey>>(new Set(['lienket', 'thongtin', 'phancong']));

    // Data hooks
    const { options: annualOptions, items: annualItems, loading: annualLoading } =
        useAnnualPlanItems(year, departmentCode);
    const groups = useGroupSuggestions(year);
    const { options: employeeOptions, loading: empLoading } = useEmployeeOptions();
    const { options: projectOptions, loading: projLoading } = useProjectOptions(projectSearch);

    const groupOptions = groups.map(g => ({ value: g, label: g }));    const buildDefaultValues = useCallback((): MonthlyPlanItemFormInput => ({
        monthly_plan_id: monthlyPlanId,
        task_name: '',
        deliverable: '',
        group_name: '',
        group_sort_order: 0,
        deadline_note: `Tháng ${month}`,
        status: 'planned',
        completion_result: '',
        incomplete_reason: '',
        notes: '',
        sort_order: 0,
        collaborating_dept_codes: [],
        collaborating_text: '',
    }), [monthlyPlanId, month]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<MonthlyPlanItemFormInput>({
        resolver: zodResolver(MonthlyPlanItemFormSchema),
        defaultValues: buildDefaultValues(),
    });

    const watchedStatus = watch('status');
    const watchedCollaboratingDeptCodes = watch('collaborating_dept_codes') ?? [];
    const watchedAnnualItemId = watch('annual_plan_item_id');
    const watchedProjectId = watch('project_id');
    const watchedGroupName = watch('group_name') ?? '';
    const watchedTaskName = watch('task_name') ?? '';

    // Danh sách phòng ban phối hợp (bỏ phòng đang active)
    const deptOptions = React.useMemo(() => {
        return (Object.keys(DEPARTMENT_NAMES) as DepartmentCode[])
            .filter(code => code !== departmentCode)
            .map(code => ({
                value: code,
                label: `${code} - ${DEPARTMENT_NAMES[code]}`,
            }));
    }, [departmentCode]);

    const handleCollaboratingDeptsChange = useCallback((val: string | number | (string | number)[]) => {
        const codes = (Array.isArray(val) ? val : val ? [val] : []).map(String) as DepartmentCode[];
        setValue('collaborating_dept_codes', codes);
        setValue('collaborating_text', codes.join(', '));
    }, [setValue]);

    useEffect(() => {
        if (item) {
            reset({
                monthly_plan_id: item.monthly_plan_id,
                annual_plan_item_id: item.annual_plan_item_id,
                project_id: item.project_id,
                group_name: item.group_name ?? '',
                group_sort_order: item.group_sort_order ?? 0,
                task_name: item.task_name,
                deliverable: item.deliverable ?? '',
                deadline_note: item.deadline_note ?? `Tháng ${month}`,
                due_date: item.due_date,
                collaborating_dept_codes: item.collaborating_dept_codes ?? [],
                collaborating_text: item.collaborating_text ?? '',
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
            const defaults = buildDefaultValues();
            if (initialAnnualPlanItem) {
                defaults.annual_plan_item_id = initialAnnualPlanItem.id;
                defaults.task_name = initialAnnualPlanItem.task_name;
                defaults.deliverable = initialAnnualPlanItem.deliverable ?? '';
                defaults.group_name = initialAnnualPlanItem.group_name ?? '';
                defaults.project_id = initialAnnualPlanItem.project_id ?? undefined;
                defaults.collaborating_dept_codes = initialAnnualPlanItem.collaborating_dept_codes ?? [];
                defaults.collaborating_text = initialAnnualPlanItem.collaborating_text ?? '';
            }
            reset(defaults);
        }
    }, [item, monthlyPlanId, month, reset, buildDefaultValues, initialAnnualPlanItem]);
    // Khi chọn từ KH khung → auto-fill
    const handleAnnualItemSelect = (value: string) => {
        const found = annualItems.find(i => i.id === value);
        if (found) {
            setValue('annual_plan_item_id', value);
            if (!watchedTaskName) setValue('task_name', found.task_name);
            if (!watch('deliverable') && found.deliverable) setValue('deliverable', found.deliverable);
            if (!watchedGroupName && found.group_name) setValue('group_name', found.group_name);
        } else {
            setValue('annual_plan_item_id', value);
        }
    };

    const toggleSection = (key: SectionKey) =>
        setExpanded(prev => {
            const n = new Set(prev);
            n.has(key) ? n.delete(key) : n.add(key);
            return n;
        });

    const onSubmit = handleSubmit(async (data) => {
        setSaving(true);
        setServerError('');
        try {
            const payload = data as unknown as MonthlyPlanItemInput;
            if (item) {
                await MonthlyPlanItemService.update(item.id, payload);
            } else {
                await MonthlyPlanItemService.create(payload);
            }
            onSaved();
        } catch (e: any) {
            setServerError(e.message ?? 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    });

    // Ctrl+Enter submit
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onSubmit();
    };

    const showResultFields = watchedStatus !== 'planned';

    // Find display values for comboboxes
    const annualDisplayVal = annualItems.find(i => i.id === watchedAnnualItemId)?.task_name;
    const selectedProject = projectOptions.find(o => o.value === watchedProjectId);

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
                    <form onSubmit={onSubmit} className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {(serverError || errors.task_name) && (
                            <div className="mx-6 mt-4 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100">
                                {serverError || errors.task_name?.message}
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
                                (watchedAnnualItemId || watchedProjectId)
                                    ? <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                                        {[watchedAnnualItemId && 'KH khung', watchedProjectId && 'Dự án'].filter(Boolean).join(', ')}
                                    </span>
                                    : null
                            }
                        >
                            <div className="space-y-3 pt-3">
                                <div>
                                    <label className="field-label">
                                        🗂 Từ KH khung năm
                                        {watchedAnnualItemId && (
                                            <span className="ml-2 text-blue-500 text-xs font-normal">✓ Đã liên kết</span>
                                        )}
                                    </label>
                                    <ComboboxSelect
                                        options={annualOptions}
                                        value={watchedAnnualItemId}
                                        displayValue={annualDisplayVal}
                                        onChange={(val) => handleAnnualItemSelect(val)}
                                        placeholder="Chọn nhiệm vụ từ KH khung (tự điền thông tin)..."
                                        loading={annualLoading}
                                        clearable
                                    />
                                    {watchedAnnualItemId && (
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
                                        value={watchedProjectId}
                                        displayValue={selectedProject?.label}
                                        onChange={(val) => setValue('project_id', val || undefined)}
                                        placeholder="Liên kết với dự án (nếu có)..."
                                        loading={projLoading}
                                        clearable
                                    />
                                </div>
                            </div>
                        </SectionPanel>

                        {/* ── SECTION: Thông tin cơ bản ── */}
                        <SectionPanel
                            icon={<ClipboardList className="w-4 h-4 text-primary-500" />}
                            title="Thông tin nhiệm vụ"
                            sectionKey="thongtin"
                            expanded={expanded}
                            onToggle={toggleSection}
                        >
                            <div className="space-y-3 pt-3">
                                <div>
                                    <label className="field-label mb-2 block">Loại công việc</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'project', label: 'Công việc dự án', icon: '📁' },
                                            { value: 'management', label: 'Công việc điều hành', icon: '📋' },
                                            { value: 'internal', label: 'Công việc nội bộ', icon: '🏢' }
                                        ].map(type => {
                                            const currentTaskType = (watch as any)('task_type') ?? 'project';
                                            const isSelected = currentTaskType === type.value;
                                            return (
                                                <button
                                                    key={type.value}
                                                    type="button"
                                                    onClick={() => (setValue as any)('task_type', type.value)}
                                                    className={`px-3 py-2.5 text-sm rounded-xl font-medium transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border ${
                                                        isSelected
                                                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm dark:bg-blue-500/10 dark:border-blue-500 dark:text-blue-400 ring-1 ring-blue-500'
                                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <span className="text-base leading-none">{type.icon}</span>
                                                    <span className="whitespace-nowrap">{type.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <label className="field-label">Nhóm công việc</label>
                                    <ComboboxSelect
                                        options={groupOptions}
                                        value={watchedGroupName}
                                        onChange={(val) => setValue('group_name', val)}
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
                                        {...register('task_name')}
                                        rows={3}
                                        placeholder="Mô tả nội dung nhiệm vụ cần thực hiện..."
                                        className="field-input resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="field-label">Kết quả đầu ra / Sản phẩm</label>
                                    <input
                                        {...register('deliverable')}
                                        placeholder="VD: Báo cáo tổng hợp, Tờ trình phê duyệt..."
                                        className="field-input"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="field-label">Thời hạn</label>
                                        <input
                                            list="deadline-options"
                                            {...register('deadline_note')}
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
                                            {...register('due_date')}
                                            className="field-input"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="field-label">Trạng thái</label>
                                    <select
                                        {...register('status')}
                                        onChange={e => {
                                            const s = e.target.value as MonthlyTaskStatus;
                                            setValue('status', s);
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

                        {/* ── SECTION: Phân công phối hợp ── */}
                        <SectionPanel
                            icon={<Users className="w-4 h-4 text-emerald-500" />}
                            title="Đơn vị phối hợp thực hiện"
                            sectionKey="phancong"
                            expanded={expanded}
                            onToggle={toggleSection}
                            badge={
                                watchedCollaboratingDeptCodes.length > 0
                                    ? <span className="text-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                                        {watchedCollaboratingDeptCodes.length} đơn vị
                                    </span>
                                    : null
                            }
                        >
                            <div className="space-y-3 pt-3">
                                <div>
                                    <label className="field-label">Phòng ban phối hợp</label>
                                    <Select
                                        options={deptOptions}
                                        value={watchedCollaboratingDeptCodes}
                                        onChange={handleCollaboratingDeptsChange}
                                        multiple
                                        searchable
                                        clearable
                                        placeholder="Chọn phòng ban phối hợp..."
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Ghi chú phối hợp / Đơn vị ngoài Ban</label>
                                    <input
                                        {...register('collaborating_text')}
                                        placeholder="VD: Sở Xây dựng, Sở Tài nguyên..."
                                        className="field-input"
                                    />
                                </div>
                            </div>
                        </SectionPanel>

                        {/* ── SECTION: Kết quả BC tháng ── */}
                        {showResultFields && (
                            <SectionPanel
                                icon={<Briefcase className="w-4 h-4 text-warning-500" />}
                                title="Kết quả báo cáo tháng"
                                sectionKey="ketqua"
                                expanded={expanded}
                                onToggle={toggleSection}
                            >
                                <div className="space-y-3 pt-3">
                                    <div>
                                        <label className="field-label">Kết quả thực hiện</label>
                                        <textarea
                                            {...register('completion_result')}
                                            rows={2}
                                            placeholder="Mô tả kết quả đã thực hiện được..."
                                            className="field-input resize-none"
                                        />
                                    </div>
                                    {(watchedStatus === 'incomplete' || watchedStatus === 'partial' || watchedStatus === 'deferred') && (
                                        <div>
                                            <label className="field-label">Lý do chưa hoàn thành / Chuyển tháng</label>
                                            <input
                                                {...register('incomplete_reason')}
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
                                {...register('notes')}
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
                            onClick={onSubmit}
                            disabled={saving}
                            className="px-5 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
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
                .dark .field-input { background: #151d2e; border-color: #293548; color: #e2e8f0; }
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
