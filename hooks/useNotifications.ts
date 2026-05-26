import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../services/NotificationService';
import type { DbNotification } from '../services/NotificationService';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (userId: string, filters: Record<string, any>) => [...notificationKeys.lists(), userId, filters] as const,
  counts: () => [...notificationKeys.all, 'count'] as const,
  count: (userId: string) => [...notificationKeys.counts(), userId] as const,
};

// Hook to load notification list
export const useNotifications = (userId?: string, limit = 50) => {
  return useQuery({
    queryKey: notificationKeys.list(userId || '', { limit }),
    queryFn: async () => {
      if (!userId) return [] as DbNotification[];
      return NotificationService.getAll(userId, { limit });
    },
    enabled: !!userId,
    staleTime: 10 * 1000, // 10 seconds
  });
};

// Hook to load unread notification count with polling (every 30s)
export const useUnreadNotificationsCount = (userId?: string) => {
  return useQuery({
    queryKey: notificationKeys.count(userId || ''),
    queryFn: async () => {
      if (!userId) return 0;
      return NotificationService.getUnreadCount(userId);
    },
    enabled: !!userId,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    staleTime: 5 * 1000,
  });
};

// Hook to mark a notification as read
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return NotificationService.markAsRead(id);
    },
    onSuccess: (_, id) => {
      // Invalidate both lists and counts
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

// Hook to mark all notifications as read
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      return NotificationService.markAllAsRead(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

// Hook to create a notification (e.g. manually in client or trigger)
export const useCreateNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      userId: string;
      title: string;
      message: string | null;
      type: DbNotification['type'];
      actionUrl?: string | null;
    }) => {
      return NotificationService.createNotification(
        args.userId,
        args.title,
        args.message,
        args.type,
        args.actionUrl
      );
    },
    onSuccess: (_, args) => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.count(args.userId),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.list(args.userId, {}),
      });
    },
  });
};
