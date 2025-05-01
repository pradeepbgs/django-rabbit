import amqplib, { type Channel, type Connection } from 'amqplib';
import { db } from '../db/connection';
import { RequestLogs } from '../db/schema';
import { app } from '..';

const amqbHost = process.env.AMQBHOST || 'amqp://localhost'
const QUEUE_NAME = process.env.LOGS_QUEUE || 'request-logs'

let connection: Connection | null
let channel: Channel | null
let logsBuffer: Array<any> = [];
const BULK_INSERT_THRESHOLD = 10;
let isInserting = false;

export default async function startConsuming() {
    try {
        await connectRabbitMQ()
        console.log(`[*] Waiting for messages in ${QUEUE_NAME}. To exit press CTRL+C`);

        channel?.consume(QUEUE_NAME, async (msg) => {
            if (!msg) return;

            const logData = JSON.parse(msg.content.toString());
            
            logsBuffer.push({
                method: logData.method,
                path: logData.path,
                headers: JSON.stringify(logData.headers),
                status: logData.status,
                timestamp: logData.timestamp,
              });

            if (!isInserting && logsBuffer.length >= BULK_INSERT_THRESHOLD) {
                isInserting = true;
                await save_logs_bulk();
            }

            channel?.ack(msg);

        }, { noAck: false });

    } catch (error) {
        console.error('Error in consuming messages:', error);
        reconnect();
    }
}


async function connectRabbitMQ() {
    try {
        connection = await amqplib.connect(amqbHost);
        channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });

        connection.on('error', (err) => {
            console.error('AMQP Connection error:', err.message);
            reconnect();
        });

        connection.on('close', () => {
            console.warn('AMQP connection closed, attempting to reconnect...');
            reconnect();
        });
    } catch (err) {
        console.error('Error connecting to RabbitMQ:', err);
        setTimeout(connectRabbitMQ, 5000);
    }
}


async function save_logs_bulk() {
    if (logsBuffer.length == 0) return;
    const logsToInsert = logsBuffer.splice(0, BULK_INSERT_THRESHOLD)
    try {
        await db.insert(RequestLogs).values(logsToInsert)
        console.log(`Inserted ${logsToInsert.length} logs into DB`);
    } catch (error) {
        console.error("Error inserting logs:", error);
    } finally {
        isInserting = false;
        if (logsBuffer.length > BULK_INSERT_THRESHOLD) {
            await save_logs_bulk()
        }
    }
}

function reconnect() {
    if(connection)
        connection.close();

    setTimeout(connectRabbitMQ, 5000);
}

async function shutdown() {
    console.log('Shutting down...');
    if (logsBuffer.length > 0) {
        console.log(`Inserting remaining ${logsBuffer.length} logs into DB`);
        await save_logs_bulk();
    }
    if (connection) {
        connection.close();
    }
    app.close()
    process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    shutdown();
});