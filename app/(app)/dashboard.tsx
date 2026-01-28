import { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  Settings,
  ClipboardList,
  Package,
  BarChart3,
  LogOut,
  ChefHat,
  Shield,
  FolderKanban,
  CheckCircle2,
  Clock,
  Pause,
  TrendingUp,
  Activity,
  User as UserIcon,
  ChevronRight,
  AlertCircle,
  Calendar,
  Warehouse,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PermissionGate } from '@/components/PermissionGate';
import { UserRole } from '@/types/auth';
import { dashboardService, DashboardStats, EmployeeStats, ActivityItem } from '@/services/dashboardService';
import React from "react";

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  delay: number;
  isRTL?: boolean;
}

function MenuItem({ icon, title, description, onPress, delay, isRTL }: MenuItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.menuItem, isRTL && styles.rowRTL]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.menuIcon}>{icon}</View>
        <View style={[styles.menuContent, isRTL && styles.menuContentRTL]}>
          <Text style={[styles.menuTitle, isRTL && styles.textRTL]}>{title}</Text>
          <Text style={[styles.menuDescription, isRTL && styles.textRTL]}>{description}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  delay: number;
}

function StatCard({ icon, label, value, color, delay }: StatCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.statCard,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

interface EmployeeCardProps {
  employee: EmployeeStats;
  index: number;
  onPress: () => void;
  t: (key: string) => string;
  isRTL: boolean;
}

function EmployeeCard({ employee, index, onPress, t, isRTL }: EmployeeCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const completionPercentage = employee.total > 0 
    ? Math.round((employee.completed / employee.total) * 100) 
    : 0;

  return (
    <Animated.View
      style={[
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity
        style={styles.employeeCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.employeeHeader, isRTL && styles.rowRTL]}>
          <View style={styles.employeeAvatar}>
            <Text style={styles.employeeInitials}>{getInitials(employee.userName)}</Text>
          </View>
          <View style={[styles.employeeInfo, isRTL && styles.employeeInfoRTL]}>
            <Text style={[styles.employeeName, isRTL && styles.textRTL]}>{employee.userName}</Text>
            <Text style={[styles.employeeRole, isRTL && styles.textRTL]}>
              {t(`roles.${employee.userRole}`)}
            </Text>
          </View>
          <ChevronRight size={20} color="#ccc" style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
        </View>

        <View style={[styles.employeeStatsRow, isRTL && styles.rowRTL]}>
          <View style={styles.employeeStat}>
            <View style={[styles.employeeStatDot, { backgroundColor: '#43A047' }]} />
            <Text style={styles.employeeStatValue}>{employee.completed}</Text>
            <Text style={styles.employeeStatLabel}>{t('dashboard.completed')}</Text>
          </View>
          <View style={styles.employeeStatDivider} />
          <View style={styles.employeeStat}>
            <View style={[styles.employeeStatDot, { backgroundColor: '#666' }]} />
            <Text style={styles.employeeStatValue}>{employee.pending}</Text>
            <Text style={styles.employeeStatLabel}>{t('dashboard.pending')}</Text>
          </View>
          <View style={styles.employeeStatDivider} />
          <View style={styles.employeeStat}>
            <View style={[styles.employeeStatDot, { backgroundColor: '#FDD835' }]} />
            <Text style={styles.employeeStatValue}>{employee.paused}</Text>
            <Text style={styles.employeeStatLabel}>{t('dashboard.paused')}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressHeader, isRTL && styles.rowRTL]}>
            <Text style={[styles.progressLabel, isRTL && styles.textRTL]}>{t('dashboard.completionRate')}</Text>
            <Text style={styles.progressValue}>{completionPercentage}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${completionPercentage}%` },
                isRTL && { alignSelf: 'flex-end' },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface ActivityItemCardProps {
  item: ActivityItem;
  index: number;
  t: (key: string) => string;
  isRTL: boolean;
}

function ActivityItemCard({ item, index, t, isRTL }: ActivityItemCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const getActivityIcon = () => {
    switch (item.type) {
      case 'task_completed':
        return <CheckCircle2 size={16} color="#43A047" />;
      case 'task_created':
        return <ClipboardList size={16} color="#000" />;
      case 'task_assigned':
        return <UserIcon size={16} color="#2196F3" />;
      case 'report_submitted':
        return <Activity size={16} color="#9C27B0" />;
      default:
        return <Activity size={16} color="#666" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('dashboard.justNow');
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  return (
    <Animated.View style={[styles.activityItem, { opacity: fadeAnim }, isRTL && styles.rowRTL]}>
      <View style={styles.activityIconContainer}>
        {getActivityIcon()}
      </View>
      <View style={[styles.activityContent, isRTL && styles.activityContentRTL]}>
        <Text style={[styles.activityDescription, isRTL && styles.textRTL]}>{item.description}</Text>
        <View style={[styles.activityMeta, isRTL && styles.rowRTL]}>
          <Text style={styles.activityUser}>{item.userName}</Text>
          <Text style={styles.activityDot}>•</Text>
          <Text style={styles.activityTime}>{formatTimestamp(item.timestamp)}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, isRTL } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headerFade = useRef(new Animated.Value(0)).current;

  const loadDashboardData = useCallback(async (showLoader = true) => {
    console.log('[Dashboard] Loading dashboard data');
    if (showLoader) setIsLoading(true);
    setError(null);

    try {
      const dashboardStats = await dashboardService.getDashboardStats();
      setStats(dashboardStats);
      console.log('[Dashboard] Data loaded successfully');
    } catch (err) {
      console.log('[Dashboard] API not configured, using placeholder state');
      setStats(null);
      setError(t('dashboard.connectDatabase'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadDashboardData(false);
  }, [loadDashboardData]);

  const handleLogout = async () => {
    console.log('[Dashboard] Logging out');
    await logout();
    router.replace('/(auth)/login');
  };

  if (!user) return null;

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <AlertCircle size={48} color="#ccc" />
      </View>
      <Text style={[styles.emptyTitle, isRTL && styles.textRTL]}>{t('dashboard.noDataAvailable')}</Text>
      <Text style={[styles.emptyDescription, isRTL && styles.textRTL]}>
        {error || t('dashboard.connectDatabase')}
      </Text>
    </View>
  );

  const renderDashboardStats = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={[styles.loadingText, isRTL && styles.textRTL]}>{t('dashboard.loadingStats')}</Text>
        </View>
      );
    }

    if (!stats) {
      return renderEmptyState();
    }

    return (
      <>
        <View style={styles.statsGrid}>
          <StatCard
            icon={<ClipboardList size={20} color="#000" />}
            label={t('dashboard.totalTasks')}
            value={stats.totalTasks}
            color="#000"
            delay={0}
          />
          <StatCard
            icon={<CheckCircle2 size={20} color="#43A047" />}
            label={t('dashboard.completed')}
            value={stats.completedTasks}
            color="#43A047"
            delay={50}
          />
          <StatCard
            icon={<Clock size={20} color="#666" />}
            label={t('dashboard.pending')}
            value={stats.pendingTasks}
            color="#666"
            delay={100}
          />
          <StatCard
            icon={<Pause size={20} color="#FDD835" />}
            label={t('dashboard.paused')}
            value={stats.pausedTasks}
            color="#FDD835"
            delay={150}
          />
        </View>

        <View style={styles.overviewCard}>
          <View style={[styles.overviewRow, isRTL && styles.rowRTL]}>
            <TrendingUp size={20} color="#43A047" />
            <Text style={[styles.overviewLabel, isRTL && styles.textRTL]}>{t('dashboard.overallCompletionRate')}</Text>
            <Text style={styles.overviewValue}>{Math.round(stats.completionRate)}%</Text>
          </View>
          <View style={styles.overviewProgressBar}>
            <View
              style={[
                styles.overviewProgressFill,
                { width: `${stats.completionRate}%` },
                isRTL && { alignSelf: 'flex-end' },
              ]}
            />
          </View>
        </View>

        {stats.employeeStats.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, isRTL && styles.rowRTL]}>
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('dashboard.employeePerformance')}</Text>
              <Text style={[styles.sectionSubtitle, isRTL && styles.textRTL]}>
                {stats.employeeStats.length} {t('dashboard.teamMembers')}
              </Text>
            </View>
            {stats.employeeStats.map((employee, index) => (
              <EmployeeCard
                key={employee.userId}
                employee={employee}
                index={index}
                onPress={() => console.log('View employee details:', employee.userId)}
                t={t}
                isRTL={isRTL}
              />
            ))}
          </View>
        )}

        {stats.recentActivity.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, isRTL && styles.rowRTL]}>
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('dashboard.recentActivity')}</Text>
            </View>
            <View style={styles.activityList}>
              {stats.recentActivity.map((item, index) => (
                <ActivityItemCard key={item.id} item={item} index={index} t={t} isRTL={isRTL} />
              ))}
            </View>
          </View>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#000"
          />
        }
      >
        <Animated.View style={[styles.header, { opacity: headerFade }, isRTL && styles.rowRTL]}>
          <View style={[styles.avatarContainer, isRTL && styles.rowRTL]}>
            <View style={styles.avatar}>
              <ChefHat size={28} color="#000" strokeWidth={1.5} />
            </View>
            <View style={[styles.userInfo, isRTL && styles.userInfoRTL]}>
              <Text style={[styles.userName, isRTL && styles.textRTL]}>{user.name}</Text>
              <View style={[styles.roleContainer, isRTL && styles.rowRTL]}>
                <Shield size={12} color="#666" />
                <Text style={styles.userRole}>{t(`roles.${user.role}`)}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut size={20} color="#666" />
          </TouchableOpacity>
        </Animated.View>

        <PermissionGate roles={['developer', 'manager']}>
          <View style={styles.dashboardSection}>
            <Text style={[styles.dashboardTitle, isRTL && styles.textRTL]}>{t('dashboard.overview')}</Text>
            {renderDashboardStats()}
          </View>
        </PermissionGate>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('dashboard.quickActions')}</Text>

          <PermissionGate permission="manage_orders">
            <MenuItem
              icon={<ClipboardList size={24} color="#000" />}
              title={t('menu.orders')}
              description={t('menu.viewManageOrders')}
              onPress={() => console.log('Navigate to orders')}
              delay={100}
              isRTL={isRTL}
            />
          </PermissionGate>

          <PermissionGate permission="view_menu">
            <MenuItem
              icon={<Package size={24} color="#000" />}
              title={t('menu.menuItem')}
              description={t('menu.browseMenu')}
              onPress={() => console.log('Navigate to menu')}
              delay={150}
              isRTL={isRTL}
            />
          </PermissionGate>

          <PermissionGate permission="view_inventory">
            <MenuItem
              icon={<Package size={24} color="#000" />}
              title={t('menu.inventory')}
              description={t('menu.checkStock')}
              onPress={() => console.log('Navigate to inventory')}
              delay={200}
              isRTL={isRTL}
            />
          </PermissionGate>

          <PermissionGate permission="view_projects">
            <MenuItem
              icon={<FolderKanban size={24} color="#000" />}
              title={t('menu.projects')}
              description={t('menu.manageProjects')}
              onPress={() => router.push('/(app)/projects')}
              delay={250}
              isRTL={isRTL}
            />
          </PermissionGate>

          <PermissionGate permission="view_projects">
            <MenuItem
              icon={<Calendar size={24} color="#000" />}
              title={t('menu.calendar')}
              description={t('menu.viewSchedule')}
              onPress={() => router.push('/(app)/calendar')}
              delay={300}
              isRTL={isRTL}
            />
          </PermissionGate>

          <PermissionGate permission="view_stock">
            <MenuItem
              icon={<Warehouse size={24} color="#000" />}
              title={t('menu.stock')}
              description={t('menu.manageStock')}
              onPress={() => router.push('/(app)/stock')}
              delay={350}
              isRTL={isRTL}
            />
          </PermissionGate>
        </View>

        <PermissionGate roles={['developer', 'manager']}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('dashboard.management')}</Text>

            <PermissionGate permission="create_users">
              <MenuItem
                icon={<Users size={24} color="#000" />}
                title={t('menu.staff')}
                description={t('menu.manageTeam')}
                onPress={() => router.push('/(app)/users')}
                delay={250}
                isRTL={isRTL}
              />
            </PermissionGate>

            <PermissionGate permission="view_reports">
              <MenuItem
                icon={<BarChart3 size={24} color="#000" />}
                title={t('menu.reports')}
                description={t('menu.viewReports')}
                onPress={() => console.log('Navigate to reports')}
                delay={300}
                isRTL={isRTL}
              />
            </PermissionGate>
          </View>
        </PermissionGate>

        <PermissionGate roles={['developer']}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('dashboard.administration')}</Text>

            <MenuItem
              icon={<Shield size={24} color="#000" />}
              title={t('menu.developerPanel')}
              description={t('menu.fullControl')}
              onPress={() => router.push('/(app)/developer-panel')}
              delay={350}
              isRTL={isRTL}
            />

            <MenuItem
              icon={<Settings size={24} color="#000" />}
              title={t('menu.settings')}
              description={t('menu.systemConfig')}
              onPress={() => router.push('/(app)/settings')}
              delay={400}
              isRTL={isRTL}
            />
          </View>
        </PermissionGate>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 24,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userInfo: {
    gap: 4,
  },
  userInfoRTL: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userRole: {
    fontSize: 13,
    color: '#666',
  },
  logoutButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  dashboardSection: {
    marginBottom: 28,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500' as const,
  },
  overviewCard: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  overviewLabel: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500' as const,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#43A047',
  },
  overviewProgressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  overviewProgressFill: {
    height: '100%',
    backgroundColor: '#43A047',
    borderRadius: 3,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  employeeCard: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeInitials: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  employeeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  employeeInfoRTL: {
    marginLeft: 0,
    marginRight: 12,
    alignItems: 'flex-end',
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 2,
  },
  employeeRole: {
    fontSize: 12,
    color: '#888',
  },
  employeeStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  employeeStat: {
    flex: 1,
    alignItems: 'center',
  },
  employeeStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  employeeStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 2,
  },
  employeeStatLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500' as const,
  },
  employeeStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e8e8e8',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e8e8e8',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#43A047',
    borderRadius: 2,
  },
  activityList: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityContentRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  activityDescription: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
    lineHeight: 20,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityUser: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500' as const,
  },
  activityDot: {
    fontSize: 12,
    color: '#ccc',
    marginHorizontal: 6,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  menuContent: {
    marginLeft: 14,
    flex: 1,
  },
  menuContentRTL: {
    marginLeft: 0,
    marginRight: 14,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#000',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 13,
    color: '#888',
  },
  textRTL: {
    textAlign: 'right' as const,
  },
  rowRTL: {
    flexDirection: 'row-reverse' as const,
  },
});
