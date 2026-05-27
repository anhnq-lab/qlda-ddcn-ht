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
    const isDark = theme === 'dark';
    const isNature = theme === 'nature';

    const gridStroke = isDark ? '#334155' : (isNature ? '#ece7de' : '#E5E7EB');
    const labelFill = isDark ? '#94A3B8' : (isNature ? '#78716c' : '#6B7280');
    const tooltipCursor = isDark ? '#252a3b' : (isNature ? '#EDE8DF' : '#F3F4F6');

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
        <div className="bg-bg-surface p-[var(--density-card-p)] rounded-2xl shadow-sm border border-border h-full flex flex-col">
            <div className="flex justify-between items-center mb-2 shrink-0">
                <h3 className="section-header text-sm">
                    <div className="section-icon"><Building2 className="w-5 h-5" /></div>
                    DA theo Phòng
                </h3>
            </div>
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            dy={6} 
                            tick={{ fill: labelFill, fontSize: 10, fontWeight: 600 }} 
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: labelFill, fontSize: 10, fontWeight: 600 }} 
                            allowDecimals={false}
                        />
                        <RechartsTooltip
                            content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
                                return (
                                    <div className="bg-bg-elevated px-3 py-2 rounded-xl shadow-sm border border-border min-w-[150px]">
                                        <p className="text-[10px] font-black text-txt-primary mb-1.5">{label}</p>
                                        <div className="space-y-1">
                                            {payload.map((entry, index) => (
                                                <p key={index} className="text-[10px] text-txt-secondary flex justify-between gap-4">
                                                    <span>{entry.name}:</span>
                                                    <strong style={{ color: entry.color }}>{entry.value}</strong>
                                                </p>
                                            ))}
                                            <div className="border-t border-border pt-1 mt-1 flex justify-between text-[10px] font-bold text-txt-primary">
                                                <span>Tổng cộng:</span>
                                                <span>{total}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                            cursor={{ fill: tooltipCursor }}
                        />
                        <Legend 
                            verticalAlign="bottom" 
                            height={36} 
                            iconType="circle"
                            wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: labelFill }}
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
