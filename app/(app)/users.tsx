import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Shield } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/PermissionGate';

export default function UsersScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <PermissionGate
          roles={['developer']}
          showFallback
          fallback={
            <View style={styles.accessDenied}>
              <Shield size={48} color="#ccc" />
              <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
              <Text style={styles.accessDeniedText}>
                You don't have permission to manage users.
              </Text>
            </View>
          }
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Users size={24} color="#000" />
            </View>
            <Text style={styles.title}>User Management</Text>
            <Text style={styles.subtitle}>
              Create and manage user accounts. Only developers can access this section.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>External Database Required</Text>
            <Text style={styles.infoText}>
              User management functionality requires connection to an external database
              (Firebase, Supabase, or REST API). Connect your database to enable:
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>• Create new users</Text>
              <Text style={styles.featureItem}>• Assign roles and permissions</Text>
              <Text style={styles.featureItem}>• Deactivate accounts</Text>
              <Text style={styles.featureItem}>• Reset passwords</Text>
            </View>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#444',
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center' as const,
  },
});
