import { Project, CreateProjectPayload, UpdateProjectPayload, LaunchProjectPayload } from '@/types/project';

export interface IProjectRepository {
  getProjects(): Promise<Project[]>;
  getLaunchedProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
  createProject(payload: CreateProjectPayload): Promise<Project>;
  updateProject(payload: UpdateProjectPayload): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  checkDateAvailability(date: string, excludeProjectId?: string): Promise<boolean>;
  getProjectsByStatus(status: string): Promise<Project[]>;
  assignEmployees(projectId: string, employeeIds: string[]): Promise<Project>;
  launchProject(payload: LaunchProjectPayload): Promise<Project>;
}

export class ProjectRepository implements IProjectRepository {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async getProjects(): Promise<Project[]> {
    console.log('[ProjectRepository] Fetching all projects');
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[ProjectRepository] Get projects error:', error);
      throw error;
    }
  }

  async getProjectById(id: string): Promise<Project | null> {
    console.log('[ProjectRepository] Fetching project by id:', id);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects/${id}`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[ProjectRepository] Get project by id error:', error);
      throw error;
    }
  }

  async createProject(payload: CreateProjectPayload): Promise<Project> {
    console.log('[ProjectRepository] Creating project:', payload.name);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects`, {
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
      console.error('[ProjectRepository] Create project error:', error);
      throw error;
    }
  }

  async updateProject(payload: UpdateProjectPayload): Promise<Project> {
    console.log('[ProjectRepository] Updating project:', payload.id);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects/${payload.id}`, {
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
      console.error('[ProjectRepository] Update project error:', error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    console.log('[ProjectRepository] Deleting project:', id);
    
    try {
      // TODO: Replace with actual API call
      // await fetch(`${this.baseUrl}/projects/${id}`, {
      //   method: 'DELETE',
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[ProjectRepository] Delete project error:', error);
      throw error;
    }
  }

  async checkDateAvailability(date: string, excludeProjectId?: string): Promise<boolean> {
    console.log('[ProjectRepository] Checking date availability:', date);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects/check-date`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ date, excludeProjectId }),
      // });
      // const data = await response.json();
      // return data.available;

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[ProjectRepository] Check date availability error:', error);
      throw error;
    }
  }

  async getProjectsByStatus(status: string): Promise<Project[]> {
    console.log('[ProjectRepository] Fetching projects by status:', status);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects?status=${status}`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[ProjectRepository] Get projects by status error:', error);
      throw error;
    }
  }

  async assignEmployees(projectId: string, employeeIds: string[]): Promise<Project> {
    console.log('[ProjectRepository] Assigning employees to project:', projectId);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects/${projectId}/employees`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ employeeIds }),
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[ProjectRepository] Assign employees error:', error);
      throw error;
    }
  }

  async getLaunchedProjects(): Promise<Project[]> {
    console.log('[ProjectRepository] Fetching launched projects');
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects?isLaunched=true`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[ProjectRepository] Get launched projects error:', error);
      throw error;
    }
  }

  async launchProject(payload: LaunchProjectPayload): Promise<Project> {
    console.log('[ProjectRepository] Launching project:', payload.projectId);
    
    try {
      // TODO: Replace with actual API call
      // This endpoint should:
      // 1. Update project.isLaunched = true
      // 2. Set project.launchedAt = current timestamp
      // 3. Set project.launchedBy = payload.launchedBy
      // 4. Trigger notification to all assigned employees
      //
      // const response = await fetch(`${this.baseUrl}/projects/${payload.projectId}/launch`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ launchedBy: payload.launchedBy }),
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[ProjectRepository] Launch project error:', error);
      throw error;
    }
  }
}

export const projectRepository = new ProjectRepository();
