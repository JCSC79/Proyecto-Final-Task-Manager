import 'dotenv/config';
import amqp from 'amqplib';
import type { Channel, ConsumeMessage } from 'amqplib';
import type { ITask } from './models/task.model.ts';

const QUEUE = 'task_notifications';
const MAX_RETRY_DELAY_MS = 30_000;

/**
 * Worker Service: Consumes messages from RabbitMQ.
 * Independent process that handles background task processing.
 * Implements exponential backoff reconnection so the worker recovers
 * automatically if RabbitMQ restarts or the connection drops.
 */
async function startWorker(attempt = 1): Promise<void> {
    const delayMs = Math.min(1000 * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS);

    try {
        const rabbitmqUrl = process.env.RABBITMQ_URL;
        if (!rabbitmqUrl) {
            throw new Error('RABBITMQ_URL environment variable is required');
        }

        const connection = await amqp.connect(rabbitmqUrl);

        // Reset attempt counter on successful connection
        attempt = 1;
        console.log('[*] Worker connected to RabbitMQ.');

        // Reconnect automatically if the connection drops unexpectedly
        connection.on('error', (err: Error) => {
            console.error('[-] RabbitMQ connection error:', err.message);
        });
        connection.on('close', () => {
            console.warn('[!] RabbitMQ connection closed. Reconnecting...');
            void scheduleReconnect(1);
        });

        let channel: Channel | undefined;
        if ('createChannel' in connection) {
            channel = await (connection as { createChannel: () => Promise<Channel> }).createChannel();
        }

        if (!channel) {
            throw new Error('Could not create RabbitMQ channel');
        }

        await channel.assertQueue(QUEUE, { durable: true });
        await channel.prefetch(1);

        console.log(`[*] Worker waiting for messages in ${QUEUE}. To exit press CTRL+C`);

        channel.consume(QUEUE, (msg: ConsumeMessage | null) => {
            if (msg && channel) {
                try {
                    const content = msg.content.toString();
                    const task: ITask = JSON.parse(content);

                    console.log('--------------------------------------------');
                    console.log(`[v] Received Task: ${task.title}`);
                    console.log(`[i] Status: ${task.status}`);
                    console.log(`[i] Description: ${task.description}`);
                    console.log(`[i] ID: ${task.id}`);
                    console.log('--------------------------------------------');

                    channel.ack(msg);
                } catch (parseError) {
                    console.error('[-] Error parsing worker message:', parseError);
                    channel.nack(msg, false, false);
                }
            }
        }, { noAck: false });

    } catch (error) {
        console.error(`[-] Worker connection failed (attempt ${attempt}). Retrying in ${delayMs / 1000}s...`, error);
        void scheduleReconnect(attempt + 1);
    }
}

function scheduleReconnect(attempt: number): Promise<void> {
    const delayMs = Math.min(1000 * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS);
    return new Promise(resolve => setTimeout(() => resolve(startWorker(attempt)), delayMs));
}

await startWorker();
