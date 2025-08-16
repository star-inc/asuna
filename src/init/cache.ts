// Asuna - A blazing-fast, progressive microservice framework.
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
  /**
   * The redis instance.
   * @type {Redis|undefined}
   */
  private _redisClient: RedisType;

  /**
   * The Asuna cache instance.
   * @param {Redis} client - The cache client.
   */
  constructor(client: RedisType) {
    this._redisClient = client;
  }

  /**
   * Get the raw ioredis client.
   * @returns {Redis} The client.
   */
  rawClient(): RedisType {
    return this._redisClient;
  }

  /**
   * Check if a key exists in the cache.
   * @param {string} key - The cache key.
   * @returns {boolean} True if the key exists, false otherwise.
   */
  async has(key: string): Promise<boolean> {
    const exists = await this._redisClient.exists(key);
    return exists === 1;
  }

  /**
   * Get a cached value via its key.
   * @param {string} key - The cache key.
   * @returns {Promise<any>} The cached element.
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const value = await this._redisClient.get(key);
    return value ? JSON.parse(value) as T : null;
  }

  /**
   * Get multiple cached keys at once.
   * @param {string[]} keys - An array of cache keys.
   * @returns {Promise<any[]>} An array of cached elements.
   */
  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    const values = await this._redisClient.mget(...keys);
    return values.map(v => (v ? JSON.parse(v) as T : null));
  }

  /**
   * Set a cached key with the given value.
   * @param {string} key - The cache key.
   * @param {any} value - The value to cache.
   * @param {number} ttl - The time to live for the cache.
   * @returns {Promise<boolean>} True if the key is set, false otherwise.
   */
  async set(key: string, value: unknown, ttl: number): Promise<'OK'> {
    const strValue = JSON.stringify(value);
    return this._redisClient.setex(key, ttl, strValue);
  }

  /**
   * Set multiple cached keys with the given values.
   * @param {object[]} keyValueSet - An array of object.
   * @returns {Promise<boolean>} True if all keys are set, false otherwise.
   */
  async mset(keyValueSet: { key: string; value: unknown }[]): Promise<'OK'> {
    const flat: string[] = [];
    keyValueSet.forEach(({ key, value }) => {
      flat.push(key, JSON.stringify(value));
    });
    return this._redisClient.mset(...flat);
  }

  /**
   * Delete a cached values via their keys.
   * @param {string} keys - The cache key.
   * @returns {Promise<boolean>} True if the key is deleted, false otherwise.
   */
  async del(keys: string | string[]): Promise<number> {
    if (Array.isArray(keys)) {
      return this._redisClient.del(...keys);
    }
    return this._redisClient.del(keys);
  }

  /**
   * Set a key's time to live in seconds.
   * @param {string} key - The cache key.
   * @param {number} ttl - The time to live for the cache.
   * @returns {Promise<boolean>} True if the key is set, false otherwise.
   */
  async ttl(key: string, ttl: number): Promise<boolean> {
    const result = await this._redisClient.expire(key, ttl);
    return result === 1;
  }

  /**
   * Get the time to live (TTL) of a cached value.
   * @param {string} key - The cache key.
   * @returns {Promise<number>} The TTL in seconds.
   */
  async getTTL(key: string): Promise<number> {
    return this._redisClient.ttl(key);
  }

  /**
   * List all keys within this cache
   * @returns {Promise<string[]>} An array of all keys.
   */
  async keys(): Promise<string[]> {
    return this._redisClient.keys('*');
  }

  /**
   * Get cache statistics.
   * @returns {object[]} An array of cache statistics.
   */
  async getStats(): Promise<string> {
    return this._redisClient.info();
  }

  /**
   * Flush the whole data and reset the cache.
   * @returns {Promise<boolean>} true if the cache is flushed.
   */
  async flushAll(): Promise<'OK'> {
    return this._redisClient.flushall();
  }

  /**
   * This will clear the interval timeout which is set on checkperiod option.
   * @returns {Promise<boolean>} true if the cache is cleared and closed.
   */
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
