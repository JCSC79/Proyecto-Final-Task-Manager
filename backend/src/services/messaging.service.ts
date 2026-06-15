import amqp from 'amqplib';
import type { Channel } from 'amqplib';
import type { TaskNotificationPayload, NotificationEventType } from '../models/notification.model.ts';

/**
 * Service to handle asynchronous messaging with RabbitMQ.
 * Implements a producer pattern to notify other services about task events.
 */
class MessagingService {
    private channel?: Channel;
    private readonly queue = 'task_notifications';

    /**
     * Initializes the connection and creates a persistent communication channel.
     * Uses type narrowing to safely access connection methods (duck typing).
     */
    async init(): Promise<void> {
        try {
            const rabbitmqUrl = process.env.RABBITMQ_URL;
            if (!rabbitmqUrl) {
                throw new Error('RABBITMQ_URL environment variable is required');
            }
            const connection = await amqp.connect(rabbitmqUrl);
            
            // Technical workaround for library type conflicts while respecting the "no-any" policy.
            if ('createChannel' in connection) {
                this.channel = await (connection as { createChannel: () => Promise<Channel> }).createChannel();
            }
            
            if (this.channel) {
                // Ensure the queue is durable (survives broker restarts)
                await this.channel.assertQueue(this.queue, { durable: true });
                console.log(`[*] Connected to RabbitMQ. Queue ready: ${this.queue}`);
            }
        } catch (error) {
            console.error('[-] RabbitMQ Connection Error:', error);
        }
    }

    /**
     * Publishes a task notification to the queue.
     * @param taskData - The task record.
     * @param recipientEmail - Email address of the user to notify.
     * @param eventType - What triggered the notification.
     */
    async sendTaskNotification(taskData: TaskNotificationPayload['task'], recipientEmail: string, eventType: NotificationEventType = 'TASK_CREATED'): Promise<void> {
        if (!this.channel) {
            console.error('[-] Messaging channel not initialized.');
            return;
        }

        const payload: TaskNotificationPayload = { task: taskData, recipientEmail, eventType };
        const message = JSON.stringify(payload);

        // Convert to Buffer and send with persistence enabled for reliability
        this.channel.sendToQueue(this.queue, Buffer.from(message), {
            persistent: true 
        });

        console.log(` [x] Sent to RabbitMQ: ${taskData.title} (${eventType} -> ${recipientEmail})`);
    }
}

export const messagingService = new MessagingService();