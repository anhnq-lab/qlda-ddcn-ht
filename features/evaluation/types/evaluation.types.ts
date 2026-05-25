// ─── Form types ───────────────────────────────────────────────
export type FormType = 'leader' | 'staff';
export type EvaluationStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type CompletionLevel = '2.1'|'2.2'|'2.3'|'2.4'|'2.5'|null;

// Group I — Ý thức kỷ luật (max 20, same for both)
export interface G1 { s1:number; s2:number; s3:number; s4:number; }

// Group II.1 — Năng lực & kỹ năng
export interface G2_1_Leader { s1:number;s2:number;s3:number;s4:number;s5:number;s6:number;s7:number;s8:number;s9:number; }
export interface G2_1_Staff  { s1:number;s2:number;s3:number;s4:number;s5:number;s6:number;s7:number;s8:number;s9:number;s10:number; }

// Group II.2 — Mức hoàn thành (max 55)
export interface G2_2 { level: CompletionLevel; score: number; }

// Group III — Điểm thưởng (max 5)
export interface G3 { bonus1:boolean; bonus2:boolean; }

// Group IV — Điểm trừ (leader: 6 mục, staff: 5 mục)
export interface G4_Leader { d1:boolean;d2:boolean;d3:boolean;d4:boolean;d5:boolean;d6:boolean; }
export interface G4_Staff  { d1:boolean;d2:boolean;d3:boolean;d4:boolean;d5:boolean; }

export interface EvalScores<T extends FormType = FormType> {
    formType: T;
    g1: G1;
    g2_1: T extends 'leader' ? G2_1_Leader : G2_1_Staff;
    g2_2: G2_2;
    g3: G3;
    g4: T extends 'leader' ? G4_Leader : G4_Staff;
}

// ─── Defaults ─────────────────────────────────────────────────
export const DEFAULT_LEADER_SCORES: EvalScores<'leader'> = {
    formType: 'leader',
    g1:   { s1:0, s2:0, s3:0, s4:0 },
    g2_1: { s1:0, s2:0, s3:0, s4:0, s5:0, s6:0, s7:0, s8:0, s9:0 },
    g2_2: { level:null, score:0 },
    g3:   { bonus1:false, bonus2:false },
    g4:   { d1:false, d2:false, d3:false, d4:false, d5:false, d6:false },
};

export const DEFAULT_STAFF_SCORES: EvalScores<'staff'> = {
    formType: 'staff',
    g1:   { s1:0, s2:0, s3:0, s4:0 },
    g2_1: { s1:0, s2:0, s3:0, s4:0, s5:0, s6:0, s7:0, s8:0, s9:0, s10:0 },
    g2_2: { level:null, score:0 },
    g3:   { bonus1:false, bonus2:false },
    g4:   { d1:false, d2:false, d3:false, d4:false, d5:false },
};

// ─── Score calc ───────────────────────────────────────────────
export function calcG1(s: EvalScores): number {
    return s.g1.s1+s.g1.s2+s.g1.s3+s.g1.s4;
}
export function calcG2_1(s: EvalScores): number {
    return Object.values(s.g2_1).reduce((a:number,b) => a+(b as number),0);
}
export function calcBonus(s: EvalScores): number {
    return (s.g3.bonus1?3:0)+(s.g3.bonus2?2:0);
}
export function calcDeduction(s: EvalScores): number {
    return Object.values(s.g4).reduce((a:number,b) => {
        if(typeof b==='boolean') return b?a+(s.formType==='leader'?2:3):a; // rough
        return a;
    },0);
}
export function calcTotal(s: EvalScores): number {
    let ded = 0;
    if(s.formType==='leader'){
        const g = s.g4 as G4_Leader;
        ded=(g.d1?2:0)+(g.d2?3:0)+(g.d3?3:0)+(g.d4?5:0)+(g.d5?2:0)+(g.d6?3:0);
    } else {
        const g = s.g4 as G4_Staff;
        ded=(g.d1?3:0)+(g.d2?5:0)+(g.d3?5:0)+(g.d4?10:0)+(g.d5?5:0);
    }
    return Math.max(0, calcG1(s)+calcG2_1(s)+s.g2_2.score+calcBonus(s)-ded);
}

// ─── DB form type ─────────────────────────────────────────────
export interface EvaluationForm {
    id: string;
    form_type: FormType;
    employee_id: string;
    employee_name: string;
    chuc_vu: string|null;
    department_code: string;
    department_name: string;
    eval_month: number;
    eval_year: number;
    self_scores:    EvalScores|null;
    manager_scores: EvalScores|null;
    self_notes: string|null;
    manager_notes: string|null;
    manager_id: string|null;
    manager_name: string|null;
    reviewed_at: string|null;
    self_submitted_at: string|null;
    status: EvaluationStatus;
    created_at: string;
    updated_at: string;
    // legacy flat cols
    self_score_1:number; self_score_2:number; self_score_3:number;
    self_score_4:number; self_score_5:number; self_score_6:number; self_score_7:number;
    manager_score_1:number|null; manager_score_2:number|null; manager_score_3:number|null;
    manager_score_4:number|null; manager_score_5:number|null; manager_score_6:number|null;
    manager_score_7:number|null;
}

