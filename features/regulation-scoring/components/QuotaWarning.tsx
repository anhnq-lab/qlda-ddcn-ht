import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { validateExcellentQuota } from '../types/scoring.types';

interface QuotaWarningProps {
  excellentCount: number;
  goodCount: number;
  satisfactoryCount: number;
  unsatisfactoryCount: number;
  directorApproval: boolean;
  onDirectorApprovalToggle?: () => void;
}

export const QuotaWarning: React.FC<QuotaWarningProps> = ({
  excellentCount,
  goodCount,
  satisfactoryCount,
  unsatisfactoryCount,
  directorApproval,
  onDirectorApprovalToggle,
}) => {
  const total = excellentCount + goodCount + satisfactoryCount + unsatisfactoryCount;
  const ratio = total > 0 ? (excellentCount / total) * 100 : 0;
  const limitPercent = directorApproval ? 25 : 20;
  const isOverLimit = ratio > limitPercent;

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 ${
      isOverLimit
        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
        : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
    }`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {isOverLimit ? (
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          )}
        </div>

        <div className="flex-1 space-y-1">
          <h4 className={`text-xs font-black uppercase tracking-wider ${
            isOverLimit ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
          }`}>
            {isOverLimit ? 'Cảnh báo hạn ngạch xếp loại xuất sắc' : 'Đảm bảo hạn ngạch xếp loại'}
          </h4>
          
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Tỷ lệ "Hoàn thành xuất sắc" hiện tại: <span className="font-black text-slate-800 dark:text-white">{ratio.toFixed(1)}%</span> ({excellentCount}/{total} nhân sự).
            Hạn ngạch quy định tối đa là <span className="font-bold">{limitPercent}%</span> (Điều 18.3).
          </p>

          <div className="flex items-center gap-4 pt-1 flex-wrap">
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>XS: {excellentCount}</span>
              <span>•</span>
              <span>Tốt: {goodCount}</span>
              <span>•</span>
              <span>HT: {satisfactoryCount}</span>
              <span>•</span>
              <span>KHT: {unsatisfactoryCount}</span>
            </div>

            {isOverLimit && onDirectorApprovalToggle && (
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-rose-700 dark:text-rose-400">
                <input
                  type="checkbox"
                  checked={directorApproval}
                  onChange={onDirectorApprovalToggle}
                  className="rounded border-rose-300 text-rose-600 focus:ring-rose-500/20"
                />
                Trình Lãnh đạo phê duyệt nới lỏng hạn ngạch (lên 25%)
              </label>
            )}
            
            {!isOverLimit && directorApproval && onDirectorApprovalToggle && (
              <button
                onClick={onDirectorApprovalToggle}
                className="text-[10px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-wider"
              >
                Tắt đề xuất nới lỏng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
