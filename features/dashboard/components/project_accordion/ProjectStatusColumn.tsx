import React from 'react';
import { Building2 } from 'lucide-react';
import { formatCurrency } from '../../../../utils/format';
import type { ProjectBriefingData } from '../../../../services/DashboardService';

interface Props {
    proj: ProjectBriefingData;
}

export const ProjectStatusColumn: React.FC<Props> = ({ proj }) => (
    <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 border-b border-border pb-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <h5 className="text-[11px] font-black uppercase tracking-wider text-txt-secondary">Tình hình & Giải ngân</h5>
        </div>
        <div className="bg-bg-surface p-3 rounded-lg border border-border space-y-2.5 shadow-sm">
            <div>
                <span className="text-[10px] text-txt-muted font-bold">Trạng thái dự án</span>
                <p className="text-xs font-bold text-txt-primary mt-0.5">{proj.statusLabel}</p>
            </div>
            {proj.projectId !== 'internal_admin' && (
                <div>
                    <span className="text-[10px] text-txt-muted font-bold">Tiến độ hoàn thành</span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-2 bg-bg-muted rounded-full flex-1 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${proj.progress}%` }} />
                        </div>
                        <span className="text-[11px] font-black text-txt-secondary">{proj.progress}%</span>
                    </div>
                </div>
            )}
            <div>
                <span className="text-[10px] text-txt-muted font-bold">Giải ngân trong tháng</span>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {proj.disbursedAmount > 0 ? formatCurrency(proj.disbursedAmount) : '0 VNĐ'}
                </p>
            </div>
        </div>
    </div>
);

export default ProjectStatusColumn;
