import { apiConfig } from './config';
import { databaseAdapter } from './adapter';

export { apiConfig, type ApiConfig, type DatabaseProvider, type FirebaseConfig, type SupabaseConfig, type RestApiConfig } from './config';
export { databaseAdapter, type ApiResponse, type QueryParams, type IDatabaseAdapter } from './adapter';

export const initializeApi = {
  firebase: (config: {
    projectId: string;
    apiKey: string;
    authDomain?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  }) => {
    const baseUrl = `https://${config.projectId}.firebaseio.com`;
    apiConfig.setFirebase({ ...config, baseUrl });
    console.log('[API] Initialized with Firebase');
  },

  supabase: (config: {
    projectUrl: string;
    apiKey: string;
    anonKey?: string;
  }) => {
    apiConfig.setSupabase({
      baseUrl: `${config.projectUrl}/rest/v1`,
      apiKey: config.apiKey,
      anonKey: config.anonKey,
    });
    console.log('[API] Initialized with Supabase');
  },

  rest: (config: {
    baseUrl: string;
    apiKey?: string;
    headers?: Record<string, string>;
  }) => {
    apiConfig.setRestApi(config);
    console.log('[API] Initialized with REST API');
  },
};

export const api = {
  config: apiConfig,
  adapter: databaseAdapter,
  initialize: initializeApi,
};

export default api;
