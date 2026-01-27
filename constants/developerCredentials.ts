import { User, ALL_PERMISSIONS } from '@/types/auth';

export interface DeveloperCredential {
  email: string;
  password: string;
  user: User;
}

export const DEVELOPER_CREDENTIALS: DeveloperCredential = {
  email: 'dev@idealcuisine.tn',
  password: 'IdealDev@2024!',
  user: {
    id: 'dev-super-admin-001',
    email: 'dev@idealcuisine.tn',
    name: 'Developer Admin',
    role: 'developer',
    permissions: ALL_PERMISSIONS.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

export function validateDeveloperCredentials(email: string, password: string): boolean {
  return (
    email === DEVELOPER_CREDENTIALS.email &&
    password === DEVELOPER_CREDENTIALS.password
  );
}

export function getDeveloperUser(): User {
  return { ...DEVELOPER_CREDENTIALS.user };
}

export function generateDeveloperToken(): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `dev_token_${timestamp}_${randomPart}`;
}
