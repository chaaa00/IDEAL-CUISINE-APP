import { useEffect, useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { User, LoginCredentials, AuthResponse } from '@/types/auth';
import { authService } from '@/services/authService';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  loginMutation: {
    isPending: boolean;
    error: Error | null;
  };
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextValue>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      console.log('[AuthContext] Initializing auth state');
      try {
        const stored = await authService.getStoredAuth();
        setUser(stored.user);
        setToken(stored.token);
      } catch (error) {
        console.error('[AuthContext] Init auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log('[AuthContext] Login mutation');
      return authService.login(credentials);
    },
    onSuccess: (response) => {
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
      }
    },
  });

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await loginMutation.mutateAsync(credentials);
    return response;
  }, [loginMutation]);

  const logout = useCallback(async () => {
    console.log('[AuthContext] Logout');
    await authService.logout();
    setUser(null);
    setToken(null);
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    return authService.hasPermission(user, permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return authService.hasAnyPermission(user, permissions);
  }, [user]);

  return {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    loginMutation: {
      isPending: loginMutation.isPending,
      error: loginMutation.error,
    },
  };
});
