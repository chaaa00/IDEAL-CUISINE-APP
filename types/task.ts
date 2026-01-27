export type TaskStatus = 'pending' | 'paused' | 'completed';

export interface Task {
  id: string;
  stageId: string;
  projectId: string;
  taskNumber: number;
  description: string;
  status: TaskStatus;
  assignedUsers: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completedBy?: string;
}

export interface TaskReport {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  comment: string;
  photoUrl?: string;
  createdAt: string;
}

export interface CreateTaskPayload {
  stageId: string;
  projectId: string;
  description: string;
  assignedUsers: string[];
}

export interface UpdateTaskPayload {
  id: string;
  description?: string;
  status?: TaskStatus;
  assignedUsers?: string[];
}

export interface CreateTaskReportPayload {
  taskId: string;
  userId: string;
  userName: string;
  comment: string;
  photoUrl?: string;
}

export interface TaskNotification {
  id: string;
  taskId: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#666' },
  paused: { label: 'Paused', color: '#FDD835' },
  completed: { label: 'Completed', color: '#43A047' },
};
