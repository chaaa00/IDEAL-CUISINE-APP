import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  MapPin,
  Calendar,
  Hash,
  Navigation,
  Users,
  Edit2,
  Trash2,
  ChevronLeft,
  GitBranch,
  Rocket,
  CheckCircle,
} from 'lucide-react-native';
import { useProjects } from '@/contexts/ProjectContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/PermissionGate';
import ProjectFormModal from '@/components/ProjectFormModal';
import WorkflowEditor from '@/components/WorkflowEditor';
import { 
  PROJECT_STATUS_CONFIG, 
  UpdateProjectPayload, 
  CreateProjectPayload,
  WorkflowStage,
  CreateWorkflowStagePayload,
  UpdateWorkflowStagePayload,
} from '@/types/project';
import { Task, CreateTaskPayload } from '@/types/task';
import { User } from '@/types/auth';

export default function ProjectDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { hasPermission, user } = useAuth();
  const { getProjectById, updateProject, deleteProject, launchProject, updateMutation, deleteMutation, launchMutation } = useProjects();
  const { sendProjectLaunchNotification, addLocalNotification } = useNotifications();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
  const [stageTasks, setStageTasks] = useState<Record<string, Task[]>>({});
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isWorkflowLoading, setIsWorkflowLoading] = useState(false);
  const project = getProjectById(id || '');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!project) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Project not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = PROJECT_STATUS_CONFIG[project.status];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleOpenMaps = () => {
    const { latitude, longitude } = project.location;
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
      }
    });
  };

  const handleViewEmployees = () => {
    Alert.alert(
      'Assigned Employees',
      project.assignedEmployees.length > 0
        ? `This project has ${project.assignedEmployees.length} assigned employee(s).`
        : 'No employees assigned to this project yet.',
      [{ text: 'OK' }]
    );
  };

  const handleUpdateProject = async (payload: CreateProjectPayload | UpdateProjectPayload) => {
    await updateProject(payload as UpdateProjectPayload);
  };

  const handleDeleteProject = () => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProject(project.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  const handleLaunchProject = () => {
    if (project.isLaunched) {
      Alert.alert('Already Launched', 'This project has already been launched.');
      return;
    }

    if (project.assignedEmployees.length === 0) {
      Alert.alert(
        'No Employees Assigned',
        'Please assign at least one employee to this project before launching.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Launch Project',
      `Are you sure you want to launch "${project.name}"? All assigned employees will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Launch',
          style: 'default',
          onPress: async () => {
            try {
              console.log('[ProjectDetails] Launching project:', project.id);
              
              await launchProject({
                projectId: project.id,
                launchedBy: user?.id || '',
              });

              await sendProjectLaunchNotification(
                project.id,
                project.name,
                project.assignedEmployees
              );

              addLocalNotification({
                type: 'project_launched',
                title: 'Project Launched',
                message: `Project "${project.name}" has been successfully launched.`,
                data: { projectId: project.id, projectName: project.name },
                recipientId: user?.id || '',
              });

              Alert.alert(
                'Project Launched',
                `"${project.name}" has been launched successfully. ${project.assignedEmployees.length} employee(s) have been notified.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.log('[ProjectDetails] Launch failed (API not connected), using local state');
              
              addLocalNotification({
                type: 'project_launched',
                title: 'Project Launched',
                message: `Project "${project.name}" has been successfully launched.`,
                data: { projectId: project.id, projectName: project.name },
                recipientId: user?.id || '',
              });

              project.assignedEmployees.forEach(employeeId => {
                addLocalNotification({
                  type: 'project_launched',
                  title: 'Project Launched',
                  message: `Project "${project.name}" has been launched. You have been assigned to this project.`,
                  data: { projectId: project.id, projectName: project.name },
                  recipientId: employeeId,
                });
              });

              Alert.alert(
                'Project Launched',
                `"${project.name}" launch initiated. ${project.assignedEmployees.length} employee(s) will be notified when connected to external service.`,
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleAddStage = useCallback(async (payload: CreateWorkflowStagePayload) => {
    console.log('[ProjectDetails] Adding workflow stage:', payload.name);
    setIsWorkflowLoading(true);
    try {
      const newStage: WorkflowStage = {
        id: `stage_${Date.now()}`,
        name: payload.name,
        description: payload.description,
        order: workflowStages.length,
        isCompleted: false,
      };
      setWorkflowStages(prev => [...prev, newStage]);
    } finally {
      setIsWorkflowLoading(false);
    }
  }, [workflowStages.length]);

  const handleUpdateStage = useCallback(async (payload: UpdateWorkflowStagePayload) => {
    console.log('[ProjectDetails] Updating workflow stage:', payload.id);
    setIsWorkflowLoading(true);
    try {
      setWorkflowStages(prev => prev.map(stage => 
        stage.id === payload.id 
          ? { 
              ...stage, 
              name: payload.name ?? stage.name,
              description: payload.description ?? stage.description,
              isCompleted: payload.isCompleted ?? stage.isCompleted,
            }
          : stage
      ));
    } finally {
      setIsWorkflowLoading(false);
    }
  }, []);

  const handleDeleteStage = useCallback(async (stageId: string) => {
    console.log('[ProjectDetails] Deleting workflow stage:', stageId);
    setIsWorkflowLoading(true);
    try {
      setWorkflowStages(prev => {
        const filtered = prev.filter(s => s.id !== stageId);
        return filtered.map((stage, index) => ({ ...stage, order: index }));
      });
    } finally {
      setIsWorkflowLoading(false);
    }
  }, []);

  const handleReorderStages = useCallback(async (stageIds: string[]) => {
    console.log('[ProjectDetails] Reordering workflow stages');
    setIsWorkflowLoading(true);
    try {
      setWorkflowStages(prev => {
        const stageMap = new Map(prev.map(s => [s.id, s]));
        return stageIds.map((id, index) => {
          const stage = stageMap.get(id);
          return stage ? { ...stage, order: index } : null;
        }).filter((s): s is WorkflowStage => s !== null);
      });
    } finally {
      setIsWorkflowLoading(false);
    }
  }, []);

  const handleCompleteStage = useCallback(async (stageId: string) => {
    console.log('[ProjectDetails] Completing workflow stage:', stageId);
    setIsWorkflowLoading(true);
    try {
      setWorkflowStages(prev => prev.map(stage =>
        stage.id === stageId
          ? {
              ...stage,
              isCompleted: true,
              completedAt: new Date().toISOString(),
              completedBy: user?.id,
            }
          : stage
      ));
    } finally {
      setIsWorkflowLoading(false);
    }
  }, [user?.id]);

  const handleCreateTask = useCallback(async (payload: CreateTaskPayload) => {
    console.log('[ProjectDetails] Creating task:', payload.description);
    const newTask: Task = {
      id: `task_${Date.now()}`,
      stageId: payload.stageId,
      projectId: payload.projectId,
      taskNumber: (stageTasks[payload.stageId]?.length || 0) + 1,
      description: payload.description,
      status: 'pending',
      assignedUsers: payload.assignedUsers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setStageTasks(prev => ({
      ...prev,
      [payload.stageId]: [...(prev[payload.stageId] || []), newTask],
    }));
    if (payload.assignedUsers.length > 0) {
      console.log('[ProjectDetails] Sending notification to users:', payload.assignedUsers);
    }
  }, [stageTasks]);

  const handleUpdateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    console.log('[ProjectDetails] Updating task:', taskId);
    setStageTasks(prev => {
      const newTasks = { ...prev };
      for (const stageId in newTasks) {
        newTasks[stageId] = newTasks[stageId].map(task =>
          task.id === taskId
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task
        );
      }
      return newTasks;
    });
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    console.log('[ProjectDetails] Deleting task:', taskId);
    setStageTasks(prev => {
      const newTasks = { ...prev };
      for (const stageId in newTasks) {
        newTasks[stageId] = newTasks[stageId].filter(task => task.id !== taskId);
        newTasks[stageId] = newTasks[stageId].map((task, index) => ({
          ...task,
          taskNumber: index + 1,
        }));
      }
      return newTasks;
    });
  }, []);

  const handleCompleteTask = useCallback(async (taskId: string) => {
    console.log('[ProjectDetails] Completing task:', taskId);
    setStageTasks(prev => {
      const newTasks = { ...prev };
      for (const stageId in newTasks) {
        newTasks[stageId] = newTasks[stageId].map(task =>
          task.id === taskId
            ? {
                ...task,
                status: 'completed' as const,
                completedAt: new Date().toISOString(),
                completedBy: user?.id,
                updatedAt: new Date().toISOString(),
              }
            : task
        );
      }
      return newTasks;
    });
  }, [user?.id]);

  const handlePauseTask = useCallback(async (taskId: string) => {
    console.log('[ProjectDetails] Pausing task:', taskId);
    setStageTasks(prev => {
      const newTasks = { ...prev };
      for (const stageId in newTasks) {
        newTasks[stageId] = newTasks[stageId].map(task =>
          task.id === taskId
            ? { ...task, status: 'paused' as const, updatedAt: new Date().toISOString() }
            : task
        );
      }
      return newTasks;
    });
  }, []);

  const handleResumeTask = useCallback(async (taskId: string) => {
    console.log('[ProjectDetails] Resuming task:', taskId);
    setStageTasks(prev => {
      const newTasks = { ...prev };
      for (const stageId in newTasks) {
        newTasks[stageId] = newTasks[stageId].map(task =>
          task.id === taskId
            ? { ...task, status: 'pending' as const, updatedAt: new Date().toISOString() }
            : task
        );
      }
      return newTasks;
    });
  }, []);

  const handleSubmitReport = useCallback(async (taskId: string, comment: string, photoUrl?: string) => {
    console.log('[ProjectDetails] Submitting report for task:', taskId);
    console.log('[ProjectDetails] Report comment:', comment);
    console.log('[ProjectDetails] Report photo:', photoUrl || 'No photo');
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={24} color="#000" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <PermissionGate permission="edit_projects">
                <TouchableOpacity
                  onPress={() => setIsEditModalVisible(true)}
                  style={styles.headerButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Edit2 size={20} color="#000" />
                </TouchableOpacity>
              </PermissionGate>
              <PermissionGate permission="delete_projects">
                <TouchableOpacity
                  onPress={handleDeleteProject}
                  style={styles.headerButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={20} color="#E53935" />
                </TouchableOpacity>
              </PermissionGate>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.statusBanner}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.projectName}>{project.name}</Text>
            <View style={styles.projectNumberBadge}>
              <Hash size={16} color="#666" />
              <Text style={styles.projectNumber}>{project.projectNumber}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MapPin size={20} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoText}>{project.location.address}</Text>
                  <Text style={styles.infoSubtext}>
                    {project.location.latitude.toFixed(6)}, {project.location.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Calendar size={20} color="#666" />
                <Text style={styles.infoText}>{formatDate(project.date)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Users size={20} color="#666" />
                <Text style={styles.infoText}>
                  {project.assignedEmployees.length} employee{project.assignedEmployees.length !== 1 ? 's' : ''} assigned
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <PermissionGate permission="edit_projects">
              {!project.isLaunched ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.launchButton]}
                  onPress={handleLaunchProject}
                  activeOpacity={0.8}
                  disabled={launchMutation.isPending}
                >
                  <Rocket size={22} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {launchMutation.isPending ? 'Launching...' : 'Launch Project'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.actionButton, styles.launchedBadge]}>
                  <CheckCircle size={22} color="#43A047" />
                  <Text style={[styles.actionButtonText, styles.launchedText]}>
                    Project Launched
                  </Text>
                </View>
              )}
            </PermissionGate>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleOpenMaps}
              activeOpacity={0.8}
            >
              <Navigation size={22} color="#fff" />
              <Text style={styles.actionButtonText}>Navigate to Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleViewEmployees}
              activeOpacity={0.8}
            >
              <Users size={22} color="#000" />
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                View Assigned Employees
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.workflowSection}>
            <WorkflowEditor
              stages={workflowStages}
              projectId={project.id}
              tasks={stageTasks}
              availableUsers={availableUsers}
              currentUser={user}
              onAddStage={handleAddStage}
              onUpdateStage={handleUpdateStage}
              onDeleteStage={handleDeleteStage}
              onReorderStages={handleReorderStages}
              onCompleteStage={handleCompleteStage}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onCompleteTask={handleCompleteTask}
              onPauseTask={handlePauseTask}
              onResumeTask={handleResumeTask}
              onSubmitReport={handleSubmitReport}
              isLoading={isWorkflowLoading}
              canEdit={hasPermission('edit_projects')}
            />
          </View>

          <View style={styles.metadata}>
            <Text style={styles.metadataText}>
              Created: {formatDate(project.createdAt)}
            </Text>
            <Text style={styles.metadataText}>
              Last updated: {formatDate(project.updatedAt)}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <ProjectFormModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSubmit={handleUpdateProject}
        project={project}
        isLoading={updateMutation.isPending}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  content: {
    padding: 20,
  },
  headerButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  notFoundText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleSection: {
    marginBottom: 24,
  },
  projectName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 8,
  },
  projectNumberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  projectNumber: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  infoSubtext: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  actions: {
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 14,
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  actionButtonTextSecondary: {
    color: '#000',
  },
  launchButton: {
    backgroundColor: '#43A047',
  },
  launchedBadge: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1.5,
    borderColor: '#43A047',
  },
  launchedText: {
    color: '#43A047',
  },
  workflowSection: {
    marginTop: 8,
    marginBottom: 24,
    minHeight: 200,
  },
  metadata: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#999',
  },
});
