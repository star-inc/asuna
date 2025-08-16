// Asuna - Tiny and blazing-fast microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

import { serve } from 'bun';
import {
  type AsunaRegister,
  rootRouter,
} from './init/router';

interface Asuna {
    loadRoutes: (routerNames: string[]) => Asuna;
    execute: () => Promise<void>;
}

interface AsunaRegisterModule {
    default: AsunaRegister;
}

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

async function execute(): Promise<void> {
  // Get the fetch function from the root router
  const { fetch } = rootRouter;

  // Wait for all route registrations to complete
  await Promise.allSettled(pendingPromises);

  // Start the server
  serve({ fetch });

  // Send application ready event
  process.send?.('ready');
}
