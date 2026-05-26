import React, { useState, useEffect, useMemo } from 'react';
import {
    X, Edit2, Trash2, Link2, Users, ClipboardList, CalendarClock,
    Plus, CalendarDays, Building2, FolderOpen, Calendar, AlertTriangle
} from 'lucide-react';
import { AnnualPlanItem, FREQUENCY_LABELS, DepartmentCode, DEPARTMENT_NAMES } from '../../types/plan.types';
import { supabase as _supabase } from '../../lib/supabase';
import { formatPeriod } from '../../utils/format';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { useEmployeeOptions } from '../../hooks/usePlanData';
import EmployeeSlideContent from '../../components/common/EmployeeSlideContent';
const supabase = _supabase as any;

const FREQUENCY_COLORS: Record<string, string> = {
    one_time:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    monthly:   'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    quarterly: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
    daily:     'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    as_needed: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400',
};

const FREQUENCY_TOP_BAR: Record<string, string> = {
    one_time:  'bg-slate-400 dark:bg-slate-600',
    monthly:   'bg-blue-500',
    quarterly: 'bg-violet-500',
    daily:     'bg-emerald-500',
    as_needed: 'bg-amber-500',
};

const FREQUENCY_RING: Record<string, string> = {
    one_time:  'ring-slate-500/15 dark:ring-slate-600/30',
    monthly:   'ring-blue-500/20',
    quarterly: 'ring-violet-500/20',
    daily:     'ring-emerald-500/20',
    as_needed: 'ring-amber-500/20',
};

interface Props {
    item: AnnualPlanItem;
    year: number;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
    onCreateMonthlyTask?: (item: AnnualPlanItem) => void;
}

