// usePlanData — Các hooks lấy dữ liệu gợi ý cho module Kế hoạch & Công việc
import { useState, useEffect, useMemo } from 'react';
import { supabase as _supabase } from '../lib/supabase';
const supabase = _supabase as any;
import type { AnnualPlanItem, DepartmentCode } from '../types/plan.types';
import type { ComboboxOption } from '../components/ui/ComboboxSelect';

// ─── Hook: Danh sách KH khung theo năm/phòng ─────────────────
export function useAnnualPlanItems(year: number, deptCode?: DepartmentCode) {
    const [items, setItems] = useState<AnnualPlanItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const query = supabase
            .from('annual_plan_items')
            .select('id, task_name, group_name, deliverable, frequency, responsible_text')
            .eq('plan_year', year)
            .order('group_sort_order')
            .order('sort_order');
        if (deptCode) query.eq('department_code', deptCode);
        query.then(({ data }: any) => {
            if (!cancelled) setItems((data as AnnualPlanItem[]) ?? []);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, [year, deptCode]);

    const options: ComboboxOption[] = useMemo(() =>
        items.map(i => ({
            value: i.id,
            label: i.task_name,
            sublabel: i.group_name ? `[${i.group_name}]` : undefined,
        })), [items]);

    return { items, options, loading };
}

// ─── Hook: Gợi ý tên nhóm công việc ─────────────────────────
export function useGroupSuggestions(year?: number) {
    const [groups, setGroups] = useState<string[]>([]);

    useEffect(() => {
        let cancelled = false;
        const fetch = async () => {
            const [{ data: annual }, { data: monthly }] = await Promise.all([
                supabase
                    .from('annual_plan_items')
                    .select('group_name')
                    .not('group_name', 'is', null)
                    .eq('plan_year', year ?? new Date().getFullYear()),
                supabase
                    .from('monthly_plan_items')
                    .select('group_name')
                    .not('group_name', 'is', null),
            ]);
            if (cancelled) return;
            const allNames = [
                ...(annual ?? []).map((r: any) => r.group_name as string),
                ...(monthly ?? []).map((r: any) => r.group_name as string),
            ];
            setGroups([...new Set(allNames)].sort());
        };
        fetch().catch(console.error);
        return () => { cancelled = true; };
    }, [year]);

    return groups;
}

// ─── Hook: Danh sách nhân viên dạng ComboboxOption ───────────
export function useEmployeeOptions() {
    const [options, setOptions] = useState<ComboboxOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        supabase
            .from('employees')
            .select('employee_id, full_name, position, department, avatar_url')
            .eq('status', 1)
            .order('full_name')
            .then(({ data, error }: any) => {
                if (cancelled) return;
                if (error) {
                    console.error('Error fetching employee options:', error);
                    setOptions([]);
                    setLoading(false);
                    return;
                }
                setOptions(
                    ((data as any[]) ?? []).map(e => ({
                        value: e.employee_id,
                        label: e.full_name,
                        sublabel: [e.position, e.department].filter(Boolean).join(' · '),
                        avatar: e.avatar_url ?? undefined,
                        department: e.department,
                        position: e.position,
                    }))
                );
                setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    return { options, loading };
}

// ─── Hook: Danh sách dự án dạng ComboboxOption ───────────────
export function useProjectOptions(search?: string) {
    const [options, setOptions] = useState<ComboboxOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        let query = supabase
            .from('projects')
            .select('ProjectID, ProjectName, ProjectCode')
            .order('ProjectName')
            .limit(100);
        if (search?.trim()) {
            query = query.ilike('ProjectName', `%${search}%`);
        }
        query.then(({ data }: any) => {
            if (cancelled) return;
            setOptions(
                ((data as any[]) ?? []).map(p => ({
                    value: p.ProjectID,
                    label: p.ProjectName,
                    sublabel: p.ProjectCode ?? undefined,
                }))
            );
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, [search]);

    return { options, loading };
}

// ─── Hook: Tasks thuộc 1 monthly plan item ───────────────────
export function useTasksByMonthlyPlanItem(monthlyPlanItemId?: string) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!monthlyPlanItemId) { setTasks([]); return; }
        let cancelled = false;
        setLoading(true);
        supabase
            .from('tasks')
            .select('id, title, status, priority, progress, assignee_id, due_date, sort_order')
            .eq('monthly_plan_item_id', monthlyPlanItemId)
            .order('sort_order')
            .then(({ data }: any) => {
                if (!cancelled) {
                    const mappedTasks = (data || []).map((t: any) => ({
                        TaskID: t.id,
                        Title: t.title,
                        Status: t.status,
                        Priority: t.priority,
                        ProgressPercent: t.progress,
                        AssigneeID: t.assignee_id,
                        DueDate: t.due_date,
                        SortOrder: t.sort_order
                    }));
                    setTasks(mappedTasks);
                }
                setLoading(false);
            });
        return () => { cancelled = true; };
    }, [monthlyPlanItemId]);

    return { tasks, loading };
}

// ─── Hook: MonthlyPlanItems dạng ComboboxOption (để chọn ở Task form) ───
export function useMonthlyPlanItemOptions(month: number, year: number, deptCode?: DepartmentCode) {
    const [options, setOptions] = useState<ComboboxOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const fetch = async () => {
            // Lấy plan header trước
            let planQ = supabase
                .from('monthly_plans')
                .select('id')
                .eq('plan_month', month)
                .eq('plan_year', year);
            if (deptCode) planQ = planQ.eq('department_code', deptCode);
            const { data: plans } = await planQ;
            if (cancelled || !plans?.length) { setOptions([]); setLoading(false); return; }

            const planIds = plans.map((p: any) => p.id);
            const { data: items } = await supabase
                .from('monthly_plan_items')
                .select('id, task_name, group_name, deadline_note')
                .in('monthly_plan_id', planIds)
                .order('group_sort_order')
                .order('sort_order');

            if (cancelled) return;
            setOptions(
                ((items as any[]) ?? []).map(i => ({
                    value: i.id,
                    label: i.task_name,
                    sublabel: [i.group_name, i.deadline_note].filter(Boolean).join(' · '),
                }))
            );
            setLoading(false);
        };
        fetch().catch(console.error);
        return () => { cancelled = true; };
    }, [month, year, deptCode]);

    return { options, loading };
}
