import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Plus, X } from 'lucide-react-native';
import { useProjects, useProjectCounts } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PermissionGate } from '@/components/PermissionGate';
import ProjectCard from '@/components/ProjectCard';
import ProjectFormModal from '@/components/ProjectFormModal';
import { Project, ProjectStatus, PROJECT_STATUS_CONFIG, CreateProjectPayload, UpdateProjectPayload } from '@/types/project';

type FilterStatus = ProjectStatus | 'all';

export default function ProjectsScreen() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { t, isRTL } = useLanguage();
  const {
    filteredProjects,
    isLoading,
    statusFilter,
    searchQuery,
    setStatusFilter,
    setSearchQuery,
    createProject,
    refetchProjects,
    createMutation,
  } = useProjects();
  const counts = useProjectCounts();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refetchProjects();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleFilterPress = (status: FilterStatus) => {
    setStatusFilter(status);
  };

  const handleProjectPress = (project: Project) => {
    router.push({
      pathname: '/(app)/project-details',
      params: { id: project.id },
    });
  };

  const handleCreateProject = async (payload: CreateProjectPayload | UpdateProjectPayload) => {
    await createProject(payload as CreateProjectPayload);
  };

  const renderFilterButton = (status: FilterStatus, label: string, color: string, count: number) => {
    const isActive = statusFilter === status;
    return (
      <TouchableOpacity
        key={status}
        style={[
          styles.filterButton,
          { backgroundColor: isActive ? color : '#f5f5f5' },
        ]}
        onPress={() => handleFilterPress(status)}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
          {label}
        </Text>
        <View style={[styles.filterBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : '#e0e0e0' }]}>
          <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, isRTL && styles.textRTL]}>{t('projects.noProjects')}</Text>
      <Text style={[styles.emptyStateText, isRTL && styles.textRTL]}>
        {searchQuery
          ? t('projects.adjustSearch')
          : statusFilter !== 'all'
          ? t('projects.noProjectsStatus')
          : t('projects.createFirst')}
      </Text>
    </View>
  );

  const renderProject = ({ item, index }: { item: Project; index: number }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <ProjectCard
        project={item}
        onPress={() => handleProjectPress(item)}
        testID={`project-card-${index}`}
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.searchContainer, isRTL && styles.rowRTL]}>
          <Search size={20} color="#888" />
          <TextInput
            style={[styles.searchInput, isRTL && styles.inputRTL]}
            placeholder={t('projects.searchProjects')}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={isRTL ? 'right' : 'left'}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.filterBar, isRTL && styles.rowRTL]}>
          {renderFilterButton('all', t('common.all'), '#333', counts.total)}
          {renderFilterButton('in_progress', t('projects.inProgress'), PROJECT_STATUS_CONFIG.in_progress.color, counts.inProgress)}
          {renderFilterButton('paused', t('dashboard.paused'), PROJECT_STATUS_CONFIG.paused.color, counts.paused)}
          {renderFilterButton('completed', t('projects.done'), PROJECT_STATUS_CONFIG.completed.color, counts.completed)}
        </View>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={[styles.loadingText, isRTL && styles.textRTL]}>{t('projects.loadingProjects')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#000"
            />
          }
        />
      )}

      <PermissionGate permission="create_projects">
        <TouchableOpacity
          style={[styles.fab, isRTL && styles.fabRTL]}
          onPress={() => setIsModalVisible(true)}
          activeOpacity={0.8}
          testID="create-project-button"
        >
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      </PermissionGate>

      <ProjectFormModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleCreateProject}
        isLoading={createMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
    marginLeft: 8,
  },
  inputRTL: {
    marginLeft: 0,
    marginRight: 8,
    textAlign: 'right' as const,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 22,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#666',
  },
  filterBadgeTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabRTL: {
    right: undefined,
    left: 20,
  },
  textRTL: {
    textAlign: 'right' as const,
  },
  rowRTL: {
    flexDirection: 'row-reverse' as const,
  },
});
