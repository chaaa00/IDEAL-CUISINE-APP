import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { MapPin, Calendar, Hash, ChevronRight } from 'lucide-react-native';
import { Project, PROJECT_STATUS_CONFIG } from '@/types/project';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
  testID?: string;
}

export default function ProjectCard({ project, onPress, testID }: ProjectCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { t, isRTL, language } = useLanguage();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const statusConfig = PROJECT_STATUS_CONFIG[project.status];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const locale = language === 'fr' ? 'fr-FR' : language === 'ar' || language === 'tn' ? 'ar' : 'en-US';
      return date.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getEmployeeText = (count: number) => {
    if (language === 'fr') {
      return `${count} employé${count !== 1 ? 's' : ''}`;
    }
    if (language === 'ar' || language === 'tn') {
      return `${count} ${count === 1 ? 'موظف' : 'موظفين'}`;
    }
    return `${count} employee${count !== 1 ? 's' : ''}`;
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.card, isRTL && styles.cardRTL]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        testID={testID}
      >
        <View style={styles.content}>
          <View style={[styles.header, isRTL && styles.headerRTL]}>
            <Text style={[styles.name, isRTL && styles.textRTL]} numberOfLines={1}>
              {project.name}
            </Text>
            <View style={[styles.projectNumber, isRTL && styles.rowRTL]}>
              <Hash size={14} color="#666" />
              <Text style={styles.projectNumberText}>{project.projectNumber}</Text>
            </View>
          </View>

          <View style={styles.details}>
            <View style={[styles.detailRow, isRTL && styles.rowRTL]}>
              <MapPin size={16} color="#888" />
              <Text style={[styles.detailText, isRTL && styles.textRTL]} numberOfLines={1}>
                {project.location.address}
              </Text>
            </View>
            <View style={[styles.detailRow, isRTL && styles.rowRTL]}>
              <Calendar size={16} color="#888" />
              <Text style={[styles.detailText, isRTL && styles.textRTL]}>{formatDate(project.date)}</Text>
            </View>
          </View>

          <View style={[styles.footer, isRTL && styles.rowRTL]}>
            <View style={styles.employeeCount}>
              <Text style={styles.employeeCountText}>
                {getEmployeeText(project.assignedEmployees.length)}
              </Text>
            </View>
            <ChevronRight size={20} color="#ccc" style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
          </View>
        </View>

        <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }, isRTL && styles.statusIndicatorRTL]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardRTL: {
    flexDirection: 'row-reverse',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  headerRTL: {
    alignItems: 'flex-end',
  },
  name: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 4,
  },
  projectNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  projectNumberText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500' as const,
  },
  details: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  employeeCount: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  employeeCountText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500' as const,
  },
  statusIndicator: {
    width: 8,
  },
  statusIndicatorRTL: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  textRTL: {
    textAlign: 'right' as const,
  },
  rowRTL: {
    flexDirection: 'row-reverse' as const,
  },
});
