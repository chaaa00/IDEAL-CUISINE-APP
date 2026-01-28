import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Animated,
  Switch,
} from 'react-native';
import { X, ChevronDown, ChevronUp } from 'lucide-react-native';
import {
  User,
  UserRole,
  CreateUserPayload,
  UpdateUserPayload,
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  PermissionCategory,
} from '@/types/auth';

interface UserFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => void;
  user?: User | null;
  isLoading?: boolean;
}

const ROLES: UserRole[] = ['developer', 'manager', 'employee'];

export function UserFormModal({
  visible,
  onClose,
  onSubmit,
  user,
  isLoading = false,
}: UserFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<PermissionCategory[]>(['pages', 'actions', 'data']);
  const [fadeAnim] = useState(new Animated.Value(0));

  const isEditMode = !!user;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      if (user) {
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setSelectedPermissions(user.permissions.map(p => p.id));
        setPassword('');
      } else {
        resetForm();
      }
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, user]);

  const resetForm = useCallback(() => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('employee');
    setSelectedPermissions(ROLE_PERMISSIONS.employee);
    setShowRoleDropdown(false);
  }, []);

  const handleRoleChange = useCallback((newRole: UserRole) => {
    setRole(newRole);
    setSelectedPermissions(ROLE_PERMISSIONS[newRole]);
    setShowRoleDropdown(false);
  }, []);

  const togglePermission = useCallback((permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  }, []);

  const toggleCategory = useCallback((category: PermissionCategory) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  const selectAllInCategory = useCallback((category: PermissionCategory) => {
    const categoryPermissions = ALL_PERMISSIONS.filter(p => p.category === category).map(p => p.id);
    const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !categoryPermissions.includes(p)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...categoryPermissions])]);
    }
  }, [selectedPermissions]);

  const handleSubmit = useCallback(() => {
    if (isEditMode && user) {
      const payload: UpdateUserPayload = {
        id: user.id,
        name,
        email,
        role,
        permissions: selectedPermissions,
      };
      if (password) {
        payload.password = password;
      }
      onSubmit(payload);
    } else {
      const payload: CreateUserPayload = {
        name,
        email,
        password,
        role,
        permissions: selectedPermissions,
      };
      onSubmit(payload);
    }
  }, [isEditMode, user, name, email, password, role, selectedPermissions, onSubmit]);

  const isFormValid = useCallback(() => {
    if (!name.trim() || !email.trim()) return false;
    if (!isEditMode && !password) return false;
    return true;
  }, [name, email, password, isEditMode]);

  const getCategoryLabel = (category: PermissionCategory): string => {
    const labels: Record<PermissionCategory, string> = {
      pages: 'Page Access',
      actions: 'Action Permissions',
      data: 'Data Access',
      messaging: 'Messaging',
    };
    return labels[category];
  };

  const renderPermissionsByCategory = (category: PermissionCategory) => {
    const categoryPermissions = ALL_PERMISSIONS.filter(p => p.category === category);
    const isExpanded = expandedCategories.includes(category);
    const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p.id));
    const someSelected = categoryPermissions.some(p => selectedPermissions.includes(p.id));

    return (
      <View key={category} style={styles.categoryContainer}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category)}
          activeOpacity={0.7}
        >
          <View style={styles.categoryTitleRow}>
            {isExpanded ? (
              <ChevronUp size={18} color="#000" />
            ) : (
              <ChevronDown size={18} color="#000" />
            )}
            <Text style={styles.categoryTitle}>{getCategoryLabel(category)}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.selectAllButton,
              allSelected && styles.selectAllButtonActive,
            ]}
            onPress={() => selectAllInCategory(category)}
          >
            <Text style={[
              styles.selectAllText,
              allSelected && styles.selectAllTextActive,
            ]}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.permissionsList}>
            {categoryPermissions.map(permission => (
              <TouchableOpacity
                key={permission.id}
                style={styles.permissionItem}
                onPress={() => togglePermission(permission.id)}
                activeOpacity={0.7}
              >
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionName}>{permission.name}</Text>
                  <Text style={styles.permissionDescription}>{permission.description}</Text>
                </View>
                <Switch
                  value={selectedPermissions.includes(permission.id)}
                  onValueChange={() => togglePermission(permission.id)}
                  trackColor={{ false: '#E5E5E5', true: '#000' }}
                  thumbColor="#fff"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditMode ? 'Edit User' : 'Create User'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Password {isEditMode && '(leave blank to keep current)'}
              </Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={isEditMode ? '••••••••' : 'Enter password'}
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownText}>{ROLE_LABELS[role]}</Text>
                {showRoleDropdown ? (
                  <ChevronUp size={20} color="#000" />
                ) : (
                  <ChevronDown size={20} color="#000" />
                )}
              </TouchableOpacity>
              
              {showRoleDropdown && (
                <View style={styles.dropdownOptions}>
                  {ROLES.map(r => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.dropdownOption,
                        role === r && styles.dropdownOptionActive,
                      ]}
                      onPress={() => handleRoleChange(r)}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        role === r && styles.dropdownOptionTextActive,
                      ]}>
                        {ROLE_LABELS[r]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permissions</Text>
            <Text style={styles.sectionSubtitle}>
              Customize what this user can access and do
            </Text>
            
            {(['pages', 'actions', 'data'] as PermissionCategory[]).map(renderPermissionsByCategory)}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid() || isLoading) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid() || isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
    backgroundColor: '#FAFAFA',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  dropdownText: {
    fontSize: 15,
    color: '#000',
  },
  dropdownOptions: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionActive: {
    backgroundColor: '#000',
  },
  dropdownOptionText: {
    fontSize: 15,
    color: '#000',
  },
  dropdownOptionTextActive: {
    color: '#fff',
  },
  categoryContainer: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F8F8F8',
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  selectAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#000',
  },
  selectAllButtonActive: {
    backgroundColor: '#000',
  },
  selectAllText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#000',
  },
  selectAllTextActive: {
    color: '#fff',
  },
  permissionsList: {
    backgroundColor: '#fff',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  permissionInfo: {
    flex: 1,
    marginRight: 12,
  },
  permissionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 12,
    color: '#666',
  },
  bottomPadding: {
    height: 40,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
