// Asuna - A blazing-fast, progressive microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

// mysql-layer is used for managing MySQL cluster connections.

// Import modules
import { getSplitted } from '../config';
import mysql, { type PoolCluster, type PoolConnection } from 'mysql2/promise';
import {
  addInstanceConnection,
  type InstanceConnection,
  instanceContext,
} from './instance';

// Read multiple MySQL cluster configs
// (comma separated, format: mysql://user:pass@host:port/db)
const clusterConfigs = getSplitted('MYSQL_CLUSTERS');

/**
 * Asuna MySQL Cluster.
 * The unified MySQL cluster-layer for the application.
 */
class MySQL implements InstanceConnection {
  /**
   * The PoolCluster instance.
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
   * @param [group] - The group name.
   * @returns The MySQL connection.
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
   * @param sql - The SQL query string.
   * @param [params] - The query parameters.
   * @param [group] - The group name.
   * @returns The query result rows.
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
   * @returns Resolves when all pools are closed.
   */
  async close(): Promise<void> {
    await this._cluster.end();
  }
}

/**
 * Composable MySQL cluster.
 * @returns The MySQL cluster layer.
 */
export function useMySQL(): MySQL {
  if (instanceContext.has('MySQL')) {
    return instanceContext.get('MySQL') as MySQL;
  }

  const mysqlInstance = new MySQL();
  addInstanceConnection(mysqlInstance);
  instanceContext.set('MySQL', mysqlInstance);
  return mysqlInstance;
}
