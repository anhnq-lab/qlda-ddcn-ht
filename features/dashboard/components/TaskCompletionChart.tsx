import React from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckSquare } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

export interface TaskCompletionChartProps {
    data: {
        done: number;
        inProgress: number;
        todo: number;
        overdue: number;
        total: number;
    } | undefined;
    loading: boolean;
    onSegmentClick?: (taskStatusName: string) => void;
}

const TaskCompletionChart: React.FC<TaskCompletionChartProps> = ({ data, loading, onSegmentClick }) => {
    const { theme } = useTheme();

    if (loading || !data) {
        return (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col justify-center items-center min-h-[260px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
        );
    }

    const chartData = [
        { name: 'Hoàn thành', value: data.done, color: '#10B981' }, // emerald-500
        { name: 'Đang xử lý', value: data.inProgress, color: '#3B82F6' }, // blue-500
        { name: 'Chờ xử lý', value: data.todo, color: '#F59E0B' }, // amber-500
        { name: 'Quá hạn', value: data.overdue, color: '#EF4444' }, // red-500
    ].filter(item => item.value > 0);

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="section-header text-sm">
                    <div className="section-icon"><CheckSquare className="w-5 h-5" /></div>
                    Tình trạng Công việc
                </h3>
            </div>
            <div className="flex-1 min-h-[200px]">
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
                            onClick={(data) => {
                                if (onSegmentClick && data) {
                                    onSegmentClick(data.name ?? '');
                                }
                            }}
                            className={onSegmentClick ? "cursor-pointer" : ""}
                        >
                            {chartData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.color} 
                                    className={onSegmentClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
                                />
                            ))}
                        </Pie>
                        <RechartsTooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.[0]) return null;
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-gray-700 dark:text-slate-200 mb-0.5" style={{ color: d.color }}>{d.name}</p>
                                        <p className="text-[11px] text-gray-600 dark:text-slate-300 font-semibold">{d.value} công việc</p>
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

export default TaskCompletionChart;
