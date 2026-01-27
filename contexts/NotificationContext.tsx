import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Notification, CreateNotificationPayload, NotificationPreferences } from '@/types/notification';
import { notificationService } from '@/services/notificationService';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  preferences: NotificationPreferences | null;
  sendNotification: (payload: CreateNotificationPayload) => Promise<void>;
  sendProjectLaunchNotification: (projectId: string, projectName: string, recipientIds: string[]) => Promise<void>;
  sendTaskAssignedNotification: (taskId: string, taskDescription: string, projectName: string, recipientIds: string[]) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
  refetchNotifications: () => void;
  addLocalNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
}

export const [NotificationProvider, useNotifications] = createContextHook<NotificationContextValue>(() => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);

  const notificationsQuery = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => (userId ? notificationService.getNotifications(userId) : Promise.resolve([])),
    enabled: !!userId,
    retry: false,
  });

  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'unread', userId],
    queryFn: () => (userId ? notificationService.getUnreadCount(userId) : Promise.resolve(0)),
    enabled: !!userId,
    retry: false,
  });

  const preferencesQuery = useQuery({
    queryKey: ['notifications', 'preferences', userId],
    queryFn: () => (userId ? notificationService.getPreferences(userId) : Promise.resolve(null)),
    enabled: !!userId,
    retry: false,
  });

  const sendNotificationMutation = useMutation({
    mutationFn: (payload: CreateNotificationPayload) => notificationService.sendNotification(payload),
    onSuccess: () => {
      console.log('[NotificationContext] Notification sent successfully');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.log('[NotificationContext] Notification send failed (API not connected):', error);
    },
  });

  const projectLaunchMutation = useMutation({
    mutationFn: ({ projectId, projectName, recipientIds }: { projectId: string; projectName: string; recipientIds: string[] }) =>
      notificationService.sendProjectLaunchNotification(projectId, projectName, recipientIds),
    onSuccess: () => {
      console.log('[NotificationContext] Project launch notification sent');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.log('[NotificationContext] Project launch notification failed (API not connected):', error);
    },
  });

  const taskAssignedMutation = useMutation({
    mutationFn: ({ taskId, taskDescription, projectName, recipientIds }: { taskId: string; taskDescription: string; projectName: string; recipientIds: string[] }) =>
      notificationService.sendTaskAssignedNotification(taskId, taskDescription, projectName, recipientIds),
    onSuccess: () => {
      console.log('[NotificationContext] Task assigned notification sent');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.log('[NotificationContext] Task assigned notification failed (API not connected):', error);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.log('[NotificationContext] Mark as read failed (API not connected):', error);
      setLocalNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => (userId ? notificationService.markAllAsRead(userId) : Promise.resolve()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.log('[NotificationContext] Mark all as read failed (API not connected):', error);
      setLocalNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.log('[NotificationContext] Delete notification failed (API not connected):', error);
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => (userId ? notificationService.clearAllNotifications(userId) : Promise.resolve()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.log('[NotificationContext] Clear all failed (API not connected):', error);
      setLocalNotifications([]);
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (preferences: NotificationPreferences) => notificationService.updatePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
    },
  });

  const notifications = useMemo(() => {
    const apiNotifications = notificationsQuery.data ?? [];
    return [...localNotifications, ...apiNotifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notificationsQuery.data, localNotifications]);

  const unreadCount = useMemo(() => {
    const localUnread = localNotifications.filter(n => !n.isRead).length;
    const apiUnread = unreadCountQuery.data ?? 0;
    return localUnread + apiUnread;
  }, [localNotifications, unreadCountQuery.data]);

  const addLocalNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `local_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    console.log('[NotificationContext] Adding local notification:', newNotification.title);
    setLocalNotifications(prev => [newNotification, ...prev]);
  }, []);

  const sendNotification = useCallback(async (payload: CreateNotificationPayload): Promise<void> => {
    try {
      await sendNotificationMutation.mutateAsync(payload);
    } catch (error) {
      console.log('[NotificationContext] Using local notification fallback');
      payload.recipientIds.forEach(recipientId => {
        addLocalNotification({
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.data,
          recipientId,
        });
      });
    }
  }, [sendNotificationMutation, addLocalNotification]);

  const sendProjectLaunchNotification = useCallback(async (
    projectId: string,
    projectName: string,
    recipientIds: string[]
  ): Promise<void> => {
    console.log('[NotificationContext] Launching project notification for:', projectName);
    console.log('[NotificationContext] Notifying employees:', recipientIds);
    
    try {
      await projectLaunchMutation.mutateAsync({ projectId, projectName, recipientIds });
    } catch (error) {
      console.log('[NotificationContext] Using local notification fallback for project launch');
      recipientIds.forEach(recipientId => {
        addLocalNotification({
          type: 'project_launched',
          title: 'Project Launched',
          message: `Project "${projectName}" has been launched. You have been assigned to this project.`,
          data: { projectId, projectName },
          recipientId,
        });
      });
    }
  }, [projectLaunchMutation, addLocalNotification]);

  const sendTaskAssignedNotification = useCallback(async (
    taskId: string,
    taskDescription: string,
    projectName: string,
    recipientIds: string[]
  ): Promise<void> => {
    try {
      await taskAssignedMutation.mutateAsync({ taskId, taskDescription, projectName, recipientIds });
    } catch (error) {
      console.log('[NotificationContext] Using local notification fallback for task assignment');
      recipientIds.forEach(recipientId => {
        addLocalNotification({
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `You have been assigned a new task: "${taskDescription}" in project "${projectName}".`,
          data: { taskId, projectName },
          recipientId,
        });
      });
    }
  }, [taskAssignedMutation, addLocalNotification]);

  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    if (notificationId.startsWith('local_')) {
      setLocalNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } else {
      await markAsReadMutation.mutateAsync(notificationId);
    }
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    setLocalNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await markAllAsReadMutation.mutateAsync();
  }, [markAllAsReadMutation]);

  const deleteNotification = useCallback(async (notificationId: string): Promise<void> => {
    if (notificationId.startsWith('local_')) {
      setLocalNotifications(prev => prev.filter(n => n.id !== notificationId));
    } else {
      await deleteNotificationMutation.mutateAsync(notificationId);
    }
  }, [deleteNotificationMutation]);

  const clearAllNotifications = useCallback(async (): Promise<void> => {
    setLocalNotifications([]);
    await clearAllMutation.mutateAsync();
  }, [clearAllMutation]);

  const updatePreferences = useCallback(async (preferences: NotificationPreferences): Promise<void> => {
    await updatePreferencesMutation.mutateAsync(preferences);
  }, [updatePreferencesMutation]);

  const refetchNotifications = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  return {
    notifications,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    preferences: preferencesQuery.data ?? null,
    sendNotification,
    sendProjectLaunchNotification,
    sendTaskAssignedNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updatePreferences,
    refetchNotifications,
    addLocalNotification,
  };
});
