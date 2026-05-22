// TaskService collaboration module — comments + activity log.
// All read paths go through RPCs that already enforce the per-task ACL.
import { supabase } from '../../lib/supabase';

/** Lấy bình luận của 1 task */
export const getTaskComments = async (taskId: string): Promise<any[]> => {
  const { data, error } = await (supabase as any).rpc('get_task_comments_v2', { p_task_id: taskId });
  if (error) throw error;
  return data || [];
};

/** Lấy nhật ký hoạt động của 1 task */
export const getTaskActivities = async (taskId: string): Promise<any[]> => {
  const { data, error } = await (supabase as any).rpc('get_task_activities_v2', { p_task_id: taskId });
  if (error) throw error;
  return data || [];
};

/** Thêm bình luận mới */
export const addComment = async (taskId: string, content: string, attachments: any[] = []) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Chưa đăng nhập');

  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userData.user.id,
      content,
      attachments,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
