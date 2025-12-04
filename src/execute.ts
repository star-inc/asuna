// Asuna - A blazing-fast, progressive microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

import { toMessage } from './init/instance';

/**
 * Asuna application invoker interface.
 */
export interface Asuna {
    loadRoutes: (routerNames: string[]) => Asuna;
    loadInits: (initHandlers: VoidCallback[]) => Asuna;
    loadExits: (exitHandlers: VoidCallback[]) => Asuna;
    execute: () => Promise<Map<string, Worker>>;
}

/**
 * @returns {Promise<void>|void}
 */
export type VoidCallback = () => Promise<void> | void;

// Define worker script URL
export const workerScriptUrl = new URL('./init/worker.ts', import.meta.url);

// Define worker startup context
export const workerStartupContext = new Map<string, unknown>();

/**
 * Determine the number of CPU cores to use.
 * @returns The number of cores to use.
 */
export function asunaCores(): number {
  const envCount = Number(Bun.env.ASUNA_CORES);

  if (Number.isInteger(envCount) && envCount > 0) {
    return envCount;
  }

  return navigator.hardwareConcurrency || 1;
}

/**
 * Invoke the Asuna application.
 * @returns The Asuna application invoker.
 */
export function invokeApp(): Asuna {
  return {
    loadRoutes,
    loadInits,
    loadExits,
    execute,
  };
}

/**
 * Load route modules dynamically.
 * @param routerNames - The names of the routers to load.
 * @returns The Asuna application invoker.
 */
function loadRoutes(routerNames: string[]): Asuna {
  // Set context
  workerStartupContext.set('routerNames', routerNames);

  // Return application invoker
  return invokeApp();
}

// Define initial promises
const initPromises: Promise<void>[] = [];

/**
 * Load init application handlers.
 * @param initHandlers - The init signal handlers.
 * @returns The Asuna application invoker.
 */
function loadInits(initHandlers: VoidCallback[]): Asuna {
  // Handle init signals
  const promises = initHandlers.map((f) => {
    const result = f();
    return result instanceof Promise ? result : Promise.resolve();
  });

  // Push the initial handlers onto the preparing promises
  initPromises.push(...promises);

  // Return application invoker
  return invokeApp();
}

/**
 * Load exit signal handlers.
 * @param exitHandlers - The exit signal handlers.
 * @returns The Asuna application invoker.
 */
function loadExits(exitHandlers: VoidCallback[]): Asuna {
  // Handle exit signals
  const exitHandler = async () => {
    const promises = exitHandlers.map((f) => f());
    // Wait for all exit handlers resolved
    await Promise.all(promises);
    // Send exit signal
    process.exit(0);
  };

  // Define exit signals
  const exitSignals = [
    'SIGINT',
    'SIGTERM',
  ];

  // Attach exit handlers
  exitSignals.forEach((signal) => {
    process.on(signal, () => {
      console.info(`\n[${signal}] Shutting down gracefully...`);
      exitHandler();
    });
  });

  // Return application invoker
  return invokeApp();
}

/**
 * Execute the Asuna application by starting worker instances.
 * @returns A promise that resolves to a map of worker instances.
 */
async function execute(): Promise<Map<string, Worker>> {
  // Wait for all init promises resolved
  await Promise.all(initPromises);

  // Setup workers
  const workerPool = new Map<string, Worker>();
  const workerCount = asunaCores();

  // Startup workers
  for (let i = 0; i < workerCount; i++) {
    const workerKey = `worker#${i}`;
    const worker = new Worker(workerScriptUrl);
    worker.postMessage(toMessage(
      'startup', Object.fromEntries(
        workerStartupContext,
      ),
    ));
    workerPool.set(workerKey, worker);
  }

  // Send application ready event
  process.send?.('ready');

  // Return worker pool
  return workerPool;
}
