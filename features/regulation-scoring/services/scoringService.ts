import { supabase } from '../../../lib/supabase';
import { DepartmentCode } from '../../../types/plan.types';

export interface DepartmentMonthlyScore {
  id?: string;
  department_code: DepartmentCode;
  eval_month: number;
  eval_year: number;
  a1_total_tasks: number;
  a1_done_tasks: number;
  a1_completion_rate: number;
  a1_score: number;
  a2_score: number;
  a2_notes?: string;
  a3_on_time_done: number;
  a3_total_done: number;
  a3_on_time_rate: number;
  a3_score: number;
  b1_disbursement_rate: number;
  b1_score: number;
  b2_target_rate: number;
  b2_score: number;
  c1_score: number;
  c1_notes?: string;
  c2_score: number;
  c2_notes?: string;
  is_disbursement_dept: boolean;
  group_a_total: number;
  group_b_total: number;
  group_c_total: number;
  total_score: number;
  classification: 'xuat_sac' | 'tot' | 'hoan_thanh' | 'khong_hoan_thanh';
  status: 'draft' | 'calculated' | 'reviewed' | 'approved';
  calculated_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approved_by?: string;
  approved_at?: string;
}

export interface IndividualMonthlyScore {
  id?: string;
  employee_id: string;
  employee_name?: string;
  department_code: DepartmentCode;
  eval_month: number;
  eval_year: number;
  a1_total_tasks: number;
  a1_done_tasks: number;
  a1_completion_rate: number;
  a1_score: number;
  a2_score: number;
  a2_notes?: string;
  a3_on_time_done: number;
  a3_total_done: number;
  a3_on_time_rate: number;
  a3_score: number;
  has_projects: boolean;
  b1_weighted_rate: number;
  b1_score: number;
  b2_score: number;
  b2_notes?: string;
  c1_score: number;
  c1_notes?: string;
  c2_score: number;
  c2_notes?: string;
  c3_score: number;
  c3_notes?: string;
  is_disbursement_staff: boolean;
  group_a_total: number;
  group_b_total: number;
  group_c_total: number;
  total_score: number;
  classification: 'xuat_sac' | 'tot' | 'hoan_thanh' | 'khong_hoan_thanh';
  status: 'draft' | 'calculated' | 'reviewed' | 'approved';
  scored_by?: string;
  scored_at?: string;
  approved_by?: string;
  approved_at?: string;
}

export const RegulationScoringService = {
  // 1. Calculate A-scores (completion & timeliness) from tasks using RPC
  async calculateAScores(entityType: 'department' | 'individual', entityId: string, month: number, year: number) {
    const { data, error } = await (supabase as any).rpc('calc_regulation_a_scores', {
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_month: month,
      p_year: year
    });
    if (error) throw error;
    return data; // returns total_tasks, done_tasks, completion_rate, a1_score, on_time_done, on_time_rate, a3_score
  },

  // 2. Fetch Department scores
  async getDeptScores(month: number, year: number): Promise<DepartmentMonthlyScore[]> {
    const { data, error } = await (supabase as any)
      .from('department_monthly_scores')
      .select('*')
      .eq('eval_month', month)
      .eq('eval_year', year);
    if (error) throw error;
    return data || [];
  },

  // 3. Upsert Department scores
  async upsertDeptScore(score: Partial<DepartmentMonthlyScore>): Promise<DepartmentMonthlyScore> {
    const { data, error } = await (supabase as any)
      .from('department_monthly_scores')
      .upsert(score, { onConflict: 'department_code,eval_month,eval_year' })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  // 4. Fetch Individual scores
  async getIndivScores(deptCode: string, month: number, year: number): Promise<IndividualMonthlyScore[]> {
    const { data, error } = await (supabase as any)
      .from('individual_monthly_scores')
      .select('*, employee:employees(full_name)')
      .eq('department_code', deptCode)
      .eq('eval_month', month)
      .eq('eval_year', year);
    if (error) throw error;
    
    return (data || []).map((d: any) => ({
      ...d,
      employee_name: d.employee?.full_name || d.employee_id
    }));
  },

  // 5. Upsert Individual scores
  async upsertIndivScore(score: Partial<IndividualMonthlyScore>): Promise<IndividualMonthlyScore> {
    const { data, error } = await (supabase as any)
      .from('individual_monthly_scores')
      .upsert(score, { onConflict: 'employee_id,eval_month,eval_year' })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  // 6. Get Annual Average for an entity
  async getAnnualAverage(entityType: 'department' | 'individual', entityId: string, year: number) {
    const table = entityType === 'department' ? 'department_monthly_scores' : 'individual_monthly_scores';
    const idField = entityType === 'department' ? 'department_code' : 'employee_id';
    
    const { data, error } = await (supabase as any)
      .from(table)
      .select('eval_month, total_score, classification')
      .eq(idField, entityId)
      .eq('eval_year', year);
    if (error) throw error;
    
    const total = (data || []).reduce((sum: number, item: any) => sum + Number(item.total_score), 0);
    const count = (data || []).length;
    
    return {
      scores: data || [],
      average: count > 0 ? Number((total / count).toFixed(2)) : 0,
      count
    };
  },

  // 7. Get or Create Annual Evaluation record
  async getAnnualEvaluation(entityType: 'department' | 'individual', entityId: string, year: number): Promise<AnnualEvaluation | null> {
    const { data, error } = await (supabase as any)
      .from('annual_evaluations')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('eval_year', year)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  },

  // 8. Upsert Annual Evaluation record
  async upsertAnnualEvaluation(annualEval: Partial<AnnualEvaluation>): Promise<AnnualEvaluation> {
    const { data, error } = await (supabase as any)
      .from('annual_evaluations')
      .upsert(annualEval, { onConflict: 'entity_type,entity_id,eval_year' })
      .select('*')
      .single();
      
    if (error) throw error;
    return data;
  },

  // 9. Fetch all individual evaluations for a department
  async getAnnualEvaluationsByDept(deptCode: string, year: number): Promise<AnnualEvaluation[]> {
    const { data: employees, error: empErr } = await (supabase as any)
      .from('employees')
      .select('employee_id')
      .eq('department', deptCode)
      .eq('status', 1);

    if (empErr) throw empErr;
    if (!employees || employees.length === 0) return [];

    const empIds = employees.map((e: any) => e.employee_id);

    const { data, error } = await (supabase as any)
      .from('annual_evaluations')
      .select('*')
      .eq('entity_type', 'individual')
      .in('entity_id', empIds)
      .eq('eval_year', year);

    if (error) throw error;
    return data || [];
  }
};

export interface AnnualEvaluation {
  id?: string;
  entity_type: 'department' | 'individual';
  entity_id: string;
  eval_year: number;
  monthly_scores?: any;
  monthly_avg?: number;
  quarterly_scores?: any;
  annual_b_score?: number;
  annual_c_score?: number;
  final_score?: number;
  classification?: 'xuat_sac' | 'tot' | 'hoan_thanh' | 'khong_hoan_thanh';
  classification_conditions?: any;
  current_step: 'self_eval' | 'dept_meeting' | 'head_proposal' | 'leadership_final';
  self_eval_data?: any;
  dept_meeting_date?: string | null;
  dept_meeting_notes?: string | null;
  head_proposed_class?: 'xuat_sac' | 'tot' | 'hoan_thanh' | 'khong_hoan_thanh' | null;
  head_proposal_notes?: string | null;
  leadership_final_class?: 'xuat_sac' | 'tot' | 'hoan_thanh' | 'khong_hoan_thanh' | null;
  leadership_notes?: string | null;
  published?: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

