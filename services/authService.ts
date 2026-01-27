import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginCredentials, AuthResponse, User, ROLE_PERMISSIONS } from '@/types/auth';
import { IAuthRepository, authRepository } from './authRepository';

const AUTH_TOKEN_KEY = '@ideal_cuisine_auth_token';
const AUTH_USER_KEY = '@ideal_cuisine_auth_user';

export class AuthService {
  private repository: IAuthRepository;

  constructor(repository: IAuthRepository) {
    this.repository = repository;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[AuthService] Login attempt');
    
    const response = await this.repository.login(credentials);
    
    if (response.success && response.user && response.token) {
      await this.persistAuth(response.user, response.token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    console.log('[AuthService] Logout');
    
    await this.repository.logout();
    await this.clearAuth();
  }

  async getStoredAuth(): Promise<{ user: User | null; token: string | null }> {
    console.log('[AuthService] Getting stored auth');
    
    try {
      const [tokenData, userData] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(AUTH_USER_KEY),
      ]);

      const token = tokenData;
      const user = userData ? JSON.parse(userData) : null;

      if (token && user) {
        const isValid = await this.repository.validateToken(token);
        if (!isValid) {
          console.log('[AuthService] Token invalid, clearing auth');
          await this.clearAuth();
          return { user: null, token: null };
        }
      }

      return { user, token };
    } catch (error) {
      console.error('[AuthService] Error getting stored auth:', error);
      return { user: null, token: null };
    }
  }

  async persistAuth(user: User, token: string): Promise<void> {
    console.log('[AuthService] Persisting auth for user:', user.email);
    
    try {
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),
      ]);
    } catch (error) {
      console.error('[AuthService] Error persisting auth:', error);
    }
  }

  async clearAuth(): Promise<void> {
    console.log('[AuthService] Clearing auth');
    
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(AUTH_USER_KEY),
      ]);
    } catch (error) {
      console.error('[AuthService] Error clearing auth:', error);
    }
  }

  hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    return rolePermissions.includes(permission);
  }

  hasAnyPermission(user: User | null, permissions: string[]): boolean {
    if (!user) return false;
    
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  hasAllPermissions(user: User | null, permissions: string[]): boolean {
    if (!user) return false;
    
    return permissions.every(permission => this.hasPermission(user, permission));
  }
}

export const authService = new AuthService(authRepository);
