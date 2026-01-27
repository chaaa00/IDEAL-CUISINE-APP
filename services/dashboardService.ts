import { Task, TaskStatus } from '@/types/task';
import { User } from '@/types/auth';
import { taskService } from './taskService';
import { userService } from './userService';

export interface EmployeeStats {
  userId: string;
  userName: string;
  userRole: string;
  completed: number;
  pending: number;
  paused: number;
  total: number;
  completionRate: number;
  recentTasks: Task[];
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  pausedTasks: number;
  completionRate: number;
  employeeStats: EmployeeStats[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'task_completed' | 'task_created' | 'task_assigned' | 'report_submitted';
  description: string;
  userName: string;
  timestamp: string;
  taskId?: string;
}

export interface IDashboardRepository {
  getDashboardStats(): Promise<DashboardStats>;
  getEmployeeStats(): Promise<EmployeeStats[]>;
  getRecentActivity(limit?: number): Promise<ActivityItem[]>;
}

export class DashboardRepository implements IDashboardRepository {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    console.log('[DashboardRepository] Fetching dashboard stats');

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/dashboard/stats`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[DashboardRepository] Get dashboard stats error:', error);
      throw error;
    }
  }

  async getEmployeeStats(): Promise<EmployeeStats[]> {
    console.log('[DashboardRepository] Fetching employee stats');

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/dashboard/employees`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[DashboardRepository] Get employee stats error:', error);
      throw error;
    }
  }

  async getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
    console.log('[DashboardRepository] Fetching recent activity');

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/dashboard/activity?limit=${limit}`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[DashboardRepository] Get recent activity error:', error);
      throw error;
    }
  }
}

export class DashboardService {
  private repository: IDashboardRepository;

  constructor(repository: IDashboardRepository = new DashboardRepository()) {
    this.repository = repository;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    console.log('[DashboardService] Getting dashboard stats');
    return this.repository.getDashboardStats();
  }

  async getEmployeeStats(): Promise<EmployeeStats[]> {
    console.log('[DashboardService] Getting employee stats');
    return this.repository.getEmployeeStats();
  }

  async getRecentActivity(limit?: number): Promise<ActivityItem[]> {
    console.log('[DashboardService] Getting recent activity');
    return this.repository.getRecentActivity(limit);
  }
}

export const dashboardRepository = new DashboardRepository();
export const dashboardService = new DashboardService();
