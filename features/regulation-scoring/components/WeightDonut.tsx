import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ScoringWeights } from '../types/scoring.types';

interface WeightDonutProps {
  weights: ScoringWeights;
  title: string;
}

export const WeightDonut: React.FC<WeightDonutProps> = ({ weights, title }) => {
  const data = [
    { name: 'Nhóm A (Công việc)', value: weights.a_max, color: '#3b82f6' }, // Blue
    { name: 'Nhóm B (Giải ngân)', value: weights.b_max, color: '#10b981' }, // Emerald
    { name: 'Nhóm C (Tiêu chí chung)', value: weights.c_max, color: '#a855f7' }, // Purple
  ].filter(d => d.value > 0);

  return (
    <div className="flex flex-col p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm w-full h-full justify-between min-h-[220px]">
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1">
          {title}
        </h4>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Cấu trúc tỷ trọng điểm tối đa (Tổng 100 điểm)</p>
      </div>

      <div className="flex items-center gap-4 flex-1 mt-2">
        <div className="w-24 h-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={40}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {data.map((d, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-350">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: d.color }} />
              <div className="flex flex-col leading-tight">
                <span>{d.name}</span>
                <span className="text-[10px] text-slate-400 font-bold">{d.value} điểm tối đa</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
