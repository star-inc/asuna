// Asuna - Tiny and blazing-fast microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

import { serve } from "bun";
import {
  rootRouter,
} from "../init/router.ts";
import {
  type AsunaRegister,
} from '../init/router';
import {
    onMessage,
    setupMessageBox,
    type Message,
} from "./instance.ts";

interface AsunaRegisterModule {
    default: AsunaRegister;
}

// Declare self
declare var self: Worker;

const pendingPromises: Promise<void>[] = [];

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

async function runWorker(message: Message): Promise<void> {
  // Load routes
  const { routerNames } = message;
  loadRoutes(routerNames);

  // Wait for all route registrations to complete
  await Promise.allSettled(pendingPromises);

  // Get the fetch function from the root router
  const { fetch } = rootRouter;

  // Start the server
  serve({ fetch, reusePort: true });
}

// Setup message box
setupMessageBox(self);

// Start the server
onMessage('startup', runWorker);