const AnnualPlanItemDetail: React.FC<Props> = ({ item, year, onEdit, onDelete, onClose, onCreateMonthlyTask }) => {
    const { openPanel } = useSlidePanel();
    const { options: employeeOptions } = useEmployeeOptions();
    const empMap = useMemo(() => {
        const m: Record<string, { name: string; avatar?: string }> = {};
        for (const o of employeeOptions) m[String(o.value)] = { name: o.label, avatar: o.avatar };
        return m;
    }, [employeeOptions]);

    const openEmployeePanel = (empId: string) => {
        const emp = empMap[empId];
        openPanel({
            title: emp?.name ?? empId,
            component: <EmployeeSlideContent employeeId={empId} />,
        });
    };

    const [project, setProject] = useState<any>(null);
    const [monthlyLinks, setMonthlyLinks] = useState<any[]>([]);
    const [loadingLinks, setLoadingLinks] = useState(false);

    // Load project nếu có
    useEffect(() => {
        if (!item.project_id) { setProject(null); return; }
        supabase
            .from('projects')
            .select('"ProjectID", "ProjectName", "ProjectCode"')
            .eq('"ProjectID"', item.project_id)
            .maybeSingle()
            .then(({ data }: any) => setProject(data));
    }, [item.project_id]);

    // Load các KH tháng đã liên kết
    useEffect(() => {
        setLoadingLinks(true);
        supabase
            .from('tasks')
            .select('id, title, status, due_date, department_code, metadata')
            .eq('annual_plan_item_id', item.id)
            .order('created_at', { ascending: false })
            .then(({ data }: any) => {
                const mapped = (data || []).map((t: any) => {
                    const d = new Date(t.due_date);
                    return {
                        id: t.id,
                        task_name: t.title,
                        status: t.status === 'done' ? 'completed' : (t.status === 'in_progress' ? 'partial' : (t.status === 'incomplete' ? 'incomplete' : 'planned')),
                        deadline_note: t.metadata?.deadline_note || `Tháng ${d.getMonth() + 1}`,
                        monthly_plan: {
                            plan_month: d.getMonth() + 1,
                            plan_year: d.getFullYear(),
                            department_code: t.department_code
                        }
                    };
                });
                setMonthlyLinks(mapped);
                setLoadingLinks(false);
            });
    }, [item.id]);

    const handleDelete = () => {
        if (!confirm('Xóa nhiệm vụ này khỏi KH khung? Thao tác không thể hoàn tác.')) return;
        onDelete();
    };

    const freqColor = FREQUENCY_COLORS[item.frequency] ?? 'bg-slate-100 text-slate-600';
    const topBarColor = FREQUENCY_TOP_BAR[item.frequency] ?? 'bg-slate-400';
    const ringColor = FREQUENCY_RING[item.frequency] ?? 'ring-slate-300/20';

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900 overflow-hidden animate-in fade-in duration-300">
            {/* Header Card */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm shrink-0 overflow-hidden">
                {/* Top accent */}
                <div className={`h-1 ${topBarColor}`} />

                <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            {/* Tags row */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${freqColor} ring-1 ${ringColor}`}>
                                    <CalendarClock className="w-3.5 h-3.5" />
                                    {FREQUENCY_LABELS[item.frequency]}
                                </span>
                                {item.group_name && (
                                    <span className="text-[10px] font-bold text-slate-550 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded-md">
                                        {item.group_name}
                                    </span>
                                )}
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                                    KH Khung {year}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 leading-tight mb-2">
                                {item.task_name}
                            </h1>

                            {/* Project Link */}
                            {project && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-2">
                                    <FolderOpen className="w-3.5 h-3.5 text-violet-400" />
                                    Thuộc dự án:
                                    <span className="font-semibold text-violet-600 dark:text-violet-400">
                                        {project.ProjectName} {project.ProjectCode ? `(${project.ProjectCode})` : ''}
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 mt-0.5 text-slate-400 hover:text-slate-650 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Action buttons row */}
                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20 rounded-xl transition-all border border-primary-100 dark:border-primary-500/20 active:scale-[0.98]"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            Sửa nhiệm vụ
                        </button>
                        {onCreateMonthlyTask && (
                            <button
                                onClick={() => onCreateMonthlyTask(item)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 rounded-xl transition-all border border-emerald-100 dark:border-emerald-500/20 active:scale-[0.98]"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Tạo KH tháng
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-xl transition-all border border-red-100 dark:border-red-500/20 ml-auto active:scale-[0.98]"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Xóa
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Body - 2 Columns Layout */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Deliverable/Output */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-slate-400" /> Sản phẩm / Kết quả đầu ra
                            </h3>
                            <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                <p className="whitespace-pre-wrap">{item.deliverable || "Chưa xác định sản phẩm đầu ra."}</p>
                            </div>
                        </div>

                        {/* Linked Monthly Plans */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                                <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-slate-400" /> Kế hoạch tháng đã liên kết
                                </h3>
                                {monthlyLinks.length > 0 && (
                                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-750 text-slate-550 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                                        {monthlyLinks.length}
                                    </span>
                                )}
                            </div>

                            {loadingLinks ? (
                                <div className="flex justify-center items-center py-6 text-slate-450 dark:text-slate-400 text-xs">
                                    Đang tải danh sách...
                                </div>
                            ) : monthlyLinks.length === 0 ? (
                                <div className="text-center py-8 px-4 border border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800 space-y-2">
                                    <CalendarClock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                                    <p className="text-xs text-slate-550 dark:text-slate-400 font-medium">Chưa có kế hoạch tháng nào được liên kết.</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Khi tạo KH tháng, chọn nhiệm vụ này từ KH khung.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {monthlyLinks.map((link: any) => {
                                        const plan = link.monthly_plan;
                                        const statusColors: Record<string, string> = {
                                            planned: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 ring-slate-200 dark:ring-slate-750',
                                            completed: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-950/20',
                                            incomplete: 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 ring-red-100 dark:ring-red-950/20',
                                            partial: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-450 ring-warning-100 dark:ring-warning-950/20',
                                            deferred: 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400 ring-blue-100 dark:ring-blue-950/20',
                                        };
                                        const statusLabels: Record<string, string> = {
                                            planned: 'Chưa báo cáo',
                                            completed: 'Hoàn thành',
                                            incomplete: 'Chưa xong',
                                            partial: 'Một phần',
                                            deferred: 'Chuyển tháng',
                                        };
                                        return (
                                            <div key={link.id} className="group flex items-center justify-between p-3.5 bg-slate-50 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-800/80 rounded-xl border border-slate-100/50 hover:border-slate-200 dark:border-slate-800/80 dark:hover:border-slate-700 shadow-none hover:shadow-sm transition-all duration-200 gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-750 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate transition-colors">
                                                        {link.task_name}
                                                    </p>
                                                    {plan && (
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                                                            Tháng {plan.plan_month}/{plan.plan_year} · {plan.department_code}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ring-1 ${statusColors[link.status] ?? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 ring-slate-200'}`}>
                                                    {link.deadline_note || statusLabels[link.status] || link.status}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right column (1/3) */}
                    <div className="space-y-6">
                        {/* Assignee / Responsible Department */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 space-y-4">
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" /> Đơn vị thực hiện
                            </h3>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-900/50">
                                    <Building2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-805 dark:text-slate-200 leading-snug">
                                        {item.department_code} - {DEPARTMENT_NAMES[item.department_code] ?? item.department_name}
                                    </p>
                                    <p className="text-[10px] uppercase font-bold text-primary-500 tracking-wider mt-0.5">Đơn vị chủ trì</p>
                                </div>
                            </div>

                            {((item.collaborating_dept_codes && item.collaborating_dept_codes.length > 0) || item.collaborating_text) && (
                                <div className="flex items-start gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                                        <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-805 dark:text-slate-200 space-y-1.5">
                                            {item.collaborating_dept_codes?.map(code => (
                                                <div key={code} className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    • {code} - {DEPARTMENT_NAMES[code as DepartmentCode] ?? code}
                                                </div>
                                            ))}
                                            {item.collaborating_text && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                                                    {item.collaborating_text}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider mt-1.5">Đơn vị phối hợp</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Period / Timeline */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 space-y-4">
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-slate-400" /> Thời gian thực hiện
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 mb-1 block tracking-wider">Bắt đầu</label>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-slate-400" /> {formatPeriod(item.start_period)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 mb-1 block tracking-wider">Hoàn thành</label>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-slate-400" /> {formatPeriod(item.end_period)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {item.notes && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
                                <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-slate-400" /> Ghi chú
                                </h3>
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                                    <p className="text-sm text-slate-650 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">{item.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnualPlanItemDetail;
