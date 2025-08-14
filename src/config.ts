// Asuna - Tiny microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

/**
 * Get the current NODE_ENV value.
 * @module src/config
 * @returns {string} The NODE_ENV value.
 */
export function getNodeEnv() {
  return get('NODE_ENV');
}

/**
 * Get the current RUNTIME_ENV value.
 * @module src/config
 * @returns {string} The RUNTIME_ENV value.
 */
export function getRuntimeEnv() {
  return get('RUNTIME_ENV');
}

/**
 * Get the current INSTANCE_MODE value.
 * @module src/config
 * @returns {string} The INSTANCE_MODE value.
 */
export function getInstanceMode() {
  return get('INSTANCE_MODE');
}

/**
 * Check is production mode.
 * @module src/config
 * @returns {boolean} True if it's production.
 */
export function isProduction() {
  return getNodeEnv() === 'production';
}

/**
 * Get the value from config or with an error thrown.
 * @module src/config
 * @param {string} key - The config key.
 * @returns {string} The config value.
 * @throws {Error} If value is undefined, throw an error.
 */
export function get(key: string): string {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`config key ${key} is undefined`);
  }
  if (value === '_disabled_') {
    return '';
  }
  return value;
}

/**
 * Get the bool value from config, if yes, returns true.
 * @module src/config
 * @param {string} key - The config key.
 * @returns {boolean} The boolean value.
 */
export function getEnabled(key: string): boolean {
  return get(key) === 'yes';
}

/**
 * Get the array value from config.
 * @module src/config
 * @param {string} key - The config key.
 * @param {string} [separator] - The separator.
 * @returns {string[]} The array value.
 */
export function getSplitted(key: string, separator: string = ','): string[] {
  return get(key).
    split(separator).
    filter((i) => i).
    map((i) => i.trim());
}
