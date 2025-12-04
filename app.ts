// Asuna - A blazing-fast, progressive microservice framework.
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

// Define router names
const routerNames: string[] = [
  'root',
  'example',
];

// Define init handlers
const initHandlers = [
  () => {
    console.warn('The example to handle init signals.');
  },
];

// Define exit handlers
const exitHandlers = [
  () => {
    console.warn('The example to handle exit signals.');
  },
];

// Define display status
const displayStatus = (workerPool: Map<string, Worker>) => {
  const workerUnit = workerPool.size > 1 ? 'workers' : 'worker';
  console.info(APP_NAME);
  console.info('====');
  console.info(APP_DESCRIPTION, '\n');
  console.info('[Workers Started]:', workerPool.size, workerUnit);
  console.info('[Routes Loaded]:', routerNames.join(', '));
  console.info('[Startup Time]:', instanceStartupTime, '\n');
  console.info('[Instance ID]:', instanceId);
  console.info('[Instance URL]:', instanceUrl);
};

// Mount application and execute it
invokeApp().
  loadRoutes(routerNames).
  loadInits(initHandlers).
  loadExits(exitHandlers).
  execute().
  then(displayStatus);
