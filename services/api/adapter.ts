import { apiConfig } from './config';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

export interface IDatabaseAdapter {
  get<T>(endpoint: string, params?: QueryParams): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>>;
  put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>>;
  patch<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>>;
  delete<T>(endpoint: string): Promise<ApiResponse<T>>;
}

class DatabaseAdapter implements IDatabaseAdapter {
  private buildUrl(endpoint: string, params?: QueryParams): string {
    const baseUrl = apiConfig.getBaseUrl();
    const url = new URL(endpoint, baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    params?: QueryParams
  ): Promise<ApiResponse<T>> {
    if (!apiConfig.isConfigured()) {
      console.error('[DatabaseAdapter] API not configured');
      return {
        data: null,
        error: 'API not configured. Please connect to an external database (Firebase, Supabase, or REST API).',
        status: 0,
      };
    }

    const url = this.buildUrl(endpoint, params);
    const headers = apiConfig.getHeaders();
    const config = apiConfig.get();

    console.log(`[DatabaseAdapter] ${method} ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DatabaseAdapter] Error ${response.status}:`, errorText);
        return {
          data: null,
          error: `Request failed with status ${response.status}: ${errorText}`,
          status: response.status,
        };
      }

      const responseData = await response.json();
      return {
        data: responseData as T,
        error: null,
        status: response.status,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`[DatabaseAdapter] Request error:`, errorMessage);
      return {
        data: null,
        error: errorMessage,
        status: 0,
      };
    }
  }

  async get<T>(endpoint: string, params?: QueryParams): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, params);
  }

  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data);
  }

  async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data);
  }

  async patch<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }
}

export const databaseAdapter = new DatabaseAdapter();
export default databaseAdapter;
