import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Building2 } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { MANAGEMENT_BOARDS, PROJECT_PHASE_COLORS, ProjectStatus } from '../../../types';

export interface ProjectStatusByBoardChartProps {
    projects: any[];
    onSegmentClick?: (boardName: string, statusName: string, statusKey: ProjectStatus) => void;
}

const ProjectStatusByBoardChart: React.FC<ProjectStatusByBoardChartProps> = ({ projects, onSegmentClick }) => {
    const { theme } = useTheme();

    const data = useMemo(() => {
        return MANAGEMENT_BOARDS.map(board => {
            const boardProjects = projects.filter(p => p.managementBoard === board.value);
            return {
                name: board.label,
                boardValue: board.value,
                prep: boardProjects.filter(p => p.status === ProjectStatus.Preparation).length,
                exec: boardProjects.filter(p => p.status === ProjectStatus.Execution).length,
                comp: boardProjects.filter(p => p.status === ProjectStatus.Completion).length,
            };
        });
    }, [projects]);

    const prepColor = PROJECT_PHASE_COLORS[ProjectStatus.Preparation].hex;
    const execColor = PROJECT_PHASE_COLORS[ProjectStatus.Execution].hex;
    const compColor = PROJECT_PHASE_COLORS[ProjectStatus.Completion].hex;

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="section-header text-sm">
                    <div className="section-icon"><Building2 className="w-5 h-5" /></div>
                    Dự án theo Phòng Ban
                </h3>
            </div>
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#E5E7EB'} />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            dy={6} 
                            tick={{ fill: theme === 'dark' ? '#94A3B8' : '#6B7280', fontSize: 10, fontWeight: 600 }} 
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: theme === 'dark' ? '#94A3B8' : '#6B7280', fontSize: 10, fontWeight: 600 }} 
                            allowDecimals={false}
                        />
                        <RechartsTooltip
                            content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-gray-700 dark:text-slate-200 mb-1">{label}</p>
                                        {payload.map((entry, index) => (
                                            <p key={index} className="text-[10px] text-gray-600 dark:text-slate-300 flex justify-between gap-4">
                                                <span>{entry.name}:</span>
                                                <strong style={{ color: entry.color }}>{entry.value}</strong>
                                            </p>
                                        ))}
                                    </div>
                                );
                            }}
                            cursor={{ fill: theme === 'dark' ? '#1E293B' : '#F3F4F6' }}
                        />
                        <Legend 
                            verticalAlign="bottom" 
                            height={36} 
                            iconType="circle"
                            wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: theme === 'dark' ? '#94A3B8' : '#6B7280' }}
                        />
                        <Bar 
                            dataKey="prep" 
                            name={PROJECT_PHASE_COLORS[ProjectStatus.Preparation].label} 
                            fill={prepColor} 
                            radius={[2, 2, 0, 0]} 
                            maxBarSize={20}
                            onClick={(data) => {
                                if (onSegmentClick && data) {
                                    onSegmentClick(data.name ?? '', PROJECT_PHASE_COLORS[ProjectStatus.Preparation].label, ProjectStatus.Preparation);
                                }
                            }}
                            cursor={onSegmentClick ? "pointer" : "default"}
                            className={onSegmentClick ? "hover:opacity-80 transition-opacity" : ""}
                        />
                        <Bar 
                            dataKey="exec" 
                            name={PROJECT_PHASE_COLORS[ProjectStatus.Execution].label} 
                            fill={execColor} 
                            radius={[2, 2, 0, 0]} 
                            maxBarSize={20}
                            onClick={(data) => {
                                if (onSegmentClick && data) {
                                    onSegmentClick(data.name ?? '', PROJECT_PHASE_COLORS[ProjectStatus.Execution].label, ProjectStatus.Execution);
                                }
                            }}
                            cursor={onSegmentClick ? "pointer" : "default"}
                            className={onSegmentClick ? "hover:opacity-80 transition-opacity" : ""}
                        />
                        <Bar 
                            dataKey="comp" 
                            name={PROJECT_PHASE_COLORS[ProjectStatus.Completion].label} 
                            fill={compColor} 
                            radius={[2, 2, 0, 0]} 
                            maxBarSize={20}
                            onClick={(data) => {
                                if (onSegmentClick && data) {
                                    onSegmentClick(data.name ?? '', PROJECT_PHASE_COLORS[ProjectStatus.Completion].label, ProjectStatus.Completion);
                                }
                            }}
                            cursor={onSegmentClick ? "pointer" : "default"}
                            className={onSegmentClick ? "hover:opacity-80 transition-opacity" : ""}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ProjectStatusByBoardChart;
