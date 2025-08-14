// Asuna - Tiny and blazing-fast microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

// define application instance variables here.
// to be used for identity in clusters.

// Import constants
import {
  APP_NAME,
} from './const.ts';

// Import modules
import {
  nanoid,
} from 'nanoid';

import {
  get,
} from '../config.ts';

// Define instance id
export const instanceId = `${APP_NAME}#${nanoid()}`;

// Define instance http url (aka. canonical url)
export const instanceUrl = get('INSTANCE_URL');

// Define instance startup time
export const instanceStartupTime = new Date();
