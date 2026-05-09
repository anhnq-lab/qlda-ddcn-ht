import React from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { PROJECT_PHASE_COLORS, ProjectStatus } from '../../../types';

export interface ProjectStatusChartProps {
    statusSummary: { prep: number; exec: number; comp: number };
}

const ProjectStatusChart: React.FC<ProjectStatusChartProps> = ({ statusSummary }) => {
    const { theme } = useTheme();

    const data = [
        { 
            name: PROJECT_PHASE_COLORS[ProjectStatus.Preparation].label, 
            value: statusSummary.prep, 
            color: PROJECT_PHASE_COLORS[ProjectStatus.Preparation].hex 
        },
        { 
            name: PROJECT_PHASE_COLORS[ProjectStatus.Execution].label, 
            value: statusSummary.exec, 
            color: PROJECT_PHASE_COLORS[ProjectStatus.Execution].hex 
        },
        { 
            name: PROJECT_PHASE_COLORS[ProjectStatus.Completion].label, 
            value: statusSummary.comp, 
            color: PROJECT_PHASE_COLORS[ProjectStatus.Completion].hex 
        },
    ].filter(item => item.value > 0);

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="section-header text-sm">
                    <div className="section-icon"><PieChartIcon className="w-5 h-5" /></div>
                    Trạng thái Dự án
                </h3>
            </div>
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <RechartsTooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.[0]) return null;
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-gray-700 dark:text-slate-200 mb-0.5" style={{ color: d.color }}>{d.name}</p>
                                        <p className="text-[11px] text-gray-600 dark:text-slate-300 font-semibold">{d.value} dự án</p>
                                    </div>
                                );
                            }}
                        />
                        <Legend 
                            verticalAlign="bottom" 
                            height={36} 
                            iconType="circle"
                            wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: theme === 'dark' ? '#94A3B8' : '#6B7280' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ProjectStatusChart;
