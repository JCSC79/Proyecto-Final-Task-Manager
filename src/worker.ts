import amqp from 'amqplib';
import type { Channel, ConsumeMessage } from 'amqplib';

/**
 * Worker Service: Consumes messages from RabbitMQ.
 * This runs as an independent process from the main API.
 */
async function startWorker() {
    try {
        // 1. Connection to the broker
        const connection = await amqp.connect('amqp://JC:abc123..@localhost:5672');
        
        // 2. Type narrowing for the channel
        let channel: Channel | undefined;
        if ('createChannel' in connection) {
            channel = await (connection as { createChannel: () => Promise<Channel> }).createChannel();
        }

        if (!channel) {
            throw new Error('Could not create RabbitMQ channel');
        }

        const queue = 'task_notifications';

        // 3. Ensure the queue exists (in case the worker starts before the server)
        await channel.assertQueue(queue, { durable: true });

        // 4. Set Prefetch: Only process one message at a time
        await channel.prefetch(1);

        console.log(`[*] Worker waiting for messages in ${queue}. To exit press CTRL+C`);

        // 5. Consume logic
        channel.consume(queue, (msg: ConsumeMessage | null) => {
            if (msg) {
                const content = msg.content.toString();
                const task = JSON.parse(content);

                console.log('--------------------------------------------');
                console.log(`[v] Received Task: ${task.title}`);
                console.log(`[i] Description: ${task.description}`);
                console.log(`[i] ID: ${task.id}`);
                console.log('--------------------------------------------');

                // Acknowledge the message (removes it from the queue)
                channel?.ack(msg);
            }
        }, { noAck: false }); // manual acknowledgment for safety

    } catch (error) {
        console.error('[-] Worker Error:', error);
    }
}

// Start the consumer
startWorker();