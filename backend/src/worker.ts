import 'dotenv/config';
import amqp from 'amqplib';
import type { Channel, ConsumeMessage } from 'amqplib';
import type { NotificationMessage } from './models/notification.model.ts';
import type { IAuditLogEvent } from './models/audit.model.ts';
import { emailService } from './services/email.service.ts';
import { auditDAO } from './daos/audit.dao.ts';

const QUEUE = 'task_notifications';
const AUDIT_QUEUE = 'audit_events';
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

        // Initialize email service before consuming messages
        await emailService.init();

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
        await channel.assertQueue(AUDIT_QUEUE, { durable: true });
        await channel.prefetch(1);

        console.log(`[*] Worker waiting for messages in ${QUEUE} and ${AUDIT_QUEUE}. To exit press CTRL+C`);

        channel.consume(QUEUE, (msg: ConsumeMessage | null) => {
            if (msg && channel) {
                void (async () => {
                    try {
                        const content = msg.content.toString();
                        const message: NotificationMessage = JSON.parse(content);

                        if (message.type === 'PROJECT') {
                            // Project membership notification
                            const payload = message;
                            console.log('--------------------------------------------');
                            console.log(`[v] MEMBER_ADDED -> "${payload.projectName}"`);
                            console.log(`[i] Recipient: ${payload.recipientEmail}`);
                            console.log('--------------------------------------------');
                            await emailService.sendMemberNotification(payload);
                        } else {
                            // Task event notification (TASK_CREATED / TASK_COMPLETED / TASK_UPDATED)
                            const payload = message;
                            const { task, recipientEmail, eventType } = payload;
                            console.log('--------------------------------------------');
                            console.log(`[v] Received: ${eventType} -> ${task.title}`);
                            console.log(`[i] Recipient: ${recipientEmail}`);
                            console.log(`[i] Status: ${task.status}`);
                            console.log('--------------------------------------------');
                            await emailService.sendTaskNotification(payload);
                        }

                        channel.ack(msg);
                    } catch (parseError) {
                        console.error('[-] Error processing worker message:', parseError);
                        channel.nack(msg, false, false);
                    }
                })();
            }
        }, { noAck: false });

        // Audit events consumer 
        channel.consume(AUDIT_QUEUE, (msg: ConsumeMessage | null) => {
            if (msg && channel) {
                void (async () => {
                    try {
                        const event: IAuditLogEvent = JSON.parse(msg.content.toString());
                        await auditDAO.insert(event);
                        console.log(`[v] Audit persisted: ${event.action} on task ${event.taskId}`);
                        channel.ack(msg);
                    } catch (err) {
                        console.error('[-] Error persisting audit event:', err);
                        channel.nack(msg, false, false);
                    }
                })();
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
