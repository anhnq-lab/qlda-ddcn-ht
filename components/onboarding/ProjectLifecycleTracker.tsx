import React from 'react';
import { CheckCircle2, Circle, ChevronRight, PlayCircle, Clock, CheckSquare } from 'lucide-react';

export type ProjectPhase = 'initiation' | 'planning' | 'execution' | 'closure';

export interface TrackerProps {
  currentPhase: ProjectPhase;
  onPhaseClick?: (phase: ProjectPhase) => void;
  onStartTour?: (phase: ProjectPhase) => void;
}

const PHASES = [
  {
    id: 'initiation' as ProjectPhase,
    title: 'Chuẩn bị đầu tư',
    description: 'Tạo dự án & Phân bổ vốn',
    tasks: ['Khai báo thông tin dự án', 'Phân quyền người dùng', 'Dự toán / Phân bổ vốn'],
  },
  {
    id: 'planning' as ProjectPhase,
    title: 'Lựa chọn nhà thầu',
    description: 'Kế hoạch LCNT & Đấu thầu',
    tasks: ['Lập kế hoạch LCNT', 'Đăng tải thông báo mời thầu', 'Cập nhật kết quả LCNT'],
  },
  {
    id: 'execution' as ProjectPhase,
    title: 'Thực hiện dự án',
    description: 'Hợp đồng, Tạm ứng, Thanh toán',
    tasks: ['Ký kết hợp đồng', 'Tạm ứng hợp đồng', 'Nghiệm thu khối lượng', 'Thanh toán đợt'],
  },
  {
    id: 'closure' as ProjectPhase,
    title: 'Kết thúc dự án',
    description: 'Bàn giao & Quyết toán',
    tasks: ['Bàn giao đưa vào sử dụng', 'Quyết toán hợp đồng', 'Quyết toán dự án hoàn thành'],
  },
];

export const ProjectLifecycleTracker: React.FC<TrackerProps> = ({ currentPhase, onPhaseClick, onStartTour }) => {
  const currentIndex = PHASES.findIndex((p) => p.id === currentPhase);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg mb-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            La bàn Dự án
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              Quy trình chuẩn
            </span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi tiến độ tổng thể và các bước thực hiện của dự án đầu tư xây dựng.
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 -z-10" />

        <div className="flex justify-between relative z-10">
          {PHASES.map((phase, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;

            return (
              <div key={phase.id} className="group relative flex flex-col items-center w-1/4">
                {/* Node Status Indicator */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200 mb-3 bg-white dark:bg-slate-800 ${
                    isCompleted
                      ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : isCurrent
                        ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-[0_0_0_4px_rgba(79,70,229,0.1)] dark:shadow-[0_0_0_4px_rgba(99,102,241,0.15)] ring-1 ring-indigo-600 dark:ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 animate-pulse'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={20} /> : isCurrent ? <Clock size={20} /> : <Circle size={20} />}
                </div>

                {/* Connecting Line Effect for completed stages */}
                {index < PHASES.length - 1 && (
                  <div
                    className={`absolute top-5 left-[50%] right-[-50%] h-0.5 -z-10 ${
                      isCompleted ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-transparent'
                    }`}
                  />
                )}

                {/* Phase Title & Subtitle */}
                <h3
                  className={`text-sm font-medium text-center transition-colors duration-200 ${
                    isCompleted || isCurrent
                      ? 'text-slate-900 dark:text-slate-100'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {phase.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center hidden md:block">
                  {phase.description}
                </p>

                {/* Tooltip Hover Area */}
                <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-50 w-64 pt-2">
                  <div className="bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 p-4 rounded-xl shadow-xl border border-slate-700">
                    <h4 className="font-medium text-sm mb-3 flex items-center justify-between border-b border-slate-700 pb-2">
                      {phase.title}
                      {isCurrent && (
                        <span className="text-[10px] uppercase bg-indigo-500 text-white px-1.5 py-0.5 rounded">Đang làm</span>
                      )}
                    </h4>
                    <ul className="space-y-2.5">
                      {phase.tasks.map((task, tIndex) => (
                        <li key={tIndex} className="text-xs flex items-start gap-2 text-slate-300">
                          <CheckSquare size={14} className="mt-0.5 shrink-0 text-slate-400" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Action Buttons in Tooltip */}
                    <div className="mt-4 pt-3 border-t border-slate-700 flex flex-col gap-2">
                      <button
                        onClick={() => onPhaseClick?.(phase.id)}
                        className="w-full py-1.5 rounded-lg text-xs font-medium border border-slate-600 hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 focus:outline-none"
                      >
                        Chuyển đến màn hình này <ChevronRight size={14} />
                      </button>
                      
                      <button
                        onClick={() => onStartTour?.(phase.id)}
                        className="w-full py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-lg focus:outline-none"
                      >
                        <PlayCircle size={14} />
                        Khởi động Tour hướng dẫn
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
