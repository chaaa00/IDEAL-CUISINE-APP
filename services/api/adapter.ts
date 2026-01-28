import { apiConfig } from './config';
import { withRetry, CircuitBreaker, RequestQueue } from '@/utils/networkResilience';
import { MemoryCache, RequestDeduplicator } from '@/utils/performance';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

export interface RequestOptions {
  useCache?: boolean;
  cacheTTL?: number;
  useRetry?: boolean;
  maxRetries?: number;
  dedupe?: boolean;
  priority?: number;
}

export interface IDatabaseAdapter {
  get<T>(endpoint: string, params?: QueryParams, options?: RequestOptions): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<ApiResponse<T>>;
  put<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<ApiResponse<T>>;
  patch<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<ApiResponse<T>>;
  delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  invalidateCache(pattern?: RegExp): void;
  getStats(): AdapterStats;
}

export interface AdapterStats {
  cacheSize: number;
  queueSize: number;
  circuitBreakerState: string;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
}

class DatabaseAdapter implements IDatabaseAdapter {
  private cache = new MemoryCache<ApiResponse<any>>(500, 5 * 60 * 1000);
  private deduplicator = new RequestDeduplicator();
  private circuitBreaker = new CircuitBreaker(5, 30000);
  private requestQueue = new RequestQueue(10);
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  private buildUrl(endpoint: string, params?: QueryParams): string {
    const baseUrl = apiConfig.getBaseUrl();
    if (!baseUrl) {
      return endpoint;
    }
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

  private getCacheKey(method: string, endpoint: string, params?: QueryParams): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${method}:${endpoint}:${paramString}`;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    params?: QueryParams,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    this.stats.totalRequests++;
    const cacheKey = this.getCacheKey(method, endpoint, params);

    if (method === 'GET' && options.useCache !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.stats.cacheHits++;
        console.log(`[DatabaseAdapter] Cache hit: ${cacheKey}`);
        return cached as ApiResponse<T>;
      }
      this.stats.cacheMisses++;
    }
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

    const executeRequest = async (): Promise<ApiResponse<T>> => {
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
        const result: ApiResponse<T> = {
          data: responseData as T,
          error: null,
          status: response.status,
        };

        if (method === 'GET' && options.useCache !== false) {
          this.cache.set(cacheKey, result, options.cacheTTL);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`[DatabaseAdapter] Request error:`, errorMessage);
        return {
          data: null,
          error: errorMessage,
          status: 0,
        };
      }
    };

    try {
      let requestFn = executeRequest;

      if (options.dedupe && method === 'GET') {
        requestFn = () => this.deduplicator.dedupe(cacheKey, executeRequest);
      }

      if (options.useRetry) {
        const retryFn = requestFn;
        requestFn = () => withRetry(retryFn, { maxRetries: options.maxRetries ?? 3 });
      }

      return await this.circuitBreaker.execute(requestFn);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      return {
        data: null,
        error: errorMessage,
        status: 0,
      };
    }
  }

  async get<T>(endpoint: string, params?: QueryParams, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, params, { useCache: true, dedupe: true, ...options });
  }

  async post<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    const result = await this.request<T>('POST', endpoint, data, undefined, options);
    if (!result.error) {
      this.invalidateCacheForEndpoint(endpoint);
    }
    return result;
  }

  async put<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    const result = await this.request<T>('PUT', endpoint, data, undefined, options);
    if (!result.error) {
      this.invalidateCacheForEndpoint(endpoint);
    }
    return result;
  }

  async patch<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    const result = await this.request<T>('PATCH', endpoint, data, undefined, options);
    if (!result.error) {
      this.invalidateCacheForEndpoint(endpoint);
    }
    return result;
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const result = await this.request<T>('DELETE', endpoint, undefined, undefined, options);
    if (!result.error) {
      this.invalidateCacheForEndpoint(endpoint);
    }
    return result;
  }

  private invalidateCacheForEndpoint(endpoint: string): void {
    const baseEndpoint = endpoint.split('/')[0] || endpoint;
    this.cache.invalidatePattern(new RegExp(`GET:.*${baseEndpoint}.*`));
  }

  invalidateCache(pattern?: RegExp): void {
    if (pattern) {
      this.cache.invalidatePattern(pattern);
    } else {
      this.cache.clear();
    }
  }

  getStats(): AdapterStats {
    return {
      cacheSize: this.cache.getStats().size,
      queueSize: this.requestQueue.getQueueSize(),
      circuitBreakerState: this.circuitBreaker.getState().state,
      totalRequests: this.stats.totalRequests,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
    };
  }
}

export const databaseAdapter = new DatabaseAdapter();
export default databaseAdapter;
