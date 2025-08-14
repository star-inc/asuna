// Asuna - Tiny and blazing-fast microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

import { Router } from 'itty-router';
import {
  type AsunaRegister,
  rootRouter,
} from '../init/router';

// Create a router instance
const router = Router({
  base: '/example', // base is required for stripping prefix
});

router.get('/', (): Response => {
  return new Response('Hello, world!');
});

router.get('/hello/:name', (request: { params: { name: string } }): Response => {
  const { name } = request.params;
  return new Response(`Hello, ${name}!`);
});

// Export asuna register
const register: AsunaRegister = () => {
  // Register the routes with the root router
  rootRouter.all('/example/*', router.fetch);
};

export default register;
