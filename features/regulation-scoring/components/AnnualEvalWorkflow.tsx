import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { RegulationScoringService, AnnualEvaluation } from '../services/scoringService';
import { getEmployees } from '../../../services/EmployeeService';
import { Calendar, UserCheck, Users, ShieldAlert, Award, FileText, CheckCircle2, ChevronRight, AlertCircle, Save } from 'lucide-react';

interface AnnualEvalWorkflowProps {
  employeeId: string;
  employeeName: string;
  departmentCode: string;
  year: number;
  onWorkflowUpdated?: () => void;
}

export const AnnualEvalWorkflow: React.FC<AnnualEvalWorkflowProps> = ({
  employeeId,
  employeeName,
  departmentCode,
  year,
  onWorkflowUpdated
}) => {
  const { currentUser } = useAuth();
  
  const [evaluation, setEvaluation] = useState<AnnualEvaluation | null>(null);
  const [monthlyAvg, setMonthlyAvg] = useState<number>(0);
  const [monthlyScoresCount, setMonthlyScoresCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employeesInDept, setEmployeesInDept] = useState<any[]>([]);
  const [deptEvaluations, setDeptEvaluations] = useState<AnnualEvaluation[]>([]);

  // Form states
  const [selfScore, setSelfScore] = useState<string>('');
  const [selfClass, setSelfClass] = useState<'xuat_sac' | 'tot' | 'hoan_thanh' | 'khong_hoan_thanh'>('tot');
  const [selfNotes, setSelfNotes] = useState<string>('');

  const [deptMeetingDate, setDeptMeetingDate] = useState<string>('');
  const [deptMeetingNotes, setDeptMeetingNotes] = useState<string>('');

  const [headProposedClass, setHeadProposedClass] = useState<'xuat_sac' | 'tot' | 'hoan_thanh' | 'khong_hoan_thanh'>('tot');
  const [headProposalNotes, setHeadProposalNotes] = useState<string>('');

  const [leadershipClass, setLeadershipClass] = useState<'xuat_sac' | 'tot' | 'hoan_thanh' | 'khong_hoan_thanh'>('tot');
  const [leadershipNotes, setLeadershipNotes] = useState<string>('');

  const userRole = (currentUser?.Role as string) || 'User';
  const userEmployeeId = currentUser?.EmployeeID || '';
  const isDirector = userRole === 'Admin' || userRole === 'Director' || userRole === 'DeputyDirector';
  const isDeptHead = userRole === 'DepartmentHead' || currentUser?.Position?.includes('Trưởng phòng');
  const isSelf = userEmployeeId === employeeId;

  useEffect(() => {
    loadWorkflowData();
  }, [employeeId, year]);

  const loadWorkflowData = async () => {
    setLoading(true);
    try {
      // 1. Get annual avg
      const avgData = await RegulationScoringService.getAnnualAverage('individual', employeeId, year);
      setMonthlyAvg(avgData.average);
      setMonthlyScoresCount(avgData.count);

      // 2. Get active employees in dept
      const emps = await getEmployees();
      const deptEmps = emps.filter((e: any) => e.Department === departmentCode || e.department_code === departmentCode);
      setEmployeesInDept(deptEmps);

      // 3. Get dept annual evals for quota check
      if (departmentCode) {
        const dEvals = await RegulationScoringService.getAnnualEvaluationsByDept(departmentCode, year);
        setDeptEvaluations(dEvals);
      }

      // 4. Get individual annual evaluation record
      let evalData = await RegulationScoringService.getAnnualEvaluation('individual', employeeId, year);
      if (!evalData) {
        // Create initial draft
        evalData = await RegulationScoringService.upsertAnnualEvaluation({
          entity_type: 'individual',
          entity_id: employeeId,
          eval_year: year,
          current_step: 'self_eval',
          monthly_avg: avgData.average,
          published: false
        });
      }
      setEvaluation(evalData);

      // Populate forms
      setSelfScore(evalData.self_eval_data?.score || '');
      setSelfClass(evalData.self_eval_data?.self_class || 'tot');
      setSelfNotes(evalData.self_eval_data?.notes || '');

      setDeptMeetingDate(evalData.dept_meeting_date || '');
      setDeptMeetingNotes(evalData.dept_meeting_notes || '');

      setHeadProposedClass(evalData.head_proposed_class || 'tot');
      setHeadProposalNotes(evalData.head_proposal_notes || '');

      setLeadershipClass(evalData.leadership_final_class || evalData.head_proposed_class || 'tot');
      setLeadershipNotes(evalData.leadership_notes || '');

    } catch (e) {
      console.error('Lỗi load dữ liệu đánh giá năm:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!evaluation) return;
    setSaving(true);
    try {
      const payload: Partial<AnnualEvaluation> = {
        ...evaluation,
        self_eval_data: { score: selfScore, self_class: selfClass, notes: selfNotes },
        dept_meeting_date: deptMeetingDate || null,
        dept_meeting_notes: deptMeetingNotes,
        head_proposed_class: headProposedClass,
        head_proposal_notes: headProposalNotes,
        leadership_final_class: leadershipClass,
        leadership_notes: leadershipNotes
      };
      const updated = await RegulationScoringService.upsertAnnualEvaluation(payload);
      setEvaluation(updated);
      alert('Đã lưu bản nháp thành công!');
    } catch (e) {
      console.error('Lỗi khi lưu bản nháp:', e);
      alert('Không thể lưu bản nháp.');
    } finally {
      setSaving(false);
    }
  };

  const handleTransitionStep = async (nextStep: 'dept_meeting' | 'head_proposal' | 'leadership_final' | 'published') => {
    if (!evaluation) return;
    
    // Quota Validation for Step 3 transition or Step 4 approval
    if (nextStep === 'leadership_final' && headProposedClass === 'xuat_sac') {
      const excellentCount = deptEvaluations.filter(e => e.head_proposed_class === 'xuat_sac').length;
      const totalCount = employeesInDept.length;
      const limit = Math.ceil(totalCount * 0.2); // 20% limit
      if (excellentCount >= limit) {
        const proceed = window.confirm(
          `Cảnh báo: Phòng đã đề xuất ${excellentCount}/${totalCount} cán bộ hoàn thành Xuất sắc (vượt hạn ngạch 20% ~ ${limit} người). Bạn vẫn muốn tiếp tục?`
        );
        if (!proceed) return;
      }
    }

    setSaving(true);
    try {
      const payload: Partial<AnnualEvaluation> = {
        ...evaluation,
        self_eval_data: { score: selfScore, self_class: selfClass, notes: selfNotes },
        dept_meeting_date: deptMeetingDate || null,
        dept_meeting_notes: deptMeetingNotes,
        head_proposed_class: headProposedClass,
        head_proposal_notes: headProposalNotes,
        leadership_final_class: leadershipClass,
        leadership_notes: leadershipNotes
      };

      if (nextStep === 'published') {
        payload.published = true;
        payload.published_at = new Date().toISOString();
        payload.classification = leadershipClass;
        payload.final_score = Number(monthlyAvg);
      } else {
        payload.current_step = nextStep;
      }

      const updated = await RegulationScoringService.upsertAnnualEvaluation(payload);
      setEvaluation(updated);
      onWorkflowUpdated?.();
      alert(nextStep === 'published' ? 'Đã hoàn thành phê duyệt và công bố xếp loại năm!' : 'Chuyển bước thành công!');
    } catch (e) {
      console.error('Lỗi chuyển bước đánh giá:', e);
      alert('Thao tác chuyển bước thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-xs italic">
        Đang tải thông tin quy trình đánh giá năm...
      </div>
    );
  }

  if (!evaluation) return null;

  const currentStep = evaluation.current_step;
  const isPublished = evaluation.published;

  // Quota indicators
  const totalEmployees = employeesInDept.length;
  const currentExcellentProposed = deptEvaluations.filter(e => e.head_proposed_class === 'xuat_sac').length;
  const excellentLimit = Math.max(1, Math.floor(totalEmployees * 0.20));

  const steps = [
    { key: 'self_eval', label: 'Cá nhân tự chấm', icon: UserCheck, desc: 'NV tự đánh giá kết quả' },
    { key: 'dept_meeting', label: 'Họp bình xét', icon: Users, desc: 'Họp lấy ý kiến phòng' },
    { key: 'head_proposal', label: 'Trưởng phòng đề xuất', icon: FileText, desc: 'TP chấm & duyệt đề xuất' },
    { key: 'leadership_final', label: 'Lãnh đạo phê duyệt', icon: Award, desc: 'Lãnh đạo phê duyệt chung' },
  ];

  const getStepIndex = (stepKey: string) => {
    return steps.findIndex(s => s.key === stepKey);
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-8 shadow-sm">
      
      {/* ── Steps Progress Bar ── */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-primary-500 -translate-y-1/2 z-0 transition-all duration-500" 
          style={{ width: `${isPublished ? 100 : (currentIndex / (steps.length - 1)) * 100}%` }}
        />
        
        <div className="relative z-10 flex justify-between gap-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = isPublished || idx < currentIndex;
            const isActive = !isPublished && idx === currentIndex;
            
            return (
              <div key={s.key} className="flex flex-col items-center text-center space-y-2">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-350 ${
                    isCompleted 
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10' 
                      : isActive 
                        ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-600/15'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="max-w-[120px]">
                  <p className={`text-[11px] font-black ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {s.label}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Status Banner ── */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Đang đánh giá cán bộ</span>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">{employeeName}</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Trung bình điểm 12 tháng: <strong className="text-primary-600 dark:text-primary-400 font-extrabold">{monthlyAvg} điểm</strong> ({monthlyScoresCount}/12 tháng có điểm)
          </p>
        </div>
        {isPublished ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            Đã công bố xếp loại
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900 rounded-full text-primary-600 dark:text-primary-400 text-xs font-bold shadow-sm">
            <Calendar className="w-4 h-4" />
            Bước: {steps[currentIndex].label}
          </div>
        )}
      </div>

      {/* ── Main Form content per step ── */}
      <div className="space-y-6">

        {/* ══ STEP 1: SELF EVALUATION ══ */}
        <div className={`p-5 rounded-2xl border transition-all ${
          currentStep === 'self_eval' && !isPublished
            ? 'bg-primary-50/20 dark:bg-primary-900/10 border-primary-200/50 dark:border-primary-800/50 shadow-sm'
            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-75'
        }`}>
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-4">
            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] flex items-center justify-center font-bold">1</span>
            Cá nhân tự đánh giá & chấm điểm
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Tự chấm điểm B/C tổng hợp</label>
              <input
                type="number"
                min="0"
                max="100"
                value={selfScore}
                onChange={(e) => setSelfScore(e.target.value)}
                disabled={currentStep !== 'self_eval' || isPublished || !isSelf}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                placeholder="Nhập tổng điểm tự đánh giá..."
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Tự đề xuất xếp loại</label>
              <select
                value={selfClass}
                onChange={(e: any) => setSelfClass(e.target.value)}
                disabled={currentStep !== 'self_eval' || isPublished || !isSelf}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                <option value="xuat_sac">Hoàn thành xuất sắc</option>
                <option value="tot">Hoàn thành tốt</option>
                <option value="hoan_thanh">Hoàn thành nhiệm vụ</option>
                <option value="khong_hoan_thanh">Không hoàn thành</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Ghi chú tự đánh giá thành tích nổi bật</label>
              <textarea
                value={selfNotes}
                onChange={(e) => setSelfNotes(e.target.value)}
                disabled={currentStep !== 'self_eval' || isPublished || !isSelf}
                rows={3}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                placeholder="Nêu tóm tắt sáng kiến, thành tích xuất sắc đạt được trong năm..."
              />
            </div>
          </div>

          {currentStep === 'self_eval' && isSelf && !isPublished && (
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-lg text-[10px] font-bold transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Lưu nháp
              </button>
              <button
                onClick={() => handleTransitionStep('dept_meeting')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all"
              >
                Gửi họp phòng bình xét
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ══ STEP 2: DEPARTMENT MEETING ══ */}
        <div className={`p-5 rounded-2xl border transition-all ${
          currentStep === 'dept_meeting' && !isPublished
            ? 'bg-primary-50/20 dark:bg-primary-900/10 border-primary-200/50 dark:border-primary-800/50 shadow-sm'
            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-75'
        }`}>
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-4">
            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] flex items-center justify-center font-bold">2</span>
            Họp bình xét phòng
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Ngày họp bình xét</label>
              <input
                type="date"
                value={deptMeetingDate}
                onChange={(e) => setDeptMeetingDate(e.target.value)}
                disabled={currentStep !== 'dept_meeting' || isPublished || (!isDeptHead && !isDirector)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Tóm tắt ý kiến đóng góp của tập thể</label>
              <textarea
                value={deptMeetingNotes}
                onChange={(e) => setDeptMeetingNotes(e.target.value)}
                disabled={currentStep !== 'dept_meeting' || isPublished || (!isDeptHead && !isDirector)}
                rows={3}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                placeholder="Ghi nhận các ý kiến đóng góp của tập thể phòng tại biên bản họp..."
              />
            </div>
          </div>

          {currentStep === 'dept_meeting' && (isDeptHead || isDirector) && !isPublished && (
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-lg text-[10px] font-bold transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Lưu nháp
              </button>
              <button
                onClick={() => handleTransitionStep('head_proposal')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all"
              >
                Chuyển bước Trưởng phòng đề xuất
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ══ STEP 3: TRƯỞNG PHÒNG ĐỀ XUẤT ══ */}
        <div className={`p-5 rounded-2xl border transition-all ${
          currentStep === 'head_proposal' && !isPublished
            ? 'bg-primary-50/20 dark:bg-primary-900/10 border-primary-200/50 dark:border-primary-800/50 shadow-sm'
            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-75'
        }`}>
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-4">
            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] flex items-center justify-center font-bold">3</span>
            Trưởng phòng đề xuất xếp loại
          </h4>

          {/* Quota Info Block */}
          {currentStep === 'head_proposal' && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
              <div className="text-[11px] text-amber-800 dark:text-amber-300">
                <p className="font-bold">Hạn ngạch Hoàn thành Xuất sắc (20% cán bộ phòng):</p>
                <p className="mt-0.5">
                  - Tổng nhân sự phòng: <strong>{totalEmployees} người</strong>. Hạn ngạch Xuất sắc tối đa: <strong>{excellentLimit} người</strong>.
                </p>
                <p className="mt-0.5">
                  - Số lượng đã đề xuất Xuất sắc hiện tại: <strong>{currentExcellentProposed} người</strong>.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Trưởng phòng đề xuất loại</label>
              <select
                value={headProposedClass}
                onChange={(e: any) => setHeadProposedClass(e.target.value)}
                disabled={currentStep !== 'head_proposal' || isPublished || (!isDeptHead && !isDirector)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                <option value="xuat_sac">Hoàn thành xuất sắc</option>
                <option value="tot">Hoàn thành tốt</option>
                <option value="hoan_thanh">Hoàn thành nhiệm vụ</option>
                <option value="khong_hoan_thanh">Không hoàn thành</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Lý do/Ghi chú của Trưởng phòng</label>
              <textarea
                value={headProposalNotes}
                onChange={(e) => setHeadProposalNotes(e.target.value)}
                disabled={currentStep !== 'head_proposal' || isPublished || (!isDeptHead && !isDirector)}
                rows={3}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                placeholder="Nhận xét cụ thể của Trưởng phòng về năng lực, kết quả hoàn thành nhiệm vụ..."
              />
            </div>
          </div>

          {currentStep === 'head_proposal' && (isDeptHead || isDirector) && !isPublished && (
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-lg text-[10px] font-bold transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Lưu nháp
              </button>
              <button
                onClick={() => handleTransitionStep('leadership_final')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all"
              >
                Nộp lên Lãnh đạo thẩm duyệt
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ══ STEP 4: LÃNH ĐẠO PHÊ DUYỆT CHUNG ══ */}
        <div className={`p-5 rounded-2xl border transition-all ${
          (currentStep === 'leadership_final' || isPublished)
            ? 'bg-primary-50/20 dark:bg-primary-900/10 border-primary-200/50 dark:border-primary-800/50 shadow-sm'
            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-75'
        }`}>
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-4">
            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] flex items-center justify-center font-bold">4</span>
            Lãnh đạo Ban phê duyệt & Công bố
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Lãnh đạo quyết định loại</label>
              <select
                value={leadershipClass}
                onChange={(e: any) => setLeadershipClass(e.target.value)}
                disabled={(currentStep !== 'leadership_final' && !isPublished) || isPublished || !isDirector}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                <option value="xuat_sac">Hoàn thành xuất sắc</option>
                <option value="tot">Hoàn thành tốt</option>
                <option value="hoan_thanh">Hoàn thành nhiệm vụ</option>
                <option value="khong_hoan_thanh">Không hoàn thành</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Nhận xét / Ý kiến chỉ đạo của Lãnh đạo</label>
              <textarea
                value={leadershipNotes}
                onChange={(e) => setLeadershipNotes(e.target.value)}
                disabled={(currentStep !== 'leadership_final' && !isPublished) || isPublished || !isDirector}
                rows={3}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                placeholder="Ý kiến chỉ đạo, kết luận của Giám đốc Ban..."
              />
            </div>
          </div>

          {currentStep === 'leadership_final' && isDirector && !isPublished && (
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-lg text-[10px] font-bold transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Lưu nháp
              </button>
              <button
                onClick={() => handleTransitionStep('published')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all"
              >
                Phê duyệt & Công bố chính thức
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
export default AnnualEvalWorkflow;
