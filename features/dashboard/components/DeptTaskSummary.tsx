import React, { useMemo } from 'react';
import { Users, Download, ChevronRight } from 'lucide-react';
import { TASK_CATEGORY_COLORS, type TaskCategory } from '../../../types/task.types';
import { exportDepartmentTaskReport, exportConsolidatedBriefingReport } from '../../tasks/exportTaskMonthlyReport';
import type { TaskBriefingSummary } from '../../../services/DashboardService';

interface DeptTaskSummaryProps {
    taskBriefing: TaskBriefingSummary[];
    selectedDept: string;
    onSelectDept: (dept: string) => void;
    expandedCategories: Set<string>;
    onToggleCategory: (key: string) => void;
    selectedMonth: number;
    selectedYear: number;
}

/**
 * Department task summary section.
 * Shows either:
 * - Summary table across all departments (selectedDept === 'all')
 * - Detailed category breakdown for a single department
 *
 * Extracted from MonthlyBriefingTab IIFE pattern which was re-executing on every render.
 */
export const DeptTaskSummary: React.FC<DeptTaskSummaryProps> = React.memo(({
    taskBriefing,
    selectedDept,
    onSelectDept,
    expandedCategories,
    onToggleCategory,
    selectedMonth,
    selectedYear,
}) => {
    const { totalAll, completedAll, rateAll } = useMemo(() => {
        const totalAll = taskBriefing.reduce((s, d) => s + d.total_tasks, 0);
        const completedAll = taskBriefing.reduce((s, d) => s + d.completed, 0);
        const rateAll = totalAll > 0 ? Math.round((completedAll / totalAll) * 1000) / 10 : 0;
        return { totalAll, completedAll, rateAll };
    }, [taskBriefing]);

    const filteredDepts = useMemo(
        () => selectedDept === 'all' ? taskBriefing : taskBriefing.filter(d => d.department_name === selectedDept),
        [taskBriefing, selectedDept]
    );

    if (taskBriefing.length === 0) {
        return (
            <div className="bg-bg-surface rounded-2xl border border-border shadow-sm p-10 text-center">
                <p className="text-txt-muted text-sm italic">Không có dữ liệu công việc tháng này.</p>
            </div>
        );
    }

    const rateColorClass = rateAll >= 80 ? 'bg-emerald-100 text-emerald-700' : rateAll >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

    return (
        <div className="bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-border">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-txt-primary uppercase tracking-tight">
                            Tổng hợp công việc các phòng ban
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-bold text-emerald-600">{completedAll}/{totalAll}</span>
                        <span className="text-txt-muted">hoàn thành</span>
                        <span className={`font-black text-sm px-2 py-0.5 rounded-lg ${rateColorClass}`}>
                            {rateAll}%
                        </span>
                        <button
                            id="btn-export-excel-all"
                            onClick={() => exportConsolidatedBriefingReport(selectedMonth, selectedYear)}
                            className="ml-2 btn btn-outline text-xs px-2.5 py-1 flex items-center gap-1 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            aria-label="Xuất Excel tổng hợp tất cả phòng ban"
                        >
                            <Download className="w-3.5 h-3.5" /> Xuất Excel tổng hợp
                        </button>
                    </div>
                </div>

                {/* Department tabs */}
                <div className="flex flex-wrap gap-1.5 mt-4" role="tablist" aria-label="Chọn phòng ban">
                    <button
                        role="tab"
                        aria-selected={selectedDept === 'all'}
                        onClick={() => onSelectDept('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedDept === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-bg-subtle text-txt-secondary hover:bg-bg-app'}`}
                    >
                        Tất cả
                    </button>
                    {taskBriefing.map(d => (
                        <button
                            key={d.department_name}
                            role="tab"
                            aria-selected={selectedDept === d.department_name}
                            onClick={() => onSelectDept(d.department_name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedDept === d.department_name ? 'bg-blue-600 text-white shadow-sm' : 'bg-bg-subtle text-txt-secondary hover:bg-bg-app'}`}
                        >
                            {d.department_name.replace('Phòng ', '')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary table — all departments */}
            {selectedDept === 'all' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm" role="grid" aria-label="Tổng hợp công việc các phòng ban">
                        <thead className="bg-bg-subtle">
                            <tr className="text-[11px] font-black uppercase tracking-widest text-txt-muted">
                                <th className="px-4 py-3 text-left" scope="col">Phòng ban</th>
                                <th className="px-3 py-3 text-center" scope="col">Tổng CV</th>
                                <th className="px-3 py-3 text-center" scope="col">Hoàn thành</th>
                                <th className="px-3 py-3 text-center" scope="col">Đang làm</th>
                                <th className="px-3 py-3 text-center" scope="col">Chưa HT</th>
                                <th className="px-3 py-3 text-center" scope="col">Tỷ lệ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {taskBriefing.map(dept => {
                                const cr = dept.completion_rate;
                                const crClass = cr >= 80 ? 'bg-emerald-100 text-emerald-700' : cr >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
                                return (
                                    <tr
                                        key={dept.department_name}
                                        className="hover:bg-bg-app cursor-pointer"
                                        onClick={() => onSelectDept(dept.department_name)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Xem chi tiết ${dept.department_name}`}
                                        onKeyDown={e => e.key === 'Enter' && onSelectDept(dept.department_name)}
                                    >
                                        <td className="px-4 py-3 font-bold text-txt-primary">{dept.department_name}</td>
                                        <td className="px-3 py-3 text-center font-bold">{dept.total_tasks}</td>
                                        <td className="px-3 py-3 text-center text-emerald-600 font-bold">{dept.completed}</td>
                                        <td className="px-3 py-3 text-center text-blue-600 font-bold">{dept.in_progress}</td>
                                        <td className="px-3 py-3 text-center text-rose-600 font-bold">{dept.incomplete}</td>
                                        <td className="px-3 py-3 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-black ${crClass}`}>
                                                {cr}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Detail view — single department */}
            {filteredDepts.filter(() => selectedDept !== 'all').map(dept => (
                <div key={dept.department_name} className="p-5 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-txt-primary">{dept.department_name}</h4>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-txt-muted">
                                <span className="font-bold text-emerald-600">{dept.completed}</span>/{dept.total_tasks} hoàn thành ({dept.completion_rate}%)
                            </span>
                            <button
                                id={`btn-export-excel-dept-${dept.department_name}`}
                                onClick={() => exportDepartmentTaskReport(selectedMonth, selectedYear, dept.department_name)}
                                className="btn btn-outline text-xs px-2 py-1 flex items-center gap-1 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                                aria-label={`Xuất Excel phòng ${dept.department_name}`}
                            >
                                <Download className="w-3.5 h-3.5" /> Xuất Excel phòng
                            </button>
                        </div>
                    </div>

                    {dept.by_category.map((catGroup, catIdx) => {
                        const catKey = `${dept.department_name}-${catGroup.category}`;
                        const isExpanded = expandedCategories.has(catKey);
                        const catColors = TASK_CATEGORY_COLORS[catGroup.category as TaskCategory];
                        const catLetter = catIdx < 26 ? String.fromCharCode(65 + catIdx) : String(catIdx + 1);

                        return (
                            <div key={catGroup.category} className="border border-border rounded-xl overflow-hidden">
                                <button
                                    onClick={() => onToggleCategory(catKey)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-subtle hover:bg-bg-app transition-colors"
                                    aria-expanded={isExpanded}
                                    aria-controls={`cat-detail-${catKey}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        <span className={`text-xs font-bold uppercase tracking-wider ${catColors?.text || 'text-slate-600'}`}>
                                            {catLetter}. {catGroup.category_label}
                                        </span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${catGroup.completed === catGroup.total ? 'bg-emerald-100 text-emerald-700' : 'bg-bg-subtle text-txt-secondary'}`}>
                                        {catGroup.completed}/{catGroup.total}
                                    </span>
                                </button>

                                {isExpanded && (
                                    <div id={`cat-detail-${catKey}`} className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-bg-subtle">
                                                <tr className="text-[11px] font-black uppercase tracking-widest text-txt-muted">
                                                    <th className="px-3 py-2 text-center w-8" scope="col">STT</th>
                                                    <th className="px-3 py-2 text-left" scope="col">Nội dung</th>
                                                    <th className="px-3 py-2 text-left hidden md:table-cell" scope="col">Dự án</th>
                                                    <th className="px-3 py-2 text-left" scope="col">Kết quả</th>
                                                    <th className="px-3 py-2 text-left hidden sm:table-cell" scope="col">Cán bộ PT</th>
                                                    <th className="px-3 py-2 text-center w-12" scope="col">%</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {catGroup.items.map((item, i) => (
                                                    <tr key={i} className="hover:bg-bg-app">
                                                        <td className="px-3 py-2 text-center text-txt-muted">{i + 1}</td>
                                                        <td className="px-3 py-2 font-medium text-txt-primary max-w-[200px] truncate" title={item.title}>
                                                            {item.title}
                                                        </td>
                                                        <td className="px-3 py-2 text-txt-muted hidden md:table-cell max-w-[150px] truncate">
                                                            {item.project_name || '—'}
                                                        </td>
                                                        <td className="px-3 py-2 max-w-[200px] truncate" title={item.completion_result || item.incomplete_reason || ''}>
                                                            {item.status === 'done' && <span className="text-emerald-600">{item.completion_result || 'Hoàn thành'}</span>}
                                                            {item.status === 'incomplete' && <span className="text-rose-600">{item.incomplete_reason || 'Chưa HT'}</span>}
                                                            {item.status === 'in_progress' && <span className="text-blue-600">{item.completion_result || 'Đang thực hiện'}</span>}
                                                            {!['done', 'incomplete', 'in_progress'].includes(item.status) && <span className="text-slate-400">—</span>}
                                                        </td>
                                                        <td className="px-3 py-2 text-txt-muted hidden sm:table-cell">{item.assignee_name}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className={`font-bold ${item.progress >= 100 ? 'text-emerald-600' : item.progress >= 50 ? 'text-blue-600' : 'text-slate-400'}`}>
                                                                {item.progress}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
});

DeptTaskSummary.displayName = 'DeptTaskSummary';
