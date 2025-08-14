// Asuna - Tiny microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

import { getSplitted } from '../config';
import mysql, {
  type PoolCluster,
  type PoolConnection,
} from 'mysql2/promise';

// Read multiple MySQL cluster configs (comma separated, format: mysql://user:pass@host:port/db)
const clusterConfigs = getSplitted('MYSQL_CLUSTERS');

class MySQL {
  private _cluster: PoolCluster;

  constructor() {
    this._cluster = mysql.createPoolCluster();
    // Register all cluster configs by URI
    clusterConfigs.forEach((uri, idx) => {
      this._cluster.add(`group${idx}`, uri);
    });
  }

  /**
   * Get a connection from the specified group
   */
  async getConnection(group?: string): Promise<PoolConnection> {
    if (group) {
      return this._cluster.getConnection(group);
    }
    return this._cluster.getConnection();
  }

  /**
   * Execute SQL query (auto get/release connection)
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
   * Close all connection pools
   */
  async close(): Promise<void> {
    await this._cluster.end();
  }
}

/**
 * Composable MySQL cluster
 * @returns {MySQL} MySQL cluster instance
 */
export function useMySQL(): MySQL {
  return new MySQL();
}
