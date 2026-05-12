import React, { useMemo } from 'react';
import { ListFilter } from 'lucide-react';
import { PROJECT_CURRENT_STATUS_CONFIG } from '../../../types';

export interface ProjectDetailedStatusWidgetProps {
    projects: any[];
    onSegmentClick?: (statusId: number, statusLabel: string) => void;
}

const ProjectDetailedStatusWidget: React.FC<ProjectDetailedStatusWidgetProps> = ({ projects, onSegmentClick }) => {
    const data = useMemo(() => {
        // Group projects by currentStatusCode
        const counts: Record<number, number> = {};
        projects.forEach(p => {
            const code = p.currentStatusCode || 0;
            counts[code] = (counts[code] || 0) + 1;
        });

        // Map to 10 statuses
        return Object.entries(PROJECT_CURRENT_STATUS_CONFIG).map(([key, config]) => {
            const id = Number(key);
            return {
                id,
                label: `${id}. ${config.label}`,
                value: counts[id] || 0,
                color: config.hex,
            };
        });
    }, [projects]);

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="section-header text-sm">
                    <div className="section-icon"><ListFilter className="w-5 h-5" /></div>
                    Trạng thái hiện tại
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar min-h-[200px]">
                {data.map(item => (
                    <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-2 rounded-lg border border-transparent transition-colors ${onSegmentClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600' : ''}`}
                        onClick={() => {
                            if (onSegmentClick && item.value > 0) {
                                onSegmentClick(item.id, item.label);
                            }
                        }}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate" title={item.label}>
                                {item.label}
                            </span>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0">
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectDetailedStatusWidget;
