// Asuna - Tiny and blazing-fast microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

import { toMessage } from "./init/instance";

interface Asuna {
    loadRoutes: (routerNames: string[]) => Asuna;
    execute: () => Promise<Map<string, Worker>>;
}

// Define worker script URL
export const workerScriptUrl = new URL('./init/worker.ts', import.meta.url);

// Define worker startup context
export const workerStartupContext = new Map<string, any>();

export function invokeApp(): Asuna {
  return {
    loadRoutes,
    execute,
  };
}

function loadRoutes(routerNames: string[]): Asuna {
  // Set context
  workerStartupContext.set('routerNames', routerNames);

  // Return application invoker
  return invokeApp();
}

async function execute(): Promise<Map<string, Worker>> {
  // Setup workers
  const workerPool = new Map<string, Worker>();
  const workerCount = navigator.hardwareConcurrency || 1;

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
