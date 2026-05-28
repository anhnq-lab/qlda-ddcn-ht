import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { PROJECT_PHASE_COLORS, ProjectStatus } from '../../../types';

export interface ProjectStatusChartProps {
    statusSummary: { prep: number; exec: number; comp: number };
    onSegmentClick?: (statusName: string, statusValue: number) => void;
}

const ProjectStatusChart: React.FC<ProjectStatusChartProps> = ({ statusSummary, onSegmentClick }) => {
    const { theme } = useTheme();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const data = [
        { 
            name: PROJECT_PHASE_COLORS[ProjectStatus.Preparation].label, 
            statusKey: ProjectStatus.Preparation,
            value: statusSummary.prep, 
            color: PROJECT_PHASE_COLORS[ProjectStatus.Preparation].hex 
        },
        { 
            name: PROJECT_PHASE_COLORS[ProjectStatus.Execution].label, 
            statusKey: ProjectStatus.Execution,
            value: statusSummary.exec, 
            color: PROJECT_PHASE_COLORS[ProjectStatus.Execution].hex 
        },
        { 
            name: PROJECT_PHASE_COLORS[ProjectStatus.Completion].label, 
            statusKey: ProjectStatus.Completion,
            value: statusSummary.comp, 
            color: PROJECT_PHASE_COLORS[ProjectStatus.Completion].hex 
        },
    ].filter(item => item.value > 0);

    return (
        <div className="bg-bg-surface p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] border border-border h-full flex flex-col" role="region" aria-label="Biểu đồ Giai đoạn dự án">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="section-header text-sm">
                    <div className="section-icon"><PieChartIcon className="w-5 h-5" /></div>
                    <span className="text-[12px] font-black uppercase text-txt-secondary tracking-wider">Giai đoạn dự án</span>
                </h3>
            </div>
            <div className="flex-1 min-h-[200px]" role="img" aria-label="Biểu đồ hình tròn phân bổ dự án theo giai đoạn Chuẩn bị đầu tư, Thực hiện, và Kết thúc xây dựng">
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
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                            onClick={(data) => {
                                if (onSegmentClick && data && data.payload) {
                                    onSegmentClick(data.name ?? '', data.payload.statusKey);
                                }
                            }}
                            className="cursor-pointer"
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.color} 
                                    style={{
                                        filter: activeIndex === index ? 'drop-shadow(0px 4px 10px rgba(0,0,0,0.15))' : 'none',
                                        transform: activeIndex === index ? 'scale(1.04)' : 'scale(1)',
                                        transformOrigin: '50% 50%',
                                        transition: 'all 0.2s ease-in-out',
                                        cursor: 'pointer'
                                    }}
                                />
                            ))}
                        </Pie>
                        <RechartsTooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.[0]) return null;
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-bg-surface px-3 py-2 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-border">
                                        <p className="text-[11px] font-black mb-0.5" style={{ color: d.color }}>{d.name}</p>
                                        <p className="text-xs text-txt-secondary font-semibold">{d.value} dự án</p>
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
