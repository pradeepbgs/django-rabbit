import amqp, { type Channel, type Connection } from 'amqplib'


const amqbHost = process.env.AMQBHOST ?? "amqp://localhost"
const LOGS_QUEUE =  process.env.LOGS_QUEUE ??'request-logs'

let channel:Channel | null
let connection: Connection | null = null;

async function connectRabbitMQ() {
    try {
        connection = await amqp.connect(amqbHost);
        channel = await connection.createChannel();
        await channel.assertQueue(LOGS_QUEUE, { durable: true });
    } catch (error) {
        console.error("Error consuming messages:", error);
    }
}


async function sendToQueue(queue:string, data:object) {
    if (!channel) {
        console.log("⏳ Connecting to RabbitMQ...");
        await connectRabbitMQ();
    }

    if (!channel) {
        console.error("❌ Failed to connect to RabbitMQ. Message not sent.");
        return;
    }

    if (!data) {
        console.log("⚠ No data to send to queue");
        return;
    }

    try {
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), { persistent: true });
        console.log(`✅ Message sent to queue: ${queue}`);
    } catch (error) {
        console.error(`❌ Error sending message to queue: ${queue}`, error);
    }
}


export const publishLogsToQueue = (data:object) => sendToQueue(LOGS_QUEUE,data)