// Asuna - A blazing-fast, progressive microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

// mysql-layer is used for managing MySQL cluster connections.

// Import modules
import { getSplitted } from '../config';
import mysql, { type PoolCluster, type PoolConnection } from 'mysql2/promise';

// Read multiple MySQL cluster configs
// (comma separated, format: mysql://user:pass@host:port/db)
const clusterConfigs = getSplitted('MYSQL_CLUSTERS');

/**
 * Asuna MySQL Cluster.
 * @class MySQL
 * The unified MySQL cluster-layer for the application.
 */
class MySQL {
  /**
   * The PoolCluster instance.
   * @type {PoolCluster}
   */
  private _cluster: PoolCluster;

  /**
   * Construct the MySQL cluster.
   */
  constructor() {
    this._cluster = mysql.createPoolCluster();
    // Register all cluster configs by URI
    clusterConfigs.forEach((uri, idx) => {
      this._cluster.add(`group${idx}`, uri);
    });
  }

  /**
   * Get a connection from the specified group.
   * @param {string} [group] - The group name.
   * @returns {Promise<PoolConnection>} The MySQL connection.
   */
  async getConnection(group?: string): Promise<PoolConnection> {
    if (group) {
      return this._cluster.getConnection(group);
    }
    return this._cluster.getConnection();
  }

  /**
   * Execute SQL query (auto get/release connection).
   * @template T
   * @param {string} sql - The SQL query string.
   * @param {unknown[]} [params] - The query parameters.
   * @param {string} [group] - The group name.
   * @returns {Promise<T[]>} The query result rows.
   */
  async query<T = unknown>(sql: string, params?: unknown[], group?: string): Promise<T[]> {
    const conn = await this.getConnection(group);
    try {
      const [rows] = await conn.query(sql, params);
      return rows as T[];
    } finally {
      conn.release();
    }
  }

  /**
   * Close all connection pools.
   * @returns {Promise<void>} Resolves when all pools are closed.
   */
  async close(): Promise<void> {
    await this._cluster.end();
  }
}

/**
 * Composable MySQL cluster.
 * @module src/init/mysql
 * @returns {MySQL} The MySQL cluster-layer
 */
export function useMySQL(): MySQL {
  return new MySQL();
}
