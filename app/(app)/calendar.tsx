import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar as CalendarIcon,
  X,
} from 'lucide-react-native';
import { useProjects } from '@/contexts/ProjectContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Project, PROJECT_STATUS_CONFIG } from '@/types/project';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_SIZE = Math.floor((SCREEN_WIDTH - 40 - 12) / 7);

interface DayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  project: Project | null;
  onPress: () => void;
}

function DayCell({ date, isCurrentMonth, isToday, project, onPress }: DayProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const statusColor = project ? PROJECT_STATUS_CONFIG[project.status].color : undefined;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.dayCell,
          !isCurrentMonth && styles.dayCellOutside,
          isToday && styles.dayCellToday,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={!project}
      >
        <Text
          style={[
            styles.dayText,
            !isCurrentMonth && styles.dayTextOutside,
            isToday && styles.dayTextToday,
          ]}
        >
          {date.getDate()}
        </Text>
        {project && (
          <View style={[styles.projectDot, { backgroundColor: statusColor }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

interface ProjectModalProps {
  project: Project;
  visible: boolean;
  onClose: () => void;
  onViewDetails: () => void;
  t: (key: string) => string;
  isRTL: boolean;
}

function ProjectModal({ project, visible, onClose, onViewDetails, t, isRTL }: ProjectModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const statusConfig = PROJECT_STATUS_CONFIG[project.status];
  const projectDate = new Date(project.date);
  const formattedDate = projectDate.toLocaleDateString(isRTL ? 'ar' : 'fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
      <TouchableOpacity 
        style={styles.modalBackdrop} 
        onPress={onClose}
        activeOpacity={1}
      />
      <Animated.View
        style={[
          styles.modalContent,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.modalHeader}>
          <View style={styles.modalHandle} />
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <X size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          <View style={[styles.projectHeader, isRTL && styles.rowRTL]}>
            <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]} />
            <View style={[styles.projectTitleContainer, isRTL && styles.projectTitleContainerRTL]}>
              <Text style={[styles.projectName, isRTL && styles.textRTL]}>{project.name}</Text>
              <Text style={[styles.projectNumber, isRTL && styles.textRTL]}>#{project.projectNumber}</Text>
            </View>
          </View>

          <View style={[styles.projectInfoRow, isRTL && styles.rowRTL]}>
            <CalendarIcon size={16} color="#666" />
            <Text style={[styles.projectInfoText, isRTL && styles.textRTL]}>{formattedDate}</Text>
          </View>

          <View style={[styles.projectInfoRow, isRTL && styles.rowRTL]}>
            <MapPin size={16} color="#666" />
            <Text style={[styles.projectInfoText, isRTL && styles.textRTL]} numberOfLines={2}>
              {project.location.address}
            </Text>
          </View>

          <View style={[styles.statusBadge, isRTL && styles.rowRTL]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={styles.statusText}>{t(`projects.${project.status === 'in_progress' ? 'inProgress' : project.status === 'completed' ? 'done' : 'paused'}`)}</Text>
          </View>

          <TouchableOpacity
            style={styles.viewDetailsBtn}
            onPress={onViewDetails}
            activeOpacity={0.8}
          >
            <Text style={styles.viewDetailsBtnText}>{t('projects.projectDetails')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export default function CalendarScreen() {
  const router = useRouter();
  const { projects, isLoading, refetchProjects } = useProjects();
  const { t, isRTL, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const WEEKDAYS = useMemo(() => {
    if (language === 'fr') return ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    if (language === 'ar' || language === 'tn') return ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }, [language]);

  const MONTHS = useMemo(() => {
    if (language === 'fr') return ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    if (language === 'ar' || language === 'tn') return ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  }, [language]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const projectsByDate = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((project) => {
      const dateKey = project.date.split('T')[0];
      map.set(dateKey, project);
    });
    return map;
  }, [projects]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [currentDate]);

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  }, [currentDate]);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }, [currentDate]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleDayPress = useCallback((date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    const project = projectsByDate.get(dateKey);
    if (project) {
      console.log('[Calendar] Selected project:', project.name);
      setSelectedProject(project);
    }
  }, [projectsByDate]);

  const handleViewDetails = useCallback(() => {
    if (selectedProject) {
      console.log('[Calendar] Navigating to project details:', selectedProject.id);
      setSelectedProject(null);
      router.push({
        pathname: '/(app)/project-details',
        params: { id: selectedProject.id },
      });
    }
  }, [selectedProject, router]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refetchProjects();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [refetchProjects]);

  const today = new Date();

  const projectsThisMonth = useMemo(() => {
    return projects.filter((project) => {
      const projectDate = new Date(project.date);
      return (
        projectDate.getMonth() === currentDate.getMonth() &&
        projectDate.getFullYear() === currentDate.getFullYear()
      );
    });
  }, [projects, currentDate]);

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
        <Animated.View
          style={[
            styles.calendarContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={[styles.calendarHeader, isRTL && styles.rowRTL]}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={isRTL ? handleNextMonth : handlePrevMonth}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleToday} activeOpacity={0.7}>
              <Text style={styles.monthTitle}>
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={isRTL ? handlePrevMonth : handleNextMonth}
              activeOpacity={0.7}
            >
              <ChevronRight size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={[styles.weekdayHeader, isRTL && styles.rowRTL]}>
            {WEEKDAYS.map((day) => (
              <View key={day} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.daysGrid, isRTL && styles.daysGridRTL]}>
            {calendarDays.map((item, index) => {
              const dateKey = item.date.toISOString().split('T')[0];
              const project = projectsByDate.get(dateKey) || null;
              const isToday =
                item.date.getDate() === today.getDate() &&
                item.date.getMonth() === today.getMonth() &&
                item.date.getFullYear() === today.getFullYear();

              return (
                <DayCell
                  key={index}
                  date={item.date}
                  isCurrentMonth={item.isCurrentMonth}
                  isToday={isToday}
                  project={project}
                  onPress={() => handleDayPress(item.date)}
                />
              );
            })}
          </View>
        </Animated.View>

        <View style={styles.legendSection}>
          <Text style={[styles.legendTitle, isRTL && styles.textRTL]}>{t('projects.status')}</Text>
          <View style={[styles.legendRow, isRTL && styles.rowRTL]}>
            <View style={[styles.legendItem, isRTL && styles.rowRTL]}>
              <View style={[styles.legendDot, { backgroundColor: '#E53935' }]} />
              <Text style={styles.legendText}>{t('projects.inProgress')}</Text>
            </View>
            <View style={[styles.legendItem, isRTL && styles.rowRTL]}>
              <View style={[styles.legendDot, { backgroundColor: '#FDD835' }]} />
              <Text style={styles.legendText}>{t('dashboard.paused')}</Text>
            </View>
            <View style={[styles.legendItem, isRTL && styles.rowRTL]}>
              <View style={[styles.legendDot, { backgroundColor: '#43A047' }]} />
              <Text style={styles.legendText}>{t('projects.done')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.summarySection}>
          <Text style={[styles.summaryTitle, isRTL && styles.textRTL]}>
            {MONTHS[currentDate.getMonth()]} {t('menu.projects')}
          </Text>
          {projectsThisMonth.length === 0 ? (
            <View style={styles.emptyState}>
              <CalendarIcon size={32} color="#ccc" />
              <Text style={[styles.emptyText, isRTL && styles.textRTL]}>{t('calendar.noProjects')}</Text>
            </View>
          ) : (
            projectsThisMonth.map((project) => {
              const statusConfig = PROJECT_STATUS_CONFIG[project.status];
              const projectDate = new Date(project.date);
              return (
                <TouchableOpacity
                  key={project.id}
                  style={[styles.projectCard, isRTL && styles.projectCardRTL]}
                  onPress={() => setSelectedProject(project)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.projectCardStatus, { backgroundColor: statusConfig.color }, isRTL && styles.projectCardStatusRTL]} />
                  <View style={[styles.projectCardContent, isRTL && styles.projectCardContentRTL]}>
                    <Text style={[styles.projectCardName, isRTL && styles.textRTL]}>{project.name}</Text>
                    <Text style={[styles.projectCardDate, isRTL && styles.textRTL]}>
                      {projectDate.toLocaleDateString(isRTL ? 'ar' : 'fr-FR', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#ccc" style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          visible={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          onViewDetails={handleViewDetails}
          t={t}
          isRTL={isRTL}
        />
      )}
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
    paddingBottom: 32,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000',
  },
  weekdayHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  weekdayCell: {
    width: DAY_SIZE,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
    textTransform: 'uppercase' as const,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 6,
  },
  daysGridRTL: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DAY_SIZE / 2,
  },
  dayCellOutside: {
    opacity: 0.3,
  },
  dayCellToday: {
    backgroundColor: '#000',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#000',
  },
  dayTextOutside: {
    color: '#ccc',
  },
  dayTextToday: {
    color: '#fff',
  },
  projectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  legendSection: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: '#666',
  },
  summarySection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  projectCardRTL: {
    flexDirection: 'row-reverse',
  },
  projectCardStatus: {
    width: 4,
    height: '100%',
    position: 'absolute' as const,
    left: 0,
  },
  projectCardStatusRTL: {
    left: undefined,
    right: 0,
  },
  projectCardContent: {
    flex: 1,
    padding: 16,
    paddingLeft: 20,
  },
  projectCardContentRTL: {
    paddingLeft: 16,
    paddingRight: 20,
  },
  projectCardName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 4,
  },
  projectCardDate: {
    fontSize: 13,
    color: '#888',
  },
  modalOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  modalCloseBtn: {
    position: 'absolute' as const,
    right: 16,
    top: 8,
    padding: 8,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
    marginRight: 16,
  },
  projectTitleContainer: {
    flex: 1,
  },
  projectTitleContainerRTL: {
    alignItems: 'flex-end',
    marginRight: 0,
    marginLeft: 16,
  },
  projectName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 4,
  },
  projectNumber: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500' as const,
  },
  projectInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  projectInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#333',
  },
  viewDetailsBtn: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewDetailsBtnText: {
    fontSize: 16,
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
