// Asuna - A blazing-fast, progressive microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

// define application instance variables here.
// to be used for identity in clusters.

// Import constants
import {
  APP_NAME,
} from './const.ts';

// Import modules
import {
  nanoid,
} from 'nanoid';

import {
  get,
} from '../config.ts';

import {
  EventEmitter,
} from 'events';

// Define instance id
export const instanceId = `${APP_NAME}#${nanoid()}`;

// Define instance http url (aka. canonical url)
export const instanceUrl = get('INSTANCE_URL');

// Define instance startup time
export const instanceStartupTime = new Date();

// Define instance context
export const instanceContext = new Map<string, unknown>();

// Define instance connection interface
export interface InstanceConnection {
  close(): Promise<void>;
}

/**
 * Add instance connection to pool
 * @param connection - The instance connection
 */
export function addInstanceConnection(connection: InstanceConnection): void {
  if (!instanceContext.has('ConnectionPool')) {
    instanceContext.set('ConnectionPool', []);
  }
  const pool = instanceContext.get('ConnectionPool') as unknown[];
  pool.push(connection);
}

// Define init callback type
export type InitCallback = () => Promise<void> | void;

/**
 * Add init handler to pool
 * @param handler - The init handler
 */
export function onInit(handler: InitCallback): void {
  if (!instanceContext.has('InitHandlers')) {
    instanceContext.set('InitHandlers', []);
  }
  const pool = instanceContext.get('InitHandlers') as InitCallback[];
  pool.push(handler);
}

// Define exit callback type
export type ExitCallback = () => Promise<void> | void;

/**
 * Add exit handler to pool
 * @param handler - The exit handler
 */
export function onExit(handler: ExitCallback): void {
  if (!instanceContext.has('ExitHandlers')) {
    instanceContext.set('ExitHandlers', []);
  }
  const pool = instanceContext.get('ExitHandlers') as ExitCallback[];
  pool.push(handler);
}

/**
 * Close all instance connections
 */
export async function closeInstanceConnections(): Promise<void> {
  if (!instanceContext.has('ConnectionPool')) {
    return;
  }
  const pool = instanceContext.get('ConnectionPool') as InstanceConnection[];
  for (const connection of pool) {
    await connection.close();
  }
};

// Define message interface
export interface Message {
  type: string;
  [key: string]: unknown;
}

// Define message listener
export type MessageListener =
  (message: Message) => void | Promise<void>;

// Message bus for IPC simulation
const messageBox = new EventEmitter();

/**
 * Register message box on workers.
 * @param worker - The worker
 */
export function setupMessageBox(worker: Worker): void {
  worker.onmessage = (event: MessageEvent) => {
    const { type, ...payload } = event.data as Message;
    messageBox.emit(type, payload);
  };
}

/**
 * Register message listener.
 * @param type - The message type.
 * @param listener - The message listener.
 */
export function onMessage(
  type: string,
  listener: MessageListener,
): void {
  messageBox.on(type, listener);
}

/**
 * Send message to other instances.
 * @param type - The message type.
 * @param payload - The message payload.
 * @returns The message.
 */
export function toMessage(type: string, payload: Record<string, unknown>): Message {
  return { type, ...payload };
}

// Define exit signals
const exitSignals = [
  'SIGINT',
  'SIGTERM',
];

// Define exit handler
const exitHandler = (signal: string) => async () => {
  // Get exit handlers from pool
  const exitHandlers = instanceContext.get('ExitHandlers') as ExitCallback[] || [];
  const promises = exitHandlers.map((f) => f());
  // Wait for all exit handlers resolved
  const results = await Promise.allSettled(promises);
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error(`[Exit Handler Error] ${result.reason}`);
    }
  });
  // Close all instance connections
  await closeInstanceConnections();
  // Log shutdown message
  console.info(`\n[${signal}] Shutting down gracefully...`);
  // Send exit signal
  process.exit(0);
};

/**
 * Setup process initialization either for primary or worker instance.
 */
export function setupProcess(): void {
  // Attach exit handlers
  exitSignals.forEach((signal) => {
    process.on(signal, exitHandler(signal));
  });
}
