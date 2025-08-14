// Asuna - Tiny and blazing-fast microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

import { StatusCodes } from 'http-status-codes';
import {
  type AsunaRegister,
  rootRouter,
} from '../init/router';

// Export asuna register
const register: AsunaRegister = () => {
  // API Index Message
  rootRouter.get('/', (_req) => {
    const meetMessage = `
        Star Inc. Asuna Framework <br />
        <a href="https://github.com/star-inc/asuna" target="_blank">
            https://github.com/star-inc/asuna
        </a>
        `;
    return new Response(meetMessage, {
      status: StatusCodes.IM_A_TEAPOT,
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
