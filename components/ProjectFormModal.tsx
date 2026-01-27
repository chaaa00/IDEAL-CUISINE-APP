import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, MapPin, Calendar, Hash, FileText } from 'lucide-react-native';
import { Project, CreateProjectPayload, UpdateProjectPayload, ProjectStatus, PROJECT_STATUS_OPTIONS, PROJECT_STATUS_CONFIG } from '@/types/project';

interface ProjectFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateProjectPayload | UpdateProjectPayload) => Promise<void>;
  project?: Project | null;
  isLoading?: boolean;
}

export default function ProjectFormModal({
  visible,
  onClose,
  onSubmit,
  project,
  isLoading = false,
}: ProjectFormModalProps) {
  const [name, setName] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('in_progress');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

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
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
    }
  }, [visible]);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setProjectNumber(project.projectNumber);
      setAddress(project.location.address);
      setLatitude(project.location.latitude.toString());
      setLongitude(project.location.longitude.toString());
      setDate(project.date);
      setStatus(project.status);
    } else {
      resetForm();
    }
  }, [project, visible]);

  const resetForm = () => {
    setName('');
    setProjectNumber('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setDate('');
    setStatus('in_progress');
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!projectNumber.trim()) {
      newErrors.projectNumber = 'Project number is required';
    }

    if (!address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!latitude.trim()) {
      newErrors.latitude = 'Latitude is required';
    } else if (isNaN(parseFloat(latitude))) {
      newErrors.latitude = 'Invalid latitude';
    }

    if (!longitude.trim()) {
      newErrors.longitude = 'Longitude is required';
    } else if (isNaN(parseFloat(longitude))) {
      newErrors.longitude = 'Invalid longitude';
    }

    if (!date.trim()) {
      newErrors.date = 'Date is required';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        newErrors.date = 'Date must be in YYYY-MM-DD format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const payload = project
        ? {
            id: project.id,
            name: name.trim(),
            projectNumber: projectNumber.trim(),
            location: {
              address: address.trim(),
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            },
            date: date.trim(),
            status,
          }
        : {
            name: name.trim(),
            projectNumber: projectNumber.trim(),
            location: {
              address: address.trim(),
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            },
            date: date.trim(),
            status,
            assignedEmployees: [],
          };

      await onSubmit(payload);
      resetForm();
      onClose();
    } catch (error) {
      console.error('[ProjectFormModal] Submit error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save project');
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      resetForm();
      onClose();
    });
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: React.ReactNode,
    error?: string,
    placeholder?: string,
    keyboardType?: 'default' | 'numeric' | 'email-address'
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        <View style={styles.inputIcon}>{icon}</View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType={keyboardType}
          editable={!isLoading}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {project ? 'Edit Project' : 'New Project'}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.form}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}
          >
            {renderInput(
              'Project Name',
              name,
              setName,
              <FileText size={20} color="#666" />,
              errors.name,
              'Enter project name'
            )}

            {renderInput(
              'Project Number',
              projectNumber,
              setProjectNumber,
              <Hash size={20} color="#666" />,
              errors.projectNumber,
              'Enter project number'
            )}

            {renderInput(
              'Address',
              address,
              setAddress,
              <MapPin size={20} color="#666" />,
              errors.address,
              'Enter location address'
            )}

            <View style={styles.row}>
              <View style={styles.halfInput}>
                {renderInput(
                  'Latitude',
                  latitude,
                  setLatitude,
                  <MapPin size={20} color="#666" />,
                  errors.latitude,
                  '0.000000',
                  'numeric'
                )}
              </View>
              <View style={styles.halfInput}>
                {renderInput(
                  'Longitude',
                  longitude,
                  setLongitude,
                  <MapPin size={20} color="#666" />,
                  errors.longitude,
                  '0.000000',
                  'numeric'
                )}
              </View>
            </View>

            {renderInput(
              'Date',
              date,
              setDate,
              <Calendar size={20} color="#666" />,
              errors.date,
              'YYYY-MM-DD'
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusOptions}>
                {PROJECT_STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.statusOption,
                      status === option.value && {
                        backgroundColor: PROJECT_STATUS_CONFIG[option.value].color,
                        borderColor: PROJECT_STATUS_CONFIG[option.value].color,
                      },
                    ]}
                    onPress={() => setStatus(option.value)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        status === option.value && styles.statusOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
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
                {isLoading ? 'Saving...' : project ? 'Update' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    flex: 1,
  },
  formContent: {
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputError: {
    borderColor: '#E53935',
  },
  inputIcon: {
    padding: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
    paddingRight: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#E53935',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#666',
  },
  statusOptionTextActive: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
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
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
