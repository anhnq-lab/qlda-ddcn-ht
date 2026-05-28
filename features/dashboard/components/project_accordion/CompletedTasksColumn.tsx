import React from 'react';
import { CheckCircle2, Users } from 'lucide-react';
import type { ProjectBriefingData } from '../../../../services/DashboardService';

interface Props {
    tasks: ProjectBriefingData['completedTasks'];
}

export const CompletedTasksColumn: React.FC<Props> = ({ tasks }) => (
    <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 border-b border-border pb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Kết quả nổi bật ({tasks.length})</h5>
        </div>
        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {tasks.map(t => (
                <div key={t.id} className="p-2.5 bg-bg-surface border border-border rounded-lg shadow-sm space-y-1 hover:shadow transition-shadow">
                    <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-normal">{t.title}</p>
                    <div className="flex justify-between items-center gap-2">
                        <span className="text-[9px] font-medium text-txt-muted flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {t.assigneeName}
                        </span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 rounded">
                            Hoàn thành
                        </span>
                    </div>
                    {t.completionResult && (
                        <div className="text-[10px] bg-bg-subtle p-1.5 rounded border-l-2 border-emerald-500 text-txt-secondary italic leading-tight mt-1">
                            <span className="font-bold text-[9px] text-emerald-600 block not-italic uppercase tracking-wide">Sản phẩm bàn giao:</span>
                            {t.completionResult}
                        </div>
                    )}
                </div>
            ))}
            {tasks.length === 0 && (
                <p className="text-[10px] italic text-txt-muted text-center py-3 bg-bg-surface rounded-lg border border-border border-dashed">
                    Không có công việc hoàn thành
                </p>
            )}
        </div>
    </div>
);

export default CompletedTasksColumn;
