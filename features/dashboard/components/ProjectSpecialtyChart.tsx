import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Layers } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

export interface ProjectSpecialtyChartProps {
    projects: any[];
}

const SPECIALTY_LABELS: Record<string, string> = {
    civil_industrial: 'Dân dụng & Công nghiệp',
    transport_urban: 'Giao thông & Đô thị',
    agriculture_rural: 'Nông nghiệp & PTNT',
    mixed: 'Hỗn hợp',
    other: 'Khác',
};

const SPECIALTY_COLORS: Record<string, string> = {
    civil_industrial: '#3B82F6', // Blue
    transport_urban: '#F59E0B',   // Amber
    agriculture_rural: '#10B981', // Emerald
    mixed: '#8B5CF6',             // Violet
    other: '#64748B',             // Slate
};

const ProjectSpecialtyChart: React.FC<ProjectSpecialtyChartProps> = ({ projects }) => {
    const { theme } = useTheme();

    const chartData = useMemo(() => {
        const counts: Record<string, number> = {
            civil_industrial: 0,
            transport_urban: 0,
            agriculture_rural: 0,
            mixed: 0,
            other: 0,
        };

        projects.forEach(p => {
            const spec = p.specialtyType || 'other';
            if (counts[spec] !== undefined) {
                counts[spec]++;
            } else {
                counts.other++;
            }
        });

        return Object.entries(counts)
            .map(([key, val]) => ({
                name: SPECIALTY_LABELS[key] || 'Khác',
                value: val,
                color: SPECIALTY_COLORS[key] || '#64748B',
            }))
            .filter(item => item.value > 0);
    }, [projects]);

    return (
        <div className="bg-bg-surface p-[var(--density-card-p)] rounded-2xl shadow-sm border border-border h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="section-header text-sm">
                    <div className="section-icon"><Layers className="w-5 h-5" /></div>
                    Cơ cấu dự án theo Chuyên ngành
                </h3>
            </div>
            <div className="flex-1 min-h-[200px]">
                {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-txt-secondary font-medium">
                        Không có dữ liệu chuyên ngành
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.[0]) return null;
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-bg-elevated px-3 py-2 rounded-xl shadow-sm border border-border">
                                            <p className="text-[10px] font-black mb-0.5" style={{ color: d.color }}>{d.name}</p>
                                            <p className="text-[11px] text-txt-secondary font-semibold">{d.value} dự án</p>
                                        </div>
                                    );
                                }}
                            />
                            <Legend 
                                verticalAlign="bottom" 
                                height={45} 
                                iconType="circle"
                                wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: theme === 'dark' ? '#94A3B8' : (theme === 'nature' ? '#78716c' : '#6B7280') }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default ProjectSpecialtyChart;
