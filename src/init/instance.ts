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
  EventEmitter,
} from 'events';

import {
  get,
} from '../config.ts';

// Instance connection interface
export interface InstanceConnection {
  close(): Promise<void>;
}

// Init callback type
export type InitCallback = () => Promise<void> | void;

// Exit callback type
export type ExitCallback = () => Promise<void> | void;

// Message interface
export interface Message {
  type: string;
  [key: string]: unknown;
}

// Message listener type
export type MessageListener = (message: Message) => void | Promise<void>;

// Exit signals
const exitSignals = ['SIGINT', 'SIGTERM'];

// Instance id
export const instanceId = `${APP_NAME}#${nanoid()}`;

// Instance http url (aka. canonical url)
export const instanceUrl = get('INSTANCE_URL');

// Instance startup time
export const instanceStartupTime = new Date();

// Instance context
export const instanceContext = new Map<string, unknown>();

// Message bus for IPC simulation
const messageBox = new EventEmitter();

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
}

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
 * Execute all exit handlers and close connections.
 */
async function runExitHandlers(): Promise<void> {
  // Get exit handlers from pool
  const exitHandlers =
    (instanceContext.get('ExitHandlers') as ExitCallback[]) || [];
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
}

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
export function onMessage(type: string, listener: MessageListener): void {
  messageBox.on(type, listener);
}

/**
 * Send message to other instances.
 * @param type - The message type.
 * @param payload - The message payload.
 * @returns The message.
 */
export function toMessage(
  type: string,
  payload: Record<string, unknown>,
): Message {
  return { type, ...payload };
}

/**
 * Setup worker pool for graceful shutdown (primary process only).
 * @param workerPool - The worker pool map.
 */
export function setupWorkerPool(workerPool: Map<string, Worker>): void {
  instanceContext.set('WorkerPool', workerPool);

  // Track shutdown acknowledgments from workers
  let shutdownCount = 0;
  const workerCount = workerPool.size;

  // Handle worker message
  const handleWorkerMessage = (event: MessageEvent) => {
    const { type, ...payload } = event.data as Message;

    // Forward non-shutdown messages to message box
    if (type !== 'shutdown-complete') {
      messageBox.emit(type, payload);
      return;
    }

    // Handle shutdown complete
    shutdownCount++;
    if (shutdownCount < workerCount) {
      return;
    }

    // All workers completed, exit primary
    runExitHandlers().then(() => {
      console.info('\n[Primary] All workers shut down, exiting...');
      process.exit(0);
    });
  };

  // Handle exit signal
  const handleExitSignal = (signal: string) => () => {
    console.info(`\n[${signal}] Initiating graceful shutdown...`);
    // Notify all workers to shutdown
    workerPool.forEach((worker) => {
      worker.postMessage(toMessage('shutdown', {}));
    });
  };

  // Listen for messages from workers
  workerPool.forEach((worker) => {
    worker.onmessage = handleWorkerMessage;
  });

  // Attach exit signal handlers for primary process
  exitSignals.forEach((signal) => {
    process.on(signal, handleExitSignal(signal));
  });
}

/**
 * Setup process initialization for worker instance.
 * @param workerSelf - The worker self reference.
 */
export function setupProcess(workerSelf: Worker): void {
  // Listen for shutdown message from primary
  onMessage('shutdown', async () => {
    console.info(`[${instanceId}] Shutting down...`);
    // Run exit handlers
    await runExitHandlers();
    // Notify primary that shutdown is complete
    workerSelf.postMessage(toMessage('shutdown-complete', {}));
  });
}
