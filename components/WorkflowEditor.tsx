import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
  Alert,
  Modal,
} from 'react-native';
import {
  Plus,
  ChevronDown,
  GripVertical,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronUp,
  Circle,
  CheckCircle2,
  ListTodo,
} from 'lucide-react-native';
import { WorkflowStage, CreateWorkflowStagePayload, UpdateWorkflowStagePayload } from '@/types/project';
import { Task, CreateTaskPayload } from '@/types/task';
import { User } from '@/types/auth';
import { PermissionGate } from './PermissionGate';
import TaskManager from './TaskManager';

interface WorkflowEditorProps {
  stages: WorkflowStage[];
  projectId: string;
  tasks: Record<string, Task[]>;
  availableUsers: User[];
  currentUser: User | null;
  onAddStage: (payload: CreateWorkflowStagePayload) => Promise<void>;
  onUpdateStage: (payload: UpdateWorkflowStagePayload) => Promise<void>;
  onDeleteStage: (stageId: string) => Promise<void>;
  onReorderStages: (stageIds: string[]) => Promise<void>;
  onCompleteStage?: (stageId: string) => Promise<void>;
  onCreateTask: (payload: CreateTaskPayload) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onCompleteTask: (taskId: string) => Promise<void>;
  onPauseTask: (taskId: string) => Promise<void>;
  onResumeTask: (taskId: string) => Promise<void>;
  onSubmitReport: (taskId: string, comment: string, photoUrl?: string) => Promise<void>;
  isLoading?: boolean;
  canEdit?: boolean;
}

interface StageCardProps {
  stage: WorkflowStage;
  index: number;
  totalStages: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onComplete?: () => void;
  onToggleExpand: () => void;
  isExpanded: boolean;
  canEdit: boolean;
  tasks: Task[];
  projectId: string;
  availableUsers: User[];
  currentUser: User | null;
  onCreateTask: (payload: CreateTaskPayload) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onCompleteTask: (taskId: string) => Promise<void>;
  onPauseTask: (taskId: string) => Promise<void>;
  onResumeTask: (taskId: string) => Promise<void>;
  onSubmitReport: (taskId: string, comment: string, photoUrl?: string) => Promise<void>;
}