// ─── Helpers ──────────────────────────────────────────────────
export function getFormTotal(form: EvaluationForm, who: 'self'|'manager'='self'): number {
    const s = who==='self' ? form.self_scores : form.manager_scores;
    if(s && Object.keys(s).length>0) return calcTotal(s);
    if(who==='self')
        return [form.self_score_1,form.self_score_2,form.self_score_3,
                form.self_score_4,form.self_score_5,form.self_score_6,form.self_score_7]
            .reduce((a,b)=>a+(b??0),0);
    return form.manager_score_1!==null
        ? [form.manager_score_1,form.manager_score_2,form.manager_score_3,
           form.manager_score_4,form.manager_score_5,form.manager_score_6,form.manager_score_7]
            .reduce((a: number, b)=>a+(b??0), 0)
        : -1;
}

export function getClassification(total:number) {
    if(total>=91) return 'Hoàn thành xuất sắc (A1)';
    if(total>=71) return 'Hoàn thành tốt (A)';
    if(total>=50) return 'Hoàn thành (B)';
    return 'Không hoàn thành (C)';
}

export const COMPLETION_LEVELS = [
    {level:'2.1' as CompletionLevel, label:'Hoàn thành từ 90%–100%', score:55},
    {level:'2.2' as CompletionLevel, label:'Hoàn thành từ 80%–dưới 90%', score:45},
    {level:'2.3' as CompletionLevel, label:'Hoàn thành từ 70%–dưới 80%', score:40},
    {level:'2.4' as CompletionLevel, label:'Hoàn thành từ 60%–dưới 70%', score:35},
    {level:'2.5' as CompletionLevel, label:'Hoàn thành dưới 60%', score:30},
];

export const MONTHS_VI = [
    'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
    'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12',
];

export const STATUS_CONFIG: Record<EvaluationStatus,{label:string;color:string;bg:string;darkBg:string;darkColor:string}> = {
    draft:     {label:'Nháp',       color:'text-slate-600', bg:'bg-slate-100',  darkBg:'dark:bg-slate-800',      darkColor:'dark:text-slate-300'},
    submitted: {label:'Chờ duyệt', color:'text-warning-700', bg:'bg-warning-50',   darkBg:'dark:bg-warning-900/30',   darkColor:'dark:text-warning-300'},
    approved:  {label:'Đã duyệt',  color:'text-emerald-700',bg:'bg-emerald-50',darkBg:'dark:bg-emerald-900/30', darkColor:'dark:text-emerald-300'},
    rejected:  {label:'Từ chối',   color:'text-red-700',   bg:'bg-red-50',     darkBg:'dark:bg-red-900/30',     darkColor:'dark:text-red-300'},
};

// ─── Criteria definitions ─────────────────────────────────────
export const G1_ITEMS = [
    {key:'s1', label:'Ý thức tổ chức kỷ luật; phẩm chất đạo đức, lối sống, tác phong', max:6},
    {key:'s2', label:'Đoàn kết, thực hiện nguyên tắc tập trung dân chủ', max:5},
    {key:'s3', label:'Thực hiện nghiêm quy tắc ứng xử trong cơ quan', max:3},
    {key:'s4', label:'Văn hóa công sở, đạo đức công vụ', max:6},
];

export const G2_1_LEADER_ITEMS = [
    {key:'s1',code:'1.1',label:'Chủ động nghiên cứu, cập nhật kiến thức pháp luật; tham mưu văn bản chỉ đạo điều hành',max:3},
    {key:'s2',code:'1.2',label:'Tham gia xây dựng kế hoạch công tác cơ quan, phòng và kế hoạch cá nhân',max:3},
    {key:'s3',code:'1.3',label:'Tham mưu tổ chức, chủ trì hội nghị, hội thảo chất lượng, hiệu quả',max:2},
    {key:'s4',code:'1.4',label:'Chỉ đạo, điều hành nhiệm vụ kịp thời, đúng quy trình',max:2},
    {key:'s5',code:'1.5',label:'Triển khai, phân công và điều phối công việc cho cấp dưới',max:2},
    {key:'s6',code:'1.6',label:'Bao quát, theo dõi, kiểm tra, đôn đốc nhiệm vụ',max:2},
    {key:'s7',code:'1.7',label:'Tập hợp cán bộ, phối hợp tạo quan hệ tốt',max:2},
    {key:'s8',code:'1.8',label:'Tiết kiệm thời gian, vật tư, tài sản cơ quan',max:2},
    {key:'s9',code:'1.9',label:'Văn bản đúng thể thức, quy trình, không sai sót, đúng tiến độ',max:2},
];

