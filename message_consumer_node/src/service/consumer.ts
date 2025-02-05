import amqb from 'amqplib/callback_api'
import { db } from '../db/connection';
import { RequestLogs } from '../db/schema';
import { app } from '..';

const amqbHost = process.env.AMQBHOST || ''
const QUEUE_NAME =  process.env.QUEUE_NAME ||''

let connection : amqb.Connection | null
let logsBuffer: Array<any> = [];
const BULK_INSERT_THRESHOLD = 10;
let isInserting = false;

export default function startConsuming(){
    amqb.connect(amqbHost, (err , conn) => {
        if(err)throw err
        connection = conn
        conn.createChannel((err, channel) => {
            if(err)throw err

            channel.assertQueue(QUEUE_NAME, {
                durable: true
            })

            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", QUEUE_NAME);

            channel.consume(QUEUE_NAME, async (msg) => {
                if(!msg) return;

                const logData = JSON.parse(msg?.content.toString())

                logsBuffer.push({
                    method: logData.method,
                    path: logData.path,
                    headers: JSON.stringify(logData.headers),
                    body: logData.body,
                    response_status: logData.response_status,
                    response_body: logData.response_body,
                    timestamp: logData.timestamp,
                })

                if(logsBuffer.length == BULK_INSERT_THRESHOLD && !isInserting){
                    isInserting = true;
                    await save_logs_bulk();
                }
                    channel.ack(msg)
              }, {
                  noAck: false
              });
        })

    })
}


async function save_logs_bulk() {
    if(logsBuffer.length == 0) return;
    const logsToInsert = logsBuffer.slice(0,BULK_INSERT_THRESHOLD)
    try {
        await db.insert(RequestLogs).values(logsToInsert)
        console.log(`✅ Inserted ${logsBuffer.length} logs into DB`);
        logsBuffer = logsBuffer.slice(BULK_INSERT_THRESHOLD)
    } catch (error) {
        console.error("❌ Error inserting logs:", error);
    } finally{
        isInserting = false;
        if(logsBuffer.length > BULK_INSERT_THRESHOLD){
            await save_logs_bulk()
        }
    }
}

async function shutdown() {
    console.log('Shutting down...');
    if(logsBuffer.length > 0){
        console.log(`Inserting remaining ${logsBuffer.length} logs into DB`);
        await save_logs_bulk();
    }
    if(connection){
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