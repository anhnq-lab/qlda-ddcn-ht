import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Wallet } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

export interface CapitalDisbursementChartProps {
    data: any[];
    onSegmentClick?: (boardName: string) => void;
}

const CapitalDisbursementChart: React.FC<CapitalDisbursementChartProps> = ({ data, onSegmentClick }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const isNature = theme === 'nature';

    const gridStroke = isDark ? '#334155' : (isNature ? '#ece7de' : '#E5E7EB');
    const labelFill = isDark ? '#94A3B8' : (isNature ? '#78716c' : '#6B7280');
    const plannedColor = isDark ? '#475569' : (isNature ? '#EDE8DF' : '#E5E7EB');
    const actualColor = '#00668c'; // Màu primary của dự án
    const tooltipCursor = isDark ? '#252a3b' : (isNature ? '#EDE8DF' : '#F3F4F6');

    return (
        <div className="bg-bg-surface p-[var(--density-card-p)] rounded-2xl shadow-sm border border-border h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="section-header text-sm">
                    <div className="section-icon"><Wallet className="w-5 h-5" /></div>
                    Kế hoạch vốn và Thực giải ngân
                </h3>
                <div className="flex gap-3">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-txt-secondary">
                        <div className="w-2.5 h-2.5 rounded" style={{ background: plannedColor }} /> Kế hoạch
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-txt-secondary">
                        <div className="w-2.5 h-2.5 rounded" style={{ background: actualColor }} /> Thực giải ngân
                    </span>
                </div>
            </div>
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} dy={6} tick={(props: any) => {
                            const { x, y, payload } = props;
                            const item = data?.find((d: any) => d.name === payload.value);
                            return (
                                <text x={x} y={y} textAnchor="middle" fontSize={11} fontWeight={700} fill={item?.color || labelFill} dy={6}>
                                    {payload.value}
                                </text>
                            );
                        }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: labelFill, fontSize: 10, fontWeight: 600 }} unit=" Tỷ" />
                        <RechartsTooltip
                            content={({ active, payload, label }: any) => {
                                if (!active || !payload?.[0]) return null;
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-bg-elevated px-3 py-2 rounded-xl shadow-sm border border-border">
                                        <p className="text-[10px] font-black text-txt-primary mb-0.5">{label}</p>
                                        <p className="text-[9px] text-txt-secondary">Kế hoạch: <strong>{d.planned} Tỷ</strong></p>
                                        <p className="text-[9px] text-txt-secondary">Thực giải ngân: <strong>{d.actual} Tỷ</strong></p>
                                        <p className="text-[9px] text-txt-secondary">Tỷ lệ: <strong>{d.rate}%</strong></p>
                                    </div>
                                );
                            }}
                            cursor={{ fill: tooltipCursor }}
                        />
                        <Bar 
                            dataKey="planned" 
                            fill={plannedColor} 
                            radius={[4, 4, 0, 0]} 
                            maxBarSize={40} 
                            onClick={(data) => {
                                if (onSegmentClick && data) onSegmentClick(data.name ?? '');
                            }}
                            cursor={onSegmentClick ? "pointer" : "default"}
                            className={onSegmentClick ? "hover:opacity-80 transition-opacity" : ""}
                        />
                        <Bar 
                            dataKey="actual" 
                            fill={actualColor} 
                            radius={[4, 4, 0, 0]} 
                            maxBarSize={40} 
                            onClick={(data) => {
                                if (onSegmentClick && data) onSegmentClick(data.name ?? '');
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

export default CapitalDisbursementChart;