function StageCard({
  stage,
  index,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onComplete,
  onToggleExpand,
  isExpanded,
  canEdit,
  tasks,
  projectId,
  availableUsers,
  currentUser,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onCompleteTask,
  onPauseTask,
  onResumeTask,
  onSubmitReport,
}: StageCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <View style={styles.stageWrapper}>
      <Animated.View
        style={[
          styles.stageCard,
          stage.isCompleted && styles.stageCardCompleted,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <TouchableOpacity
          style={styles.stageHeader}
          onPress={onToggleExpand}
          activeOpacity={0.9}
        >
          <View style={styles.stageLeft}>
            <View style={[styles.stageNumber, stage.isCompleted && styles.stageNumberCompleted]}>
              {stage.isCompleted ? (
                <CheckCircle2 size={18} color="#fff" />
              ) : (
                <Text style={styles.stageNumberText}>{index + 1}</Text>
              )}
            </View>
            <View style={styles.stageInfo}>
              <Text style={[styles.stageName, stage.isCompleted && styles.stageNameCompleted]}>
                {stage.name}
              </Text>
              {stage.description && (
                <Text style={styles.stageDescription}>{stage.description}</Text>
              )}
              {stage.isCompleted && stage.completedAt && (
                <Text style={styles.completedText}>
                  Completed {new Date(stage.completedAt).toLocaleDateString()}
                </Text>
              )}
              {tasks.length > 0 && (
                <View style={styles.tasksBadge}>
                  <ListTodo size={12} color="#888" />
                  <Text style={styles.tasksBadgeText}>
                    {completedTasksCount}/{tasks.length} tasks
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.stageRightSection}>
            {canEdit && (
              <View style={styles.stageActions}>
                <View style={styles.reorderButtons}>
                  <TouchableOpacity
                    style={[styles.reorderButton, isFirst && styles.reorderButtonDisabled]}
                    onPress={onMoveUp}
                    disabled={isFirst}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <ChevronUp size={18} color={isFirst ? '#ccc' : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reorderButton, isLast && styles.reorderButtonDisabled]}
                    onPress={onMoveDown}
                    disabled={isLast}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <ChevronDown size={18} color={isLast ? '#ccc' : '#666'} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onEdit}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Edit2 size={16} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onDelete}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={16} color="#E53935" />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.expandIndicator}>
              {isExpanded ? (
                <ChevronUp size={20} color="#888" />
              ) : (
                <ChevronDown size={20} color="#888" />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {!stage.isCompleted && onComplete && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={onComplete}
            activeOpacity={0.8}
          >
            <Check size={16} color="#43A047" />
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        )}

        {isExpanded && (
          <TaskManager
            stageId={stage.id}
            projectId={projectId}
            tasks={tasks}
            availableUsers={availableUsers}
            currentUser={currentUser}
            onCreateTask={onCreateTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onCompleteTask={onCompleteTask}
            onPauseTask={onPauseTask}
            onResumeTask={onResumeTask}
            onSubmitReport={onSubmitReport}
            canEdit={canEdit}
          />
        )}
      </Animated.View>

      {!isLast && (
        <View style={styles.arrowContainer}>
          <View style={styles.arrowLine} />
          <ChevronDown size={20} color="#ccc" style={styles.arrowIcon} />
        </View>
      )}
    </View>
  );
}

interface StageModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
  initialName?: string;
  initialDescription?: string;
  isEditing?: boolean;
  isLoading?: boolean;
}

function StageModal({
  visible,
  onClose,
  onSubmit,
  initialName = '',
  initialDescription = '',
  isEditing = false,
  isLoading = false,
}: StageModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  React.useEffect(() => {
    if (visible) {
      setName(initialName);
      setDescription(initialDescription);
    }
  }, [visible, initialName, initialDescription]);

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Stage name is required');
      return;
    }
    onSubmit(name.trim(), description.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Stage' : 'Add Stage'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Stage Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter stage name"
                placeholderTextColor="#999"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter stage description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Stage'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function WorkflowEditor({
  stages,
  projectId,
  tasks,
  availableUsers,
  currentUser,
  onAddStage,
  onUpdateStage,
  onDeleteStage,
  onReorderStages,
  onCompleteStage,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onCompleteTask,
  onPauseTask,
  onResumeTask,
  onSubmitReport,
  isLoading = false,
  canEdit = true,
}: WorkflowEditorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStage, setEditingStage] = useState<WorkflowStage | null>(null);
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const handleAddStage = useCallback(async (name: string, description: string) => {
    setIsSubmitting(true);
    try {
      await onAddStage({ name, description: description || undefined });
      setIsModalVisible(false);
    } catch (error) {
      console.error('[WorkflowEditor] Add stage error:', error);
      Alert.alert('Error', 'Failed to add stage');
    } finally {
      setIsSubmitting(false);
    }
  }, [onAddStage]);

  const handleUpdateStage = useCallback(async (name: string, description: string) => {
    if (!editingStage) return;

    setIsSubmitting(true);
    try {
      await onUpdateStage({
        id: editingStage.id,
        name,
        description: description || undefined,
      });
      setEditingStage(null);
    } catch (error) {
      console.error('[WorkflowEditor] Update stage error:', error);
      Alert.alert('Error', 'Failed to update stage');
    } finally {
      setIsSubmitting(false);
    }
  }, [editingStage, onUpdateStage]);

  const handleDeleteStage = useCallback((stage: WorkflowStage) => {
    Alert.alert(
      'Delete Stage',
      `Are you sure you want to delete "${stage.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteStage(stage.id);
            } catch (error) {
              console.error('[WorkflowEditor] Delete stage error:', error);
              Alert.alert('Error', 'Failed to delete stage');
            }
          },
        },
      ]
    );
  }, [onDeleteStage]);

  const handleMoveStage = useCallback(async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sortedStages.length) return;

    const newOrder = [...sortedStages];
    const [movedStage] = newOrder.splice(index, 1);
    newOrder.splice(newIndex, 0, movedStage);

    try {
      await onReorderStages(newOrder.map(s => s.id));
    } catch (error) {
      console.error('[WorkflowEditor] Reorder stages error:', error);
      Alert.alert('Error', 'Failed to reorder stages');
    }
  }, [sortedStages, onReorderStages]);

  const handleCompleteStage = useCallback(async (stageId: string) => {
    if (!onCompleteStage) return;
    
    try {
      await onCompleteStage(stageId);
    } catch (error) {
      console.error('[WorkflowEditor] Complete stage error:', error);
      Alert.alert('Error', 'Failed to complete stage');
    }
  }, [onCompleteStage]);

  const completedCount = sortedStages.filter(s => s.isCompleted).length;
  const progressPercentage = sortedStages.length > 0 
    ? Math.round((completedCount / sortedStages.length) * 100) 
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Workflow</Text>
          {sortedStages.length > 0 && (
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>
                {completedCount}/{sortedStages.length} ({progressPercentage}%)
              </Text>
            </View>
          )}
        </View>
        
        {canEdit && (
          <PermissionGate permission="edit_projects">
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsModalVisible(true)}
              activeOpacity={0.8}
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.addButtonText}>Add Stage</Text>
            </TouchableOpacity>
          </PermissionGate>
        )}
      </View>

      {sortedStages.length > 0 && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
      )}

      <ScrollView 
        style={styles.stagesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.stagesListContent}
      >
        {sortedStages.length === 0 ? (
          <View style={styles.emptyState}>
            <Circle size={48} color="#ddd" />
            <Text style={styles.emptyStateTitle}>No stages yet</Text>
            <Text style={styles.emptyStateText}>
              Add stages to define your project workflow
            </Text>
          </View>
        ) : (
          sortedStages.map((stage, index) => (
            <StageCard
              key={stage.id}
              stage={stage}
              index={index}
              totalStages={sortedStages.length}
              isFirst={index === 0}
              isLast={index === sortedStages.length - 1}
              onEdit={() => setEditingStage(stage)}
              onDelete={() => handleDeleteStage(stage)}
              onMoveUp={() => handleMoveStage(index, 'up')}
              onMoveDown={() => handleMoveStage(index, 'down')}
              onComplete={onCompleteStage ? () => handleCompleteStage(stage.id) : undefined}
              onToggleExpand={() => setExpandedStageId(expandedStageId === stage.id ? null : stage.id)}
              isExpanded={expandedStageId === stage.id}
              canEdit={canEdit}
              tasks={tasks[stage.id] || []}
              projectId={projectId}
              availableUsers={availableUsers}
              currentUser={currentUser}
              onCreateTask={onCreateTask}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onCompleteTask={onCompleteTask}
              onPauseTask={onPauseTask}
              onResumeTask={onResumeTask}
              onSubmitReport={onSubmitReport}
            />
          ))
        )}
      </ScrollView>

      <StageModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleAddStage}
        isLoading={isSubmitting}
      />

      <StageModal
        visible={editingStage !== null}
        onClose={() => setEditingStage(null)}
        onSubmit={handleUpdateStage}
        initialName={editingStage?.name}
        initialDescription={editingStage?.description}
        isEditing
        isLoading={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#43A047',
    borderRadius: 2,
  },
  stagesList: {
    flex: 1,
  },
  stagesListContent: {
    paddingBottom: 20,
  },
  stageWrapper: {
    alignItems: 'center',
  },
  stageCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    width: '100%',
  },
  stageCardCompleted: {
    backgroundColor: '#f8fff8',
    borderColor: '#e0f0e0',
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stageLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  stageNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageNumberCompleted: {
    backgroundColor: '#43A047',
  },
  stageNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  stageInfo: {
    flex: 1,
  },
  stageName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 4,
  },
  stageNameCompleted: {
    color: '#43A047',
  },
  stageDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  completedText: {
    fontSize: 12,
    color: '#43A047',
    marginTop: 4,
  },
  stageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  expandIndicator: {
    padding: 4,
  },
  tasksBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  tasksBadgeText: {
    fontSize: 12,
    color: '#888',
  },
  reorderButtons: {
    flexDirection: 'column',
    gap: 2,
  },
  reorderButton: {
    padding: 4,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#f0fff0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  completeButtonText: {
    color: '#43A047',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  arrowContainer: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
  },
  arrowLine: {
    width: 2,
    height: 16,
    backgroundColor: '#e0e0e0',
  },
  arrowIcon: {
    marginTop: -4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