export const G2_1_STAFF_ITEMS = [
    {key:'s1',code:'1.1',label:'Chủ động nghiên cứu kiến thức pháp luật, chuyên môn để tham mưu hiệu quả',max:2},
    {key:'s2',code:'1.2',label:'Xây dựng kế hoạch công tác cá nhân cụ thể nội dung, tiến độ',max:2},
    {key:'s3',code:'1.3',label:'Tham mưu chuẩn bị nội dung, tài liệu phục vụ cuộc họp, hội nghị',max:2},
    {key:'s4',code:'1.4',label:'Triển khai, hướng dẫn, đôn đốc thực hiện nhiệm vụ thuộc lĩnh vực phụ trách',max:2},
    {key:'s5',code:'1.5',label:'Báo cáo kịp thời với lãnh đạo; chủ động tham mưu phương án xử lý',max:2},
    {key:'s6',code:'1.6',label:'Thiết lập, lưu trữ, quản lý hồ sơ công việc đúng nguyên tắc',max:2},
    {key:'s7',code:'1.7',label:'Chủ động giải quyết và phối hợp tốt với các cá nhân, đơn vị liên quan',max:2},
    {key:'s8',code:'1.8',label:'Thành thạo CNTT, tiết kiệm thời gian, vật tư, tài sản cơ quan',max:2},
    {key:'s9',code:'1.9',label:'Văn bản tham mưu đúng thể thức, quy trình, không sai sót, đúng tiến độ',max:2},
    {key:'s10',code:'1.10',label:'Thực hiện tốt các nhiệm vụ khác do lãnh đạo phòng giao',max:2},
];

export const G4_LEADER_ITEMS = [
    {key:'d1',label:'Phòng có người bị GĐ phê bình; nộp BC chậm; vi phạm kỷ luật, kỷ cương',points:2},
    {key:'d2',label:'Phòng có người sai sót chuyên môn; xử lý hồ sơ chậm; gây phiền hà cho DN',points:3},
    {key:'d3',label:'Phòng có người vi phạm TTATGT bị lập biên bản gửi cơ quan',points:3},
    {key:'d4',label:'Phòng có người bỏ việc đi ra ngoài giờ bị phản ánh trên i.HaTinh',points:5},
    {key:'d5',label:'Phối hợp giữa các phòng chưa đạt yêu cầu; góp ý trên HSCV chậm',points:2},
    {key:'d6',label:'Các phòng bị GĐ phê bình; nộp BC chậm; có thành viên vi phạm',points:3},
];

export const G4_STAFF_ITEMS = [
    {key:'d1',label:'Bị GĐ phê bình; nộp BC chậm; vi phạm kỷ luật, kỷ cương; phối hợp không tốt; xử lý HSCV chậm',points:3},
    {key:'d2',label:'Sai sót chuyên môn; xử lý hồ sơ chậm; không hướng dẫn đủ thủ tục; gây phiền hà',points:5},
    {key:'d3',label:'Vi phạm trật tự an toàn giao thông bị lập biên bản gửi cơ quan',points:5},
    {key:'d4',label:'Bỏ việc đi ra ngoài giờ hành chính bị phản ánh trên i.HaTinh',points:10},
    {key:'d5',label:'Vi phạm khác (xử lý theo kết luận Ban QLDA)',points:5},
];

// Legacy aliases for backward compat
export const EVALUATION_CRITERIA = G1_ITEMS;
export type EvaluationClassification = ReturnType<typeof getClassification>;
export const CLASSIFICATION_CONFIG = {
    'Hoàn thành xuất sắc (A1)': {color:'text-violet-700',bg:'bg-violet-50',darkBg:'dark:bg-violet-900/30',darkColor:'dark:text-violet-300',border:'border-violet-200 dark:border-violet-700'},
    'Hoàn thành tốt (A)':       {color:'text-emerald-700',bg:'bg-emerald-50',darkBg:'dark:bg-emerald-900/30',darkColor:'dark:text-emerald-300',border:'border-emerald-200 dark:border-emerald-700'},
    'Hoàn thành (B)':           {color:'text-blue-700',bg:'bg-blue-50',darkBg:'dark:bg-blue-900/30',darkColor:'dark:text-blue-300',border:'border-blue-200 dark:border-blue-700'},
    'Không hoàn thành (C)':     {color:'text-red-700',bg:'bg-red-50',darkBg:'dark:bg-red-900/30',darkColor:'dark:text-red-300',border:'border-red-200 dark:border-red-700'},
};
export function calcSelfTotal(f: EvaluationForm) { return getFormTotal(f,'self'); }
export function calcManagerTotal(f: EvaluationForm) { const t=getFormTotal(f,'manager'); return t===-1?0:t; }

// ─── Year-end Disbursement Performance Types ───────────────────
export interface EmployeeDisbursementPerformance {
    employee_id: string;
    full_name: string;
    department: string;
    position: string;
    role: string;
    total_projects: number;
    total_planned: number;
    total_planned_adjusted: number;
    total_disbursed: number;
    raw_disbursement_rate: number;
    adjusted_disbursement_rate: number;
}

export interface ProjectDisbursementDetail {
    proj_id: string;
    proj_name: string;
    planned_amount: number;
    planned_amount_adjusted: number;
    actual_disbursed: number;
    raw_rate: number;
    adjusted_rate: number;
    cleared_area: number;
    total_area: number;
    member_role: string;
}

