import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Wallet } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

export interface CapitalDisbursementChartProps {
    data: any[];
}

const CapitalDisbursementChart: React.FC<CapitalDisbursementChartProps> = ({ data }) => {
    const { theme } = useTheme();

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
                <h3 className="section-header text-sm">
                    <div className="section-icon"><Wallet className="w-5 h-5" /></div>
                    Kế hoạch vốn và Thực giải ngân
                </h3>
                <div className="flex gap-3">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-slate-400">
                        <div className="w-2.5 h-2.5 rounded" style={{ background: theme === 'dark' ? '#475569' : '#E5E7EB' }} /> Kế hoạch
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-slate-400">
                        <div className="w-2.5 h-2.5 rounded" style={{ background: '#4a90e2' }} /> Thực giải ngân
                    </span>
                </div>
            </div>
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#E5E7EB'} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} dy={6} tick={(props: any) => {
                            const { x, y, payload } = props;
                            const item = data?.find((d: any) => d.name === payload.value);
                            return (
                                <text x={x} y={y} textAnchor="middle" fontSize={11} fontWeight={700} fill={item?.color || (theme === 'dark' ? '#94A3B8' : '#6B7280')} dy={6}>
                                    {payload.value}
                                </text>
                            );
                        }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94A3B8' : '#6B7280', fontSize: 10, fontWeight: 600 }} unit=" Tỷ" />
                        <RechartsTooltip
                            content={({ active, payload, label }: any) => {
                                if (!active || !payload?.[0]) return null;
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-gray-700 dark:text-slate-200 mb-0.5">{label}</p>
                                        <p className="text-[9px] text-gray-600 dark:text-slate-300">Kế hoạch: <strong>{d.planned} Tỷ</strong></p>
                                        <p className="text-[9px] text-gray-600 dark:text-slate-300">Thực giải ngân: <strong>{d.actual} Tỷ</strong></p>
                                        <p className="text-[9px] text-gray-600 dark:text-slate-300">Tỷ lệ: <strong>{d.rate}%</strong></p>
                                    </div>
                                );
                            }}
                            cursor={{ fill: theme === 'dark' ? '#1E293B' : '#F3F4F6' }}
                        />
                        <Bar dataKey="planned" fill={theme === 'dark' ? '#475569' : '#E5E7EB'} radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="actual" fill="#4a90e2" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CapitalDisbursementChart;
