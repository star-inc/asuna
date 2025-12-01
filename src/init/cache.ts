// Asuna - A blazing-fast, progressive microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

// cache-layer is used as an in-memory cache.

// Import modules
import { get } from '../config';
import Redis, { Redis as RedisType } from 'ioredis';
import { instanceContext } from './instance';

// Read configuration
const redisUrl: string = get('REDIS_URL');
const redisNamespace: string = get('REDIS_NAMESPACE');

/**
 * Asuna Cache.
 * The unified cache-layer for the application.
 */
class Cache {
  /**
   * The redis instance.
   */
  private _redisClient: RedisType;

  /**
   * The Asuna cache instance.
   * @param client - The cache client.
   */
  constructor(client: RedisType) {
    this._redisClient = client;
  }

  /**
   * Get the raw ioredis client.
   * @returns The client.
   */
  rawClient(): RedisType {
    return this._redisClient;
  }

  /**
   * Check if a key exists in the cache.
   * @param key - The cache key.
   * @returns True if the key exists, false otherwise.
   */
  async has(key: string): Promise<boolean> {
    const exists = await this._redisClient.exists(key);
    return exists === 1;
  }

  /**
   * Get a cached value via its key.
   * @param key - The cache key.
   * @returns The cached element.
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const value = await this._redisClient.get(key);
    return value ? JSON.parse(value) as T : null;
  }

  /**
   * Get multiple cached keys at once.
   * @param keys - An array of cache keys.
   * @returns An array of cached elements.
   */
  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    const values = await this._redisClient.mget(...keys);
    return values.map(v => (v ? JSON.parse(v) as T : null));
  }

  /**
   * Set a cached key with the given value.
   * @param key - The cache key.
   * @param value - The value to cache.
   * @param ttl - The time to live for the cache.
   * @returns The result of setting the cache.
   */
  async set(key: string, value: unknown, ttl: number): Promise<'OK'> {
    const strValue = JSON.stringify(value);
    return this._redisClient.setex(key, ttl, strValue);
  }

  /**
   * Set multiple cached keys with the given values.
   * @param keyValueSet - An array of key-value pairs.
   * @returns The result of setting the cache.
   */
  async mset(keyValueSet: { key: string; value: unknown }[]): Promise<'OK'> {
    const flat: string[] = [];
    keyValueSet.forEach(({ key, value }) => {
      flat.push(key, JSON.stringify(value));
    });
    return this._redisClient.mset(...flat);
  }

  /**
   * Delete cached values via their keys.
   * @param keys - The cache key(s).
   * @returns The number of keys deleted.
   */
  async del(keys: string | string[]): Promise<number> {
    if (Array.isArray(keys)) {
      return this._redisClient.del(...keys);
    }
    return this._redisClient.del(keys);
  }

  /**
   * Set a key's time to live in seconds.
   * @param key - The cache key.
   * @param ttl - The time to live for the cache.
   * @returns True if the key is set, false otherwise.
   */
  async ttl(key: string, ttl: number): Promise<boolean> {
    const result = await this._redisClient.expire(key, ttl);
    return result === 1;
  }

  /**
   * Get the time to live (TTL) of a cached value.
   * @param key - The cache key.
   * @returns The TTL in seconds.
   */
  async getTTL(key: string): Promise<number> {
    return this._redisClient.ttl(key);
  }

  /**
   * List all keys within the cache.
   * @returns An array of all keys.
   */
  async keys(): Promise<string[]> {
    return this._redisClient.keys('*');
  }

  /**
   * Get cache statistics.
   * @returns An object containing cache statistics.
   */
  async getStats(): Promise<string> {
    return this._redisClient.info();
  }

  /**
   * Flush the whole data and reset the cache.
   * @returns True if the cache is flushed.
   */
  async flushAll(): Promise<'OK'> {
    return this._redisClient.flushall();
  }

  /**
   * Close the cache connection and clean up resources.
   * @returns Resolves when the cache is closed.
   */
  async close(): Promise<'OK'> {
    return this._redisClient.quit();
  }
}

/**
 * Composable cache.
 * @returns The cache layer.
 */
export function useCache(): Cache {
  if (instanceContext.has('Cache')) {
    return instanceContext.get('Cache') as Cache;
  }

  const client = new Redis(redisUrl, {
    keyPrefix: `${redisNamespace}:`,
  });

  const cache = new Cache(client);
  instanceContext.set('Cache', cache);
  return cache;
}
