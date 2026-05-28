import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatCurrency } from '../../../utils/format';

interface CapitalOverviewChartProps {
    chartData: {
        name: string;
        'Kế hoạch': number;
        'Giải ngân': number;
    }[];
}

function fmtB(n: number): string {
    if (n >= 1e9) return `${(n / 1e9).toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} tỷ`;
    if (n >= 1e6) return `${(n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} tr`;
    return formatCurrency(n);
}

export const CapitalOverviewChart: React.FC<CapitalOverviewChartProps> = ({ chartData }) => {
    return (
        <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(val) => fmtB(val)} />
                    <Tooltip
                        cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: unknown) => { const v = Number(value); return [`${v.toLocaleString()} trđ`, undefined]; }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Kế hoạch" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Giải ngân" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CapitalOverviewChart;
