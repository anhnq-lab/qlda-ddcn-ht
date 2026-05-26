import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { DepartmentMonthlyScore } from '../services/scoringService';
import { NON_DISBURSEMENT_DEPTS, calcA1Score, calcA3Score, calcB1DeptScore, calcB2DeptScore, classifyScore } from '../types/scoring.types';
import { DEPARTMENT_NAMES } from '../../../types/plan.types';
import { Save, AlertCircle, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { StatusBadge } from '../../../components/ui';

interface DeptScoreDetailProps {
  score: DepartmentMonthlyScore;
  userRole: string;
  onSave: (updatedScore: DepartmentMonthlyScore) => Promise<void>;
  onClose: () => void;
}

export const DeptScoreDetail: React.FC<DeptScoreDetailProps> = ({
  score,
  userRole,
  onSave,
  onClose,
}) => {
  const isDirector = userRole === 'Director' || userRole === 'DeputyDirector' || userRole === 'Admin';
  const isNonDisb = NON_DISBURSEMENT_DEPTS.includes(score.department_code as any);

  // Form states
  const [a2Score, setA2Score] = useState<number>(score.a2_score || 0);
  const [a2Notes, setA2Notes] = useState<string>(score.a2_notes || '');
  const [b1Rate, setB1Rate] = useState<number>(score.b1_disbursement_rate || 0);
  const [b2Rate, setB2Rate] = useState<number>(score.b2_target_rate || 0);
  const [c1Score, setC1Score] = useState<number>(score.c1_score || 0);
  const [c1Notes, setC1Notes] = useState<string>(score.c1_notes || '');
  const [c2Score, setC2Score] = useState<number>(score.c2_score || 0);
  const [c2Notes, setC2Notes] = useState<string>(score.c2_notes || '');

  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [saving, setSaving] = useState(false);

  // Maximum allowed scores based on department type
  const maxA2 = isNonDisb ? 20 : 10;
  const maxC1 = isNonDisb ? 18 : 10;
  const maxC2 = isNonDisb ? 17 : 10;

  useEffect(() => {
    loadDeptTasks();
  }, [score.department_code, score.eval_month, score.eval_year]);

  const loadDeptTasks = async () => {
    setLoadingTasks(true);
    try {
      const { data, error } = await (supabase as any)
        .from('monthly_report_view')
        .select('*')
        .eq('department_code', score.department_code)
        .eq('report_month', score.eval_month)
        .eq('report_year', score.eval_year);
      if (error) throw error;
      setTasks(data || []);
    } catch (e) {
      console.error('Lỗi tải danh sách công việc phòng ban:', e);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Recalculated values in real-time
  const computedValues = useMemo(() => {
    const a1 = score.a1_score;
    const a3 = score.a3_score;
    const b1 = isNonDisb ? 0 : calcB1DeptScore(b1Rate);
    const b2 = isNonDisb ? 0 : calcB2DeptScore(b2Rate);

    const groupATotal = a1 + a2Score + a3;
    const groupBTotal = isNonDisb ? 0 : b1 + b2;
    const groupCTotal = c1Score + c2Score;
    const total = groupATotal + groupBTotal + groupCTotal;

    const onTimeRate = score.a3_on_time_rate || 0;
    const disbRate = isNonDisb ? 95 : b1Rate; // mock GN to pass classification if non-disb dept
    const ratingResult = classifyScore(total, { onTimeRate, exceedRate: 0, disbRate });

    return {
      b1Score: b1,
      b2Score: b2,
      groupATotal,
      groupBTotal,
      groupCTotal,
      total,
      classification: ratingResult.level,
      classificationLabel: ratingResult.label,
    };
  }, [a2Score, b1Rate, b2Rate, c1Score, c2Score, score, isNonDisb]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirector) return;
    setSaving(true);
    try {
      const updated: DepartmentMonthlyScore = {
        ...score,
        a2_score: a2Score,
        a2_notes: a2Notes,
        b1_disbursement_rate: isNonDisb ? 0 : b1Rate,
        b1_score: computedValues.b1Score,
        b2_target_rate: isNonDisb ? 0 : b2Rate,
        b2_score: computedValues.b2Score,
        c1_score: c1Score,
        c1_notes: c1Notes,
        c2_score: c2Score,
        c2_notes: c2Notes,
        group_a_total: computedValues.groupATotal,
        group_b_total: computedValues.groupBTotal,
        group_c_total: computedValues.groupCTotal,
        total_score: computedValues.total,
        classification: computedValues.classification as any,
        status: score.status === 'draft' ? 'calculated' : score.status,
      };
      await onSave(updated);
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu điểm phòng ban:', err);
      alert('Không thể lưu kết quả chấm điểm.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
            Chấm điểm phòng ban: {DEPARTMENT_NAMES[score.department_code]}
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Tháng {score.eval_month}/{score.eval_year}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Real-time score card */}
        <div className="grid grid-cols-3 gap-3 bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Điểm tính sẵn</span>
            <span className="text-xl font-mono font-black text-slate-700 dark:text-slate-300 mt-1">
              {(score.a1_score + score.a3_score).toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col border-x border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">Điểm tổng</span>
            <span className="text-2xl font-mono font-black text-primary-600 dark:text-primary-400 mt-0.5 animate-pulse">
              {computedValues.total.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col justify-center items-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Xếp loại</span>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 mt-1.5 uppercase">
              {computedValues.classificationLabel}
            </span>
          </div>
        </div>

        {/* Rating Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Nhóm A2: Chất lượng kết quả */}
          <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Nhóm A2: Chất lượng kết quả (Tối đa {maxA2} điểm)
            </h4>
            <div className="grid grid-cols-4 gap-4 items-center">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350 col-span-3">Điểm chất lượng (Chủ quan của Lãnh đạo):</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max={maxA2}
                value={a2Score}
                onChange={(e) => setA2Score(Number(e.target.value))}
                disabled={!isDirector || score.status === 'approved'}
                className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
              />
            </div>
            <textarea
              placeholder="Nhập nhận xét chi tiết về chất lượng kết quả..."
              value={a2Notes}
              onChange={(e) => setA2Notes(e.target.value)}
              disabled={!isDirector || score.status === 'approved'}
              rows={2}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          {/* Nhóm B: Chỉ hiển thị cho phòng ban có giải ngân */}
          {!isNonDisb && (
            <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-450">
                Nhóm B: Chỉ số Giải ngân vốn đầu tư (Tối đa 40 điểm)
              </h4>
              <div className="grid grid-cols-4 gap-3 items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350 col-span-3">Tỷ lệ Giải ngân thực tế (%):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={b1Rate}
                  onChange={(e) => setB1Rate(Number(e.target.value))}
                  disabled={!isDirector || score.status === 'approved'}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                />
              </div>
              <div className="grid grid-cols-4 gap-3 items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350 col-span-3">Tỷ lệ Hoàn thành mục tiêu GN (%):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="150"
                  value={b2Rate}
                  onChange={(e) => setB2Rate(Number(e.target.value))}
                  disabled={!isDirector || score.status === 'approved'}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                />
              </div>
            </div>
          )}

          {/* Nhóm C: Tiêu chí chung */}
          <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Nhóm C: Tiêu chí chung & Sáng kiến (Tối đa {maxC1 + maxC2} điểm)
            </h4>
            <div className="grid grid-cols-4 gap-3 items-center">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350 col-span-3">C1: Tuân thủ quy chế & báo cáo (Max {maxC1}):</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max={maxC1}
                value={c1Score}
                onChange={(e) => setC1Score(Number(e.target.value))}
                disabled={!isDirector || score.status === 'approved'}
                className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
              />
            </div>
            <textarea
              placeholder="Nhận xét tuân thủ quy chế..."
              value={c1Notes}
              onChange={(e) => setC1Notes(e.target.value)}
              disabled={!isDirector || score.status === 'approved'}
              rows={2}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
            <div className="grid grid-cols-4 gap-3 items-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350 col-span-3">C2: Điểm thưởng Sáng kiến (Max {maxC2}):</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max={maxC2}
                value={c2Score}
                onChange={(e) => setC2Score(Number(e.target.value))}
                disabled={!isDirector || score.status === 'approved'}
                className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
              />
            </div>
            <textarea
              placeholder="Nhận xét về các sáng kiến, đổi mới..."
              value={c2Notes}
              onChange={(e) => setC2Notes(e.target.value)}
              disabled={!isDirector || score.status === 'approved'}
              rows={2}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          {/* Submit Action */}
          {isDirector && score.status !== 'approved' && (
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu kết quả chấm điểm'}
            </button>
          )}
        </form>

        {/* Task list for validation */}
        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-655 dark:text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Công việc trong kỳ báo cáo ({tasks.length})
            </h4>
          </div>

          {loadingTasks ? (
            <div className="text-center py-6 text-slate-400 text-xs">Đang tải danh sách công việc...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs italic">Không có công việc nào trong tháng này.</div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {tasks.map(t => (
                <div key={t.task_id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{t.title}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Assignee: {t.assignee_name}</p>
                    {t.status === 'done' && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-450 mt-1 font-semibold">
                        ✓ {t.completion_result || 'Hoàn thành'}
                      </p>
                    )}
                    {t.status === 'incomplete' && (
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">
                        ✗ {t.incomplete_reason || 'Chưa hoàn thành'} ({t.incomplete_reason_type === 'objective' ? 'Khách quan' : 'Chủ quan'})
                      </p>
                    )}
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${
                    t.status === 'done'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : t.status === 'incomplete'
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-blue-50 text-blue-600 border-blue-200'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
