import React from 'react';
import { IndividualMonthlyScore } from '../services/scoringService';
import { NON_DISBURSEMENT_DEPTS } from '../types/scoring.types';
import { StatusBadge } from '../../../components/ui';
import { Info, Edit } from 'lucide-react';

interface IndivScoreTableProps {
  scores: IndividualMonthlyScore[];
  onSelectRow: (score: IndividualMonthlyScore) => void;
  userRole: string;
  userDept: string;
}

export const IndivScoreTable: React.FC<IndivScoreTableProps> = ({
  scores,
  onSelectRow,
  userRole,
  userDept,
}) => {
  const isDirector = userRole === 'Director' || userRole === 'DeputyDirector' || userRole === 'Admin';
  const isDeptHead = userRole === 'DepartmentHead';

  const canEdit = (score: IndividualMonthlyScore) => {
    if (isDirector) return true;
    if (isDeptHead && score.department_code === userDept) return true;
    return false;
  };

  const getClassBadgeVariant = (classification: string) => {
    switch (classification) {
      case 'xuat_sac': return 'warning';
      case 'tot': return 'success';
      case 'hoan_thanh': return 'info';
      case 'khong_hoan_thanh': return 'danger';
      default: return 'neutral';
    }
  };

  const getClassificationLabel = (classification: string) => {
    switch (classification) {
      case 'xuat_sac': return 'Xuất sắc';
      case 'tot': return 'Tốt';
      case 'hoan_thanh': return 'Hoàn thành';
      case 'khong_hoan_thanh': return 'Chưa xong';
      default: return 'Chưa có';
    }
  };

  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3.5 text-left">Nhân viên</th>
              <th className="px-3 py-3.5 text-center w-20">A1 (Tổng)</th>
              <th className="px-3 py-3.5 text-center w-20">A2 (Chất lượng)</th>
              <th className="px-3 py-3.5 text-center w-20">A3 (Đúng hạn)</th>
              <th className="px-3 py-3.5 text-center w-20">B1 (Giải ngân)</th>
              <th className="px-3 py-3.5 text-center w-20">C1 (Quy chế)</th>
              <th className="px-3 py-3.5 text-center w-20">C2 (Phần mềm)</th>
              <th className="px-3 py-3.5 text-center w-20">C3 (Sáng kiến)</th>
              <th className="px-4 py-3.5 text-center w-24">Tổng điểm</th>
              <th className="px-4 py-3.5 text-center w-32">Xếp loại</th>
              <th className="px-4 py-3.5 text-center w-24">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
            {scores.map(s => {
              const isNonDisb = NON_DISBURSEMENT_DEPTS.includes(s.department_code as any);
              const editable = canEdit(s);

              return (
                <tr
                  key={s.employee_id}
                  className="hover:bg-slate-50/55 dark:hover:bg-slate-800/40 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer"
                  onClick={() => onSelectRow(s)}
                >
                  <td className="px-4 py-3.5 text-left">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white">{s.employee_name}</span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                        Mã: {s.employee_id} • Phòng: {s.department_code}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center font-mono">{s.a1_score}</td>
                  <td className="px-3 py-3.5 text-center font-mono text-slate-500">{s.a2_score}</td>
                  <td className="px-3 py-3.5 text-center font-mono">{s.a3_score}</td>
                  <td className="px-3 py-3.5 text-center font-mono text-slate-500">
                    {isNonDisb ? <span className="text-slate-300 dark:text-slate-700">—</span> : s.b1_score}
                  </td>
                  <td className="px-3 py-3.5 text-center font-mono text-slate-500">{s.c1_score}</td>
                  <td className="px-3 py-3.5 text-center font-mono text-slate-500">{s.c2_score}</td>
                  <td className="px-3 py-3.5 text-center font-mono text-slate-500">{s.c3_score}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-primary-600 dark:text-primary-400 font-mono text-sm">
                    {s.total_score}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <StatusBadge
                      variant={getClassBadgeVariant(s.classification) as any}
                      label={getClassificationLabel(s.classification)}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRow(s);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {editable && s.status !== 'approved' ? (
                        <>
                          <Edit className="w-3 h-3" />
                          Đánh giá
                        </>
                      ) : (
                        <>
                          <Info className="w-3 h-3" />
                          Chi tiết
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
