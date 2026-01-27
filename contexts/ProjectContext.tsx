import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Project, CreateProjectPayload, UpdateProjectPayload, ProjectStatus, LaunchProjectPayload } from '@/types/project';
import { projectService } from '@/services/projectService';

interface ProjectContextValue {
  projects: Project[];
  launchedProjects: Project[];
  isLoading: boolean;
  error: Error | null;
  statusFilter: ProjectStatus | 'all';
  searchQuery: string;
  filteredProjects: Project[];
  setStatusFilter: (status: ProjectStatus | 'all') => void;
  setSearchQuery: (query: string) => void;
  createProject: (payload: CreateProjectPayload) => Promise<Project>;
  updateProject: (payload: UpdateProjectPayload) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  assignEmployees: (projectId: string, employeeIds: string[]) => Promise<Project>;
  launchProject: (payload: LaunchProjectPayload) => Promise<Project>;
  getProjectById: (id: string) => Project | undefined;
  refetchProjects: () => void;
  createMutation: { isPending: boolean; error: Error | null };
  updateMutation: { isPending: boolean; error: Error | null };
  deleteMutation: { isPending: boolean; error: Error | null };
  launchMutation: { isPending: boolean; error: Error | null };
}

export const [ProjectProvider, useProjects] = createContextHook<ProjectContextValue>(() => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateProjectPayload) => projectService.createProject(payload),
    onSuccess: () => {
      console.log('[ProjectContext] Project created successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProjectPayload) => projectService.updateProject(payload),
    onSuccess: () => {
      console.log('[ProjectContext] Project updated successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      console.log('[ProjectContext] Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const assignEmployeesMutation = useMutation({
    mutationFn: ({ projectId, employeeIds }: { projectId: string; employeeIds: string[] }) =>
      projectService.assignEmployees(projectId, employeeIds),
    onSuccess: () => {
      console.log('[ProjectContext] Employees assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const launchMutation = useMutation({
    mutationFn: (payload: LaunchProjectPayload) => projectService.launchProject(payload),
    onSuccess: () => {
      console.log('[ProjectContext] Project launched successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const projects = projectsQuery.data ?? [];

  const filteredProjects = useMemo(() => {
    let result = projects;
    result = projectService.filterProjectsByStatus(result, statusFilter);
    result = projectService.searchProjects(result, searchQuery);
    return result;
  }, [projects, statusFilter, searchQuery]);

  const launchedProjects = useMemo(() => {
    return projectService.filterLaunchedProjects(projects);
  }, [projects]);

  const createProject = useCallback(async (payload: CreateProjectPayload): Promise<Project> => {
    return createMutation.mutateAsync(payload);
  }, [createMutation]);

  const updateProject = useCallback(async (payload: UpdateProjectPayload): Promise<Project> => {
    return updateMutation.mutateAsync(payload);
  }, [updateMutation]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const assignEmployees = useCallback(async (projectId: string, employeeIds: string[]): Promise<Project> => {
    return assignEmployeesMutation.mutateAsync({ projectId, employeeIds });
  }, [assignEmployeesMutation]);

  const launchProject = useCallback(async (payload: LaunchProjectPayload): Promise<Project> => {
    console.log('[ProjectContext] Launching project:', payload.projectId);
    return launchMutation.mutateAsync(payload);
  }, [launchMutation]);

  const getProjectById = useCallback((id: string): Project | undefined => {
    return projects.find(p => p.id === id);
  }, [projects]);

  const refetchProjects = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  }, [queryClient]);

  return {
    projects,
    launchedProjects,
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    statusFilter,
    searchQuery,
    filteredProjects,
    setStatusFilter,
    setSearchQuery,
    createProject,
    updateProject,
    deleteProject,
    assignEmployees,
    launchProject,
    getProjectById,
    refetchProjects,
    createMutation: { isPending: createMutation.isPending, error: createMutation.error },
    updateMutation: { isPending: updateMutation.isPending, error: updateMutation.error },
    deleteMutation: { isPending: deleteMutation.isPending, error: deleteMutation.error },
    launchMutation: { isPending: launchMutation.isPending, error: launchMutation.error },
  };
});

export function useProjectCounts() {
  const { projects } = useProjects();
  
  return useMemo(() => ({
    total: projects.length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    paused: projects.filter(p => p.status === 'paused').length,
    completed: projects.filter(p => p.status === 'completed').length,
  }), [projects]);
}
