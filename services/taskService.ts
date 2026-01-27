import {
  Task,
  TaskReport,
  CreateTaskPayload,
  UpdateTaskPayload,
  CreateTaskReportPayload,
} from '@/types/task';
import { taskRepository, ITaskRepository } from './taskRepository';

export class TaskService {
  private repository: ITaskRepository;

  constructor(repository: ITaskRepository = taskRepository) {
    this.repository = repository;
  }

  async getAllTasks(): Promise<Task[]> {
    console.log('[TaskService] Getting all tasks');
    return this.repository.getAllTasks();
  }

  async getTasksByStage(stageId: string): Promise<Task[]> {
    console.log('[TaskService] Getting tasks for stage:', stageId);
    return this.repository.getTasksByStageId(stageId);
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    console.log('[TaskService] Getting tasks for project:', projectId);
    return this.repository.getTasksByProjectId(projectId);
  }

  async getTask(taskId: string): Promise<Task | null> {
    console.log('[TaskService] Getting task:', taskId);
    return this.repository.getTaskById(taskId);
  }

  async createTask(payload: CreateTaskPayload): Promise<Task> {
    console.log('[TaskService] Creating task:', payload.description);

    if (!payload.description.trim()) {
      throw new Error('Task description is required');
    }

    const task = await this.repository.createTask(payload);

    if (payload.assignedUsers.length > 0) {
      await this.notifyAssignedUsers(
        task.id,
        payload.assignedUsers,
        `You have been assigned to a new task: ${payload.description}`
      );
    }

    return task;
  }

  async updateTask(payload: UpdateTaskPayload): Promise<Task> {
    console.log('[TaskService] Updating task:', payload.id);
    return this.repository.updateTask(payload);
  }

  async deleteTask(taskId: string): Promise<void> {
    console.log('[TaskService] Deleting task:', taskId);
    return this.repository.deleteTask(taskId);
  }

  async completeTask(taskId: string, userId: string): Promise<Task> {
    console.log('[TaskService] Completing task:', taskId);
    return this.repository.completeTask(taskId, userId);
  }

  async pauseTask(taskId: string): Promise<Task> {
    console.log('[TaskService] Pausing task:', taskId);
    return this.repository.pauseTask(taskId);
  }

  async resumeTask(taskId: string): Promise<Task> {
    console.log('[TaskService] Resuming task:', taskId);
    return this.repository.resumeTask(taskId);
  }

  async getTaskReports(taskId: string): Promise<TaskReport[]> {
    console.log('[TaskService] Getting reports for task:', taskId);
    return this.repository.getReportsByTaskId(taskId);
  }

  async submitReport(payload: CreateTaskReportPayload): Promise<TaskReport> {
    console.log('[TaskService] Submitting report for task:', payload.taskId);

    if (!payload.comment.trim()) {
      throw new Error('Report comment is required');
    }

    return this.repository.createReport(payload);
  }

  async notifyAssignedUsers(taskId: string, userIds: string[], message: string): Promise<void> {
    console.log('[TaskService] Notifying users:', userIds);
    return this.repository.sendNotification(taskId, userIds, message);
  }

  async assignUsersToTask(taskId: string, userIds: string[]): Promise<Task> {
    console.log('[TaskService] Assigning users to task:', taskId, userIds);

    const updatedTask = await this.repository.updateTask({
      id: taskId,
      assignedUsers: userIds,
    });

    if (userIds.length > 0) {
      await this.notifyAssignedUsers(
        taskId,
        userIds,
        `You have been assigned to task: ${updatedTask.description}`
      );
    }

    return updatedTask;
  }
}

export const taskService = new TaskService();
