export type NotificationType = 
  | 'project_launched'
  | 'task_assigned'
  | 'task_completed'
  | 'project_updated'
  | 'general';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    projectId?: string;
    projectName?: string;
    taskId?: string;
    stageId?: string;
    userId?: string;
  };
  recipientId: string;
  isRead: boolean;
  createdAt: string;
}

export interface CreateNotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: Notification['data'];
  recipientIds: string[];
}

export interface MarkNotificationReadPayload {
  notificationId: string;
}

export interface NotificationPreferences {
  userId: string;
  projectLaunched: boolean;
  taskAssigned: boolean;
  taskCompleted: boolean;
  projectUpdated: boolean;
}
