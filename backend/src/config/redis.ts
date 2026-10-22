import Redis from 'ioredis';
import { ENV } from './env';

class MemoryCache {
  private store: Map<string, { value: string; expiry?: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiry: number | undefined;
    if (mode === 'EX' && duration) {
      expiry = Date.now() + duration * 1000;
    } else if (mode === 'PX' && duration) {
      expiry = Date.now() + duration;
    }
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const k of keys) {
      if (this.store.delete(k)) count++;
    }
    return count;
  }

  async exists(key: string): Promise<number> {
    const item = await this.get(key);
    return item !== null ? 1 : 0;
  }
}

export interface ICacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | string>;
  del(...keys: string[]): Promise<number>;
  exists(key: string): Promise<number>;
}

let redisInstance: ICacheClient;
const memoryFallback = new MemoryCache();
let isUsingRedis = false;

try {
  const realRedis = new Redis(ENV.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // Stop retrying after 3 attempts and use fallback
      }
      return Math.min(times * 100, 1000);
    },
    lazyConnect: true,
  });

  realRedis.on('connect', () => {
    console.log('Connected to Redis cache server');
    isUsingRedis = true;
  });

  realRedis.on('error', (err) => {
    // Only warn once
    if (isUsingRedis) {
      console.warn(`Redis disconnected: ${err.message}. Using in-memory fallback cache.`);
      isUsingRedis = false;
    }
  });

  // Attempt initial connect
  realRedis.connect().catch((err) => {
    console.warn(`Redis server unavailable (${err.message}). Active fallback: In-Memory Cache (Development Mode).`);
  });

  redisInstance = {
    async get(key: string) {
      if (isUsingRedis) {
        try {
          return await realRedis.get(key);
        } catch {
          return memoryFallback.get(key);
        }
      }
      return memoryFallback.get(key);
    },
    async set(key: string, value: string, mode?: string, duration?: number) {
      if (isUsingRedis) {
        try {
          if (mode && duration) {
            return await (realRedis as any).set(key, value, mode, duration);
          }
          return await realRedis.set(key, value);
        } catch {
          return memoryFallback.set(key, value, mode, duration);
        }
      }
      return memoryFallback.set(key, value, mode, duration);
    },
    async del(...keys: string[]) {
      if (isUsingRedis) {
        try {
          return await realRedis.del(...keys);
        } catch {
          return memoryFallback.del(...keys);
        }
      }
      return memoryFallback.del(...keys);
    },
    async exists(key: string) {
      if (isUsingRedis) {
        try {
          return await realRedis.exists(key);
        } catch {
          return memoryFallback.exists(key);
        }
      }
      return memoryFallback.exists(key);
    }
  };
} catch (e: any) {
  console.warn(`Using In-Memory cache fallback: ${e.message}`);
  redisInstance = memoryFallback;
}

export const redis = redisInstance;
