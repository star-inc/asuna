// Asuna - Tiny microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

import {
  APP_DESCRIPTION,
  APP_NAME,
} from './src/init/const';

import {
  instanceId,
  instanceStartupTime,
  instanceUrl,
} from './src/init/instance';
import {
  invokeApp,
} from './src/execute';

const routerNames: string[] = [
  'root',
  'example',
];

// Define display
const displayStatus = () => {
  console.info(APP_NAME);
  console.info('====');
  console.info(APP_DESCRIPTION, '\n');
  console.info('[Routes loaded]:', routerNames.join(', '));
  console.info('[Startup Time]:', instanceStartupTime, '\n');
  console.info('[Instance ID]:', instanceId);
  console.info('[Instance URL]:', instanceUrl);
};

invokeApp().
  loadRoutes(routerNames).
  execute().
  then(displayStatus);
