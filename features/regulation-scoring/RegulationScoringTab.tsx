import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { DepartmentCode, DEPARTMENT_CODES, DEPARTMENT_NAMES } from '../../types/plan.types';
import { RegulationScoringService, DepartmentMonthlyScore, IndividualMonthlyScore } from './services/scoringService';
import { NON_DISBURSEMENT_DEPTS, DEPT_WEIGHTS, INDIV_WEIGHTS } from './types/scoring.types';
import { getEmployees } from '../../services/EmployeeService';
import { ScoreApprovalBar } from './components/ScoreApprovalBar';
import { QuotaWarning } from './components/QuotaWarning';
import { DeptScoreTable } from './components/DeptScoreTable';
import { DeptScoreDetail } from './components/DeptScoreDetail';
import { IndivScoreTable } from './components/IndivScoreTable';
import { IndivScoreDetail } from './components/IndivScoreDetail';
import { AnnualSummaryTab } from './components/AnnualSummaryTab';
import { Award, Users, Shield, RefreshCw } from 'lucide-react';

interface RegulationScoringTabProps {
  month: number;
  year: number;
}

export const RegulationScoringTab: React.FC<RegulationScoringTabProps> = ({ month, year }) => {
  const { currentUser } = useAuth();
  const { openPanel } = useSlidePanel();

  const [activeSubTab, setActiveSubTab] = useState<'department' | 'individual' | 'annual'>('department');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [deptScores, setDeptScores] = useState<DepartmentMonthlyScore[]>([]);
  const [indivScores, setIndivScores] = useState<IndividualMonthlyScore[]>([]);
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [directorApproval, setDirectorApproval] = useState(false);

  const userRole = (currentUser?.Role as string) || 'User';
  const userDept = currentUser?.Department || '';
  const isDirector = userRole === 'Director' || userRole === 'DeputyDirector' || userRole === 'Admin';
  const isDeptHead = userRole === 'DepartmentHead';

  // Available departments in system
  const deptList = useMemo(() => {
    return Object.keys(DEPARTMENT_NAMES) as DepartmentCode[];
  }, []);

  useEffect(() => {
    loadScoringData();
  }, [month, year, selectedDept, activeSubTab]);

  const loadScoringData = async () => {
    setLoading(true);
    try {
      // 1. Fetch employees
      const emps = await getEmployees();
      setEmployees(emps);

      // 2. Fetch dept scores
      const dScores = await RegulationScoringService.getDeptScores(month, year);
      setDeptScores(dScores);

      // 3. Fetch individual scores (filtered by selectedDept if not 'All')
      const targetDept = selectedDept === 'All' ? (isDeptHead ? userDept : deptList[0]) : selectedDept;
      const iScores = await RegulationScoringService.getIndivScores(targetDept, month, year);
      setIndivScores(iScores);
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu chấm điểm:', e);
    } finally {
      setLoading(false);
    }
  };

  // Quota counts for excellent ratings
  const quotaStats = useMemo(() => {
    const total = indivScores.length;
    const excellent = indivScores.filter(s => s.classification === 'xuat_sac').length;
    const good = indivScores.filter(s => s.classification === 'tot').length;
    const satisfactory = indivScores.filter(s => s.classification === 'hoan_thanh').length;
    const unsatisfactory = indivScores.filter(s => s.classification === 'khong_hoan_thanh').length;
    return { total, excellent, good, satisfactory, unsatisfactory };
  }, [indivScores]);

  // Overall status computed from dept scores status (if any is calculated, etc.)
  const sheetStatus = useMemo(() => {
    if (deptScores.length === 0) return 'draft';
    // Use the status of the first department score as representation
    return deptScores[0].status;
  }, [deptScores]);

  // Batch action trigger
  const handleWorkflowAction = async (action: 'calculate' | 'submit' | 'review' | 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      if (action === 'calculate') {
        // Auto-calculate A-scores for all depts & employees
        const emps = await getEmployees();
        
        // Departments calculate loop
        for (const dept of deptList) {
          const aScores = await RegulationScoringService.calculateAScores('department', dept, month, year);
          await RegulationScoringService.upsertDeptScore({
            department_code: dept,
            eval_month: month,
            eval_year: year,
            a1_total_tasks: aScores.total_tasks,
            a1_done_tasks: aScores.done_tasks,
            a1_completion_rate: aScores.completion_rate,
            a1_score: aScores.a1_score,
            a3_on_time_done: aScores.on_time_done,
            a3_total_done: aScores.done_tasks,
            a3_on_time_rate: aScores.on_time_rate,
            a3_score: aScores.a3_score,
            is_disbursement_dept: !NON_DISBURSEMENT_DEPTS.includes(dept as any),
            status: 'calculated',
            total_score: aScores.a1_score + aScores.a3_score,
            classification: 'khong_hoan_thanh'
          });
        }

        // Employees calculate loop
        for (const emp of emps) {
          if (!emp.Department) continue;
          const aScores = await RegulationScoringService.calculateAScores('individual', emp.EmployeeID, month, year);
          await RegulationScoringService.upsertIndivScore({
            employee_id: emp.EmployeeID,
            department_code: emp.Department as any,
            eval_month: month,
            eval_year: year,
            a1_total_tasks: aScores.total_tasks,
            a1_done_tasks: aScores.done_tasks,
            a1_completion_rate: aScores.completion_rate,
            a1_score: aScores.a1_score,
            a3_on_time_done: aScores.on_time_done,
            a3_total_done: aScores.done_tasks,
            a3_on_time_rate: aScores.on_time_rate,
            a3_score: aScores.a3_score,
            is_disbursement_staff: !NON_DISBURSEMENT_DEPTS.includes(emp.Department as any),
            status: 'calculated',
            total_score: aScores.a1_score + aScores.a3_score,
            classification: 'khong_hoan_thanh'
          });
        }

        await loadScoringData();
        alert('Đã tính toán xong chỉ số hoàn thành & đúng hạn cho toàn bộ phòng ban!');
      } else if (action === 'submit') {
        // TP Submit own department scores
        const targetDept = isDeptHead ? userDept : selectedDept;
        if (!targetDept || targetDept === 'All') return;
        
        // Update status of all employee scores in department to reviewed
        for (const score of indivScores) {
          await RegulationScoringService.upsertIndivScore({
            ...score,
            status: 'reviewed'
          });
        }
        await loadScoringData();
        alert('Đã nộp bảng điểm cá nhân của phòng lên Lãnh đạo thẩm duyệt!');
      } else if (action === 'review') {
        // Director reviews draft
        for (const score of deptScores) {
          await RegulationScoringService.upsertDeptScore({
            ...score,
            status: 'reviewed'
          });
        }
        await loadScoringData();
        alert('Đã xác nhận bảng điểm phòng ban ở mức Nháp!');
      } else if (action === 'approve') {
        // Director approves officially
        for (const score of deptScores) {
          await RegulationScoringService.upsertDeptScore({
            ...score,
            status: 'approved',
            approved_by: currentUser?.EmployeeID,
            approved_at: new Date().toISOString()
          });
        }
        for (const score of indivScores) {
          await RegulationScoringService.upsertIndivScore({
            ...score,
            status: 'approved',
            approved_by: currentUser?.EmployeeID,
            approved_at: new Date().toISOString()
          });
        }
        await loadScoringData();
        alert('Phê duyệt chính thức bảng điểm thành công!');
      } else if (action === 'reject') {
        // Return for adjustment
        for (const score of deptScores) {
          await RegulationScoringService.upsertDeptScore({
            ...score,
            status: 'calculated'
          });
        }
        for (const score of indivScores) {
          await RegulationScoringService.upsertIndivScore({
            ...score,
            status: 'calculated'
          });
        }
        await loadScoringData();
        alert('Đã trả lại bảng đánh giá để điều chỉnh.');
      }
    } catch (e) {
      console.error('Lỗi thực hiện hành động quy trình:', e);
      alert('Thao tác thất bại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDeptDetail = (score: DepartmentMonthlyScore) => {
    openPanel({
      title: `Phòng ${score.department_code} - Đánh giá`,
      component: (
        <DeptScoreDetail
          score={score}
          userRole={userRole}
          onSave={async (updated) => {
            await RegulationScoringService.upsertDeptScore(updated);
            await loadScoringData();
          }}
          onClose={() => {}}
        />
      ),
      width: '40vw',
    });
  };

  const handleOpenIndivDetail = (score: IndividualMonthlyScore) => {
    openPanel({
      title: `Nhân viên: ${score.employee_name}`,
      component: (
        <IndivScoreDetail
          score={score}
          userRole={userRole}
          userDept={userDept}
          onSave={async (updated) => {
            await RegulationScoringService.upsertIndivScore(updated);
            await loadScoringData();
          }}
          onClose={() => {}}
        />
      ),
      width: '40vw',
    });
  };

  return (
    <div className="space-y-4">
      {/* Upper bar: workflow actions */}
      <ScoreApprovalBar
        status={sheetStatus as any}
        userRole={userRole}
        onAction={handleWorkflowAction}
        loading={actionLoading}
      />

      {/* Sub tabs selectors */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 flex-wrap gap-2">
        <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-xl p-0.5">
          <button
            onClick={() => setActiveSubTab('department')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'department'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Đánh giá phòng ban
          </button>
          <button
            onClick={() => setActiveSubTab('individual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'individual'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Đánh giá cá nhân
          </button>
          <button
            onClick={() => setActiveSubTab('annual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'annual'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Tổng hợp năm
          </button>
        </div>

        {/* Dept dropdown filter for Individual subtab */}
        {activeSubTab === 'individual' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Chọn phòng ban:</span>
            <select
              value={selectedDept === 'All' && isDeptHead ? userDept : selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              disabled={isDeptHead} // DeptHead only sees own dept
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
            >
              {isDirector && <option value="All">-- Chọn phòng ban --</option>}
              {deptList.map(dept => (
                <option key={dept} value={dept}>{DEPARTMENT_NAMES[dept]}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Tab Render */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          Đang tải dữ liệu đánh giá...
        </div>
      ) : activeSubTab === 'department' ? (
        <div className="space-y-4">
          {deptScores.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 text-xs italic">
              Chưa có bảng tính điểm cho tháng này. Vui lòng bấm "Tính điểm tự động" để khởi tạo.
            </div>
          ) : (
            <DeptScoreTable
              scores={deptScores}
              onSelectRow={handleOpenDeptDetail}
              userRole={userRole}
            />
          )}
        </div>
      ) : activeSubTab === 'individual' ? (
        <div className="space-y-4">
          {indivScores.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 text-xs italic">
              Chưa có bảng đánh giá cá nhân phòng này.
            </div>
          ) : (
            <>
              {/* Quota warning */}
              <QuotaWarning
                excellentCount={quotaStats.excellent}
                goodCount={quotaStats.good}
                satisfactoryCount={quotaStats.satisfactory}
                unsatisfactoryCount={quotaStats.unsatisfactory}
                directorApproval={directorApproval}
                onDirectorApprovalToggle={() => setDirectorApproval(!directorApproval)}
              />

              <IndivScoreTable
                scores={indivScores}
                onSelectRow={handleOpenIndivDetail}
                userRole={userRole}
                userDept={userDept}
              />
            </>
          )}
        </div>
      ) : (
        <AnnualSummaryTab
          entityType={isDirector ? 'department' : 'individual'}
          entityId={isDirector ? (selectedDept === 'All' ? deptList[0] : selectedDept) : (currentUser?.EmployeeID || '')}
          year={year}
        />
      )}
    </div>
  );
};
export default RegulationScoringTab;
