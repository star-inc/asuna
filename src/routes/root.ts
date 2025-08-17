// Asuna - A blazing-fast, progressive microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

import { StatusCodes } from 'http-status-codes';
import {
  type AsunaRegister,
  rootRouter,
} from '../init/router';

// Export asuna register
const register: AsunaRegister = () => {
  // API Index Message
  rootRouter.get('/', async (_req) => {
    const htmlPath = new URL('../../views/index.html', import.meta.url);
    const htmlContent = await Bun.file(htmlPath).text();
    return new Response(htmlContent, {
      status: StatusCodes.OK,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  });

  // The handler of health check
  rootRouter.get('/healthz', (_req) => {
    return new Response('blazing-asuna', {
      status: StatusCodes.OK,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  });

  // The handler for robots.txt (deny all friendly robots)
  rootRouter.get('/robots.txt', (_req) => {
    return new Response('User-agent: *\nDisallow: /', {
      status: StatusCodes.OK,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  });
};

export default register;
