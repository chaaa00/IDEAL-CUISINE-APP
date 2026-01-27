import { Notification, CreateNotificationPayload, NotificationPreferences } from '@/types/notification';
import { notificationRepository, INotificationRepository } from './notificationRepository';

export interface INotificationService {
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
  sendNotification(payload: CreateNotificationPayload): Promise<Notification[]>;
  sendProjectLaunchNotification(projectId: string, projectName: string, recipientIds: string[]): Promise<Notification[]>;
  sendTaskAssignedNotification(taskId: string, taskDescription: string, projectName: string, recipientIds: string[]): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  clearAllNotifications(userId: string): Promise<void>;
  getPreferences(userId: string): Promise<NotificationPreferences>;
  updatePreferences(preferences: NotificationPreferences): Promise<NotificationPreferences>;
}

class NotificationService implements INotificationService {
  private repository: INotificationRepository;

  constructor(repository: INotificationRepository) {
    this.repository = repository;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    console.log('[NotificationService] Getting notifications for user:', userId);
    return this.repository.getNotifications(userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    console.log('[NotificationService] Getting unread count for user:', userId);
    return this.repository.getUnreadCount(userId);
  }

  async sendNotification(payload: CreateNotificationPayload): Promise<Notification[]> {
    console.log('[NotificationService] Sending notification:', payload.title);
    console.log('[NotificationService] Recipients count:', payload.recipientIds.length);
    return this.repository.createNotification(payload);
  }

  async sendProjectLaunchNotification(
    projectId: string,
    projectName: string,
    recipientIds: string[]
  ): Promise<Notification[]> {
    console.log('[NotificationService] Sending project launch notification');
    console.log('[NotificationService] Project:', projectName);
    console.log('[NotificationService] Notifying employees:', recipientIds);

    const payload: CreateNotificationPayload = {
      type: 'project_launched',
      title: 'Project Launched',
      message: `Project "${projectName}" has been launched. You have been assigned to this project.`,
      data: {
        projectId,
        projectName,
      },
      recipientIds,
    };

    return this.sendNotification(payload);
  }

  async sendTaskAssignedNotification(
    taskId: string,
    taskDescription: string,
    projectName: string,
    recipientIds: string[]
  ): Promise<Notification[]> {
    console.log('[NotificationService] Sending task assigned notification');
    console.log('[NotificationService] Task:', taskDescription);
    console.log('[NotificationService] Project:', projectName);

    const payload: CreateNotificationPayload = {
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: "${taskDescription}" in project "${projectName}".`,
      data: {
        taskId,
        projectName,
      },
      recipientIds,
    };

    return this.sendNotification(payload);
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    console.log('[NotificationService] Marking notification as read:', notificationId);
    return this.repository.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    console.log('[NotificationService] Marking all notifications as read for user:', userId);
    return this.repository.markAllAsRead(userId);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    console.log('[NotificationService] Deleting notification:', notificationId);
    return this.repository.deleteNotification(notificationId);
  }

  async clearAllNotifications(userId: string): Promise<void> {
    console.log('[NotificationService] Clearing all notifications for user:', userId);
    return this.repository.clearAllNotifications(userId);
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    console.log('[NotificationService] Getting preferences for user:', userId);
    return this.repository.getPreferences(userId);
  }

  async updatePreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    console.log('[NotificationService] Updating preferences for user:', preferences.userId);
    return this.repository.updatePreferences(preferences);
  }
}

export const notificationService = new NotificationService(notificationRepository);
