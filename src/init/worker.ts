// Asuna - A blazing-fast, progressive microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

import { serve } from 'bun';
import {
  rootRouter,
} from '../init/router.ts';
import {
  type AsunaRegister,
} from '../init/router';
import {
  type Message,
  onMessage,
  setupMessageBox,
  setupProcess,
} from './instance.ts';

interface AsunaRegisterModule {
    default: AsunaRegister;
}

// Declare self
declare let self: Worker;

const pendingPromises: Promise<void>[] = [];

/**
 * Load route modules dynamically.
 * @param routerNames - The names of the routers to load.
 */
function loadRoutes(routerNames: string[]): void {
  // Map route names to their file URLs
  const routeDirectory = new URL('../routes/', import.meta.url);
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
}

/**
 * Run the worker server.
 * @param message - The startup message containing router names.
 */
async function runWorker(message: Message): Promise<void> {
  // Load routes
  const { routerNames } = message;
  loadRoutes(routerNames as string[]);

  // Wait for all route registrations to complete
  const results = await Promise.allSettled(pendingPromises);
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.warn('Route registration failed:', result.reason);
    }
  });

  // Get the fetch function from the root router
  const { fetch } = rootRouter;

  // Start the server
  serve({ fetch, reusePort: true });
}

// Setup message box
setupMessageBox(self);

// Setup process
setupProcess();

// Start the server
onMessage('startup', runWorker);
