import amqp from 'amqplib';
import type { Channel } from 'amqplib';
import type { ITask } from '../models/task.model.ts';

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
            const connection = await amqp.connect('amqp://JC:abc123..@localhost:5672');
            
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
     * @param {ITask} taskData - The specific task record to be notified.
     */
    async sendTaskNotification(taskData: ITask): Promise<void> {
        if (!this.channel) {
            console.error('[-] Messaging channel not initialized.');
            return;
        }
        
        const payload = JSON.stringify(taskData);
        
        // Convert to Buffer and send with persistence enabled for reliability
        this.channel.sendToQueue(this.queue, Buffer.from(payload), {
            persistent: true 
        });
        
        console.log(` [x] Sent to RabbitMQ: ${taskData.title}`);
    }
}

export const messagingService = new MessagingService();