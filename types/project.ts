export type ProjectStatus = 'in_progress' | 'paused' | 'completed';

export interface WorkflowStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface Workflow {
  id: string;
  projectId: string;
  stages: WorkflowStage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowStagePayload {
  name: string;
  description?: string;
}

export interface UpdateWorkflowStagePayload {
  id: string;
  name?: string;
  description?: string;
  isCompleted?: boolean;
}

export interface ReorderWorkflowPayload {
  projectId: string;
  stageIds: string[];
}

export interface ProjectLocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface Project {
  id: string;
  name: string;
  projectNumber: string;
  location: ProjectLocation;
  date: string;
  status: ProjectStatus;
  assignedEmployees: string[];
  isLaunched: boolean;
  launchedAt?: string;
  launchedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  projectNumber: string;
  location: ProjectLocation;
  date: string;
  status: ProjectStatus;
  assignedEmployees?: string[];
  isLaunched?: boolean;
}

export interface UpdateProjectPayload {
  id: string;
  name?: string;
  projectNumber?: string;
  location?: ProjectLocation;
  date?: string;
  status?: ProjectStatus;
  assignedEmployees?: string[];
  isLaunched?: boolean;
  launchedAt?: string;
  launchedBy?: string;
}

export interface LaunchProjectPayload {
  projectId: string;
  launchedBy: string;
}

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  in_progress: { label: 'In Progress', color: '#E53935' },
  paused: { label: 'Paused', color: '#FDD835' },
  completed: { label: 'Completed', color: '#43A047' },
};

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];
