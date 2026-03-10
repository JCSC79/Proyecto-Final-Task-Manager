import amqp from 'amqplib';
import type { Channel } from 'amqplib';

/**
 * Service to handle asynchronous messaging with RabbitMQ.
 * Implements a producer pattern to notify other services about task events.
 */
class MessagingService {
    private channel?: Channel;
    private readonly queue = 'task_notifications';

    /**
     * Initializes the connection and creates a persistent communication channel.
     * Uses type narrowing to safely access the connection methods.
     */
    async init(): Promise<void> {
        try {
            // 1. Establish connection to the broker using custom credentials
            const connection = await amqp.connect('amqp://JC:abc123..@localhost:5672');
            
            // 2. Technical workaround: Use "duck typing" to verify if createChannel exists.
            // This avoids library type conflicts while respecting the "no-any" policy.
            if ('createChannel' in connection) {
                // Cast only for the method call to maintain type safety
                this.channel = await (connection as { createChannel: () => Promise<Channel> }).createChannel();
            }
            
            if (this.channel) {
                // Ensure the queue is durable (persists broker restarts)
                await this.channel.assertQueue(this.queue, { durable: true });
                console.log(`[*] Connected to RabbitMQ. Queue ready: ${this.queue}`);
            }
        } catch (error) {
            console.error('[-] RabbitMQ Connection Error:', error);
        }
    }

    /**
     * Publishes a message to the task queue.
     * @param taskData - The object to be sent as the message payload.
     */
    async sendTaskNotification(taskData: object): Promise<void> {
        // Guard clause to ensure the service is properly initialized
        if (!this.channel) {
            console.error('[-] Messaging channel not initialized.');
            return;
        }
        
        const payload = JSON.stringify(taskData);
        
        // Convert to Buffer and send with persistence enabled
        this.channel.sendToQueue(this.queue, Buffer.from(payload), {
            persistent: true 
        });
        
        console.log(` [x] Sent to RabbitMQ: ${payload}`);
    }
}

// Export a singleton instance of the service
export const messagingService = new MessagingService();