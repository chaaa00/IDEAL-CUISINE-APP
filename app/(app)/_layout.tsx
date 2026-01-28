import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { NotificationBell } from '@/components/NotificationBell';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      console.log('[AppLayout] Not authenticated, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#fff' },
        headerBackTitle: t('common.back'),
      }}
    >
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          title: t('dashboard.title'),
          headerRight: () => <NotificationBell />,
        }} 
      />
      <Stack.Screen name="users" options={{ title: t('users.title') }} />
      <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
      <Stack.Screen 
        name="projects" 
        options={{ 
          title: t('projects.title'),
          headerRight: () => <NotificationBell />,
        }} 
      />
      <Stack.Screen name="project-details" options={{ title: t('projects.projectDetails') }} />
      <Stack.Screen 
        name="calendar" 
        options={{ 
          title: t('calendar.title'),
          headerRight: () => <NotificationBell />,
        }} 
      />
      <Stack.Screen 
        name="developer-panel" 
        options={{ 
          title: t('developerPanel.title'),
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="stock" 
        options={{ 
          title: t('stock.title'),
          headerRight: () => <NotificationBell />,
        }} 
      />
      <Stack.Screen 
        name="messages" 
        options={{ 
          title: t('messaging.title'),
          headerRight: () => <NotificationBell />,
        }} 
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
