import amqb from 'amqplib/callback_api'
import { db } from '../db/connection';
import { RequestLogs } from '../db/schema';

const amqbHost = process.env.AMQBHOST || 'amqp://localhost'
const QUEUE_NAME =  process.env.QUEUE_NAME ||'request_logs'

let logsBuffer: Array<any> = [];
const BULK_INSERT_THRESHOLD = 10;

export default function startConsuming(){
    amqb.connect(amqbHost, (err , connection) => {
        if(err)throw err

        connection.createChannel((err, channel) => {
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

                if(logsBuffer.length >= BULK_INSERT_THRESHOLD)
                    await save_logs_bulk();

                channel.ack(msg)
              }, {
                  noAck: false
              });
        })

    })
}


async function save_logs_bulk() {
    if(logsBuffer.length == 0) return;

    try {
        await db.insert(RequestLogs).values(logsBuffer)
        console.log(`✅ Inserted ${logsBuffer.length} logs into DB`);
        logsBuffer=[]
    } catch (error) {
        console.error("❌ Error inserting logs:", error);
    } 
}