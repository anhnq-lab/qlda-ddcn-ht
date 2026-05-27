import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { CalendarRange } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

export interface YearlyCapitalDisbursementChartProps {
    data: {
        year: number;
        planned: number;
        actual: number;
        rate: number;
    }[];
}

const YearlyCapitalDisbursementChart: React.FC<YearlyCapitalDisbursementChartProps> = ({ data }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const isNature = theme === 'nature';

    const gridStroke = isDark ? '#334155' : (isNature ? '#ece7de' : '#E5E7EB');
    const labelFill = isDark ? '#94A3B8' : (isNature ? '#78716c' : '#6B7280');
    const plannedColor = isDark ? '#475569' : (isNature ? '#C5B9A5' : '#94A3B8');
    const actualColor = '#00668c'; // Primary theme color
    const tooltipCursor = isDark ? '#252a3b' : (isNature ? '#EDE8DF' : '#F3F4F6');

    return (
        <div className="bg-bg-surface p-[var(--density-card-p)] rounded-2xl shadow-sm border border-border h-full flex flex-col">
            <div className="flex justify-between items-center mb-2 shrink-0">
                <h3 className="section-header text-sm">
                    <div className="section-icon"><CalendarRange className="w-5 h-5" /></div>
                    Giải ngân Ban QLDA
                </h3>
                <div className="flex gap-3">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-txt-secondary">
                        <div className="w-2.5 h-2.5 rounded" style={{ background: plannedColor }} /> Kế hoạch năm
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-txt-secondary">
                        <div className="w-2.5 h-1.5 rounded-full" style={{ background: actualColor }} /> Thực giải ngân
                    </span>
                </div>
            </div>
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                        <XAxis 
                            dataKey="year" 
                            axisLine={false} 
                            tickLine={false} 
                            dy={6} 
                            tick={{ fill: labelFill, fontSize: 10, fontWeight: 600 }} 
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: labelFill, fontSize: 10, fontWeight: 600 }} 
                            unit=" Tỷ" 
                        />
                        <RechartsTooltip
                            content={({ active, payload, label }: any) => {
                                if (!active || !payload?.[0]) return null;
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-bg-elevated px-3 py-2 rounded-xl shadow-sm border border-border">
                                        <p className="text-[10px] font-black text-txt-primary mb-1">Năm {label}</p>
                                        <p className="text-[9px] text-txt-secondary flex justify-between gap-4">
                                            <span>Kế hoạch vốn:</span>
                                            <strong>{d.planned} Tỷ</strong>
                                        </p>
                                        <p className="text-[9px] text-txt-secondary flex justify-between gap-4">
                                            <span>Thực giải ngân:</span>
                                            <strong>{d.actual} Tỷ</strong>
                                        </p>
                                        <p className="text-[9px] text-txt-secondary flex justify-between gap-4 border-t border-border pt-1 mt-1 font-bold text-txt-primary">
                                            <span>Tỷ lệ giải ngân:</span>
                                            <strong>{d.rate}%</strong>
                                        </p>
                                    </div>
                                );
                            }}
                            cursor={{ fill: tooltipCursor }}
                        />
                        <Bar 
                            dataKey="planned" 
                            name="Kế hoạch năm"
                            fill={plannedColor} 
                            radius={[4, 4, 0, 0]} 
                            maxBarSize={30} 
                        />
                        <Line 
                            type="monotone" 
                            dataKey="actual" 
                            name="Thực giải ngân"
                            stroke={actualColor} 
                            strokeWidth={2.5}
                            dot={{ r: 4, stroke: actualColor, strokeWidth: 1.5, fill: '#fff' }}
                            activeDot={{ r: 6 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default YearlyCapitalDisbursementChart;
