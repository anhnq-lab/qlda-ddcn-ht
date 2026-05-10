// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase } from '../../../lib/supabase';
import type { EvaluationForm, EvaluationStatus } from '../types/evaluation.types';

// evaluation_forms chưa có trong generated Supabase types
// Dùng type-cast qua `any` — sẽ update sau khi chạy generate types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

type ScoreFields = {
    self_score_1?: number; self_score_2?: number; self_score_3?: number;
    self_score_4?: number; self_score_5?: number; self_score_6?: number;
    self_score_7?: number; self_notes?: string | null;
    manager_score_1?: number | null; manager_score_2?: number | null;
    manager_score_3?: number | null; manager_score_4?: number | null;
    manager_score_5?: number | null; manager_score_6?: number | null;
    manager_score_7?: number | null; manager_notes?: string | null;
    manager_id?: string | null; manager_name?: string | null;
    reviewed_at?: string | null; self_submitted_at?: string | null;
    status?: EvaluationStatus;
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

    async create(payload: {
        employee_id: string;
        employee_name: string;
        department_code: string;
        department_name: string;
        eval_month: number;
        eval_year: number;
    } & Partial<ScoreFields>): Promise<{ data: EvaluationForm | null; error: string | null }> {
        const { data, error } = await sb
            .from('evaluation_forms')
            .insert({
                employee_id: payload.employee_id,
                employee_name: payload.employee_name,
                department_code: payload.department_code,
                department_name: payload.department_name,
                eval_month: payload.eval_month,
                eval_year: payload.eval_year,
                status: 'draft',
                self_score_1: payload.self_score_1 ?? 0,
                self_score_2: payload.self_score_2 ?? 0,
                self_score_3: payload.self_score_3 ?? 0,
                self_score_4: payload.self_score_4 ?? 0,
                self_score_5: payload.self_score_5 ?? 0,
                self_score_6: payload.self_score_6 ?? 0,
                self_score_7: payload.self_score_7 ?? 0,
                self_notes: payload.self_notes ?? null,
            })
            .select()
            .single();
        if (error) return { data: null, error: error.message };
        return { data: data as EvaluationForm, error: null };
    },

    async updateSelfScores(id: string, scores: {
        self_score_1: number; self_score_2: number; self_score_3: number;
        self_score_4: number; self_score_5: number; self_score_6: number;
        self_score_7: number; self_notes?: string | null;
    }): Promise<{ error: string | null }> {
        const { error } = await sb
            .from('evaluation_forms')
            .update({ ...scores, status: 'draft' })
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

    async approve(id: string, managerData: {
        manager_score_1: number; manager_score_2: number; manager_score_3: number;
        manager_score_4: number; manager_score_5: number; manager_score_6: number;
        manager_score_7: number; manager_notes?: string | null;
        manager_id: string; manager_name: string;
    }): Promise<{ error: string | null }> {
        const { error } = await sb
            .from('evaluation_forms')
            .update({ ...managerData, status: 'approved', reviewed_at: new Date().toISOString() })
            .eq('id', id)
            .eq('status', 'submitted');
        return { error: error?.message ?? null };
    },

    async reject(id: string, managerData: {
        manager_notes: string;
        manager_id: string;
        manager_name: string;
    }): Promise<{ error: string | null }> {
        const { error } = await sb
            .from('evaluation_forms')
            .update({
                manager_notes: managerData.manager_notes,
                manager_id: managerData.manager_id,
                manager_name: managerData.manager_name,
                status: 'rejected',
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('status', 'submitted');
        return { error: error?.message ?? null };
    },
};
