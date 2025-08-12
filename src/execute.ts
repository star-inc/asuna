// Asuna - Tiny microservice framework.
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

function loadRoutes(routerNames: string[]): Asuna {
  const routeDirectory = new URL('routes/', import.meta.url);
  const routeFilenames = routerNames.map(
    (n) => new URL(`${n}.ts`, routeDirectory),
  );

  const routerMappers: Promise<AsunaRegisterModule>[] = routeFilenames.map(
    (n) => import(n.toString()),
  );
  routerMappers.forEach((c) => c.then(
    (f) => f.default(),
  ));

  // Return application invoker
  return invokeApp();
}

function execute(): Promise<void> {
  const { fetch } = rootRouter;
  serve({ fetch });

  return Promise.resolve();
}
