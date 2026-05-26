import React from 'react';
import { Play, CheckSquare, Send, ShieldAlert, RefreshCw, XCircle } from 'lucide-react';

interface ScoreApprovalBarProps {
  status: 'draft' | 'calculated' | 'reviewed' | 'approved';
  userRole: string;
  onAction: (action: 'calculate' | 'submit' | 'review' | 'approve' | 'reject') => void;
  loading?: boolean;
}

export const ScoreApprovalBar: React.FC<ScoreApprovalBarProps> = ({
  status,
  userRole,
  onAction,
  loading = false,
}) => {
  const isDirector = userRole === 'Director' || userRole === 'DeputyDirector' || userRole === 'Admin';
  const isDeptHead = userRole === 'DepartmentHead';

  // Step configs
  const steps = [
    { key: 'draft', label: '1. Khởi tạo' },
    { key: 'calculated', label: '2. Tính tự động' },
    { key: 'reviewed', label: '3. TP Xác nhận' },
    { key: 'approved', label: '4. LĐ Phê duyệt' },
  ];

  const getStepIndex = (s: string) => steps.findIndex(x => x.key === s);
  const currentIdx = getStepIndex(status);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl gap-4">
      {/* Trái: Tiến trình các bước */}
      <div className="flex items-center gap-2 flex-wrap">
        {steps.map((step, idx) => {
          const isActive = idx === currentIdx;
          const isDone = idx < currentIdx;
          return (
            <React.Fragment key={step.key}>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-500/20'
                  : isDone
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
              }`}>
                <span>{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <span className="text-slate-300 dark:text-slate-650 text-xs font-black">➔</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Phải: Nút hành động theo vai trò */}
      <div className="flex items-center gap-2">
        {loading ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Đang xử lý...
          </div>
        ) : (
          <>
            {/* 1. Tính toán điểm tự động: TP / LĐ / Admin */}
            {(status === 'draft' || status === 'calculated') && (isDeptHead || isDirector) && (
              <button
                onClick={() => onAction('calculate')}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                Tính điểm tự động (A1/A3)
              </button>
            )}

            {/* 2. Trưởng phòng xác nhận/nộp bảng điểm */}
            {status === 'calculated' && isDeptHead && (
              <button
                onClick={() => onAction('submit')}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                Nộp Trưởng phòng xác nhận
              </button>
            )}

            {/* 3. Lãnh đạo thẩm duyệt/review nháp */}
            {status === 'calculated' && isDirector && (
              <button
                onClick={() => onAction('review')}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Xác nhận Điểm số nháp
              </button>
            )}

            {/* 4. Lãnh đạo phê duyệt chính thức bảng điểm đã nộp */}
            {status === 'reviewed' && isDirector && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAction('reject')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-250 dark:border-rose-900 rounded-xl text-xs font-bold transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Trả lại bổ sung
                </button>
                <button
                  onClick={() => onAction('approve')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Phê duyệt chính thức
                </button>
              </div>
            )}

            {/* Trạng thái đã phê duyệt */}
            {status === 'approved' && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 px-3.5 py-2 rounded-xl">
                <CheckSquare className="w-4 h-4" />
                Đã phê duyệt chính thức
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
