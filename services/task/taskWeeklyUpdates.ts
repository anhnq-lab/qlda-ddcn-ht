// TaskService weekly updates module — structured weekly progress reports.
import { supabase } from '../../lib/supabase';

export interface WeeklyUpdate {
  id: string;
  task_id: string;
  week_number: number;
  year: number;
  report_date: string;
  progress: number;
  work_done: string | null;
  obstacles: string | null;
  plan_next_week: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined user info
  user?: {
    raw_user_meta_data?: { full_name?: string };
    email?: string;
  };
}

export interface WeeklyUpdateInput {
  week_number: number;
  year: number;
  report_date?: string;
  progress?: number;
  work_done?: string;
  obstacles?: string;
  plan_next_week?: string;
}

/** Lấy tuần hiện tại theo ISO 8601 */
export const getCurrentWeekNumber = (): { week: number; year: number } => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000) + 1;
  const week = Math.ceil((dayOfYear + startOfYear.getDay()) / 7);
  return { week, year: now.getFullYear() };
};

/** Format tuần hiển thị */
export const formatWeekLabel = (week: number, year: number): string => {
  return `Tuần ${week}/${year}`;
};

/** Simple select string (no FK join to auth.users) */
const SELECT_FIELDS = '*, created_by';

/** Lấy tất cả báo cáo tuần của 1 task (mới nhất trước) */
export const getTaskWeeklyUpdates = async (taskId: string): Promise<WeeklyUpdate[]> => {
  const { data, error } = await (supabase as any)
    .from('task_weekly_updates')
    .select(SELECT_FIELDS)
    .eq('task_id', taskId)
    .order('year', { ascending: false })
    .order('week_number', { ascending: false });

  if (error) {
    // Table may not exist yet
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return [];
    }
    throw error;
  }
  return data || [];
};

/** Thêm báo cáo tuần mới (upsert — nếu tuần đã có thì cập nhật) */
export const addWeeklyUpdate = async (taskId: string, input: WeeklyUpdateInput): Promise<WeeklyUpdate> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Chưa đăng nhập');

  const now = new Date().toISOString();
  const payload = {
    task_id: taskId,
    week_number: input.week_number,
    year: input.year,
    report_date: input.report_date || new Date().toISOString().split('T')[0],
    progress: input.progress || 0,
    work_done: input.work_done || null,
    obstacles: input.obstacles || null,
    plan_next_week: input.plan_next_week || null,
    created_by: userData.user.id,
    updated_at: now,
  };

  // Try upsert
  const { data, error } = await (supabase as any)
    .from('task_weekly_updates')
    .upsert(payload, { onConflict: 'task_id,week_number,year' })
    .select(SELECT_FIELDS)
    .single();

  if (error) throw error;
  return data;
};

/** Cập nhật báo cáo tuần */
export const updateWeeklyUpdate = async (updateId: string, input: Partial<WeeklyUpdateInput>): Promise<WeeklyUpdate> => {
  const payload: any = { ...input, updated_at: new Date().toISOString() };

  const { data, error } = await (supabase as any)
    .from('task_weekly_updates')
    .update(payload)
    .eq('id', updateId)
    .select(SELECT_FIELDS)
    .single();

  if (error) throw error;
  return data;
};

/** Lấy báo cáo tuần hiện tại (nếu có) */
export const getCurrentWeekUpdate = async (taskId: string): Promise<WeeklyUpdate | null> => {
  const { week, year } = getCurrentWeekNumber();

  const { data, error } = await (supabase as any)
    .from('task_weekly_updates')
    .select(SELECT_FIELDS)
    .eq('task_id', taskId)
    .eq('week_number', week)
    .eq('year', year)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) return null;
    throw error;
  }
  return data;
};
