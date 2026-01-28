import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, backoffMultiplier } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);

      if (attempt < maxRetries) {
        const delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay
        );
        console.log(`[Retry] Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface QueuedRequest {
  id: string;
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  priority: number;
}

export class RequestQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private concurrency: number;
  private activeRequests = 0;

  constructor(concurrency: number = 5) {
    this.concurrency = concurrency;
  }

  add<T>(fn: () => Promise<T>, priority: number = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fn,
        resolve,
        reject,
        timestamp: Date.now(),
        priority,
      };

      this.queue.push(request);
      this.queue.sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    if (this.activeRequests >= this.concurrency) return;

    this.isProcessing = true;

    while (this.queue.length > 0 && this.activeRequests < this.concurrency) {
      const request = this.queue.shift();
      if (!request) break;

      this.activeRequests++;

      request.fn()
        .then(request.resolve)
        .catch(request.reject)
        .finally(() => {
          this.activeRequests--;
          this.processQueue();
        });
    }

    this.isProcessing = false;
  }

  clear(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Request cancelled'));
    });
    this.queue = [];
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = '@offline_queue';

export class OfflineQueue {
  private queue: OfflineAction[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`[OfflineQueue] Loaded ${this.queue.length} pending actions`);
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue:', error);
      this.queue = [];
      this.isInitialized = true;
    }
  }

  async add(type: string, payload: any): Promise<string> {
    await this.initialize();

    const action: OfflineAction = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(action);
    await this.persist();
    console.log(`[OfflineQueue] Added action: ${type}`);
    return action.id;
  }

  async remove(id: string): Promise<void> {
    this.queue = this.queue.filter(action => action.id !== id);
    await this.persist();
  }

  async getAll(): Promise<OfflineAction[]> {
    await this.initialize();
    return [...this.queue];
  }

  async clear(): Promise<void> {
    this.queue = [];
    await this.persist();
  }

  async processQueue(
    processor: (action: OfflineAction) => Promise<boolean>
  ): Promise<{ processed: number; failed: number }> {
    await this.initialize();

    let processed = 0;
    let failed = 0;

    const actionsToProcess = [...this.queue];

    for (const action of actionsToProcess) {
      try {
        const success = await processor(action);
        if (success) {
          await this.remove(action.id);
          processed++;
        } else {
          action.retryCount++;
          if (action.retryCount >= 5) {
            await this.remove(action.id);
            console.log(`[OfflineQueue] Action ${action.id} exceeded max retries`);
          }
          failed++;
        }
      } catch (error) {
        console.error(`[OfflineQueue] Failed to process action ${action.id}:`, error);
        action.retryCount++;
        failed++;
      }
    }

    await this.persist();
    return { processed, failed };
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to persist queue:', error);
    }
  }
}

export interface CircuitBreakerState {
  failures: number;
  lastFailure: number | null;
  state: 'closed' | 'open' | 'half-open';
}

export class CircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailure: null,
    state: 'closed',
  };
  private failureThreshold: number;
  private resetTimeout: number;

  constructor(failureThreshold: number = 5, resetTimeout: number = 30000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state.state === 'open') {
      if (Date.now() - (this.state.lastFailure || 0) > this.resetTimeout) {
        this.state.state = 'half-open';
        console.log('[CircuitBreaker] State changed to half-open');
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.state.failures = 0;
    this.state.state = 'closed';
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailure = Date.now();

    if (this.state.failures >= this.failureThreshold) {
      this.state.state = 'open';
      console.log('[CircuitBreaker] State changed to open');
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      failures: 0,
      lastFailure: null,
      state: 'closed',
    };
  }
}

export const globalRequestQueue = new RequestQueue(10);
export const globalOfflineQueue = new OfflineQueue();
export const apiCircuitBreaker = new CircuitBreaker(5, 30000);
