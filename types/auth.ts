export type UserRole = 'developer' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

export type PermissionCategory = 'pages' | 'actions' | 'data';

export interface PermissionDefinition {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  { id: 'view_dashboard', name: 'View Dashboard', description: 'Access to dashboard page', category: 'pages' },
  { id: 'view_developer_panel', name: 'View Developer Panel', description: 'Access to developer panel', category: 'pages' },
  { id: 'view_users', name: 'View Users', description: 'Access to users page', category: 'pages' },
  { id: 'view_settings', name: 'View Settings', description: 'Access to settings page', category: 'pages' },
  { id: 'view_menu', name: 'View Menu', description: 'Access to menu page', category: 'pages' },
  { id: 'view_orders', name: 'View Orders', description: 'Access to orders page', category: 'pages' },
  { id: 'view_inventory', name: 'View Inventory', description: 'Access to inventory page', category: 'pages' },
  { id: 'view_reports', name: 'View Reports', description: 'Access to reports page', category: 'pages' },
  { id: 'view_analytics', name: 'View Analytics', description: 'Access to analytics page', category: 'pages' },
  { id: 'view_projects', name: 'View Projects', description: 'Access to projects page', category: 'pages' },
  { id: 'view_stock', name: 'View Stock', description: 'Access to stock/magasin page', category: 'pages' },
  
  { id: 'create_users', name: 'Create Users', description: 'Ability to create new users', category: 'actions' },
  { id: 'edit_users', name: 'Edit Users', description: 'Ability to edit existing users', category: 'actions' },
  { id: 'delete_users', name: 'Delete Users', description: 'Ability to delete users', category: 'actions' },
  { id: 'manage_permissions', name: 'Manage Permissions', description: 'Ability to assign/revoke permissions', category: 'actions' },
  { id: 'create_menu_items', name: 'Create Menu Items', description: 'Ability to create menu items', category: 'actions' },
  { id: 'edit_menu_items', name: 'Edit Menu Items', description: 'Ability to edit menu items', category: 'actions' },
  { id: 'delete_menu_items', name: 'Delete Menu Items', description: 'Ability to delete menu items', category: 'actions' },
  { id: 'manage_orders', name: 'Manage Orders', description: 'Ability to manage orders', category: 'actions' },
  { id: 'manage_inventory', name: 'Manage Inventory', description: 'Ability to manage inventory', category: 'actions' },
  { id: 'manage_settings', name: 'Manage Settings', description: 'Ability to change app settings', category: 'actions' },
  { id: 'create_projects', name: 'Create Projects', description: 'Ability to create projects', category: 'actions' },
  { id: 'edit_projects', name: 'Edit Projects', description: 'Ability to edit projects', category: 'actions' },
  { id: 'delete_projects', name: 'Delete Projects', description: 'Ability to delete projects', category: 'actions' },
  { id: 'assign_employees', name: 'Assign Employees', description: 'Ability to assign employees to projects', category: 'actions' },
  { id: 'create_tasks', name: 'Create Tasks', description: 'Ability to create tasks in workflow stages', category: 'actions' },
  { id: 'edit_tasks', name: 'Edit Tasks', description: 'Ability to edit existing tasks', category: 'actions' },
  { id: 'delete_tasks', name: 'Delete Tasks', description: 'Ability to delete tasks', category: 'actions' },
  { id: 'complete_tasks', name: 'Complete Tasks', description: 'Ability to mark tasks as complete', category: 'actions' },
  { id: 'submit_reports', name: 'Submit Reports', description: 'Ability to submit task reports', category: 'actions' },
  { id: 'add_stock', name: 'Add Stock Items', description: 'Ability to add new stock items', category: 'actions' },
  { id: 'edit_stock', name: 'Edit Stock Items', description: 'Ability to edit stock items', category: 'actions' },
  { id: 'delete_stock', name: 'Delete Stock Items', description: 'Ability to delete stock items', category: 'actions' },
  { id: 'adjust_stock_quantity', name: 'Adjust Stock Quantity', description: 'Ability to increase/decrease stock quantity', category: 'actions' },
  
  { id: 'export_data', name: 'Export Data', description: 'Ability to export data', category: 'data' },
  { id: 'import_data', name: 'Import Data', description: 'Ability to import data', category: 'data' },
  { id: 'view_sensitive_data', name: 'View Sensitive Data', description: 'Access to sensitive information', category: 'data' },
];

export interface CreateUserPayload {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  permissions: string[];
}

export interface UpdateUserPayload {
  id: string;
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
  permissions?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  developer: ALL_PERMISSIONS.map(p => p.id),
  manager: [
    'view_dashboard',
    'view_menu',
    'view_orders',
    'view_inventory',
    'view_reports',
    'create_menu_items',
    'edit_menu_items',
    'manage_orders',
    'manage_inventory',
  ],
  employee: [
    'view_dashboard',
    'view_menu',
    'view_orders',
    'view_inventory',
    'manage_orders',
  ],
};

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = { ...ROLE_PERMISSIONS };

export const ROLE_LABELS: Record<UserRole, string> = {
  developer: 'Developer (Super Admin)',
  manager: 'Manager',
  employee: 'Employee',
};
