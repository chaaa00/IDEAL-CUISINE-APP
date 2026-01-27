import { LoginCredentials, AuthResponse, User } from '@/types/auth';
import { validateDeveloperCredentials, getDeveloperUser, generateDeveloperToken } from '@/constants/developerCredentials';

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  validateToken(token: string): Promise<boolean>;
}

export class AuthRepository implements IAuthRepository {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[AuthRepository] Attempting login for:', credentials.email);
    
    try {
      // Check developer credentials first (for local development)
      if (validateDeveloperCredentials(credentials.email, credentials.password)) {
        console.log('[AuthRepository] Developer login successful');
        return {
          success: true,
          user: getDeveloperUser(),
          token: generateDeveloperToken(),
        };
      }

      // TODO: Replace with actual API call for production
      // const response = await fetch(`${this.baseUrl}/auth/login`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(credentials),
      // });
      // return await response.json();

      return {
        success: false,
        error: 'Invalid credentials',
      };
    } catch (error) {
      console.error('[AuthRepository] Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async logout(): Promise<void> {
    console.log('[AuthRepository] Logging out');
    
    try {
      // TODO: Replace with actual API call
      // await fetch(`${this.baseUrl}/auth/logout`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
    } catch (error) {
      console.error('[AuthRepository] Logout error:', error);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    console.log('[AuthRepository] Getting current user');
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/auth/me`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      return null;
    } catch (error) {
      console.error('[AuthRepository] Get current user error:', error);
      return null;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    console.log('[AuthRepository] Validating token');
    
    try {
      // Validate developer tokens locally
      if (token && token.startsWith('dev_token_')) {
        return true;
      }

      // TODO: Replace with actual API call for production
      // const response = await fetch(`${this.baseUrl}/auth/validate`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return response.ok;

      return false;
    } catch (error) {
      console.error('[AuthRepository] Token validation error:', error);
      return false;
    }
  }
}

export const authRepository = new AuthRepository();
