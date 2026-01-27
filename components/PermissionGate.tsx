import { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  roles?: UserRole[];
  fallback?: ReactNode;
  showFallback?: boolean;
}

export function PermissionGate({
  children,
  permission,
  permissions = [],
  requireAll = false,
  roles,
  fallback,
  showFallback = false,
}: PermissionGateProps) {
  const { user, hasPermission, hasAnyPermission } = useAuth();

  if (!user) {
    return showFallback ? (fallback ?? <DefaultFallback />) : null;
  }

  if (roles && roles.length > 0) {
    if (!roles.includes(user.role)) {
      return showFallback ? (fallback ?? <DefaultFallback />) : null;
    }
  }

  const allPermissions = permission ? [permission, ...permissions] : permissions;

  if (allPermissions.length > 0) {
    const hasAccess = requireAll
      ? allPermissions.every((p) => hasPermission(p))
      : hasAnyPermission(allPermissions);

    if (!hasAccess) {
      return showFallback ? (fallback ?? <DefaultFallback />) : null;
    }
  }

  return <>{children}</>;
}

function DefaultFallback() {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackText}>Access Denied</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    padding: 16,
    alignItems: 'center',
  },
  fallbackText: {
    color: '#999',
    fontSize: 14,
  },
});
