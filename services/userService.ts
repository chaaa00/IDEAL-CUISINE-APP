import { User, CreateUserPayload, UpdateUserPayload, ROLE_PERMISSIONS } from '@/types/auth';
import { IUserRepository, userRepository } from './userRepository';

export class UserService {
  private repository: IUserRepository;

  constructor(repository: IUserRepository) {
    this.repository = repository;
  }

  async getUsers(): Promise<User[]> {
    console.log('[UserService] Getting all users');
    return this.repository.getUsers();
  }

  async getUserById(id: string): Promise<User | null> {
    console.log('[UserService] Getting user by id:', id);
    return this.repository.getUserById(id);
  }

  async createUser(payload: CreateUserPayload): Promise<User> {
    console.log('[UserService] Creating user:', payload.email);
    
    this.validateUserPayload(payload);
    
    const normalizedPayload: CreateUserPayload = {
      ...payload,
      email: payload.email.toLowerCase().trim(),
      name: payload.name.trim(),
      permissions: payload.permissions.length > 0 
        ? payload.permissions 
        : ROLE_PERMISSIONS[payload.role],
    };

    return this.repository.createUser(normalizedPayload);
  }

  async updateUser(payload: UpdateUserPayload): Promise<User> {
    console.log('[UserService] Updating user:', payload.id);
    
    if (payload.email) {
      payload.email = payload.email.toLowerCase().trim();
    }
    if (payload.name) {
      payload.name = payload.name.trim();
    }

    return this.repository.updateUser(payload);
  }

  async deleteUser(id: string): Promise<void> {
    console.log('[UserService] Deleting user:', id);
    return this.repository.deleteUser(id);
  }

  async updateUserPermissions(userId: string, permissions: string[]): Promise<User> {
    console.log('[UserService] Updating permissions for user:', userId);
    return this.repository.updateUserPermissions(userId, permissions);
  }

  async setRoleDefaultPermissions(userId: string, role: string): Promise<User> {
    console.log('[UserService] Setting default permissions for role:', role);
    const roleKey = role as keyof typeof ROLE_PERMISSIONS;
    const defaultPermissions = ROLE_PERMISSIONS[roleKey] || [];
    return this.repository.updateUserPermissions(userId, defaultPermissions);
  }

  private validateUserPayload(payload: CreateUserPayload): void {
    if (!payload.email || !payload.email.includes('@')) {
      throw new Error('Invalid email address');
    }
    if (!payload.name || payload.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    if (!payload.password || payload.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    if (!payload.role) {
      throw new Error('Role is required');
    }
  }

  getDefaultPermissionsForRole(role: string): string[] {
    const roleKey = role as keyof typeof ROLE_PERMISSIONS;
    return ROLE_PERMISSIONS[roleKey] || [];
  }
}

export const userService = new UserService(userRepository);
