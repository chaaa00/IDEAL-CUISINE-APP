import { 
  Workflow, 
  WorkflowStage,
  CreateWorkflowStagePayload, 
  UpdateWorkflowStagePayload,
  ReorderWorkflowPayload 
} from '@/types/project';
import { workflowRepository, IWorkflowRepository } from './workflowRepository';

export interface IWorkflowService {
  getWorkflow(projectId: string): Promise<Workflow | null>;
  initializeWorkflow(projectId: string): Promise<Workflow>;
  addStage(projectId: string, payload: CreateWorkflowStagePayload): Promise<Workflow>;
  updateStage(projectId: string, payload: UpdateWorkflowStagePayload): Promise<Workflow>;
  removeStage(projectId: string, stageId: string): Promise<Workflow>;
  reorderStages(projectId: string, stageIds: string[]): Promise<Workflow>;
  markStageComplete(projectId: string, stageId: string, userId: string): Promise<Workflow>;
  getWorkflowProgress(workflow: Workflow): { completed: number; total: number; percentage: number };
  getNextIncompleteStage(workflow: Workflow): WorkflowStage | null;
}

class WorkflowService implements IWorkflowService {
  private repository: IWorkflowRepository;

  constructor(repository: IWorkflowRepository) {
    this.repository = repository;
  }

  async getWorkflow(projectId: string): Promise<Workflow | null> {
    console.log('[WorkflowService] Getting workflow for project:', projectId);
    return this.repository.getWorkflowByProjectId(projectId);
  }

  async initializeWorkflow(projectId: string): Promise<Workflow> {
    console.log('[WorkflowService] Initializing workflow for project:', projectId);
    return this.repository.createWorkflow(projectId);
  }

  async addStage(projectId: string, payload: CreateWorkflowStagePayload): Promise<Workflow> {
    console.log('[WorkflowService] Adding stage:', payload.name);
    
    if (!payload.name.trim()) {
      throw new Error('Stage name is required');
    }

    return this.repository.addStage(projectId, {
      name: payload.name.trim(),
      description: payload.description?.trim(),
    });
  }

  async updateStage(projectId: string, payload: UpdateWorkflowStagePayload): Promise<Workflow> {
    console.log('[WorkflowService] Updating stage:', payload.id);
    
    if (payload.name !== undefined && !payload.name.trim()) {
      throw new Error('Stage name cannot be empty');
    }

    return this.repository.updateStage(projectId, {
      ...payload,
      name: payload.name?.trim(),
      description: payload.description?.trim(),
    });
  }

  async removeStage(projectId: string, stageId: string): Promise<Workflow> {
    console.log('[WorkflowService] Removing stage:', stageId);
    return this.repository.deleteStage(projectId, stageId);
  }

  async reorderStages(projectId: string, stageIds: string[]): Promise<Workflow> {
    console.log('[WorkflowService] Reordering stages for project:', projectId);
    
    const payload: ReorderWorkflowPayload = {
      projectId,
      stageIds,
    };

    return this.repository.reorderStages(payload);
  }

  async markStageComplete(projectId: string, stageId: string, userId: string): Promise<Workflow> {
    console.log('[WorkflowService] Marking stage complete:', stageId);
    return this.repository.completeStage(projectId, stageId, userId);
  }

  getWorkflowProgress(workflow: Workflow): { completed: number; total: number; percentage: number } {
    const total = workflow.stages.length;
    const completed = workflow.stages.filter(s => s.isCompleted).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }

  getNextIncompleteStage(workflow: Workflow): WorkflowStage | null {
    const sortedStages = [...workflow.stages].sort((a, b) => a.order - b.order);
    return sortedStages.find(s => !s.isCompleted) || null;
  }
}

export const workflowService = new WorkflowService(workflowRepository);
