// Asuna - A blazing-fast, progressive microservice framework.
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

import {
  EventEmitter,
} from 'events';

// Define instance id
export const instanceId = `${APP_NAME}#${nanoid()}`;

// Define instance http url (aka. canonical url)
export const instanceUrl = get('INSTANCE_URL');

// Define instance startup time
export const instanceStartupTime = new Date();

// Define instance context
export const instanceContext = new Map();

// Define message interface
export interface Message {
  type: string;
  [key: string]: unknown;
}

// Define message listener
export type MessageListener =
  (message: Message) => void | Promise<void>;

// Message bus for IPC simulation
const messageBox = new EventEmitter();

/**
 * Register message box on workers.
 * @param worker - The worker
 */
export function setupMessageBox(worker: Worker): void {
  worker.onmessage = (event: MessageEvent) => {
    const { type, ...payload } = event.data as Message;
    messageBox.emit(type, payload);
  };
}

/**
 * Register message listener.
 * @param type - The message type.
 * @param listener - The message listener.
 */
export function onMessage(
  type: string,
  listener: MessageListener,
): void {
  messageBox.on(type, listener);
}

/**
 * Send message to other instances.
 * @param type - The message type.
 * @param payload - The message payload.
 * @returns The message.
 */
export function toMessage(type: string, payload: Record<string, unknown>): Message {
  return { type, ...payload };
}
