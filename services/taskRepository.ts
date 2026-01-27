import {
  Task,
  TaskReport,
  TaskNotification,
  CreateTaskPayload,
  UpdateTaskPayload,
  CreateTaskReportPayload,
} from '@/types/task';

export interface ITaskRepository {
  getAllTasks(): Promise<Task[]>;
  getTasksByStageId(stageId: string): Promise<Task[]>;
  getTasksByProjectId(projectId: string): Promise<Task[]>;
  getTaskById(taskId: string): Promise<Task | null>;
  createTask(payload: CreateTaskPayload): Promise<Task>;
  updateTask(payload: UpdateTaskPayload): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;
  completeTask(taskId: string, userId: string): Promise<Task>;
  pauseTask(taskId: string): Promise<Task>;
  resumeTask(taskId: string): Promise<Task>;
  getReportsByTaskId(taskId: string): Promise<TaskReport[]>;
  createReport(payload: CreateTaskReportPayload): Promise<TaskReport>;
  sendNotification(taskId: string, userIds: string[], message: string): Promise<void>;
}

export class TaskRepository implements ITaskRepository {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async getAllTasks(): Promise<Task[]> {
    console.log('[TaskRepository] Fetching all tasks');

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/tasks`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[TaskRepository] Get all tasks error:', error);
      throw error;
    }
  }

  async getTasksByStageId(stageId: string): Promise<Task[]> {
    console.log('[TaskRepository] Fetching tasks for stage:', stageId);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/stages/${stageId}/tasks`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[TaskRepository] Get tasks by stage error:', error);
      throw error;
    }
  }

  async getTasksByProjectId(projectId: string): Promise<Task[]> {
    console.log('[TaskRepository] Fetching tasks for project:', projectId);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects/${projectId}/tasks`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[TaskRepository] Get tasks by project error:', error);
      throw error;
    }
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    console.log('[TaskRepository] Fetching task:', taskId);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // if (response.status === 404) return null;
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[TaskRepository] Get task error:', error);
      throw error;
    }
  }

  async createTask(payload: CreateTaskPayload): Promise<Task> {
    console.log('[TaskRepository] Creating task:', payload.description);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/tasks`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(payload),
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[TaskRepository] Create task error:', error);
      throw error;
    }
  }

  async updateTask(payload: UpdateTaskPayload): Promise<Task> {
    console.log('[TaskRepository] Updating task:', payload.id);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/tasks/${payload.id}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(payload),
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[TaskRepository] Update task error:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    console.log('[TaskRepository] Deleting task:', taskId);

    try {
      // TODO: Replace with actual API call
      // await fetch(`${this.baseUrl}/tasks/${taskId}`, {
      //   method: 'DELETE',
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[TaskRepository] Delete task error:', error);
      throw error;
    }
  }

  async completeTask(taskId: string, userId: string): Promise<Task> {
    console.log('[TaskRepository] Completing task:', taskId);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/tasks/${taskId}/complete`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ userId }),
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[TaskRepository] Complete task error:', error);
      throw error;
    }
  }

  async pauseTask(taskId: string): Promise<Task> {
    console.log('[TaskRepository] Pausing task:', taskId);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/tasks/${taskId}/pause`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[TaskRepository] Pause task error:', error);
      throw error;
    }
  }

  async resumeTask(taskId: string): Promise<Task> {
    console.log('[TaskRepository] Resuming task:', taskId);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/tasks/${taskId}/resume`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[TaskRepository] Resume task error:', error);
      throw error;
    }
  }

  async getReportsByTaskId(taskId: string): Promise<TaskReport[]> {
    console.log('[TaskRepository] Fetching reports for task:', taskId);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/tasks/${taskId}/reports`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[TaskRepository] Get reports error:', error);
      throw error;
    }
  }

  async createReport(payload: CreateTaskReportPayload): Promise<TaskReport> {
    console.log('[TaskRepository] Creating report for task:', payload.taskId);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/tasks/${payload.taskId}/reports`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(payload),
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[TaskRepository] Create report error:', error);
      throw error;
    }
  }

  async sendNotification(taskId: string, userIds: string[], message: string): Promise<void> {
    console.log('[TaskRepository] Sending notification for task:', taskId, 'to users:', userIds);

    try {
      // TODO: Replace with actual API call (e.g., Firebase Cloud Messaging, OneSignal, etc.)
      // await fetch(`${this.baseUrl}/notifications/send`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({
      //     taskId,
      //     userIds,
      //     message,
      //     type: 'task_assignment',
      //   }),
      // });

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[TaskRepository] Send notification error:', error);
      throw error;
    }
  }
}

export const taskRepository = new TaskRepository();
