import { Project, CreateProjectPayload, UpdateProjectPayload, ProjectStatus, LaunchProjectPayload } from '@/types/project';
import { projectRepository, IProjectRepository } from './projectRepository';

export interface IProjectService {
  getProjects(): Promise<Project[]>;
  getLaunchedProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
  createProject(payload: CreateProjectPayload): Promise<Project>;
  updateProject(payload: UpdateProjectPayload): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  validateProjectDate(date: string, excludeProjectId?: string): Promise<{ valid: boolean; message?: string }>;
  filterProjectsByStatus(projects: Project[], status: ProjectStatus | 'all'): Project[];
  filterLaunchedProjects(projects: Project[]): Project[];
  searchProjects(projects: Project[], query: string): Project[];
  assignEmployees(projectId: string, employeeIds: string[]): Promise<Project>;
  launchProject(payload: LaunchProjectPayload): Promise<Project>;
  openGoogleMapsNavigation(latitude: number, longitude: number): void;
}

class ProjectService implements IProjectService {
  private repository: IProjectRepository;

  constructor(repository: IProjectRepository) {
    this.repository = repository;
  }

  async getProjects(): Promise<Project[]> {
    console.log('[ProjectService] Getting all projects');
    return this.repository.getProjects();
  }

  async getProjectById(id: string): Promise<Project | null> {
    console.log('[ProjectService] Getting project by id:', id);
    return this.repository.getProjectById(id);
  }

  async createProject(payload: CreateProjectPayload): Promise<Project> {
    console.log('[ProjectService] Creating project:', payload.name);
    
    const validation = await this.validateProjectDate(payload.date);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return this.repository.createProject(payload);
  }

  async updateProject(payload: UpdateProjectPayload): Promise<Project> {
    console.log('[ProjectService] Updating project:', payload.id);
    
    if (payload.date) {
      const validation = await this.validateProjectDate(payload.date, payload.id);
      if (!validation.valid) {
        throw new Error(validation.message);
      }
    }

    return this.repository.updateProject(payload);
  }

  async deleteProject(id: string): Promise<void> {
    console.log('[ProjectService] Deleting project:', id);
    return this.repository.deleteProject(id);
  }

  async validateProjectDate(date: string, excludeProjectId?: string): Promise<{ valid: boolean; message?: string }> {
    console.log('[ProjectService] Validating project date:', date);
    
    try {
      const isAvailable = await this.repository.checkDateAvailability(date, excludeProjectId);
      
      if (!isAvailable) {
        return {
          valid: false,
          message: 'A project already exists on this date. Please choose a different date.',
        };
      }
      
      return { valid: true };
    } catch (error) {
      console.error('[ProjectService] Date validation error:', error);
      return { valid: true };
    }
  }

  filterProjectsByStatus(projects: Project[], status: ProjectStatus | 'all'): Project[] {
    console.log('[ProjectService] Filtering projects by status:', status);
    
    if (status === 'all') {
      return projects;
    }
    
    return projects.filter(project => project.status === status);
  }

  searchProjects(projects: Project[], query: string): Project[] {
    console.log('[ProjectService] Searching projects:', query);
    
    if (!query.trim()) {
      return projects;
    }
    
    const lowerQuery = query.toLowerCase();
    return projects.filter(project =>
      project.name.toLowerCase().includes(lowerQuery) ||
      project.projectNumber.toLowerCase().includes(lowerQuery)
    );
  }

  async assignEmployees(projectId: string, employeeIds: string[]): Promise<Project> {
    console.log('[ProjectService] Assigning employees to project:', projectId);
    return this.repository.assignEmployees(projectId, employeeIds);
  }

  async getLaunchedProjects(): Promise<Project[]> {
    console.log('[ProjectService] Getting launched projects');
    return this.repository.getLaunchedProjects();
  }

  async launchProject(payload: LaunchProjectPayload): Promise<Project> {
    console.log('[ProjectService] Launching project:', payload.projectId);
    return this.repository.launchProject(payload);
  }

  filterLaunchedProjects(projects: Project[]): Project[] {
    console.log('[ProjectService] Filtering launched projects');
    return projects.filter(project => project.isLaunched);
  }

  openGoogleMapsNavigation(latitude: number, longitude: number): void {
    console.log('[ProjectService] Opening Google Maps navigation:', latitude, longitude);
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }
}

export const projectService = new ProjectService(projectRepository);
