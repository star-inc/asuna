// Asuna - A blazing-fast, progressive microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

// queue-layer is used for delivering messages between services.

// Import modules
import { get, getEnabled } from '../config.ts';
import amqp from 'amqplib';

import {
  instanceId,
} from './instance.ts';

// Read configuration
const amqpUrl = get('AMPQ_URL');
const amqpDurable = getEnabled('AMPQ_DURABLE');

/**
 * @callback SubscribeCallback
 * @param {amqp.ConsumeMessage|null} message - The message.
 * @returns {void}
 */
type SubscribeCallback = (message: amqp.ConsumeMessage|null) => void;

/**
 * Asuna Queue.
 * @class Queue
 * The unified queue-layer for the application.
 */
class Queue {
  /**
   * The amqp instance.
   * @type {amqp.ChannelModel|undefined}
   */
  _amqpClient: amqp.ChannelModel|undefined;

  /**
   * The amqp channel instance.
   * @type {amqp.Channel|undefined}
   */
  _channel: amqp.Channel|undefined;

  /**
   * The Asuna queue instance.
   * @param {amqp.ChannelModel} client - The queue client.
   * @param {amqp.Channel} channel - The queue channel.
   */
  constructor(client: amqp.ChannelModel, channel: amqp.Channel) {
    this._amqpClient = client;
    this._channel = channel;
  }

  /**
   * Get the raw amqplib client.
   * @returns {amqp.ChannelModel|undefined} The client.
   */
  rawClient(): amqp.ChannelModel|undefined {
    return this._amqpClient;
  }

  /**
   * Get the raw amqplib channel.
   * @returns {amqp.Channel|undefined} The channel.
   */
  rawChannel(): amqp.Channel|undefined {
    return this._channel;
  }

  /**
   * Subscribe to a topic.
   * @param {string} topic - The topic to subscribe.
   * @param {SubscribeCallback} callback - The callback function.
   * @returns {void}
   */
  subscribe(topic: string, callback: SubscribeCallback): void {
    if (!this._channel) throw new Error('Channel is not initialized');
    this._channel.assertQueue(topic, { durable: amqpDurable });
    this._channel.consume(topic, callback, { noAck: true });
  }

  /**
   * Receive a message from a topic.
   * @param {string} topic - The topic to receive.
   * @param {SubscribeCallback} callback - The callback function.
   * @returns {void}
   */
  receive(topic: string, callback: SubscribeCallback): void {
    if (!this._channel) throw new Error('Channel is not initialized');
    this._channel.assertQueue(topic, { durable: amqpDurable });
    this._channel.consume(topic, callback, { noAck: false });
  }

  /**
   * Deliver a message to a topic.
   * @param {string} topic - The topic to send.
   * @param {Buffer} content - The content to send.
   * @returns {void}
   */
  deliver(topic: string, content: Buffer): void {
    if (!this._channel) throw new Error('Channel is not initialized');
    const correlationId = instanceId;
    this._channel.assertQueue(topic, { durable: amqpDurable });
    this._channel.sendToQueue(topic, content, { correlationId });
  }

  /**
   * Close the queue-layer.
   * @returns {Promise<void>}
   */
  close(): Promise<void> {
    if (!this._amqpClient) {
      return Promise.resolve();
    }
    return this._amqpClient.close();
  }
}

/**
 * Composable Queue.
 * @module src/init/queue
 * @returns {Promise<Queue>} The queue-layer
 */
export async function useQueue(): Promise<Queue> {
  // Construct the amqp client
  const client = await amqp.connect(amqpUrl);

  // Create the channel
  const channel = await client.createChannel();

  // Construct the queue-layer
  return new Queue(client, channel);
}
