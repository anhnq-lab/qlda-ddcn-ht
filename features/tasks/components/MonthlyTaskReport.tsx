import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Download, Users } from 'lucide-react';
import { DashboardService, type TaskBriefingSummary, type TaskBriefingCategoryGroup } from '../../../services/DashboardService';
import { TASK_CATEGORY_COLORS, type TaskCategory } from '../../../types/task.types';
import { exportDepartmentTaskReport, exportConsolidatedBriefingReport } from '../exportTaskMonthlyReport';

interface Props {
    month: number;
    year: number;
}

const STATUS_LABELS: Record<string, string> = {
    done: 'Hoàn thành',
    in_progress: 'Đang thực hiện',
    incomplete: 'Chưa HT',
    todo: 'Chưa bắt đầu',
};

export const MonthlyTaskReport: React.FC<Props> = ({ month, year }) => {
    const { data: briefing = [], isLoading } = useQuery({
        queryKey: ['taskBriefing', month, year],
        queryFn: () => DashboardService.getTaskBriefingSummary(month, year),
        staleTime: 5 * 60 * 1000,
    });

    const [selectedDept, setSelectedDept] = useState<string>('all');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggle = (key: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (briefing.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 text-sm">
                Không có dữ liệu công việc tháng {month}/{year}
            </div>
        );
    }

    const totalAll = briefing.reduce((s, d) => s + d.total_tasks, 0);
    const completedAll = briefing.reduce((s, d) => s + d.completed, 0);
    const rateAll = totalAll > 0 ? Math.round((completedAll / totalAll) * 1000) / 10 : 0;
    const filteredDepts = selectedDept === 'all' ? briefing : briefing.filter(d => d.department_name === selectedDept);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-black uppercase tracking-tight">
                        Báo cáo công việc T{month}/{year}
                    </h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${rateAll >= 80 ? 'bg-emerald-100 text-emerald-700' : rateAll >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {completedAll}/{totalAll} ({rateAll}%)
                    </span>
                </div>
                <button
                    onClick={() => exportConsolidatedBriefingReport(month, year)}
                    className="btn btn-outline text-xs flex items-center gap-1"
                >
                    <Download className="w-3.5 h-3.5" /> Xuất Excel tổng hợp
                </button>
            </div>

            {/* Department tabs */}
            <div className="flex flex-wrap gap-1.5">
                <button
                    onClick={() => setSelectedDept('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedDept === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Tất cả
                </button>
                {briefing.map(d => (
                    <button
                        key={d.department_name}
                        onClick={() => setSelectedDept(d.department_name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedDept === d.department_name ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {d.department_name.replace('Phòng ', '')}
                    </button>
                ))}
            </div>

            {/* Summary table */}
            {selectedDept === 'all' && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <th className="px-4 py-3 text-left">Phòng ban</th>
                                <th className="px-3 py-3 text-center">Tổng</th>
                                <th className="px-3 py-3 text-center">HT</th>
                                <th className="px-3 py-3 text-center">Đang làm</th>
                                <th className="px-3 py-3 text-center">Chưa HT</th>
                                <th className="px-3 py-3 text-center">Tỷ lệ</th>
                                <th className="px-3 py-3 text-center">Xuất</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {briefing.map(dept => (
                                <tr key={dept.department_name} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedDept(dept.department_name)}>
                                    <td className="px-4 py-3 font-bold">{dept.department_name}</td>
                                    <td className="px-3 py-3 text-center font-bold">{dept.total_tasks}</td>
                                    <td className="px-3 py-3 text-center text-emerald-600 font-bold">{dept.completed}</td>
                                    <td className="px-3 py-3 text-center text-blue-600 font-bold">{dept.in_progress}</td>
                                    <td className="px-3 py-3 text-center text-rose-600 font-bold">{dept.incomplete}</td>
                                    <td className="px-3 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${dept.completion_rate >= 80 ? 'bg-emerald-100 text-emerald-700' : dept.completion_rate >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                            {dept.completion_rate}%
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); exportDepartmentTaskReport(month, year, dept.department_name); }}
                                            className="text-blue-600 hover:text-blue-800"
                                            title="Xuất Excel phòng"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Detail per department */}
            {filteredDepts.filter(() => selectedDept !== 'all').map(dept => (
                <DeptDetail
                    key={dept.department_name}
                    dept={dept}
                    month={month}
                    year={year}
                    expanded={expanded}
                    onToggle={toggle}
                />
            ))}
        </div>
    );
};

function DeptDetail({ dept, month, year, expanded, onToggle }: {
    dept: TaskBriefingSummary;
    month: number;
    year: number;
    expanded: Set<string>;
    onToggle: (key: string) => void;
}) {
    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                <div>
                    <span className="font-bold">{dept.department_name}</span>
                    <span className="ml-2 text-sm text-slate-500">
                        {dept.completed}/{dept.total_tasks} HT ({dept.completion_rate}%)
                    </span>
                </div>
                <button
                    onClick={() => exportDepartmentTaskReport(month, year, dept.department_name)}
                    className="btn btn-outline text-xs px-2 py-1 flex items-center gap-1"
                >
                    <Download className="w-3.5 h-3.5" /> Excel
                </button>
            </div>

            <div className="divide-y divide-slate-100">
                {dept.by_category.map((group, gi) => {
                    const catKey = `${dept.department_name}-${group.category}`;
                    const isOpen = expanded.has(catKey);
                    const colors = TASK_CATEGORY_COLORS[group.category as TaskCategory];

                    return (
                        <div key={group.category}>
                            <button
                                onClick={() => onToggle(catKey)}
                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                                    <span className={`text-xs font-bold uppercase ${colors?.text || 'text-slate-600'}`}>
                                        {String.fromCharCode(73 + gi)}. {group.category_label}
                                    </span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${group.completed === group.total ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {group.completed}/{group.total}
                                </span>
                            </button>

                            {isOpen && (
                                <table className="w-full text-xs">
                                    <thead className="bg-white">
                                        <tr className="text-[9px] font-black uppercase text-slate-400">
                                            <th className="px-3 py-2 text-center w-8">STT</th>
                                            <th className="px-3 py-2 text-left">Nội dung</th>
                                            <th className="px-3 py-2 text-left hidden md:table-cell">Dự án</th>
                                            <th className="px-3 py-2 text-left">Kết quả</th>
                                            <th className="px-3 py-2 text-left hidden sm:table-cell">Cán bộ</th>
                                            <th className="px-3 py-2 text-center w-10">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {group.items.map((item, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-3 py-2 text-center text-slate-400">{i + 1}</td>
                                                <td className="px-3 py-2 font-medium max-w-[200px] truncate" title={item.title}>{item.title}</td>
                                                <td className="px-3 py-2 text-slate-500 hidden md:table-cell max-w-[150px] truncate">{item.project_name || '—'}</td>
                                                <td className="px-3 py-2 max-w-[180px] truncate">
                                                    {item.status === 'done' && <span className="text-emerald-600">{item.completion_result || 'Hoàn thành'}</span>}
                                                    {item.status === 'incomplete' && <span className="text-rose-600">{item.incomplete_reason || 'Chưa HT'}</span>}
                                                    {item.status === 'in_progress' && <span className="text-blue-600">{item.completion_result || 'Đang TH'}</span>}
                                                    {!['done', 'incomplete', 'in_progress'].includes(item.status) && <span className="text-slate-400">—</span>}
                                                </td>
                                                <td className="px-3 py-2 text-slate-500 hidden sm:table-cell">{item.assignee_name}</td>
                                                <td className="px-3 py-2 text-center font-bold">
                                                    <span className={item.progress >= 100 ? 'text-emerald-600' : item.progress >= 50 ? 'text-blue-600' : 'text-slate-400'}>
                                                        {item.progress}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
