import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp, Activity } from 'lucide-react';

interface DualProgressCardProps {
    physicalProgress: number;    // 0-100
    financialProgress: number;   // 0-100
    physicalLabel?: string;
    financialLabel?: string;
}

// SVG Circular Progress Ring
const ProgressRing: React.FC<{
    progress: number;
    color: string;
    bgColor: string;
    size?: number;
    strokeWidth?: number;
}> = ({ progress, color, bgColor, size = 56, strokeWidth = 5 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke={bgColor} strokeWidth={strokeWidth}
            />
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
            />
        </svg>
    );
};

export const DualProgressCard: React.FC<DualProgressCardProps> = ({
    physicalProgress,
    financialProgress,
    physicalLabel = 'Tiến độ dự án',
    financialLabel = 'Tiến độ thi công'
}) => {
    // Reactive dark mode detection
    const [isDark, setIsDark] = useState(() =>
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    );
    useEffect(() => {
        const el = document.documentElement;
        const obs = new MutationObserver(() => setIsDark(el.classList.contains('dark')));
        obs.observe(el, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);
    const ringBg = isDark ? '#374151' : '#E5E7EB';
    const avgProgress = (physicalProgress + financialProgress) / 2;

    return (
        <div className="section-card">
            <div className="section-card-header">
                <div className="flex items-center gap-2">
                    <div className="section-icon"><Activity className="w-3.5 h-3.5" /></div>
                    <span>Tiến độ thực hiện</span>
                </div>
            </div>
            <div className="p-3">
                {/* Dual Rings */}
                <div className="flex items-center justify-around mb-3">
                    {/* Physical */}
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <ProgressRing
                                progress={physicalProgress}
                                color="#fdba74"
                                bgColor={ringBg}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-black text-txt-primary tabular-nums">
                                    {physicalProgress.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                            <TrendingUp className="w-3 h-3 text-primary-600" />
                            <span className="text-[10px] font-bold text-txt-muted">{physicalLabel}</span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-12 bg-gray-200 dark:bg-slate-600" />

                    {/* Financial */}
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <ProgressRing
                                progress={financialProgress}
                                color="#4a90e2"
                                bgColor={ringBg}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-black text-txt-primary tabular-nums">
                                    {financialProgress.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                            <TrendingUp className="w-3 h-3 text-primary-600" />
                            <span className="text-[10px] font-bold text-txt-muted">{financialLabel}</span>
                        </div>
                    </div>
                </div>

                {/* Summary Bar */}
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg px-2.5 py-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-txt-muted font-medium">Trung bình tiến độ</span>
                        <span className={`font-black tabular-nums ${avgProgress >= 50 ? 'text-emerald-600' : avgProgress > 20 ? 'text-primary-600' : 'text-red-600'}`}>
                            {avgProgress.toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden mt-1.5">
                        <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                                background: avgProgress >= 50 ? 'linear-gradient(90deg, #10B981, #059669)' :
                                    avgProgress > 20 ? 'linear-gradient(90deg, #fb923c, #4a90e2)' :
                                        'linear-gradient(90deg, #EF4444, #DC2626)',
                                width: `${Math.min(100, Math.max(0, avgProgress))}%`
                            }}
                        />
                    </div>
                </div>

                {/* Variance indicator */}
                {Math.abs(physicalProgress - financialProgress) > 10 && (
                    <div className={`text-[10px] p-2 mt-3 rounded-md font-medium ${physicalProgress > financialProgress
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}>
                        {physicalProgress > financialProgress
                            ? '⚠️ Tiến độ dự án vượt trước thi công'
                            : 'ℹ️ Tiến độ thi công vượt trước dự án'
                        }
                    </div>
                )}
            </div>
        </div>
    );
};

export default DualProgressCard;

