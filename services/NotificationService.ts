import { supabase } from '../lib/supabase';
import { toServiceError } from './ServiceError';

export interface DbNotification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: 'info' | 'warning' | 'error' | 'success' | 'task' | 'approval';
  read_at: string | null;
  action_url: string | null;
  created_at: string;
}

export const NotificationService = {
  // Get all unread notifications for a user
  async getUnread(userId: string): Promise<DbNotification[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .is('read_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DbNotification[];
    } catch (err) {
      throw toServiceError(err, 'Không thể tải danh sách thông báo chưa đọc');
    }
  },

  // Get all notifications with pagination
  async getAll(userId: string, opts?: { limit?: number; offset?: number }): Promise<DbNotification[]> {
    try {
      const limit = opts?.limit ?? 50;
      const offset = opts?.offset ?? 0;

      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return (data || []) as DbNotification[];
    } catch (err) {
      throw toServiceError(err, 'Không thể tải danh sách thông báo');
    }
  },

  // Get count of unread notifications
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await (supabase as any)
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.error('Error fetching unread count:', err);
      return 0;
    }
  },

  // Mark a single notification as read
  async markAsRead(id: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      throw toServiceError(err, 'Không thể đánh dấu thông báo đã đọc');
    }
  },

  // Mark all notifications for a user as read
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) throw error;
    } catch (err) {
      throw toServiceError(err, 'Không thể đánh dấu tất cả thông báo');
    }
  },

  // Create a notification
  async createNotification(
    userId: string,
    title: string,
    message: string | null,
    type: DbNotification['type'],
    actionUrl: string | null = null
  ): Promise<DbNotification> {
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          action_url: actionUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DbNotification;
    } catch (err) {
      console.error('Failed to create notification:', err);
      throw toServiceError(err, 'Không thể tạo thông báo');
    }
  },

  // Helper trigger notifications
  async notifyTaskAssigned(taskTitle: string, taskId: string, assigneeId: string): Promise<void> {
    await this.createNotification(
      assigneeId,
      'Bạn được giao công việc mới',
      taskTitle,
      'task',
      `/tasks?id=${taskId}`
    );
  },

  async notifyDeadlineApproaching(taskTitle: string, taskId: string, assigneeId: string, daysLeft: number): Promise<void> {
    await this.createNotification(
      assigneeId,
      `Công việc sắp đến hạn (${daysLeft} ngày nữa)`,
      taskTitle,
      'warning',
      `/tasks?id=${taskId}`
    );
  },

  async notifyApprovalNeeded(type: 'self_proposal' | 'annual_plan' | 'monthly_report', refId: string, title: string, approverId: string): Promise<void> {
    let actionUrl = '';
    if (type === 'self_proposal') actionUrl = `/tasks?id=${refId}`;
    else if (type === 'annual_plan') actionUrl = `/employees?tab=annual-evaluation`; // or annual plan tab
    else if (type === 'monthly_report') actionUrl = `/work-plan?tab=monthly-report`;

    await this.createNotification(
      approverId,
      'Yêu cầu phê duyệt mới',
      title,
      'approval',
      actionUrl
    );
  },

  async notifyScorePublished(employeeId: string, month: number, year: number, classificationLabel: string): Promise<void> {
    await this.createNotification(
      employeeId,
      `Đã công bố kết quả đánh giá tháng ${month}/${year}`,
      `Kết quả xếp loại của bạn: ${classificationLabel}`,
      'success',
      `/employees?tab=regulation-scoring`
    );
  },

  async notifyTaskProposal(taskTitle: string, taskId: string, creatorId: string): Promise<void> {
    try {
      const { data: creator } = await supabase
        .from('employees')
        .select('department, full_name')
        .eq('employee_id', creatorId)
        .single();

      if (!creator || !creator.department) return;

      const { data: heads } = await supabase
        .from('employees')
        .select('employee_id')
        .eq('department', creator.department)
        .or('role.eq.department_head,role.eq.manager,position.ilike.%Trưởng phòng%')
        .neq('employee_id', creatorId);

      if (heads && heads.length > 0) {
        for (const head of heads) {
          await this.createNotification(
            head.employee_id,
            'Đề xuất công việc mới cần duyệt',
            `${creator.full_name} đã đề xuất: ${taskTitle}`,
            'approval',
            `/tasks?id=${taskId}`
          );
        }
      }
    } catch (err) {
      console.error('Error sending task proposal notification:', err);
    }
  },

  async notifyProposalResponse(taskTitle: string, taskId: string, assigneeId: string, isApproved: boolean): Promise<void> {
    await this.createNotification(
      assigneeId,
      isApproved ? 'Đề xuất công việc đã được phê duyệt' : 'Đề xuất công việc bị từ chối',
      taskTitle,
      isApproved ? 'success' : 'warning',
      `/tasks?id=${taskId}`
    );
  }
};
