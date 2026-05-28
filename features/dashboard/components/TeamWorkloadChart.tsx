import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface MemberWorkloadData {
    name: string;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
}

interface Props {
    data: MemberWorkloadData[];
}

export const TeamWorkloadChart: React.FC<Props> = ({ data }) => {
    // Custom Tooltip component to match theme tokens
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-bg-surface border border-border p-2.5 rounded-xl shadow-lg animate-in fade-in duration-150">
                    <p className="text-xs font-bold text-txt-primary mb-1">{label}</p>
                    <div className="space-y-0.5">
                        {payload.map((entry: any) => (
                            <div key={entry.name} className="flex items-center gap-4 justify-between text-[11px]">
                                <span className="flex items-center gap-1.5 text-txt-secondary">
                                    <span 
                                        className="w-1.5 h-1.5 rounded-full shrink-0" 
                                        style={{ backgroundColor: entry.fill }}
                                    />
                                    {entry.name}:
                                </span>
                                <span className="font-bold text-txt-primary">{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-[240px] w-full text-txt-primary">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis 
                        dataKey="name" 
                        stroke="var(--text-muted)" 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis 
                        stroke="var(--text-muted)" 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                        verticalAlign="top" 
                        height={32} 
                        iconType="circle" 
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="inProgress" name="Đang chạy" fill="#3b82f6" stackId="a" />
                    <Bar dataKey="overdue" name="Trễ hạn" fill="#ef4444" stackId="a" />
                    <Bar dataKey="todo" name="Cần làm" fill="#94a3b8" stackId="a" />
                    <Bar dataKey="done" name="Đã xong" fill="#10b981" stackId="a" radius={[3, 3, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TeamWorkloadChart;
