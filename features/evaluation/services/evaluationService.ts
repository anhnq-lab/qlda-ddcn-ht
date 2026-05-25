import { supabase } from '../../../lib/supabase';
import type { EvaluationForm, EvalScores, EvaluationStatus, FormType, EmployeeDisbursementPerformance, ProjectDisbursementDetail } from '../types/evaluation.types';
import { DEFAULT_STAFF_SCORES, DEFAULT_LEADER_SCORES } from '../types/evaluation.types';

// evaluation_forms chưa có trong generated Supabase types — dùng cast any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

type CreatePayload = {
    employee_id: string;
    employee_name: string;
    chuc_vu?: string | null;
    department_code: string;
    department_name: string;
    eval_month: number;
    eval_year: number;
    form_type?: FormType;
    self_scores?: EvalScores;
};

export const EvaluationService = {

    async list(params: {
        eval_year?: number;
        eval_month?: number;
        department_code?: string;
        employee_id?: string;
        status?: EvaluationStatus;
    }): Promise<{ data: EvaluationForm[]; error: string | null }> {
        let query = sb
            .from('evaluation_forms')
            .select('*')
            .order('eval_year', { ascending: false })
            .order('eval_month', { ascending: false })
            .order('employee_name', { ascending: true });

        if (params.eval_year) query = query.eq('eval_year', params.eval_year);
        if (params.eval_month) query = query.eq('eval_month', params.eval_month);
        if (params.department_code) query = query.eq('department_code', params.department_code);
        if (params.employee_id) query = query.eq('employee_id', params.employee_id);
        if (params.status) query = query.eq('status', params.status);

        const { data, error } = await query;
        if (error) return { data: [], error: error.message };
        return { data: (data ?? []) as EvaluationForm[], error: null };
    },

    async getById(id: string): Promise<{ data: EvaluationForm | null; error: string | null }> {
        const { data, error } = await sb
            .from('evaluation_forms')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return { data: null, error: error.message };
        return { data: data as EvaluationForm, error: null };
    },

    async getByEmployeePeriod(params: {
        employee_id: string;
        eval_month: number;
        eval_year: number;
    }): Promise<{ data: EvaluationForm | null; error: string | null }> {
        const { data, error } = await sb
            .from('evaluation_forms')
            .select('*')
            .eq('employee_id', params.employee_id)
            .eq('eval_month', params.eval_month)
            .eq('eval_year', params.eval_year)
            .maybeSingle();
        if (error) return { data: null, error: error.message };
        return { data: data as EvaluationForm | null, error: null };
    },

    async create(payload: CreatePayload): Promise<{ data: EvaluationForm | null; error: string | null }> {
        const formType = payload.form_type ?? 'staff';
        const scores = payload.self_scores ?? (formType === 'leader' ? DEFAULT_LEADER_SCORES : DEFAULT_STAFF_SCORES);
        const { data, error } = await sb
            .from('evaluation_forms')
            .insert({
                employee_id: payload.employee_id,
                employee_name: payload.employee_name,
                chuc_vu: payload.chuc_vu ?? null,
                department_code: payload.department_code,
                department_name: payload.department_name,
                eval_month: payload.eval_month,
                eval_year: payload.eval_year,
                form_type: formType,
                status: 'draft',
                self_scores: scores,
                // Legacy flat columns — set to 0 for backward compat
                self_score_1: 0, self_score_2: 0, self_score_3: 0,
                self_score_4: 0, self_score_5: 0, self_score_6: 0, self_score_7: 0,
            })
            .select()
            .single();
        if (error) return { data: null, error: error.message };
        return { data: data as EvaluationForm, error: null };
    },

    async updateSelfScores(id: string, scores: EvalScores, chucVu?: string | null): Promise<{ error: string | null }> {
        const update: Record<string, unknown> = {
            self_scores: scores,
            status: 'draft',
        };
        if (chucVu !== undefined) update.chuc_vu = chucVu;

        const { error } = await sb
            .from('evaluation_forms')
            .update(update)
            .eq('id', id);
        return { error: error?.message ?? null };
    },

    async submit(id: string): Promise<{ error: string | null }> {
        const { error } = await sb
            .from('evaluation_forms')
            .update({ status: 'submitted', self_submitted_at: new Date().toISOString() })
            .eq('id', id)
            .in('status', ['draft', 'rejected']);
        return { error: error?.message ?? null };
    },

    async approve(id: string, data: {
        manager_scores: EvalScores;
        manager_notes?: string | null;
        manager_id: string;
        manager_name: string;
    }): Promise<{ error: string | null }> {
        const { error } = await sb
            .from('evaluation_forms')
            .update({
                manager_scores: data.manager_scores,
                manager_notes: data.manager_notes ?? null,
                manager_id: data.manager_id,
                manager_name: data.manager_name,
                status: 'approved',
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('status', 'submitted');
        return { error: error?.message ?? null };
    },

    async reject(id: string, data: {
        manager_notes: string;
        manager_id: string;
        manager_name: string;
    }): Promise<{ error: string | null }> {
        const { error } = await sb
            .from('evaluation_forms')
            .update({
                manager_notes: data.manager_notes,
                manager_id: data.manager_id,
                manager_name: data.manager_name,
                status: 'rejected',
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('status', 'submitted');
        return { error: error?.message ?? null };
    },

    async getAllEmployeesDisbursementPerformance(year: number): Promise<{ data: EmployeeDisbursementPerformance[]; error: string | null }> {
        const { data, error } = await sb
            .rpc('get_all_employees_disbursement_adjusted', {
                p_year: year
            });
        if (error) return { data: [], error: error.message };
        return { data: (data ?? []) as EmployeeDisbursementPerformance[], error: null };
    },

    async getEmployeeProjectsDisbursementDetail(employeeId: string, year: number, isManager: boolean): Promise<{ data: ProjectDisbursementDetail[]; error: string | null }> {
        const { data, error } = await sb
            .rpc('get_employee_projects_disbursement_detail', {
                p_employee_id: employeeId,
                p_year: year,
                p_is_manager: isManager
            });
        if (error) return { data: [], error: error.message };
        return { data: (data ?? []) as ProjectDisbursementDetail[], error: null };
    },
};
