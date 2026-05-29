import React from 'react';

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  classification: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, maxScore = 100, classification }) => {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
  const radius = 45;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  // Half gauge arc (180 degrees) from left to right:
  const strokeDashoffset = circumference - (percentage / 100) * (circumference / 2);

  // Classification styling
  const getClassConfig = (level: string) => {
    switch (level) {
      case 'xuat_sac':
        return { label: 'Xuất sắc', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-900/50' };
      case 'tot':
        return { label: 'Tốt', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-900/50' };
      case 'hoan_thanh':
        return { label: 'Hoàn thành nhiệm vụ', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-900/50' };
      case 'khong_hoan_thanh':
        return { label: 'Không hoàn thành', color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-200 dark:border-rose-900/50' };
      default:
        return { label: 'Chưa đánh giá', color: 'text-txt-placeholder', bg: 'bg-bg-subtle', border: 'border-border' };
    }
  };

  const classCfg = getClassConfig(classification);

  // Determine indicator color based on score
  const getStrokeColor = (val: number) => {
    if (val >= 90) return 'stroke-amber-500';
    if (val >= 70) return 'stroke-emerald-500';
    if (val >= 50) return 'stroke-blue-500';
    return 'stroke-rose-500';
  };

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-bg-surface rounded-2xl border border-border-subtle shadow-sm w-full">
      <div className="relative w-40 h-24 flex items-end justify-center overflow-hidden">
        <svg className="w-36 h-36 transform -rotate-180" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference / 2}
            strokeLinecap="round"
          />
          {/* Active colored arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            className={`transition-all duration-1000 ease-out ${getStrokeColor(score)}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        {/* Text score value */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <span className="text-3xl font-black text-slate-850 dark:text-white tabular-nums">
            {score.toFixed(1)}
          </span>
          <span className="text-[10px] font-bold text-txt-placeholder uppercase tracking-widest">
            Điểm số
          </span>
        </div>
      </div>
      <div className={`mt-3 px-3 py-1 rounded-full text-xs font-black border ${classCfg.bg} ${classCfg.color} ${classCfg.border} text-center`}>
        {classCfg.label}
      </div>
    </div>
  );
};
