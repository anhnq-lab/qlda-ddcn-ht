import React from 'react';
import { DepartmentCode, DEPARTMENT_NAMES } from '../../../types/plan.types';
import { DepartmentMonthlyScore } from '../services/scoringService';
import { NON_DISBURSEMENT_DEPTS, classifyScore } from '../types/scoring.types';
import { StatusBadge } from '../../../components/ui';
import { Info, Edit } from 'lucide-react';

interface DeptScoreTableProps {
  scores: DepartmentMonthlyScore[];
  onSelectRow: (score: DepartmentMonthlyScore) => void;
  userRole: string;
}

export const DeptScoreTable: React.FC<DeptScoreTableProps> = ({
  scores,
  onSelectRow,
  userRole,
}) => {
  const isDirector = userRole === 'Director' || userRole === 'DeputyDirector' || userRole === 'Admin';

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
    <div className="border border-border-subtle rounded-2xl overflow-hidden shadow-sm bg-bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle/80 text-[10px] font-black uppercase tracking-wider text-txt-muted border-b border-border-subtle">
            <tr>
              <th className="px-4 py-3.5 text-left">Phòng ban</th>
              <th className="px-3 py-3.5 text-center w-20">A1 (Tổng)</th>
              <th className="px-3 py-3.5 text-center w-20">A2 (Chất lượng)</th>
              <th className="px-3 py-3.5 text-center w-20">A3 (Đúng hạn)</th>
              <th className="px-3 py-3.5 text-center w-20">B1 (Giải ngân)</th>
              <th className="px-3 py-3.5 text-center w-20">B2 (Mục tiêu)</th>
              <th className="px-3 py-3.5 text-center w-20">C1 (Quy chế)</th>
              <th className="px-3 py-3.5 text-center w-20">C2 (Sáng kiến)</th>
              <th className="px-4 py-3.5 text-center w-24">Tổng điểm</th>
              <th className="px-4 py-3.5 text-center w-32">Xếp loại</th>
              <th className="px-4 py-3.5 text-center w-24">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
            {scores.map(s => {
              const isNonDisb = NON_DISBURSEMENT_DEPTS.includes(s.department_code as any);
              const deptName = DEPARTMENT_NAMES[s.department_code] || s.department_code;

              return (
                <tr
                  key={s.department_code}
                  className="hover:bg-slate-50/55 dark:hover:bg-slate-800/40 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer"
                  onClick={() => onSelectRow(s)}
                >
                  <td className="px-4 py-3.5 text-left">
                    <div className="flex flex-col">
                      <span className="font-bold text-txt-primary">{deptName}</span>
                      <span className="text-[9px] font-bold text-txt-placeholder uppercase tracking-widest mt-0.5">
                        {isNonDisb ? 'Không giải ngân' : 'Có giải ngân'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center font-mono">{s.a1_score}</td>
                  <td className="px-3 py-3.5 text-center font-mono text-slate-500">{s.a2_score}</td>
                  <td className="px-3 py-3.5 text-center font-mono">{s.a3_score}</td>
                  <td className="px-3 py-3.5 text-center font-mono text-slate-500">
                    {isNonDisb ? <span className="text-slate-300 dark:text-slate-700">—</span> : s.b1_score}
                  </td>
                  <td className="px-3 py-3.5 text-center font-mono text-slate-500">
                    {isNonDisb ? <span className="text-slate-300 dark:text-slate-700">—</span> : s.b2_score}
                  </td>
                  <td className="px-3 py-3.5 text-center font-mono text-slate-500">{s.c1_score}</td>
                  <td className="px-3 py-3.5 text-center font-mono text-slate-500">{s.c2_score}</td>
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
                      {isDirector ? (
                        <>
                          <Edit className="w-3 h-3" />
                          Chấm điểm
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
