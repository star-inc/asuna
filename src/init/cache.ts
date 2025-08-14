// Asuna - Tiny microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

// cache-layer is used for as an in-memory cache.

// Import modules
import { get } from '../config';
import Redis, { Redis as RedisType } from 'ioredis';

// Read configuration
const redisUrl: string = get('REDIS_URL');
const redisNamespace: string = get('REDIS_NAMESPACE');

/**
 * Asuna Cache.
 * @class Cache
 * The unified cache-layer for the application.
 */
class Cache {
  private _redisClient: RedisType;

  constructor(client: RedisType) {
    this._redisClient = client;
  }

  rawClient(): RedisType {
    return this._redisClient;
  }

  async has(key: string): Promise<boolean> {
    const exists = await this._redisClient.exists(key);
    return exists === 1;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = await this._redisClient.get(key);
    return value ? JSON.parse(value) as T : null;
  }

  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    const values = await this._redisClient.mget(...keys);
    return values.map(v => (v ? JSON.parse(v) as T : null));
  }

  async set(key: string, value: unknown, ttl: number): Promise<'OK'> {
    const strValue = JSON.stringify(value);
    return this._redisClient.setex(key, ttl, strValue);
  }

  async mset(keyValueSet: { key: string; value: unknown }[]): Promise<'OK'> {
    const flat: string[] = [];
    keyValueSet.forEach(({ key, value }) => {
      flat.push(key, JSON.stringify(value));
    });
    return this._redisClient.mset(...flat);
  }

  async del(keys: string | string[]): Promise<number> {
    if (Array.isArray(keys)) {
      return this._redisClient.del(...keys);
    }
    return this._redisClient.del(keys);
  }

  async ttl(key: string, ttl: number): Promise<boolean> {
    const result = await this._redisClient.expire(key, ttl);
    return result === 1;
  }

  async getTTL(key: string): Promise<number> {
    return this._redisClient.ttl(key);
  }

  async keys(): Promise<string[]> {
    return this._redisClient.keys('*');
  }

  async getStats(): Promise<string> {
    // 使用 Redis info 指令
    return this._redisClient.info();
  }

  async flushAll(): Promise<'OK'> {
    return this._redisClient.flushall();
  }

  async close(): Promise<'OK'> {
    return this._redisClient.quit();
  }
}

/**
 * Composable cache.
 * @module src/init/cache
 * @returns {Cache} The cache-layer
 */
export function useCache(): Cache {
  const client = new Redis(redisUrl, {
    keyPrefix: `${redisNamespace}:`,
  });
  return new Cache(client);
}
