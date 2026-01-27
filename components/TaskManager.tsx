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
  Platform,
} from 'react-native';
import {
  Plus,
  Pause,
  Check,
  X,
  Camera,
  Send,
  MessageSquare,
  Users,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  Play,
} from 'lucide-react-native';
import { Task, TaskReport, TaskStatus, CreateTaskPayload, TASK_STATUS_CONFIG } from '@/types/task';
import { User } from '@/types/auth';
import { PermissionGate } from './PermissionGate';

interface TaskManagerProps {
  stageId: string;
  projectId: string;
  tasks: Task[];
  availableUsers: User[];
  currentUser: User | null;
  onCreateTask: (payload: CreateTaskPayload) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onCompleteTask: (taskId: string) => Promise<void>;
  onPauseTask: (taskId: string) => Promise<void>;
  onResumeTask: (taskId: string) => Promise<void>;
  onSubmitReport: (taskId: string, comment: string, photoUrl?: string) => Promise<void>;
  onTakePhoto?: () => Promise<string | null>;
  canEdit?: boolean;
  isLoading?: boolean;
}

interface TaskRowProps {
  task: Task;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onComplete: () => void;
  onPause: () => void;
  onResume: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
}

function TaskRow({
  task,
  index,
  isExpanded,
  onToggleExpand,
  onComplete,
  onPause,
  onResume,
  onEdit,
  onDelete,
  canEdit,
}: TaskRowProps) {
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

  const isCompleted = task.status === 'completed';
  const isPaused = task.status === 'paused';

  return (
    <Animated.View style={[styles.taskRow, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.taskMain}
        onPress={onToggleExpand}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={[styles.taskNumber, isCompleted && styles.taskNumberCompleted]}>
          <Text style={styles.taskNumberText}>{task.taskNumber}</Text>
        </View>

        <View style={styles.taskContent}>
          <Text
            style={[styles.taskDescription, isCompleted && styles.taskDescriptionCompleted]}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {task.description}
          </Text>
          {task.assignedUsers.length > 0 && (
            <View style={styles.assignedBadge}>
              <Users size={12} color="#888" />
              <Text style={styles.assignedText}>{task.assignedUsers.length} assigned</Text>
            </View>
          )}
        </View>

        <View style={styles.taskActions}>
          {!isCompleted && (
            <TouchableOpacity
              style={[styles.pauseButton, isPaused && styles.pauseButtonActive]}
              onPress={isPaused ? onResume : onPause}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isPaused ? (
                <Play size={16} color="#FDD835" fill="#FDD835" />
              ) : (
                <Pause size={16} color="#FDD835" />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.checkboxButton, isCompleted && styles.checkboxButtonCompleted]}
            onPress={isCompleted ? undefined : onComplete}
            disabled={isCompleted}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isCompleted ? (
              <Check size={18} color="#fff" strokeWidth={3} />
            ) : (
              <View style={styles.checkboxEmpty} />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {isExpanded && canEdit && (
        <View style={styles.taskExpandedActions}>
          <TouchableOpacity style={styles.expandedAction} onPress={onEdit}>
            <Edit2 size={14} color="#666" />
            <Text style={styles.expandedActionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.expandedAction} onPress={onDelete}>
            <Trash2 size={14} color="#E53935" />
            <Text style={[styles.expandedActionText, { color: '#E53935' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (description: string, assignedUsers: string[]) => void;
  availableUsers: User[];
  initialDescription?: string;
  initialAssignedUsers?: string[];
  isEditing?: boolean;
  isLoading?: boolean;
}

function TaskFormModal({
  visible,
  onClose,
  onSubmit,
  availableUsers,
  initialDescription = '',
  initialAssignedUsers = [],
  isEditing = false,
  isLoading = false,
}: TaskFormModalProps) {
  const [description, setDescription] = useState(initialDescription);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(initialAssignedUsers);
  const [showUserPicker, setShowUserPicker] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setDescription(initialDescription);
      setSelectedUsers(initialAssignedUsers);
    }
  }, [visible, initialDescription, initialAssignedUsers]);

  const handleSubmit = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Task description is required');
      return;
    }
    onSubmit(description.trim(), selectedUsers);
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Task' : 'New Task'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter task description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Assign Users</Text>
              <TouchableOpacity
                style={styles.userPickerButton}
                onPress={() => setShowUserPicker(!showUserPicker)}
              >
                <Text style={styles.userPickerButtonText}>
                  {selectedUsers.length > 0
                    ? `${selectedUsers.length} user(s) selected`
                    : 'Select users to assign'}
                </Text>
                {showUserPicker ? (
                  <ChevronUp size={20} color="#666" />
                ) : (
                  <ChevronDown size={20} color="#666" />
                )}
              </TouchableOpacity>

              {showUserPicker && (
                <View style={styles.userPickerList}>
                  {availableUsers.length === 0 ? (
                    <Text style={styles.noUsersText}>No users available</Text>
                  ) : (
                    availableUsers.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={[
                          styles.userPickerItem,
                          selectedUsers.includes(user.id) && styles.userPickerItemSelected,
                        ]}
                        onPress={() => toggleUser(user.id)}
                      >
                        <View style={styles.userPickerItemContent}>
                          <Text style={styles.userPickerItemName}>{user.name}</Text>
                          <Text style={styles.userPickerItemRole}>{user.role}</Text>
                        </View>
                        {selectedUsers.includes(user.id) && <Check size={18} color="#43A047" />}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isLoading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Task'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface ReportModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSubmit: (comment: string, photoUrl?: string) => void;
  onTakePhoto?: () => Promise<string | null>;
  isLoading?: boolean;
}

function ReportModal({
  visible,
  task,
  onClose,
  onSubmit,
  onTakePhoto,
  isLoading = false,
}: ReportModalProps) {
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setComment('');
      setPhotoUrl(null);
    }
  }, [visible]);

  const handleTakePhoto = async () => {
    if (onTakePhoto) {
      const url = await onTakePhoto();
      if (url) {
        setPhotoUrl(url);
      }
    } else {
      Alert.alert('Photo', 'Photo capture will be available when connected to external storage.');
    }
  };

  const handleSubmit = () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }
    onSubmit(comment.trim(), photoUrl ?? undefined);
  };

  if (!task) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Report</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.reportTaskInfo}>
            <View style={styles.reportTaskNumber}>
              <Text style={styles.reportTaskNumberText}>{task.taskNumber}</Text>
            </View>
            <Text style={styles.reportTaskDescription} numberOfLines={2}>
              {task.description}
            </Text>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Comment *</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={comment}
                onChangeText={setComment}
                placeholder="Enter your report comment..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.photoSection}>
              <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                <Camera size={22} color="#666" />
                <Text style={styles.photoButtonText}>
                  {photoUrl ? 'Photo Added' : 'Take Photo'}
                </Text>
              </TouchableOpacity>
              {photoUrl && (
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => setPhotoUrl(null)}
                >
                  <X size={16} color="#E53935" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isLoading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, styles.reportSubmitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Send size={18} color="#fff" />
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Sending...' : 'Send Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TaskManager({
  stageId,
  projectId,
  tasks,
  availableUsers,
  currentUser,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onCompleteTask,
  onPauseTask,
  onResumeTask,
  onSubmitReport,
  onTakePhoto,
  canEdit = true,
  isLoading = false,
}: TaskManagerProps) {
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [reportTask, setReportTask] = useState<Task | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedTasks = [...tasks].sort((a, b) => a.taskNumber - b.taskNumber);

  const handleCreateTask = useCallback(
    async (description: string, assignedUsers: string[]) => {
      setIsSubmitting(true);
      try {
        await onCreateTask({
          stageId,
          projectId,
          description,
          assignedUsers,
        });
        setIsTaskModalVisible(false);
      } catch (error) {
        console.error('[TaskManager] Create task error:', error);
        Alert.alert('Error', 'Failed to create task');
      } finally {
        setIsSubmitting(false);
      }
    },
    [stageId, projectId, onCreateTask]
  );

  const handleUpdateTask = useCallback(
    async (description: string, assignedUsers: string[]) => {
      if (!editingTask) return;

      setIsSubmitting(true);
      try {
        await onUpdateTask(editingTask.id, { description, assignedUsers });
        setEditingTask(null);
      } catch (error) {
        console.error('[TaskManager] Update task error:', error);
        Alert.alert('Error', 'Failed to update task');
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingTask, onUpdateTask]
  );

  const handleDeleteTask = useCallback(
    (task: Task) => {
      Alert.alert('Delete Task', `Are you sure you want to delete task #${task.taskNumber}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteTask(task.id);
            } catch (error) {
              console.error('[TaskManager] Delete task error:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]);
    },
    [onDeleteTask]
  );

  const handleSubmitReport = useCallback(
    async (comment: string, photoUrl?: string) => {
      if (!reportTask) return;

      setIsSubmitting(true);
      try {
        await onSubmitReport(reportTask.id, comment, photoUrl);
        setReportTask(null);
        Alert.alert('Success', 'Report submitted successfully');
      } catch (error) {
        console.error('[TaskManager] Submit report error:', error);
        Alert.alert('Error', 'Failed to submit report');
      } finally {
        setIsSubmitting(false);
      }
    },
    [reportTask, onSubmitReport]
  );

  const completedCount = sortedTasks.filter((t) => t.status === 'completed').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Tasks</Text>
          {sortedTasks.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {completedCount}/{sortedTasks.length}
              </Text>
            </View>
          )}
        </View>

        {canEdit && (
          <PermissionGate permission="edit_projects">
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsTaskModalVisible(true)}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#fff" />
              <Text style={styles.addButtonText}>Add Task</Text>
            </TouchableOpacity>
          </PermissionGate>
        )}
      </View>

      {sortedTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageSquare size={40} color="#ddd" />
          <Text style={styles.emptyStateText}>No tasks yet</Text>
          <Text style={styles.emptyStateSubtext}>Add tasks to track work in this stage</Text>
        </View>
      ) : (
        <View style={styles.taskList}>
          {sortedTasks.map((task, index) => (
            <View key={task.id}>
              <TaskRow
                task={task}
                index={index}
                isExpanded={expandedTaskId === task.id}
                onToggleExpand={() =>
                  setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                }
                onComplete={() => onCompleteTask(task.id)}
                onPause={() => onPauseTask(task.id)}
                onResume={() => onResumeTask(task.id)}
                onEdit={() => setEditingTask(task)}
                onDelete={() => handleDeleteTask(task)}
                canEdit={canEdit}
              />
              {expandedTaskId === task.id && (
                <TouchableOpacity
                  style={styles.reportButton}
                  onPress={() => setReportTask(task)}
                  activeOpacity={0.8}
                >
                  <MessageSquare size={16} color="#000" />
                  <Text style={styles.reportButtonText}>Submit Report</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      <TaskFormModal
        visible={isTaskModalVisible}
        onClose={() => setIsTaskModalVisible(false)}
        onSubmit={handleCreateTask}
        availableUsers={availableUsers}
        isLoading={isSubmitting}
      />

      <TaskFormModal
        visible={editingTask !== null}
        onClose={() => setEditingTask(null)}
        onSubmit={handleUpdateTask}
        availableUsers={availableUsers}
        initialDescription={editingTask?.description}
        initialAssignedUsers={editingTask?.assignedUsers}
        isEditing
        isLoading={isSubmitting}
      />

      <ReportModal
        visible={reportTask !== null}
        task={reportTask}
        onClose={() => setReportTask(null)}
        onSubmit={handleSubmitReport}
        onTakePhoto={onTakePhoto}
        isLoading={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#999',
    marginTop: 8,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
  },
  taskList: {
    gap: 8,
  },
  taskRow: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  taskMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  taskNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskNumberCompleted: {
    backgroundColor: '#43A047',
  },
  taskNumberText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  taskContent: {
    flex: 1,
  },
  taskDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  taskDescriptionCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  assignedText: {
    fontSize: 11,
    color: '#888',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pauseButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff8e1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDD835',
  },
  pauseButtonActive: {
    backgroundColor: '#FDD835',
  },
  checkboxButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  checkboxButtonCompleted: {
    backgroundColor: '#43A047',
    borderColor: '#43A047',
  },
  checkboxEmpty: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  taskExpandedActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 16,
  },
  expandedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandedActionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500' as const,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 10,
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reportButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#000',
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
    maxHeight: '80%',
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
    minHeight: 100,
    paddingTop: 14,
  },
  userPickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userPickerButtonText: {
    fontSize: 15,
    color: '#666',
  },
  userPickerList: {
    marginTop: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
  },
  noUsersText: {
    padding: 16,
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
  userPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userPickerItemSelected: {
    backgroundColor: '#f0fff0',
  },
  userPickerItemContent: {
    flex: 1,
  },
  userPickerItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
  userPickerItemRole: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  reportTaskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reportTaskNumber: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportTaskNumberText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  reportTaskDescription: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f8f8f8',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  removePhotoButton: {
    padding: 8,
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
  reportSubmitButton: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
});
