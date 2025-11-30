// Asuna - A blazing-fast, progressive microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

/**
 * Get the current NODE_ENV value.
 * @returns The NODE_ENV value.
 */
export function getNodeEnv() {
  return get('NODE_ENV');
}

/**
 * Get the current RUNTIME_ENV value.
 * @returns The RUNTIME_ENV value.
 */
export function getRuntimeEnv() {
  return get('RUNTIME_ENV');
}

/**
 * Get the current INSTANCE_MODE value.
 * @returns The INSTANCE_MODE value.
 */
export function getInstanceMode() {
  return get('INSTANCE_MODE');
}

/**
 * Check is production mode.
 * @returns True if it's production.
 */
export function isProduction() {
  return getNodeEnv() === 'production';
}

/**
 * Get the value from config or with an error thrown.
 * @param key - The config key.
 * @returns The config value.
 * @throws {Error} If value is undefined, throw an error.
 */
export function get(key: string): string {
  const value = Bun.env[key];
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
 * @param key - The config key.
 * @returns The boolean value.
 */
export function getEnabled(key: string): boolean {
  return get(key) === 'yes';
}

/**
 * Get the array value from config.
 * @param key - The config key.
 * @param [separator] - The separator.
 * @returns The array value.
 */
export function getSplitted(key: string, separator: string = ','): string[] {
  return get(key).
    split(separator).
    filter((i) => i).
    map((i) => i.trim());
}
