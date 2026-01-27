import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  Users,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PermissionGate } from '@/components/PermissionGate';
import { UserFormModal } from '@/components/UserFormModal';
import { userService } from '@/services/userService';
import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
} from '@/types/auth';

export default function DeveloperPanel() {
  const router = useRouter();
  const { user: currentUser, hasPermission } = useAuth();
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();

  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  if (currentUser?.role !== 'developer') {
    return (
      <View style={styles.accessDenied}>
        <Stack.Screen options={{ title: t('settings.accessRestricted') }} />
        <AlertCircle size={48} color="#E53935" />
        <Text style={[styles.accessDeniedTitle, isRTL && styles.textRTL]}>{t('settings.accessRestricted')}</Text>
        <Text style={[styles.accessDeniedText, isRTL && styles.textRTL]}>
          {t('settings.onlyDevelopers')}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    retry: false,
  });

  const createUserMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsFormModalVisible(false);
      Alert.alert(t('common.success'), t('users.addUser') + ' ✓');
    },
    onError: (error: Error) => {
      Alert.alert(t('common.error'), error.message);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (payload: UpdateUserPayload) => userService.updateUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsFormModalVisible(false);
      setSelectedUser(null);
      Alert.alert(t('common.success'), t('users.editUser') + ' ✓');
    },
    onError: (error: Error) => {
      Alert.alert(t('common.error'), error.message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      Alert.alert(t('common.success'), t('users.deleteUser') + ' ✓');
    },
    onError: (error: Error) => {
      Alert.alert(t('common.error'), error.message);
    },
  });

  const handleCreateUser = useCallback(() => {
    setSelectedUser(null);
    setIsFormModalVisible(true);
  }, []);

  const handleEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    setIsFormModalVisible(true);
  }, []);

  const handleDeleteUser = useCallback((user: User) => {
    if (user.id === currentUser?.id) {
      Alert.alert(t('common.error'), t('errors.generic'));
      return;
    }

    Alert.alert(
      t('users.deleteUser'),
      t('users.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteUserMutation.mutate(user.id),
        },
      ]
    );
  }, [currentUser, deleteUserMutation, t]);

  const handleFormSubmit = useCallback((payload: CreateUserPayload | UpdateUserPayload) => {
    if ('id' in payload) {
      updateUserMutation.mutate(payload);
    } else {
      createUserMutation.mutate(payload);
    }
  }, [createUserMutation, updateUserMutation]);

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'developer':
        return '#1A1A1A';
      case 'manager':
        return '#424242';
      case 'employee':
        return '#757575';
      default:
        return '#999';
    }
  };

  const users = usersQuery.data || [];
  const isLoading = usersQuery.isLoading;
  const error = usersQuery.error;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Stack.Screen
        options={{
          title: t('developerPanel.title'),
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
        }}
      />

      <View style={styles.header}>
        <View style={[styles.headerInfo, isRTL && styles.rowRTL]}>
          <View style={styles.headerIconContainer}>
            <Shield size={24} color="#fff" />
          </View>
          <View style={isRTL ? styles.headerTextRTL : undefined}>
            <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>{t('users.title')}</Text>
            <Text style={[styles.headerSubtitle, isRTL && styles.textRTL]}>
              {t('developerPanel.subtitle')}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.statsRow, isRTL && styles.rowRTL]}>
        <View style={styles.statCard}>
          <Users size={20} color="#000" />
          <Text style={styles.statValue}>{users.length}</Text>
          <Text style={styles.statLabel}>{t('developerPanel.totalUsers')}</Text>
        </View>
        <View style={styles.statCard}>
          <Shield size={20} color="#000" />
          <Text style={styles.statValue}>
            {users.filter(u => u.role === 'developer').length}
          </Text>
          <Text style={styles.statLabel}>{t('roles.developer')}</Text>
        </View>
        <View style={styles.statCard}>
          <Users size={20} color="#000" />
          <Text style={styles.statValue}>
            {users.filter(u => u.role === 'manager').length}
          </Text>
          <Text style={styles.statLabel}>{t('roles.manager')}</Text>
        </View>
      </View>

      <PermissionGate permission="create_users">
        <TouchableOpacity
          style={[styles.createButton, isRTL && styles.rowRTL]}
          onPress={handleCreateUser}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.createButtonText}>{t('developerPanel.createUser')}</Text>
        </TouchableOpacity>
      </PermissionGate>

      <View style={[styles.listHeader, isRTL && styles.rowRTL]}>
        <Text style={[styles.listTitle, isRTL && styles.textRTL]}>{t('developerPanel.tabs.users')}</Text>
      </View>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => usersQuery.refetch()}
            tintColor="#000"
          />
        }
      >
        {error && (
          <View style={styles.errorCard}>
            <AlertCircle size={24} color="#E53935" />
            <Text style={[styles.errorTitle, isRTL && styles.textRTL]}>{t('settings.configurationRequired')}</Text>
            <Text style={[styles.errorText, isRTL && styles.textRTL]}>
              {t('settings.configurationInfo')}
            </Text>
          </View>
        )}

        {!error && users.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Users size={48} color="#CCC" />
            <Text style={[styles.emptyStateTitle, isRTL && styles.textRTL]}>{t('users.noUsers')}</Text>
            <Text style={[styles.emptyStateText, isRTL && styles.textRTL]}>
              {t('projects.createFirst')}
            </Text>
          </View>
        )}

        {users.map((user) => (
          <View key={user.id} style={[styles.userCard, isRTL && styles.rowRTL]}>
            <View style={[styles.userInfo, isRTL && styles.rowRTL]}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={[styles.userDetails, isRTL && styles.userDetailsRTL]}>
                <Text style={[styles.userName, isRTL && styles.textRTL]}>{user.name}</Text>
                <Text style={[styles.userEmail, isRTL && styles.textRTL]}>{user.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                  <Text style={styles.roleBadgeText}>{t(`roles.${user.role}`)}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.userActions, isRTL && styles.rowRTL]}>
              <PermissionGate permission="edit_users">
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditUser(user)}
                  activeOpacity={0.7}
                >
                  <Pencil size={18} color="#000" />
                </TouchableOpacity>
              </PermissionGate>

              <PermissionGate permission="delete_users">
                {user.id !== currentUser?.id && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteUser(user)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={18} color="#E53935" />
                  </TouchableOpacity>
                )}
              </PermissionGate>
            </View>
          </View>
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <UserFormModal
        visible={isFormModalVisible}
        onClose={() => {
          setIsFormModalVisible(false);
          setSelectedUser(null);
        }}
        onSubmit={handleFormSubmit}
        user={selectedUser}
        isLoading={createUserMutation.isPending || updateUserMutation.isPending}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextRTL: {
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#000',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  errorCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#C62828',
    marginTop: 12,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center' as const,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userDetailsRTL: {
    alignItems: 'flex-end',
    marginRight: 12,
    marginLeft: 0,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#fff',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFF5F5',
  },
  bottomPadding: {
    height: 32,
  },
  accessDenied: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  textRTL: {
    textAlign: 'right' as const,
  },
  rowRTL: {
    flexDirection: 'row-reverse' as const,
  },
});
