import React, { useState, useEffect, useMemo } from 'react';
import {
    X, Edit2, Trash2, Link2, Users, ClipboardList, CalendarClock,
    Plus, CalendarDays,
} from 'lucide-react';
import { AnnualPlanItem, FREQUENCY_LABELS } from '../../types/plan.types';
import { supabase as _supabase } from '../../lib/supabase';
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

interface Props {
    item: AnnualPlanItem;
    year: number;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
    onCreateMonthlyTask?: (annualItemId: string) => void;
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
            .from('monthly_plan_items')
            .select('id, task_name, status, deadline_note, monthly_plan:monthly_plans(plan_month, plan_year, department_code)')
            .eq('annual_plan_item_id', item.id)
            .order('created_at', { ascending: false })
            .then(({ data }: any) => {
                setMonthlyLinks((data as any[]) ?? []);
                setLoadingLinks(false);
            });
    }, [item.id]);

    const handleDelete = () => {
        if (!confirm('Xóa nhiệm vụ này khỏi KH khung? Thao tác không thể hoàn tác.')) return;
        onDelete();
    };

    const freqColor = FREQUENCY_COLORS[item.frequency] ?? 'bg-slate-100 text-slate-600';

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden animate-in fade-in duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${freqColor}`}>
                                    {FREQUENCY_LABELS[item.frequency]}
                                </span>
                                {item.group_name && (
                                    <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">
                                        {item.group_name}
                                    </span>
                                )}
                                <span className="text-xs text-slate-400">KH khung {year}</span>
                            </div>
                            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                                {item.task_name}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 mt-0.5"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Action bar */}
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20 rounded-lg transition-colors border border-primary-100 dark:border-primary-500/20"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            Sửa
                        </button>
                        {onCreateMonthlyTask && (
                            <button
                                onClick={() => onCreateMonthlyTask(item.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-500/20"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Tạo KH tháng
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-lg transition-colors ml-auto border border-red-100 dark:border-red-500/20"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Xóa
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">

                    {/* ── Thông tin ── */}
                    <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800">
                        <p className="section-title"><ClipboardList className="w-3.5 h-3.5" />Thông tin nhiệm vụ</p>
                        <div className="mt-3 space-y-3">
                            {item.deliverable && (
                                <div>
                                    <p className="text-xs text-slate-400 mb-0.5">Sản phẩm / Kết quả đầu ra</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{item.deliverable}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-slate-400 mb-0.5">Thời gian bắt đầu</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{item.start_period || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-0.5">Thời gian hoàn thành</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{item.end_period || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Phân công ── */}
                    {(item.responsible_ids?.length || item.responsible_text || item.collaborating_text) && (
                        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800">
                            <p className="section-title"><Users className="w-3.5 h-3.5" />Phân công</p>
                            <div className="mt-3 space-y-3">
                                {/* Nhân viên thực hiện — từ responsible_ids */}
                                {item.responsible_ids && item.responsible_ids.length > 0 ? (
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1.5">Thực hiện</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {item.responsible_ids.map(id => {
                                                const emp = empMap[id];
                                                return (
                                                    <button
                                                        key={id}
                                                        onClick={() => openEmployeePanel(id)}
                                                        className="flex items-center gap-1.5 text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50 px-2 py-1 rounded-full transition-colors cursor-pointer"
                                                    >
                                                        {emp?.avatar ? (
                                                            <img src={emp.avatar} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                                                        ) : (
                                                            <span className="w-4 h-4 rounded-full bg-primary-200 dark:bg-primary-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                                                                {emp?.name?.charAt(emp.name.lastIndexOf(' ') + 1) ?? '?'}
                                                            </span>
                                                        )}
                                                        {emp?.name ?? id}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : item.responsible_text ? (
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Thực hiện</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.responsible_text}</p>
                                    </div>
                                ) : null}
                                {/* Phối hợp */}
                                {item.collaborating_text && (
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Phối hợp</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.collaborating_text}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Dự án liên kết ── */}
                    {project && (
                        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800">
                            <p className="section-title"><Link2 className="w-3.5 h-3.5" />Dự án liên kết</p>
                            <div className="mt-2 flex items-start gap-2 p-2.5 bg-violet-50 dark:bg-violet-500/10 rounded-lg">
                                <span className="text-violet-400 text-xs mt-0.5">📁</span>
                                <div>
                                    <p className="text-sm font-medium text-violet-700 dark:text-violet-400">{project.ProjectName}</p>
                                    {project.ProjectCode && (
                                        <p className="text-xs text-violet-400 dark:text-violet-500">{project.ProjectCode}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── KH tháng đã liên kết ── */}
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="section-title">
                                <CalendarDays className="w-3.5 h-3.5" />
                                Kế hoạch tháng đã liên kết
                                {monthlyLinks.length > 0 && (
                                    <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-normal border border-slate-200 dark:border-slate-700">
                                        {monthlyLinks.length}
                                    </span>
                                )}
                            </p>
                        </div>
                        {loadingLinks ? (
                            <p className="text-xs text-slate-400 text-center py-3">Đang tải...</p>
                        ) : monthlyLinks.length === 0 ? (
                            <div className="text-center py-5 border-2 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800 rounded-xl">
                                <CalendarClock className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">Chưa có kế hoạch tháng nào liên kết</p>
                                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Khi tạo KH tháng, chọn nhiệm vụ này từ KH khung</p>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {monthlyLinks.map((link: any) => {
                                    const plan = link.monthly_plan;
                                    const statusColors: Record<string, string> = {
                                        planned: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                                        completed: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
                                        incomplete: 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400',
                                        partial: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400',
                                        deferred: 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400',
                                    };
                                    return (
                                        <div key={link.id} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{link.task_name}</p>
                                                {plan && (
                                                    <p className="text-xs text-slate-400">
                                                        Tháng {plan.plan_month}/{plan.plan_year} · {plan.department_code}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${statusColors[link.status] ?? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                {link.deadline_note ?? link.status}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    {item.notes && (
                        <div className="px-6 pb-4">
                            <p className="section-title">Ghi chú</p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">{item.notes}</p>
                        </div>
                    )}
                </div>

            <style>{`
                .section-title {
                    display: flex; align-items: center; gap: 0.375rem;
                    font-size: 0.75rem; font-weight: 600;
                    text-transform: uppercase; letter-spacing: 0.05em;
                    color: #64748b;
                }
                .dark .section-title { color: #94a3b8; }
            `}</style>
        </div>
    );
};

export default AnnualPlanItemDetail;
