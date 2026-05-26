import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { IndividualMonthlyScore } from '../services/scoringService';
import { NON_DISBURSEMENT_DEPTS, classifyScore } from '../types/scoring.types';
import { Save, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../../../components/ui';

interface IndivScoreDetailProps {
  score: IndividualMonthlyScore;
  userRole: string;
  userDept: string;
  onSave: (updatedScore: IndividualMonthlyScore) => Promise<void>;
  onClose: () => void;
}

export const IndivScoreDetail: React.FC<IndivScoreDetailProps> = ({
  score,
  userRole,
  userDept,
  onSave,
  onClose,
}) => {
  const isDirector = userRole === 'Director' || userRole === 'DeputyDirector' || userRole === 'Admin';
  const isDeptHead = userRole === 'DepartmentHead';
  const isOwnDept = score.department_code === userDept;
  const canEdit = isDirector || (isDeptHead && isOwnDept);

  const isNonDisb = NON_DISBURSEMENT_DEPTS.includes(score.department_code as any);

  // Maximum allowed scores based on employee type
  const maxA2 = isNonDisb ? 15 : 10;
  const maxC1 = isNonDisb ? 15 : 10;
  const maxC2 = isNonDisb ? 15 : 10;
  const maxC3 = isNonDisb ? 15 : 10;

  // Form states
  const [a2Score, setA2Score] = useState<number>(score.a2_score || 0);
  const [a2Notes, setA2Notes] = useState<string>(score.a2_notes || '');
  const [b1Rate, setB1Rate] = useState<number>(score.b1_weighted_rate || 0);
  const [b2Score, setB2Score] = useState<number>(score.b2_score || 0);
  const [b2Notes, setB2Notes] = useState<string>(score.b2_notes || '');
  const [c1Score, setC1Score] = useState<number>(score.c1_score || 0);
  const [c1Notes, setC1Notes] = useState<string>(score.c1_notes || '');
  const [c2Score, setC2Score] = useState<number>(score.c2_score || 0);
  const [c2Notes, setC2Notes] = useState<string>(score.c2_notes || '');
  const [c3Score, setC3Score] = useState<number>(score.c3_score || 0);
  const [c3Notes, setC3Notes] = useState<string>(score.c3_notes || '');

  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEmployeeTasks();
  }, [score.employee_id, score.eval_month, score.eval_year]);

  const loadEmployeeTasks = async () => {
    setLoadingTasks(true);
    try {
      const { data, error } = await (supabase as any)
        .from('monthly_report_view')
        .select('*')
        .eq('assignee_id', score.employee_id)
        .eq('report_month', score.eval_month)
        .eq('report_year', score.eval_year);
      if (error) throw error;
      setTasks(data || []);
    } catch (e) {
      console.error('Lỗi tải danh sách công việc cá nhân:', e);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Recalculated values in real-time
  const computedValues = useMemo(() => {
    // A1 and A3 are computed automatically from tasks
    // If no tasks, A1 defaults to 0 and A3 defaults to 0 (or reallocated minimum)
    let a1 = score.a1_score;
    let a3 = score.a3_score;

    // For non-disb staff, A1 and A3 max scores are reallocated:
    // We adjust their visual scales if needed, but since they are calculated via RPC, they are already scaled.
    // Wait, let's verify if calc_regulation_a_scores scales A1 and A3 for non-disbursement.
    // Incalc_regulation_a_scores, we returned:
    // A1 = 20 max, A3 = 10 max.
    // If it's a non-disb staff, we should scale them:
    // A1 max becomes 27.5 (calculated a1 * 27.5 / 20)
    // A3 max becomes 12.5 (calculated a3 * 12.5 / 10)
    if (isNonDisb) {
      a1 = Number((a1 * 27.5 / 20.0).toFixed(1));
      a3 = Number((a3 * 12.5 / 10.0).toFixed(1));
    }

    // B1 score: for disb staff, b1_score = b1_weighted_rate * 20 / 100
    const b1Score = isNonDisb ? 0 : Number(((b1Rate / 100) * 20).toFixed(1));

    const groupATotal = a1 + a2Score + a3;
    const groupBTotal = isNonDisb ? 0 : b1Score + b2Score;
    const groupCTotal = c1Score + c2Score + c3Score;
    const total = groupATotal + groupBTotal + groupCTotal;

    const onTimeRate = score.a3_on_time_rate || 0;
    const ratingResult = classifyScore(total, { onTimeRate, exceedRate: 0, disbRate: isNonDisb ? 95 : b1Rate });

    return {
      a1Adjusted: a1,
      a3Adjusted: a3,
      b1Score,
      groupATotal,
      groupBTotal,
      groupCTotal,
      total,
      classification: ratingResult.level,
      classificationLabel: ratingResult.label,
    };
  }, [a2Score, b1Rate, b2Score, c1Score, c2Score, c3Score, score, isNonDisb]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    try {
      const updated: IndividualMonthlyScore = {
        ...score,
        a2_score: a2Score,
        a2_notes: a2Notes,
        b1_weighted_rate: isNonDisb ? 0 : b1Rate,
        b1_score: computedValues.b1Score,
        b2_score: isNonDisb ? 0 : b2Score,
        b2_notes: isNonDisb ? '' : b2Notes,
        c1_score: c1Score,
        c1_notes: c1Notes,
        c2_score: c2Score,
        c2_notes: c2Notes,
        c3_score: c3Score,
        c3_notes: c3Notes,
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
      console.error('Lỗi khi lưu điểm cá nhân:', err);
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
            Đánh giá cá nhân: {score.employee_name}
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Phòng: {score.department_code} • Tháng {score.eval_month}/{score.eval_year}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Real-time score card */}
        <div className="grid grid-cols-3 gap-3 bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">Điểm tự động</span>
            <span className="text-xl font-mono font-black text-slate-700 dark:text-slate-350 mt-1">
              {(computedValues.a1Adjusted + computedValues.a3Adjusted).toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col border-x border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">Điểm tổng</span>
            <span className="text-2xl font-mono font-black text-primary-600 dark:text-primary-400 mt-0.5 animate-pulse">
              {computedValues.total.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col justify-center items-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">Xếp loại</span>
            <span className="text-xs font-black text-amber-605 dark:text-amber-400 mt-1.5 uppercase">
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
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350 col-span-3">Chất lượng hoàn thành công việc:</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max={maxA2}
                value={a2Score}
                onChange={(e) => setA2Score(Number(e.target.value))}
                disabled={!canEdit || score.status === 'approved'}
                className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
              />
            </div>
            <textarea
              placeholder="Nhập nhận xét chi tiết..."
              value={a2Notes}
              onChange={(e) => setA2Notes(e.target.value)}
              disabled={!canEdit || score.status === 'approved'}
              rows={2}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          {/* Nhóm B: Đóng góp giải ngân cá nhân */}
          {!isNonDisb && (
            <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-450">
                Nhóm B: Đóng góp giải ngân dự án (Tối đa 30 điểm)
              </h4>
              <div className="grid grid-cols-4 gap-3 items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350 col-span-3">Bình quân gia quyền tỷ lệ giải ngân (%):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={b1Rate}
                  onChange={(e) => setB1Rate(Number(e.target.value))}
                  disabled={!canEdit || score.status === 'approved'}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                />
              </div>
              <div className="grid grid-cols-4 gap-3 items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350 col-span-3">B2: Điểm đóng góp gián tiếp (Max 10):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={b2Score}
                  onChange={(e) => setB2Score(Number(e.target.value))}
                  disabled={!canEdit || score.status === 'approved'}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                />
              </div>
              <textarea
                placeholder="Ghi chú đóng góp giải ngân..."
                value={b2Notes}
                onChange={(e) => setB2Notes(e.target.value)}
                disabled={!canEdit || score.status === 'approved'}
                rows={2}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          )}

          {/* Nhóm C: Phẩm chất chung */}
          <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Nhóm C: Phẩm chất & Kỷ luật & Sáng kiến (Tối đa {maxC1 + maxC2 + maxC3} điểm)
            </h4>

            {/* C1 */}
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-3 items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350 col-span-3">C1: Đạo đức, kỷ luật tác phong (Max {maxC1}):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={maxC1}
                  value={c1Score}
                  onChange={(e) => setC1Score(Number(e.target.value))}
                  disabled={!canEdit || score.status === 'approved'}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                />
              </div>
              <textarea
                placeholder="Nhận xét C1..."
                value={c1Notes}
                onChange={(e) => setC1Notes(e.target.value)}
                disabled={!canEdit || score.status === 'approved'}
                rows={1.5}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            {/* C2 */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-4 gap-3 items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350 col-span-3">C2: Tuân thủ cập nhật phần mềm (Max {maxC2}):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={maxC2}
                  value={c2Score}
                  onChange={(e) => setC2Score(Number(e.target.value))}
                  disabled={!canEdit || score.status === 'approved'}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                />
              </div>
              <textarea
                placeholder="Nhận xét C2..."
                value={c2Notes}
                onChange={(e) => setC2Notes(e.target.value)}
                disabled={!canEdit || score.status === 'approved'}
                rows={1.5}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            {/* C3 */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-4 gap-3 items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350 col-span-3">C3: Giải thưởng & Sáng kiến sáng tạo (Max {maxC3}):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={maxC3}
                  value={c3Score}
                  onChange={(e) => setC3Score(Number(e.target.value))}
                  disabled={!canEdit || score.status === 'approved'}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                />
              </div>
              <textarea
                placeholder="Nhận xét C3..."
                value={c3Notes}
                onChange={(e) => setC3Notes(e.target.value)}
                disabled={!canEdit || score.status === 'approved'}
                rows={1.5}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Submit Action */}
          {canEdit && score.status !== 'approved' && (
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu kết quả đánh giá'}
            </button>
          )}
        </form>

        {/* Task list for validation */}
        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-655 dark:text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Công việc cá nhân gánh vác ({tasks.length})
            </h4>
          </div>

          {loadingTasks ? (
            <div className="text-center py-6 text-slate-400 text-xs">Đang tải danh sách công việc...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs italic">Không có công việc nào được phân công tháng này.</div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {tasks.map(t => (
                <div key={t.task_id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{t.title}</p>
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
