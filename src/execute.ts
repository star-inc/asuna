// Asuna - Tiny and blazing-fast microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

import {
  type AsunaRegister,
} from './init/router';

interface Asuna {
    loadRoutes: (routerNames: string[]) => Asuna;
    execute: () => Promise<Map<string, Worker>>;
}

interface AsunaRegisterModule {
    default: AsunaRegister;
}

// Define worker script URL
export const workerScriptUrl = new URL('./init/worker.ts', import.meta.url);

export function invokeApp(): Asuna {
  return {
    loadRoutes,
    execute,
  };
}

const pendingPromises: Promise<void>[] = [];

function loadRoutes(routerNames: string[]): Asuna {
  // Map route names to their file URLs
  const routeDirectory = new URL('routes/', import.meta.url);
  const routeFilenames = routerNames.map(
    (n) => new URL(`${n}.ts`, routeDirectory),
  );

  // Create a promise for each route module
  const routerMappers: Promise<AsunaRegisterModule>[] = routeFilenames.map(
    (n) => import(n.toString()),
  );

  // Register each route module
  pendingPromises.push(...routerMappers.map(
    (c) => c.then((f) => f.default()),
  ));

  // Return application invoker
  return invokeApp();
}

async function execute(): Promise<Map<string, Worker>> {
  // Wait for all route registrations to complete
  await Promise.allSettled(pendingPromises);

  // Setup workers
  const workerPool = new Map<string, Worker>();
  const workerCount = navigator.hardwareConcurrency || 1;

  // Startup workers
  for (let i = 0; i < workerCount; i++) {
    const workerKey = `worker#${i}`;
    const worker = new Worker(workerScriptUrl);
    workerPool.set(workerKey, worker);
  }

  // Send application ready event
  process.send?.('ready');

  // Return worker pool
  return workerPool;
}
