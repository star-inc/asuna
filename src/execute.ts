// Asuna - A blazing-fast, progressive microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

import { toMessage } from './init/instance';

interface Asuna {
    loadRoutes: (routerNames: string[]) => Asuna;
    execute: () => Promise<Map<string, Worker>>;
}

// Define worker script URL
export const workerScriptUrl = new URL('./init/worker.ts', import.meta.url);

// Define worker startup context
export const workerStartupContext = new Map<string, unknown>();

// Define Asuna cores function
export function asunaCores(): number {
  const envCount = Number(Bun.env.ASUNA_CORES);

  if (Number.isInteger(envCount) && envCount > 0) {
    return envCount;
  }

  return navigator.hardwareConcurrency || 1;
}

// Define application invoker
export function invokeApp(): Asuna {
  return {
    loadRoutes,
    execute,
  };
}

// Define load routes function
function loadRoutes(routerNames: string[]): Asuna {
  // Set context
  workerStartupContext.set('routerNames', routerNames);

  // Return application invoker
  return invokeApp();
}

// Define execute function
async function execute(): Promise<Map<string, Worker>> {
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
