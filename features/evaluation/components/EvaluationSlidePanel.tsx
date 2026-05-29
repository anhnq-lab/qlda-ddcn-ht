import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, Send, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import {
    type EvaluationForm, type EvalScores, type FormType, type G2_1_Leader, type G2_1_Staff,
    type G4_Leader, type G4_Staff,
    DEFAULT_LEADER_SCORES, DEFAULT_STAFF_SCORES,
    calcG1, calcG2_1, calcTotal, getClassification, getFormTotal,
    COMPLETION_LEVELS, MONTHS_VI, STATUS_CONFIG, CLASSIFICATION_CONFIG,
    G1_ITEMS, G2_1_LEADER_ITEMS, G2_1_STAFF_ITEMS, G4_LEADER_ITEMS, G4_STAFF_ITEMS,
} from '../types/evaluation.types';
import { EvaluationService } from '../services/evaluationService';
import { useAuth } from '../../../context/AuthContext';
import { Role } from '../../../types/employee.types';
import { TaskService, type DbTask } from '../../../services/TaskService';
import { TaskStatus } from '../../../types/task.types';

// ─── Mini score row ───────────────────────────────────────────
const ScoreRow: React.FC<{
    code?: string;
    label: string;
    max: number;
    selfValue: number;
    managerValue?: number;
    onSelfChange: (v: number) => void;
    onManagerChange: (v: number) => void;
    disabledSelf?: boolean;
    disabledManager?: boolean;
    showManager?: boolean;
}> = ({ code, label, max, selfValue, managerValue, onSelfChange, onManagerChange, disabledSelf, disabledManager, showManager }) => {
    
    const renderScoreBox = (val: number, onChange: (v: number) => void, disabled?: boolean, isManager?: boolean) => {
        return (
            <div className={`flex flex-col items-end gap-1 w-20 shrink-0 ${isManager ? 'bg-primary-50 dark:bg-primary-900/10 p-1.5 rounded-lg border border-primary-100 dark:border-primary-800' : ''}`}>
                {isManager && <span className="text-[9px] font-bold text-primary-600 uppercase mb-0.5">Phê duyệt</span>}
                {!isManager && showManager && <span className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Tự chấm</span>}
                <div className="flex items-center gap-1 w-full justify-end">
                    <input type="number" min={0} max={max} value={val} disabled={disabled}
                        onChange={e => { const v = +e.target.value; if (!isNaN(v)) onChange(Math.min(max, Math.max(0, v))); }}
                        className={`w-10 text-center border rounded px-1 py-0.5 focus:outline-none text-xs font-bold
                            ${isManager 
                                ? 'bg-bg-surface border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-400 focus:ring-1 focus:ring-primary-500' 
                                : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-txt-secondary'} 
                            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} />
                    <span className="text-[10px] text-slate-400">/{max}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-3 py-3 border-b border-border-subtle last:border-0">
            {code && <span className="text-[10px] font-bold text-slate-400 w-7 shrink-0 mt-1">{code}</span>}
            <p className="text-xs text-txt-muted flex-1 leading-snug mt-1">{label}</p>
            <div className="flex items-start gap-2 shrink-0">
                {renderScoreBox(selfValue, onSelfChange, disabledSelf, false)}
                {showManager && managerValue !== undefined && renderScoreBox(managerValue, onManagerChange, disabledManager, true)}
            </div>
        </div>
    );
};

// ─── Section card ─────────────────────────────────────────────
const Section: React.FC<{
    title: string;
    subtitle?: string;
    selfScore: number;
    managerScore?: number;
    maxScore: number;
    children: React.ReactNode;
    defaultOpen?: boolean;
    showManager?: boolean;
}> = ({ title, subtitle, selfScore, managerScore, maxScore, children, defaultOpen = true, showManager }) => {
    const [open, setOpen] = useState(defaultOpen);
    const selfPct = Math.min(100, (selfScore / maxScore) * 100);
    
    return (
        <div className="bg-bg-surface rounded-xl border border-border overflow-hidden mb-3">
            <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-50">
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-txt-primary">{title}</span>
                        {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 uppercase">Tự chấm:</span>
                            <span className="text-xs font-bold text-txt-secondary">{selfScore}/{maxScore}</span>
                        </div>
                        {showManager && managerScore !== undefined && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-primary-500 uppercase font-bold">Phê duyệt:</span>
                                <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{managerScore}/{maxScore}</span>
                            </div>
                        )}
                    </div>
                </div>
                {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
            </button>
            {open && <div className="px-4 pb-3">{children}</div>}
        </div>
    );
};

// ─── Main Panel ───────────────────────────────────────────────
import {
    useCreateEvaluation,
    useUpdateSelfScores,
    useSubmitEvaluation,
    useApproveEvaluation,
    useRejectEvaluation
} from '../../../hooks/useEvaluations';

interface Props {
    existingForm?: EvaluationForm|null;
    defaultMonth?: number;
    defaultYear?: number;
    onSaved?: (f: EvaluationForm) => void;
    onClose?: () => void;
}

const EvaluationSlidePanel: React.FC<Props> = ({existingForm,defaultMonth,defaultYear,onSaved,onClose}) => {
    const { currentUser } = useAuth();
    const now = new Date();
    const isManager = currentUser?.Role===Role.Manager||currentUser?.Role===Role.Admin;

    const [month,setMonth]   = useState(defaultMonth??now.getMonth()+1);
    const [year,setYear]     = useState(defaultYear??now.getFullYear());
    const [formType,setFormType] = useState<FormType>(existingForm?.form_type??'staff');
    const [chucVu,setChucVu] = useState(existingForm?.chuc_vu??'');
    const [notes,setNotes]   = useState(existingForm?.self_notes??'');
    const [managerNotes,setManagerNotes] = useState(existingForm?.manager_notes??'');
    const [saving,setSaving] = useState(false);
    const [error,setError]   = useState<string|null>(null);
    const [success,setSuccess]= useState<string|null>(null);
    const [employeeTasks, setEmployeeTasks] = useState<DbTask[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);

    // React Query Mutations
    const createMutation = useCreateEvaluation();
    const updateSelfScoresMutation = useUpdateSelfScores();
    const submitMutation = useSubmitEvaluation();
    const approveMutation = useApproveEvaluation();
    const rejectMutation = useRejectEvaluation();

    const initScores = useCallback(():EvalScores=>{
        if(existingForm?.self_scores && Object.keys(existingForm.self_scores).length>0)
            return JSON.parse(JSON.stringify(existingForm.self_scores));
        return formType==='leader'? JSON.parse(JSON.stringify(DEFAULT_LEADER_SCORES)) : JSON.parse(JSON.stringify(DEFAULT_STAFF_SCORES));
    },[existingForm,formType]);

    const initManagerScores = useCallback(():EvalScores=>{
        if(existingForm?.manager_scores && Object.keys(existingForm.manager_scores).length>0)
            return JSON.parse(JSON.stringify(existingForm.manager_scores));
        // Fallback to self_scores if manager hasn't scored yet
        if(existingForm?.self_scores && Object.keys(existingForm.self_scores).length>0)
            return JSON.parse(JSON.stringify(existingForm.self_scores));
        return formType==='leader'? JSON.parse(JSON.stringify(DEFAULT_LEADER_SCORES)) : JSON.parse(JSON.stringify(DEFAULT_STAFF_SCORES));
    },[existingForm,formType]);

    const [scores,setScores] = useState<EvalScores>(initScores);
    const [managerScores,setManagerScores] = useState<EvalScores>(initManagerScores);

    useEffect(()=>{
        setScores(initScores());
        setManagerScores(initManagerScores());
        setNotes(existingForm?.self_notes??'');
        setManagerNotes(existingForm?.manager_notes??'');
        setChucVu(existingForm?.chuc_vu??'');
    },[existingForm,initScores,initManagerScores]);

    // When formType changes on new form, reset scores
    useEffect(()=>{
        if(!existingForm) {
            const def = formType==='leader'? JSON.parse(JSON.stringify(DEFAULT_LEADER_SCORES)) : JSON.parse(JSON.stringify(DEFAULT_STAFF_SCORES));
            setScores(def);
            setManagerScores(def);
        }
    },[formType,existingForm]);

    // Roles and Permissions
    const targetEmployeeId = existingForm?.employee_id || currentUser?.EmployeeID;
    const isOwner = currentUser?.EmployeeID === existingForm?.employee_id || !existingForm;
    const isSelfEditable = isOwner && (!existingForm || existingForm.status === 'draft' || existingForm.status === 'rejected');
    const isManagerEditable = isManager && !isOwner && existingForm?.status === 'submitted';
    const showManager = !!(existingForm && (existingForm.status === 'submitted' || existingForm.status === 'approved' || existingForm.status === 'rejected') && (isManager || isOwner));

    // Fetch employee tasks
    useEffect(() => {
        if (!targetEmployeeId) return;
        let isMounted = true;
        const fetchTasks = async () => {
            setLoadingTasks(true);
            try {
                const tasks = await TaskService.getTasksByEmployeeAndMonth(targetEmployeeId, month, year);
                if (isMounted) setEmployeeTasks(tasks);
            } catch (err) {
                console.error("Lỗi khi tải danh sách công việc:", err);
            } finally {
                if (isMounted) setLoadingTasks(false);
            }
        };
        fetchTasks();
        return () => { isMounted = false; };
    }, [targetEmployeeId, month, year]);

    const taskCompletionRate = useMemo(() => {
        if (!employeeTasks || employeeTasks.length === 0) return 0;
        const total = employeeTasks.reduce((sum, t) => sum + (t.progress || 0), 0);
        return Math.round(total / employeeTasks.length);
    }, [employeeTasks]);

    const taskRecommendation = useMemo(() => {
        const rate = taskCompletionRate;
        const count = employeeTasks?.length || 0;
        let lv = '2.5';
        let sc = 30;
        if (count > 0) {
            if (rate >= 90) { lv = '2.1'; sc = 55; }
            else if (rate >= 80) { lv = '2.2'; sc = 45; }
            else if (rate >= 70) { lv = '2.3'; sc = 40; }
            else if (rate >= 60) { lv = '2.4'; sc = 35; }
        }
        const found = COMPLETION_LEVELS.find(c => c.level === lv);
        return {
            level: lv,
            score: sc,
            rate,
            count,
            label: found?.label || 'Hoàn thành dưới 60%'
        };
    }, [taskCompletionRate, employeeTasks]);

    // Auto-apply recommendation for draft or new forms if not manually set yet
    useEffect(() => {
        if (isSelfEditable && !loadingTasks && taskRecommendation) {
            setScores(p => {
                if (!p.g2_2 || !p.g2_2.level) {
                    return {
                        ...p,
                        g2_2: {
                            level: taskRecommendation.level as any,
                            score: taskRecommendation.score
                        }
                    };
                }
                return p;
            });
        }
    }, [taskRecommendation, isSelfEditable, loadingTasks]);

    useEffect(() => {
        if (isManagerEditable && !loadingTasks && taskRecommendation) {
            setManagerScores(p => {
                if (!p.g2_2 || !p.g2_2.level) {
                    return {
                        ...p,
                        g2_2: {
                            level: taskRecommendation.level as any,
                            score: taskRecommendation.score
                        }
                    };
                }
                return p;
            });
        }
    }, [taskRecommendation, isManagerEditable, loadingTasks]);

    const total = calcTotal(scores);
    const managerTotal = calcTotal(managerScores);
    
    // Choose which total to use for classification display based on status
    const displayTotal = (existingForm?.status === 'approved' || isManagerEditable) ? managerTotal : total;
    const cls   = getClassification(displayTotal);
    const clsCfg = CLASSIFICATION_CONFIG[cls];
    const g2_1items = formType==='leader'?G2_1_LEADER_ITEMS:G2_1_STAFF_ITEMS;
    const g4items   = formType==='leader'?G4_LEADER_ITEMS:G4_STAFF_ITEMS;

    const setG1 = (k:string,v:number)=>setScores(p=>({...p,g1:{...p.g1,[k]:v}}));
    const setG2_1 = (k:string,v:number)=>setScores(p=>({...p,g2_1:{...p.g2_1,[k]:v}}));
    const setG2_2Level = (lv:string)=>{
        const found=COMPLETION_LEVELS.find(c=>c.level===lv);
        setScores(p=>({...p,g2_2:{level:found?.level??null,score:found?.score??0}}));
    };
    const setG3 = (k:string,v:boolean)=>setScores(p=>({...p,g3:{...p.g3,[k]:v}}));
    const setG4 = (k:string,v:boolean)=>setScores(p=>({...p,g4:{...p.g4,[k]:v}}));

    const setManagerG1 = (k:string,v:number)=>setManagerScores(p=>({...p,g1:{...p.g1,[k]:v}}));
    const setManagerG2_1 = (k:string,v:number)=>setManagerScores(p=>({...p,g2_1:{...p.g2_1,[k]:v}}));
    const setManagerG2_2Level = (lv:string)=>{
        const found=COMPLETION_LEVELS.find(c=>c.level===lv);
        setManagerScores(p=>({...p,g2_2:{level:found?.level??null,score:found?.score??0}}));
    };
    const setManagerG3 = (k:string,v:boolean)=>setManagerScores(p=>({...p,g3:{...p.g3,[k]:v}}));
    const setManagerG4 = (k:string,v:boolean)=>setManagerScores(p=>({...p,g4:{...p.g4,[k]:v}}));

    const persist = async (submit=false) => {
        if(!currentUser) return;
        setSaving(true); setError(null); setSuccess(null);
        const payload = {...scores,formType};

        let form = existingForm;
        if(!form){
            const ck = await EvaluationService.getByEmployeePeriod({employee_id:currentUser.EmployeeID,eval_month:month,eval_year:year});
            if(ck.data){ form=ck.data; }
            else {
                try {
                    const data = await createMutation.mutateAsync({
                        employee_id:currentUser.EmployeeID, employee_name:currentUser.FullName,
                        chuc_vu:chucVu||null, department_code:currentUser.Department,
                        department_name:currentUser.Department, eval_month:month, eval_year:year,
                        form_type:formType, self_scores:payload as EvalScores,
                    });
                    if(!data){setError('Lỗi tạo phiếu');setSaving(false);return;}
                    form = data;
                } catch (e: any) {
                    setError(e.message || 'Lỗi tạo phiếu');
                    setSaving(false);
                    return;
                }
            }
        } else {
            try {
                await updateSelfScoresMutation.mutateAsync({ id: form.id, scores: payload as EvalScores, chucVu: chucVu||null });
            } catch (e: any) {
                setError(e.message || 'Lỗi cập nhật phiếu');
                setSaving(false);
                return;
            }
        }
        
        if(submit && form){
            try {
                await submitMutation.mutateAsync(form.id);
                setSuccess('Đã nộp phiếu!');
                if(form) onSaved?.(form);
                setTimeout(()=>onClose?.(),1500);
            } catch (e: any) {
                setError(e.message || 'Lỗi nộp phiếu');
            }
        } else if (form) {
            setSuccess('Đã lưu nháp!');
            if(form) onSaved?.(form);
        }
        setSaving(false);
    };

    const handleApprove = async () => {
        if(!currentUser || !existingForm) return;
        setSaving(true); setError(null); setSuccess(null);
        try {
            await approveMutation.mutateAsync({
                id: existingForm.id,
                data: {
                    manager_scores: managerScores,
                    manager_notes: managerNotes,
                    manager_id: currentUser.EmployeeID,
                    manager_name: currentUser.FullName
                }
            });
            setSuccess('Đã phê duyệt phiếu!');
            if (existingForm) onSaved?.(existingForm);
            setTimeout(()=>onClose?.(),1500);
        } catch (e: any) {
            setError(e.message || 'Lỗi phê duyệt');
        } finally {
            setSaving(false);
        }
    };

    const handleReject = async () => {
        if(!currentUser || !existingForm) return;
        if(!managerNotes.trim()) {
            setError('Vui lòng nhập lý do từ chối (Nhận xét của quản lý)');
            setSaving(false);
            return;
        }
        setSaving(true); setError(null); setSuccess(null);
        try {
            await rejectMutation.mutateAsync({
                id: existingForm.id,
                data: {
                    manager_notes: managerNotes,
                    manager_id: currentUser.EmployeeID,
                    manager_name: currentUser.FullName
                }
            });
            setSuccess('Đã từ chối phiếu!');
            if (existingForm) onSaved?.(existingForm);
            setTimeout(()=>onClose?.(),1500);
        } catch (e: any) {
            setError(e.message || 'Lỗi từ chối');
        } finally {
            setSaving(false);
        }
    };

    return(
        <div className="flex flex-col h-full">
            {/* Header meta */}
            <div className="px-5 pt-4 pb-3 border-b border-border-subtle space-y-3">
                {!existingForm&&(
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Tháng</label>
                                <select value={month} onChange={e=>setMonth(+e.target.value)} className="w-full text-sm bg-bg-subtle border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400">
                                    {MONTHS_VI.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Năm</label>
                                <select value={year} onChange={e=>setYear(+e.target.value)} className="w-full text-sm bg-bg-subtle border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400">
                                    {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Loại phiếu</label>
                                <select value={formType} onChange={e=>setFormType(e.target.value as FormType)} className="w-full text-sm bg-bg-subtle border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400">
                                    <option value="staff">PL02 — Viên chức, người lao động</option>
                                    <option value="leader">PL01 — Cán bộ lãnh đạo, quản lý</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{formType==='leader'?'Chức vụ':'Vị trí việc làm'}</label>
                                <input value={chucVu} onChange={e=>setChucVu(e.target.value)} placeholder="Nhập chức vụ..." className="w-full text-sm bg-bg-subtle border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400"/>
                            </div>
                        </div>
                    </>
                )}

                {/* Score summary */}
                <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${clsCfg.border} ${clsCfg.bg} ${clsCfg.darkBg}`}>
                    <div className="text-center">
                        <div className={`text-2xl font-black ${clsCfg.color} ${clsCfg.darkColor}`}>{displayTotal.toFixed(0)}</div>
                        <div className="text-[9px] text-slate-400">/100</div>
                    </div>
                    <div>
                        <div className={`text-xs font-bold ${clsCfg.color} ${clsCfg.darkColor}`}>{cls}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                            Mục I: {calcG1(isManagerEditable ? managerScores : scores)} · 
                            Mục II: {calcG2_1(isManagerEditable ? managerScores : scores) + (isManagerEditable ? managerScores.g2_2.score : scores.g2_2.score)} · 
                            Thưởng: +{((isManagerEditable ? managerScores.g3.bonus1 : scores.g3.bonus1) ? 3 : 0) + ((isManagerEditable ? managerScores.g3.bonus2 : scores.g3.bonus2) ? 2 : 0)}
                        </div>
                    </div>
                    {existingForm&&<span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[existingForm.status].bg} ${STATUS_CONFIG[existingForm.status].color}`}>{STATUS_CONFIG[existingForm.status].label}</span>}
                </div>
            </div>

            {/* Scrollable criteria */}
            <div className="flex-1 overflow-y-auto px-4 py-3">

                {/* I — Ý thức kỷ luật */}
                <Section title="I. Ý thức tổ chức kỷ luật, phẩm chất đạo đức lối sống" maxScore={20} selfScore={calcG1(scores)} managerScore={calcG1(managerScores)} showManager={showManager}>
                    {G1_ITEMS.map(c=>(
                        <ScoreRow key={c.key} label={c.label} max={c.max} 
                            selfValue={(scores.g1 as unknown as Record<string,number>)[c.key]}
                            managerValue={(managerScores.g1 as unknown as Record<string,number>)[c.key]}
                            onSelfChange={v=>setG1(c.key,v)} 
                            onManagerChange={v=>setManagerG1(c.key,v)}
                            disabledSelf={!isSelfEditable}
                            disabledManager={!isManagerEditable}
                            showManager={showManager}
                        />
                    ))}
                </Section>

                {/* II.1 — Năng lực & kỹ năng */}
                <Section title="II.1 Năng lực và kỹ năng" maxScore={20} selfScore={calcG2_1(scores)} managerScore={calcG2_1(managerScores)} showManager={showManager}>
                    {g2_1items.map(c=>(
                        <ScoreRow key={c.key} code={c.code} label={c.label} max={c.max}
                            selfValue={(scores.g2_1 as unknown as Record<string,number>)[c.key]??0}
                            managerValue={(managerScores.g2_1 as unknown as Record<string,number>)[c.key]??0}
                            onSelfChange={v=>setG2_1(c.key,v)} 
                            onManagerChange={v=>setManagerG2_1(c.key,v)}
                            disabledSelf={!isSelfEditable}
                            disabledManager={!isManagerEditable}
                            showManager={showManager}
                        />
                    ))}
                </Section>

                {/* II.2 — Mức hoàn thành */}
                <Section title="II.2 Kết quả thực hiện nhiệm vụ" subtitle="(chọn 1 mức)" maxScore={55} selfScore={scores.g2_2.score} managerScore={managerScores.g2_2.score} defaultOpen={true} showManager={showManager}>
                    {/* Hộp khuyến nghị tự động */}
                    <div className="mb-4 p-3.5 rounded-xl border border-primary-100 bg-primary-50/40 dark:border-primary-900/30 dark:bg-primary-950/20 backdrop-blur-md flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center shrink-0">
                                <svg className="w-5.5 h-5.5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-txt-primary">Gợi ý từ kết quả công việc tháng</h4>
                                <p className="text-[11px] text-txt-muted mt-0.5">
                                    {taskRecommendation.count > 0 ? (
                                        <>Hoàn thành <b>{taskRecommendation.rate}%</b> từ {taskRecommendation.count} công việc. Đề xuất: <b className="text-primary-600 dark:text-primary-400">Mức {taskRecommendation.level} ({taskRecommendation.score} điểm)</b></>
                                    ) : (
                                        <>Không có công việc nào được giao trong tháng. Đề xuất tối thiểu: <b className="text-primary-600 dark:text-primary-400">Mức 2.5 ({taskRecommendation.score} điểm)</b></>
                                    )}
                                </p>
                            </div>
                        </div>
                        {((isSelfEditable && scores.g2_2.level !== taskRecommendation.level) || 
                          (isManagerEditable && managerScores.g2_2.level !== taskRecommendation.level)) && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (isSelfEditable) setG2_2Level(taskRecommendation.level);
                                    if (isManagerEditable) setManagerG2_2Level(taskRecommendation.level);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 active:scale-95 text-white text-[11px] font-bold shadow-sm shadow-primary-200 dark:shadow-none transition-all"
                            >
                                Áp dụng
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Self */}
                        <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Tự đánh giá</label>
                            {COMPLETION_LEVELS.map(lv=>(
                                <label key={`self_${lv.level}`} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${scores.g2_2.level===lv.level?'border-slate-400 bg-bg-muted':'border-border'} ${!isSelfEditable?'opacity-50 cursor-not-allowed':''}`}>
                                    <input type="radio" name="self_completion" value={lv.level??''} checked={scores.g2_2.level===lv.level} disabled={!isSelfEditable} onChange={()=>setG2_2Level(lv.level??'')} className="accent-slate-500"/>
                                    <span className="flex-1 text-xs text-txt-secondary">{lv.label}</span>
                                    <span className="text-xs font-black text-txt-muted">{lv.score} đ</span>
                                </label>
                            ))}
                        </div>
                        {/* Manager */}
                        {showManager && (
                            <div className="space-y-1.5 pt-1">
                                <label className="text-[10px] font-bold text-primary-500 uppercase block mb-2">Quản lý phê duyệt</label>
                                {COMPLETION_LEVELS.map(lv=>(
                                    <label key={`mgr_${lv.level}`} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${managerScores.g2_2.level===lv.level?'border-primary-400 bg-primary-50 dark:bg-primary-900/20':'border-border'} ${!isManagerEditable?'opacity-50 cursor-not-allowed':''}`}>
                                        <input type="radio" name="mgr_completion" value={lv.level??''} checked={managerScores.g2_2.level===lv.level} disabled={!isManagerEditable} onChange={()=>setManagerG2_2Level(lv.level??'')} className="accent-primary-500"/>
                                        <span className="flex-1 text-xs text-txt-secondary">{lv.label}</span>
                                        <span className="text-xs font-black text-primary-600 dark:text-primary-400">{lv.score} đ</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Danh sách công việc trong tháng */}
                    <div className="mt-4 pt-4 border-t border-border-subtle">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3">Danh sách công việc đã thực hiện trong tháng</label>
                        {loadingTasks ? (
                            <div className="text-xs text-slate-400 italic">Đang tải danh sách công việc...</div>
                        ) : employeeTasks.length === 0 ? (
                            <div className="text-xs text-slate-400 italic p-4 bg-bg-subtle rounded-lg border border-dashed border-border text-center">
                                Không có công việc nào được ghi nhận trong tháng {month}/{year}
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                {employeeTasks.map(t => (
                                    <div key={t.id} className="flex flex-col gap-1.5 p-3 rounded-lg border border-border bg-slate-50/50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-sm font-semibold text-txt-primary line-clamp-2 leading-snug flex-1">{t.title}</p>
                                            <span className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                t.status === 'done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                t.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                t.status === 'review' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' :
                                                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                                {t.status === 'done' ? 'Hoàn thành' : t.status === 'in_progress' ? 'Đang làm' : t.status === 'review' ? 'Chờ duyệt' : 'Cần làm'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                            {(t as any).projects?.project_name ? (
                                                <span className="truncate max-w-[200px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3 text-transparent" />
                                                    Dự án: {(t as any).projects.project_name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic">Việc nội bộ</span>
                                            )}
                                            {t.due_date && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Hạn: {new Date(t.due_date).toLocaleDateString('vi-VN')}</span>}
                                        </div>

                                        {/* Result note can be fetched from monthly_plan_items if needed, but for now we rely on task description or notes if available */}
                                        {(t as any).description && (
                                            <div className="mt-1 p-2 bg-bg-surface rounded border border-border-subtle text-xs text-txt-muted italic line-clamp-2">
                                                Ghi chú: {(t as any).description}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Section>

                {/* III — Điểm thưởng */}
                <Section title="III. Điểm thưởng" maxScore={5} selfScore={(scores.g3.bonus1?3:0)+(scores.g3.bonus2?2:0)} managerScore={(managerScores.g3.bonus1?3:0)+(managerScores.g3.bonus2?2:0)} defaultOpen={false} showManager={showManager}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Tự đánh giá</label>
                            {[{k:'bonus1',label:'Được Ban giám đốc tuyên dương',pts:3},{k:'bonus2',label:'Tham mưu đột phá; tham mưu ≥10 văn bản',pts:2}].map(b=>(
                                <label key={`self_${b.k}`} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${(scores.g3 as unknown as Record<string,boolean>)[b.k]?'border-slate-400 bg-bg-muted':'border-border'} ${!isSelfEditable?'opacity-50 cursor-not-allowed':''}`}>
                                    <input type="checkbox" checked={(scores.g3 as unknown as Record<string,boolean>)[b.k]} disabled={!isSelfEditable} onChange={e=>setG3(b.k,e.target.checked)} className="accent-slate-500"/>
                                    <span className="flex-1 text-xs text-txt-secondary">{b.label}</span>
                                    <span className="text-xs font-black text-slate-600">+{b.pts} đ</span>
                                </label>
                            ))}
                        </div>
                        {showManager && (
                            <div className="space-y-1.5 pt-1">
                                <label className="text-[10px] font-bold text-emerald-500 uppercase block mb-2">Quản lý phê duyệt</label>
                                {[{k:'bonus1',label:'Được Ban giám đốc tuyên dương',pts:3},{k:'bonus2',label:'Tham mưu đột phá; tham mưu ≥10 văn bản',pts:2}].map(b=>(
                                    <label key={`mgr_${b.k}`} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${(managerScores.g3 as unknown as Record<string,boolean>)[b.k]?'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20':'border-border'} ${!isManagerEditable?'opacity-50 cursor-not-allowed':''}`}>
                                        <input type="checkbox" checked={(managerScores.g3 as unknown as Record<string,boolean>)[b.k]} disabled={!isManagerEditable} onChange={e=>setManagerG3(b.k,e.target.checked)} className="accent-emerald-500"/>
                                        <span className="flex-1 text-xs text-txt-secondary">{b.label}</span>
                                        <span className="text-xs font-black text-emerald-600">+{b.pts} đ</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </Section>

                {/* IV — Điểm trừ */}
                <Section title="IV. Điểm trừ" subtitle="(tích nếu bị trừ)" maxScore={1} selfScore={0} managerScore={0} defaultOpen={false} showManager={showManager}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Tự đánh giá</label>
                            {g4items.map(d=>(
                                <label key={`self_${d.key}`} className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${(scores.g4 as unknown as Record<string,boolean>)[d.key]?'border-slate-400 bg-bg-muted':'border-border'} ${!isSelfEditable?'opacity-50 cursor-not-allowed':''}`}>
                                    <input type="checkbox" checked={(scores.g4 as unknown as Record<string,boolean>)[d.key]} disabled={!isSelfEditable} onChange={e=>setG4(d.key,e.target.checked)} className="accent-slate-500 mt-0.5"/>
                                    <span className="flex-1 text-xs text-txt-secondary leading-snug">{d.label}</span>
                                    <span className="text-xs font-black text-slate-600 shrink-0">-{d.points} đ</span>
                                </label>
                            ))}
                        </div>
                        {showManager && (
                            <div className="space-y-1.5 pt-1">
                                <label className="text-[10px] font-bold text-red-500 uppercase block mb-2">Quản lý phê duyệt</label>
                                {g4items.map(d=>(
                                    <label key={`mgr_${d.key}`} className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${(managerScores.g4 as unknown as Record<string,boolean>)[d.key]?'border-red-400 bg-red-50 dark:bg-red-900/20':'border-border'} ${!isManagerEditable?'opacity-50 cursor-not-allowed':''}`}>
                                        <input type="checkbox" checked={(managerScores.g4 as unknown as Record<string,boolean>)[d.key]} disabled={!isManagerEditable} onChange={e=>setManagerG4(d.key,e.target.checked)} className="accent-red-500 mt-0.5"/>
                                        <span className="flex-1 text-xs text-txt-secondary leading-snug">{d.label}</span>
                                        <span className="text-xs font-black text-red-600 shrink-0">-{d.points} đ</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </Section>

                {/* Ghi chú */}
                <div className="bg-bg-surface rounded-xl border border-border p-4 mb-3">
                    <label className="text-xs font-bold text-txt-muted uppercase mb-2 block">Nhận xét cá nhân</label>
                    <textarea rows={3} value={notes} disabled={!isSelfEditable} onChange={e=>setNotes(e.target.value)}
                        placeholder="Kết quả công việc nổi bật, khó khăn trong tháng..."
                        className="w-full text-sm text-txt-secondary bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50"/>
                </div>

                {/* Manager Notes */}
                {(isManagerEditable || (showManager && existingForm?.manager_notes)) && (
                    <div className="bg-bg-surface rounded-xl border border-primary-200 dark:border-primary-800 p-4 mb-3">
                        <label className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase mb-2 block">Nhận xét của Quản lý / Lãnh đạo</label>
                        <textarea rows={3} value={managerNotes} disabled={!isManagerEditable} onChange={e=>setManagerNotes(e.target.value)}
                            placeholder={isManagerEditable ? "Đánh giá, nhận xét dành cho nhân sự này (Bắt buộc nếu Từ chối)..." : ""}
                            className="w-full text-sm text-txt-secondary bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-700 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50"/>
                    </div>
                )}

                {/* Rejection note */}
                {existingForm?.status==='rejected'&&existingForm.manager_notes&&(
                    <div className="flex gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-3">
                        <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5"/>
                        <div>
                            <p className="text-[10px] font-bold text-red-700 mb-1">Lý do từ chối — {existingForm.manager_name}:</p>
                            <p className="text-xs text-red-600">{existingForm.manager_notes}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border-subtle space-y-2">
                {error&&<div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-xs text-red-600"><AlertTriangle size={12}/>{error}</div>}
                {success&&<div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700"><CheckCircle2 size={12}/>{success}</div>}
                {isSelfEditable ? (
                    <div className="flex gap-2">
                        <button onClick={()=>persist(false)} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-txt-secondary bg-bg-muted hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50">
                            <Save size={14}/>{saving?'Đang lưu...':'Lưu nháp'}
                        </button>
                        <button onClick={()=>persist(true)} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-primary-500/20">
                            <Send size={14}/>{saving?'Đang nộp...':'Nộp phiếu'}
                        </button>
                    </div>
                ) : isManagerEditable ? (
                    <div className="flex gap-2">
                        <button onClick={handleReject} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-red-500/20">
                            <XCircle size={14}/>{saving?'Đang xử lý...':'Từ chối'}
                        </button>
                        <button onClick={handleApprove} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 size={14}/>{saving?'Đang xử lý...':'Phê duyệt'}
                        </button>
                    </div>
                ) : (
                    <p className="text-center text-xs text-slate-400 py-2">
                        {existingForm?.status==='submitted'&&'⏳ Đang chờ trưởng phòng phê duyệt'}
                        {existingForm?.status==='approved'&&'✅ Phiếu đã được phê duyệt'}
                    </p>
                )}
                <p className="text-center text-[10px] text-slate-300 dark:text-slate-600">PL{formType==='leader'?'01':'02'} · Quy chế QCDGXL-2026 · Tổng tối đa 100 điểm</p>
            </div>
        </div>
    );
};

export default EvaluationSlidePanel;
