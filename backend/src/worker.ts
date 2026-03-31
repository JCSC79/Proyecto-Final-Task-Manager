import 'dotenv/config';
import amqp from 'amqplib';
import type { Channel, ConsumeMessage } from 'amqplib';
import type { ITask } from './models/task.model.ts';

/**
 * Worker Service: Consumes messages from RabbitMQ.
 * Independent process that handles background task processing.
 */
async function startWorker() {
    try {
        // 1. Connection to the broker
        const rabbitmqUrl = process.env.RABBITMQ_URL;
        if (!rabbitmqUrl) {
            throw new Error('RABBITMQ_URL environment variable is required');
        }
        const connection = await amqp.connect(rabbitmqUrl);
        
        // 2. Type narrowing for the channel (duck typing)
        let channel: Channel | undefined;
        if ('createChannel' in connection) {
            channel = await (connection as { createChannel: () => Promise<Channel> }).createChannel();
        }

        if (!channel) {
            throw new Error('Could not create RabbitMQ channel');
        }

        const queue = 'task_notifications';

        // 3. Ensure the queue exists
        await channel.assertQueue(queue, { durable: true });

        // 4. Set Prefetch: Fair dispatch (one message at a time)
        await channel.prefetch(1);

        console.log(`[*] Worker waiting for messages in ${queue}. To exit press CTRL+C`);

        // 5. Consume logic with internal safety
        channel.consume(queue, (msg: ConsumeMessage | null) => {
            if (msg && channel) {
                try {
                    const content = msg.content.toString();
                    const task: ITask = JSON.parse(content);

                    console.log('--------------------------------------------');
                    console.log(`[v] Received Task: ${task.title}`);
                    console.log(`[i] Status: ${task.status}`);
                    console.log(`[i] ID: ${task.id}`);
                    console.log('--------------------------------------------');

                    // Acknowledge the message only if processing succeeds
                    channel.ack(msg);
                } catch (parseError) {
                    console.error('[-] Error parsing worker message:', parseError);
                    // Negative acknowledgment: Don't requeue a corrupt message
                    channel.nack(msg, false, false);
                }
            }
        }, { noAck: false });

    } catch (error) {
        console.error('[-] Worker connection error:', error);
    }
}

// Start the consumer
startWorker();