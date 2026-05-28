import React from 'react';
import { AlertTriangle, AlertCircle, Users } from 'lucide-react';
import type { ProjectBriefingData } from '../../../../services/DashboardService';

interface Props {
    incompleteTasks: ProjectBriefingData['incompleteTasks'];
    inProgressTasks: ProjectBriefingData['inProgressTasks'];
    issues: ProjectBriefingData['issues'];
}

export const IssuesColumn: React.FC<Props> = ({ incompleteTasks, inProgressTasks, issues }) => {
    const totalCount = incompleteTasks.length + inProgressTasks.length + issues.length;
    return (
        <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 border-b border-border pb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <h5 className="text-[11px] font-black uppercase tracking-wider text-red-700 dark:text-red-400">Tồn tại & Vấn đề ({totalCount})</h5>
            </div>
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {inProgressTasks.map(t => (
                    <div key={t.id} className="p-2.5 bg-blue-50/10 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-950/50 rounded-lg space-y-1">
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-normal">{t.title}</p>
                        <div className="space-y-1 mt-1">
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-[9px] font-medium text-txt-muted flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {t.assigneeName}
                                </span>
                                <span className="text-[8px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 rounded">Đang làm</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full flex-1 overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${t.progress}%` }} />
                                </div>
                                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">{t.progress}%</span>
                            </div>
                            {t.obstacles && (
                                <div className="text-[10px] bg-amber-50/60 dark:bg-amber-950/15 p-1.5 rounded border-l-2 border-amber-400 text-txt-secondary leading-tight">
                                    <span className="font-bold text-[9px] text-amber-600 dark:text-amber-400 block uppercase tracking-wide flex items-center gap-1">
                                        <AlertTriangle className="w-2.5 h-2.5" /> Khó khăn/Vướng mắc:
                                    </span>
                                    {t.obstacles}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {incompleteTasks.map(t => (
                    <div key={t.id} className="p-2.5 bg-red-50/10 dark:bg-red-950/10 border border-red-100/50 dark:border-red-950/50 rounded-lg space-y-1">
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-normal">{t.title}</p>
                        <div className="flex justify-between items-center gap-2">
                            <span className="text-[9px] font-medium text-txt-muted flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {t.assigneeName}
                            </span>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded">Chưa HT</span>
                        </div>
                        {t.incompleteReason && (
                            <div className="text-[10px] bg-bg-subtle p-1.5 rounded border-l-2 border-rose-500 text-txt-secondary italic leading-tight mt-1">
                                <span className="font-bold text-[9px] text-red-600 block not-italic uppercase tracking-wide">Nguyên nhân ({t.incompleteReasonType || 'Chưa phân loại'}):</span>
                                {t.incompleteReason}
                            </div>
                        )}
                        {t.obstacles && (
                            <div className="text-[10px] bg-amber-50/60 dark:bg-amber-950/15 p-1.5 rounded border-l-2 border-amber-400 text-txt-secondary leading-tight">
                                <span className="font-bold text-[9px] text-amber-600 dark:text-amber-400 block uppercase tracking-wide flex items-center gap-1">
                                    <AlertTriangle className="w-2.5 h-2.5" /> Khó khăn/Vướng mắc:
                                </span>
                                {t.obstacles}
                            </div>
                        )}
                    </div>
                ))}

                {issues.map(i => (
                    <div key={i.id} className="p-2.5 bg-amber-50/10 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-950/50 rounded-lg space-y-1">
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-normal flex items-start gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{i.title}</span>
                        </p>
                        <div className="flex justify-between items-center gap-2">
                            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Vướng mắc gói thầu</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${i.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {i.severity === 'high' ? 'Nghiêm trọng' : 'Thường'}
                            </span>
                        </div>
                    </div>
                ))}

                {totalCount === 0 && (
                    <p className="text-[10px] italic text-txt-muted text-center py-3 bg-bg-surface rounded-lg border border-border border-dashed">
                        Không có tồn tại, vướng mắc
                    </p>
                )}
            </div>
        </div>
    );
};

export default IssuesColumn;
