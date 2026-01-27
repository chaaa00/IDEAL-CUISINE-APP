export type DatabaseProvider = 'firebase' | 'supabase' | 'rest' | 'none';

export interface ApiConfig {
  provider: DatabaseProvider;
  baseUrl: string;
  apiKey?: string;
  projectId?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface FirebaseConfig extends ApiConfig {
  provider: 'firebase';
  projectId: string;
  apiKey: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface SupabaseConfig extends ApiConfig {
  provider: 'supabase';
  baseUrl: string;
  apiKey: string;
  anonKey?: string;
}

export interface RestApiConfig extends ApiConfig {
  provider: 'rest';
  baseUrl: string;
  apiKey?: string;
  authHeader?: string;
}

const defaultConfig: ApiConfig = {
  provider: 'none',
  baseUrl: '',
  timeout: 30000,
};

let currentConfig: ApiConfig = { ...defaultConfig };

export const apiConfig = {
  get(): ApiConfig {
    return { ...currentConfig };
  },

  set(config: Partial<ApiConfig>): void {
    currentConfig = { ...currentConfig, ...config };
    console.log('[ApiConfig] Configuration updated:', currentConfig.provider);
  },

  setFirebase(config: Omit<FirebaseConfig, 'provider'>): void {
    currentConfig = { ...config, provider: 'firebase' };
    console.log('[ApiConfig] Firebase configuration set');
  },

  setSupabase(config: Omit<SupabaseConfig, 'provider'>): void {
    currentConfig = { ...config, provider: 'supabase' };
    console.log('[ApiConfig] Supabase configuration set');
  },

  setRestApi(config: Omit<RestApiConfig, 'provider'>): void {
    currentConfig = { ...config, provider: 'rest' };
    console.log('[ApiConfig] REST API configuration set');
  },

  reset(): void {
    currentConfig = { ...defaultConfig };
    console.log('[ApiConfig] Configuration reset to default');
  },

  isConfigured(): boolean {
    return currentConfig.provider !== 'none' && !!currentConfig.baseUrl;
  },

  getProvider(): DatabaseProvider {
    return currentConfig.provider;
  },

  getBaseUrl(): string {
    return currentConfig.baseUrl;
  },

  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...currentConfig.headers,
    };

    if (currentConfig.apiKey) {
      switch (currentConfig.provider) {
        case 'supabase':
          headers['apikey'] = currentConfig.apiKey;
          headers['Authorization'] = `Bearer ${currentConfig.apiKey}`;
          break;
        case 'firebase':
        case 'rest':
          headers['Authorization'] = `Bearer ${currentConfig.apiKey}`;
          break;
      }
    }

    return headers;
  },
};

export default apiConfig;
