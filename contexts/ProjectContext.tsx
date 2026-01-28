import { useState, useCallback, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Project, CreateProjectPayload, UpdateProjectPayload, ProjectStatus, LaunchProjectPayload } from '@/types/project';
import { projectService } from '@/services/projectService';
import { debounce } from '@/utils/performance';

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
  const mutationLockRef = useRef<Set<string>>(new Set());
  const pendingOperationsRef = useRef<Map<string, Promise<any>>>(new Map());

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
    retry: false,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      const lockKey = `create_${payload.name}_${payload.date}`;
      if (mutationLockRef.current.has(lockKey)) {
        console.log('[ProjectContext] Duplicate create request blocked');
        throw new Error('Operation already in progress');
      }
      mutationLockRef.current.add(lockKey);
      try {
        return await projectService.createProject(payload);
      } finally {
        mutationLockRef.current.delete(lockKey);
      }
    },
    onSuccess: () => {
      console.log('[ProjectContext] Project created successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateProjectPayload) => {
      const lockKey = `update_${payload.id}`;
      if (mutationLockRef.current.has(lockKey)) {
        console.log('[ProjectContext] Duplicate update request blocked');
        throw new Error('Operation already in progress');
      }
      mutationLockRef.current.add(lockKey);
      try {
        return await projectService.updateProject(payload);
      } finally {
        mutationLockRef.current.delete(lockKey);
      }
    },
    onSuccess: () => {
      console.log('[ProjectContext] Project updated successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const lockKey = `delete_${id}`;
      if (mutationLockRef.current.has(lockKey)) {
        console.log('[ProjectContext] Duplicate delete request blocked');
        throw new Error('Operation already in progress');
      }
      mutationLockRef.current.add(lockKey);
      try {
        return await projectService.deleteProject(id);
      } finally {
        mutationLockRef.current.delete(lockKey);
      }
    },
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
    mutationFn: async (payload: LaunchProjectPayload) => {
      const lockKey = `launch_${payload.projectId}`;
      if (mutationLockRef.current.has(lockKey)) {
        console.log('[ProjectContext] Duplicate launch request blocked');
        throw new Error('Operation already in progress');
      }
      mutationLockRef.current.add(lockKey);
      try {
        return await projectService.launchProject(payload);
      } finally {
        mutationLockRef.current.delete(lockKey);
      }
    },
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

  const debouncedInvalidate = useMemo(
    () => debounce(() => queryClient.invalidateQueries({ queryKey: ['projects'] }), 300),
    [queryClient]
  );

  const refetchProjects = useCallback(() => {
    debouncedInvalidate();
  }, [debouncedInvalidate]);

  const debouncedSetSearchQuery = useMemo(
    () => debounce((query: string) => setSearchQuery(query), 200),
    []
  );

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
