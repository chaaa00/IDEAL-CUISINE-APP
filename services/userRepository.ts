import { User, CreateUserPayload, UpdateUserPayload } from '@/types/auth';

export interface IUserRepository {
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  createUser(payload: CreateUserPayload): Promise<User>;
  updateUser(payload: UpdateUserPayload): Promise<User>;
  deleteUser(id: string): Promise<void>;
  updateUserPermissions(userId: string, permissions: string[]): Promise<User>;
}

export class UserRepository implements IUserRepository {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async getUsers(): Promise<User[]> {
    console.log('[UserRepository] Fetching all users');
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/users`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[UserRepository] Get users error:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    console.log('[UserRepository] Fetching user by id:', id);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/users/${id}`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[UserRepository] Get user by id error:', error);
      throw error;
    }
  }

  async createUser(payload: CreateUserPayload): Promise<User> {
    console.log('[UserRepository] Creating user:', payload.email);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/users`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(payload),
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[UserRepository] Create user error:', error);
      throw error;
    }
  }

  async updateUser(payload: UpdateUserPayload): Promise<User> {
    console.log('[UserRepository] Updating user:', payload.id);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/users/${payload.id}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(payload),
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[UserRepository] Update user error:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    console.log('[UserRepository] Deleting user:', id);
    
    try {
      // TODO: Replace with actual API call
      // await fetch(`${this.baseUrl}/users/${id}`, {
      //   method: 'DELETE',
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[UserRepository] Delete user error:', error);
      throw error;
    }
  }

  async updateUserPermissions(userId: string, permissions: string[]): Promise<User> {
    console.log('[UserRepository] Updating permissions for user:', userId);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/users/${userId}/permissions`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ permissions }),
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[UserRepository] Update permissions error:', error);
      throw error;
    }
  }
}

export const userRepository = new UserRepository();
