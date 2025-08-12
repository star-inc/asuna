// Asuna - Tiny microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

import { Router } from 'itty-router';
import {
  type AsunaRegister,
  rootRouter,
} from '../init/router';

const router = Router();

router.get('/', (): Response => {
  return new Response('Hello, world!');
});

router.get('/hello/:name', (request: { params: { name: string } }): Response => {
  const { name } = request.params;
  return new Response(`Hello, ${name}!`);
});

const register: AsunaRegister = () => {
  // Register the routes with the root router
  rootRouter.use('/example', router);
};

export default register;
