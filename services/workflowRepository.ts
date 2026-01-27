import { 
  Workflow, 
  WorkflowStage, 
  CreateWorkflowStagePayload, 
  UpdateWorkflowStagePayload,
  ReorderWorkflowPayload 
} from '@/types/project';

export interface IWorkflowRepository {
  getWorkflowByProjectId(projectId: string): Promise<Workflow | null>;
  createWorkflow(projectId: string): Promise<Workflow>;
  addStage(projectId: string, payload: CreateWorkflowStagePayload): Promise<Workflow>;
  updateStage(projectId: string, payload: UpdateWorkflowStagePayload): Promise<Workflow>;
  deleteStage(projectId: string, stageId: string): Promise<Workflow>;
  reorderStages(payload: ReorderWorkflowPayload): Promise<Workflow>;
  completeStage(projectId: string, stageId: string, userId: string): Promise<Workflow>;
}

export class WorkflowRepository implements IWorkflowRepository {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async getWorkflowByProjectId(projectId: string): Promise<Workflow | null> {
    console.log('[WorkflowRepository] Fetching workflow for project:', projectId);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects/${projectId}/workflow`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // if (response.status === 404) return null;
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[WorkflowRepository] Get workflow error:', error);
      throw error;
    }
  }

  async createWorkflow(projectId: string): Promise<Workflow> {
    console.log('[WorkflowRepository] Creating workflow for project:', projectId);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects/${projectId}/workflow`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[WorkflowRepository] Create workflow error:', error);
      throw error;
    }
  }

  async addStage(projectId: string, payload: CreateWorkflowStagePayload): Promise<Workflow> {
    console.log('[WorkflowRepository] Adding stage to workflow:', projectId, payload.name);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects/${projectId}/workflow/stages`, {
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
      console.error('[WorkflowRepository] Add stage error:', error);
      throw error;
    }
  }

  async updateStage(projectId: string, payload: UpdateWorkflowStagePayload): Promise<Workflow> {
    console.log('[WorkflowRepository] Updating stage:', payload.id);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects/${projectId}/workflow/stages/${payload.id}`, {
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
      console.error('[WorkflowRepository] Update stage error:', error);
      throw error;
    }
  }

  async deleteStage(projectId: string, stageId: string): Promise<Workflow> {
    console.log('[WorkflowRepository] Deleting stage:', stageId);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects/${projectId}/workflow/stages/${stageId}`, {
      //   method: 'DELETE',
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[WorkflowRepository] Delete stage error:', error);
      throw error;
    }
  }

  async reorderStages(payload: ReorderWorkflowPayload): Promise<Workflow> {
    console.log('[WorkflowRepository] Reordering stages for project:', payload.projectId);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects/${payload.projectId}/workflow/reorder`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ stageIds: payload.stageIds }),
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[WorkflowRepository] Reorder stages error:', error);
      throw error;
    }
  }

  async completeStage(projectId: string, stageId: string, userId: string): Promise<Workflow> {
    console.log('[WorkflowRepository] Completing stage:', stageId);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/projects/${projectId}/workflow/stages/${stageId}/complete`, {
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
      console.error('[WorkflowRepository] Complete stage error:', error);
      throw error;
    }
  }
}

export const workflowRepository = new WorkflowRepository();
