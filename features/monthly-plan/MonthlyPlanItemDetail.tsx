import React, { useState, useEffect } from 'react';
import {
    X, Edit2, Trash2, Link2, Briefcase, Users, ClipboardList,
    Calendar, CheckCircle2, XCircle, Clock, AlertCircle, ArrowRight,
    Plus, ExternalLink, Play, Eye, Target, CalendarDays, CheckSquare, MessageSquare, History, BarChart3, Building2, FolderOpen, ChevronRight
} from 'lucide-react';
import { MonthlyPlanItem, MONTHLY_STATUS_LABELS, MonthlyTaskStatus } from '../../types/plan.types';
import { useSlidePanel } from "../../context/SlidePanelContext";
import { supabase } from '../../lib/supabase';

// ─── Status config ────────────────────────────────────────────
const STATUS_CONFIG: Record<MonthlyTaskStatus, { label: string; icon: React.ReactNode; color: string; bg: string; ring: string }> = {
    planned:    { label: 'Chưa báo cáo', icon: <Clock className="w-3.5 h-3.5" />,        color: 'text-slate-600',  bg: 'bg-slate-100',  ring: 'ring-slate-300/20' },
    completed:  { label: 'Hoàn thành',   icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-500/20' },
    incomplete: { label: 'Chưa HT',      icon: <XCircle className="w-3.5 h-3.5" />,      color: 'text-red-600',    bg: 'bg-red-50',     ring: 'ring-red-500/20' },
    partial:    { label: 'Một phần',     icon: <AlertCircle className="w-3.5 h-3.5" />,  color: 'text-warning-600',  bg: 'bg-warning-50',   ring: 'ring-warning-500/20' },
    deferred:   { label: 'Chuyển tháng', icon: <ArrowRight className="w-3.5 h-3.5" />,   color: 'text-blue-600',   bg: 'bg-blue-50',    ring: 'ring-blue-500/20' },
};



interface Props {
    item: MonthlyPlanItem;
    month: number;
    year: number;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
}

const MonthlyPlanItemDetail: React.FC<Props> = (props) => {
    const { item, month, year, onEdit, onDelete, onClose } = props;
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG['planned'];
    const [annualItem, setAnnualItem] = useState<any>(null);
    const [project, setProject] = useState<any>(null);
    const { openPanel } = useSlidePanel();

    useEffect(() => {
        if (!item.annual_plan_item_id) { setAnnualItem(null); return; }
        supabase
            .from('annual_plan_items')
            .select('id, task_name, group_name, frequency, responsible_text')
            .eq('id', item.annual_plan_item_id)
            .single()
            .then(({ data }: any) => setAnnualItem(data));
    }, [item.annual_plan_item_id]);

    useEffect(() => {
        if (!item.project_id) { setProject(null); return; }
        supabase
            .from('projects')
            .select('"ProjectID", "ProjectName", "ProjectCode"')
            .eq('"ProjectID"', item.project_id)
            .maybeSingle()
            .then(({ data }: any) => setProject(data));
    }, [item.project_id]);

    const handleDelete = () => {
        if (!confirm('Xóa nhiệm vụ này? Thao tác không thể hoàn tác.')) return;
        onDelete();
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate- animate-in fade-in duration-300">
            {/* Header Toolbar */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm shrink-0">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary-500" />
                    Chi tiết Kế hoạch tháng
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onEdit}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                        title="Sửa"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Xóa"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative">
                
                {/* ══════════ HEADER CARD ══════════ */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className={`h-1 ${cfg.bg.replace('bg-', 'bg-').replace('50', '500')}`} />
                    <div className="p-4">
                        <div className="flex flex-col lg:flex-row justify-between gap-5">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.color} ring-1 ${cfg.ring}`}>
                                        {cfg.icon} {MONTHLY_STATUS_LABELS[item.status]}
                                    </span>
                                    {item.group_name && (
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1.5 rounded-md">
                                            {item.group_name}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1.5 rounded-md">
                                        Tháng {month}/{year}
                                    </span>
                                </div>

                                <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight mb-2">
                                    {item.task_name}
                                </h1>

                                {(project || annualItem) && (
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-3">
                                        {project && (
                                            <span className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 px-2 py-1 rounded-md text-xs font-medium border border-violet-100 dark:border-violet-500/20">
                                                <FolderOpen className="w-3.5 h-3.5" />
                                                {project.ProjectName}
                                            </span>
                                        )}
                                        {annualItem && (
                                            <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md text-xs font-medium border border-blue-100 dark:border-blue-500/20">
                                                <Link2 className="w-3.5 h-3.5" />
                                                KH Khung năm {year}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════ CONTENT GRID ══════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ── LEFT 2/3 ── */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Description */}
                        {(item.deliverable || item.notes) && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                                <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4" /> Nội dung chi tiết
                                </h3>
                                
                                {item.deliverable && (
                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-slate-500 mb-1">Kết quả đầu ra</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{item.deliverable}</p>
                                    </div>
                                )}
                                
                                {item.notes && (
                                    <div className="bg-slate-50 dark:bg-slate- rounded-xl p-3 border border-slate-100">
                                        <p className="text-xs font-bold text-slate-500 mb-1">Ghi chú</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{item.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT 1/3 ── */}
                    <div className="space-y-6">

                        {/* Nguồn gốc & Liên kết */}
                        {(project || annualItem) && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Link2 className="w-4 h-4" /> Nguồn gốc & Liên kết
                                </h3>
                                <div className="space-y-4">
                                    {project && (
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-violet-500 tracking-wider mb-1">Thuộc dự án</p>
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <FolderOpen className="w-4 h-4 text-violet-400 shrink-0" />
                                                {project.ProjectName}
                                            </div>
                                        </div>
                                    )}
                                    {annualItem && (
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-blue-500 tracking-wider mb-1">Kế hoạch khung năm {year}</p>
                                            <div className="flex items-start gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <Target className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                                <span>{annualItem.task_name}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Timeline / Deadlines */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Thời gian
                            </h3>
                            <div className="space-y-4">
                                {item.deadline_note && (
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Thời hạn</p>
                                        <p className="text-sm font-medium text-slate-700">{item.deadline_note}</p>
                                    </div>
                                )}
                                {item.due_date && (
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Ngày cụ thể</p>
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            {new Date(item.due_date).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* People */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Phân công
                            </h3>
                            <div className="space-y-4">
                                {(() => {
                                    const names = item.staff_names && item.staff_names.length > 0
                                        ? item.staff_names
                                        : item.staff_name ? [item.staff_name] : [];
                                    if (names.length === 0) return null;
                                    return names.map((name, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0 border border-primary-100">
                                                <span className="text-xs font-bold text-primary-600">{name.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">{name}</p>
                                                <p className="text-[10px] uppercase font-bold text-primary-500 tracking-wider">Phụ trách / Thực hiện</p>
                                            </div>
                                        </div>
                                    ));
                                })()}
                                {item.dept_head_name && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-warning-50 flex items-center justify-center shrink-0 border border-warning-100">
                                            <span className="text-xs font-bold text-warning-600">{item.dept_head_name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{item.dept_head_name}</p>
                                            <p className="text-[10px] uppercase font-bold text-warning-500 tracking-wider">Lãnh đạo phòng</p>
                                        </div>
                                    </div>
                                )}
                                {item.ban_head_name && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                                            <span className="text-xs font-bold text-rose-600">{item.ban_head_name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{item.ban_head_name}</p>
                                            <p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Lãnh đạo Ban</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Report Results */}
                        {(item.completion_result || item.incomplete_reason) && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> Báo cáo
                                </h3>
                                <div className="space-y-3">
                                    {item.completion_result && (
                                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                                            <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-1">Kết quả thực hiện</p>
                                            <p className="text-sm text-emerald-800">{item.completion_result}</p>
                                        </div>
                                    )}
                                    {item.incomplete_reason && (
                                        <div className="bg-red-50/50 border border-red-100 rounded-xl p-3">
                                            <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider mb-1">Lý do chậm trễ</p>
                                            <p className="text-sm text-red-800">{item.incomplete_reason}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthlyPlanItemDetail;
