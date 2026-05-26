// Edge Function: deadline-check
//
// Daily cron job that runs at 8:00 AM GMT+7.
// Performs compliance checks:
//   - Daily overdue tasks warning (assignee + department head).
//   - Friday progress update reminder (compliance tracking).
//   - Monthly 23rd chốt báo cáo reminder.
//   - Monthly 25th missing completion result warnings to department heads.
//   - Monthly last working day report approval reminder to department heads.
//
// Authorization: caller must send Bearer <SUPABASE_SERVICE_ROLE_KEY>

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isLastWorkingDayOfMonth(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth();
  const todayDate = date.getDate();
  const lastDay = new Date(year, month + 1, 0).getDate();
  
  for (let d = todayDate + 1; d <= lastDay; d++) {
    const checkDate = new Date(year, month, d);
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday and not Saturday
      return false;
    }
  }
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: 'Server misconfigured' }, 500);
  }

  // Authorize using service_role key
  const authHeader = req.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // Create admin client to bypass RLS and perform operations
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get current date in Vietnam time (GMT+7)
  const nowUtc = new Date();
  const nowGmt7 = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000);
  const todayStr = nowGmt7.toISOString().split('T')[0];
  const currentMonth = nowGmt7.getMonth() + 1;
  const currentYear = nowGmt7.getFullYear();

  // Allow forcing specific checks via body
  let forceActions: string[] = [];
  try {
    if (req.method === 'POST') {
      const body = await req.json();
      if (body?.force && Array.isArray(body.force)) {
        forceActions = body.force;
      }
    }
  } catch {
    // Ignore parse errors, default to calendar logic
  }

  const results: Record<string, any> = {};

  try {
    // ═══════════════════════════════════════════════════════
    // 1. OVERDUE TASKS CHECK (Daily)
    // ═══════════════════════════════════════════════════════
    if (forceActions.includes('overdue') || forceActions.length === 0) {
      // Find tasks where due_date < today and status not in ('done', 'incomplete')
      const { data: overdueTasks, error: err1 } = await supabase
        .from('tasks')
        .select(`
          id, title, due_date, status, assignee_id,
          employees!tasks_assignee_id_fkey(full_name, department)
        `)
        .lt('due_date', todayStr)
        .not('status', 'in', '("done","incomplete")');

      if (err1) throw err1;

      if (overdueTasks && overdueTasks.length > 0) {
        const notificationsToInsert = [];
        
        // Find department heads
        const { data: deptHeads, error: headErr } = await supabase
          .from('employees')
          .select('employee_id, department')
          .in('position', ['Trưởng phòng', 'Trưởng Ban', 'Giám đốc'])
          .eq('status', 1);

        if (headErr) throw headErr;

        const headMap = new Map();
        deptHeads?.forEach(h => {
          headMap.set(h.department, h.employee_id);
        });

        for (const task of overdueTasks) {
          const emp = task.employees as any;
          const assigneeName = emp?.full_name || 'Nhân viên';
          const department = emp?.department || '';

          // Notify assignee
          if (task.assignee_id) {
            notificationsToInsert.push({
              user_id: task.assignee_id,
              title: 'Công việc quá hạn',
              message: `Công việc "${task.title}" đã quá hạn từ ngày ${formatDate(task.due_date)}. Vui lòng cập nhật hoặc báo cáo xin gia hạn.`,
              type: 'error',
              action_url: `/work-plan?tab=tasks`
            });
          }

          // Notify department head
          const headId = headMap.get(department);
          if (headId && headId !== task.assignee_id) {
            notificationsToInsert.push({
              user_id: headId,
              title: 'Công việc quá hạn của nhân viên',
              message: `Công việc "${task.title}" giao cho ${assigneeName} đã quá hạn từ ngày ${formatDate(task.due_date)}.`,
              type: 'error',
              action_url: `/work-plan?tab=tasks`
            });
          }
        }

        if (notificationsToInsert.length > 0) {
          const { error: notifyErr } = await supabase
            .from('notifications')
            .insert(notificationsToInsert);
          if (notifyErr) throw notifyErr;
        }

        results['overdue_checked'] = `${overdueTasks.length} tasks flagged, notifications sent.`;
      } else {
        results['overdue_checked'] = 'No overdue tasks found.';
      }
    }

    // ═══════════════════════════════════════════════════════
    // 2. FRIDAY COMPLIANCE CHECK (Weekly on Friday)
    // ═══════════════════════════════════════════════════════
    const isFriday = nowGmt7.getDay() === 5;
    if (forceActions.includes('friday') || (isFriday && forceActions.length === 0)) {
      const weekStart = getStartOfWeek(nowGmt7).toISOString().split('T')[0];

      // Get all active employees
      const { data: activeEmployees, error: empErr } = await supabase
        .from('employees')
        .select('employee_id, full_name')
        .eq('status', 1);

      if (empErr) throw empErr;

      const complianceInserts = [];
      const notificationsToInsert = [];

      for (const emp of activeEmployees) {
        // Check if employee has any active tasks (todo, in_progress)
        const { count, error: taskCountErr } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assignee_id', emp.employee_id)
          .in('status', ['todo', 'in_progress']);

        if (taskCountErr) throw taskCountErr;

        if (count && count > 0) {
          // Check if they updated any task this week (updated_at >= weekStart)
          const { data: updatedTasks, error: updateCheckErr } = await supabase
            .from('tasks')
            .select('id')
            .eq('assignee_id', emp.employee_id)
            .gte('updated_at', `${weekStart}T00:00:00Z`)
            .limit(1);

          if (updateCheckErr) throw updateCheckErr;

          const hasUpdated = updatedTasks && updatedTasks.length > 0;

          // Upsert compliance log
          complianceInserts.push({
            employee_id: emp.employee_id,
            week_start: weekStart,
            has_updated: hasUpdated,
            updated_at: hasUpdated ? new Date().toISOString() : null,
          });

          // If not updated, notify them
          if (!hasUpdated) {
            notificationsToInsert.push({
              user_id: emp.employee_id,
              title: 'Chưa cập nhật tiến độ tuần',
              message: 'Bạn chưa thực hiện cập nhật tiến độ công việc trong tuần này. Vui lòng cập nhật ngay.',
              type: 'warning',
              action_url: `/work-plan?tab=tasks`
            });
          }
        }
      }

      if (complianceInserts.length > 0) {
        const { error: upsertErr } = await supabase
          .from('update_compliance_log')
          .upsert(complianceInserts, { onConflict: 'employee_id,week_start' });
        if (upsertErr) throw upsertErr;
      }

      if (notificationsToInsert.length > 0) {
        const { error: notifyErr } = await supabase
          .from('notifications')
          .insert(notificationsToInsert);
        if (notifyErr) throw notifyErr;
      }

      results['friday_checked'] = `Compliance checked for ${activeEmployees.length} employees. ${notificationsToInsert.length} reminders sent.`;
    }

    // ═══════════════════════════════════════════════════════
    // 3. MONTHLY 23rd REMINDER (Monthly on 23rd)
    // ═══════════════════════════════════════════════════════
    const is23rd = nowGmt7.getDate() === 23;
    if (forceActions.includes('monthly23') || (is23rd && forceActions.length === 0)) {
      const { data: activeEmployees, error: empErr } = await supabase
        .from('employees')
        .select('employee_id')
        .eq('status', 1);

      if (empErr) throw empErr;

      const notificationsToInsert = activeEmployees.map(emp => ({
        user_id: emp.employee_id,
        title: 'Nhắc nhở chốt Báo cáo Tháng',
        message: 'Hạn cuối hoàn thành và cập nhật kết quả công việc tháng: trước 16:00 ngày 25. Vui lòng rà soát lại các công việc được giao.',
        type: 'info',
        action_url: `/work-plan?tab=monthly-report`
      }));

      if (notificationsToInsert.length > 0) {
        const { error: notifyErr } = await supabase
          .from('notifications')
          .insert(notificationsToInsert);
        if (notifyErr) throw notifyErr;
      }

      results['monthly23_checked'] = `Sent month-end chốt BC reminders to ${activeEmployees.length} employees.`;
    }

    // ═══════════════════════════════════════════════════════
    // 4. MONTHLY 25th CHECK (Monthly on 25th)
    // ═══════════════════════════════════════════════════════
    const is25th = nowGmt7.getDate() === 25;
    if (forceActions.includes('monthly25') || (is25th && forceActions.length === 0)) {
      // Find all tasks due in the current month that are incomplete/in-progress and have no completion_result
      const startOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

      const { data: uncompletedTasks, error: taskErr } = await supabase
        .from('tasks')
        .select(`
          id, title, due_date, status, completion_result, assignee_id,
          employees!tasks_assignee_id_fkey(department)
        `)
        .gte('due_date', startOfMonth)
        .lte('due_date', endOfMonth)
        .not('status', 'eq', 'done')
        .is('completion_result', null);

      if (taskErr) throw taskErr;

      if (uncompletedTasks && uncompletedTasks.length > 0) {
        // Group by department
        const deptUncompletedCount = new Map<string, number>();
        uncompletedTasks.forEach(t => {
          const dept = (t.employees as any)?.department;
          if (dept) {
            deptUncompletedCount.set(dept, (deptUncompletedCount.get(dept) || 0) + 1);
          }
        });

        // Find department heads
        const { data: deptHeads, error: headErr } = await supabase
          .from('employees')
          .select('employee_id, department')
          .in('position', ['Trưởng phòng', 'Trưởng Ban', 'Giám đốc'])
          .eq('status', 1);

        if (headErr) throw headErr;

        const notificationsToInsert = [];
        deptHeads?.forEach(h => {
          const count = deptUncompletedCount.get(h.department);
          if (count && count > 0) {
            notificationsToInsert.push({
              user_id: h.employee_id,
              title: 'Cảnh báo công việc chưa có kết quả',
              message: `Phòng ${h.department} có ${count} công việc chưa hoàn thành hoặc chưa có kết quả thực hiện. Vui lòng đôn đốc nhân viên hoàn thành trước 16:00 hôm nay.`,
              type: 'warning',
              action_url: `/work-plan?tab=monthly-report`
            });
          }
        });

        if (notificationsToInsert.length > 0) {
          const { error: notifyErr } = await supabase
            .from('notifications')
            .insert(notificationsToInsert);
          if (notifyErr) throw notifyErr;
        }

        results['monthly25_checked'] = `Sent missing completion result warnings to ${notificationsToInsert.length} department heads.`;
      } else {
        results['monthly25_checked'] = 'No uncompleted or missing-result tasks found for current month.';
      }
    }

    // ═══════════════════════════════════════════════════════
    // 5. LAST WORKING DAY REMINDER (Monthly on Last Working Day)
    // ═══════════════════════════════════════════════════════
    const isLastLd = isLastWorkingDayOfMonth(nowGmt7);
    if (forceActions.includes('lastWorkingDay') || (isLastLd && forceActions.length === 0)) {
      // Find all department heads (TP)
      const { data: deptHeads, error: headErr } = await supabase
        .from('employees')
        .select('employee_id')
        .in('position', ['Trưởng phòng', 'Trưởng Ban'])
        .eq('status', 1);

      if (headErr) throw headErr;

      const notificationsToInsert = deptHeads.map(h => ({
        user_id: h.employee_id,
        title: 'Hạn duyệt Báo cáo Phòng',
        message: 'Hôm nay là ngày làm việc cuối cùng của tháng. Vui lòng rà soát, duyệt Báo cáo Tháng của phòng và thực hiện chấm điểm phòng/nhân viên trước 16:00.',
        type: 'approval',
        action_url: `/work-plan?tab=monthly-report`
      }));

      if (notificationsToInsert.length > 0) {
        const { error: notifyErr } = await supabase
          .from('notifications')
          .insert(notificationsToInsert);
        if (notifyErr) throw notifyErr;
      }

      results['lastWorkingDay_checked'] = `Sent month-end approval reminder to ${deptHeads.length} department heads.`;
    }

    return json({ success: true, processed: results });
  } catch (e) {
    return json({ error: (e as Error).message || 'Internal error during compliance check' }, 500);
  }
});
